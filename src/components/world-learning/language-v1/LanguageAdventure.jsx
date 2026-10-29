import { GripVertical, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getWorldAdventureDomainPackage } from '../../../utils/worldAdventureRegistry';
import { getSpanishLanguagePackage, isSpanishExchangeCountry } from '../../../utils/sharedLanguageExchange';
import { completeWorldAdventureMission, getWorldAdventureDomainProgress } from '../../../utils/worldAdventureProgress';
import MissionSuccessCelebration from '../MissionSuccessCelebration';
import SourceStudyReader from '../SourceStudyReader';
import SourceReadingMission from './SourceReadingMission';
import CommunicationMission from './CommunicationMission';
import CommunicationStage from './CommunicationStage';

const LEVEL_META = {
  elementary:{icon:'🧒',label:'小学生'},
  juniorHigh:{icon:'🧑',label:'中学生'},
  highSchoolStandard:{icon:'🎓',label:'高校生'},
  highSchoolAdvanced:{icon:'🚀',label:'高校生 Challenge'},
};

const textOf = (value,language='ja') =>
  typeof value === 'string' ? value : (value?.[language] ?? value?.ja ?? value?.en ?? '');

export default function LanguageAdventure({
  initialLevel='highSchoolStandard',
  countryCode='rw',
  onProgressChange,
}) {
  const normalizedCountry = String(countryCode).trim().toLowerCase();
  const [languageChoice,setLanguageChoice] = useState('en');
  const spanishAvailable = isSpanishExchangeCountry(normalizedCountry);
  const packageData = languageChoice==='es' && spanishAvailable
    ? getSpanishLanguagePackage(normalizedCountry)
    : getWorldAdventureDomainPackage(normalizedCountry,'language');
  const missions = useMemo(()=>packageData?.missions ?? [],[packageData]);
  const [activeIndex,setActiveIndex] = useState(0);
  const [progress,setProgress] = useState(()=>getWorldAdventureDomainProgress(normalizedCountry,'language'));
  const [celebration,setCelebration] = useState(null);
  const [leftWidth,setLeftWidth] = useState(430);
  const cleanupRef = useRef(null);
  const advanceTimerRef = useRef(null);
  const chooseLanguage = (value) => {
    if(value===languageChoice || (value==='es'&&!spanishAvailable)) return;
    if(advanceTimerRef.current){window.clearTimeout(advanceTimerRef.current);advanceTimerRef.current=null;}
    setCelebration(null);
    setActiveIndex(0);
    setLanguageChoice(value);
  };

  useEffect(
    () => () => {
      cleanupRef.current?.();

      if (
        advanceTimerRef.current
      ) {
        window.clearTimeout(
          advanceTimerRef.current
        );
      }
    },
    []
  );

  if (!packageData || missions.length===0) {
    return <div className="flex h-screen items-center justify-center bg-slate-100 font-black">Language Adventure data がありません</div>;
  }

  const completedSet = new Set(progress?.completedMissionIds ?? []);
  const activeMission = missions[activeIndex];
  const country = packageData.country ?? {};
  const levelMeta = LEVEL_META[initialLevel] ?? LEVEL_META.highSchoolStandard;
  const completedCount = missions.filter(m=>completedSet.has(m.id)).length;

  const isUnlocked = (index) => {
    const current = missions[index];
    if (current?.buildStatus !== 'ready') return false;
    if (index===0) return true;
    return completedSet.has(current.id) || completedSet.has(missions[index-1]?.id);
  };

  const complete = (mission) => {
    const result = completeWorldAdventureMission({
      countryCode:normalizedCountry,
      domainId:'language',
      missionId:mission.id,
      points:mission.points ?? 0,
    });

    setProgress(result.progress);
    onProgressChange?.(result.progress);

    const clearedIndex =
      missions.findIndex(
        (item) =>
          item.id ===
          mission.id
      );

    const candidateIndex =
      clearedIndex >= 0
        ? clearedIndex + 1
        : -1;

    const nextIndex =
      candidateIndex >= 0 &&
      candidateIndex < missions.length
        ? candidateIndex
        : null;

    setCelebration({
      firstClear:
        result.isNewCompletion,

      points:
        Number(
          mission.points ??
          0
        ),

      title:
        textOf(
          mission.title
        ),

      nextIndex,
    });


    /* AUTO ADVANCE TO NEXT LANGUAGE MISSION */
    if (
      nextIndex !==
      null
    ) {
      if (
        advanceTimerRef.current
      ) {
        window.clearTimeout(
          advanceTimerRef.current
        );
      }


      advanceTimerRef.current =
        window.setTimeout(
          () => {
            setCelebration(
              null
            );

            setActiveIndex(
              nextIndex
            );

            advanceTimerRef.current =
              null;
          },

          1900
        );
    }
  };


  const beginResize = (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = leftWidth;
    document.body.classList.add('tp-language-resizing');

    const move = (e) => {
      const max = Math.min(640,window.innerWidth*0.52);
      setLeftWidth(Math.round(Math.max(330,Math.min(max,startWidth+e.clientX-startX))));
    };

    const stop = () => {
      window.removeEventListener('pointermove',move);
      window.removeEventListener('pointerup',stop);
      window.removeEventListener('pointercancel',stop);
      document.body.classList.remove('tp-language-resizing');
      cleanupRef.current = null;
    };

    cleanupRef.current = stop;
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',stop);
    window.addEventListener('pointercancel',stop);
  };

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-slate-100 text-slate-900">
      <style>{`
        .tp-language-workspace{display:grid;grid-template-columns:minmax(0,1fr)}
        .tp-language-resizer{display:none}
        @media(min-width:1024px){
          .tp-language-workspace{grid-template-columns:var(--tp-left) 12px minmax(0,1fr);overflow:hidden}
          .tp-language-resizer{display:flex}
        }
        .tp-language-resizing,.tp-language-resizing *{cursor:col-resize!important;user-select:none!important}
      `}</style>

      <MissionSuccessCelebration
        celebration={
          celebration
        }
        nextMission={
          Number.isInteger(
            celebration?.nextIndex
          )
            ? {
                title:
                  textOf(
                    missions[
                      celebration.nextIndex
                    ]?.title
                  ),
              }
            : null
        }
        onNext={() => {
          if (
            advanceTimerRef.current
          ) {
            window.clearTimeout(
              advanceTimerRef.current
            );

            advanceTimerRef.current =
              null;
          }


          const nextIndex =
            celebration?.nextIndex;


          setCelebration(
            null
          );


          if (
            Number.isInteger(
              nextIndex
            )
          ) {
            setActiveIndex(
              nextIndex
            );
          }
        }}
        onBackToList={() => {
          if (
            advanceTimerRef.current
          ) {
            window.clearTimeout(
              advanceTimerRef.current
            );

            advanceTimerRef.current =
              null;
          }

          setCelebration(
            null
          );
        }}
        onDismiss={() => {
          if (
            advanceTimerRef.current
          ) {
            window.clearTimeout(
              advanceTimerRef.current
            );

            advanceTimerRef.current =
              null;
          }

          setCelebration(
            null
          );
        }}
      />

      <header className="shrink-0 bg-gradient-to-r from-slate-950 via-violet-950 to-fuchsia-950 text-white shadow-lg">
        <div className="flex items-center justify-between gap-4 px-5 py-3 pr-20">
          <div className="min-w-0">
            <p className="text-[8px] font-black tracking-[0.20em] text-violet-300">TIMEPALETTE · LANGUAGE & COMMUNICATION</p>
            <h1 className="mt-0.5 truncate text-lg font-black md:text-2xl">{country.nameEn} · Language Adventure</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black">{country.flag} {country.nameEn}</span>
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black">{levelMeta.icon} {levelMeta.label}</span>
            <span className="rounded-full bg-fuchsia-400 px-3 py-1.5 text-[10px] font-black text-slate-950">{completedCount}/10 CLEAR</span>
          </div>
        </div>

        {spanishAvailable && <div className="flex flex-wrap items-center gap-2 border-t border-white/10 px-4 py-2.5" aria-label="練習する言語を選択">
          <span className="mr-2 text-xs font-bold text-violet-200">練習する言語</span>
          <button type="button" aria-pressed={languageChoice==='en'} onClick={()=>chooseLanguage('en')} className={'rounded-xl px-4 py-2 text-sm font-black '+(languageChoice==='en'?'bg-white text-violet-900':'bg-white/10 text-white')}>🌎 English</button>
          <button type="button" aria-pressed={languageChoice==='es'} onClick={()=>chooseLanguage('es')} className={'rounded-xl px-4 py-2 text-sm font-black '+(languageChoice==='es'?'bg-white text-violet-900':'bg-white/10 text-white')}>🇪🇸 Español</button>
          <span className="ml-auto text-xs text-violet-200">各10ミッション・進捗は別々</span>
        </div>}
        <div className="border-t border-white/10 bg-white/5 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <p className="shrink-0 text-[8px] font-black tracking-[0.18em] text-violet-200">MISSION</p>
            <div className="flex min-w-0 gap-2 overflow-x-auto">
              {missions.map((mission,index)=>{
                const completed = completedSet.has(mission.id);
                const unlocked = isUnlocked(index);
                const active = index===activeIndex;
                return (
                  <button key={mission.id} disabled={!unlocked} onClick={()=>setActiveIndex(index)}
                    className={`shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black ${
                      active ? 'border-fuchsia-300 bg-fuchsia-400 text-slate-950' :
                      completed ? 'border-emerald-300 bg-emerald-400 text-slate-950' :
                      unlocked ? 'border-white/20 bg-white/10 text-white' :
                      'border-white/10 bg-white/5 text-white/30'
                    }`}>
                    M{String(index+1).padStart(2,'0')}{completed?' ✓':''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="tp-language-workspace min-h-0 flex-1" style={{'--tp-left':`${leftWidth}px`}}>
        <section className="flex min-h-0 flex-col overflow-hidden border-r border-slate-200 bg-white">
          <div className="shrink-0 bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 px-4 py-3.5 text-white">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-black">MISSION {String(activeIndex+1).padStart(2,'0')}</span>
              <span className="rounded-full bg-fuchsia-400 px-2.5 py-1 text-[9px] font-black text-slate-950">+{activeMission?.points ?? 0} WP</span>
            </div>
            <div className="mt-2.5 flex items-center gap-2.5">
              <span className="text-2xl">{activeMission?.icon ?? '🗣️'}</span>
              <h2 className="min-w-0 truncate text-xl font-black">{textOf(activeMission?.title)}</h2>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
            {activeMission?.action && (
              <div className="shrink-0 rounded-xl bg-violet-50 px-3.5 py-2.5">
                <p className="text-[13px] font-black leading-5 text-violet-900">👉 {activeMission.action}</p>
              </div>
            )}

            {completedSet.has(activeMission?.id) && activeMission?.success && (
              <div className="mt-2.5 shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
                <div className="flex items-start gap-2">
                  <Sparkles size={15} className="mt-0.5 shrink-0 text-emerald-600"/>
                  <div>
                    <p className="text-[12px] font-black leading-5 text-emerald-900">{activeMission.success.headline}</p>
                    <p className="mt-0.5 text-[10px] font-bold leading-4 text-emerald-700">{activeMission.success.discovery}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 min-h-0 flex-1 overflow-hidden">
              {activeMission?.source
                ? <SourceReadingMission key={activeMission.id} mission={activeMission} countryCode={normalizedCountry} onClear={complete}/>
                : <CommunicationMission key={activeMission.id} mission={activeMission}/>}
            </div>
          </div>
        </section>

        <div className="tp-language-resizer group relative z-20 h-full cursor-col-resize touch-none items-center justify-center bg-slate-100 hover:bg-violet-100"
          role="separator" onPointerDown={beginResize} onDoubleClick={()=>setLeftWidth(430)}>
          <div className="flex h-16 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm group-hover:text-violet-600">
            <GripVertical size={16}/>
          </div>
        </div>

        <section className="min-h-0 overflow-hidden bg-slate-100 p-2">
          {activeMission?.source
            ? <SourceStudyReader key={activeMission.id} source={activeMission.source} className="h-full min-h-0"/>
            : <CommunicationStage key={activeMission.id} mission={activeMission} countryCode={normalizedCountry} onClear={complete}/>}
        </section>
      </main>
    </div>
  );
}
