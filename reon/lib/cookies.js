export function parseCookies(req) {
  const h = req.headers.cookie || "";
  const out = {};
  h.split(";").forEach(p=>{
    const i = p.indexOf("=");
    if (i>0) out[p.slice(0,i).trim()] = decodeURIComponent(p.slice(i+1));
  });
  return out;
}
export function setCookie(res, name, value, opts={}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  parts.push("Path=/");
  parts.push("HttpOnly");
  parts.push("SameSite=Lax");
  parts.push("Secure");
  res.setHeader("Set-Cookie", parts.join("; "));
}
export function clearCookie(res, name) {
  res.setHeader("Set-Cookie", `${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax; Secure`);
}
