import { redis } from "../../lib/redis";
import { parseCookies } from "../../lib/cookies";

const SESS_PREFIX = "session:";

export default async function handler(req, res) {
  try {
    const { reon_session } = parseCookies(req);
    if (!reon_session) return res.json({ ok: false });
    const username = await redis.get(SESS_PREFIX + reon_session);
    if (!username) return res.json({ ok: false });
    return res.json({ ok: true, username });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false });
  }
}
