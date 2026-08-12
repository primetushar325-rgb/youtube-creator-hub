// ============================================================
// /api/generate — serverless AI proxy
// PRIMARY: Groq (llama-3.3-70b for quality, llama-3.1-8b for light tasks)
// FALLBACK: Google Gemini (gemini-2.0-flash) on Groq 429 rate-limit
// Reads keys from process.env server-side ONLY.
// Streams plain-text deltas to the browser.
// ============================================================
export const config = { runtime: "nodejs" };

const env = (k) => (process.env[k] || "").trim();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); }
  catch { return res.status(400).json({ error: "Invalid JSON" }); }

  const prompt = (body.prompt || "").trim();
  const fast = !!body.fast; // use lightweight model for quick tasks
  if (!prompt) return res.status(400).json({ error: "No prompt" });

  const groqKey = env("GROQ_API_KEY");
  const geminiKey = env("GEMINI_API_KEY");
  if (!groqKey && !geminiKey) return res.status(200).json({ fallback: true });

  // Try Groq first
  if (groqKey) {
    try { return await streamGroq(res, prompt, groqKey, fast); }
    catch (e) {
      const isRate = /429|rate/i.test(e.message || "");
      if (!isRate || !geminiKey) return res.status(502).json({ error: e.message || "Groq error" });
      // fall through to Gemini on rate-limit
    }
  }
  if (geminiKey) {
    try { return await streamGemini(res, prompt, geminiKey); }
    catch (e) { return res.status(502).json({ error: e.message || "Gemini error" }); }
  }
  return res.status(502).json({ error: "No AI provider available" });
}

async function streamGroq(res, prompt, key, fast) {
  const model = fast ? "llama-3.1-8b-instant" : "llama-3.3-70b-versatile";
  const up = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], stream: true })
  });
  if (!up.ok) {
    const t = await up.text().catch(()=>"");
    throw new Error("Groq HTTP " + up.status + " " + t.slice(0,200));
  }
  res.writeHead(200, { "Content-Type":"text/plain; charset=utf-8", "Cache-Control":"no-cache, no-transform", "X-Accel-Buffering":"no" });
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
  const up = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  if (!up.ok) { const t = await up.text().catch(()=>""); throw new Error("Gemini HTTP " + up.status + " " + t.slice(0,200)); }
  res.writeHead(200, { "Content-Type":"text/plain; charset=utf-8", "Cache-Control":"no-cache, no-transform", "X-Accel-Buffering":"no" });
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
      try { const j = JSON.parse(line); const t = j.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("") || ""; if (t) res.write(t); } catch {}
    }
  }
  res.end();
}
