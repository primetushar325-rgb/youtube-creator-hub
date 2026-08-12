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
