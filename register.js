let stream=null,scanning=false,cart=JSON.parse(sessionStorage.getItem("bpos_cart")||"[]");
const yen=n=>"¥"+Number(n).toLocaleString("ja-JP"),esc=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function save(){sessionStorage.setItem("bpos_cart",JSON.stringify(cart))}
function render(){items.innerHTML=cart.length?cart.map((x,i)=>`<div class="cart-line"><span>${esc(x.name)} × ${x.qty}<small>${yen(x.price)} × ${x.qty}</small></span><span>${yen(x.price*x.qty)} <button onclick="minus(${i})">−</button></span></div>`).join(""):"商品がありません";total.textContent=yen(cart.reduce((s,x)=>s+x.price*x.qty,0))}
function add(p){const x=cart.find(x=>x.id===p.id);x?x.qty++:cart.push({...p,qty:1});save();render()}
function minus(i){cart[i].qty--;if(cart[i].qty<=0)cart.splice(i,1);save();render()}
async function read(raw){try{const p=await decodeProduct(raw);add(p);status.textContent=`追加：${p.name}　${yen(p.price)}`;navigator.vibrate?.(60)}catch(e){status.textContent=e.message}}
async function scan(){
 if(!scanning||!stream)return;
 try{
  if("BarcodeDetector" in window){
   if(!window.detector)window.detector=new BarcodeDetector({formats:["qr_code"]});
   const found=await window.detector.detect(video);
   if(found.length){await read(found[0].rawValue);setTimeout(scan,600);return}
  }else{
   status.textContent="このiPhoneのブラウザはQRカメラ読み取りAPIに対応していません。";
  }
 }catch(e){status.textContent="読み取りエラー："+e.message}
 requestAnimationFrame(scan);
}
async function startCam(){
 try{
  if(!navigator.mediaDevices?.getUserMedia)throw Error("カメラが利用できません");
  if(!isSecureContext)throw Error("HTTPSで開いてください");
  stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});
  video.srcObject=stream;await video.play();scanning=true;status.textContent="QRを枠内に入れてください";scan();
 }catch(e){status.textContent=e.message+"。カメラの許可も確認してください。"}
}
function stopCam(){scanning=false;if(stream){stream.getTracks().forEach(t=>t.stop());stream=null}video.srcObject="";status.textContent="停止しました"}
function payNow(){
 if(!cart.length)return alert("商品がありません");
 const h=JSON.parse(localStorage.getItem("bpos_history")||"[]"),id=(h.at(-1)?.id||0)+1,total=cart.reduce((s,x)=>s+x.price*x.qty,0);
 h.push({id,time:new Date().toLocaleString("ja-JP"),items:cart.map(x=>({...x})),total});
 localStorage.setItem("bpos_history",JSON.stringify(h));cart=[];save();render();alert("会計完了\n合計 "+yen(total));
}
function showHistory(){const h=JSON.parse(localStorage.getItem("bpos_history")||"[]");history.innerHTML=h.length?h.slice().reverse().map(x=>`<div class="history-line"><span>#${String(x.id).padStart(4,"0")}　${x.time}</span><b>${yen(x.total)}</b></div>`).join(""):"履歴はありません";historyModal.hidden=false}
start.onclick=startCam;stop.onclick=stopCam;pay.onclick=payNow;clear.onclick=()=>{cart=[];save();render()};historyButton.onclick=showHistory;historyClose.onclick=()=>historyModal.hidden=true;historyClear.onclick=()=>{if(confirm("履歴を全消去しますか？")){localStorage.removeItem("bpos_history");showHistory()}};historyModal.addEventListener("click",e=>{if(e.target===historyModal)historyModal.hidden=true});render();
