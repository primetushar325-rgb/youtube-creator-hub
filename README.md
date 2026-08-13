# YouTube Creator Hub

A mobile-first PWA with **48 distinct AI tools** for YouTube creators. Each tool has its **own purpose-built input form** and its own system prompt — no shared generic template.

## Setup (Vercel)

1. Import this repo in Vercel.
2. Add Environment Variables (Vercel → Settings → Environment Variables):
   - `GROQ_API_KEY` — primary AI provider (text + Whisper transcription). Get free at https://console.groq.com/keys
   - `GEMINI_API_KEY` — fallback on Groq rate-limit. Get free at https://aistudio.google.com/app/apikey
3. **Redeploy.**

> No keys set? The site still works — the Generate button shows a clear "configure your AI" message instead of breaking.

### No-key features (browser-native)
- **Text to Speech**: Web Speech API (no key, offline).
- **Speech to Text (mic)**: Web Speech API (no key).
- **Speech to Text (file)**: Groq Whisper (needs `GROQ_API_KEY`).

## Structure
```
api/generate.js     → Groq (primary) + Gemini (fallback), streaming
api/transcribe.js   → Groq Whisper file transcription
youtube-hub/        → the app (index.html, app.js, data.js, toolfields.js, styles.css)
index.html          → landing page
vercel.json         → clean URLs + API headers
```

## Git safety
- Working on the `full-rebuild` branch.
- `.env` / `.env.local` are gitignored — API keys are server-side only and never committed.

## Deploy
Set Vercel **Root Directory** to `youtube-hub` to serve the app at the site root, or leave empty to serve the landing page at `/` and the app at `/youtube-hub/`.

## Admin Panel & Analytics

The hub has a built-in **admin panel** at `/admin` that shows:
- **Daily / total / unique visitors**
- **Most used tools** (per-tool usage counts)
- **Tracked channels** & saved trends (from the Viral Hashtag tool)
- Visits over the last 14 days

### How it works
- Uses **Cloudflare D1** (same as mihad-free-video) via the `/api/track/*` and `/api/admin/*` serverless routes.
- Tracking is **fire-and-forget** in the browser — it never breaks the site even if the DB is offline.
- Without credentials, the site still works 100%; analytics just records nothing.

### Setup (one-time)
1. Create a free **Cloudflare D1** database (guide below) and set env vars:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_D1_DATABASE_ID`
   - `CLOUDFLARE_D1_API_TOKEN`
2. `npm install` then `npm run db:migrate` to create tables.
3. Create an admin: `ADMIN_PASSWORD=yourpass npm run db:setup-admin`
4. Set `ADMIN_SECRET` to a long random string.
5. Add all env vars in **Vercel → Settings → Environment Variables**, then Redeploy.
6. Visit `/admin`, log in with `admin` + your password.

### Create a Cloudflare D1 database (free)
1. Go to https://dash.cloudflare.com → sign up (free).
2. Left menu → **Workers & Pages** → **D1**.
3. **Create database** → name it (e.g. `creator-hub`) → create.
4. Copy the **Database ID** → that's `CLOUDFLARE_D1_DATABASE_ID`.
5. Your **Account ID** is on the dashboard overview page → `CLOUDFLARE_ACCOUNT_ID`.
6. Create an API token: https://dash.cloudflare.com/profile/api-tokens → **Create Token** → use the **"Edit Cloudflare Workers"** template → that gives D1 access → copy it → `CLOUDFLARE_D1_API_TOKEN`.

## PWA + Push Notifications

The site is a full **installable PWA** with **Web Push notifications**.

### Features
- **Install banner** (top) → native PWA install prompt. Dismissible per session; reappears next session until installed; fully hidden once installed.
- **App install** → standalone mode (no address bar), works offline via the service worker.
- **Notification permission prompt** (non-aggressive, delayed) with Allow / Not Now.
- **Admin Notification Center** at `/admin` → compose, send now or schedule, history, and global settings (New Videos / Tools / Templates / Updates / Announcements, sound).
- **User notification settings** via the 🔔 bell → per-category on/off.
- **Web Push** via VAPID keys (no Firebase needed — fits the static + serverless architecture).

### Setup (env vars in Vercel)
```
# Generate once:
#   npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

### Migrate the new tables
Run these in Cloudflare D1 console (or `npm run db:migrate` after adding to schema.sql):
```sql
CREATE TABLE IF NOT EXISTS push_subs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL, auth TEXT NOT NULL,
  prefs TEXT NOT NULL DEFAULT '{}', device TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_active TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subs (endpoint);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL, message TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '', image TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '/', target TEXT NOT NULL DEFAULT 'all',
  status TEXT NOT NULL DEFAULT 'sent',
  sent_count INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  event_id TEXT, schedule_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  sent_at TEXT
);

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
```

### How to test
- **PWA install (Android/Chrome):** open site → tap Install App → Chrome native prompt → Install. Reopen = standalone, banner gone.
- **Push:** in a Chrome tab, allow notifications (subscribes the device), then Admin → Notification Center → Send Now → device receives a push; tapping it opens the target URL.
- **Schedule:** pick a date/time → Send Notification → stored as `scheduled` (a cron/trigger is needed to auto-fire; see notes).

### Notes
- `scheduled` notifications are stored but require a scheduler/cron to fire at the exact time (not included — see roadmap).
- Duplicate prevention: pass an `eventId`; the API rejects a second send with the same event id.
- Auto-notifications on new video/tool (master prompt §10–11) can hook the same `POST /api/admin/notifications` endpoint with an eventId — add the call wherever a video/tool is created.
