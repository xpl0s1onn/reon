import { redis } from "../../lib/redis";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { setCookie } from "../../lib/cookies";

const USERS_KEY = "users";        // hash: username -> JSON {username, hash}
const SESS_PREFIX = "session:";   // key: session:<token> -> username (TTL)

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
      // автологин сразу после регистрации
      const token = crypto.randomBytes(24).toString("hex");
      await redis.set(SESS_PREFIX + token, username, { ex: 60 * 60 * 24 * 7 }); // 7 дней
      setCookie(res, "reon_session", token, { maxAge: 60 * 60 * 24 * 7 });
      return res.json({ ok: true, username });
    }

    if (action === "signin") {
      if (!userJson) return res.status(404).json({ ok: false, error: "No user" });
      const user = JSON.parse(userJson);
      const ok = await bcrypt.compare(password, user.hash);
      if (!ok) return res.status(401).json({ ok: false, error: "Wrong password" });
      const token = crypto.randomBytes(24).toString("hex");
      await redis.set(SESS_PREFIX + token, username, { ex: 60 * 60 * 24 * 7 });
      setCookie(res, "reon_session", token, { maxAge: 60 * 60 * 24 * 7 });
      return res.json({ ok: true, username });
    }

    return res.status(400).json({ ok: false, error: "Unknown action" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "Server" });
  }
}
