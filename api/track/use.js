// POST /api/track/use — record a tool usage (open or generate)
import { isDbConfigured } from "../../lib/db.js";
import { trackToolUse } from "../../lib/repo.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isDbConfigured()) return res.status(200).json({ ok: true, fallback: true });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    await trackToolUse({
      toolId: body.toolId || "",
      toolTitle: body.toolTitle || "",
      visitorId: body.visitorId || "",
      action: body.action || "generate",
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: true, error: e.message });
  }
}
