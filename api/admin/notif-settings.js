// GET / POST /api/admin/notif-settings — admin notification settings
import { isDbConfigured } from "../../lib/db.js";
import { getNotifSettings, updateNotifSettings } from "../../lib/repo.js";

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
      return res.status(200).json(await getNotifSettings());
    }
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
      const bool = (k) => (body[k] === undefined ? undefined : body[k] ? 1 : 0);
      await updateNotifSettings({
        global_enabled: bool("global_enabled"),
        new_videos: bool("new_videos"),
        new_tools: bool("new_tools"),
        new_templates: bool("new_templates"),
        new_updates: bool("new_updates"),
        announcements: bool("announcements"),
        sound: bool("sound"),
        default_icon: body.default_icon,
        default_url: body.default_url,
      });
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
