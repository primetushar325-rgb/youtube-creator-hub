// POST /api/push/prefs — update a user's notification preferences
import { isDbConfigured } from "../../lib/db.js";
import { updatePushPrefs } from "../../lib/repo.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isDbConfigured()) return res.status(200).json({ ok: true, fallback: true });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    if (body.endpoint) {
      await updatePushPrefs(body.endpoint, body.prefs);
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: true, error: e.message });
  }
}
