export async function getAutoKey(me, peer) {
  // сортируем имена в алфавитном порядке
  const sorted = [me, peer].sort().join("-");
  const passphrase = `${sorted}-reon`;
  const enc = new TextEncoder();
  const salt = enc.encode("reon-auto-salt");

  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 50000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
