import { redis } from "../../lib/redis";
import bcrypt from "bcryptjs";

const USERS_KEY = "users"; // Redis hash: username -> json

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();

    const { action, username, password } = req.body || {};
    if (!action || !username || !password) {
      return res.status(400).json({ ok: false, error: "Bad payload" });
    }

    const userJson = await redis.hget(USERS_KEY, username);

    if (action === "signup") {
      if (userJson) return res.status(409).json({ ok: false, error: "User exists" });
      const hash = await bcrypt.hash(password, 10);
      await redis.hset(USERS_KEY, { [username]: JSON.stringify({ username, hash }) });
      return res.json({ ok: true });
    }

    if (action === "signin") {
      if (!userJson) return res.status(404).json({ ok: false, error: "No user" });
      const user = JSON.parse(userJson);
      const ok = await bcrypt.compare(password, user.hash);
      if (!ok) return res.status(401).json({ ok: false, error: "Wrong pass" });
      // простий сеанс через cookie (HttpOnly не поставимо з API routes без libs, тож тримаємо в LocalStorage токен-заглушку)
      return res.json({ ok: true });
    }

    return res.status(400).json({ ok: false, error: "Unknown action" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Server" });
  }
}
