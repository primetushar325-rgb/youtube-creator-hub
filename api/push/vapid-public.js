// GET /api/push/vapid-public — expose the public VAPID key to the client
export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  res.status(200).json({ key: process.env.VAPID_PUBLIC_KEY || "" });
}
