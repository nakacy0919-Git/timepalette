import {useEffect,useMemo,useRef,useState} from 'react';
import {createBattleClient,acceptBattleView} from '../../utils/worldGameOnlineClient.js';
import './onlineBattle.css';

const MESSAGES={disabled:'オンライン対戦は現在停止中です。',invalid_config:'チーム名や出題条件を確認してください。',create_forbidden:'先生用作成キーが正しくありません。',invalid_credentials:'参加用キーを確認してください。',room_unavailable:'ルームが終了したか、期限切れです。',room_started:'このルームはすでに開始されています。',action_rejected:'状況が更新されました。最新の状態を確認してください。',no_questions:'該当する問題がありません。'};
const message=e=>MESSAGES[e?.message]||'通信に失敗しました。接続を確認して再試行してください。';
const clock=()=>Date.now();
const cleanCode=v=>v.trim().toUpperCase();
const validCode=v=>/^[0-9A-F]{8}$/.test(v);
const validToken=v=>/^[0-9a-f]{48}$/.test(v);

export default function OnlineBattle({endpoint,config,onBack}){
 const client=useMemo(()=>{try{return createBattleClient(endpoint);}catch{return null;}},[endpoint]);
 const [screen,setScreen]=useState('entry'),[code,setCode]=useState(''),[key,setKey]=useState(''),[teamToken,setTeamToken]=useState('');
 const [session,setSession]=useState(null),[view,setView]=useState(null),[invites,setInvites]=useState([]),[inviteId,setInviteId]=useState(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[network,setNetwork]=useState('connecting');
 const [offset,setOffset]=useState(0),[now,setNow]=useState(clock),[choice,setChoice]=useState(null);
 const lock=useRef(false),active=useRef(null),epoch=useRef(0),mounted=useRef(false);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;epoch.current++;active.current?.abort();};},[]);
 const update=data=>{if(data?.view)setView(old=>acceptBattleView(old,data.view));if(Number.isFinite(data?.serverTime)){const local=clock();setOffset(data.serverTime-local);setNow(local);}};
 useEffect(()=>{
  if(!client||!session)return;
  let stopped=false,timer,controller;
  const poll=async()=>{
   if(stopped)return;
   if(lock.current){timer=setTimeout(poll,400);return;}
   controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
   try{
    const data=await client.view(session.code,session.token,controller.signal);
    if(stopped)return;
    update(data);setNetwork('online');
   }catch(e){
    if(stopped)return;
    if(e.status===404||e.status===403){setNetwork('ended');setError(message(e));return;}
    setNetwork('offline');
   }finally{clearTimeout(timeout);}
   if(!stopped)timer=setTimeout(poll,document.hidden?5000:1500);
  };
  timer=setTimeout(poll,1500);
  return()=>{stopped=true;clearTimeout(timer);controller?.abort();};
 },[client,session]);
 useEffect(()=>{if(view?.phase!=='question'||!view.deadline)return;const id=setInterval(()=>setNow(clock()),250);return()=>clearInterval(id);},[view?.phase,view?.deadline]);
 useEffect(()=>setChoice(null),[view?.question?.id,view?.round]);
 const execute=async fn=>{
  if(lock.current||!client)return;
  lock.current=true;setBusy(true);setError('');setNotice('');
  const current=epoch.current,controller=new AbortController();active.current=controller;const timeout=setTimeout(()=>controller.abort(),15000);
  const alive=()=>mounted.current&&current===epoch.current;
  try{await fn(controller.signal,alive);}catch(e){if(alive())setError(message(e));}
  finally{clearTimeout(timeout);if(alive()){lock.current=false;setBusy(false);active.current=null;}}
 };
 const enter=role=>execute(async(signal,alive)=>{
  const data=role==='host'?await client.create(config,key,signal):await client.join(cleanCode(code),teamToken.trim(),signal);
  if(!alive())return;
  const next={code:role==='host'?data.code:cleanCode(code),token:role==='host'?data.hostToken:teamToken.trim(),role};
  if(!validCode(next.code)||!validToken(next.token)||!data.view)throw Error('invalid_response');
  setView(data.view);update(data);setSession(next);setInvites(role==='host'?data.teams||[]:[]);setKey('');setTeamToken('');setNetwork('online');setScreen('room');
 });
 const action=(type,extra={})=>execute(async(signal,alive)=>{
  const data=await client.action(session.code,session.token,{type,revision:view.revision,...extra},signal);
  if(alive()){update(data);setNetwork('online');}
 });
 const reset=()=>{epoch.current++;active.current?.abort();lock.current=false;setBusy(false);setSession(null);setView(null);setInvites([]);setInviteId(null);setKey('');setTeamToken('');setError('');setNotice('');setScreen('entry');};
 const leave=()=>{if(session&&!window.confirm('この端末から退出しますか？ ルーム自体は終了しません。'))return;reset();onBack();};
 const close=()=>{if(!window.confirm('全チームのルームを終了しますか？'))return;execute(async(signal,alive)=>{await client.close(session.code,session.token,signal);if(alive()){reset();setNotice('ルームを終了しました。');}});};
 const copy=async value=>{try{await navigator.clipboard.writeText(value);setNotice('コピーしました。チームへ個別に共有してください。');}catch{setNotice('コピーできません。表示されたキーを手動でコピーしてください。');}};
 const host=view?.role==='host',team=view?.teams.find(t=>t.id===view.teamId),question=view?.question;
 const seconds=view?.deadline===null||!view?.deadline?null:Math.max(0,Math.ceil((view.deadline-(now+offset))/1000));
 const answered=view?.teams.filter(t=>t.answered).length||0,joined=view?.teams.filter(t=>t.joined).length||0;
 const canAct=!busy&&network==='online';
 const review=view?.phase==='review'||view?.phase==='finished';
 return <main className="wg-shell wb-shell">
  <header className="wg-top"><button className="wg-back" onClick={leave} disabled={busy}>← ゲーム設定</button><span>TIMEPALETTE / ONLINE BATTLE</span><small>限定テスト</small></header>
  {error&&<p className="wb-error" role="alert">{error}</p>}{notice&&<p role="status" className="wb-notice">{notice}</p>}
  {!session?<section className="wg-settings wb-entry"><p className="wb-eyebrow">CONNECT · THINK · PLAY</p><h1>World Quiz Battle Online</h1><p>先生とチームが別々の端末から参加します。チーム名のみで利用できます。</p>
   <div className="wg-row"><button aria-pressed={screen==='host'} onClick={()=>{setScreen('host');setError('');}} disabled={!client||busy}>先生：ルーム作成</button><button aria-pressed={screen==='team'} onClick={()=>{setScreen('team');setError('');}} disabled={!client||busy}>生徒：ルーム参加</button></div>
   {!client&&<p>オンラインAPIの設定がありません。</p>}
   {screen==='host'&&<form onSubmit={e=>{e.preventDefault();enter('host');}}><p>{config.teamNames.length}チーム · 最大{config.limit}問 · {config.language==='en'?'English':'日本語'}</p><label className="wg-label">先生用作成キー<input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} required/></label><button className="wg-primary" disabled={busy||key.length<32||!config.countries.length||!config.domains.length}>ルームを作成</button></form>}
   {screen==='team'&&<form onSubmit={e=>{e.preventDefault();enter('team');}}><label className="wg-label">ルームコード<input value={code} onChange={e=>setCode(e.target.value)} maxLength={8} autoCapitalize="characters" autoComplete="off" required/></label><label className="wg-label">チーム参加キー<input type="password" value={teamToken} onChange={e=>setTeamToken(e.target.value)} autoComplete="off" required/></label><button className="wg-primary" disabled={busy||!validCode(cleanCode(code))||!validToken(teamToken.trim())}>参加する</button><p>再参加するときも同じコードとキーを使います。</p></form>}
   <p className="wg-note">参加キーはチームごとに異なります。公開スクリーンに表示せず、個別に共有してください。</p>
  </section>:<><section className="wg-settings wb-room"><div className="wb-room-head"><div><small>ROOM CODE</small><h1>{session.code}</h1></div><div><b>{host?'HOST / 先生':team?.name}</b><p role="status">{network==='online'?'接続中':network==='ended'?'ルーム終了':'再接続中…'}</p></div></div>
   <div className="wb-teams">{view.teams.map(t=><div key={t.id} className={t.id===view.teamId?'own':''}><b>{t.name}</b><strong>{t.score} pts</strong><small>{view.phase==='lobby'?(t.joined?'✓ 参加済み':'参加待ち'):view.phase==='question'?(t.answered?'✓ 回答済み':'回答待ち'):t.correct+'/'+t.attempts+' 正解'}</small></div>)}</div>
   {view.phase==='lobby'&&<><h2>{joined} / {view.teams.length} チーム参加済み</h2>{host?<><p>全チームが参加したら開始できます。</p><details className="wb-invites" onToggle={e=>{if(!e.currentTarget.open)setInviteId(null);}}><summary>個別参加キー（投影時は閉じる）</summary>{invites.map(t=><div key={t.id}><b>{t.name}</b><button onClick={()=>copy(session.code+' '+t.token)}>コードとキーをコピー</button><button onClick={()=>setInviteId(inviteId===t.id?null:t.id)}>{inviteId===t.id?'隠す':'キーを表示'}</button>{inviteId===t.id&&<code>{t.token}</code>}</div>)}</details><button className="wg-primary" disabled={!canAct||joined!==view.teams.length} onClick={()=>action('start')}>対戦開始</button></>:<p>先生が対戦を開始するまでお待ちください。</p>}</>}
   {host&&<button className="wg-back wb-close" disabled={!canAct} onClick={close}>ルームを終了</button>}
  </section>
  {view.phase!=='lobby'&&question&&<section className="wg-question wb-question" lang={question.language==='en'?'en':'ja'}><header><span>QUESTION {view.round} / {view.total}</span><span>{answered} / {view.teams.length} 回答済み</span></header>
   {view.phase==='question'&&seconds!==null&&<div className="wb-clock" role="timer">{seconds===0?'時間終了':seconds+' 秒'}</div>}
   <h2>{question.prompt}</h2><div className="wg-options">{question.choices.map((v,i)=><button key={i} aria-pressed={!review&&(view.ownAnswer===i||choice===i)} className={review?(i===question.correctIndex?'correct':view.ownAnswer===i?'wrong':''):choice===i||view.ownAnswer===i?'selected':''} disabled={host||review||!canAct||view.ownAnswer!==null||seconds===0} onClick={()=>setChoice(i)}><b>{'ABCD'[i]}</b><span>{v}</span></button>)}</div>
   {view.phase==='question'&&(host?<button className="wg-primary" disabled={!canAct} onClick={()=>{if(answered===view.teams.length||seconds===0||window.confirm('まだ回答していないチームがあります。正解を発表しますか？'))action('reveal');}}>正解発表</button>:view.ownAnswer!==null?<p role="status">✓ 回答を受け付けました。正解発表をお待ちください。</p>:<button className="wg-primary" disabled={!canAct||choice===null||seconds===0} onClick={()=>action('answer',{round:view.round,questionId:question.id,index:choice})}>回答を確定</button>)}
   {review&&<div className="wg-feedback"><h3>正解：{question.choices[question.correctIndex]}</h3><p>{question.explanation}</p>{view.teams.map(t=><p key={t.id}>{t.name}：{view.answers?.[t.id]===question.correctIndex?'✓ 正解':view.answers?.[t.id]===undefined?'未回答':'不正解'}</p>)}{host&&view.phase==='review'&&<button className="wg-primary" disabled={!canAct} onClick={()=>action('next')}>{view.round===view.total?'最終結果':'次の問題'}</button>}</div>}
  </section>}
  {view.phase==='finished'&&<section className="wg-settings"><h2>🏆 FINAL RESULTS</h2>{[...view.teams].sort((a,b)=>b.score-a.score).map(t=><div className="wg-result" key={t.id}><b>{1+view.teams.filter(o=>o.score>t.score).length}位 · {t.name}</b><span>{t.score} pts</span></div>)}</section>}
  </>}
 </main>;
}
