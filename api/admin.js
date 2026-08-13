// ============================================================
// Unified Admin API — /api/admin?action=... (reduces function count)
// actions: login | dashboard | channels | trends | notifications | notif-settings
// ============================================================
import { createHash } from "node:crypto";
import { isDbConfigured } from "../lib/db.js";
import {
  getAdminByUsername, getDashboardStats,
  addChannel, listChannels, removeChannel,
  saveTrend, listTrends, removeTrend,
  createNotification, listNotifications, getNotifSettings, updateNotifSettings,
  listPushSubs, notifExists, updateNotificationStatus,
} from "../lib/repo.js";
import { isPushConfigured, setupWebPush, webpush } from "../lib/push.js";

export const config = { runtime: "nodejs" };

const SESSION_COOKIE = "ych_admin";
const COOKIE_MAX_AGE = 60 * 60 * 12;
const hashPw = (pw) => createHash("sha256").update(pw).digest("hex");

function isAuthed(req) {
  const secret = process.env.ADMIN_SECRET || "dev-secret-change-me";
  const token = (req.headers.cookie || "").split(";").map((c) => c.trim())
    .find((c) => c.startsWith("ych_admin="))?.split("=")[1];
  if (!token) return false;
  try { return Buffer.from(token, "base64").toString().endsWith(":" + secret); }
  catch { return false; }
}
function readBody(req) { try { return typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {}); } catch { return {}; } }

export default async function handler(req, res) {
  const action = req.query.action || "dashboard";
  if (!isDbConfigured()) return res.status(503).json({ error: "Database not configured" });

  try {
    // --- login (no auth needed) ---
    if (action === "login") {
      const { username, password } = readBody(req);
      if (!username || !password) return res.status(400).json({ error: "Username and password required" });
      const admin = await getAdminByUsername(username);
      if (!admin || hashPw(password) !== admin.password_hash) return res.status(401).json({ error: "Invalid credentials" });
      const secret = process.env.ADMIN_SECRET || "dev-secret-change-me";
      const token = Buffer.from(`${username}:${Date.now()}:${secret}`).toString("base64");
      res.setHeader("Set-Cookie", `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`);
      return res.status(200).json({ ok: true, username: admin.username });
    }

    // --- everything else requires auth ---
    if (!isAuthed(req)) return res.status(401).json({ error: "Unauthorized" });

    switch (action) {
      case "dashboard": return res.status(200).json(await getDashboardStats());

      case "channels":
        if (req.method === "POST") { const { name } = readBody(req); if (!name) return res.status(400).json({ error: "name required" }); await addChannel(name); return res.status(200).json({ ok: true }); }
        if (req.method === "DELETE") { await removeChannel(readBody(req).id); return res.status(200).json({ ok: true }); }
        return res.status(200).json((await listChannels()).map((r) => ({ id: r.id, name: r.name })));

      case "trends":
        if (req.method === "DELETE") { await removeTrend(readBody(req).id); return res.status(200).json({ ok: true }); }
        return res.status(200).json((await listTrends()).map((r) => ({ id: r.id, item_type: r.item_type, value: r.value })));

      case "notif-settings":
        if (req.method === "POST") { const b = readBody(req); const bool = (k) => (b[k] === undefined ? undefined : b[k] ? 1 : 0); await updateNotifSettings({ global_enabled: bool("global_enabled"), new_videos: bool("new_videos"), new_tools: bool("new_tools"), new_templates: bool("new_templates"), new_updates: bool("new_updates"), announcements: bool("announcements"), sound: bool("sound"), default_icon: b.default_icon, default_url: b.default_url }); return res.status(200).json({ ok: true }); }
        return res.status(200).json(await getNotifSettings());

      case "notifications":
        if (req.method === "POST") return await handleSend(req, res);
        return res.status(200).json(await listNotifications(100));

      default: return res.status(404).json({ error: "Unknown action" });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message || "Error" });
  }
}

async function handleSend(req, res) {
  const n = readBody(req);
  if (n.eventId && await notifExists(n.eventId)) {
    return res.status(200).json({ ok: false, duplicate: true, message: "Already notified this event." });
  }
  const scheduled = n.scheduleAt && new Date(n.scheduleAt) > new Date();
  const id = await createNotification({
    title: n.title || "Notification", message: n.message || "", icon: n.icon || "",
    image: n.image || "", url: n.url || "/", target: n.target || "all",
    status: scheduled ? "scheduled" : "draft", eventId: n.eventId, scheduleAt: scheduled ? n.scheduleAt : null,
  });
  if (scheduled) return res.status(200).json({ ok: true, id, status: "scheduled", message: "Notification scheduled." });
  const result = await sendToSubscribers(n);
  await updateNotificationStatus(id, result.sent ? "sent" : "failed", result.sentCount);
  return res.status(200).json({ ok: true, id, ...result });
}

async function sendToSubscribers(n) {
  if (!isPushConfigured() || !setupWebPush()) return { sent: false, sentCount: 0, message: "Web Push not configured (VAPID keys missing)." };
  const subs = await listPushSubs();
  const payload = JSON.stringify({ title: n.title, body: n.message, icon: n.icon || "/icons/icon-192.png", image: n.image || "", url: n.url || "/", tag: n.eventId || undefined });
  let sentCount = 0;
  await Promise.allSettled(subs.map((s) => webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload).then(() => sentCount++).catch(() => {})));
  return { sent: true, sentCount, total: subs.length };
}
