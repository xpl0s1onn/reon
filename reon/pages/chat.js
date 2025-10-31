import { useEffect, useRef, useState } from "react";
import { deriveKey, encryptText, decryptText } from "../utils/crypto";
import { flushQueue, queuePush } from "../utils/offline";

export default function Chat() {
  const me = useRef(null);
  const [peer, setPeer] = useState("");
  const [pass, setPass] = useState("");
  const [key, setKey] = useState(null);
  const [msg, setMsg] = useState("");
  const [list, setList] = useState([]);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    me.current = localStorage.getItem("reon_user") || "";
    if (!me.current) location.href = "/";
    const ph = localStorage.getItem("reon_passphrase") || "";
    if (ph) setPass(ph);
    const pr = localStorage.getItem("reon_peer") || "";
    if (pr) setPeer(pr);

    const iv = setInterval(() => refresh(true), 1500);
    const iv2 = setInterval(() => {
      if (peer && me.current) fetch(`/api/typing?a=${me.current}&b=${peer}`);
    }, 1500);
    window.addEventListener("online", flushQueue);
    return () => { clearInterval(iv); clearInterval(iv2); window.removeEventListener("online", flushQueue); };
    // eslint-disable-next-line
  }, [peer]);

  async function setupKey() {
    const k = await deriveKey(pass);
    setKey(k);
    localStorage.setItem("reon_passphrase", pass);
  }

  async function send() {
    if (!msg || !key || !peer) return;
    try {
      const { ct, iv } = await encryptText(key, msg);
      const payload = { from: me.current, to: peer, ciphertext: ct, iv, ts: Date.now() };
      const r = await fetch("/api/send", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      if (!r.ok) queuePush(payload); // офлайн або помилка — у чергу
      setMsg("");
      refresh(false);
    } catch {
      // у чергу на випадок помилок
    }
  }

  async function refresh(markRead) {
    if (!peer || !me.current) return;
    const url = `/api/messages?a=${me.current}&b=${peer}${markRead ? `&markReadBy=${me.current}` : ""}`;
    const r = await fetch(url);
    const j = await r.json();
    if (j.ok) {
      if (!key) return; // ключ ще не готовий
      const out = [];
      for (const m of j.messages) {
        const text = await decryptSafe(key, m.ciphertext, m.iv);
        out.push({ ...m, text });
      }
      setList(out);
      const t = await (await fetch(`/api/typing?a=${me.current}&b=${peer}`)).json();
      setTyping(Boolean(t.typing));
    }
  }

  async function decryptSafe(k, ct, iv) {
    try { return await decryptText(k, iv, ct); } catch { return "🔒 (cannot decrypt)"; }
  }

  let typingTimer;
  function onType(v) {
    setMsg(v);
    if (peer && me.current) {
      fetch(`/api/typing?a=${me.current}&b=${peer}`, { method: "POST" }).catch(()=>{});
    }
    clearTimeout(typingTimer);
    typingTimer = setTimeout(()=>{}, 800);
  }

  return (
    <div style={{display:"grid", gridTemplateRows:"auto 1fr auto", minHeight:"100dvh", fontFamily:"system-ui"}}>
      <header style={{padding:"12px 16px", borderBottom:"1px solid #eee", display:"flex", gap:10, alignItems:"center"}}>
        <b>Reon</b>
        <input value={peer} onChange={e=>{setPeer(e.target.value); localStorage.setItem("reon_peer", e.target.value);} }
               placeholder="Peer username…" style={topInp}/>
        <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Passphrase (E2E)" style={topInp}/>
        <button onClick={setupKey} style={smallBtn}>Set key</button>
        <div style={{marginLeft:"auto", fontSize:13, color:"#666"}}>You: {me.current}</div>
      </header>

      <main style={{padding:16, display:"flex", flexDirection:"column", gap:8, background:"#fafafa"}}>
        {typing && <div style={{fontSize:12, color:"#888"}}>{peer} is typing…</div>}
        {list.map((m,i)=>(
          <div key={i} style={{
            maxWidth:"70%", padding:"10px 12px", borderRadius:12,
            alignSelf: m.from===me.current ? "flex-end":"flex-start",
            background: m.from===me.current ? "#000" : "#e9e9e9", color: m.from===me.current ? "#fff" : "#000"
          }}>
            <div style={{whiteSpace:"pre-wrap"}}>{m.text}</div>
            <div style={{fontSize:11, opacity:.7, marginTop:4, textAlign:"right"}}>
              {new Date(m.ts).toLocaleTimeString()} • {m.status}
            </div>
          </div>
        ))}
      </main>

      <footer style={{padding:12, borderTop:"1px solid #eee", display:"flex", gap:8, background:"#fff"}}>
        <input value={msg} onChange={e=>onType(e.target.value)} placeholder="Type a message…" style={msgInp}/>
        <button onClick={send} style={btn}>Send</button>
      </footer>
    </div>
  );
}

const topInp = {padding:"8px 10px", border:"1px solid #ddd", borderRadius:10};
const msgInp = {flex:1, padding:"10px 12px", border:"1px solid #ddd", borderRadius:10};
const btn = {padding:"10px 16px", background:"#000", color:"#fff", border:"none", borderRadius:10, cursor:"pointer"};
const smallBtn = {padding:"8px 10px", background:"#000", color:"#fff", border:"none", borderRadius:10, cursor:"pointer"};
