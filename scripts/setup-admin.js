// ============================================================
// scripts/setup-admin.js — create/update the admin user
// Usage:  ADMIN_USERNAME=admin ADMIN_PASSWORD=secret npm run db:setup-admin
// Stores a SHA-256 hash of the password (simple; no deps).
// ============================================================
import { createHash } from "node:crypto";
import { resolve } from "node:path";

const CF_API_BASE = "https://api.cloudflare.com/client/v4";
const env = (k) => (process.env[k] || "").trim();

async function run(sql, params = []) {
  const accountId = env("CLOUDFLARE_ACCOUNT_ID");
  const dbId = env("CLOUDFLARE_D1_DATABASE_ID");
  const token = env("CLOUDFLARE_D1_API_TOKEN");
  const url = `${CF_API_BASE}/accounts/${accountId}/d1/database/${dbId}/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql, params }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(JSON.stringify(json.errors || json));
  }
  return json.result?.[0]?.results ?? [];
}

const username = env("ADMIN_USERNAME") || "admin";
const password = env("ADMIN_PASSWORD") || "";
if (!password) { console.error("✖ Set ADMIN_PASSWORD env var."); process.exit(1); }
const hash = createHash("sha256").update(password).digest("hex");

await run(
  "INSERT INTO admins (username, password_hash) VALUES (?, ?) ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash",
  [username, hash]
);
console.log(`✔ Admin "${username}" created/updated.`);
