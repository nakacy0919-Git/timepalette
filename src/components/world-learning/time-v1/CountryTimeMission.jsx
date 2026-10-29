import { useEffect, useState } from 'react';
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
export default function CountryTimeMission({mission,onComplete,alreadyCompleted}) {
  const [selected,setSelected]=useState(null);
  const [wasCompleted]=useState(Boolean(alreadyCompleted));
  const [solved,setSolved]=useState(false);
  const [attempted,setAttempted]=useState(false);
  const [dial,setDial]=useState(0);
  const [hint,setHint]=useState(false);
  const correct=selected!==null&&mission.options[selected].correct;
  const target=mission.clocks.find(c=>c.hidden);
  const dialTime=`${String(Math.floor(dial/60)).padStart(2,'0')}:${String(dial%60).padStart(2,'0')}`;
  function submit(){setAttempted(true);if(correct&&!solved){setSolved(true);onComplete?.(mission);}}
  return <div data-testid="country-time-mission" data-mission-id={mission.id} className="space-y-5">
    <p className="rounded-xl bg-amber-50 p-3 text-sm font-bold">対象：{mission.cityJa}（{mission.zone}）／複数の時間帯がある国も、この都市で考えます。</p>
    {mission.liveZones&&<LiveClocks places={mission.liveZones}/>}
    {!!mission.clocks.length&&<div className="grid gap-4 sm:grid-cols-2">{mission.clocks.map((c,i)=><div key={i} className="rounded-2xl border bg-slate-50 p-4 text-center"><h3 className="font-black">{c.label}</h3>{c.hidden&&!solved?<div className="py-9 text-3xl" aria-label="この時計の時刻を解こう">⏰ ？</div>:<><ClockFace minutes={localParts(c.zone,c.instant).minutes} label={`${c.label} ${formatStamp(c.zone,c.instant)}`}/><p className="font-mono text-lg font-black">{formatStamp(c.zone,c.instant)}</p><p className="text-xs text-slate-600">{formatOffset(offsetAt(c.zone,c.instant))}</p></>}</div>)}</div>}
    {mission.dial&&<div className="rounded-2xl bg-orange-50 p-4"><label className="font-black" htmlFor="time-practice-dial">練習用の時計：{target?.label} {dialTime}</label><ClockFace minutes={dial} label={`練習用の時計 ${dialTime}`}/><input id="time-practice-dial" className="w-full accent-orange-500" type="range" min="0" max="1435" step="5" value={dial} onChange={e=>setDial(Number(e.target.value))}/><p className="text-xs text-slate-600">針を動かして考えたら、日付も含めて下の4択から回答しよう。</p></div>}
    <fieldset disabled={solved} className="space-y-3"><legend className="mb-3 font-black">答えを1つ選ぼう</legend>{mission.options.map((option,i)=><label key={option.label} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-4 font-bold ${selected===i?'border-orange-500 bg-orange-50':'border-slate-200'}`}><input type="radio" name={mission.id} checked={selected===i} onChange={()=>{setSelected(i);setAttempted(false);}} value={i}/><span>{String.fromCharCode(65+i)}. {option.label}</span></label>)}</fieldset>
    <div className="flex flex-wrap gap-3"><button type="button" disabled={selected===null||solved} onClick={submit} className="rounded-xl bg-orange-600 px-6 py-3 font-black text-white disabled:opacity-40">答え合わせ</button><button type="button" onClick={()=>setHint(!hint)} className="rounded-xl border px-5 py-3 font-bold">考え方のヒント</button></div>
    {hint&&<p className="rounded-xl bg-sky-50 p-4">同じ瞬間をUTC（世界共通の基準）でつなごう。変換先のオフセット − 変換元のオフセットを足します。24:00を超えたら翌日、00:00より前なら前日です。季節の問題では2つの指定日を別々に比べます。</p>}
    {attempted&&!correct&&!solved&&<p role="status" className="text-sm text-slate-600">もう一度考えてみよう。時計・日付・オフセットを確認して、答えを変更できます。</p>}
    {solved&&<div role="status" className="rounded-2xl bg-emerald-50 p-5"><h3 className="font-black text-emerald-800">ミッションクリア！{wasCompleted?'（クリア済みの復習）':''}</h3><p className="mt-2 leading-7">{mission.explanation}</p></div>}
    <p className="text-xs text-slate-500">出典：<a href={TIME_SOURCE} target="_blank" rel="noreferrer" className="underline">IANA Time Zone Database {TIME_DATA_VERSION}</a>。指定日の制度に基づく問題です。</p>
  </div>;
}
