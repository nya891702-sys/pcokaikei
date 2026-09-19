// ============================================================
// QR GENERATOR ADAPTER
// ============================================================
// QRライブラリはここから差し替える。
// POS本体は「暗号化済み文字列」をここへ渡すだけ。

async function generateQRCode(text, target) {
  target.innerHTML = "";

  // 例: qrcodejs を使う場合
  if (typeof QRCode !== "undefined") {
    new QRCode(target, {
      text: text,
      width: 300,
      height: 300,
      correctLevel: QRCode.CorrectLevel.M
    });
    return;
  }

  // QRライブラリ未設定の場合。
  // 壊れた偽QRを生成せず、明確にエラーを出す。
  throw new Error(
    "QR生成ライブラリが設定されていません。qr-adapter.js に使用するQRライブラリを接続してください。"
  );
}
