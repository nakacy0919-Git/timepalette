import {get,put,BlobPreconditionFailedError} from '@vercel/blob';
import {createRoom,newCode,validCode,validToken,roomRequest} from '../lib/journey-relay-core.js';

const path=code=>'journey-rooms/v3/'+code+'.json';
const snapshotPath=(code,room)=>'journey-rooms/v3-state/'+code+'-'+room.host+'.json';
async function readPath(key){
 const result=await get(key,{access:'private',useCache:false});
 if(!result)return null;
 return {record:JSON.parse(await new Response(result.stream).text()),etag:result.blob.etag};
}
const read=code=>readPath(path(code));
async function write(code,record,etag){
 return put(path(code),JSON.stringify(record),{access:'private',contentType:'application/json',addRandomSuffix:false,...(etag?{ifMatch:etag}:{allowOverwrite:false})});
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');
 res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'method'});
 const origin=req.headers.origin;
 if(origin&&origin!=='https://'+req.headers.host&&origin!=='http://'+req.headers.host)return res.status(403).json({ok:false,error:'origin'});
 const b=req.body;
 if(!b||typeof b!=='object'||Array.isArray(b)||JSON.stringify(b).length>270000||!validToken(b.token))return res.status(400).json({ok:false,error:'invalid_request'});
 try{
  if(b.op==='create'){
   for(let i=0;i<5;i++){
    const code=newCode(),record=createRoom(code,b.token,b.teamCount);
    if(!record)return res.status(400).json({ok:false,error:'invalid_config'});
    const old=await read(code);
    if(old&&!old.record.closed&&old.record.expires>Date.now())continue;
    try{await write(code,record,old?.etag);return res.status(201).json({ok:true,code,teamCount:record.teamCount,people:[],role:'host',team:null,status:'ready',actions:[]});}
    catch(e){if(e instanceof BlobPreconditionFailedError||String(e.message).includes('already exists'))continue;throw e;}
   }
   return res.status(503).json({ok:false,error:'busy'});
  }
  if(!validCode(b.code))return res.status(400).json({ok:false,error:'invalid_code'});
  for(let i=0;i<6;i++){
   const old=await read(b.code);
   const record=old?.record;
   if(!record||record.closed||record.expires<=Date.now())return res.status(404).json({ok:false,error:'room_unavailable'});
   // State has one writer (the host); roster and action queue retain conditional writes.
   // Avoid conflicting state writes with guest join/answer traffic.
   const state=await readPath(snapshotPath(b.code,record));
   const current={...record,snapshot:state?.record??null};
   const out=roomRequest(current,b);
   if(!out.record)return res.status(out.status).json(out.data);
   if(b.op==='publish'){
    await put(snapshotPath(b.code,record),JSON.stringify(out.record.snapshot),{access:'private',contentType:'application/json',addRandomSuffix:false,allowOverwrite:true});
    return res.status(out.status).json(out.data);
   }
   try{await write(b.code,{...out.record,snapshot:null},old.etag);return res.status(out.status).json(out.data);}
   catch(e){if(e instanceof BlobPreconditionFailedError)continue;throw e;}
  }
  return res.status(409).json({ok:false,error:'busy'});
 }catch{return res.status(503).json({ok:false,error:'relay_unavailable'});}
}
