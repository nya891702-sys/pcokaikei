let products=JSON.parse(localStorage.getItem("bpos_products")||"[]");
const yen=n=>"¥"+Math.round(Number(n)).toLocaleString("ja-JP");
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function save(){localStorage.setItem("bpos_products",JSON.stringify(products))}
function render(){
 productsBox.innerHTML=products.length?products.map(p=>`
 <div class="product-row">
   <div><b>${esc(p.name)}</b><span>${yen(p.price)}　最大 ${p.maxStock}個</span></div>
   <button onclick="showQR('${p.id}')">QR表示</button>
 </div>`).join(""):"登録済みの商品はありません。";
}
async function showQR(id){
 const p=products.find(x=>x.id===id); if(!p)return;
 try{
   if(typeof QRCode==="undefined") throw new Error("QRコードライブラリを読み込めませんでした。GitHub Pagesのページを再読み込みしてください。");
   const encrypted=await encryptProduct(p);
   qrcode.innerHTML="";
   new QRCode(qrcode,{
      text:encrypted,
      width:300,
      height:300,
      correctLevel:QRCode.CorrectLevel.M
   });
   qrTitle.textContent=`${p.name}　${yen(p.price)}`;
   qrModal.hidden=false;
 }catch(e){
   alert("QRコードの発行に失敗しました。\n\n"+e.message);
 }
}
async function addProduct(){
 const n=name.value.trim(), priceValue=Number(price.value), maxValue=Number(maxStock.value);
 if(!n){status.textContent="商品名を入力してください。";return}
 if(!Number.isFinite(priceValue)||priceValue<0){status.textContent="価格を正しく入力してください。";return}
 if(!Number.isInteger(maxValue)||maxValue<0){status.textContent="最大在庫を正しく入力してください。";return}
 const p={
   id:"P"+Date.now().toString(36).toUpperCase(),
   name:n,
   price:Math.round(priceValue),
   maxStock:maxValue
 };
 products.push(p);save();render();
 name.value="";price.value="";maxStock.value="";
 status.textContent="商品を登録しました。QRコードを作成しています。";
 await showQR(p.id);
 status.textContent="登録完了。";
}
addBtn.onclick=addProduct;
closeBtn.onclick=()=>qrModal.hidden=true;
qrModal.addEventListener("click",e=>{if(e.target===qrModal)qrModal.hidden=true});
printBtn.onclick=()=>window.print();
render();
