// ============================================================
// QR READER ADAPTER
// ============================================================
// この画面の責任は「QRを読み取って文字列を渡す」だけ。
// 復号・商品検索・会計処理はここでは行わない。

let stream = null;
let running = false;

const video = document.getElementById("video");
const status = document.getElementById("status");
const raw = document.getElementById("raw");

async function startReader() {
  try {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("このブラウザではカメラを利用できません。");
    }

    if (!window.isSecureContext) {
      throw new Error("カメラを使うにはHTTPSが必要です。");
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });

    video.srcObject = stream;
    await video.play();
    running = true;
    status.textContent = "QRを枠内に入れてください。";

    // ========================================================
    // ここに各自のQR読み取りライブラリを接続する。
    //
    // QRが読めたら:
    //
    // receiveQRCode(readResult);
    //
    // を呼ぶだけ。
    // ========================================================

    if (typeof jsQR !== "undefined") {
      scanWithJsQR();
    } else {
      status.textContent =
        "カメラは起動しました。QR読み取りライブラリを接続してください。";
    }
  } catch (e) {
    status.textContent = e.message;
  }
}

function receiveQRCode(readResult) {
  // ここでは「読むだけ」。
  // 復号も会計も行わない。
  raw.textContent = readResult;
  status.textContent = "QRを読み取りました。";
}

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

function scanWithJsQR() {
  if (!running) return;

  if (video.readyState >= 2 && video.videoWidth) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const result = jsQR(image.data, image.width, image.height);

    if (result) {
      receiveQRCode(result.data);
    }
  }

  requestAnimationFrame(scanWithJsQR);
}

function stopReader() {
  running = false;

  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }

  video.srcObject = null;
  status.textContent = "停止しました。";
}

document.getElementById("start").addEventListener("click", startReader);
document.getElementById("stop").addEventListener("click", stopReader);
