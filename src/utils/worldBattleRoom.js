import {balancedDeck,validQuestion} from './worldGameEngine.js';

// Authoritative, transport-neutral online battle state. This module does not
// open a network connection. A future room server must supply authenticated
// actor IDs, a cryptographically random room code and server time.
export function createBattleRoom({hostId,questions,limit=10,teamNames=[],seconds=30,random=Math.random}){
 if(typeof hostId!=='string'||!hostId||!Array.isArray(teamNames)||teamNames.length<2||teamNames.length>8||!Number.isInteger(limit)||limit<1||![0,15,30,60].includes(seconds))throw Error('Invalid room configuration');
 const unique=new Map((questions||[]).filter(validQuestion).map(q=>[q.id,q]));
 const deck=balancedDeck([...unique.values()],Math.min(limit,50),random);
 if(!deck.length)throw Error('No eligible questions');
 return {hostId,phase:'lobby',revision:0,round:0,deck,seconds,deadline:null,answers:{},history:[],teams:teamNames.map((name,index)=>({id:index,name:String(name||'').trim().slice(0,24)||'TEAM '+(index+1),actorId:null,score:0,correct:0,attempts:0}))};
}
const changed=(room,patch)=>({...room,...patch,revision:room.revision+1});
function hostOnly(room,actor){return actor===room.hostId;}
function startQuestion(room,now){
 return changed(room,{phase:'question',deadline:room.seconds?now+room.seconds*1000:null,answers:{}});
}
// Only the host assigns teams; the transport authenticates the actor identity.
export function applyBattleAction(room,actor,action,now){
 if(!room||!action||!Number.isFinite(now)||typeof actor!=='string')return room;
 if(action.revision!==room.revision)return room;
 if(action.type==='assign'){
  if(!hostOnly(room,actor)||room.phase!=='lobby'||!Number.isInteger(action.teamId)||typeof action.actorId!=='string'||!action.actorId||action.actorId===room.hostId||!room.teams.some(t=>t.id===action.teamId)||room.teams.some(t=>t.id!==action.teamId&&t.actorId===action.actorId))return room;
  return changed(room,{teams:room.teams.map(t=>t.id===action.teamId?{...t,actorId:action.actorId}:t)});
 }
 if(action.type==='start'){
  if(!hostOnly(room,actor)||room.phase!=='lobby'||!room.teams.every(t=>t.actorId))return room;
  return startQuestion(room,now);
 }
 if(action.type==='answer'){
  const team=room.teams.find(t=>t.actorId===actor);
  if(!team||room.phase!=='question'||Object.hasOwn(room.answers,team.id)||!Number.isInteger(action.index)||action.index<0||action.index>3||(room.deadline!==null&&now>=room.deadline))return room;
  return changed(room,{answers:{...room.answers,[team.id]:action.index}});
 }
 if(action.type==='reveal'){
  if(!hostOnly(room,actor)||room.phase!=='question')return room;
  // Host may reveal early for classroom discussion, but this is an explicit action.
  const q=room.deck[room.round];
  const teams=room.teams.map(t=>{const correct=room.answers[t.id]===q.correctIndex;return {...t,score:t.score+(correct?100:0),correct:t.correct+Number(correct),attempts:t.attempts+1};});
  return changed(room,{phase:'review',deadline:null,teams,history:[...room.history,{questionId:q.id,answers:{...room.answers}}]});
 }
 if(action.type==='next'){
  if(!hostOnly(room,actor)||room.phase!=='review')return room;
  if(room.round+1>=room.deck.length)return changed(room,{phase:'finished'});
  return startQuestion({...room,round:room.round+1},now);
 }
 return room;
}
// A separate transport layer must never serialize raw room state.
export function battleRoomView(room,actor){
 const host=hostOnly(room,actor),team=room.teams.find(t=>t.actorId===actor);
 if(!host&&!team)return null;
 const q=room.deck[room.round];
 const reveal=room.phase==='review'||room.phase==='finished';
 return {revision:room.revision,phase:room.phase,round:room.round+1,total:room.deck.length,deadline:room.deadline,role:host?'host':'team',teamId:team?.id??null,
 teams:room.teams.map(t=>({id:t.id,name:t.name,score:t.score,correct:t.correct,attempts:t.attempts,joined:!!t.actorId,answered:Object.hasOwn(room.answers,t.id)})),
 question:room.phase==='lobby'?null:{id:q.id,country:q.country,domain:q.domain,prompt:q.prompt,choices:[...q.choices],...(reveal?{correctIndex:q.correctIndex,explanation:q.explanation}: {})},
 ownAnswer:team?(room.answers[team.id]??null):null,...(reveal?{answers:{...room.answers}}:{})};
}
