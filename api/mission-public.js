import {liveEnabled,markCatalogReady} from '../lib/r2-live-media.js';
import {cloudflarePublic} from '../lib/timepalette-cloudflare-proxy.js';
// Read-only published questions and photos. No Sheets ID, Drive file ID or teacher session leaks.
import {isPreviewR2Request,readPreviewR2IfPublished,PREVIEW_CDN_TTL_SECONDS} from '../lib/r2-preview-photo.js';
const GOOGLE_URL_PATTERN=/^https:\/\/script\.google\.com\/macros\/s\//;
const PUBLIC_DOMAINS=new Set(['place','time','language','lifeCulture','japanConnection','thinkConnect']);
function sendPreviewTimings(req,res,stats,started){
  if(process.env.VERCEL_ENV!=='preview'||!req.query?.bench)return;
  // Numeric durations only; no server IDs, keys, credentials, question text, or URLs.
  const timing = [
    `publication;dur=${Number(stats.publishedMs||0)}`,
    `r2;dur=${Number(stats.r2Ms||0)}`,
    `gasPhoto;dur=${Number(stats.gasPhotoMs||0)}`,
    `server;dur=${Math.round(performance.now()-started)}`,
  ];
  res.setHeader('Server-Timing',timing.join(', '));
  if(stats.publishedCacheHit!==undefined){
    res.setHeader('X-TimePalette-Auth-Cache',stats.publishedCacheHit?'HIT':'MISS');
  }
}
export function createMissionPublicHandler({r2Reader=readPreviewR2IfPublished}={}) {
  return async function handler(req,res){
  const started=performance.now(),stats={};
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'GET only'});
  if(process.env.MISSION_CREATOR_BACKEND==='cloudflare')return cloudflarePublic(req,res);
  const action=String(req.query.action||'catalog');
  const iso=String(req.query.country||'rw').toLowerCase();
  const domain=String(req.query.domain||'lifeCulture');
  if(!['catalog','image'].includes(action) ||
     (action==='catalog' && (!/^[a-z]{2}$/.test(iso)||!PUBLIC_DOMAINS.has(domain))))
    return res.status(400).json({ok:false,error:'Unsupported public scope'});
  const endpoint=process.env.MISSION_CREATOR_GAS_URL;
  if(!endpoint||!GOOGLE_URL_PATTERN.test(endpoint))
    return res.status(503).json({ok:false,error:'Public missions are not configured'});
  const url=new URL(endpoint);
  url.searchParams.set('action',action==='catalog'?'publishedCatalog':'publishedPhoto');
  let questionId,slot;
  if(action==='catalog'){
    url.searchParams.set('countryIso',iso);url.searchParams.set('domain',domain);
  }else{
    questionId=String(req.query.questionId||'');slot=Number(req.query.slot);
    if(!/^[a-f0-9-]{36}$/i.test(questionId)||![1,2,3,4].includes(slot))
      return res.status(400).json({ok:false,error:'Invalid image request'});
    url.searchParams.set('questionId',questionId);url.searchParams.set('slot',String(slot));
  }
  // R2 is an opt-in preview benchmark ONLY; other requests use the original GAS path.
  // Even for R2, the public GAS catalog is checked first for current publication.
  if(action==='image' && isPreviewR2Request(req.query,process.env)){
    try {
      const bytes=await r2Reader({endpoint,questionId,slot,env:process.env,timings:stats});
      if(bytes){
        res.setHeader('Content-Type','image/webp');
        // 15s authorization + 12s CDN <= the earlier 30s revocation allowance.
        res.setHeader('Cache-Control',`public, s-maxage=${PREVIEW_CDN_TTL_SECONDS}, max-age=0`);
        res.setHeader('X-TimePalette-Image-Source','r2');
        sendPreviewTimings(req,res,stats,started);
        return res.status(200).send(bytes);
      }
    }catch(_){
      // Missing R2 object or an upstream fault: fall back to publication-checked GAS.
      // Never return private R2 contents on a failed publication check.
    }
  }
  try{
    const gasStart=performance.now();
    const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(22000)});
    if(!response.ok)throw new Error('GAS status');
    const txt=await response.text();
    stats.gasPhotoMs=Math.round(performance.now()-gasStart);
    if(txt.length>2_000_000)throw new Error('Response too large');
    let payload;try{payload=JSON.parse(txt);}catch{throw new Error('Invalid JSON');}
    if(!payload?.ok) return res.status(404).json({ok:false,error:'Not available'});
    if(action==='catalog'){
      if(!Array.isArray(payload?.data?.questions))throw new Error('Invalid catalog');
      const questions=liveEnabled()?await markCatalogReady(payload.data.questions).catch(()=>payload.data.questions):payload.data.questions;
      res.setHeader('Cache-Control','public, s-maxage=5, max-age=0');
      return res.status(200).json({ok:true,questions});
    }
    const data=payload?.data;
    if(!data||data.mime!=='image/webp'||typeof data.base64!=='string'||
       data.base64.length>1_700_000||!/^[A-Za-z0-9+/]+={0,2}$/.test(data.base64))
      throw new Error('Invalid image data');
    const bytes=Buffer.from(data.base64,'base64');
    if(bytes.length>1_228_800||bytes.toString('ascii',0,4)!=='RIFF'||
       bytes.toString('ascii',8,12)!=='WEBP')throw new Error('Invalid WebP');
    // A stopped publication can remain CDN-cached briefly (s-maxage=30).
    res.setHeader('Content-Type','image/webp');
    res.setHeader('Cache-Control','public, s-maxage=30, max-age=0');
    if(action==='image')res.setHeader('X-TimePalette-Image-Source','gas');
    sendPreviewTimings(req,res,stats,started);
    return res.status(200).send(bytes);
  }catch(_){return res.status(502).json({ok:false,error:'公開ミッションの読み込みに失敗しました。しばらくして再試行してください。'});}
}
}
export default createMissionPublicHandler();
