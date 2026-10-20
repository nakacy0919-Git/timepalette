// Vercel -> TimePalette's separate Cloudflare Mission API. Never expose the bridge secret in VITE_ variables.
function endpoint(){
 const raw=String(process.env.MISSION_CREATOR_CF_API_URL||'').replace(/\/$/,'');
 if(!/^https:\/\/timepalette-mission-api\.timepalette-images\.workers\.dev$/.test(raw))throw new Error('Cloudflare API URL is not configured');
 return raw;
}
export async function cloudflareCreator(req,res){
 const b=req.body;
 if(!b||typeof b!=='object'||Array.isArray(b)||JSON.stringify(b).length>2_200_000)
  return res.status(400).json({ok:false,error:'Invalid request'});
 try{
  const secret=String(process.env.MISSION_CREATOR_CF_API_SECRET||'');
  if(secret.length<48)throw new Error('Cloudflare bridge secret is missing');
  const response=await fetch(endpoint()+'/private',{
   method:'POST',headers:{'Content-Type':'application/json','X-TP-Bridge':secret},
   body:JSON.stringify(b),signal:AbortSignal.timeout(b.action==='getMediaBatch'?30000:25000)});
  const text=await response.text();if(text.length>5_000_000)throw new Error('Cloudflare response too large');
  let data;try{data=JSON.parse(text);}catch{throw new Error('Cloudflare JSON error');}
  return res.status(response.status).json(data);
 }catch(err){console.error('TimePalette Cloudflare private API failure',{kind:String(err?.name||'network')});
  return res.status(502).json({ok:false,code:'cloudflare_unavailable',error:'教材サービスに接続できません。変更操作の場合は一覧を更新して確認してください。'});}
}
export async function cloudflarePublic(req,res){
 const action=String(req.query?.action||'catalog');
 if(!['catalog','image'].includes(action))return res.status(400).json({ok:false,error:'Invalid action'});
 const params=new URLSearchParams();
 if(action==='catalog'){
  const iso=String(req.query.country||'rw').toLowerCase(),domain=String(req.query.domain||'lifeCulture');
  if(!/^[a-z]{2}$/.test(iso)||!['place','time','language','lifeCulture','japanConnection','thinkConnect'].includes(domain))
   return res.status(400).json({ok:false,error:'Invalid scope'});
  params.set('country',iso);params.set('domain',domain);
 }else{
  const id=String(req.query.questionId||''),slot=Number(req.query.slot);
  if(!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id)||![1,2,3,4].includes(slot))
   return res.status(400).json({ok:false,error:'Invalid image'});
  params.set('questionId',id);params.set('slot',String(slot));
 }
 try{
  const response=await fetch(endpoint()+(action==='catalog'?'/public/catalog':'/public/image')+'?'+params,{
   signal:AbortSignal.timeout(15000),redirect:'error'});
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(action==='image'){
   if(!response.ok)return res.status(response.status===404?404:502).json({ok:false,error:'Image not available'});
   const size=Number(response.headers.get('content-length')||0);
   if(size>1228800)throw new Error('Image too large');
   const bytes=Buffer.from(await response.arrayBuffer());
   if(bytes.length<16||bytes.length>1228800||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')throw new Error('Invalid image');
   res.setHeader('Content-Type','image/webp');return res.status(200).send(bytes);
  }
  const data=await response.json();return res.status(response.status).json(data);
 }catch(err){console.error('TimePalette Cloudflare public API failure',{kind:String(err?.name||'network')});
  return res.status(502).json({ok:false,error:'公開問題を読み込めませんでした。'});}
}
