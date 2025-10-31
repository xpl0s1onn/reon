const QKEY = "reon_offline_queue_v1";

export function queuePush(msg) {
  const q = JSON.parse(localStorage.getItem(QKEY) || "[]");
  q.push(msg);
  localStorage.setItem(QKEY, JSON.stringify(q));
}

export async function flushQueue() {
  const q = JSON.parse(localStorage.getItem(QKEY) || "[]");
  const left = [];
  for (const m of q) {
    try {
      const r = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(m),
      });
      if (!r.ok) left.push(m);
    } catch {
      left.push(m);
    }
  }
  localStorage.setItem(QKEY, JSON.stringify(left));
}
