let stream=null,scanning=false;
let cart=JSON.parse(sessionStorage.getItem("bpos_cart")||"[]");
const yen=n=>"¥"+Math.round(Number(n)).toLocaleString("ja-JP");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function saveCart(){sessionStorage.setItem("bpos_cart",JSON.stringify(cart))}
function renderCart(){
 cartBox.innerHTML=cart.length?cart.map((p,i)=>`
 <div class="cart-row">
   <span><b>${esc(p.name)}</b><small>${yen(p.price)} × ${p.qty}</small></span>
   <span>${yen(p.price*p.qty)} <button onclick="removeOne(${i})">−</button></span>
 </div>`).join(""):"商品がありません。";
 total.textContent=yen(cart.reduce((s,p)=>s+p.price*p.qty,0));
}
function addProduct(p){
 const same=cart.find(x=>x.id===p.id);
 if(same)same.qty++;
 else cart.push({...p,qty:1});
 saveCart();renderCart();
}
function removeOne(i){
 cart[i].qty--;
 if(cart[i].qty<=0)cart.splice(i,1);
 saveCart();renderCart();
}
let lastRaw="",lastAt=0;
async function handleQR(raw){
 const now=Date.now();
 if(raw===lastRaw&&now-lastAt<1000)return;
 lastRaw=raw;lastAt=now;
 try{
   const p=await decryptProduct(raw);
   addProduct(p);
   scanStatus.textContent=`追加：${p.name}　${yen(p.price)}`;
   navigator.vibrate?.(70);
 }catch(e){
   scanStatus.textContent=e.message;
 }
}
const canvas=document.createElement("canvas"),ctx=canvas.getContext("2d");
function scan(){
 if(!scanning||!stream)return;
 if(video.readyState>=2&&video.videoWidth){
   canvas.width=video.videoWidth;canvas.height=video.videoHeight;
   ctx.drawImage(video,0,0,canvas.width,canvas.height);
   const img=ctx.getImageData(0,0,canvas.width,canvas.height);
   if(typeof jsQR==="function"){
     const code=jsQR(img.data,img.width,img.height,{inversionAttempts:"attemptBoth"});
     if(code)handleQR(code.data);
   }else{
     scanStatus.textContent="QR読み取りライブラリを読み込めませんでした。";
   }
 }
 requestAnimationFrame(scan);
}
async function startCamera(){
 try{
   if(!navigator.mediaDevices?.getUserMedia)throw new Error("このブラウザではカメラを利用できません。");
   if(!window.isSecureContext)throw new Error("HTTPSで開いてください。");
   stream=await navigator.mediaDevices.getUserMedia({
     video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}},
     audio:false
   });
   video.srcObject=stream;await video.play();
   scanning=true;scanStatus.textContent="QRコードを枠内に入れてください。";scan();
 }catch(e){
   scanStatus.textContent=e.message+" Safariのカメラ許可も確認してください。";
 }
}
function stopCamera(){
 scanning=false;
 if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}
 video.srcObject=null;scanStatus.textContent="停止しました。";
}
function pay(){
 if(!cart.length){alert("商品がありません。");return}
 const history=JSON.parse(localStorage.getItem("bpos_history")||"[]");
 const id=(history.at(-1)?.id||0)+1;
 const amount=cart.reduce((s,p)=>s+p.price*p.qty,0);
 history.push({id,time:new Date().toLocaleString("ja-JP"),items:cart.map(x=>({...x})),total:amount});
 localStorage.setItem("bpos_history",JSON.stringify(history));
 cart=[];saveCart();renderCart();
 alert("会計完了\n合計 "+yen(amount));
}
function showHistory(){
 const history=JSON.parse(localStorage.getItem("bpos_history")||"[]");
 historyBox.innerHTML=history.length?history.slice().reverse().map(h=>
   `<div class="history-row"><span>#${String(h.id).padStart(4,"0")}　${h.time}</span><b>${yen(h.total)}</b></div>`
 ).join(""):"履歴はありません。";
 historyModal.hidden=false;
}
startBtn.onclick=startCamera;stopBtn.onclick=stopCamera;payBtn.onclick=pay;
clearBtn.onclick=()=>{cart=[];saveCart();renderCart()};
historyBtn.onclick=showHistory;historyClose.onclick=()=>historyModal.hidden=true;
historyClear.onclick=()=>{if(confirm("会計履歴を全消去しますか？")){localStorage.removeItem("bpos_history");showHistory()}};
historyModal.addEventListener("click",e=>{if(e.target===historyModal)historyModal.hidden=true});
renderCart();
