// POST /api/admin/login — verify admin credentials, set a simple session cookie
import { createHash } from "node:crypto";
import { isDbConfigured } from "../../lib/db.js";
import { getAdminByUsername } from "../../lib/repo.js";

export const config = { runtime: "nodejs" };

const SESSION_COOKIE = "ych_admin";
const COOKIE_MAX_AGE = 60 * 60 * 12; // 12h

function hashPassword(pw) {
  return createHash("sha256").update(pw).digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isDbConfigured()) return res.status(503).json({ error: "Database not configured" });

  const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  const { username, password } = body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  const admin = await getAdminByUsername(username);
  if (!admin) return res.status(401).json({ error: "Invalid credentials" });

  // Verify password against stored SHA-256 hash
  const entered = hashPassword(password);
  if (entered !== admin.password_hash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const secret = process.env.ADMIN_SECRET || "dev-secret-change-me";
  const raw = `${username}:${Date.now()}:${secret}`;
  const token = Buffer.from(raw).toString("base64");

  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`
  );
  res.status(200).json({ ok: true, username: admin.username });
}
