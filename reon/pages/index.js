import { useEffect, useState } from "react";

export default function Home() {
  const [mode, setMode] = useState("signin");
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/me");
      const j = await r.json();
      if (j.ok) location.href = "/chat";
      else setLoading(false);
    })();
  }, []);

  async function submit() {
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ action: mode, username, password })
    });
    const j = await r.json();
    if (j.ok) {
      location.href = "/chat";
    } else alert(j.error || "Error");
  }

  if (loading) return <div style={wrap}>Загрузка…</div>;

  return (
    <div style={wrap}>
      <div style={card}>
        <h2 style={{marginTop:0}}>Reon</h2>
        <input placeholder="Username" value={username} onChange={e=>setU(e.target.value)} style={inp}/>
        <input placeholder="Password" type="password" value={password} onChange={e=>setP(e.target.value)} style={inp}/>
        <button onClick={submit} style={btn}>{mode==="signin"?"Sign in":"Sign up"}</button>
        <p style={{fontSize:13, color:"#666"}}>
          {mode==="signin" ? "Нет аккаунта?" : "Есть аккаунт?"}{" "}
          <a href="#" onClick={e=>{e.preventDefault(); setMode(mode==="signin"?"signup":"signin");}}>
            {mode==="signin" ? "Зарегистрироваться" : "Войти"}
          </a>
        </p>
      </div>
    </div>
  );
}

const wrap = {fontFamily:"system-ui", minHeight:"100dvh", display:"grid", placeItems:"center", background:"#fafafa"};
const card = {padding:20, borderRadius:16, boxShadow:"0 8px 30px rgba(0,0,0,.08)", width:320, background:"#fff"};
const inp = {width:"100%", padding:"10px 12px", margin:"8px 0", border:"1px solid #ddd", borderRadius:10};
const btn = {width:"100%", padding:"10px 12px", marginTop:8, background:"#000", color:"#fff", border:"none", borderRadius:10, cursor:"pointer"};
