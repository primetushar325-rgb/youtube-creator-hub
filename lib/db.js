// ============================================================
// Cloudflare D1 database client (REST API)
// Same approach as mihad-free-video. Works on Vercel via plain
// HTTPS (no native modules).
// Env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID,
//           CLOUDFLARE_D1_API_TOKEN
// ============================================================

const CF_API_BASE = "https://api.cloudflare.com/client/v4";

function env(key, fallback = "") {
  return (process.env[key] ?? fallback).trim();
}

export function isDbConfigured() {
  return Boolean(
    env("CLOUDFLARE_ACCOUNT_ID") &&
      env("CLOUDFLARE_D1_DATABASE_ID") &&
      env("CLOUDFLARE_D1_API_TOKEN")
  );
}

function assertConfigured() {
  if (!isDbConfigured()) {
    throw new Error(
      "Database not configured. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_D1_API_TOKEN."
    );
  }
}

function queryUrl() {
  return `${CF_API_BASE}/accounts/${env(
    "CLOUDFLARE_ACCOUNT_ID"
  )}/d1/database/${env("CLOUDFLARE_D1_DATABASE_ID")}/query`;
}

export async function query(sql, params = []) {
  assertConfigured();
  const res = await fetch(queryUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("CLOUDFLARE_D1_API_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params: [...params] }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`D1 HTTP ${res.status}: ${text || res.statusText}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(
      `D1 query error: ${json.errors?.[0]?.message ?? "unknown"}`
    );
  }
  return json.result?.[0]?.results ?? [];
}

export async function execute(sql, params = []) {
  assertConfigured();
  const res = await fetch(queryUrl(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env("CLOUDFLARE_D1_API_TOKEN")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql, params: [...params] }),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`D1 HTTP ${res.status}: ${text || res.statusText}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(
      `D1 execute error: ${json.errors?.[0]?.message ?? "unknown"}`
    );
  }
  return json.result?.[0]?.meta ?? {};
}
