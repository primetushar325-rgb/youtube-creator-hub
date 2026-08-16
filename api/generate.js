// ============================================================
// /api/generate — serverless AI proxy
// PRIMARY: Groq (llama-3.3-70b for quality, llama-3.1-8b for light tasks)
// FALLBACK: Google Gemini (gemini-2.0-flash) on ANY Groq failure
// Reads keys from process.env server-side ONLY.
// Streams plain-text deltas to the browser.
//
// Error contract (never a silent/fake success):
//   200 stream  -> real model output
//   400         -> { error, code:"BAD_INPUT" }
//   503         -> { error, code:"NO_PROVIDER" }   (no key configured)
//   502         -> { error, code:"UPSTREAM" }      (all providers failed)
// ============================================================
export const config = { runtime: "nodejs" };

const env = (k) => (process.env[k] || "").trim();
const MAX_PROMPT_CHARS = 24000;
const UPSTREAM_TIMEOUT_MS = 60000;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: "Invalid JSON", code: "BAD_INPUT" }); }

  const prompt = (body.prompt || "").trim();
  const fast = !!body.fast; // use lightweight model for quick tasks
  if (!prompt) return res.status(400).json({ error: "No prompt provided.", code: "BAD_INPUT" });
  if (prompt.length > MAX_PROMPT_CHARS) return res.status(400).json({ error: "Input too long — shorten it and try again.", code: "BAD_INPUT" });

  const groqKey = env("GROQ_API_KEY");
  const geminiKey = env("GEMINI_API_KEY");
  if (!groqKey && !geminiKey) {
    return res.status(503).json({
      error: "AI is not configured on the server (no GROQ_API_KEY or GEMINI_API_KEY set).",
      code: "NO_PROVIDER"
    });
  }

  const errors = [];

  // Try Groq first (primary)
  if (groqKey) {
    try { return await streamGroq(res, prompt, groqKey, fast); }
    catch (e) {
      // If we already started streaming, we cannot switch provider or status.
      if (res.headersSent) { try { res.end(); } catch {} return; }
      errors.push("Groq: " + (e.message || "unknown error"));
      console.error("[/api/generate] Groq failed:", e.message);
      // fall through to Gemini on ANY Groq failure (not just 429)
    }
  }

  // Gemini fallback (or primary if no Groq key)
  if (geminiKey) {
    try { return await streamGemini(res, prompt, geminiKey); }
    catch (e) {
      if (res.headersSent) { try { res.end(); } catch {} return; }
      errors.push("Gemini: " + (e.message || "unknown error"));
      console.error("[/api/generate] Gemini failed:", e.message);
    }
  }

  return res.status(502).json({
    error: "The AI provider could not complete the request. " + (errors.join(" | ") || "No provider available."),
    code: "UPSTREAM"
  });
}

function withTimeout() {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), UPSTREAM_TIMEOUT_MS);
  return { signal: ac.signal, clear: () => clearTimeout(t) };
}

async function streamGroq(res, prompt, key, fast) {
  const model = fast ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile";
  const tm = withTimeout();
  let up;
  try {
    up = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], stream: true, temperature: 0.7 }),
      signal: tm.signal
    });
  } finally { tm.clear(); }
  if (!up.ok) {
    const t = await up.text().catch(() => "");
    throw new Error("HTTP " + up.status + " " + t.slice(0, 200));
  }
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
  const reader = up.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
      if (!line.startsWith("data: ")) continue;
      line = line.slice(6).trim();
      if (line === "[DONE]") continue;
      try { const j = JSON.parse(line); const t = j.choices?.[0]?.delta?.content || ""; if (t) res.write(t); } catch {}
    }
  }
  res.end();
}

async function streamGemini(res, prompt, key) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=" + key;
  const tm = withTimeout();
  let up;
  try {
    up = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: tm.signal
    });
  } finally { tm.clear(); }
  if (!up.ok) { const t = await up.text().catch(() => ""); throw new Error("HTTP " + up.status + " " + t.slice(0, 200)); }
  res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" });
  const reader = up.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx).trim(); buf = buf.slice(idx + 1);
      if (line.startsWith("data: ")) line = line.slice(6);
      if (!line || line === "[DONE]") continue;
      try { const j = JSON.parse(line); const t = j.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || ""; if (t) res.write(t); } catch {}
    }
  }
  res.end();
}
