import {useMemo,useState,useSyncExternalStore,useEffect,useRef} from 'react';
import {select} from 'd3-selection';
import {zoom as createZoom,zoomIdentity} from 'd3-zoom';
import {playUiSound,getUiSoundEnabled,setUiSoundEnabled} from '../../../utils/uiSound.js';
import {feature} from 'topojson-client';
import {geoMercator,geoNaturalEarth1,geoPath,geoBounds} from 'd3-geo';
import atlas from 'world-atlas/countries-50m.json';
import {getGeographyPackage,geographyCandidates,sameCountry,evaluateGeography,geographyCountries} from '../../../utils/geographyRegistry.js';
import {neighborDirection} from '../../../utils/geographyTopology.js';
import {completeWorldMission} from '../../../utils/worldProgressStorage';
import {getPlaceProgress,completePlaceMission} from '../../../utils/placeProgressStorage';
import './countryPlaceAdventure.css';
import {CONTINENTS} from './geographyContinents.js';

const features=feature(atlas,atlas.objects.countries).features;
const palette=['#e87932','#8b5cf6','#16a34a','#0891b2','#d946ef','#dc2626','#ca8a04','#2563eb','#64748b','#0d9488'];
const land=c=>features.find(f=>sameCountry(f,c));
const collection=fs=>({type:'FeatureCollection',features:fs.filter(Boolean)});
const portraitQuery='(max-width: 850px) and (orientation: portrait)';
const subscribePortrait=onChange=>{const media=window.matchMedia(portraitQuery);media.addEventListener('change',onChange);return ()=>media.removeEventListener('change',onChange);};
const portraitSnapshot=()=>typeof window!=='undefined'&&window.matchMedia(portraitQuery).matches;
function CountryShape({country,label}){
  const f=land(country),projection=geoMercator().fitExtent([[12,12],[228,138]],collection([f]));
  return <svg viewBox="0 0 240 150" role="img" aria-label={label||country.nameEn||country.name}><path d={geoPath(projection)(f)} fill="#334155" stroke="#fff" strokeWidth=".5"/></svg>;
}
function layoutCities(cities,projection,height=360){
  const points=cities.map(c=>{const actual=projection(c.coordinates);return {city:c,actual,x:actual[0],y:actual[1]};});
  for(let pass=0;pass<60;pass++)for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
    const a=points[i],b=points[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d<56){if(d<.001){dx=0;dy=1;d=1;}const force=(56-d)/2+.1;const fx=dx/d*force,fy=dy/d*force;a.x=Math.max(26,Math.min(694,a.x-fx));a.y=Math.max(26,Math.min(height-26,a.y-fy));b.x=Math.max(26,Math.min(694,b.x+fx));b.y=Math.max(26,Math.min(height-26,b.y+fy));}
  }
  return points;
}
function GeoMap({p,world=false,countries=[p],cities=[],onCountry,onCity,labels=true,numbered=false,continentMode=false,onContinent,scope=null}){
  const portrait=useSyncExternalStore(subscribePortrait,portraitSnapshot,()=>false);
  const mapHeight=!world&&cities.length&&portrait?720:360;
  const svgRef=useRef(null),zoomRef=useRef(null);
  const [transform,setTransform]=useState({x:0,y:0,k:1});
  useEffect(()=>{const node=svgRef.current;const behavior=createZoom().extent([[0,0],[720,mapHeight]]).translateExtent([[0,0],[720,mapHeight]]).scaleExtent([1,8]).touchable(()=>true).on('zoom',event=>setTransform({x:event.transform.x,y:event.transform.y,k:event.transform.k}));zoomRef.current=behavior;select(node).call(behavior).on('dblclick.zoom',null);return()=>{select(node).on('.zoom',null);zoomRef.current=null;};},[mapHeight]);
  const zoom=factor=>{if(zoomRef.current)select(svgRef.current).call(zoomRef.current.scaleBy,1/factor);};
  const reset=()=>{if(zoomRef.current)select(svgRef.current).call(zoomRef.current.transform,zoomIdentity);};
  const projection=useMemo(()=>{
    if(scope)return geoMercator().rotate(scope==='oceania'?[-150,0]:[0,0]).fitExtent([[30,25],[690,335]],collection(features.filter(f=>CONTINENTS[scope].countries.has(f.properties.name))));
    if(world)return geoNaturalEarth1().fitExtent([[10,10],[710,345]],collection(features));
    if(countries.length===1)return geoMercator().fitExtent([[40,30],[680,mapHeight-40]],collection(countries.map(land)));
    // Context maps show the border region; full national silhouettes remain on the cards.
    const bounds=geoBounds(land(p)),dx=Math.max(5,(bounds[1][0]-bounds[0][0])*.6),dy=Math.max(4,(bounds[1][1]-bounds[0][1])*.6);
    return geoMercator().fitExtent([[40,30],[680,320]],{type:'MultiPoint',coordinates:[[Math.max(-179,bounds[0][0]-dx),Math.max(-75,bounds[0][1]-dy)],[Math.min(179,bounds[1][0]+dx),Math.min(75,bounds[1][1]+dy)]]});
  },[world,countries,p,mapHeight,scope]);
  const path=geoPath(projection);
  const mapFeatures=scope?features.filter(f=>CONTINENTS[scope].countries.has(f.properties.name)):world?features:features.filter(f=>countries.some(c=>sameCountry(f,c)));
  const cityLayout=layoutCities(cities,projection,mapHeight);
  const chooseCountry=(f)=>{if(continentMode){const key=Object.keys(CONTINENTS).find(k=>CONTINENTS[k].countries.has(f.properties.name));if(key)onContinent?.(key);return;}const c=countries.find(c=>sameCountry(f,c));onCountry?.(c?.countryCode||c?.iso||f.properties.name);};
  return <div className="tp-geo-map-wrap"><svg ref={svgRef} tabIndex="0" onKeyDown={e=>{const delta={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]}[e.key];if(delta&&zoomRef.current){e.preventDefault();select(svgRef.current).call(zoomRef.current.translateBy,...delta);}}} className="tp-geo-map" viewBox={`0 0 720 ${mapHeight}`} data-zoom={`${transform.x},${transform.y},${transform.k}`} aria-label={world?'世界地図':'国・都市の地図'}>
    <rect width="720" height={mapHeight} rx="16" fill="#e0f2fe"/>
    <defs><clipPath id={`geo-clip-${p.countryCode}`}><rect x="0" y="0" width="720" height={mapHeight} rx="16"/></clipPath></defs>
    <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
    <g clipPath={`url(#geo-clip-${p.countryCode})`}>
    {mapFeatures.map(f=><path key={(f.id||'')+'-'+f.properties.name} d={path(f)} fill={continentMode?(Object.values(CONTINENTS).find(c=>c.countries.has(f.properties.name))?.color||'#dbe4ed'):world?'#cbd5e1':countries.findIndex(c=>sameCountry(f,c))===0?'#fef3c7':palette[(countries.findIndex(c=>sameCountry(f,c))-1+10)%10]} stroke="#fff" strokeWidth={world?.6:1.2} role={onCountry||continentMode?'button':undefined} tabIndex={onCountry||continentMode?0:undefined} aria-label={onCountry?f.properties.name:undefined} data-country={countries.find(c=>sameCountry(f,c))?.countryCode||countries.find(c=>sameCountry(f,c))?.iso||f.properties.name} onClick={()=>chooseCountry(f)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseCountry(f);}}}/>)}
    </g>
    {continentMode&&Object.entries(CONTINENTS).map(([key,c])=>{const xy=projection(c.labelPosition);return <g key={key} transform={`translate(${xy})`} role="button" tabIndex="0" aria-label={c.ja} data-continent={key} onClick={()=>onContinent(key)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onContinent(key);}}}><rect x="-43" y="-15" width="86" height="30" rx="15" fill="#334155"/><text textAnchor="middle" y="4" fontSize="11" fontWeight="bold" fill="white" pointerEvents="none">{c.ja}</text></g>;})}
    {onCountry&&countries.filter(c=>!scope||CONTINENTS[scope].countries.has(c.atlasName)).map(c=>{const f=land(c);if(!f)return null;const b=geoBounds(f),screen=path.bounds(f),small=Math.abs(b[1][0]-b[0][0])<2||(world&&(screen[1][0]-screen[0][0]<20||screen[1][1]-screen[0][1]<12));const xy=projection(c.center);return small&&<g key={c.iso} transform={`translate(${xy})`} role="button" tabIndex="0" aria-label={c.nameEn||c.name} data-country={c.countryCode||c.iso} onClick={()=>onCountry(c.countryCode||c.iso)} onKeyDown={e=>{if(e.key==='Enter')onCountry(c.countryCode||c.iso);}}><circle r="11" fill="#fbbf24" stroke="#0f172a"/><text x="14" y="4" fontSize="12">●</text></g>;})}
    {labels&&cityLayout.map(({city:c,x,y},i)=><text key={'label-'+c.id} x={x+(x>550?-25:25)} y={y-12} textAnchor={x>550?'end':'start'} fontSize="13" fontWeight="bold" paintOrder="stroke" stroke="white" strokeWidth="4" fill="#0f172a" onClick={()=>onCity?.(c.id)}>{numbered?i+1:c.name}</text>)}
    {cityLayout.map(({city:c,actual,x,y},i)=><g key={c.id} transform={`translate(${x},${y})`} data-city={c.id} onClick={()=>onCity?.(c.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onCity?.(c.id);}}}>
      <line x1={actual[0]-x} y1={actual[1]-y} x2="0" y2="0" stroke="#0f172a" strokeWidth="1" pointerEvents="none"/>
      <circle cx={actual[0]-x} cy={actual[1]-y} r="3" fill="#0f172a" pointerEvents="none"/>
      <circle data-hit="true" role="button" tabIndex="0" aria-label={c.name} r="22" fill="#ffffff" fillOpacity=".85" stroke="#0f172a" strokeWidth="1.5"/>
      <text textAnchor="middle" y="5" fontSize="15" fontWeight="bold" pointerEvents="none">{i+1}</text>
    </g>)}
    </g>
  </svg><div className="tp-geo-map-controls">
        <button type="button" aria-label="地図を拡大" onClick={()=>zoom(.5)}>＋</button><button type="button" aria-label="地図を縮小" onClick={()=>zoom(2)}>−</button>
        <button type="button" aria-label="地図全体を表示" onClick={reset}>↺</button>
      </div><span className="tp-geo-gesture-hint">ドラッグで移動 · 2本指でズーム</span></div>;
}
function Photo({photo,small=false,onStatus}){
  const [failed,setFailed]=useState(false);
  return <figure className={small?'tp-geo-photo small':'tp-geo-photo'}>
    {failed?<div role="alert">写真を読み込めません。出典を確認してください。</div>:<img src={photo.deliveryUrl||photo.url} alt={small?'景観の候補写真':photo.captionJa} onLoad={()=>onStatus?.(true)} onError={()=>{setFailed(true);onStatus?.(false);}} loading="eager"/>}
    <figcaption>{small?<span>{photo.credit} / {photo.license}</span>:<>{photo.captionJa} · <a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.credit} / {photo.license}</a></>}</figcaption>
  </figure>;
}
const support={
 elementary:'地図や写真をよく見て、手がかりを見つけよう。',
 juniorHigh:'方角・位置関係・資料の根拠を使って考えよう。',
 highSchoolStandard:'場所ごとの違いと、資料から言える範囲を意識しよう。',
 highSchoolAdvanced:'地理的な接続と資料の限界を検討し、判断の根拠を説明してみよう。',
};
const missionIcons=['🌍','🧩','🗺️','📍','🏙️','📸','🧑‍🌾','🚚','🔎','🔑'];
const learningLevels=[['elementary','小学生'],['juniorHigh','中学生'],['highSchoolStandard','高校生'],['highSchoolAdvanced','Challenge']];
export default function CountryPlaceAdventure({countryCode,initialLevel='elementary',onProgressChange}){
  const p=getGeographyPackage(countryCode);
  const [index,setIndex]=useState(0),[run,setRun]=useState(0),[level,setLevel]=useState(initialLevel),[soundEnabled,setSoundEnabled]=useState(getUiSoundEnabled),[done,setDone]=useState(()=>getPlaceProgress(countryCode).completedMissionIds);
  if(!p)return <p>この国の地理アドベンチャーは準備中です。</p>;
  const completed=p.missions.filter(m=>done.includes(m.id)).length;
  const go=i=>{setIndex(i);setRun(n=>n+1);};
  return <div className="tp-geo-adventure tp-geo-rwanda-layout">
    <header className="tp-geo-adventure-header"><div className="tp-geo-brand-icon" aria-hidden="true">🌍</div><div><small>TIMEPALETTE · WORLD ADVENTURE</small><h1>{p.nameEn} · Place & Geography Adventure</h1></div><button type="button" className="tp-geo-sound-toggle" aria-pressed={soundEnabled} onClick={()=>{setUiSoundEnabled(!soundEnabled);setSoundEnabled(!soundEnabled);}}>{soundEnabled?'音：オン':'音：オフ'}</button><label><span className="sr-only">学習レベル</span><select aria-label="学習レベル" value={level} onChange={e=>setLevel(e.target.value)}>{learningLevels.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label></header>
    <div className="tp-geo-adventure-body"><aside className="tp-geo-sidebar"><div className="tp-geo-progress"><small>YOUR PROGRESS</small><div><strong>{completed}<small>/10</small></strong><strong>{completed*100}<small> WP</small></strong></div><span>missions · {p.nameJa}</span></div><nav aria-label="地理の10ミッション">{p.missions.map((m,i)=><button key={m.id} type="button" data-mission={i+1} aria-current={index===i?'step':undefined} onClick={()=>go(i)}><span className="tp-geo-nav-icon" aria-hidden="true">{done.includes(m.id)?'✓':missionIcons[i]}</span><span><small>P{String(i+1).padStart(2,'0')}</small><span>{m.title}</span></span></button>)}</nav></aside>
    <div className="tp-geo-workspace">{!p.qa.releaseReady&&<p className="tp-geo-preview">制作・検証中：内容確認は未完了です。</p>}
    <Mission key={p.missions[index].id+'-'+run} p={p} index={index} level={level} wasDone={done.includes(p.missions[index].id)} onBack={()=>go(index)} onNext={()=>go(index<9?index+1:0)} onComplete={()=>{const result=completePlaceMission(p.countryCode,p.missions[index].id);setDone(result.progress.completedMissionIds);completeWorldMission(p.countryCode,p.missions[index].id);onProgressChange?.();}}/>
    </div></div>
  </div>;
}
function Mission({p,index,level,wasDone,onBack,onNext,onComplete}){
  const [completedOnEntry]=useState(wasDone);
  const [locatorStage,setLocatorStage]=useState(0);
  const continentKey=Object.keys(CONTINENTS).find(k=>k.toLowerCase()===p.continent.replaceAll(' ','').toLowerCase());
  const [error,storeError]=useState(''),[cleared,setCleared]=useState(false),[selected,setSelected]=useState(null),[answer,setAnswer]=useState({}),[step,setStep]=useState(0),[imageState,setImageState]=useState({});
  const [feedback,setFeedback]=useState(null);
  const feedbackSerial=useRef(0);
  useEffect(()=>{if(!feedback)return;const timer=setTimeout(()=>setFeedback(null),1600);return()=>clearTimeout(timer);},[feedback]);
  const setError=message=>{storeError(message);if(message){playUiSound('wrong');setFeedback({type:'wrong',text:message,id:++feedbackSerial.current});}};
  const stepSuccess=message=>{storeError('');playUiSound('success');setFeedback({type:'correct',text:message,id:++feedbackSerial.current});};
  const candidates=geographyCandidates(p);
  const mission=p.missions[index];
  const expectedPhotos=index===5?candidates.map(c=>c.countryCode):[p.countryCode];
  const photosReady=expectedPhotos.every(code=>imageState[code]===true);
  const imageStatus=(code,ready)=>setImageState(old=>({...old,[code]:ready}));
  const verify=value=>{if(cleared)return;if([5,6,8].includes(index)&&!photosReady){setError('写真を読み込めていないため判定できません。一覧に戻ってもう一度開いてください。');return;}if(evaluateGeography(p,index,value)){setCleared(true);setFeedback(null);playUiSound('success');setError('');onComplete();}else setError('もう一度、資料の手がかりを確かめよう。');};
  const choice=(id,label,action)=> <button key={id} type="button" data-answer={id} className="tp-geo-answer" onClick={action||(()=>verify(id))}>{label}</button>;
  const capital=p.cities.find(c=>c.id===p.capitalId);
  const instructions=[
    `${CONTINENTS[continentKey]?.ja||p.continent}にある${p.nameJa}を世界地図で見つけよう。小さい国は丸いマーカーでも選べます。`,
    p.neighborKind==='land-border'?'色つきの国・地域を地図で確認し、カードを同じ色の欄へ置こう。陸上の国境を接する相手を扱います。':'陸上の国境を接する国はありません。海を隔てた周辺の国を、地図と同じ色の欄へ置こう。',
    `${p.nameJa}の輪郭を確認してから、同じ国の形を選ぼう。各図の縮尺は異なります。`,
    `${p.nameJa}の首都${capital.name}を地図で見つけよう。`,
    `「${p.cities[step]?.name}」の位置を、番号の付いた点から選ぼう。`,
    `4枚の写真のうち、「${p.landscapeCueJa}」に当てはまるものを選ぼう。`,
    '写真が示すことと、資料の限界について、正しい説明を2つ選ぼう。',
    `${p.nameJa}から${p.route.sea}へ。${p.route.domestic?'国内の港':'通過国と港'}を選び、模式ルートを完成させよう。`,
    'この写真を根拠にして言える範囲として、最も適切な説明を選ぼう。',
    '国の位置・首都・地理情報の3つの鍵を集めよう。',
  ];
  const finalAnswer=(key,value)=>{const a={...answer,[key]:value};setAnswer(a);return a;};
  const finalSelect=(key,value,expected)=>{if(value!==expected){setError('その鍵はまだ開きません。地図・首都・資料を確認しよう。');return;}setError('');const a=finalAnswer(key,value);if(key==='fact')verify(a);else{stepSuccess('鍵が開いた！');setStep(step+1);}};
  const discovery=index===9?`${p.nameJa}の首都は${capital.name}。${p.factJa}。`:index===1?`${p.neighborKind==='land-border'?'陸上の国境で接する相手':'海を隔てた周辺の国・地域'}：${p.neighbors.map(n=>n.name).join('、')}。${p.neighborNote}`:index===2?'各輪郭図の縮尺は異なります。形の比較だけでは国土面積の大小は分かりません。':index===7?`${p.route.via}の${p.route.port}港から${p.route.sea}につながる模式ルートです。${p.route.noteJa}`:index===6||index===8?'写真は一つの場所・日時を切り取った資料です。人口や年間の気候、国全体の様子を判断するには、他の地域や統計の資料も必要です。':index===5?`${p.photo.captionJa}。${p.photo.descriptionJa}`:p.factJa;
  return <div className="tp-geo-screen" data-testid="geography-mission" data-mission-type={mission.type}>
    <header className="tp-geo-top"><span>YOUR MISSION · {p.nameJa} · P{String(index+1).padStart(2,'0')} / 10</span><span>{completedOnEntry?'復習':'100 WP'}</span></header>
    <div className="tp-geo-question"><h1>{mission.title}</h1><p>{instructions[index]}</p><small>{support[level]||support.elementary}</small></div>
    <main className="tp-geo-main">
      {index===0&&<div className="tp-geo-locator"><div className="tp-geo-stage"><strong>{['CONTINENT QUEST','COUNTRY QUEST','NEIGHBOR QUEST'][locatorStage]} · STAGE {locatorStage+1} / 3</strong><span>{['世界地図から、大陸を選ぼう。','大陸の地図から、国を見つけよう。','周辺の国との位置関係を確認して、もう一度選ぼう。'][locatorStage]}</span><span className="tp-geo-stage-dots" aria-hidden="true">{[0,1,2].map(i=><i key={i} className={locatorStage>=i?'active':''}/>)}</span></div>{locatorStage===0?<GeoMap key="continent" p={p} world continentMode onContinent={key=>{if(key===continentKey){stepSuccess('大陸を発見！');setLocatorStage(1);}else setError('まだ別の大陸です。位置の手がかりを確かめよう。');}}/>:locatorStage===1?<GeoMap key="country" p={p} world scope={continentKey} countries={candidates} onCountry={id=>{if(id===p.countryCode){stepSuccess('国を発見！ 次は周辺の位置関係を確かめよう。');setLocatorStage(2);}else setError('もう一度、国の位置を確かめよう。');}}/>:<GeoMap key="neighbors" p={p} countries={[p,...p.neighbors]} onCountry={verify}/>}</div>}
      {index===1&&<div className="tp-geo-split"><div><GeoMap p={p} countries={[p,...p.neighbors]}/><p className="tp-geo-note">{(p.neighborKind==='land-border'?'拡大図。方角は代表点から共有国境への目安。':'拡大図。方角は国の代表点同士の目安。')+p.neighborNote}</p></div><div className="tp-geo-puzzle"><div className="tp-geo-neighbor-cards">{p.neighbors.map(n=><button key={n.iso} type="button" aria-pressed={selected===n.iso} data-card={n.iso} onClick={()=>setSelected(n.iso)}>{n.name}<CountryShape country={n}/></button>)}</div><div className="tp-geo-slots">{p.neighbors.map((n,i)=><button key={n.iso} type="button" data-slot={n.iso} style={{borderColor:palette[i]}} onClick={()=>{if(!selected){setError('先に国・地域カードを選ぼう。');return;}if(selected!==n.iso){setError('色と形、位置関係を確認しよう。');return;}setError('');const a={...answer,[n.iso]:selected};setAnswer(a);setSelected(null);if(Object.keys(a).length===p.neighbors.length)verify(a);else stepSuccess('カードの位置が合った！');}}><span style={{background:palette[i]}}>{i+1}</span> {neighborDirection(p,n)?neighborDirection(p,n)+(p.neighborKind==='land-border'?'の国境':'側'):'短い国境'}：{answer[n.iso]?n.name:'カードを置く'}</button>)}</div></div></div>}
      {index===2&&<div className="tp-geo-split"><div><p className="tp-geo-note">参照：{p.nameJa}の国土</p><CountryShape country={p}/></div><div className="tp-geo-choice-grid">{candidates.map((c,i)=><button type="button" key={c.countryCode} data-answer={c.countryCode} aria-label={`形 ${i+1}`} onClick={()=>verify(c.countryCode)}><span>{i+1}</span><CountryShape country={c} label={`候補 ${i+1}`}/></button>)}</div></div>}
      {(index===3||index===4)&&<GeoMap p={p} cities={p.cities} labels={index===3||step===0&&level==='elementary'} onCity={id=>{if(index===3){verify(id);return;}if(id!==p.cities[step].id){setError('町の位置をもう一度確認しよう。');return;}setError('');const a={...answer,[id]:id};setAnswer(a);if(step===p.cities.length-1)verify(a);else{stepSuccess('町の位置を発見！');setStep(step+1);}}}/>}
      {index===5&&<div className="tp-geo-photo-grid">{candidates.map(c=><button key={c.countryCode} type="button" data-answer={c.countryCode} onClick={()=>verify(c.countryCode)}><Photo photo={c.photo} small onStatus={ready=>imageStatus(c.countryCode,ready)}/></button>)}</div>}
      {index===6&&<div className="tp-geo-split"><Photo photo={p.photo} onStatus={ready=>imageStatus(p.countryCode,ready)}/><div className="tp-geo-choice-stack">{[['visible',p.visibleClaimJa],['limited','この写真だけでは国全体の暮らしや気候までは分からない'],['climate','この写真だけで一年間の気候が確定できる'],['date','この写真だけで今日の人口が分かる']].map(([id,label])=><button key={id} data-answer={id} type="button" aria-pressed={!!answer[id]} onClick={()=>{const a={...answer,[id]:!answer[id]};setAnswer(a);}}>{answer[id]?'☑':'☐'} {label}</button>)}<button type="button" className="tp-geo-primary" onClick={()=>verify(Object.keys(answer).filter(k=>answer[k]))}>2つの説明を確かめる</button></div></div>}
      {index===7&&<div className="tp-geo-route"><div className="tp-geo-route-line"><span>{p.nameJa}</span> → <span>{answer.via||'国を選ぶ'}</span> → <span>{answer.port||'港を選ぶ'}</span> → <span>{p.route.sea}</span></div><div className="tp-geo-choice-grid">{[p.route.via,...geographyCountries.filter(c=>c.nameEn!==p.route.via).slice(0,2).map(c=>c.nameEn)].map(v=>choice('via-'+v,v,()=>{if(v!==p.route.via){setError('海域と国の位置関係を確認しよう。');return;}setAnswer({...answer,via:v});stepSuccess('ルートがつながった！');}))}</div><div className="tp-geo-choice-grid">{[...new Set([p.route.port,'Rotterdam','Singapore'])].map(v=>choice('port-'+v,v,()=>{if(v!==p.route.port){setError('目的の海域につながる港を選ぼう。');return;}const a={...answer,port:v};setAnswer(a);verify(a);}))}</div><p>{p.route.noteJa}</p></div>}
      {index===8&&<div className="tp-geo-split"><Photo photo={p.photo} onStatus={ready=>imageStatus(p.countryCode,ready)}/><div className="tp-geo-choice-stack">{choice('limited','この場所の景観の一例。国全体へ一般化するには他地域の資料も必要。')}{choice('population','写真に写る人数から、この国の人口が求められる。')}{choice('weather','この写真の天気が一年中続くと判断できる。')}{choice('distance','縮尺や撮影条件がなくても、国土全体の距離を測れる。')}</div></div>}
      {index===9&&<div className="tp-geo-final"><div className="tp-geo-keys"><span>{answer.map?'🔑':'🔒'} 位置</span><span>{answer.capital?'🔑':'🔒'} 首都</span><span>{answer.fact?'🔑':'🔒'} 地理</span></div>{step===0?<GeoMap p={p} world countries={candidates} onCountry={id=>finalSelect('map',id,p.countryCode)}/>:step===1?<GeoMap p={p} cities={p.cities} onCity={id=>finalSelect('capital',id,p.capitalId)}/>:<div className="tp-geo-choice-stack">{choice('fact',p.factJa,()=>finalSelect('fact','fact','fact'))}{choice('wrong-fact',p.landlocked?'この国から国境を越えずに外洋の海港に到着できる。':'この国は海岸を持たない内陸国である。',()=>finalSelect('fact','wrong-fact','fact'))}</div>}</div>}
    </main>
    <footer className="tp-geo-feedback" aria-live="polite">{error||'地図・写真・資料から考えてみよう。'} {index===5&&<div className="tp-geo-source-links">{candidates.map((c,i)=><a key={c.countryCode} href={c.photo.sourceUrl} target="_blank" rel="noreferrer">写真{i+1}の出典・利用条件</a>)}</div>} {p.capitalNote&&index===3&&<small>{p.capitalNote}</small>} {[3,4,9].includes(index)&&p.sources.some(s=>s.credit==='GeoNames')&&<small>都市点：Natural Earth / <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a>（<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>）</small>}</footer>
    {feedback&&!cleared&&<div key={feedback.id} className={'tp-geo-answer-feedback '+feedback.type} role="status" aria-live="polite"><div><span aria-hidden="true">{feedback.type==='correct'?'✦':'↻'}</span><strong>{feedback.type==='correct'?'いいね！':'もう一度チャレンジ！'}</strong><p>{feedback.text}</p></div></div>}
    {cleared&&<div className="tp-geo-confetti" aria-hidden="true">{Array.from({length:60},(_,i)=><i key={i} style={{left:`${i*37%100}%`,background:['#facc15','#34d399','#38bdf8','#f472b6','#a78bfa'][i%5],animationDelay:`${i%10*.09}s`}}/>)}</div>}
    {cleared&&<div className="tp-geo-success" role="dialog" aria-modal="true" aria-label="Mission clear"><div><span>🏆</span><h2>MISSION CLEAR!</h2><h3>{p.nameJa} · P{String(index+1).padStart(2,'0')}</h3><p>{discovery}</p><p>{completedOnEntry?'復習完了 · 加点済み':'初回クリア · 100 WP'}</p><div><button type="button" onClick={onBack}>一覧へ</button><button type="button" onClick={onNext}>{index<9?'次のミッションへ':'地理マスター完了'}</button></div></div></div>}
  </div>;
}
