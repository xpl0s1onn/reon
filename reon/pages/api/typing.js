import { redis, convoKey } from "../../lib/redis";

export default async function handler(req, res) {
  try {
    const { a, b } = req.query; // a=who types, b=peer
    if (!a || !b) return res.status(400).json({ ok: false });

    const key = `typing:${convoKey(a, b)}:${a}`;
    if (req.method === "POST") {
      await redis.set(key, "1", { ex: 3 }); // 3 сек
      return res.json({ ok: true });
    }
    if (req.method === "GET") {
      const yours = await redis.get(key); // чи «a» друкує — не потрібно, нам цікаво навпаки
      const peers = await redis.get(`typing:${convoKey(a, b)}:${b}`);
      return res.json({ ok: true, typing: Boolean(peers) });
    }
    return res.status(405).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false });
  }
}
