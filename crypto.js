const POS_SECRET="BUNKASAI-POS-CHANGE-ME-2026";const enc=new TextEncoder(),dec=new TextDecoder();
async function derive(){
 const raw=await crypto.subtle.digest("SHA-256",enc.encode(POS_SECRET));
 const base=await crypto.subtle.importKey("raw",raw,{name:"HKDF"},false,["deriveKey"]);
 const aes=await crypto.subtle.deriveKey({name:"HKDF",hash:"SHA-256",salt:enc.encode("aes"),info:enc.encode("qr")},base,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
 const mac=await crypto.subtle.deriveKey({name:"HKDF",hash:"SHA-256",salt:enc.encode("mac"),info:enc.encode("qr")},base,{name:"HMAC",hash:"SHA-256",length:256},false,["sign","verify"]);
 return{aes,mac};
}
function b64(v){let s="";new Uint8Array(v).forEach(x=>s+=String.fromCharCode(x));return btoa(s).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")}
function unb64(s){s=s.replaceAll("-","+").replaceAll("_","/");while(s.length%4)s+="=";return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function encodeProduct(p){
 const{k}=await Promise.resolve({k:null});const{aes,mac}=await derive(),iv=crypto.getRandomValues(new Uint8Array(12));
 const plain=JSON.stringify({v:1,id:p.id,name:p.name,price:p.price});
 const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},aes,enc.encode(plain));
 const body="BPOS1."+b64(iv)+"."+b64(cipher);const sig=await crypto.subtle.sign("HMAC",mac,enc.encode(body));
 return body+"."+b64(sig);
}
async function decodeProduct(raw){
 const a=raw.split(".");if(a.length!==4||a[0]!=="BPOS1")throw Error("文化祭POS用QRではありません");
 const body=a.slice(0,3).join("."),{aes,mac}=await derive();
 if(!(await crypto.subtle.verify("HMAC",mac,unb64(a[3]),enc.encode(body))))throw Error("無効なQRコードです");
 const p=JSON.parse(dec.decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(a[1])},aes,unb64(a[2]))));
 if(!p.id||typeof p.name!=="string"||typeof p.price!=="number")throw Error("商品情報が不正です");
 return p;
}
