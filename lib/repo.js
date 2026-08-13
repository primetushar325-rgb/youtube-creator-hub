// ============================================================
// Repository — analytics + admin data queries for Creator Hub
// ============================================================
import { query, execute } from "./db.js";

// ---------- Visits ----------
export async function trackVisit({ visitorId, pagePath, referrer }) {
  const meta = await execute(
    "INSERT INTO visits (visitor_id, page_path, referrer) VALUES (?, ?, ?)",
    [visitorId || "", pagePath || "", referrer || ""]
  );
  return meta.last_row_id ?? 0;
}

// ---------- Tool usage ----------
export async function trackToolUse({ toolId, toolTitle, visitorId, action }) {
  const meta = await execute(
    "INSERT INTO tool_usage (tool_id, tool_title, visitor_id, action) VALUES (?, ?, ?, ?)",
    [toolId || "", toolTitle || "", visitorId || "", action || "generate"]
  );
  return meta.last_row_id ?? 0;
}

// ---------- Tracked channels ----------
export async function addChannel(name) {
  const existing = await query(
    "SELECT id FROM tracked_channels WHERE name = ? LIMIT 1",
    [name]
  );
  if (existing.length) return existing[0].id;
  const meta = await execute(
    "INSERT INTO tracked_channels (name) VALUES (?)",
    [name]
  );
  return meta.last_row_id ?? 0;
}
export async function listChannels() {
  return query("SELECT * FROM tracked_channels ORDER BY created_at DESC");
}
export async function removeChannel(id) {
  return execute("DELETE FROM tracked_channels WHERE id = ?", [id]);
}

// ---------- Saved trends / watchlist ----------
export async function saveTrend({ type, value }) {
  const existing = await query(
    "SELECT id FROM saved_trends WHERE item_type = ? AND value = ? LIMIT 1",
    [type, value]
  );
  if (existing.length) return existing[0].id;
  const meta = await execute(
    "INSERT INTO saved_trends (item_type, value) VALUES (?, ?)",
    [type, value]
  );
  return meta.last_row_id ?? 0;
}
export async function listTrends() {
  return query("SELECT * FROM saved_trends ORDER BY created_at DESC");
}
export async function removeTrend(id) {
  return execute("DELETE FROM saved_trends WHERE id = ?", [id]);
}

// ---------- Admin dashboard summary ----------
export async function getDashboardStats() {
  const today = new Date().toISOString().slice(0, 10);
  const [
    totalVisits,
    uniqueVisitors,
    todayVisits,
    totalToolUses,
    topTools,
    recentDays,
  ] = await Promise.all([
    query("SELECT COUNT(*) AS c FROM visits"),
    query("SELECT COUNT(DISTINCT visitor_id) AS c FROM visits WHERE visitor_id != ''"),
    query("SELECT COUNT(*) AS c FROM visits WHERE created_at >= ?", [`${today} 00:00:00`]),
    query("SELECT COUNT(*) AS c FROM tool_usage"),
    query(
      `SELECT tool_id, tool_title, COUNT(*) AS c FROM tool_usage
       GROUP BY tool_id, tool_title ORDER BY c DESC LIMIT 10`
    ),
    query(
      `SELECT substr(created_at,1,10) AS date, COUNT(*) AS c FROM visits
       GROUP BY date ORDER BY date DESC LIMIT 14`
    ),
  ]);

  return {
    totalVisits: totalVisits[0]?.c ?? 0,
    uniqueVisitors: uniqueVisitors[0]?.c ?? 0,
    todayVisits: todayVisits[0]?.c ?? 0,
    totalToolUses: totalToolUses[0]?.c ?? 0,
    topTools: topTools.map((r) => ({
      toolId: r.tool_id,
      toolTitle: r.tool_title,
      count: r.c,
    })),
    recentDays: recentDays.map((r) => ({ date: r.date, count: r.c })),
  };
}

// ---------- Admins ----------
export async function getAdminByUsername(username) {
  const rows = await query("SELECT * FROM admins WHERE username = ? LIMIT 1", [
    username,
  ]);
  return rows[0] || null;
}
export async function createAdmin(username, passwordHash) {
  const meta = await execute(
    "INSERT INTO admins (username, password_hash) VALUES (?, ?)",
    [username, passwordHash]
  );
  return meta.last_row_id ?? 0;
}

// ---------- Push subscriptions ----------
export async function savePushSub({ subscription, prefs, device }) {
  const { endpoint, keys = {} } = subscription || {};
  if (!endpoint || !keys.p256dh || !keys.auth) throw new Error("Invalid subscription");
  await execute(
    `INSERT INTO push_subs (endpoint, p256dh, auth, prefs, device, last_active)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(endpoint) DO UPDATE SET prefs=excluded.prefs, device=excluded.device, last_active=datetime('now')`,
    [endpoint, keys.p256dh, keys.auth, JSON.stringify(prefs || {}), JSON.stringify(device || "")]
  );
}
export async function listPushSubs() {
  return query("SELECT * FROM push_subs ORDER BY created_at DESC");
}
export async function updatePushPrefs(endpoint, prefs) {
  await execute(
    "UPDATE push_subs SET prefs = ?, last_active = datetime('now') WHERE endpoint = ?",
    [JSON.stringify(prefs || {}), endpoint]
  );
}

// ---------- Notifications ----------
export async function createNotification(input) {
  const meta = await execute(
    `INSERT INTO notifications (title, message, icon, image, url, target, status, event_id, schedule_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.title || "Notification",
      input.message || "",
      input.icon || "",
      input.image || "",
      input.url || "/",
      input.target || "all",
      input.status || "sent",
      input.eventId || null,
      input.scheduleAt || null,
    ]
  );
  return meta.last_row_id ?? 0;
}
export async function listNotifications(limit = 50) {
  return query("SELECT * FROM notifications ORDER BY id DESC LIMIT ?", [limit]);
}
export async function getNotification(id) {
  const rows = await query("SELECT * FROM notifications WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}
export async function notifExists(eventId) {
  if (!eventId) return false;
  const rows = await query("SELECT id FROM notifications WHERE event_id = ? LIMIT 1", [eventId]);
  return rows.length > 0;
}
export async function updateNotificationStatus(id, status, sentCount) {
  await execute(
    "UPDATE notifications SET status = ?, sent_count = ?, sent_at = datetime('now') WHERE id = ?",
    [status, sentCount || 0, id]
  );
}

// ---------- Notification settings ----------
export async function getNotifSettings() {
  const rows = await query("SELECT * FROM notif_settings WHERE id = 1");
  if (!rows.length) return { id: 1, global_enabled: 1, new_videos: 1, new_tools: 1, new_templates: 1, new_updates: 1, announcements: 1, sound: 1, default_icon: "/icons/icon-192.png", default_url: "/" };
  return rows[0];
}
export async function updateNotifSettings(input) {
  const allowed = ["global_enabled", "new_videos", "new_tools", "new_templates", "new_updates", "announcements", "sound", "default_icon", "default_url"];
  const fields = [], params = [];
  for (const k of allowed) {
    if (input[k] !== undefined) { fields.push(`${k} = ?`); params.push(input[k]); }
  }
  if (!fields.length) return;
  await execute(`UPDATE notif_settings SET ${fields.join(", ")} WHERE id = 1`, params);
}
