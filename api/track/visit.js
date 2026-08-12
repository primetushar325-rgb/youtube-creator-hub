// POST /api/track/visit — record a page visit
import { isDbConfigured } from "../../lib/db.js";
import { trackVisit } from "../../lib/repo.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isDbConfigured()) return res.status(200).json({ ok: true, fallback: true });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    await trackVisit({
      visitorId: body.visitorId || "",
      pagePath: body.pagePath || "",
      referrer: body.referrer || "",
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: true, error: e.message }); // never break the site
  }
}
