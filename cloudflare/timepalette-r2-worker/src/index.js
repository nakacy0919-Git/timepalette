// Cloudflare Worker: public published images, backed by PRIVATE R2.
// Existing v1 30s pilot route remains supported until pilot is retired.
const PILOT=/^\/v1\/rw\/lifeCulture\/([a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12})\/P0([1-4])\.webp$/i;
const LIVE=/^\/v2\/([a-z]{2})\/(place|time|language|lifeCulture|japanConnection|thinkConnect)\/([a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12})\/P0([1-4])\.webp$/i;
function deny(code=404){return new Response('Not found',{status:code,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'*'}});}
const mediaHeaders={'Content-Type':'image/webp','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'*','Timing-Allow-Origin':'*'};
export default {async fetch(request,env){
 if(request.method!=='GET')return deny(405);
 const path=new URL(request.url).pathname;
 const live=path.match(LIVE);
 if(live){
  const [,iso,domain,idRaw,slotText]=live,id=idRaw.toLowerCase(),slot=Number(slotText);
  try{
   // Check active manifest on EVERY request, so stopping publication removes access.
   const record=await env.MEDIA.get(`live-v1/${id}/manifest.json`);
   if(!record||record.size>4000)return deny();
   const m=await record.json();
   if(m?.version!==1||m?.id!==id||m?.iso!==iso||m?.domain!==domain)return deny();
   const key=m?.slots?.[String(slot)];
   const expected=new RegExp('^live-v1/'+id+'/P0'+slot+'-[a-f0-9]{20}\\.webp$');
   if(typeof key!=='string'||!expected.test(key))return deny();
   const object=await env.MEDIA.get(key);
   if(!object||object.size<16||object.size>1228800)return deny();
   return new Response(object.body,{status:200,headers:mediaHeaders});
  }catch{return deny(502);}
 }
 const pilot=path.match(PILOT);
 if(pilot){
  const id=pilot[1].toLowerCase(),slot=Number(pilot[2]);
  try{
   const leaseObj=await env.MEDIA.get(`pilot-leases/${id}/P0${slot}.json`);
   if(!leaseObj)return deny();
   const lease=await leaseObj.json();
   if(lease?.id!==id||lease.slot!==slot||!Number.isFinite(lease.expiresAt)||lease.expiresAt<=Date.now()||lease.expiresAt>Date.now()+31000)return deny();
   const image=await env.MEDIA.get(`pilot/${id}/P0${slot}.webp`);
   if(!image||image.size<16||image.size>1228800)return deny();
   return new Response(image.body,{status:200,headers:mediaHeaders});
  }catch{return deny(502);}
 }
 return deny();
}};
