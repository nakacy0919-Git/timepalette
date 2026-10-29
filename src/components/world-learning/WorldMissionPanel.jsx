import {Globe,Clock,MessagesSquare,House,Handshake,Scale,ArrowUpRight} from 'lucide-react';
import CreatorChoicePlayer from './CreatorChoicePlayer.jsx';
import './creatorMissionPresentation.css';
import {forCreatorLearningLevel} from '../../utils/creatorMissionLevels.js';
import {useEffect,useState} from 'react';
import {MISSION_DOMAINS} from '../../utils/missionDomains.js';
import {savePublishedSummary} from '../../utils/publishedMissionSummary.js';
import {fetchPublishedCountry} from '../../utils/publishedMissionCatalog.js';
import {getCountryProgress,completeWorldMission} from '../../utils/worldProgressStorage';
import {getPlaceProgress} from '../../utils/placeProgressStorage';
import {getReleasedGeographyPackage} from '../../utils/geographyRegistry.js';
import PlaceAdventureLauncher from './PlaceAdventureLauncher';
import TimeAdventureLauncher from './TimeAdventureLauncher';
import LanguageAdventureLauncher from './LanguageAdventureLauncher';
import { getWorldAdventureDomainProgress } from '../../utils/worldAdventureProgress';
import { getSharedLanguagePackage, isSpanishExchangeCountry } from '../../utils/sharedLanguageExchange';
import MissionPlayer from './MissionPlayer';

const levels=[['elementary','小学生'],['juniorHigh','中学生'],['highSchoolStandard','高校生'],['highSchoolAdvanced','Challenge']];
const categoryDesign=[{Icon:Globe,tone:'#def5fc',ink:'#216c85',hint:'地図をひらいて、世界を探検！'},{Icon:Clock,tone:'#eee6ff',ink:'#685196',hint:'世界の「いま」をのぞいてみよう'},{Icon:MessagesSquare,tone:'#ffe7ee',ink:'#95485f',hint:'ことばでつながる、世界の仲間'},{Icon:House,tone:'#e0f5e9',ink:'#2e7256',hint:'暮らしの中の発見を集めよう'},{Icon:Handshake,tone:'#fff0ce',ink:'#875b20',hint:'日本と世界、つながりを探そう'},{Icon:Scale,tone:'#e3edff',ink:'#46659b',hint:'比べて考える、新しい見方'}];
const colors=['#0284c7','#7c3aed','#db2777','#059669','#dc2626','#d97706'];
export default function WorldMissionPanel({countryCode,countryNameEn,countryNameJa='',flagUrl=''}){
  // Remounting on country changes prevents previous-country missions and progress from flashing.
  return <CountryMissions key={countryCode} {...{countryCode,countryNameEn,countryNameJa,flagUrl}}/>;
}
function CountryMissions({countryCode,countryNameEn,countryNameJa,flagUrl}){
  const [level,setLevel]=useState('elementary');
  const [domain,setDomain]=useState(null);
  const [adventure,setAdventure]=useState(null);
  const [active,setActive]=useState(null);
  const [catalog,setCatalog]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [refresh,setRefresh]=useState(0);
  const [,revise]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();
    fetchPublishedCountry(countryCode,{signal:controller.signal})
      .then(m=>{if(!controller.signal.aborted){setCatalog(m);savePublishedSummary(countryCode,m);}})
      .catch(e=>{if(!controller.signal.aborted){setError(e.message);setCatalog([]);}})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[countryCode,refresh]);
  const retry=()=>{setLoading(true);setError('');setRefresh(n=>n+1);};
  const geo=getReleasedGeographyPackage(countryCode);
  const completed=new Set(getCountryProgress(countryCode).completedMissionIds);
  const placeDone=new Set(getPlaceProgress(countryCode).completedMissionIds);
  const meta=MISSION_DOMAINS.find(d=>d.id===domain);
  const levelCatalog=catalog.map(m=>forCreatorLearningLevel(m,level)).filter(Boolean);
  const missions=levelCatalog.filter(m=>m.domain===domain);
  const syncPlace=()=>{
    const allowed=new Set((geo?.missions||[]).map(m=>m.id));
    for(const id of getPlaceProgress(countryCode).completedMissionIds)if(allowed.has(id)||countryCode==='rw'&&/^rw-place-\d{2}$/.test(id))completeWorldMission(countryCode,id);
    revise(n=>n+1);
  };
  const adventureCount=id=>id==='language'&&getSharedLanguagePackage(countryCode)
    ? (isSpanishExchangeCountry(countryCode)?20:10)
    : ((id==='place'&&(geo||countryCode==='rw'))||(id==='time'&&countryCode==='rw'))?10:0;
  const pick=id=>{
    setActive(null);
    if(id==='place'&&adventureCount(id)>0){setDomain(null);setAdventure('place');return;}
    if(id==='language'&&adventureCount(id)>0){setDomain(null);setAdventure('language');return;}
    setDomain(id);
  };
  return <section className="rounded-3xl bg-white p-4 shadow-sm md:p-6" data-testid="country-missions">
    <header className="mb-4 flex items-center gap-3">
      {flagUrl&&<img src={flagUrl} alt="" className="h-9 w-14 rounded object-contain"/>}
      <div><h2 className="text-xl font-black text-slate-900">{countryNameJa||countryNameEn}</h2><p className="text-sm text-slate-500">{countryNameEn} · World Adventure</p></div>
    </header>
    <div className="mb-5 flex flex-wrap gap-2" aria-label="学習レベル">{levels.map(([id,label])=><button key={id} type="button" aria-pressed={level===id} onClick={()=>setLevel(id)} className={'rounded-full border px-4 py-2 font-bold '+(level===id?'bg-slate-900 text-white':'bg-white text-slate-700')}>{label}</button>)}</div>
    {!domain?<div className="tp-category-grid">{MISSION_DOMAINS.map((d,i)=>{
      const available=adventureCount(d.id)+levelCatalog.filter(m=>m.domain===d.id).length;
      const adventureDone=d.id==='place'?[...placeDone].filter(id=>id.startsWith(countryCode+'-place-')).length:d.id==='time'?[...completed].filter(id=>id.startsWith(countryCode+'-time-')).length:d.id==='language'?getWorldAdventureDomainProgress(countryCode,'language').completedMissionIds.filter(id=>id.startsWith(countryCode+'-language-shared-')||id.startsWith(countryCode+'-language-es-')).length:0;
      const done=Math.min(adventureDone,adventureCount(d.id))+levelCatalog.filter(m=>m.domain===d.id&&completed.has(m.id)).length;
      const {Icon,tone,ink,hint}=categoryDesign[i];
      return <button key={d.id} type="button" data-domain={d.id} onClick={()=>pick(d.id)} className="tp-world-category tp-category-pass" style={{'--category-accent':colors[i],'--category-tone':tone,'--category-ink':ink}}>
        <span className="tp-category-art" aria-hidden="true"><span className="tp-category-orbit"/><span className="tp-category-icon"><Icon size={38} strokeWidth={2.1}/></span><span className="tp-category-spark">✧</span></span>
        <span className="tp-category-body"><span className="tp-category-kicker">WORLD DISCOVERY · {String(i+1).padStart(2,'0')}</span><h3>{d.labelJa}</h3><span className="tp-category-english">{d.labelEn}</span><span className="tp-category-hint">{hint}</span></span>
        <span className="tp-category-bottom"><span className="tp-category-progress">{loading?'公開数を確認中…':error?'公開数を取得できません':`${Math.min(done,available)} / ${available} 問クリア`}{!loading&&!error&&<span className="tp-category-meter" aria-hidden="true"><span style={{width:`${available?Math.min(done,available)/available*100:0}%`}}/></span>}</span><span className="tp-category-go" aria-hidden="true"><ArrowUpRight size={21}/></span></span>
      </button>;
    })}</div>:<>
      <button type="button" onClick={()=>setDomain(null)} className="mb-4 rounded-full border px-4 py-2 font-bold">← 6つのカテゴリーへ</button>
      <h3 className="mb-3 text-xl font-black">{meta?.icon} {meta?.labelJa}</h3>
      {domain!=='place'&&adventureCount(domain)>0&&<button type="button" className="mb-5 rounded-2xl bg-blue-600 px-6 py-4 font-bold text-white" onClick={()=>setAdventure(domain)}>{domain==='place'?'地理':'時間・時差'}アドベンチャーを始める（10ミッション）</button>}
      <>
        {loading?<p role="status">公開問題を読み込み中…</p>:error?<div role="alert">公開問題を取得できませんでした。<button className="ml-3 underline" onClick={retry}>再試行</button></div>:<p className="mb-4 text-sm text-slate-600">Mission Creatorから公開中：{missions.length}問{!missions.length?'。公開問題を準備中です。':''}</p>}
        {!!missions.length&&<div className="tp-mission-journey"><div><span>YOUR ADVENTURE</span><h4>{countryNameJa||countryNameEn}の発見を集めよう！</h4><p>気になるミッションを選んで、探検スタート。</p></div><div className="tp-journey-progress"><strong>{missions.filter(m=>completed.has(m.id)).length}<small> / {missions.length}</small></strong><span>ミッションクリア</span><progress aria-label="ミッションのクリア数" value={missions.filter(m=>completed.has(m.id)).length} max={missions.length}/></div></div>}
        <div className="tp-mission-grid">{missions.map((m,i)=>{const done=completed.has(m.id);return <button key={m.id} type="button" onClick={()=>setActive(m)} className={'tp-world-mission-card tp-mission-ticket '+(done?'is-cleared':'')} style={{'--ticket-tone':['#ddf5fb','#fff0cd','#eae5ff','#ffe5e8'][i%4],'--ticket-ink':['#1d6680','#855316','#65509b','#94465c'][i%4]}}>
          <span className="tp-ticket-art" aria-hidden="true"><span className="tp-ticket-orbit"/><span className="tp-ticket-icon">{['◇','✧','◎','✦'][i%4]}</span><span className="tp-ticket-number">{String(i+1).padStart(2,'0')}</span></span>
          <span className="tp-ticket-content"><span className="tp-ticket-kicker">{meta?.icon} {meta?.labelJa} <span className="tp-ticket-status">{done?'✓ CLEAR':'探検ミッション'}</span></span><span className="tp-ticket-title">ミッション {i+1}</span><span className="tp-ticket-invitation">{done?'発見を振り返ってみよう':'どんな発見が待っているかな？'}</span><span className="tp-ticket-action">{done?'もう一度チャレンジ':'探検に出発する'} <span aria-hidden="true">➜</span></span></span>
          {done&&<span className="tp-ticket-stamp" aria-hidden="true">★</span>}
        </button>;})}</div>
      </>
    </>}
    {error&&!domain&&<button type="button" className="mt-3 text-sm underline" onClick={retry}>公開問題の読み込みを再試行</button>}
    {active?.type==='single-choice'?<CreatorChoicePlayer key={active.id} mission={active} position={missions.findIndex(m=>m.id===active.id)+1} total={missions.length} alreadyCompleted={completed.has(active.id)} onClose={()=>setActive(null)} onComplete={m=>{completeWorldMission(countryCode,m.id);revise(n=>n+1);}} onNext={missions.findIndex(m=>m.id===active.id)<missions.length-1?()=>setActive(missions[missions.findIndex(m=>m.id===active.id)+1]):null}/>:active&&<MissionPlayer key={active.id} mission={{...active,learningLevelId:level,learningLevelLabel:levels.find(l=>l[0]===level)?.[1]}} domain={meta} alreadyCompleted={completed.has(active.id)} onClose={()=>setActive(null)} onBackToList={()=>setActive(null)} onComplete={m=>{completeWorldMission(countryCode,m?.id||active.id);revise(n=>n+1);}} missionPosition={missions.findIndex(m=>m.id===active.id)+1} totalMissions={missions.length}/>}
    <PlaceAdventureLauncher open={adventure==='place'} countryCode={countryCode} learningLevel={level} onClose={()=>{setAdventure(null);syncPlace();}} onProgressChange={syncPlace}/>
    <TimeAdventureLauncher open={adventure==='time'} countryCode={countryCode} learningLevel={level} onClose={()=>{setAdventure(null);revise(n=>n+1);}} onProgressChange={()=>revise(n=>n+1)}/>
    <LanguageAdventureLauncher open={adventure==='language'} countryCode={countryCode} learningLevel={level} creatorMissionCount={levelCatalog.filter(m=>m.domain==='language').length} onOpenCreatorMissions={()=>{setAdventure(null);setDomain('language');}} onClose={()=>{setAdventure(null);revise(n=>n+1);}} onProgressChange={()=>revise(n=>n+1)}/>
  </section>;
}
