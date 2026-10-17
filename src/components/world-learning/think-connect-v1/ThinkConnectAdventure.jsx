import { ExternalLink, GripVertical, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getWorldAdventureDomainPackage } from '../../../utils/worldAdventureRegistry';
import { completeWorldAdventureMission, getWorldAdventureDomainProgress } from '../../../utils/worldAdventureProgress';
import MissionSuccessCelebration from '../MissionSuccessCelebration';
import SourceStudyReader from '../SourceStudyReader';
import ThinkConnectMission from './ThinkConnectMission';

const LEVEL_META = {
  elementary:{icon:'🧒',label:'小学生'},
  juniorHigh:{icon:'🧑',label:'中学生'},
  highSchoolStandard:{icon:'🎓',label:'高校生'},
  highSchoolAdvanced:{icon:'🚀',label:'高校生 Challenge'},
};

function SummaryPanel({source,references}) {
  return <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-fuchsia-200 bg-white shadow-[0_18px_50px_rgba(112,26,117,.10)]">
    <div className="bg-gradient-to-r from-slate-950 via-fuchsia-950 to-violet-900 px-5 py-4 text-white">
      <p className="text-[9px] font-black tracking-[.2em] text-fuchsia-300">EVIDENCE SOURCE</p>
      <h3 className="mt-1 text-lg font-black">{source?.title}</h3>
      <p className="mt-1 text-[10px] font-bold text-white/55">{source?.organization}</p>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto p-5">
      <div className="rounded-[24px] border border-fuchsia-200 bg-fuchsia-50 p-5">
        <p className="text-[10px] font-black tracking-[.18em] text-fuchsia-700">SOURCE KEY POINTS</p>
        <div className="mt-3 space-y-3">
          {(source?.summaryPoints??[]).map((point,index)=><div key={index} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-fuchsia-600 text-[11px] font-black text-white">{index+1}</span>
            <p className="text-sm font-bold leading-6 text-slate-700">{point}</p>
          </div>)}
        </div>
      </div>
      <p className="mt-5 text-[10px] font-black tracking-[.18em] text-slate-400">REFERENCES</p>
      <div className="mt-2 grid gap-2">
        {(references??[]).map(ref=><a key={ref.url} href={ref.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:border-fuchsia-300 hover:bg-fuchsia-50">
          <div className="min-w-0"><p className="text-[9px] font-black text-fuchsia-600">{ref.label}</p><p className="mt-0.5 truncate text-xs font-black text-slate-700">{ref.title}</p></div>
          <ExternalLink size={15} className="shrink-0 text-slate-400"/>
        </a>)}
      </div>
    </div>
  </section>;
}

function ReferenceStrip({references}) {
  if(!references?.length)return null;
  return <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[8px] font-black tracking-[.16em] text-slate-400">SOURCE</span>
      {references.map((ref,index)=><a key={`${ref.url}-${index}`} href={ref.url} target="_blank" rel="noopener noreferrer"
        className="inline-flex max-w-[190px] items-center gap-1 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2 py-1 text-[8px] font-black text-fuchsia-700">
        <span className="truncate">{ref.label}</span><ExternalLink size={9}/>
      </a>)}
    </div>
  </div>;
}

export default function ThinkConnectAdventure({initialLevel='highSchoolStandard',countryCode='rw',onProgressChange}) {
  const normalizedCountry=String(countryCode).trim().toLowerCase();
  const packageData=getWorldAdventureDomainPackage(normalizedCountry,'thinkConnect');
  const missions=useMemo(()=>packageData?.missions??[],[packageData]);
  const [activeIndex,setActiveIndex]=useState(0);
  const [progress,setProgress]=useState(()=>getWorldAdventureDomainProgress(normalizedCountry,'thinkConnect'));
  const [celebration,setCelebration]=useState(null);
  const [leftWidth,setLeftWidth]=useState(430);
  const cleanupRef=useRef(null);
  const advanceTimerRef=useRef(null);

  useEffect(()=>()=>{cleanupRef.current?.();if(advanceTimerRef.current)window.clearTimeout(advanceTimerRef.current);},[]);

  const completedSet=new Set(progress?.completedMissionIds??[]);
  const completedCount=missions.filter(m=>completedSet.has(m.id)).length;
  const activeMission=missions[activeIndex];
  const levelMeta=LEVEL_META[initialLevel]??LEVEL_META.highSchoolStandard;
  const skillBadges=missions.filter(m=>completedSet.has(m.id)).map(m=>m.skillBadge);
  const isUnlocked=index=>index===0||completedSet.has(missions[index]?.id)||completedSet.has(missions[index-1]?.id);

  const complete=mission=>{
    const result=completeWorldAdventureMission({countryCode:normalizedCountry,domainId:'thinkConnect',missionId:mission.id,points:mission.points??0});
    setProgress(result.progress);onProgressChange?.(result.progress);
    const clearedIndex=missions.findIndex(item=>item.id===mission.id);
    const nextIndex=clearedIndex>=0&&clearedIndex<missions.length-1?clearedIndex+1:null;
    setCelebration({firstClear:result.isNewCompletion,points:Number(mission.points??0),title:mission.titleJa??mission.title,nextIndex});
    if(nextIndex!==null){if(advanceTimerRef.current)window.clearTimeout(advanceTimerRef.current);advanceTimerRef.current=window.setTimeout(()=>{setCelebration(null);setActiveIndex(nextIndex);advanceTimerRef.current=null;},2100);}
  };

  const beginResize=event=>{
    event.preventDefault();const startX=event.clientX,startWidth=leftWidth;
    const move=e=>setLeftWidth(Math.max(350,Math.min(620,startWidth+(e.clientX-startX))));
    const finish=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',finish);cleanupRef.current=null;};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',finish);cleanupRef.current=finish;
  };

  if(!packageData||!missions.length)return <div className="min-h-screen bg-fuchsia-50 p-10 text-center"><p className="text-5xl">💡</p><h2 className="mt-4 text-2xl font-black">Think & Connect Adventure のデータがありません</h2></div>;
  const progressPercent=(completedCount/missions.length)*100;

  return <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-fuchsia-50 text-slate-900">
    <header className="shrink-0 bg-gradient-to-r from-slate-950 via-fuchsia-950 to-violet-950 text-white">
      <div className="flex items-center justify-between gap-4 px-5 py-4 pr-20">
        <div>
          <p className="text-[8px] font-black tracking-[.24em] text-fuchsia-300">TIMEPALETTE · THINK & CONNECT</p>
          <h1 className="mt-1 text-xl font-black md:text-2xl">Rwanda · Think & Connect Adventure</h1>
          <p className="mt-1 text-[10px] font-bold text-white/60">COMPARE → THINK → ASK → CREATE → CONNECT</p>
        </div>
        <div className="flex items-center gap-2"><span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black">{levelMeta.icon} {levelMeta.label}</span><span className="rounded-full bg-fuchsia-300 px-3 py-1.5 text-[10px] font-black text-fuchsia-950">{completedCount}/{missions.length} CLEAR</span></div>
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 bg-white/5 px-4 py-2">
        <span className="shrink-0 text-[8px] font-black tracking-[.14em] text-fuchsia-200">SKILL MAP</span>
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
          {missions.map(m=>{const earned=skillBadges.includes(m.skillBadge);return <span key={m.id} className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black ${earned?'bg-emerald-400 text-emerald-950':'bg-white/10 text-white/30'}`}>{earned?'✓ ':'○ '}{m.skillBadge}</span>})}
        </div>
      </div>

      <div className="border-t border-white/10 bg-black/10 px-4 py-2"><div className="flex items-center gap-2 overflow-x-auto">
        <span className="mr-1 text-[8px] font-black tracking-[.15em] text-fuchsia-200">MISSION</span>
        {missions.map((m,index)=>{const completed=completedSet.has(m.id),unlocked=isUnlocked(index),active=index===activeIndex;return <button key={m.id} type="button" disabled={!unlocked} onClick={()=>setActiveIndex(index)} className={`min-w-[52px] rounded-full px-3 py-1.5 text-[9px] font-black ${active?'bg-white text-fuchsia-950 ring-2 ring-fuchsia-300':completed?'bg-emerald-400 text-emerald-950':unlocked?'bg-white/10 text-white':'bg-white/5 text-white/25'}`}>M{String(index+1).padStart(2,'0')}{completed?' ✓':''}</button>})}
      </div></div>
      <div className="h-1 bg-white/10"><div className="h-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-400 transition-all duration-500" style={{width:`${progressPercent}%`}}/></div>
    </header>

    <main className="grid min-h-0 flex-1 overflow-hidden" style={{gridTemplateColumns:`${leftWidth}px 16px minmax(0,1fr)`}}>
      <section className="min-h-0 overflow-hidden border-r border-fuchsia-100 bg-white"><div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 bg-gradient-to-r from-fuchsia-950 to-violet-900 px-4 py-4 text-white">
          <div className="flex items-center justify-between"><span className="rounded-full bg-black/20 px-2.5 py-1 text-[9px] font-black">MISSION {String(activeIndex+1).padStart(2,'0')}</span><span className="rounded-full bg-fuchsia-200 px-2.5 py-1 text-[9px] font-black text-fuchsia-950">+{activeMission?.points??0} WP</span></div>
          <h2 className="mt-3 text-lg font-black leading-6"><span className="mr-2">{activeMission?.icon??'💡'}</span>{activeMission?.title}</h2><p className="mt-1 text-[11px] font-bold text-fuchsia-100">{activeMission?.titleJa}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="rounded-2xl bg-gradient-to-r from-fuchsia-50 via-violet-50 to-cyan-50 px-3.5 py-3 text-[12px] font-black leading-5 text-slate-800">👉 {activeMission?.action}</div>
          <div className="mt-3 rounded-[22px] border border-fuchsia-100 bg-white p-4 shadow-sm"><div className="flex items-start gap-2"><Sparkles size={16} className="mt-0.5 shrink-0 text-fuchsia-500"/><div><p className="text-[9px] font-black tracking-[.18em] text-fuchsia-500">THINK & CONNECT MISSION</p><p className="mt-1 text-[13px] font-black leading-6 text-slate-800">{activeMission?.prompt}</p></div></div></div>
          <ReferenceStrip references={activeMission?.references}/>
          <div className="mt-4"><ThinkConnectMission key={activeMission?.id} mission={activeMission} onClear={complete}/></div>
          {activeMission?.success&&<div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5"><p className="text-[10px] font-black tracking-[.12em] text-emerald-700">{activeMission.success.headline}</p><p className="mt-1 text-[10px] font-bold leading-4 text-emerald-700">{activeMission.success.discovery}</p></div>}
        </div>
      </div></section>

      <div className="group relative z-20 flex h-full cursor-col-resize touch-none items-center justify-center bg-fuchsia-100 hover:bg-violet-200" role="separator" onPointerDown={beginResize} onDoubleClick={()=>setLeftWidth(430)}><div className="flex h-16 w-6 items-center justify-center rounded-full border border-fuchsia-200 bg-white text-fuchsia-400 shadow-sm"><GripVertical size={16}/></div></div>

      <section className="min-h-0 overflow-hidden bg-fuchsia-50 p-2">
        {activeMission?.source?.embed===false?<SummaryPanel key={activeMission.id} source={activeMission.source} references={activeMission.references}/>:<SourceStudyReader key={activeMission?.id} source={activeMission?.source} className="h-full min-h-0"/>}
      </section>
    </main>

    <MissionSuccessCelebration celebration={celebration}
      nextMission={Number.isInteger(celebration?.nextIndex)?{title:missions[celebration.nextIndex]?.titleJa??missions[celebration.nextIndex]?.title}:null}
      onNext={()=>{if(advanceTimerRef.current){window.clearTimeout(advanceTimerRef.current);advanceTimerRef.current=null;}const next=celebration?.nextIndex;setCelebration(null);if(Number.isInteger(next))setActiveIndex(next);}}
      onBackToList={()=>{if(advanceTimerRef.current){window.clearTimeout(advanceTimerRef.current);advanceTimerRef.current=null;}setCelebration(null);}}
      onDismiss={()=>{if(advanceTimerRef.current){window.clearTimeout(advanceTimerRef.current);advanceTimerRef.current=null;}setCelebration(null);}}/>
  </div>;
}
