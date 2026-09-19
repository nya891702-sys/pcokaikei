const SECRET="BUNKASAI-POS-2026-CHANGE-THIS-SECRET";
const enc=new TextEncoder(),dec=new TextDecoder();
async function getKeys(){
 const raw=await crypto.subtle.digest("SHA-256",enc.encode(SECRET));
 const km=await crypto.subtle.importKey("raw",raw,{name:"HKDF"},false,["deriveKey"]);
 const aes=await crypto.subtle.deriveKey({name:"HKDF",hash:"SHA-256",salt:enc.encode("bpos-aes"),info:enc.encode("qr")},km,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
 const mac=await crypto.subtle.deriveKey({name:"HKDF",hash:"SHA-256",salt:enc.encode("bpos-mac"),info:enc.encode("qr")},km,{name:"HMAC",hash:"SHA-256",length:256},false,["sign","verify"]);
 return {aes,mac};
}
function b64(a){let s="";new Uint8Array(a).forEach(x=>s+=String.fromCharCode(x));return btoa(s).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")}
function ub64(s){s=s.replaceAll("-","+").replaceAll("_","/");while(s.length%4)s+="=";return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function makeQRData(p){
 const {aes,mac}=await getKeys(),iv=crypto.getRandomValues(new Uint8Array(12));
 const plain=JSON.stringify({v:1,id:p.id,name:p.name,price:p.price});
 const cipher=await crypto.subtle.encrypt({name:"AES-GCM",iv},aes,enc.encode(plain));
 const body=`BQR1.${b64(iv)}.${b64(cipher)}`;
 const sig=await crypto.subtle.sign("HMAC",mac,enc.encode(body));
 return body+"."+b64(sig);
}
async function decodeQR(raw){
 const a=raw.split(".");
 if(a.length!==4||a[0]!=="BQR1")throw Error("文化祭POS用ではありません");
 const body=a.slice(0,3).join("."),{aes,mac}=await getKeys();
 if(!(await crypto.subtle.verify("HMAC",mac,ub64(a[3]),enc.encode(body))))throw Error("無効なQRです");
 const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:ub64(a[1])},aes,ub64(a[2]));
 const p=JSON.parse(dec.decode(plain));
 if(!p.id||typeof p.name!=="string"||typeof p.price!=="number")throw Error("商品データが不正です");
 return p;
}
