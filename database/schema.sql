-- ============================================================
-- YouTube Creator Hub — Admin & Analytics Schema (Cloudflare D1)
-- Apply with: npm run db:migrate
-- ============================================================

-- Admins (for the admin panel login)
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Page visits (per page load, with a visitor id for unique counting)
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL DEFAULT '',
  page_path TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_visits_created ON visits (created_at);
CREATE INDEX IF NOT EXISTS idx_visits_visitor ON visits (visitor_id);

-- Tool usage (each generate click / tool open)
CREATE TABLE IF NOT EXISTS tool_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_id TEXT NOT NULL,
  tool_title TEXT NOT NULL DEFAULT '',
  visitor_id TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL DEFAULT 'generate', -- 'open' | 'generate'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tool_usage_tool ON tool_usage (tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_created ON tool_usage (created_at);

-- Tracked channels (from the Viral Hashtag tool)
CREATE TABLE IF NOT EXISTS tracked_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- User saved trends / watchlist
CREATE TABLE IF NOT EXISTS saved_trends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_type TEXT NOT NULL DEFAULT 'hashtag', -- 'hashtag' | 'channel' | 'trend'
  value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Analytics history snapshot (optional daily rollup)
CREATE TABLE IF NOT EXISTS analytics_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  visits INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  tool_uses INTEGER NOT NULL DEFAULT 0
);

-- Seed default admin (username: admin, password set via setup script)
INSERT OR IGNORE INTO admins (username, password_hash)
SELECT 'admin', 'CHANGE_ME'
WHERE NOT EXISTS (SELECT 1 FROM admins WHERE username = 'admin');
