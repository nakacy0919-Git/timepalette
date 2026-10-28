import {getRwandaFormat,countryLabel,portLabel,seaLabel} from '../../../utils/geographyRwandaFormat.js';
import {toggleBoundedSelection,selectedAnswersCorrect,shuffleChoices} from '../../../utils/rwandaAnswerContract.js';
import flags from '../../../data/exploreCountryFlags.json';
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
function CountryShape({country,label,color='#334155'}){
  const f=land(country),projection=geoMercator().fitExtent([[12,12],[228,138]],collection([f]));
  return <svg viewBox="0 0 240 150" role="img" aria-label={label||country.nameEn||country.name}><path d={geoPath(projection)(f)} fill={color} stroke="#fff" strokeWidth=".5"/></svg>;
}
function layoutCities(cities,projection,height=360){
  const points=cities.map(c=>{const actual=projection(c.coordinates);return {city:c,actual,x:actual[0],y:actual[1]};});
  for(let pass=0;pass<60;pass++)for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
    const a=points[i],b=points[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d<56){if(d<.001){dx=0;dy=1;d=1;}const force=(56-d)/2+.1;const fx=dx/d*force,fy=dy/d*force;a.x=Math.max(26,Math.min(694,a.x-fx));a.y=Math.max(26,Math.min(height-26,a.y-fy));b.x=Math.max(26,Math.min(694,b.x+fx));b.y=Math.max(26,Math.min(height-26,b.y+fy));}
  }
  return points;
}
function GeoMap({p,world=false,countries=[p],cities=[],onCountry,onCity,labels=true,numbered=false,continentMode=false,onContinent,scope=null,regions=[],onRegion}){
  const portrait=useSyncExternalStore(subscribePortrait,portraitSnapshot,()=>false);
  const mapHeight=!world&&cities.length&&portrait?720:360;
  const svgRef=useRef(null),zoomRef=useRef(null);
  const [transform,setTransform]=useState({x:0,y:0,k:1});
  useEffect(()=>{const node=svgRef.current;const behavior=createZoom().extent([[0,0],[720,mapHeight]]).translateExtent([[0,0],[720,mapHeight]]).scaleExtent([1,8]).touchable(()=>true).on('zoom',event=>setTransform({x:event.transform.x,y:event.transform.y,k:event.transform.k}));zoomRef.current=behavior;select(node).call(behavior).on('dblclick.zoom',null);return()=>{select(node).on('.zoom',null);zoomRef.current=null;};},[mapHeight]);
  const zoom=factor=>{if(zoomRef.current)select(svgRef.current).call(zoomRef.current.scaleBy,1/factor);};
  const reset=()=>{if(zoomRef.current)select(svgRef.current).call(zoomRef.current.transform,zoomIdentity);};
  const projection=useMemo(()=>{
    if(scope==='europe')return geoMercator().fitExtent([[65,30],[650,330]],{type:'MultiPoint',coordinates:[[-25,32],[55,72]]});
    if(scope)return geoMercator().rotate(scope==='oceania'?[-150,0]:[0,0]).fitExtent([[75,35],[645,325]],collection([...features.filter(f=>CONTINENTS[scope].countries.has(f.properties.name)),...(regions.length?[{type:'Feature',geometry:{type:'MultiPoint',coordinates:regions.map(r=>r[2])}}]:[])]));
    if(world)return geoNaturalEarth1().fitExtent([[10,10],[710,345]],collection(features));
    if(countries.length===1)return geoMercator().fitExtent([[40,30],[680,mapHeight-40]],collection(countries.map(land)));
    // Context maps show the border region; full national silhouettes remain on the cards.
    const bounds=geoBounds(land(p)),dx=Math.max(5,(bounds[1][0]-bounds[0][0])*.6),dy=Math.max(4,(bounds[1][1]-bounds[0][1])*.6);
    return geoMercator().fitExtent([[40,30],[680,320]],{type:'MultiPoint',coordinates:[[Math.max(-179,bounds[0][0]-dx),Math.max(-75,bounds[0][1]-dy)],[Math.min(179,bounds[1][0]+dx),Math.min(75,bounds[1][1]+dy)]]});
  },[world,countries,p,mapHeight,scope,regions]);
  const path=geoPath(projection);
  const mapFeatures=scope?features.filter(f=>CONTINENTS[scope].countries.has(f.properties.name)):world?features:features.filter(f=>countries.some(c=>sameCountry(f,c)));
  const cityLayout=layoutCities(cities,projection,mapHeight);
  const regionLayout=regions.map(([id,label,coordinates])=>{const actual=projection(coordinates);return {id,label,actual,x:Math.max(75,Math.min(645,actual[0])),y:Math.max(30,Math.min(mapHeight-30,actual[1]))};});
  for(let pass=0;pass<80;pass++)for(let i=0;i<regionLayout.length;i++)for(let j=i+1;j<regionLayout.length;j++){
    const a=regionLayout[i],b=regionLayout[j],dx=b.x-a.x,dy=b.y-a.y;
    if(Math.abs(dx)<145&&Math.abs(dy)<55){
      if(Math.abs(dx)/145>Math.abs(dy)/55){const push=(145-Math.abs(dx))/2+.1,sign=dx>=0?1:-1;a.x=Math.max(75,Math.min(645,a.x-sign*push));b.x=Math.max(75,Math.min(645,b.x+sign*push));}
      else{const push=(55-Math.abs(dy))/2+.1,sign=dy>=0?1:-1;a.y=Math.max(30,Math.min(mapHeight-30,a.y-sign*push));b.y=Math.max(30,Math.min(mapHeight-30,b.y+sign*push));}
    }
  }
  const chooseCountry=(f)=>{if(continentMode){const key=Object.keys(CONTINENTS).find(k=>CONTINENTS[k].countries.has(f.properties.name));if(key)onContinent?.(key);return;}const c=countries.find(c=>sameCountry(f,c));onCountry?.(c?.countryCode||c?.iso||f.properties.name);};
  return <div className="tp-geo-map-wrap"><svg ref={svgRef} tabIndex="0" onKeyDown={e=>{const delta={ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]}[e.key];if(delta&&zoomRef.current){e.preventDefault();select(svgRef.current).call(zoomRef.current.translateBy,...delta);}}} className="tp-geo-map" viewBox={`0 0 720 ${mapHeight}`} data-zoom={`${transform.x},${transform.y},${transform.k}`} aria-label={world?'世界地図':'国・都市の地図'}>
    <rect width="720" height={mapHeight} rx="16" fill="#e0f2fe"/>
    <defs><clipPath id={`geo-clip-${p.countryCode}`}><rect x="0" y="0" width="720" height={mapHeight} rx="16"/></clipPath></defs>
    <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
    <g clipPath={`url(#geo-clip-${p.countryCode})`}>
    {mapFeatures.map(f=><path key={(f.id||'')+'-'+f.properties.name} d={path(f)} fill={continentMode?(Object.values(CONTINENTS).find(c=>c.countries.has(f.properties.name))?.color||'#dbe4ed'):regions.length&&sameCountry(f,p)?'#facc15':world?'#cbd5e1':countries.findIndex(c=>sameCountry(f,c))===0?'#fef3c7':palette[(countries.findIndex(c=>sameCountry(f,c))-1+10)%10]} stroke="#fff" strokeWidth={world?.6:1.2} role={onCountry||continentMode?'button':undefined} tabIndex={onCountry||continentMode?0:undefined} aria-label={onCountry?f.properties.name:undefined} data-country={countries.find(c=>sameCountry(f,c))?.countryCode||countries.find(c=>sameCountry(f,c))?.iso||f.properties.name} onClick={()=>chooseCountry(f)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseCountry(f);}}}/>)}
    </g>
    {continentMode&&Object.entries(CONTINENTS).map(([key,c])=>{const xy=projection(c.labelPosition);return <g key={key} transform={`translate(${xy})`} role="button" tabIndex="0" aria-label={c.ja} data-continent={key} onClick={()=>onContinent(key)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onContinent(key);}}}><rect x="-43" y="-15" width="86" height="30" rx="15" fill="#334155"/><text textAnchor="middle" y="4" fontSize="11" fontWeight="bold" fill="white" pointerEvents="none">{c.ja}</text></g>;})}
    {onCountry&&countries.filter(c=>!scope||CONTINENTS[scope].countries.has(c.atlasName)).map(c=>{const f=land(c);if(!f)return null;const b=geoBounds(f),screen=path.bounds(f),small=Math.abs(b[1][0]-b[0][0])<2||(world&&(screen[1][0]-screen[0][0]<20||screen[1][1]-screen[0][1]<12));const xy=projection(c.center);return small&&<g key={c.iso} transform={`translate(${xy})`} role="button" tabIndex="0" aria-label={c.nameEn||c.name} data-country={c.countryCode||c.iso} onClick={()=>onCountry(c.countryCode||c.iso)} onKeyDown={e=>{if(e.key==='Enter')onCountry(c.countryCode||c.iso);}}><circle r="11" fill="#fbbf24" stroke="#0f172a"/><text x="14" y="4" fontSize="12">●</text></g>;})}
    {regionLayout.map(({id,label,actual,x,y})=><g key={id} transform={`translate(${x},${y})`} role="button" tabIndex="0" aria-label={label} data-region={id} onClick={()=>onRegion(id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onRegion(id);}}}><line x1={actual[0]-x} y1={actual[1]-y} x2="0" y2="0" stroke="#2563eb" pointerEvents="none"/><rect x="-65" y="-22" width="130" height="44" rx="18" fill="white" stroke="#2563eb" strokeWidth="2"/><text textAnchor="middle" y="5" fontSize="13" fontWeight="bold" pointerEvents="none">{label.includes('・')?<><tspan x="0" y="-3">{label.split('・')[0]}</tspan><tspan x="0" y="14">{label.split('・').slice(1).join('・')}</tspan></>:label}</text></g>)}
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
  const [format]=useState(()=>getRwandaFormat(p));
  const [shuffledCandidates]=useState(()=>shuffleChoices(geographyCandidates(p)));
  const [picked,setPicked]=useState([]);
  const [photoChoices]=useState(()=>shuffleChoices([['limited',p.visibleClaimJa],['population','写真に写る人数から、この国の人口が求められる。'],['weather','この写真の天気が一年中続くと判断できる。'],['distance','縮尺や撮影条件がなくても、国土全体の距離を測れる。']]));
  const [routePicks,setRoutePicks]=useState({});
  const continentKey=Object.keys(CONTINENTS).find(k=>k.toLowerCase()===p.continent.replaceAll(' ','').toLowerCase());
  const [error,storeError]=useState(''),[cleared,setCleared]=useState(false),[selected,setSelected]=useState(null),[answer,setAnswer]=useState({}),[step,setStep]=useState(0),[imageState,setImageState]=useState({});
  const [feedback,setFeedback]=useState(null);
  const feedbackSerial=useRef(0);
  useEffect(()=>{if(!feedback)return;const timer=setTimeout(()=>setFeedback(null),1600);return()=>clearTimeout(timer);},[feedback]);
  const setError=message=>{storeError(message);if(message){playUiSound('wrong');setFeedback({type:'wrong',text:message,id:++feedbackSerial.current});}};
  const stepSuccess=message=>{storeError('');playUiSound('success');setFeedback({type:'correct',text:message,id:++feedbackSerial.current});};
  const candidates=shuffledCandidates;
  const mission=p.missions[index];
  const expectedPhotos=index===5?candidates.map(c=>c.countryCode):index===6?[p.countryCode,p.countryCode+'-culture']:[p.countryCode];
  const photosReady=expectedPhotos.every(code=>imageState[code]===true);
  const imageStatus=(code,ready)=>setImageState(old=>({...old,[code]:ready}));
  const verify=value=>{if(cleared)return;if([5,6,8].includes(index)&&!photosReady){setError('写真を読み込めていないため判定できません。一覧に戻ってもう一度開いてください。');return;}if(evaluateGeography(p,index,value)){setCleared(true);setFeedback(null);playUiSound('success');setError('');onComplete();}else setError('もう一度、資料の手がかりを確かめよう。');};
  const choice=(id,label,action)=> <button key={id} type="button" data-answer={id} className="tp-geo-answer" onClick={action||(()=>verify(id))}>{label}</button>;
  const capital=p.cities.find(c=>c.id===p.capitalId);
  const instructions=[
    `${CONTINENTS[continentKey]?.ja||p.continent}にある${p.nameJa}を世界地図で見つけよう。小さい国は丸いマーカーでも選べます。`,
    p.neighborKind==='land-border'?'色つきの国・地域を地図で確認し、カードを同じ色の欄へ置こう。陸上の国境を接する相手を扱います。':'陸上の国境を接する国はありません。海を隔てた周辺の国を、地図と同じ色の欄へ置こう。',
    `${p.nameJa}の輪郭を確認してから、同じ国の形を選ぼう。各図の縮尺は異なります。`,
    `${p.nameJa}の首都${format.cityLabels?.[p.cities.indexOf(capital)]||capital.name}を地図で見つけよう。`,
    `ROUND ${step+1} / ${p.cities.length} · ${format.cityLabels?.[step]||p.cities[step]?.name}（${p.cities[step]?.name}）の位置を選ぼう。`,
    `4枚の写真のうち、「${p.landscapeCueJa}」に当てはまるものを選ぼう。`,
    '写真AとBを見比べ、直接読み取れる事実を2つ選んで答え合わせしよう。',
    `${p.nameJa}から${seaLabel(p.route.sea)}へ。${p.route.domestic?'国内の港':'通過国と港'}を選び、模式ルートを完成させよう。`,
    'この写真から直接確認できることを1つ選ぼう。',
    '地図・首都・正しい情報3つで、3つの鍵を集めよう。',
  ];
  const finalAnswer=(key,value)=>{const a={...answer,[key]:value};setAnswer(a);return a;};
  const finalSelect=(key,value,expected)=>{if(value!==expected){setError('その鍵はまだ開きません。地図・首都・資料を確認しよう。');return;}setError('');const a=finalAnswer(key,value);if(key==='fact')verify(a);else{stepSuccess('鍵が開いた！');setStep(step+1);}};
  const discovery=index===9?`${p.nameJa}の首都は${capital.name}。${p.factJa}。`:index===1?`${p.neighborKind==='land-border'?'陸上の国境で接する相手':'海を隔てた周辺の国・地域'}：${p.neighbors.map(n=>n.name).join('、')}。${p.neighborNote}`:index===2?'各輪郭図の縮尺は異なります。形の比較だけでは国土面積の大小は分かりません。':index===7?`${countryLabel(p.route.via)}の${portLabel(p.route.port)}港から${seaLabel(p.route.sea)}につながる模式ルートです。${p.route.noteJa}`:index===6||index===8?'写真は一つの場所・日時を切り取った資料です。人口や年間の気候、国全体の様子を判断するには、他の地域や統計の資料も必要です。':index===5?`${p.photo.captionJa}。${p.photo.descriptionJa}`:p.factJa;
  return <div className="tp-geo-screen" data-testid="geography-mission" data-mission-type={mission.type}>
    <header className="tp-geo-top"><span>YOUR MISSION · {p.nameJa} · P{String(index+1).padStart(2,'0')} / 10</span><span>{completedOnEntry?'復習':'100 WP'}</span></header>
    <div className="tp-geo-question"><h1>{mission.title}</h1><p>{instructions[index]}</p><small>{support[level]||support.elementary}</small></div>
    <main className="tp-geo-main">
      {index===0&&<div className="tp-geo-locator"><div className="tp-geo-stage"><strong>{['CONTINENT QUEST','REGION QUEST','COUNTRY QUEST'][locatorStage]} · STAGE {locatorStage+1} / 3</strong><span>{['世界地図から、大陸を選ぼう。',p.countryCode==='ar'?'黄色の国の中心は南部。地図の南部ラベルを選ぼう（おおよその方角）。':`国連M49では「${format.regionName}」。黄色の国と地域のラベルを確かめよう。`,'周辺の国との位置関係を確認して、国を選ぼう。'][locatorStage]}</span><span className="tp-geo-stage-dots" aria-hidden="true">{[0,1,2].map(i=><i key={i} className={locatorStage>=i?'active':''}/>)}</span></div>{locatorStage===0?<GeoMap key="continent" p={p} world continentMode onContinent={key=>{if(key===continentKey){stepSuccess('大陸を発見！');setLocatorStage(1);}else setError('まだ別の大陸です。位置の手がかりを確かめよう。');}}/>:locatorStage===1?<GeoMap key="region" p={p} world scope={continentKey==='northAmerica'?null:continentKey} regions={format.regionChoices} onRegion={id=>{if(id===format.region){stepSuccess('地域を発見！');setLocatorStage(2);}else setError('大陸の中の位置を確認して、地域を選ぼう。');}}/>:<GeoMap key="neighbors" p={p} countries={[p,...p.neighbors]} onCountry={verify}/>}</div>}
      {index===1&&<RwandaNeighborPuzzle p={p} selected={selected} answer={answer} onSelect={setSelected} onPlace={(iso,card)=>{if(!card){setError('国旗のカードを選ぶか、ドラッグしよう。');return;}if(card!==iso){setError('方角・色・形を確認して、もう一度置こう。');return;}const a={...answer,[iso]:card};setAnswer(a);setSelected(null);if(Object.keys(a).length===p.neighbors.length)verify(a);else stepSuccess('カードがはまった！');}}/>}
      {index===2&&<div className="tp-geo-choice-grid tp-geo-shapes">{candidates.map((c,i)=><button type="button" key={c.countryCode} data-answer={c.countryCode} aria-label={`形 ${'ABCD'[i]}`} onClick={()=>verify(c.countryCode)}><CountryShape country={c} label={`候補 ${'ABCD'[i]}`}/><span>{'ABCD'[i]}</span></button>)}</div>}
      {(index===3||index===4)&&<GeoMap p={p} cities={p.cities} labels={false} onCity={id=>{if(index===3){verify(id);return;}if(id!==p.cities[step].id){setError('町の位置をもう一度確認しよう。');return;}setError('');const a={...answer,[id]:id};setAnswer(a);if(step===p.cities.length-1)verify(a);else{stepSuccess('町の位置を発見！');setStep(step+1);}}}/>}
      {index===5&&<div className="tp-geo-photo-grid">{candidates.map(c=><button key={c.countryCode} type="button" data-answer={c.countryCode} onClick={()=>verify(c.countryCode)}><Photo photo={c.photo} small onStatus={ready=>imageStatus(c.countryCode,ready)}/><span className="tp-geo-photo-cue">{c.landscapeCueJa}</span></button>)}</div>}
      {index===6&&<div className="tp-geo-life"><div className="tp-geo-two-photos"><div><strong>写真A · 景観</strong><Photo photo={p.photo} onStatus={ready=>imageStatus(p.countryCode,ready)}/></div><div><strong>写真B · 文化の一例</strong><Photo photo={format.culturePhoto} onStatus={ready=>imageStatus(p.countryCode+'-culture',ready)}/></div></div><div className="tp-geo-life-choices">{format.lifeChoices.map(c=><button key={c.id} type="button" data-answer={c.id} aria-pressed={picked.includes(c.id)} onClick={()=>setPicked(toggleBoundedSelection(picked,c.id,2))}>{picked.includes(c.id)?'☑':'☐'} {c.label}</button>)}</div><button type="button" className="tp-geo-primary" disabled={picked.length!==2} onClick={()=>{if(!photosReady){setError('写真を読み込んでから答え合わせしよう。');return;}if(selectedAnswersCorrect(picked,format.lifeChoices,2))verify(['visible','limited']);else setError('写真に直接写っていることを2つ選ぼう。');}}>2つ選んで答え合わせ</button></div>}
      {index===7&&<RwandaRoute p={p} picks={routePicks} onPick={(key,value)=>setRoutePicks(old=>({...old,[key]:value}))} onDepart={()=>verify(routePicks)}/>}
      {index===8&&<div className="tp-geo-split"><Photo photo={p.photo} onStatus={ready=>imageStatus(p.countryCode,ready)}/><div className="tp-geo-choice-stack">{photoChoices.map(([id,label])=>choice(id,label))}</div></div>}
      {index===9&&<div className="tp-geo-final"><div className="tp-geo-keys"><span>{answer.map?'🔑':'🔒'} 位置</span><span>{answer.capital?'🔑':'🔒'} 首都</span><span>{answer.fact?'🔑':'🔒'} 地理</span></div>{step===0?<GeoMap p={p} countries={[p,...p.neighbors]} onCountry={id=>finalSelect('map',id,p.countryCode)}/>:step===1?<GeoMap p={p} cities={p.cities} labels={false} onCity={id=>finalSelect('capital',id,p.capitalId)}/>:<div className="tp-geo-final-facts"><strong>正しい情報を3つ選ぼう！</strong><div className="tp-geo-life-choices">{format.facts.map(c=><button key={c.id} type="button" data-fact={c.id} aria-pressed={picked.includes(c.id)} onClick={()=>setPicked(toggleBoundedSelection(picked,c.id,3))}>{picked.includes(c.id)?'🔑':'◇'} {c.label}</button>)}</div><button type="button" className="tp-geo-primary" disabled={picked.length!==3} onClick={()=>{if(selectedAnswersCorrect(picked,format.facts,3))finalSelect('fact','fact','fact');else setError('これまでの地形・首都・海へのつながりを思い出そう。');}}>🔑 最後の鍵をアンロック！</button></div>}</div>}
    </main>
    <footer className="tp-geo-feedback" aria-live="polite">{error||'地図・写真・資料から考えてみよう。'} {index===5&&<div className="tp-geo-source-links">{candidates.map((c,i)=><a key={c.countryCode} href={c.photo.sourceUrl} target="_blank" rel="noreferrer">写真{i+1}の出典・利用条件</a>)}</div>} {p.capitalNote&&index===3&&<small>{p.capitalNote}</small>} {[3,4,9].includes(index)&&p.sources.some(s=>s.credit==='GeoNames')&&<small>都市点：Natural Earth / <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a>（<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>）</small>}</footer>
    {feedback&&!cleared&&<div key={feedback.id} className={'tp-geo-answer-feedback '+feedback.type} role="status" aria-live="polite"><div><span aria-hidden="true">{feedback.type==='correct'?'✦':'↻'}</span><strong>{feedback.type==='correct'?'いいね！':'もう一度チャレンジ！'}</strong><p>{feedback.text}</p></div></div>}
    {cleared&&<div className="tp-geo-confetti" aria-hidden="true">{Array.from({length:60},(_,i)=><i key={i} style={{left:`${i*37%100}%`,background:['#facc15','#34d399','#38bdf8','#f472b6','#a78bfa'][i%5],animationDelay:`${i%10*.09}s`}}/>)}</div>}
    {cleared&&<div className="tp-geo-success" role="dialog" aria-modal="true" aria-label="Mission clear"><div><span>🏆</span><h2>MISSION CLEAR!</h2><h3>{p.nameJa} · P{String(index+1).padStart(2,'0')}</h3><p>{discovery}</p><p>{completedOnEntry?'復習完了 · 加点済み':'初回クリア · 100 WP'}</p><div><button type="button" onClick={onBack}>一覧へ</button><button type="button" onClick={onNext}>{index<9?'次のミッションへ':'地理マスター完了'}</button></div></div></div>}
  </div>;
}

function RwandaNeighborPuzzle({p,selected,answer,onSelect,onPlace}) {
  const [cards]=useState(()=>shuffleChoices(p.neighbors));
  const [ghost,setGhost]=useState(null);
  const drag=useRef(null);
  const moved=useRef(false);
  const sectors=['北西','北','北東','西','中央','東','南西','南','南東'];
  const direction=n=>neighborDirection(p,n)||'東';
  return <div className="tp-geo-neighbor-game" data-answer-contract="rwanda-neighbor">
    <div className="tp-geo-neighbor-context"><GeoMap p={p} countries={[p,...p.neighbors]}/><p className="tp-geo-note">{p.neighborKind==='land-border'?'国境の方向を示す模式パズルです。正確な国境線は左の地図で確認しよう。':'陸上の隣国はありません。海を隔てた位置関係のパズルです。'}{p.neighborNote}</p></div>
    <div className="tp-geo-compass-board">{sectors.map(sector=><section key={sector} data-direction={sector}>{sector==='中央'?<div className="tp-geo-center-country"><CountryShape country={p}/><strong>{p.nameJa}</strong></div>:<><small>{sector}</small>{p.neighbors.filter(n=>direction(n)===sector).map(n=>{const i=p.neighbors.indexOf(n);return <button key={n.iso} type="button" data-slot={n.iso} style={{borderColor:palette[i]}} onClick={()=>onPlace(n.iso,selected)}><span className="tp-geo-slot-color" style={{background:palette[i]}}>{i+1}</span>{answer[n.iso]?<><img src={flags.flags[n.iso]} alt=""/>{countryLabel(n.name,n.iso)} ✓</>:<span>ここに置く</span>}</button>;})}</>}</section>)}</div>
    <div className="tp-geo-drag-cards">{cards.map(n=>{const done=!!answer[n.iso];return <button key={n.iso} type="button" data-card={n.iso} style={{borderColor:palette[p.neighbors.indexOf(n)]}} disabled={done} aria-pressed={selected===n.iso} onPointerDown={e=>{if(e.button!==0)return;moved.current=false;drag.current={iso:n.iso,x:e.clientX,y:e.clientY};e.currentTarget.setPointerCapture(e.pointerId);onSelect(n.iso);}} onPointerMove={e=>{if(!drag.current)return;if(Math.hypot(e.clientX-drag.current.x,e.clientY-drag.current.y)>6){moved.current=true;setGhost({iso:n.iso,name:countryLabel(n.name,n.iso),x:e.clientX,y:e.clientY});}}} onPointerCancel={()=>{drag.current=null;setGhost(null);}} onPointerUp={e=>{if(!drag.current)return;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-slot]');if(target&&moved.current)onPlace(target.dataset.slot,drag.current.iso);drag.current=null;setGhost(null);}} onClick={()=>{if(!moved.current)onSelect(n.iso);moved.current=false;}}><img src={flags.flags[n.iso]} alt=""/><CountryShape country={n} color={palette[p.neighbors.indexOf(n)]}/><strong>{countryLabel(n.name,n.iso)}{done?' ✓':''}</strong></button>;})}</div>
    {ghost&&<div className="tp-geo-drag-ghost" style={{left:ghost.x,top:ghost.y}}><img src={flags.flags[ghost.iso]} alt=""/>{ghost.name}</div>}
  </div>;
}
function RwandaRoute({p,picks,onPick,onDepart}) {
 const [countries]=useState(()=>shuffleChoices([p.route.via,...p.neighbors.map(n=>n.name).filter(n=>n!==p.route.via).slice(0,2),...geographyCandidates(p).map(c=>c.nameEn).filter(n=>n!==p.route.via)].filter((v,i,a)=>a.indexOf(v)===i).slice(0,3)));
 const [ports]=useState(()=>shuffleChoices([p.route,...geographyCountries.filter(c=>c.route.port!==p.route.port).map(c=>c.route)].filter((v,i,a)=>a.findIndex(x=>x.port===v.port)===i).slice(0,3)));
 return <div className="tp-geo-route tp-geo-rwanda-route" data-answer-contract="rwanda-route">
  <div className="tp-geo-route-line">{p.nameJa} → {picks.via?countryLabel(picks.via):'国を選ぶ'} → {picks.port?portLabel(picks.port):'港を選ぶ'} → {seaLabel(p.route.sea)}</div>
  <p>STEP 1 · {p.route.domestic?'国内の港へ運ぶ国':'通過する国'}を選ぼう</p>
  <div className="tp-geo-route-cards">{countries.map(name=><button type="button" key={name} data-answer={'via-'+name} aria-pressed={picks.via===name} onClick={()=>onPick('via',name)}><CountryShape country={geographyCountries.find(c=>c.nameEn===name)||p.neighbors.find(n=>n.name===name)||{atlasName:name}} label={name+'の輪郭'}/><strong>{countryLabel(name)}</strong></button>)}</div>
  <p>STEP 2 · {seaLabel(p.route.sea)}につながる港を選ぼう</p>
  <div className="tp-geo-route-cards">{ports.map(route=><button type="button" key={route.port} data-answer={'port-'+route.port} aria-pressed={picks.port===route.port} onClick={()=>onPick('port',route.port)}><span className="tp-geo-port-symbol" aria-hidden="true">⚓</span><strong>{portLabel(route.port)}港</strong><small>{countryLabel(route.via)} · {seaLabel(route.sea)}</small></button>)}</div>
  <button type="button" className="tp-geo-primary" disabled={!picks.via||!picks.port} onClick={onDepart}>🚚 トラックを出発させる！</button>
  <p>輪郭と港の接続を示す図カードです。{p.route.noteJa}</p>
 </div>;
}
