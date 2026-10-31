import {useEffect,useMemo,useRef,useState} from 'react';
import {Globe2,Mic2} from 'lucide-react';
import {countryFlagImageUrl} from '../../../utils/countryFlagImage.js';
import {getWorldAdventureDomainPackage} from '../../../utils/worldAdventureRegistry';
import {getAvailableExchangeLanguages,getExchangeLanguagePackage} from '../../../utils/multilingualExchange.js';
import {getSpeechLanguageName} from '../../../utils/speechRecognitionDiagnostics.js';
import {completeWorldAdventureMission,getWorldAdventureDomainProgress} from '../../../utils/worldAdventureProgress';
import MissionSuccessCelebration from '../MissionSuccessCelebration';
import SourceStudyReader from '../SourceStudyReader';
import SourceReadingMission from './SourceReadingMission';
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
  const [practiceRound,setPracticeRound]=useState(0);
  const missionListRef=useRef(null);
  const [flagImageFailed,setFlagImageFailed]=useState(false);
  const [progress,setProgress]=useState(()=>getWorldAdventureDomainProgress(iso,'language'));
  const [celebration,setCelebration]=useState(null);
  const options=getAvailableExchangeLanguages(iso);
  const packageData=getExchangeLanguagePackage(iso,languageChoice)||
    getWorldAdventureDomainPackage(iso,'language');
  const missions=useMemo(()=>packageData?.missions??[],[packageData]);
  const activeMission=missions[activeIndex]||missions[0];
  const country=packageData?.country??{};
  const countryFlagUrl=countryFlagImageUrl(iso);
  const selectedLocale=activeMission?.speech?.languageCode||'en-US';
  const selectedName=getSpeechLanguageName(selectedLocale);
  const completedSet=new Set(progress?.completedMissionIds??[]);
  const completedCount=missions.filter(m=>completedSet.has(m.id)).length;

  useEffect(()=>setFlagImageFailed(false),[iso]);
  // Closing is independent of changing mission: never schedule a delayed re-open.
  const dismissCelebration=()=>setCelebration(null);
  const restartCurrentMission=()=>{
    dismissCelebration();
    setPracticeRound(round=>round+1);
  };
  const backToMissionList=()=>{
    restartCurrentMission();
    missionListRef.current?.focus();
  };
  const selectMission=index=>{
    dismissCelebration();
    setActiveIndex(index);
    setPracticeRound(round=>round+1);
  };
  const switchLanguage=value=>{
    if(value===languageChoice||!options.some(o=>o.id===value))return;
    dismissCelebration();
    setDiagnosticOpen(false);
    setActiveIndex(0);
    setPracticeRound(round=>round+1);
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
  };
  const advance=()=>{
    const nextIndex=celebration?.nextIndex;
    dismissCelebration();
    if(Number.isInteger(nextIndex))selectMission(nextIndex);
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
      onBackToList={backToMissionList}
      onRetry={restartCurrentMission}
      onDismiss={backToMissionList}
      backLabel="ミッション一覧へ"
      finishLabel="ミッションに戻る"
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
        <button type="button" className="tp-language-diagnostic-button"
          title="音声認識チェック" aria-label={selectedName+'の音声認識チェック'}
          onClick={()=>setDiagnosticOpen(true)}>
          <Mic2 size={17}/>
          {diagnostics[selectedLocale]?.status==='matched'&&<span className="tp-language-diagnostic-check">✓</span>}
        </button>
      </div>
    </header>
    <main className="tp-language-layout">
      <nav ref={missionListRef} tabIndex={-1} className="tp-language-sidebar" aria-label="言語ミッション一覧">
        <div className="tp-language-sidebar-inner">
          {missions.map((mission,index)=>{
            const isDone=completedSet.has(mission.id);
            const active=index===activeIndex;
            const enabled=unlock(index);
            return <button key={mission.id} type="button" disabled={!enabled}
              aria-current={active?'step':undefined}
              aria-label={'Mission '+(index+1)+' '+textOf(mission.title)+(isDone?' クリア済み':'')}
              className={'tp-language-mission-button'+(active?' is-active':'')+(isDone?' is-done':'')}
              onClick={()=>selectMission(index)}>
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
        <div className="tp-language-country-tabs" aria-label={(country.nameJa||country.nameEn||iso)+'で練習できる言語'}>
          <div className="tp-language-country-identity">
            <span className="tp-language-flag" aria-hidden="true">
              {countryFlagUrl&&!flagImageFailed?
                <img src={countryFlagUrl} alt="" width="40" height="27"
                  decoding="async" loading="eager"
                  onError={()=>setFlagImageFailed(true)}/>:
                <Globe2 size={25}/>}
            </span>
            <strong>{country.nameJa||country.nameEn||iso.toUpperCase()}</strong>
          </div>
          <div className="tp-language-official-choices" aria-label="練習する言語">
            {options.map(option=><button type="button" key={option.id}
              aria-pressed={languageChoice===option.id}
              onClick={()=>switchLanguage(option.id)}
              className={'tp-language-choice-pill'+(languageChoice===option.id?' is-selected':'')}>
              <span className="tp-language-choice-icon" aria-hidden="true">{option.id.toUpperCase()}</span>
              {option.nativeName}
              {diagnostics[option.locale]?.status==='matched'&&<span aria-label="音声認識チェック済み">✓</span>}
            </button>)}
          </div>
        </div>
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
            <CommunicationStage key={activeMission.id+'-'+practiceRound} mission={activeMission}
              countryCode={iso} onClear={complete}/>}
        </div>
      </section>
    </main>
  </div>;
}
