import { redis } from "../../lib/redis";

const USERS_KEY = "users";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") return res.status(405).end();

    const users = await redis.hkeys(USERS_KEY);
    return res.json({ ok: true, users });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false });
  }
}
