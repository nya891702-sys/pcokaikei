let products=JSON.parse(localStorage.getItem("bpos_products")||"[]");
const yen=n=>"¥"+Number(n).toLocaleString("ja-JP");
function esc(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function save(){localStorage.setItem("bpos_products",JSON.stringify(products))}
function render(){
 list.innerHTML=products.length?products.map(p=>`<div class="product-row"><div class="product-info"><b>${esc(p.name)}</b><span>${yen(p.price)}　ID: ${p.id}</span></div><button type="button" onclick="showQR('${p.id}')">QR表示</button></div>`).join(""):"まだ商品がありません";
}
async function addProduct(){
 const n=name.value.trim(),pr=Number(price.value);
 if(!n||!Number.isFinite(pr)||pr<0){msg.textContent="商品名と正しい価格を入力してください";return}
 const p={id:"P"+Date.now().toString(36).toUpperCase(),name:n,price:Math.round(pr)};
 products.push(p);save();render();name.value="";price.value="";msg.textContent="登録しました。QRを作成中…";await showQR(p.id);msg.textContent="";
}
async function showQR(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 const data=await makeQRData(p);qr.innerHTML="";qrname.textContent=`${p.name}　${yen(p.price)}`;
 QRCode.generate(qr,data,{size:300,margin:4});modal.hidden=false;
}
add.onclick=addProduct;close.onclick=()=>modal.hidden=true;modal.addEventListener("click",e=>{if(e.target===modal)modal.hidden=true});
print.onclick=()=>window.print();render();
