const $ = id => document.getElementById(id);

async function createProductQR() {
  const name = $("productName").value.trim();
  const price = Number($("productPrice").value);
  const message = $("message");
  const qrArea = $("qrArea");
  const payload = $("payload");

  message.className = "";
  qrArea.textContent = "作成中...";
  payload.textContent = "作成中...";

  if (!name) {
    message.textContent = "商品名を入力してください。";
    message.className = "error";
    qrArea.textContent = "未作成";
    payload.textContent = "未作成";
    return;
  }

  if (!Number.isFinite(price) || price < 0) {
    message.textContent = "価格を正しく入力してください。";
    message.className = "error";
    qrArea.textContent = "未作成";
    payload.textContent = "未作成";
    return;
  }

  const product = {
    id: "P-" + crypto.randomUUID(),
    name,
    price: Math.round(price)
  };

  try {
    // ① 内容確定
    // ② 暗号化
    const encrypted = await encryptProduct(product);

    // ③ QRコード化
    await generateQRCode(encrypted, qrArea);

    payload.textContent = encrypted;
    message.textContent = "QRコードを作成しました。";
    message.className = "ok";
  } catch (error) {
    qrArea.textContent = "QR未作成";
    payload.textContent = "未作成";
    message.textContent = error.message;
    message.className = "error";
  }
}

$("createBtn").addEventListener("click", createProductQR);
