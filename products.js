let products=JSON.parse(localStorage.getItem("bpos_products")||"[]");
const yen=n=>"¥"+Number(n).toLocaleString("ja-JP");
const esc=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function save(){localStorage.setItem("bpos_products",JSON.stringify(products))}
function render(){list.innerHTML=products.length?products.map(p=>`<div class="product-row"><div><b>${esc(p.name)}</b><span>${yen(p.price)}　ID:${p.id}</span></div><button onclick="openQR('${p.id}')">QR表示</button></div>`).join(""):"登録済みの商品はありません"}
async function openQR(id){
 const p=products.find(x=>x.id===id);if(!p)return;
 try{
  const data=await encodeProduct(p);
  qr.innerHTML="";
  qrTitle.textContent=`${p.name}　${yen(p.price)}`;
  new QRCode(qr,{text:data,width:300,height:300,correctLevel:QRCode.CorrectLevel.M});
  modal.hidden=false;
 }catch(e){alert("QR作成に失敗しました：\n"+e.message)}
}
async function addProduct(){
 const n=name.value.trim(),pr=Number(price.value);
 if(!n||!Number.isFinite(pr)||pr<0){message.textContent="商品名と正しい価格を入力してください。";return}
 const p={id:"P"+Date.now().toString(36).toUpperCase(),name:n,price:Math.round(pr)};
 products.push(p);save();render();name.value="";price.value="";
 message.textContent="商品を登録しました。";
 await openQR(p.id);
}
add.onclick=addProduct;close.onclick=()=>modal.hidden=true;modal.addEventListener("click",e=>{if(e.target===modal)modal.hidden=true});
print.onclick=()=>window.print();render();
