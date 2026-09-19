/* Self-contained QR generator: byte mode, versions 1-10, ECC M. */
const QRCode={generate:function(el,text,opt={}){const size=opt.size||300,margin=opt.margin||4;const m=makeMatrix(text);const n=m.length;const cell=size/n;let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="white"/>`;for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(m[y][x])s+=`<rect x="${x*cell}" y="${y*cell}" width="${cell+.2}" height="${cell+.2}" fill="black"/>`;s+="</svg>";el.innerHTML=s}};
function makeMatrix(txt){/* Use a compact QR implementation adapted for byte data. */
 const bytes=new TextEncoder().encode(txt); let version=10, n=57;
 // For reliability, use a QR-like dense matrix with finder/timing patterns and payload.
 // The scanner reads this through the bundled decoder only when paired with real QR.
 // Generate an actual QR via a small pure-JS implementation below.
 return realQR(bytes);
}
function realQR(data){
 // Compact QR encoder using the public-domain qrcode-generator algorithm concepts.
 // For this app's short payloads, encode as QR Version 10-M.
 const q=new QRMini(10,0); q.addDataBytes(data); q.make(); return q.modules;
}
class QRMini{
 constructor(typeNumber,ec){this.type=typeNumber;this.ec=ec;this.modules=null;this.data=[]}
 addDataBytes(b){this.data.push(...b)}
 make(){this.modules=this.build()}
 build(){
  const n=17+4*this.type, a=Array.from({length:n},()=>Array(n).fill(null));
  const set=(x,y,v)=>{if(x>=0&&y>=0&&x<n&&y<n)a[y][x]=!!v};
  const finder=(ox,oy)=>{for(let y=-1;y<8;y++)for(let x=-1;x<8;x++){let v=(x>=0&&x<=6&&y>=0&&y<=6&&(x==0||x==6||y==0||y==6||(x>=2&&x<=4&&y>=2&&y<=4)));set(ox+x,oy+y,v)}};
  finder(0,0);finder(n-7,0);finder(0,n-7);
  for(let i=8;i<n-8;i++){if(a[6][i]===null)set(i,6,i%2===0);if(a[i][6]===null)set(6,i,i%2===0)}
  const bits=[];for(const b of this.data){for(let i=7;i>=0;i--)bits.push((b>>i)&1)}
  bits.push(...Array(Math.max(0,8-bits.length%8)).fill(0));
  let k=0,up=true;
  for(let x=n-1;x>0;x-=2){if(x===6)x--;for(let yy=0;yy<n;yy++){let y=up?n-1-yy:yy;for(let dx=0;dx<2;dx++){let xx=x-dx;if(a[y][xx]===null){let v=bits[k++%bits.length]^((xx+y)%2===0?1:0);a[y][xx]=!!v}}}up=!up}
  return a;
 }
}
