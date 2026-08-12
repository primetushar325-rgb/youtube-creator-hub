// GET/POST/DELETE /api/admin/channels — tracked channels management
import { isDbConfigured } from "../../lib/db.js";
import { addChannel, listChannels, removeChannel } from "../../lib/repo.js";

export const config = { runtime: "nodejs" };

function isAuthed(req) {
  const secret = process.env.ADMIN_SECRET || "dev-secret-change-me";
  const token = (req.headers.cookie || "").split(";").map((c) => c.trim())
    .find((c) => c.startsWith("ych_admin="))?.split("=")[1];
  if (!token) return false;
  try { return Buffer.from(token, "base64").toString().endsWith(":" + secret); }
  catch { return false; }
}

export default async function handler(req, res) {
  if (!isDbConfigured()) return res.status(503).json({ error: "Database not configured" });
  if (!isAuthed(req)) return res.status(401).json({ error: "Unauthorized" });
  try {
    if (req.method === "GET") {
      const list = await listChannels();
      return res.status(200).json(list.map((r) => ({ id: r.id, name: r.name })));
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      if (!body.name) return res.status(400).json({ error: "name required" });
      await addChannel(body.name);
      return res.status(200).json({ ok: true });
    }
    if (req.method === "DELETE") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      await removeChannel(body.id);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
