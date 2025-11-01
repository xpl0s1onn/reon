import { redis } from "../../lib/redis";
import { parseCookies, clearCookie } from "../../lib/cookies";
const SESS_PREFIX = "session:";

export default async function handler(req, res) {
  try {
    const { reon_session } = parseCookies(req);
    if (reon_session) {
      await redis.del(SESS_PREFIX + reon_session);
      clearCookie(res, "reon_session");
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false });
  }
}
