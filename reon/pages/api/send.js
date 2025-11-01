import { redis, convoKey } from "../../lib/redis";

const CHANNEL = "reon_chat";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { from, to, ciphertext, iv, ts } = req.body;
  if (!from || !to || !ciphertext || !iv)
    return res.status(400).json({ ok: false });

  const key = convoKey(from, to);
  const message = { from, to, ciphertext, iv, ts, status: "sent" };

  await redis.rpush(key, JSON.stringify(message));

  // 📡 Отправляем сообщение всем подписчикам
  await redis.publish(CHANNEL, JSON.stringify(message));

  return res.json({ ok: true });
}
