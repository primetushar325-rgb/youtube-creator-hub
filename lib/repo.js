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
