// ============================================================
// /api/transcribe — Speech-to-Text via Groq Whisper
// Handles multipart file upload and forwards to Groq
// (whisper-large-v3). Returns { text }.
// Requires GROQ_API_KEY server-side.
// ============================================================
export const config = { runtime: "nodejs", api: { bodyParser: false } };

const env = (k) => (process.env[k] || "").trim();

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const key = env("GROQ_API_KEY");
  if (!key) return res.status(200).json({ fallback: true });

  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks);
    const boundary = (req.headers["content-type"] || "").split("boundary=")[1];
    if (!boundary) return res.status(400).json({ error: "Missing boundary" });
    const ct = "multipart/form-data; boundary=" + boundary;

    const up = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": ct },
      body: raw
    });
    const data = await up.json().catch(()=>({}));
    if (!up.ok) return res.status(502).json({ error: data.error?.message || "Transcription failed" });
    return res.status(200).json({ text: data.text || "" });
  } catch (e) {
    return res.status(500).json({ error: e.message || "Transcription error" });
  }
}
