import { useEffect, useRef, useState } from 'react';
import { playUiSound, prepareUiSound } from '../../../utils/uiSound.js';
import { formatOffset, formatStamp, localParts, offsetAt, TIME_SOURCE, TIME_DATA_VERSION } from '../../../utils/time197.js';

function ClockFace({minutes, label}) {
  const point=(angle,length)=>({x:50+Math.sin(angle*Math.PI/180)*length,y:50-Math.cos(angle*Math.PI/180)*length});
  const hour=point((minutes%720)/2,23),minute=point((minutes%60)*6,33);
  return <svg viewBox="0 0 100 100" role="img" aria-label={label} className="mx-auto h-36 w-36">
    <circle cx="50" cy="50" r="46" fill="white" stroke="#f59e0b" strokeWidth="3"/>
    {[12,3,6,9].map((n,i)=>{const p=point(i*90,36);return <text key={n} x={p.x} y={p.y+3} textAnchor="middle" fontSize="9" fill="#475569">{n}</text>;})}
    <line x1="50" y1="50" x2={hour.x} y2={hour.y} stroke="#0f172a" strokeWidth="4" strokeLinecap="round"/>
    <line x1="50" y1="50" x2={minute.x} y2={minute.y} stroke="#ea580c" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="50" cy="50" r="3" fill="#0f172a"/>
  </svg>;
}
function LiveClocks({places}) {
  const [now,setNow]=useState(()=>Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(timer);},[]);
  return <div className="mb-5 rounded-2xl bg-sky-50 p-4"><h3 className="font-black">世界の「いま」</h3><p className="mb-3 text-xs text-slate-600">下の問題は指定日で考えます。こちらの時計は現在時刻です。</p><div className="grid gap-3 sm:grid-cols-2">{places.map((p,i)=><div key={i}><p className="font-bold">{p.cityJa}</p><p className="font-mono text-xl">{formatStamp(p.zone,now)}</p></div>)}</div></div>;
}
export default function CountryTimeMission({mission,onComplete,alreadyCompleted,onNext,isLastMission,countryCode}) {
  const [selected,setSelected]=useState(null);
  const [wasCompleted]=useState(Boolean(alreadyCompleted));
  const [solved,setSolved]=useState(false);
  const [feedback,setFeedback]=useState(null);
  const locked=useRef(false);
  const [dial,setDial]=useState(0);
  const [hint,setHint]=useState(false);
  const target=mission.clocks.find(c=>c.hidden);
  const dialTime=`${String(Math.floor(dial/60)).padStart(2,'0')}:${String(dial%60).padStart(2,'0')}`;
  function choose(index){
    if(locked.current||solved)return;
    locked.current=true;
    prepareUiSound();
    const correct=mission.options[index].correct;
    setSelected(index);
    setFeedback(correct?'correct':'wrong');
    playUiSound(correct?'powerup':'wrong');
    if(correct){setSolved(true);onComplete?.(mission);}
  }
  function dismissFeedback(){
    if(feedback==='wrong')setSelected(null);
    setFeedback(null);
    locked.current=false;
  }
  return <div data-testid="country-time-mission" data-mission-id={mission.id} className="space-y-5">
    <p className="time-target-country rounded-xl bg-amber-50 p-3 text-sm font-bold">{countryCode&&<img src={`https://flagcdn.com/w160/${countryCode}.png`} alt="" className="time-country-flag"/>}対象：{mission.cityJa}（{mission.zone}）／複数の時間帯がある国も、この都市で考えます。</p>
    {mission.liveZones&&<LiveClocks places={mission.liveZones}/>}
    {!!mission.clocks.length&&<div className="time-question-clocks grid gap-4 sm:grid-cols-2">{mission.clocks.map((c,i)=><div key={i} className="rounded-2xl border bg-slate-50 p-4 text-center"><h3 className="font-black">{c.label}</h3>{c.hidden&&!solved?<div className="py-9 text-3xl" aria-label="この時計の時刻を解こう">⏰ ？</div>:<><ClockFace minutes={localParts(c.zone,c.instant).minutes} label={`${c.label} ${formatStamp(c.zone,c.instant)}`}/><p className="font-mono text-lg font-black">{formatStamp(c.zone,c.instant)}</p><p className="text-xs text-slate-600">{formatOffset(offsetAt(c.zone,c.instant))}</p></>}</div>)}</div>}
    {mission.dial&&<div className="time-practice-clock rounded-2xl bg-orange-50 p-4"><label className="font-black" htmlFor="time-practice-dial">練習用の時計：{target?.label} {dialTime}</label><ClockFace minutes={dial} label={`練習用の時計 ${dialTime}`}/><input id="time-practice-dial" className="w-full accent-orange-500" type="range" min="0" max="1435" step="5" value={dial} onChange={e=>setDial(Number(e.target.value))}/><p className="text-xs text-slate-600">針を動かして考えたら、日付も含めて下の4択から回答しよう。</p></div>}
    <fieldset disabled={solved||Boolean(feedback)} className="time-instant-options space-y-3"><legend className="mb-3 font-black">答えを1つ選ぼう</legend>{mission.options.map((option,i)=><button type="button" key={option.label} aria-pressed={selected===i} onClick={()=>choose(i)} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 font-bold text-left ${selected===i?(option.correct?'border-emerald-500 bg-emerald-50':'border-rose-400 bg-rose-50'):'border-slate-200'}`}><span className="time-choice-letter">{String.fromCharCode(65+i)}</span><span>{option.label}</span></button>)}</fieldset>
    <div className="flex flex-wrap gap-3"><button type="button" onClick={()=>setHint(!hint)} className="rounded-xl border px-5 py-3 font-bold">考え方のヒント</button></div>
    {feedback&&<div className={`time-answer-feedback is-${feedback}`} role="dialog" aria-modal="true" aria-labelledby="time-answer-title" onKeyDown={e=>{if(e.key==='Escape')dismissFeedback();}}>
      {feedback==='correct'&&<div className="time-complete-confetti" aria-hidden="true">{Array.from({length:32},(_,i)=><i key={i} style={{'--i':i*1.5,'--hue':`${i*47%360}`}}/>)}</div>}
      <div className="time-answer-card">
        <div className="time-answer-symbol" aria-hidden="true">{feedback==='correct'?'✓':'↻'}</div>
        <h2 id="time-answer-title">{feedback==='correct'?'CORRECT!':'Try it again!'}</h2>
        {feedback==='correct'?<>
          <div className="time-answer-explanation"><h3>解説</h3><p>{mission.explanation}</p></div>
          <button type="button" autoFocus onClick={()=>{dismissFeedback();onNext?.();}}>{isLastMission?'COMPLETE! へ':'次の問題へ →'}</button>
        </>:<><p>もう一度、時計と日付を確かめよう。</p><button type="button" autoFocus onClick={dismissFeedback}>もう一度チャレンジ</button></>}
      </div>
    </div>}
    {hint&&<p className="rounded-xl bg-sky-50 p-4">同じ瞬間をUTC（世界共通の基準）でつなごう。変換先のオフセット − 変換元のオフセットを足します。24:00を超えたら翌日、00:00より前なら前日です。季節の問題では2つの指定日を別々に比べます。</p>}
    {solved&&<div role="status" className="rounded-2xl bg-emerald-50 p-5"><h3 className="font-black text-emerald-800">ミッションクリア！{wasCompleted?'（クリア済みの復習）':''}</h3><p className="mt-2 leading-7">{mission.explanation}</p></div>}
    <p className="text-xs text-slate-500">出典：<a href={TIME_SOURCE} target="_blank" rel="noreferrer" className="underline">IANA Time Zone Database {TIME_DATA_VERSION}</a>。指定日の制度に基づく問題です。</p>
  </div>;
}
