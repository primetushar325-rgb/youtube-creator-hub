// POST /api/push/subscribe — save a push subscription
import { isDbConfigured } from "../../lib/db.js";
import { savePushSub } from "../../lib/repo.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isDbConfigured()) return res.status(200).json({ ok: true, fallback: true });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    await savePushSub({ subscription: body.subscription, prefs: body.prefs, device: body.device });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: true, error: e.message }); // never break the site
  }
}
