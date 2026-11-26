import {DurableObject} from 'cloudflare:workers';
import {getGeography197CountryCodes,getGeography197Profile} from '../../../src/utils/geography197.js';
import {makeLocalGameBank} from '../../../src/utils/worldGameBank.js';
import {questionPool} from '../../../src/utils/worldGameEngine.js';
import {localizeQuestion} from '../../../src/utils/worldGameLanguage.js';
import {createRecord,roomRequest,validateConfig,roomCode,digest,validToken} from './roomService.js';

const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const error=(status,code)=>json({error:code},status);
const bearer=r=>r.headers.get('Authorization')?.match(/^Bearer ([0-9a-f]{48})$/)?.[1];
async function body(request){
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))throw Error('content_type');
 if(Number(request.headers.get('Content-Length')||0)>8192)throw Error('too_large');
 const reader=request.body?.getReader();if(!reader)throw Error('missing_body');
 let size=0;const chunks=[];
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>8192){await reader.cancel();throw Error('too_large');}chunks.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 return JSON.parse(new TextDecoder().decode(bytes));
}
let bank;
function serverQuestions(config){
 bank??=makeLocalGameBank(getGeography197CountryCodes().map(iso=>({iso,nameJa:getGeography197Profile(iso).nameJa})));
 return questionPool(bank,config.countries,config.domains).map(q=>localizeQuestion(q,config.language)).filter(Boolean);
}
export class BattleRoom extends DurableObject{
 async fetch(request){
  const op=new URL(request.url).pathname.slice(1),now=Date.now();
  if(request.method!=='POST')return error(405,'method');
  if(op==='create'){
   let config;try{config=validateConfig(await body(request));}catch{return error(400,'invalid_json');}
   if(!config)return error(400,'invalid_config');
   const questions=serverQuestions(config);if(!questions.length)return error(400,'no_questions');
   const made=await createRecord(config,questions,now);
   return this.ctx.blockConcurrencyWhile(async()=>{
    const old=await this.ctx.storage.get('room');if(old&&old.expiresAt>now)return error(409,'collision');
    await this.ctx.storage.setAlarm(made.record.expiresAt);
    await this.ctx.storage.put('room',made.record);
    return json({...made.credentials,view:made.view,serverTime:now},201);
   });
  }
  const secret=bearer(request);if(!validToken(secret))return error(403,'invalid_credentials');
  const actor=await digest(secret);
  let payload={};if(op==='action'){try{payload=await body(request);}catch{return error(400,'invalid_json');}}
  return this.ctx.blockConcurrencyWhile(async()=>{
   const old=await this.ctx.storage.get('room');
   const current=Date.now();
   if(old&&current>=old.expiresAt){await this.ctx.storage.deleteAll();return error(404,'room_unavailable');}
   const out=roomRequest(old,actor,op,payload,current);
   if(out.record!==old){if(out.record)await this.ctx.storage.put('room',out.record);else await this.ctx.storage.deleteAll();}
   return json(out.data,out.status);
  });
 }
 async alarm(){
  await this.ctx.blockConcurrencyWhile(async()=>{
   const record=await this.ctx.storage.get('room');
   if(!record||Date.now()>=record.expiresAt)await this.ctx.storage.deleteAll();
   else await this.ctx.storage.setAlarm(record.expiresAt);
  });
 }
}
function cors(response,origin){
 const headers=new Headers(response.headers);headers.set('Vary','Origin');
 if(origin){headers.set('Access-Control-Allow-Origin',origin);headers.set('Access-Control-Allow-Methods','POST, OPTIONS');headers.set('Access-Control-Allow-Headers','Authorization, Content-Type, X-Battle-Create-Key');headers.set('Access-Control-Max-Age','600');}
 return new Response(response.body,{status:response.status,headers});
}
export default {
 async fetch(request,env){
  // Fail closed until the operator explicitly enables and configures the pilot.
  if(env.BATTLE_ENABLED!=='true'||typeof env.BATTLE_CREATE_KEY!=='string'||env.BATTLE_CREATE_KEY.length<32||!env.BATTLE_ALLOWED_ORIGINS)return error(503,'disabled');
  const origin=request.headers.get('Origin');
  const allowed=env.BATTLE_ALLOWED_ORIGINS.split(',').map(s=>s.trim());
  if(!origin||!allowed.includes(origin))return error(403,'origin');
  if(request.method==='OPTIONS')return cors(new Response(null,{status:204}),origin);
  if(request.method!=='POST')return cors(error(405,'method'),origin);
  const path=new URL(request.url).pathname;
  try{
   if(path==='/rooms'){
    const key=request.headers.get('X-Battle-Create-Key')||'';
    if(key.length>256||await digest(key)!==await digest(env.BATTLE_CREATE_KEY))return cors(error(403,'create_forbidden'),origin);
    const config=validateConfig(await body(request));if(!config)return cors(error(400,'invalid_config'),origin);
    for(let i=0;i<4;i++){
     const code=roomCode();
     const stub=env.BATTLE_ROOMS.get(env.BATTLE_ROOMS.idFromName(code));
     const res=await stub.fetch('https://internal/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(config)});
     if(res.status===409)continue;
     const data=await res.json();
     return cors(json(res.ok?{code,...data}:data,res.status),origin);
    }
    return cors(error(503,'room_creation_failed'),origin);
   }
   const match=/^\/rooms\/([0-9A-F]{8})\/(join|view|action|close)$/.exec(path);
   if(!match)return cors(error(404,'not_found'),origin);
   if(!validToken(bearer(request)))return cors(error(403,'invalid_credentials'),origin);
   const stub=env.BATTLE_ROOMS.get(env.BATTLE_ROOMS.idFromName(match[1]));
   const headers={'Authorization':request.headers.get('Authorization')};
   let payload;
   if(match[2]==='action'){headers['Content-Type']='application/json';payload=JSON.stringify(await body(request));}
   return cors(await stub.fetch('https://internal/'+match[2],{method:'POST',headers,body:payload}),origin);
  }catch{return cors(error(400,'request_failed'),origin);}
 }
};
