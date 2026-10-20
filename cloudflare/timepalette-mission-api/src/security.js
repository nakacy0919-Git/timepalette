// WebCrypto-compatible password and token primitives. No passwords in logs or SQL dumps.
const enc = new TextEncoder();
export const HEX_64 = /^[0-9a-f]{64}$/i;
export const UUID = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
export const DOMAINS = ['place','time','language','lifeCulture','japanConnection','thinkConnect'];
export const TYPES = ['text4','photo4','photo1','photoText4','free','web'];
export function hex(bytes){return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');}
export function randomHex(n=32){return hex(crypto.getRandomValues(new Uint8Array(n)));}
export async function sha256(value){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',typeof value==='string'?enc.encode(value):value)));}
export async function derivePassword(password,salt,iterations=180000){
  const key=await crypto.subtle.importKey('raw',enc.encode(password),'PBKDF2',false,['deriveBits']);
  const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:Uint8Array.from(salt.match(/.{2}/g).map(x=>parseInt(x,16))),iterations,hash:'SHA-256'},key,256);
  return hex(new Uint8Array(bits));
}
export function passwordValid(password){return typeof password==='string' && password.length>=12 && password.length<=128;}
export function isoValid(x){return typeof x==='string'&&/^[a-z]{2}$/.test(x);}
export function domainValid(x){return DOMAINS.includes(x);}
export function response(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
export function ok(data){return response({ok:true,data});}
export class ApiFault extends Error{constructor(message,status=400){super(message);this.status=status;}}
export function requireThat(assertion,mes,status=400){if(!assertion)throw new ApiFault(mes,status);}
export function parseArray(str){try{const p=JSON.parse(str||'[]');return Array.isArray(p)?p:[];}catch{return [];}}
export function now(){return new Date().toISOString();}
export function safeAccount(s){return String(s||'').trim().slice(0,80);}
export function checkScope(iso,domain){requireThat(isoValid(iso)&&domainValid(domain),'国・カテゴリーを確認してください。');}
