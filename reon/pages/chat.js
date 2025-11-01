import { useEffect, useRef, useState } from "react";
import { getAutoKey, encryptText, decryptText } from "../utils/crypto";
import { flushQueue, queuePush } from "../utils/offline";
import { Redis } from "@upstash/redis";

export default function Chat() {
  const me = useRef(null);
  const [users, setUsers] = useState([]);
  const [peer, setPeer] = useState("");
  const [key, setKey] = useState(null);
  const [msg, setMsg] = useState("");
  const [list, setList] = useState([]);
  const [typing, setTyping] = useState(false);
  const [ready, setReady] = useState(false);
  const chatRef = useRef(null);

  const sub = new Redis({
    url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL,
    token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN,
  });

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/me");
      const meJ = await meRes.json();
      if (!meJ.ok) {
        location.href = "/";
        return;
      }
      me.current = meJ.username;
      await fetchUsers();
      setReady(true);
    })();

    window.addEventListener("online", flushQueue);
    return () => window.removeEventListener("online", flushQueue);
  }, []);

  useEffect(() => {
    if (ready && peer) initKey();
  }, [peer, ready]);

  async function initKey() {
    const k = await getAutoKey(me.current, peer);
    setKey(k);
    refresh(true);
    subscribeRealtime();
  }

  async function fetchUsers() {
    const r = await fetch("/api/users");
    const j = await r.json();
    if (j.ok) setUsers(j.users.filter((u) => u !== me.current));
  }

  async function send() {
    if (!msg.trim() || !peer || !key) return;
    const { ct, iv } = await encryptText(key, msg);
    const payload = { from: me.current, to: peer, ciphertext: ct, iv, ts: Date.now() };
    try {
      const r = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) queuePush(payload);
      setMsg("");
      refresh(false);
      scrollToBottom();
    } catch {
      queuePush(payload);
    }
  }

  async function refresh(markRead) {
    if (!peer || !me.current) return;
    const url = `/api/messages?a=${me.current}&b=${peer}${markRead ? `&markReadBy=${me.current}` : ""}`;
    const r = await fetch(url);
    const j = await r.json();
    if (j.ok && key) {
      const out = [];
      for (const m of j.messages) {
        const text = await decryptSafe(key, m.ciphertext, m.iv);
        out.push({ ...m, text });
      }
      setList(out);
      scrollToBottom();
    }
  }

  async function decryptSafe(k, ct, iv) {
    try {
      return await decryptText(k, iv, ct);
    } catch {
      return "🔒 (cannot decrypt)";
    }
  }

  function onType(v) {
    setMsg(v);
    if (peer && me.current)
      fetch(`/api/typing?a=${me.current}&b=${peer}`, { method: "POST" }).catch(() => {});
  }

  async function subscribeRealtime() {
    await sub.subscribe("reon_chat", async (data) => {
      try {
        const msg = typeof data === "string" ? JSON.parse(data) : data;
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

  async function logout() {
    await fetch("/api/logout");
    location.href = "/";
  }

  function scrollToBottom() {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", height: "100vh", fontFamily: "system-ui" }}>
      {/* Sidebar */}
      <aside style={{ borderRight: "1px solid #eee", background: "#f9f9f9", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", display: "flex", gap: 8, alignItems: "center" }}>
          <b>Reon</b>
          <div style={{ marginLeft: "auto" }}>
            <button onClick={logout} style={smallBtn}>Logout</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {users.map((u) => (
            <div
              key={u}
              onClick={() => setPeer(u)}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                background: peer === u ? "#000" : "transparent",
                color: peer === u ? "#fff" : "#000",
              }}
            >
              {u}
            </div>
          ))}
        </div>
      </aside>

      {/* Chat window */}
      <div style={{ display: "grid", gridTemplateRows: "auto 1fr auto" }}>
        <header style={{ padding: "10px 16px", borderBottom: "1px solid #eee", display: "flex", gap: 8, alignItems: "center" }}>
          {peer ? (
            <div>
              <b>{peer}</b>{" "}
              {typing && <span style={{ fontSize: 12, color: "#999" }}>typing…</span>}
            </div>
          ) : (
            <div style={{ color: "#777" }}>← выбери пользователя</div>
          )}
          <div style={{ marginLeft: "auto", fontSize: 13, color: "#666" }}>
            You: {me.current || "…"}
          </div>
        </header>

        <main ref={chatRef} style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8, background: "#fafafa", overflowY: "auto" }}>
          {list.map((m, i) => (
            <div
              key={i}
              style={{
                maxWidth: "70%",
                padding: "10px 12px",
                borderRadius: 12,
                alignSelf: m.from === me.current ? "flex-end" : "flex-start",
                background: m.from === me.current ? "#000" : "#e9e9e9",
                color: m.from === me.current ? "#fff" : "#000",
              }}
            >
              <div style={{ whiteSpace: "pre-wrap" }}>{m.text}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, textAlign: "right" }}>
                {new Date(m.ts).toLocaleTimeString()} • {m.status}
              </div>
            </div>
          ))}
        </main>

        <footer style={{ padding: 12, borderTop: "1px solid #eee", display: "flex", gap: 8, background: "#fff" }}>
          <input
            value={msg}
            onChange={(e) => onType(e.target.value)}
            placeholder={!peer ? "Выбери пользователя" : "Type a message…"}
            style={msgInp}
            disabled={!peer}
          />
          <button onClick={send} style={btn} disabled={!peer || !msg.trim()}>
            Send
          </button>
        </footer>
      </div>
    </div>
  );
}

const msgInp = { flex: 1, padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10 };
const btn = { padding: "10px 16px", background: "#000", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer" };
const smallBtn = { padding: "6px 10px", background: "#000", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" };
