// Unified tracking API — /api/track?type=visit|use
import { isDbConfigured } from "../lib/db.js";
import { trackVisit, trackToolUse } from "../lib/repo.js";
export const config = { runtime: "nodejs" };
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isDbConfigured()) return res.status(200).json({ ok: true, fallback: true });
  try {
    const b = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const type = req.query.type || "visit";
    if (type === "use") await trackToolUse({ toolId: b.toolId, toolTitle: b.toolTitle, visitorId: b.visitorId, action: b.action });
    else await trackVisit({ visitorId: b.visitorId, pagePath: b.pagePath, referrer: b.referrer });
    res.status(200).json({ ok: true });
  } catch (e) { res.status(200).json({ ok: true, error: e.message }); }
}
