// GET / POST /api/admin/notifications — admin notification center
// GET: list history; POST: create & send/schedule a notification
import { isDbConfigured } from "../../lib/db.js";
import {
  listNotifications,
  createNotification,
  getNotifSettings,
  listPushSubs,
  notifExists,
  updateNotificationStatus,
} from "../../lib/repo.js";
import { isPushConfigured, setupWebPush, webpush } from "../../lib/push.js";

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
      const list = await listNotifications(100);
      return res.status(200).json(list);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});

      // Duplicate prevention via eventId
      if (body.eventId && await notifExists(body.eventId)) {
        return res.status(200).json({ ok: false, duplicate: true, message: "This event was already notified." });
      }

      // If scheduling for the future, just store as scheduled (a cron/trigger would fire it).
      const scheduled = body.scheduleAt && new Date(body.scheduleAt) > new Date();

      const id = await createNotification({
        title: body.title || "Notification",
        message: body.message || "",
        icon: body.icon || "",
        image: body.image || "",
        url: body.url || "/",
        target: body.target || "all",
        status: scheduled ? "scheduled" : "draft",
        eventId: body.eventId,
        scheduleAt: scheduled ? body.scheduleAt : null,
      });

      if (scheduled) {
        return res.status(200).json({ ok: true, id, status: "scheduled", message: "Notification scheduled." });
      }

      // Send now
      const result = await sendToSubscribers(body);
      await updateNotificationStatus(id, result.sent ? "sent" : "failed", result.sentCount);
      return res.status(200).json({ ok: true, id, ...result });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}

// ---- Broadcast to subscribers ----
async function sendToSubscribers(n) {
  if (!isPushConfigured() || !setupWebPush()) {
    return { sent: false, sentCount: 0, message: "Web Push not configured (VAPID keys missing)." };
  }
  const subs = await listPushSubs();
  const payload = JSON.stringify({
    title: n.title,
    body: n.message,
    icon: n.icon || "/icons/icon-192.png",
    image: n.image || "",
    url: n.url || "/",
    tag: n.eventId || undefined,
  });

  let sentCount = 0;
  const results = await Promise.allSettled(
    subs.map((s) => {
      const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
      return webpush.sendNotification(sub, payload).then(() => sentCount++).catch((err) => {
        // 404/410 = subscription gone; we could prune here.
        return { error: err.statusCode };
      });
    })
  );
  return { sent: true, sentCount, total: subs.length };
}
