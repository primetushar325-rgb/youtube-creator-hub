// ============================================================
// scripts/migrate.js — apply database/schema.sql to Cloudflare D1
// Usage:  npm run db:migrate
// Requires env: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID,
//               CLOUDFLARE_D1_API_TOKEN
// ============================================================
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const CF_API_BASE = "https://api.cloudflare.com/client/v4";
const SCHEMA_PATH = resolve(process.cwd(), "database/schema.sql");

const env = (k) => (process.env[k] || "").trim();

async function main() {
  const accountId = env("CLOUDFLARE_ACCOUNT_ID");
  const dbId = env("CLOUDFLARE_D1_DATABASE_ID");
  const token = env("CLOUDFLARE_D1_API_TOKEN");
  if (!accountId || !dbId || !token) {
    console.error("✖ Missing Cloudflare D1 env vars (ACCOUNT_ID / DATABASE_ID / API_TOKEN).");
    process.exit(1);
  }
  const sql = readFileSync(SCHEMA_PATH, "utf8");
  const url = `${CF_API_BASE}/accounts/${accountId}/d1/database/${dbId}/query`;
  console.log("→ Applying schema to Cloudflare D1 …");
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sql }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    console.error("✖ Migration failed:", JSON.stringify(json.errors || json, null, 2));
    process.exit(1);
  }
  console.log("✔ Migration applied successfully.");
}

main().catch((e) => { console.error("✖", e); process.exit(1); });
