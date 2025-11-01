import { Redis } from "@upstash/redis";

const sub = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL,
  token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN,
});

useEffect(() => {
  if (!ready) return;

  async function subscribe() {
    await sub.subscribe("reon_chat", async (data) => {
      try {
        const msg = typeof data === "string" ? JSON.parse(data) : data;
        // если сообщение для нас — добавляем его
        if (
          (msg.from === peer && msg.to === me.current) ||
          (msg.to === peer && msg.from === me.current)
        ) {
          const text = await decryptSafe(key, msg.ciphertext, msg.iv);
          setList((prev) => [...prev, { ...msg, text }]);
          scrollToBottom();
        }
      } catch (err) {
        console.error("Realtime error:", err);
      }
    });
  }

  subscribe();

  return () => sub.unsubscribe("reon_chat");
}, [peer, ready, key]);
