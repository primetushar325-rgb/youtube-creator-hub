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

-- Push notification subscriptions
CREATE TABLE IF NOT EXISTS push_subs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  prefs TEXT NOT NULL DEFAULT '{}',
  device TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subs (endpoint);

-- Notification records (history)
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '/',
  target TEXT NOT NULL DEFAULT 'all',     -- all | installed | subscribed
  status TEXT NOT NULL DEFAULT 'sent',    -- draft | scheduled | sent | failed
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  event_id TEXT,                          -- unique event for duplicate prevention
  schedule_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);

-- Notification settings (global admin prefs)
CREATE TABLE IF NOT EXISTS notif_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  global_enabled INTEGER NOT NULL DEFAULT 1,
  new_videos INTEGER NOT NULL DEFAULT 1,
  new_tools INTEGER NOT NULL DEFAULT 1,
  new_templates INTEGER NOT NULL DEFAULT 1,
  new_updates INTEGER NOT NULL DEFAULT 1,
  announcements INTEGER NOT NULL DEFAULT 1,
  sound INTEGER NOT NULL DEFAULT 1,
  default_icon TEXT NOT NULL DEFAULT '/icons/icon-192.png',
  default_url TEXT NOT NULL DEFAULT '/'
);
INSERT OR IGNORE INTO notif_settings (id) VALUES (1);
