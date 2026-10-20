// Preview only: allows a logged-in admin to authorize ONE pre-copied, published
// Rwanda photo for a 30-second private-bucket Cloudflare Worker speed test.
// Never updates GAS publication, the live app, or the Google Drive original.
import {S3Client,HeadObjectCommand,PutObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {checkR2Config,PILOT_BUCKET,PILOT_COUNTRY,PILOT_DOMAIN,isUuid,isPhotoSlot} from '../lib/r2-pilot-core.js';
import {leaseKey,gatewayPath,leasePayload,pilotKey,publishedSlotAllowed} from '../lib/r2-public-lease.js';
const GAS=/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/;
function makeClient(env){
 return new S3Client({region:'auto',endpoint:`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials:{accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY},maxAttempts:2});
}
async function gasJson(url,options={},fetcher=fetch){
 const r=await fetcher(url,{redirect:'follow',signal:AbortSignal.timeout(16000),...options});
 if(!r.ok)throw Error('GAS unavailable');
 const t=await r.text();if(t.length>200000)throw Error('Large GAS response');
 return JSON.parse(t);
}
async function verifyAdmin(endpoint,session,fetcher){
 if(typeof session!=='string'||!/^[a-f0-9]{64}$/i.test(session))return false;
 const r=await gasJson(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
  body:JSON.stringify({action:'getPublicationOrder',session,countryIso:PILOT_COUNTRY,domain:PILOT_DOMAIN})},fetcher);
 return r.ok===true&&r.data?.countryIso===PILOT_COUNTRY&&r.data?.domain===PILOT_DOMAIN&&Array.isArray(r.data?.questionIds);
}
async function checkPublished(endpoint,id,slot,fetcher){
 const u=new URL(endpoint);u.searchParams.set('action','publishedCatalog');
 u.searchParams.set('countryIso',PILOT_COUNTRY);u.searchParams.set('domain',PILOT_DOMAIN);
 const r=await gasJson(u,{},fetcher);
 return r.ok===true&&publishedSlotAllowed(r.data?.questions,id,slot);
}
export function createR2PublicPilotHandler({fetcher=fetch,createClient=makeClient,now=Date.now}={}){
 return async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(process.env.VERCEL_ENV!=='preview')return res.status(404).json({ok:false,error:'Not found'});
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'POST only'});
  const b=req.body;
  if(!b||typeof b!=='object'||Array.isArray(b)||JSON.stringify(b).length>900||
    !['lease','revoke'].includes(b.action)||!isUuid(b.questionId)||!isPhotoSlot(b.slot))
    return res.status(400).json({ok:false,error:'Invalid request'});
  const env=process.env,endpoint=env.MISSION_CREATOR_GAS_URL;
  if(!checkR2Config(env)||!GAS.test(endpoint||''))
    return res.status(503).json({ok:false,error:'Preview is not configured'});
  try{
   if(!await verifyAdmin(endpoint,b.session,fetcher))
    return res.status(403).json({ok:false,error:'管理者としてログインしてください。'});
   const client=createClient(env);
   try{
    const key=leaseKey(b.questionId,b.slot);
    if(b.action==='revoke'){
      await client.send(new DeleteObjectCommand({Bucket:PILOT_BUCKET,Key:key}));
      return res.status(200).json({ok:true,action:'revoke'});
    }
    if(!await checkPublished(endpoint,b.questionId,b.slot,fetcher))
      return res.status(404).json({ok:false,error:'公開済みの写真ではありません。'});
    // A lease cannot be created before the verified image was copied to R2.
    const image=await client.send(new HeadObjectCommand({Bucket:PILOT_BUCKET,Key:pilotKey(b.questionId,b.slot)}));
    if(!(Number(image.ContentLength)>15&&Number(image.ContentLength)<=1228800))
      return res.status(409).json({ok:false,error:'先に公開写真をR2へ試験コピーしてください。'});
    // Recheck publication just before giving public access (30 s at most).
    if(!await checkPublished(endpoint,b.questionId,b.slot,fetcher))
      return res.status(409).json({ok:false,error:'公開状態が変更されました。'});
    const expiresAt=now()+30000;
    await client.send(new PutObjectCommand({Bucket:PILOT_BUCKET,Key:key,
      Body:leasePayload(b.questionId,b.slot,expiresAt-30000),ContentType:'application/json',CacheControl:'no-store'}));
    return res.status(200).json({ok:true,action:'lease',expiresAt,gatewayPath:gatewayPath(b.questionId,b.slot)});
   }finally{client.destroy();}
  }catch(error){
   console.error('R2 gateway pilot failed',{action:b.action,kind:String(error?.name||'upstream').slice(0,50)});
   return res.status(502).json({ok:false,error:'試験アクセスの設定に失敗しました。公開状態と写真コピーを確認してください。'});
  }
 };
}
export default createR2PublicPilotHandler();
