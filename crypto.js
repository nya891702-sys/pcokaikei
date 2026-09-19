// QRに入れるデータの暗号化だけを担当する。
// QR生成・読み取り・会計処理はここでは行わない。

const QR_SECRET = "CHANGE-THIS-SECRET-BEFORE-USE";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function makeKey() {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(QR_SECRET)
  );

  return crypto.subtle.importKey(
    "raw",
    digest,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptProduct(product) {
  const key = await makeKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const plain = JSON.stringify({
    v: 1,
    id: product.id,
    name: product.name,
    price: product.price
  });

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plain)
  );

  return "BPOS1." + bytesToBase64(iv) + "." + bytesToBase64(encrypted);
}
