// Cloudflare Worker: public GET of a *previously published* Rwanda canary photo
// only while its 30-second admin lease is valid. The underlying bucket stays PRIVATE.
// No GAS requests, API keys, or browser tokens are required by this Worker.
const ROUTE=/^\/v1\/rw\/lifeCulture\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\/P0([1-4])\.webp$/i;
function deny(status=404){return new Response('Not found',{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Access-Control-Allow-Origin':'*'}});}
export default {
 async fetch(request,env){
  if(request.method!=='GET')return deny(405);
  const path=new URL(request.url).pathname;
  const match=path.match(ROUTE);
  if(!match)return deny();
  const id=match[1].toLowerCase(),slot=Number(match[2]);
  try{
   const k=`pilot-leases/${id}/P0${slot}.json`;
   const granted=await env.MEDIA.get(k);
   if(!granted)return deny();
   const lease=await granted.json();
   if(lease?.id!==id||lease?.slot!==slot||!Number.isFinite(lease.expiresAt)||
      lease.expiresAt<=Date.now()||lease.expiresAt>Date.now()+31000)return deny();
   const image=await env.MEDIA.get(`pilot/${id}/P0${slot}.webp`);
   if(!image||image.size<16||image.size>1228800)return deny();
   // Do not cache public replies: revocation and lease expiry take effect on next request.
   return new Response(image.body,{status:200,headers:{
      'Content-Type':'image/webp','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
      'Access-Control-Allow-Origin':'*','Timing-Allow-Origin':'*'
   }});
  }catch(_){return deny(502);}
 }
};
