// utils/crypto.js

// Универсальный генератор ключа для двух пользователей (E2E)
export async function getAutoKey(me, peer) {
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

// 🔒 Шифрование текста (AES-GCM)
export async function encryptText(key, text) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(text);
  const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ct: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  };
}

// 🔓 Расшифровка текста
export async function decryptText(key, ivB64, ctB64) {
  const iv = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(ctB64), (c) => c.charCodeAt(0));
  const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(decrypted);
}
