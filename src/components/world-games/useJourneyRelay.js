import {useEffect,useRef,useState} from 'react';
import {rollJourney} from '../../utils/worldGameEngine.js';
import {TRAVEL_MODES} from '../../utils/worldGameStrategy.js';
import {publicGame,restoreGame,acceptsJourneyAction,applyJourneyAction} from '../../utils/journeyRoomProtocol.js';

const messages={room_unavailable:'ルームが終了したか、コードが違います。',room_full:'満員、またはゲーム開始済みです。',room_not_ready:'参加者を確認してください。',stale_action:'ゲームの進行が更新されました。',relay_unavailable:'通信サービスに接続できません。再試行してください。'};
const token=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
async function request(op,session,extra={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{
  const response=await fetch('/api/journey-room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({op,...session,...extra}),signal:controller.signal,cache:'no-store'});
  const data=await response.json();if(!response.ok||!data.ok){const e=Error(messages[data.error]||'通信に失敗しました。再試行してください。');e.status=response.status;e.code=data.error;throw e;}
  return data;
 }finally{clearTimeout(timer);}
}
export function useJourneyRoom({game,setGame,config,onGuestGame}){
 const [room,setRoom]=useState(null),[notice,setNotice]=useState(''),[roll,setRoll]=useState(null),[busy,setBusy]=useState(false);
 const session=useRef(null),epoch=useRef(0),roomRef=useRef(null),gameRef=useRef(game),configRef=useRef(config),guestRef=useRef(onGuestGame),rollRef=useRef(null),timer=useRef(null),pollTimer=useRef(null),seq=useRef(0),guestSeq=useRef(-1),seen=useRef(new Set()),pending=useRef(null),publishing=useRef(false),acting=useRef(false);
 gameRef.current=game;configRef.current=config;guestRef.current=onGuestGame;
 const update=value=>{roomRef.current=value;setRoom(value);};
 const reset=()=>{
  epoch.current++;clearTimeout(timer.current);clearTimeout(pollTimer.current);session.current=null;rollRef.current=null;pending.current=null;publishing.current=false;acting.current=false;seen.current.clear();guestSeq.current=-1;seq.current=0;
  setRoll(null);update(null);setNotice('');setBusy(false);
 };
 const close=()=>{const s=session.current,r=roomRef.current;if(s)request(r?.role==='host'?'close':'leave',s).catch(()=>{});reset();};
 useEffect(()=>()=>{const s=session.current,r=roomRef.current;if(s)request(r?.role==='host'?'close':'leave',s).catch(()=>{});epoch.current++;clearTimeout(timer.current);clearTimeout(pollTimer.current);},[]);
 const fail=message=>{setNotice(message);if(roomRef.current)update({...roomRef.current,status:'error'});};
 const applyView=data=>{
  if(!session.current)return;
  update({role:data.role,code:data.code,status:data.status,people:data.people||[],teamCount:data.teamCount,team:data.team});
  setNotice('');
  if(data.role==='guest'&&data.snapshot&&data.snapshot.seq>guestSeq.current){
   const s=data.snapshot;guestSeq.current=s.seq;rollRef.current=s.roll;setRoll(s.roll);guestRef.current(restoreGame(s.game),s.config);
  }
 };
 const snapshot=()=>({seq:++seq.current,game:publicGame(gameRef.current),config:configRef.current,roll:rollRef.current});
 const flush=async()=>{
  if(publishing.current||!pending.current||!session.current)return;
  const id=epoch.current,s=session.current;publishing.current=true;
  try{
   while(pending.current&&epoch.current===id){
    const next=pending.current;await request('publish',s,{snapshot:next});
    if(epoch.current!==id)return;
    if(pending.current===next)pending.current=null;
   }
  }catch(e){if(epoch.current===id)setNotice('同期を再試行中…');}
  finally{if(epoch.current===id)publishing.current=false;}
 };
 const publish=()=>{if(roomRef.current?.role==='host'&&gameRef.current){pending.current=snapshot();void flush();}};
 useEffect(()=>{if(roomRef.current?.role==='host'&&game)publish();},[game]);
 const actHost=(action,team=null)=>{
  const g=gameRef.current;if(rollRef.current||!acceptsJourneyAction(g,action,team))return;
  if(action.type==='roll'){
   const travel=g.travelEconomy?action.travel:'standard',ticket=TRAVEL_MODES[travel];
   if(g.phase!=='select'||!Object.hasOwn(TRAVEL_MODES,travel)||!ticket||g.teams[g.turn].money<ticket.cost)return;
   const values=Array.from({length:g.diceCount||1},()=>1+Math.floor(Math.random()*6)),next=rollJourney(g,values,Math.random,travel);
   if(next===g)return;
   const plan={id:++seq.current,values,travel,round:g.round,startAt:Date.now()+1800};
   rollRef.current=plan;setRoll(plan);publish();
   const steps=values.reduce((a,b)=>a+b,0)+ticket.extra;
   timer.current=setTimeout(()=>{rollRef.current=null;setRoll(null);gameRef.current=next;setGame(next);},1800+2440+1600+steps*(configRef.current.speed==='fast'?230:850)+400);
   return;
  }
  const next=applyJourneyAction(g,action,team);if(next!==g){gameRef.current=next;setGame(next);}
 };
 const poll=async id=>{
  if(id!==epoch.current||!session.current)return;
  const s=session.current;
  try{
   const data=await request('poll',s);
   if(id!==epoch.current)return;
   applyView(data);
   if(data.role==='host'){
    const ids=[];
    for(const a of data.actions||[]){ids.push(a.id);if(!seen.current.has(a.id)){seen.current.add(a.id);actHost(a.action,a.team);}}
    if(ids.length){await request('ack',s,{ids});for(const a of ids)seen.current.delete(a);}
    if(pending.current)void flush();
   }
  }catch(e){
   if(id!==epoch.current)return;
   if(e.status===404||e.status===403){fail(e.message);return;}
   setNotice('通信が不安定です。自動で再接続しています…');
  }
  if(id===epoch.current)pollTimer.current=setTimeout(()=>poll(id),document.hidden?3500:1200);
 };
 const enter=async(role,code,teamCount)=>{
  reset();const id=epoch.current,s={token:token(),...(code?{code}:{})};
  update({role,code:code||'------',status:'connecting',teamCount,people:[],team:null});setBusy(true);
  try{
   const data=await request(role==='host'?'create':'join',s,{teamCount});
   if(id!==epoch.current){request(role==='host'?'close':'leave',{...s,code:data.code}).catch(()=>{});return;}
   session.current={...s,code:data.code};applyView(data);void poll(id);
  }catch(e){if(id===epoch.current)fail(e.message);}
  finally{if(id===epoch.current)setBusy(false);}
 };
 const openHost=teamCount=>void enter('host',null,teamCount);
 const join=code=>{if(!/^\d{6}$/.test(code)){setNotice('6桁の数字を入力してください。');return;}void enter('guest',code);};
 const approve=async id=>{
  if(!session.current||acting.current)return;
  acting.current=true;const e=epoch.current;
  try{const data=await request('approve',session.current,{id});if(e===epoch.current)applyView(data);}
  catch(err){if(e===epoch.current)setNotice(err.message);}
  finally{if(e===epoch.current)acting.current=false;}
 };
 const action=async(type,extra={})=>{
  const g=gameRef.current;if(!g||rollRef.current)return;
  const msg={type,round:g.round,phase:g.phase,...extra};
  if(roomRef.current?.role==='host'){actHost(msg);return;}
  if(roomRef.current?.role!=='guest'||roomRef.current.status!=='ready'||roomRef.current.team!==g.turn||acting.current||!session.current)return;
  acting.current=true;setBusy(true);const e=epoch.current;
  try{await request('action',session.current,{id:crypto.randomUUID(),action:msg});}
  catch(err){if(e===epoch.current)setNotice(err.message);}
  finally{if(e===epoch.current){acting.current=false;setBusy(false);}}
 };
 return {room,notice,roll,busy,openHost,join,approve,close,action,canControl:!room||(room.status==='ready'&&!busy&&(room.role==='host'||room.team===game?.turn))};
}
