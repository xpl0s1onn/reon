import { redis, convoKey } from "../../lib/redis";

export default async function handler(req, res) {
  try {
    const { a, b, markReadBy } = req.query;
    if (req.method !== "GET") return res.status(405).end();
    if (!a || !b) return res.status(400).json({ ok: false });

    const key = convoKey(a, b);
    const items = await redis.lrange(key, 0, -1);

    // ⚙️ Если элемент уже объект — не парсим
    const messages = items.map((m) => (typeof m === "string" ? JSON.parse(m) : m));

    let updated = false;
    for (const m of messages) {
      if (m.from !== a && m.status === "sent") {
        m.status = "delivered";
        updated = true;
      }
      if (markReadBy && m.from !== markReadBy && m.status !== "read") {
        m.status = "read";
        updated = true;
      }
    }

    if (updated) {
      const pipeline = redis.pipeline();
      pipeline.del(key);
      for (const m of messages) pipeline.rpush(key, JSON.stringify(m));
      await pipeline.exec();
    }

    return res.json({ ok: true, messages });
  } catch (e) {
    console.error("MESSAGES ERROR:", e);
    res.status(500).json({ ok: false });
  }
}
