import {useEffect,useRef,useState} from 'react';
import {Peer} from 'peerjs';
import {rollJourney} from '../../utils/worldGameEngine.js';
import {TRAVEL_MODES} from '../../utils/worldGameStrategy.js';
import {roomCode,publicGame,restoreGame,acceptsJourneyAction,applyJourneyAction} from '../../utils/journeyRoomProtocol.js';

const prefix='timepalette-journey-v1-';
const codePattern=/^[0-9]{6}$/;

export function useJourneyRoom({game,setGame,config,onGuestGame}){
 const [room,setRoom]=useState(null),[notice,setNotice]=useState(''),[roll,setRoll]=useState(null);
 const peer=useRef(null),links=useRef(new Map()),hostLink=useRef(null),role=useRef(null),roomRef=useRef(null),gameRef=useRef(game),configRef=useRef(config),guestRef=useRef(onGuestGame),rollRef=useRef(null),timer=useRef(null),connectTimer=useRef(null),seq=useRef(0),guestSeq=useRef(-1);
 gameRef.current=game;configRef.current=config;guestRef.current=onGuestGame;
 const update=value=>{roomRef.current=value;setRoom(value);};
 const send=(conn,msg)=>{if(conn?.open)try{conn.send(msg);}catch{/* connection failure is shown by close/error */}};
 const broadcast=msg=>links.current.forEach(x=>{if(x.approved)send(x.conn,msg);});
 const roster=()=>Array.from(links.current.values()).map(x=>({id:x.conn.peer,name:x.name,team:x.team,approved:x.approved}));
 const refresh=()=>{if(role.current==='host'){const r={...roomRef.current,people:roster()};update(r);broadcast({type:'roster',people:r.people.filter(x=>x.approved)});}};
 const close=()=>{
  clearTimeout(timer.current);clearTimeout(connectTimer.current);role.current=null;rollRef.current=null;setRoll(null);
  peer.current?.destroy();peer.current=null;links.current.clear();hostLink.current=null;guestSeq.current=-1;update(null);setNotice('');
 };
 useEffect(()=>()=>{clearTimeout(timer.current);clearTimeout(connectTimer.current);role.current=null;peer.current?.destroy();},[]);
 const snapshot=()=>({type:'state',seq:++seq.current,game:publicGame(gameRef.current),config:configRef.current,roll:rollRef.current});
 const publish=()=>{if(role.current==='host')broadcast(snapshot());};
 useEffect(()=>{if(role.current==='host'&&game)publish();},[game]);
 const fail=message=>{setNotice(message);if(roomRef.current)update({...roomRef.current,status:'error'});};
 const actHost=(action,team=null)=>{
  const g=gameRef.current;
  if(rollRef.current||!acceptsJourneyAction(g,action,team))return;
  if(action.type==='roll'){
   const travel=g.travelEconomy?action.travel:'standard',ticket=TRAVEL_MODES[travel];
   if(g.phase!=='select'||!Object.hasOwn(TRAVEL_MODES,travel)||!ticket||g.teams[g.turn].money<ticket.cost)return;
   const values=Array.from({length:g.diceCount||1},()=>1+Math.floor(Math.random()*6));
   const next=rollJourney(g,values,Math.random,travel);
   if(next===g)return;
   const plan={id:++seq.current,values,travel,round:g.round};
   rollRef.current=plan;setRoll(plan);publish();
   const steps=values.reduce((a,b)=>a+b,0)+ticket.extra;
   timer.current=setTimeout(()=>{rollRef.current=null;setRoll(null);gameRef.current=next;setGame(next);},2440+1600+steps*(configRef.current.speed==='fast'?230:850)+250);
   return;
  }
  const next=applyJourneyAction(g,action);
  if(next!==g){gameRef.current=next;setGame(next);}
 };
 const openHost=(teamCount)=>{
  close();role.current='host';const code=roomCode();
  update({role:'host',code,status:'connecting',people:[],teamCount});setNotice('');
  const p=new Peer(prefix+code,{debug:0});peer.current=p;
  connectTimer.current=setTimeout(()=>fail('接続サービスに接続できません。閉じてもう一度お試しください。'),15000);
  p.on('open',()=>{if(peer.current!==p)return;clearTimeout(connectTimer.current);update({...roomRef.current,status:'ready'});});
  p.on('error',e=>{if(peer.current!==p)return;if(gameRef.current){setNotice('接続サービスの状態に注意してください。ホストからゲームを続けられます。');return;}fail(e.type==='unavailable-id'?'コードが重複しました。新しいルームを作成してください。':'接続できません。Wi-Fiや通信制限をご確認ください。');});
  p.on('disconnected',()=>{if(peer.current===p&&roomRef.current?.status==='connecting')fail('接続サービスとの通信が切れました。');});
  p.on('connection',conn=>{
   if(peer.current!==p||gameRef.current||links.current.size>=teamCount-1){conn.on('open',()=>{send(conn,{type:'reject'});setTimeout(()=>conn.close(),300);});return;}
   const entry={conn,name:'参加端末',approved:false,team:null};links.current.set(conn.peer,entry);
   conn.on('open',refresh);
   conn.on('data',data=>{
    if(!data||typeof data!=='object'||links.current.get(conn.peer)!==entry)return;
    if(data.type==='hello'&&!entry.approved){entry.name=String(data.name||'参加端末').slice(0,24);refresh();}
    if(data.type==='action'&&entry.approved)actHost(data.action,entry.team);
   });
   const remove=()=>{if(links.current.get(conn.peer)!==entry)return;links.current.delete(conn.peer);refresh();if(gameRef.current)setNotice('参加端末との接続が切れました。ホスト端末でそのチームを操作できます。');};
   conn.on('close',remove);conn.on('error',remove);
  });
 };
 const approve=id=>{
  if(role.current!=='host'||gameRef.current)return;
  const entry=links.current.get(id);if(!entry||!entry.conn.open||entry.approved)return;
  const occupied=new Set(roster().filter(e=>e.approved).map(e=>e.team));
  const team=Array.from({length:roomRef.current.teamCount-1},(_,i)=>i+1).find(i=>!occupied.has(i));
  if(team===undefined)return;
  entry.approved=true;entry.team=team;
  send(entry.conn,{type:'approved',team,config:configRef.current});refresh();
 };
 const join=(code,name)=>{
  if(!codePattern.test(code)){setNotice('6桁の数字を入力してください。');return;}
  close();role.current='guest';update({role:'guest',code,status:'connecting',people:[],team:null});
  const p=new Peer({debug:0});peer.current=p;
  connectTimer.current=setTimeout(()=>fail('接続できません。コード・Wi-Fiを確認してください。'),20000);
  p.on('open',()=>{
   if(peer.current!==p)return;
   const conn=p.connect(prefix+code,{reliable:true});hostLink.current=conn;
   conn.on('open',()=>{clearTimeout(connectTimer.current);update({...roomRef.current,status:'waiting'});send(conn,{type:'hello',name});});
   conn.on('data',data=>{
    if(!data||typeof data!=='object'||peer.current!==p)return;
    if(data.type==='reject'){fail('ルームが満員、またはゲーム開始済みです。');return;}
    if(data.type==='approved'){update({...roomRef.current,status:'ready',team:data.team});return;}
    if(data.type==='roster'){update({...roomRef.current,people:data.people});return;}
    if(data.type==='state'&&roomRef.current?.status==='ready'&&Number.isInteger(data.seq)&&data.seq>guestSeq.current){
     guestSeq.current=data.seq;rollRef.current=data.roll;setRoll(data.roll);
     if(data.game)guestRef.current(restoreGame(data.game),data.config);
    }
   });
   conn.on('close',()=>{if(peer.current===p)fail('ホストとの接続が切れました。ゲームを終了して再参加してください。');});
   conn.on('error',()=>{if(peer.current===p)fail('端末間の接続に失敗しました。');});
  });
  p.on('error',()=>{if(peer.current===p&&!hostLink.current?.open)fail('ルームに接続できません。コードと通信環境をご確認ください。');});
 };
 const action=(type,extra={})=>{
  const g=gameRef.current;if(!g)return;
  const msg={type,round:g.round,phase:g.phase,...extra};
  if(role.current==='host')actHost(msg);
  else if(role.current==='guest'&&roomRef.current?.status==='ready'&&roomRef.current.team===g.turn&&!rollRef.current)send(hostLink.current,{type:'action',action:msg});
 };
 return {room,notice,roll,openHost,join,approve,close,action,canControl:!room||(room.status==='ready'&&(room.role==='host'||room.team===game?.turn))};
}
