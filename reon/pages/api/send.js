import { redis, convoKey } from "../../lib/redis";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).end();
    const { from, to, ciphertext, iv, ts } = req.body || {};
    if (!from || !to || !ciphertext || !iv || !ts) {
      return res.status(400).json({ ok: false });
    }
    const key = convoKey(from, to);
    const msg = { from, ciphertext, iv, ts, status: "sent" };
    // зберігаємо в кінець списку
    await redis.rpush(key, JSON.stringify(msg));
    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
}
