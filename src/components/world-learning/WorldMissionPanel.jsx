import {forCreatorLearningLevel} from '../../utils/creatorMissionLevels.js';
import {useEffect,useState} from 'react';
import {MISSION_DOMAINS,isCreatorDomain} from '../../utils/missionDomains.js';
import {savePublishedSummary} from '../../utils/publishedMissionSummary.js';
import {fetchPublishedCountry} from '../../utils/publishedMissionCatalog.js';
import {getCountryProgress,completeWorldMission} from '../../utils/worldProgressStorage';
import {getPlaceProgress} from '../../utils/placeProgressStorage';
import {getReleasedGeographyPackage} from '../../utils/geographyRegistry.js';
import PlaceAdventureLauncher from './PlaceAdventureLauncher';
import TimeAdventureLauncher from './TimeAdventureLauncher';
import MissionPlayer from './MissionPlayer';

const levels=[['elementary','小学生'],['juniorHigh','中学生'],['highSchoolStandard','高校生'],['highSchoolAdvanced','Challenge']];
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
  const pick=id=>{
    setActive(null);
    if(id==='place'&&(geo||countryCode==='rw')){setAdventure('place');return;}
    if(id==='time'&&countryCode==='rw'){setAdventure('time');return;}
    setDomain(id);
  };
  return <section className="rounded-3xl bg-white p-4 shadow-sm md:p-6" data-testid="country-missions">
    <header className="mb-4 flex items-center gap-3">
      {flagUrl&&<img src={flagUrl} alt="" className="h-9 w-14 rounded object-contain"/>}
      <div><h2 className="text-xl font-black text-slate-900">{countryNameJa||countryNameEn}</h2><p className="text-sm text-slate-500">{countryNameEn} · World Adventure</p></div>
    </header>
    <div className="mb-5 flex flex-wrap gap-2" aria-label="学習レベル">{levels.map(([id,label])=><button key={id} type="button" aria-pressed={level===id} onClick={()=>setLevel(id)} className={'rounded-full border px-4 py-2 font-bold '+(level===id?'bg-slate-900 text-white':'bg-white text-slate-700')}>{label}</button>)}</div>
    {!domain?<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{MISSION_DOMAINS.map((d,i)=>{
      const available=d.id==='place'?(geo?10:countryCode==='rw'?10:0):d.id==='time'?(countryCode==='rw'?10:0):levelCatalog.filter(m=>m.domain===d.id).length;
      const done=d.id==='place'?[...placeDone].filter(id=>id.startsWith(countryCode+'-place-')).length:levelCatalog.filter(m=>m.domain===d.id&&completed.has(m.id)).length;
      return <button key={d.id} type="button" data-domain={d.id} onClick={()=>pick(d.id)} className="min-h-36 rounded-3xl p-5 text-left text-white shadow transition hover:brightness-110" style={{background:colors[i]}}>
        <span className="text-3xl">{d.icon}</span><h3 className="mt-2 text-lg font-black">{d.labelJa}</h3><p className="text-sm opacity-90">{d.labelEn}</p>
        <p className="mt-3 text-sm font-bold">{isCreatorDomain(d.id)?loading?'公開数を確認中…':error?'公開数を取得できません':`${done} / ${available} 問クリア`:`${Math.min(done,available)} / ${available} 問クリア`}</p>
      </button>;
    })}</div>:<>
      <button type="button" onClick={()=>setDomain(null)} className="mb-4 rounded-full border px-4 py-2 font-bold">← 6つのカテゴリーへ</button>
      <h3 className="mb-3 text-xl font-black">{meta?.icon} {meta?.labelJa}</h3>
      {isCreatorDomain(domain)?<>
        {loading?<p role="status">公開問題を読み込み中…</p>:error?<div role="alert">公開問題を取得できませんでした。<button className="ml-3 underline" onClick={retry}>再試行</button></div>:<p className="mb-4 text-sm text-slate-600">Mission Creatorから公開中：{missions.length}問{!missions.length?'。公開問題を準備中です。':''}</p>}
        <div className="grid gap-3 sm:grid-cols-2">{missions.map((m,i)=><button key={m.id} type="button" onClick={()=>setActive(m)} className="rounded-2xl border-2 border-slate-200 p-4 text-left hover:border-blue-400"><span className="text-xs font-bold text-blue-600">MISSION {String(i+1).padStart(2,'0')} {completed.has(m.id)?'✓':''}</span><h4 className="mt-2 font-bold">{m.title}</h4></button>)}</div>
      </>:<p className="rounded-xl bg-slate-50 p-4">この国の{meta?.labelJa}アドベンチャーは準備中です。</p>}
    </>}
    {error&&!domain&&<button type="button" className="mt-3 text-sm underline" onClick={retry}>公開問題の読み込みを再試行</button>}
    {active&&<MissionPlayer key={active.id} mission={{...active,learningLevelId:level,learningLevelLabel:levels.find(l=>l[0]===level)?.[1]}} domain={meta} alreadyCompleted={completed.has(active.id)} onClose={()=>setActive(null)} onBackToList={()=>setActive(null)} onComplete={m=>{completeWorldMission(countryCode,m?.id||active.id);revise(n=>n+1);}} missionPosition={missions.findIndex(m=>m.id===active.id)+1} totalMissions={missions.length}/>}
    <PlaceAdventureLauncher open={adventure==='place'} countryCode={countryCode} learningLevel={level} onClose={()=>{setAdventure(null);syncPlace();}} onProgressChange={syncPlace}/>
    <TimeAdventureLauncher open={adventure==='time'} countryCode={countryCode} learningLevel={level} onClose={()=>{setAdventure(null);revise(n=>n+1);}} onProgressChange={()=>revise(n=>n+1)}/>
  </section>;
}
