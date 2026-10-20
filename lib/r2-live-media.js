// TimePalette live R2 media publisher. Only published, admin-authorized assets.
import {createHash} from 'node:crypto';
import {S3Client,HeadObjectCommand,GetObjectCommand,PutObjectCommand,DeleteObjectCommand} from '@aws-sdk/client-s3';

export const GATEWAY='https://timepalette-r2-image-pilot.timepalette-images.workers.dev';
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const GAS=/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec(?:\?.*)?$/;
const DOMAIN=new Set(['place','time','language','lifeCulture','japanConnection','thinkConnect']);
const BUCKET='timepalette-public-webp';
export function liveEnabled(env=process.env){return env.R2_MEDIA_ENABLED==='true'&&/^[a-f0-9]{32}$/i.test(env.R2_ACCOUNT_ID||'')&&!!env.R2_ACCESS_KEY_ID&&!!env.R2_SECRET_ACCESS_KEY&&env.R2_BUCKET_NAME===BUCKET;}
export function validScope(id,iso,domain){return UUID.test(String(id||''))&&/^[a-z]{2}$/.test(String(iso||''))&&DOMAIN.has(domain);}
export function liveManifestKey(id){if(!UUID.test(id))throw Error('Invalid ID');return `live-v1/${id.toLowerCase()}/manifest.json`;}
export function livePath(id,iso,domain,slot){if(!validScope(id,iso,domain)||![1,2,3,4].includes(slot))throw Error('Invalid image path');return `${GATEWAY}/v2/${iso}/${domain}/${id.toLowerCase()}/P0${slot}.webp`;}
export function createMediaClient(env=process.env){if(!liveEnabled(env))throw Error('R2 not enabled');return new S3Client({region:'auto',endpoint:`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,credentials:{accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY},maxAttempts:2});}
function gasURL(endpoint,action,params){if(!GAS.test(endpoint||''))throw Error('Invalid GAS config');const u=new URL(endpoint);u.searchParams.set('action',action);for(const [k,v] of Object.entries(params||{}))u.searchParams.set(k,String(v));return u.toString();}
const redirects=new Set([301,302,303,307,308]);
function safeGoogleRedirect(text){try{const u=new URL(text);return u.protocol==='https:'&&u.hostname==='script.googleusercontent.com'&&u.pathname==='/macros/echo'?u.href:null;}catch{return null;}}
export async function gasJSON(url,options={},fetcher=fetch){
  const isRead=options.method!=='POST'||options.readOnly===true;
  for(let attempt=0;attempt<(isRead?2:1);attempt++){
    const {readOnly,...fetchOpts}=options;
    let r=await fetcher(url,{redirect:'manual',signal:AbortSignal.timeout(18000),...fetchOpts});
    for(let hop=0;redirects.has(r.status);hop++){
      if(hop>=3)throw Error('GAS redirect limit');
      const loc=safeGoogleRedirect(r.headers?.get?.('location'));
      if(!loc)throw Error('Unexpected GAS redirect');
      r=await fetcher(loc,{method:'GET',redirect:'manual',signal:AbortSignal.timeout(18000)});
    }
    const body=await r.text();
    if(body.length>2000000)throw Error('GAS response too large');
    if(isRead&&attempt===0&&r.status===404&&r.url?.startsWith('https://script.googleusercontent.com/macros/echo?')&&/^\s*</.test(body))continue;
    if(!r.ok)throw Error('Google upstream failed');
    try{return JSON.parse(body);}catch{throw Error('Google returned invalid JSON');}
  }
  throw Error('Google read failed');
}
export async function adminVerified(endpoint,session,id,iso,domain,fetcher=fetch){
  if(!validScope(id,iso,domain)||typeof session!=='string'||!/^[a-f0-9]{64}$/i.test(session))return false;
  const x=await gasJSON(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action:'getPublicationOrder',session,countryIso:iso,domain}),readOnly:true},fetcher);
  return x?.ok===true&&x.data?.countryIso===iso&&x.data?.domain===domain&&Array.isArray(x.data?.questionIds)&&x.data.questionIds.includes(id);
}
function checkWebp(base64){if(typeof base64!=='string'||base64.length>1700000||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))throw Error('Invalid image');const b=Buffer.from(base64,'base64');if(b.length<16||b.length>1228800||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WEBP')throw Error('Invalid WebP');return b;}
export async function activePhotoCatalog(endpoint,id,iso,domain,fetcher=fetch){
 const data=await gasJSON(gasURL(endpoint,'publishedCatalog',{countryIso:iso,domain}),{},fetcher);
 if(!data?.ok||!Array.isArray(data.data?.questions))throw Error('Catalog unavailable');
 return data.data.questions.find(q=>q.id===id&&q.countryIso===iso&&q.domain===domain&&['text4','photo4','photoText4'].includes(q.type))||null;
}
export async function publishMedia({id,iso,domain,endpoint,env=process.env,fetcher=fetch,createClient=createMediaClient}={}){
 if(!liveEnabled(env)||!validScope(id,iso,domain))throw Error('Media config or scope invalid');
 const q=await activePhotoCatalog(endpoint,id,iso,domain,fetcher);
 if(!q)throw Error('Not published');
 if(q.type==='text4')return {status:'text-only'};
 const slots=q.type==='photo4'?[1,2,3,4]:[1];
 if(slots.some(slot=>!q.media?.some(m=>Number(m.slot)===slot)))throw Error('Incomplete published media');
 // Fetch all from GAS concurrently. Storage is private; manifest is written LAST.
 const downloaded=await Promise.all(slots.map(async slot=>{
   const data=await gasJSON(gasURL(endpoint,'publishedPhoto',{questionId:id,slot}),{},fetcher);
   if(!data?.ok||data.data?.mime!=='image/webp')throw Error('Published photo unavailable');
   const bytes=checkWebp(data.data.base64); const hash=createHash('sha256').update(bytes).digest('hex').slice(0,20);
   return {slot,bytes,key:`live-v1/${id.toLowerCase()}/P0${slot}-${hash}.webp`};
 }));
 const client=createClient(env);
 try{
   await Promise.all(downloaded.map(({bytes,key})=>client.send(new PutObjectCommand({Bucket:BUCKET,Key:key,Body:bytes,ContentType:'image/webp',CacheControl:'no-store'}))));
   // A second published check prevents a stopped publication from being reactivated by a slow upload.
   if(!await activePhotoCatalog(endpoint,id,iso,domain,fetcher))throw Error('Publication changed during upload');
   const manifest={version:1,id:id.toLowerCase(),iso,domain,slots:Object.fromEntries(downloaded.map(({slot,key})=>[slot,key]))};
   await client.send(new PutObjectCommand({Bucket:BUCKET,Key:liveManifestKey(id),Body:JSON.stringify(manifest),ContentType:'application/json',CacheControl:'no-store'}));
   return {status:'ready',count:slots.length};
 }finally{client.destroy?.();}
}
export async function stopMedia({id,env=process.env,createClient=createMediaClient}={}){
 const client=createClient(env);try{await client.send(new DeleteObjectCommand({Bucket:BUCKET,Key:liveManifestKey(id)}));return true;}finally{client.destroy?.();}
}
export async function markCatalogReady(questions,{env=process.env,createClient=createMediaClient}={}){
 if(!liveEnabled(env)||!Array.isArray(questions))return questions;
 const photos=questions.filter(q=>validScope(q.id,q.countryIso,q.domain)&&['photo4','photoText4'].includes(q.type));
 if(!photos.length)return questions;
 const client=createClient(env); const ready=new Set();
 try{await Promise.all(photos.map(async q=>{try{const obj=await client.send(new HeadObjectCommand({Bucket:BUCKET,Key:liveManifestKey(q.id)}));if(Number(obj.ContentLength)>20)ready.add(q.id);}catch{}}));}finally{client.destroy?.();}
 return questions.map(q=>ready.has(q.id)?{...q,r2MediaBase:`${GATEWAY}/v2/${q.countryIso}/${q.domain}/${q.id.toLowerCase()}/`}:q);
}
