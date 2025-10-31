import { useState } from "react";

export default function Home() {
  const [mode, setMode] = useState("signin");
  const [username, setU] = useState("");
  const [password, setP] = useState("");

  async function submit() {
    const r = await fetch("/api/auth", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ action: mode, username, password })
    });
    const j = await r.json();
    if (j.ok) {
      localStorage.setItem("reon_user", username);
      location.href = "/chat";
    } else alert(j.error || "Error");
  }

  return (
    <div style={{fontFamily:"system-ui", minHeight:"100dvh", display:"grid", placeItems:"center"}}>
      <div style={{padding:20, borderRadius:16, boxShadow:"0 8px 30px rgba(0,0,0,.08)", width:320, background:"#fff"}}>
        <h2 style={{marginTop:0}}>Reon</h2>
        <div>
          <input placeholder="Username" value={username} onChange={e=>setU(e.target.value)} style={inp}/>
          <input placeholder="Password" type="password" value={password} onChange={e=>setP(e.target.value)} style={inp}/>
          <button onClick={submit} style={btn}>{mode==="signin"?"Sign in":"Sign up"}</button>
        </div>
        <p style={{fontSize:13, color:"#666"}}>
          {mode==="signin" ? "No account?" : "Have an account?"}{" "}
          <a href="#" onClick={e=>{e.preventDefault(); setMode(mode==="signin"?"signup":"signin");}}>
            {mode==="signin" ? "Sign up" : "Sign in"}
          </a>
        </p>
        <hr/>
        <p style={{fontSize:13, color:"#666"}}>
          Minimal MVP • E2E with passphrase on first open in chat
        </p>
      </div>
    </div>
  );
}

const inp = {width:"100%", padding:"10px 12px", margin:"8px 0", border:"1px solid #ddd", borderRadius:10};
const btn = {width:"100%", padding:"10px 12px", marginTop:8, background:"#000", color:"#fff", border:"none", borderRadius:10, cursor:"pointer"};
