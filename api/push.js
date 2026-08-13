// Unified push API — /api/push?type=vapid-public|subscribe|prefs
import { isDbConfigured } from "../lib/db.js";
import { savePushSub, updatePushPrefs } from "../lib/repo.js";
export const config = { runtime: "nodejs" };
export default async function handler(req, res) {
  const type = req.query.type || "vapid-public";
  if (type === "vapid-public") return res.status(200).json({ key: process.env.VAPID_PUBLIC_KEY || "" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isDbConfigured()) return res.status(200).json({ ok: true, fallback: true });
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    if (type === "subscribe") await savePushSub({ subscription: b.subscription, prefs: b.prefs, device: b.device });
    else if (type === "prefs" && b.endpoint) await updatePushPrefs(b.endpoint, b.prefs);
    res.status(200).json({ ok: true });
  } catch (e) { res.status(200).json({ ok: true, error: e.message }); }
}
