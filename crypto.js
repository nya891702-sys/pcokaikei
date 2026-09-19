const SECRET="BUNKASAI-POS-2026-CHANGE-THIS-SECRET";
const enc=new TextEncoder(),dec=new TextDecoder();

function b64(bytes){
 let s="";
 new Uint8Array(bytes).forEach(v=>s+=String.fromCharCode(v));
 return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=/g,"");
}
function unb64(s){
 s=s.replace(/-/g,"+").replace(/_/g,"/");
 while(s.length%4)s+="=";
 return Uint8Array.from(atob(s),c=>c.charCodeAt(0));
}
async function keys(){
 const digest=await crypto.subtle.digest("SHA-256",enc.encode(SECRET));
 const base=await crypto.subtle.importKey("raw",digest,{name:"HKDF"},false,["deriveKey"]);
 const aes=await crypto.subtle.deriveKey(
   {name:"HKDF",hash:"SHA-256",salt:enc.encode("bpos-aes-salt"),info:enc.encode("bpos-qr")},
   base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]
 );
 const mac=await crypto.subtle.deriveKey(
   {name:"HKDF",hash:"SHA-256",salt:enc.encode("bpos-mac-salt"),info:enc.encode("bpos-qr")},
   base,{name:"HMAC",hash:"SHA-256",length:256},false,["sign","verify"]
 );
 return {aes,mac};
}
async function encryptProduct(product){
 const {aes,mac}=await keys();
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const plain=JSON.stringify({
   v:1,id:product.id,name:product.name,
   price:product.price,maxStock:product.maxStock
 });
 const cipher=await crypto.subtle.encrypt(
   {name:"AES-GCM",iv},aes,enc.encode(plain)
 );
 const body="BPOS1."+b64(iv)+"."+b64(cipher);
 const signature=await crypto.subtle.sign("HMAC",mac,enc.encode(body));
 return body+"."+b64(signature);
}
async function decryptProduct(raw){
 const parts=String(raw).trim().split(".");
 if(parts.length!==4||parts[0]!=="BPOS1")throw new Error("文化祭POS用のQRではありません。");
 const body=parts.slice(0,3).join(".");
 const {aes,mac}=await keys();
 const valid=await crypto.subtle.verify("HMAC",mac,unb64(parts[3]),enc.encode(body));
 if(!valid)throw new Error("QRコードが無効、または改ざんされています。");
 const plain=await crypto.subtle.decrypt(
   {name:"AES-GCM",iv:unb64(parts[1])},aes,unb64(parts[2])
 );
 const p=JSON.parse(dec.decode(plain));
 if(!p.id||typeof p.name!=="string"||typeof p.price!=="number")
   throw new Error("商品情報が不正です。");
 return p;
}
