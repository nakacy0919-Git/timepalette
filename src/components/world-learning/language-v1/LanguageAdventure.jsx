import {useEffect,useMemo,useRef,useState} from 'react';
import {Mic2} from 'lucide-react';
import {getWorldAdventureDomainPackage} from '../../../utils/worldAdventureRegistry';
import {getAvailableExchangeLanguages,getExchangeLanguagePackage} from '../../../utils/multilingualExchange.js';
import {getSpeechLanguageName} from '../../../utils/speechRecognitionDiagnostics.js';
import {completeWorldAdventureMission,getWorldAdventureDomainProgress} from '../../../utils/worldAdventureProgress';
import MissionSuccessCelebration from '../MissionSuccessCelebration';
import SourceStudyReader from '../SourceStudyReader';
import SourceReadingMission from './SourceReadingMission';
import CommunicationMission from './CommunicationMission';
import CommunicationStage from './CommunicationStage';
import SpeechRecognitionDiagnostic from './SpeechRecognitionDiagnostic';
import './languageAdventureLayout.css';

const textOf=(value,language='ja')=>
  typeof value==='string'?value:(value?.[language]??value?.ja??value?.en??'');

export default function LanguageAdventure({
  initialLevel='highSchoolStandard',
  countryCode='rw',
  onProgressChange,
}){
  const iso=String(countryCode||'').trim().toLowerCase();
  const [languageChoice,setLanguageChoice]=useState('en');
  const [diagnosticOpen,setDiagnosticOpen]=useState(false);
  const [diagnostics,setDiagnostics]=useState({});
  const [activeIndex,setActiveIndex]=useState(0);
  const [progress,setProgress]=useState(()=>getWorldAdventureDomainProgress(iso,'language'));
  const [celebration,setCelebration]=useState(null);
  const advanceTimerRef=useRef(null);
  const options=getAvailableExchangeLanguages(iso);
  const packageData=getExchangeLanguagePackage(iso,languageChoice)||
    getWorldAdventureDomainPackage(iso,'language');
  const missions=useMemo(()=>packageData?.missions??[],[packageData]);
  const activeMission=missions[activeIndex]||missions[0];
  const country=packageData?.country??{};
  const selectedLocale=activeMission?.speech?.languageCode||'en-US';
  const selectedName=getSpeechLanguageName(selectedLocale);
  const completedSet=new Set(progress?.completedMissionIds??[]);
  const completedCount=missions.filter(m=>completedSet.has(m.id)).length;

  useEffect(()=>()=>{if(advanceTimerRef.current)window.clearTimeout(advanceTimerRef.current);},[]);
  const dismissCelebration=()=>{
    if(advanceTimerRef.current){window.clearTimeout(advanceTimerRef.current);advanceTimerRef.current=null;}
    setCelebration(null);
  };
  const switchLanguage=value=>{
    if(value===languageChoice||!options.some(o=>o.id===value))return;
    dismissCelebration();
    setDiagnosticOpen(false);
    setActiveIndex(0);
    setLanguageChoice(value);
  };
  const unlock=index=>{
    const mission=missions[index];
    if(mission?.buildStatus!=='ready')return false;
    if(index===0)return true;
    return completedSet.has(mission.id)||completedSet.has(missions[index-1]?.id);
  };
  const complete=mission=>{
    const result=completeWorldAdventureMission({
      countryCode:iso,domainId:'language',missionId:mission.id,
      points:mission.points??0,
    });
    setProgress(result.progress);
    onProgressChange?.(result.progress);
    const i=missions.findIndex(m=>m.id===mission.id);
    const nextIndex=i>=0&&i+1<missions.length?i+1:null;
    setCelebration({
      firstClear:result.isNewCompletion,points:Number(mission.points??0),
      title:textOf(mission.title),nextIndex,
    });
    if(nextIndex!==null){
      if(advanceTimerRef.current)window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current=window.setTimeout(()=>{
        setCelebration(null);
        setActiveIndex(nextIndex);
        advanceTimerRef.current=null;
      },1900);
    }
  };
  const advance=()=>{
    const nextIndex=celebration?.nextIndex;
    dismissCelebration();
    if(Number.isInteger(nextIndex))setActiveIndex(nextIndex);
  };
  if(!packageData||!missions.length){
    return <div className="tp-language-v2 tp-language-empty">言語ミッションのデータがありません</div>;
  }
  return <div className="tp-language-v2" data-testid="language-adventure-v2">
    <MissionSuccessCelebration
      celebration={celebration}
      nextMission={Number.isInteger(celebration?.nextIndex)?
        {title:textOf(missions[celebration.nextIndex]?.title)}:null}
      onNext={advance}
      onBackToList={dismissCelebration}
      onDismiss={dismissCelebration}
    />
    {diagnosticOpen&&<SpeechRecognitionDiagnostic
      key={iso+'-'+selectedLocale}
      locale={selectedLocale}
      languageName={selectedName}
      onResult={result=>setDiagnostics(prev=>({...prev,[result.locale]:result}))}
      onClose={()=>setDiagnosticOpen(false)}
    />}
    <header className="tp-language-topbar">
      <div className="tp-language-brand">
        <span className="tp-language-brand-symbol" aria-hidden="true">🪐</span>
        <div className="min-w-0">
          <p className="tp-language-brand-eyebrow">TIMEPALETTE</p>
          <h1>LANGUAGE ADVENTURE</h1>
        </div>
      </div>
      <div className="tp-language-header-controls">
        <span className="tp-language-country-label" title={country.nameJa||country.nameEn}>
          <span aria-hidden="true">{country.flag||'🌍'}</span>
          <span>{country.nameJa||country.nameEn||iso.toUpperCase()}</span>
        </span>
        {options.length>1&&<label className="tp-language-select-label">
          <span className="sr-only">練習する言語</span>
          <select aria-label="練習する言語" value={languageChoice}
            onChange={event=>switchLanguage(event.target.value)}>
            {options.map(option=><option key={option.id} value={option.id}>
              {option.nativeName}{option.status==='pilot'?'（試験公開）':''}
            </option>)}
          </select>
        </label>}
        <button type="button" className="tp-language-diagnostic-button"
          title="音声認識チェック" aria-label={selectedName+'の音声認識チェック'}
          onClick={()=>setDiagnosticOpen(true)}>
          <Mic2 size={17}/>
          {diagnostics[selectedLocale]?.status==='matched'&&<span className="tp-language-diagnostic-check">✓</span>}
        </button>
      </div>
    </header>
    <main className="tp-language-layout">
      <nav className="tp-language-sidebar" aria-label="言語ミッション一覧">
        <div className="tp-language-sidebar-inner">
          {missions.map((mission,index)=>{
            const isDone=completedSet.has(mission.id);
            const active=index===activeIndex;
            const enabled=unlock(index);
            return <button key={mission.id} type="button" disabled={!enabled}
              aria-current={active?'step':undefined}
              aria-label={'Mission '+(index+1)+' '+textOf(mission.title)+(isDone?' クリア済み':'')}
              className={'tp-language-mission-button'+(active?' is-active':'')+(isDone?' is-done':'')}
              onClick={()=>setActiveIndex(index)}>
              <span className="tp-language-mission-copy">
                <span className="tp-language-mission-number">Mission {index+1}</span>
                <span className="tp-language-mission-label">{textOf(mission.title)}</span>
              </span>
              <span className="tp-language-mission-trailing" aria-hidden="true">{isDone?'✓':enabled?'›':'·'}</span>
            </button>;
          })}
        </div>
      </nav>
      <section className="tp-language-content" aria-labelledby="tp-language-current-title">
        <div className="tp-language-mission-heading">
          <span className="tp-language-heading-kicker">Mission {activeIndex+1}</span>
          <h2 id="tp-language-current-title">{textOf(activeMission?.title)}</h2>
          <span className="tp-language-mission-step">{activeIndex+1} / {missions.length}</span>
        </div>
        <div className="tp-language-activity">
          {activeMission?.source?
            <div className="tp-language-source-split">
              <SourceReadingMission key={activeMission.id} mission={activeMission}
                countryCode={iso} onClear={complete}/>
              <SourceStudyReader key={'reader-'+activeMission.id}
                source={activeMission.source} className="h-full min-h-0"/>
            </div>:
            <CommunicationStage key={activeMission.id} mission={activeMission}
              countryCode={iso} onClear={complete}/>}
        </div>
        <CommunicationMission
          countryCode={iso} country={country} languageName={selectedName}/>
      </section>
    </main>
  </div>;
}
