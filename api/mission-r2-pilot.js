/* Private R2 photo migration pilot. Never expose this route in production.
 * Checks admin identity via existing GAS first; only Rwanda published photos
 * can be copied. Does NOT update the app's photo URLs, database or permissions.
 */
import { createHash } from 'node:crypto';
import {
  S3Client, HeadBucketCommand, HeadObjectCommand, PutObjectCommand,
  GetObjectCommand, DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  PILOT_COUNTRY, PILOT_DOMAIN, PILOT_BUCKET, checkR2Config,
  isUuid, isPhotoSlot, pilotKey, publishedSlotAllowed, validateWebp,
} from '../lib/r2-pilot-core.js';

const GAS_RE = /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/;
const MAX_JSON = 2_000_000;
function elapsed(start){return Math.round(performance.now()-start);}
function digest(bytes){return createHash('sha256').update(bytes).digest('hex');}
function makeGasUrl(endpoint,action,query={}){
  const url=new URL(endpoint);
  url.searchParams.set('action',action);
  for(const [key,value] of Object.entries(query))url.searchParams.set(key,String(value));
  return url;
}
async function gasGet(endpoint,action,query){
  const response=await fetch(makeGasUrl(endpoint,action,query),{
    redirect:'follow',signal:AbortSignal.timeout(16000)});
  if(!response.ok)throw new Error('GAS upstream unavailable');
  const raw=await response.text();
  if(raw.length>MAX_JSON)throw new Error('GAS response too large');
  const obj=JSON.parse(raw);
  if(!obj?.ok)throw new Error('Source photo not available');
  return obj.data;
}
async function verifyAdmin(endpoint,session){
  if(typeof session!=='string'||!/^[0-9a-f]{64}$/i.test(session))return false;
  const response=await fetch(endpoint,{
    method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({action:'getPublicationOrder',session,
      countryIso:PILOT_COUNTRY,domain:PILOT_DOMAIN}),
    redirect:'follow',signal:AbortSignal.timeout(16000),
  });
  if(!response.ok)return false;
  const raw=await response.text();
  if(raw.length>100000)return false;
  const obj=JSON.parse(raw);
  return obj?.ok===true && obj.data?.countryIso===PILOT_COUNTRY &&
    obj.data?.domain===PILOT_DOMAIN && Array.isArray(obj.data?.questionIds);
}
function clientFromEnv(env){
  return new S3Client({
    region:'auto',endpoint:`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials:{accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY},
    maxAttempts:2,
  });
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(process.env.VERCEL_ENV!=='preview')return res.status(404).json({ok:false,error:'Not found'});
  if(req.method!=='POST')return res.status(405).json({ok:false,error:'POST only'});
  const body=req.body;
  if(!body||typeof body!=='object'||Array.isArray(body)||JSON.stringify(body).length>1500)
    return res.status(400).json({ok:false,error:'Invalid request'});
  const action=body.action;
  if(!['check','copy','read','delete'].includes(action))
    return res.status(400).json({ok:false,error:'Invalid action'});
  const env=process.env;
  if(!checkR2Config(env)||!GAS_RE.test(env.MISSION_CREATOR_GAS_URL||''))
    return res.status(503).json({ok:false,error:'Preview R2/GAS configuration is incomplete'});
  try{
    // Every action, including connection test, requires a live admin session.
    if(!await verifyAdmin(env.MISSION_CREATOR_GAS_URL,body.session))
      return res.status(403).json({ok:false,error:'管理者としてプレビューにログインしてください。'});
    if(action!=='check' && (!isUuid(body.questionId)||!isPhotoSlot(body.slot)))
      return res.status(400).json({ok:false,error:'Invalid photo selection'});
    const client=clientFromEnv(env), start=performance.now();
    try{
      if(action==='check'){
        await client.send(new HeadBucketCommand({Bucket:PILOT_BUCKET}));
        return res.status(200).json({ok:true,action,latencyMs:elapsed(start),bucketReady:true});
      }
      const id=body.questionId,slot=body.slot,key=pilotKey(id,slot);
      if(action==='copy'){
        // Never copy drafts or photos not present in an authorized published catalog.
        const catalog=await gasGet(env.MISSION_CREATOR_GAS_URL,'publishedCatalog',
          {countryIso:PILOT_COUNTRY,domain:PILOT_DOMAIN});
        if(!publishedSlotAllowed(catalog?.questions,id,slot))
          return res.status(404).json({ok:false,error:'公開済みの写真が見つかりません。'});
        const data=await gasGet(env.MISSION_CREATOR_GAS_URL,'publishedPhoto',
          {questionId:id,slot});
        if(data?.mime!=='image/webp'||typeof data.base64!=='string'||data.base64.length>1700000)
          throw new Error('Invalid GAS image payload');
        const bytes=validateWebp(Buffer.from(data.base64,'base64'));
        // Check publication again immediately before copying; not a permanent authorization.
        const latest=await gasGet(env.MISSION_CREATOR_GAS_URL,'publishedCatalog',
          {countryIso:PILOT_COUNTRY,domain:PILOT_DOMAIN});
        if(!publishedSlotAllowed(latest?.questions,id,slot))
          return res.status(409).json({ok:false,error:'公開状態が変更されました。'});
        await client.send(new PutObjectCommand({Bucket:PILOT_BUCKET,Key:key,
          Body:bytes,ContentType:'image/webp',CacheControl:'private, no-store',
          Metadata:{'pilot':'true'}}));
        return res.status(200).json({ok:true,action,bytes:bytes.length,
          sha256:digest(bytes),latencyMs:elapsed(start)});
      }
      if(action==='read'){
        const object=await client.send(new GetObjectCommand({Bucket:PILOT_BUCKET,Key:key}));
        const chunks=await object.Body.transformToByteArray();
        const bytes=validateWebp(Buffer.from(chunks));
        return res.status(200).json({ok:true,action,bytes:bytes.length,
          sha256:digest(bytes),latencyMs:elapsed(start)});
      }
      await client.send(new DeleteObjectCommand({Bucket:PILOT_BUCKET,Key:key}));
      return res.status(200).json({ok:true,action,deleted:true,latencyMs:elapsed(start)});
    }finally{client.destroy();}
  }catch(error){
    // No credentials, GAS IDs, private file IDs, URLs, or stack traces in responses.
    const status=error?.name==='NoSuchKey'?404:502;
    console.error('R2 pilot operation failed',{action,
      category:String(error?.name||'upstream').slice(0,60)});
    return res.status(status).json({ok:false,error:status===404
      ?'R2の試験写真がまだありません。先にコピーしてください。'
      :'R2またはGASとの通信に失敗しました。設定や公開状態を確認してください。'});
  }
}
