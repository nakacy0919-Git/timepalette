import {createHash,randomInt,timingSafeEqual} from 'node:crypto';

export const TTL=90*60*1000;
export const validCode=x=>typeof x==='string'&&/^\d{6}$/.test(x);
export const validToken=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
export const newCode=()=>String(randomInt(1000000)).padStart(6,'0');
export const hashToken=x=>createHash('sha256').update(x).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const error=(status,error)=>({status,data:{ok:false,error}});
const ok=(data,record)=>({status:200,data:{ok:true,...data},record});
const roster=r=>r.people.map(({id,team,approved})=>({id,team,approved,name:'チーム端末 '+id}));
const view=(r,actor)=>({code:r.code,teamCount:r.teamCount,people:roster(r),role:actor?'guest':'host',team:actor?.team??null,status:actor&&!actor.approved?'waiting':'ready',snapshot:!actor?null:actor.approved?r.snapshot:null,actions:actor?[]:r.actions});
export function createRoom(code,token,teamCount,now=Date.now()){
 if(!validCode(code)||!validToken(token)||!Number.isInteger(teamCount)||teamCount<2||teamCount>8)return null;
 return {code,host:hashToken(token),teamCount,people:[],snapshot:null,actions:[],expires:now+TTL};
}
export function roomRequest(r,body,now=Date.now()){
 if(!r||r.expires<=now||r.closed)return error(404,'room_unavailable');
 if(!validToken(body.token))return error(403,'invalid_token');
 const hash=hashToken(body.token),host=equal(hash,r.host),actor=r.people.find(p=>equal(p.hash,hash));
 if(body.op==='join'){
  if(actor)return ok(view(r,actor));
  if(host||r.snapshot||r.people.length>=r.teamCount-1)return error(409,'room_full');
  const p={id:Math.max(0,...r.people.map(x=>x.id))+1,hash,team:null,approved:false};
  const next={...r,people:[...r.people,p]};
  return ok(view(next,p),next);
 }
 if(!host&&!actor)return error(403,'invalid_token');
 if(body.op==='poll')return ok(view(r,actor));
 if(body.op==='close'&&host)return ok({}, {...r,closed:true,people:[],snapshot:null,actions:[]});
 if(body.op==='leave'&&actor){
  return ok({}, {...r,people:r.people.filter(p=>p!==actor),actions:r.actions.filter(a=>a.team!==actor.team)});
 }
 if(body.op==='approve'&&host&&!r.snapshot){
  const p=r.people.find(x=>x.id===body.id&&!x.approved);
  if(!p)return ok(view(r,null));
  const used=new Set(r.people.map(x=>x.team)),team=Array.from({length:r.teamCount-1},(_,i)=>i+1).find(x=>!used.has(x));
  if(team===undefined)return error(409,'room_full');
  const next={...r,people:r.people.map(x=>x===p?{...x,team,approved:true}:x)};
  return ok(view(next,null),next);
 }
 if(body.op==='publish'&&host){
  const s=body.snapshot;
  if(!s||!Number.isSafeInteger(s.seq)||s.seq<1||s.game?.mode!=='journey'||s.game.teams?.length!==r.teamCount||!Array.isArray(s.game.route)||s.game.route.length>197||JSON.stringify(s).length>250000)return error(400,'invalid_snapshot');
  if(!r.snapshot&&r.people.filter(p=>p.approved).length!==r.teamCount-1)return error(409,'room_not_ready');
  if(r.snapshot&&s.seq<=r.snapshot.seq)return ok(view(r,null));
  const next={...r,snapshot:s};
  return ok(view(next,null),next);
 }
 if(body.op==='ack'&&host&&Array.isArray(body.ids)){
  const ids=new Set(body.ids.slice(0,32)),next={...r,actions:r.actions.filter(a=>!ids.has(a.id))};
  return ok(view(next,null),next.actions.length===r.actions.length?undefined:next);
 }
 if(body.op==='action'&&actor?.approved&&r.snapshot){
  const a=body.action,g=r.snapshot.game;
  if(!a||!['roll','answer','next','buy'].includes(a.type)||typeof body.id!=='string'||!/^[a-z0-9-]{8,64}$/.test(body.id))return error(400,'invalid_action');
  if(r.snapshot.roll||g.turn!==actor.team||a.round!==g.round||a.phase!==g.phase)return error(409,'stale_action');
  if(r.actions.some(x=>x.id===body.id))return ok({});
  if(r.actions.length>=32)return error(409,'queue_full');
  const action={type:a.type,round:a.round,phase:a.phase,index:a.index,travel:a.travel,item:typeof a.item==='string'?a.item.slice(0,80):undefined};
  if(action.type==='answer'&&(!Number.isInteger(action.index)||action.index< -1||action.index>3))return error(400,'invalid_action');
  if(action.type==='roll'&&!['standard','rail','air'].includes(action.travel))return error(400,'invalid_action');
  const next={...r,actions:[...r.actions,{id:body.id,team:actor.team,action}]};
  return ok({},next);
 }
 return error(403,'not_allowed');
}
