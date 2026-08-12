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
