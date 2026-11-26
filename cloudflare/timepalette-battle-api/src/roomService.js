import {createBattleRoom,applyBattleAction,battleRoomView} from '../../../src/utils/worldBattleRoom.js';

export const ROOM_TTL=4*60*60*1000;
export const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(24)),x=>x.toString(16).padStart(2,'0')).join('');
export const roomCode=()=>Array.from(crypto.getRandomValues(new Uint8Array(4)),x=>x.toString(16).padStart(2,'0')).join('').toUpperCase();
export const validToken=v=>typeof v==='string'&&/^[0-9a-f]{48}$/.test(v);
export async function digest(value){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
 return Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('');
}
const result=(status,data,record)=>({status,data,record});
const fail=(status,error,record)=>result(status,{error},record);

// The catalog is supplied by server code only; never by a browser.
export async function createRecord(config,questions,now){
 const hostToken=token(),teamTokens=config.teamNames.map(()=>token());
 const hostId=await digest(hostToken);
 const teamIds=await Promise.all(teamTokens.map(digest));
 const room=createBattleRoom({hostId,questions,limit:config.limit,teamNames:config.teamNames,seconds:config.seconds});
 const record={room,teamIds,expiresAt:now+ROOM_TTL};
 return {record,credentials:{hostToken,teams:room.teams.map((t,i)=>({id:t.id,name:t.name,token:teamTokens[i]})),expiresAt:record.expiresAt},view:battleRoomView(room,hostId)};
}

// Pure transaction reducer; callers authenticate by hashing a bearer secret.
// Return only the projected role view, never a stored record to the client.
export function roomRequest(record,actor,operation,body,now){
 if(!record||now>=record.expiresAt)return fail(404,'room_unavailable',record);
 const room=record.room,host=actor===room.hostId,teamId=record.teamIds.indexOf(actor);
 if(!host&&teamId<0)return fail(403,'invalid_credentials',record);
 if(operation==='close')return host?result(200,{closed:true},null):fail(403,'host_only',record);
 let next=room;
 if(operation==='join'){
  if(host)return fail(403,'team_only',record);
  if(room.teams[teamId].actorId!==actor){
   if(room.phase!=='lobby')return fail(409,'room_started',record);
   next=applyBattleAction(room,room.hostId,{type:'assign',revision:room.revision,teamId,actorId:actor},now);
  }
 }else if(operation==='action'){
  const allowed=host?['start','reveal','next']:['answer'];
  if(!body||!allowed.includes(body.type))return fail(403,'action_forbidden',record);
  next=applyBattleAction(room,actor,{type:body.type,revision:body.revision,round:body.round,questionId:body.questionId,index:body.index},now);
  if(next===room)return fail(409,'action_rejected',record);
 }else if(operation!=='view')return fail(404,'unknown_operation',record);
 const view=battleRoomView(next,actor);
 if(!view)return fail(403,'join_required',record);
 return result(200,{view,serverTime:now,expiresAt:record.expiresAt},next===room?record:{...record,room:next});
}

export function validateConfig(input){
 if(!input||!Array.isArray(input.teamNames)||input.teamNames.length<2||input.teamNames.length>8||
 !input.teamNames.every(v=>typeof v==='string'&&v.trim().length>0&&v.length<=24)||
 new Set(input.teamNames.map(v=>v.trim().toLowerCase())).size!==input.teamNames.length||
 ![0,15,30,60].includes(input.seconds)||!Number.isInteger(input.limit)||input.limit<1||input.limit>50||
 !['ja','en'].includes(input.language)||!Array.isArray(input.countries)||!input.countries.length||input.countries.length>250||
 !input.countries.every(v=>typeof v==='string'&&/^[a-z]{2}$/.test(v))||
 !Array.isArray(input.domains)||!input.domains.length||input.domains.length>6||
 !input.domains.every(v=>['place','time','language','lifeCulture','japanConnection','thinkConnect'].includes(v)))return null;
 return {teamNames:input.teamNames.map(v=>v.trim()),seconds:input.seconds,limit:input.limit,language:input.language,countries:[...new Set(input.countries)],domains:[...new Set(input.domains)]};
}
