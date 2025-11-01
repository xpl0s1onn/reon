import { redis } from "../../lib/redis";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { setCookie } from "../../lib/cookies";

const USERS_KEY = "users";
const SESS_PREFIX = "session:";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();
    const { action, username, password } = req.body || {};
    if (!action || !username || !password)
      return res.status(400).json({ ok: false, error: "Bad payload" });

    // Redis возвращает строку или объект — проверяем перед JSON.parse
    let userData = await redis.hget(USERS_KEY, username);

    if (action === "signup") {
      if (userData) return res.status(409).json({ ok: false, error: "User exists" });
      const hash = await bcrypt.hash(password, 10);
      await redis.hset(USERS_KEY, { [username]: JSON.stringify({ hash }) });

      const token = crypto.randomBytes(24).toString("hex");
      await redis.set(SESS_PREFIX + token, username, { ex: 60 * 60 * 24 * 7 });
      setCookie(res, "reon_session", token, { maxAge: 60 * 60 * 24 * 7 });
      return res.json({ ok: true, username });
    }

    if (action === "signin") {
      if (!userData) return res.status(404).json({ ok: false, error: "No user" });
      // Если уже объект — не парсим
      const user = typeof userData === "string" ? JSON.parse(userData) : userData;

      const ok = await bcrypt.compare(password, user.hash);
      if (!ok) return res.status(401).json({ ok: false, error: "Wrong password" });

      const token = crypto.randomBytes(24).toString("hex");
      await redis.set(SESS_PREFIX + token, username, { ex: 60 * 60 * 24 * 7 });
      setCookie(res, "reon_session", token, { maxAge: 60 * 60 * 24 * 7 });

      return res.json({ ok: true, username });
    }

    return res.status(400).json({ ok: false, error: "Unknown action" });
  } catch (e) {
    console.error("AUTH ERROR:", e);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
