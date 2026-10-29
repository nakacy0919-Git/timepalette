// Preview-only Rwanda R2 Worker lease API. No production or GAS data mutations.
// Admin and published-photo checks are independent read-only GAS operations:
// start them together and authorize a SHORT (30-second) Worker lease only if both succeed.
import {S3Client,HeadObjectCommand,PutObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';
import {checkR2Config,PILOT_BUCKET,PILOT_COUNTRY,PILOT_DOMAIN,isUuid,isPhotoSlot} from '../lib/r2-pilot-core.js';
import {leaseKey,gatewayPath,leasePayload,pilotKey,publishedSlotAllowed} from '../lib/r2-public-lease.js';

const GAS=/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/;
const REDIRECTS = new Set([301,302,303,307,308]);
function makeClient(env){
  return new S3Client({region:'auto',endpoint:`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials:{accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY},maxAttempts:2});
}
function safeContentLocation(location){
  if(typeof location!=='string')return null;
  try {
    const u=new URL(location);
    if(u.protocol!=='https:'||u.hostname!=='script.googleusercontent.com'||u.pathname!=='/macros/echo')return null;
    return u.href;
  }catch{return null;}
}
// Only call this function with the two read-only GAS actions below. Never forward
// session-bearing POST to googleusercontent.com: redirect targets receive GET only.
export async function readOnlyGasJson(url,options={},fetcher=fetch){
  const signal=AbortSignal.timeout(15000); // bounded TOTAL budget including the fallback
  for(let attempt=0;attempt<2;attempt++){
    let r=await fetcher(url,{...options,redirect:'manual',signal});
    for(let hop=0;REDIRECTS.has(r.status);hop++){
      if(hop>=3)throw Error('Too many GAS redirects');
      const redirect=safeContentLocation(r.headers?.get?.('location'));
      if(!redirect)throw Error('Unsafe GAS redirect');
      r=await fetcher(redirect,{method:'GET',redirect:'manual',signal});
    }
    const text=await r.text();
    if(text.length>200000)throw Error('Large GAS response');
    // A transient one-time ContentService URL can return an HTML 404. Retry the
    // original READ-ONLY operation once; JSON business denials are never retried.
    if(attempt===0&&r.status===404&&
      r.url?.startsWith('https://script.googleusercontent.com/macros/echo?')&&
      /^\s*</.test(text))continue;
    if(!r.ok)throw Error('GAS read failed');
    try{return JSON.parse(text);}catch{throw Error('Invalid GAS JSON');}
  }
  throw Error('GAS read unavailable');
}
async function verifyAdmin(endpoint,session,fetcher){
  if(typeof session!=='string'||!/^[a-f0-9]{64}$/i.test(session))return false;
  const r=await readOnlyGasJson(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},
    body:JSON.stringify({action:'getPublicationOrder',session,countryIso:PILOT_COUNTRY,domain:PILOT_DOMAIN})},fetcher);
  return r.ok===true&&r.data?.countryIso===PILOT_COUNTRY&&r.data?.domain===PILOT_DOMAIN&&Array.isArray(r.data?.questionIds);
}
async function checkPublished(endpoint,id,slot,fetcher){
  const u=new URL(endpoint);u.searchParams.set('action','publishedCatalog');
  u.searchParams.set('countryIso',PILOT_COUNTRY);u.searchParams.set('domain',PILOT_DOMAIN);
  const r=await readOnlyGasJson(u,{},fetcher);
  return r.ok===true&&publishedSlotAllowed(r.data?.questions,id,slot);
}
function atStage(p,stage){
  return p.catch(cause=>{const error=new Error('GAS stage failed',{cause});error.stage=stage;
    error.kind=String(cause?.name||'upstream').slice(0,32);throw error;});
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
    if(typeof b.session!=='string'||!/^[a-f0-9]{64}$/i.test(b.session))
      return res.status(403).json({ok:false,error:'管理者としてログインしてください。'});
    let stage='authorization';
    try{
      const adminPromise=atStage(verifyAdmin(endpoint,b.session,fetcher),'admin');
      const publicationPromise=b.action==='lease'
        ?atStage(checkPublished(endpoint,b.questionId,b.slot,fetcher),'catalog')
        :Promise.resolve(null);
      // Parallel GAS reads avoid two or three serial multi-second waits.
      const [admin,published]=await Promise.all([adminPromise,publicationPromise]);
      if(!admin)return res.status(403).json({ok:false,error:'管理者としてログインしてください。'});
      if(b.action==='lease'&&!published)return res.status(404).json({ok:false,error:'公開済みの写真ではありません。'});
      const client=createClient(env);
      try{
        const key=leaseKey(b.questionId,b.slot);
        if(b.action==='revoke'){
          stage='r2-revoke';
          await client.send(new DeleteObjectCommand({Bucket:PILOT_BUCKET,Key:key}));
          return res.status(200).json({ok:true,action:'revoke'});
        }
        stage='r2-photo';
        const image=await client.send(new HeadObjectCommand({Bucket:PILOT_BUCKET,Key:pilotKey(b.questionId,b.slot)}));
        if(!(Number(image.ContentLength)>15&&Number(image.ContentLength)<=1228800))
          return res.status(409).json({ok:false,error:'先に公開写真をR2へ試験コピーしてください。'});
        // The catalog check is request-local (not cached); a 30s lease is the
        // deliberately bounded exposure. The Worker rechecks its expiry on every GET.
        stage='r2-lease';
        const expiresAt=now()+30000;
        await client.send(new PutObjectCommand({Bucket:PILOT_BUCKET,Key:key,
          Body:leasePayload(b.questionId,b.slot,expiresAt-30000),
          ContentType:'application/json',CacheControl:'no-store'}));
        return res.status(200).json({ok:true,action:'lease',expiresAt,gatewayPath:gatewayPath(b.questionId,b.slot)});
      }finally{client.destroy();}
    }catch(error){
      const failedStage=error?.stage||stage;
      const kind=error?.kind||String(error?.name||'upstream').slice(0,32);
      const timeout=kind==='TimeoutError'||kind==='AbortError';
      console.error('R2 gateway pilot failed',{action:b.action,stage:failedStage,kind});
      const part=failedStage==='admin'?'管理者確認':failedStage==='catalog'?'公開状態の確認':'R2との通信';
      return res.status(timeout?504:502).json({ok:false,code:timeout?'upstream_timeout':'upstream_failure',
        error:part+'に失敗しました。'+(timeout?'Googleの応答が遅いため、時間をおいて再試行してください。':'時間をおいて再試行してください。')});
    }
  };
}
export default createR2PublicPilotHandler();
