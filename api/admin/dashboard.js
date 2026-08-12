// GET /api/admin/dashboard — admin analytics summary (requires session cookie)
import { isDbConfigured } from "../../lib/db.js";
import { getDashboardStats } from "../../lib/repo.js";

export const config = { runtime: "nodejs" };

function isAuthed(req) {
  const secret = process.env.ADMIN_SECRET || "dev-secret-change-me";
  const cookie = (req.headers.cookie || "").split(";").map((c) => c.trim());
  const token = cookie.find((c) => c.startsWith("ych_admin="))?.split("=")[1];
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const [username, ts] = decoded.split(":");
    if (!username || !ts) return false;
    return decoded.endsWith(":" + secret);
  } catch { return false; }
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!isDbConfigured()) return res.status(503).json({ error: "Database not configured" });
  if (!isAuthed(req)) return res.status(401).json({ error: "Unauthorized" });
  try {
    const stats = await getDashboardStats();
    res.status(200).json(stats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
