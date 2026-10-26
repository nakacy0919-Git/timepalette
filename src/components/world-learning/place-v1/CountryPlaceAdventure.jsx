import {useMemo,useState} from 'react';
import {feature} from 'topojson-client';
import {geoMercator,geoNaturalEarth1,geoPath,geoBounds} from 'd3-geo';
import atlas from 'world-atlas/countries-50m.json';
import {getGeographyPackage,geographyCandidates,sameCountry,evaluateGeography,geographyCountries} from '../../../utils/geographyRegistry.js';
import {completeWorldMission} from '../../../utils/worldProgressStorage';
import {getPlaceProgress,completePlaceMission} from '../../../utils/placeProgressStorage';
import './countryPlaceAdventure.css';

const features=feature(atlas,atlas.objects.countries).features;
const palette=['#e87932','#8b5cf6','#16a34a','#0891b2','#d946ef','#dc2626','#ca8a04','#2563eb','#64748b','#0d9488'];
const land=c=>features.find(f=>sameCountry(f,c));
const collection=fs=>({type:'FeatureCollection',features:fs.filter(Boolean)});
const direction=(p,n)=>{const dx=n.center[0]-p.center[0],dy=n.center[1]-p.center[1];return Math.abs(dx)>Math.abs(dy)*2?(dx>0?'東':'西'):Math.abs(dy)>Math.abs(dx)*2?(dy>0?'北':'南'):(dy>0?'北':'南')+(dx>0?'東':'西');};
function CountryShape({country,label}){
  const f=land(country),projection=geoMercator().fitExtent([[12,12],[228,138]],collection([f]));
  return <svg viewBox="0 0 240 150" role="img" aria-label={label||country.nameEn||country.name}><path d={geoPath(projection)(f)} fill="#334155" stroke="#fff" strokeWidth=".5"/></svg>;
}
function layoutCities(cities,projection){
  const points=cities.map(c=>{const actual=projection(c.coordinates);return {city:c,actual,x:actual[0],y:actual[1]};});
  for(let pass=0;pass<60;pass++)for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
    const a=points[i],b=points[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d<56){if(d<.001){dx=0;dy=1;d=1;}const force=(56-d)/2+.1;const fx=dx/d*force,fy=dy/d*force;a.x=Math.max(26,Math.min(694,a.x-fx));a.y=Math.max(26,Math.min(334,a.y-fy));b.x=Math.max(26,Math.min(694,b.x+fx));b.y=Math.max(26,Math.min(334,b.y+fy));}
  }
  return points;
}
function GeoMap({p,world=false,countries=[p],cities=[],onCountry,onCity,labels=true,numbered=false}){
  const [view,setView]=useState({x:0,y:0,w:720,h:360});
  const zoom=factor=>setView(v=>{const w=Math.max(90,Math.min(720,v.w*factor)),h=w/2;return {x:Math.max(0,Math.min(720-w,v.x+(v.w-w)/2)),y:Math.max(0,Math.min(360-h,v.y+(v.h-h)/2)),w,h};});
  const pan=(dx,dy)=>setView(v=>({...v,x:Math.max(0,Math.min(720-v.w,v.x+dx*v.w*.25)),y:Math.max(0,Math.min(360-v.h,v.y+dy*v.h*.25))}));
  const projection=useMemo(()=>{
    if(world)return geoNaturalEarth1().fitExtent([[10,10],[710,345]],collection(features));
    if(countries.length===1)return geoMercator().fitExtent([[40,30],[680,320]],collection(countries.map(land)));
    // Context maps show the border region; full national silhouettes remain on the cards.
    const bounds=geoBounds(land(p)),dx=Math.max(5,(bounds[1][0]-bounds[0][0])*.6),dy=Math.max(4,(bounds[1][1]-bounds[0][1])*.6);
    return geoMercator().fitExtent([[40,30],[680,320]],{type:'MultiPoint',coordinates:[[Math.max(-179,bounds[0][0]-dx),Math.max(-75,bounds[0][1]-dy)],[Math.min(179,bounds[1][0]+dx),Math.min(75,bounds[1][1]+dy)]]});
  },[world,countries,p]);
  const path=geoPath(projection);
  const mapFeatures=world?features:features.filter(f=>countries.some(c=>sameCountry(f,c)));
  const chooseCountry=(f)=>{const c=countries.find(c=>sameCountry(f,c));onCountry?.(c?.countryCode||c?.iso||f.properties.name);};
  return <svg className="tp-geo-map" viewBox={world?`${view.x} ${view.y} ${view.w} ${view.h}`:"0 0 720 360"} aria-label={world?'世界地図':'国・都市の地図'}>
    <rect width="720" height="360" rx="16" fill="#e0f2fe"/>
    <defs><clipPath id={`geo-clip-${p.countryCode}`}><rect x="0" y="0" width="720" height="360" rx="16"/></clipPath></defs>
    <g clipPath={`url(#geo-clip-${p.countryCode})`}>
    {mapFeatures.map(f=><path key={(f.id||'')+'-'+f.properties.name} d={path(f)} fill={world?'#cbd5e1':countries.findIndex(c=>sameCountry(f,c))===0?'#fef3c7':palette[(countries.findIndex(c=>sameCountry(f,c))-1+10)%10]} stroke="#fff" strokeWidth={world?.6:1.2} role={onCountry?'button':undefined} tabIndex={onCountry?0:undefined} aria-label={onCountry?f.properties.name:undefined} data-country={countries.find(c=>sameCountry(f,c))?.countryCode||f.properties.name} onClick={()=>chooseCountry(f)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseCountry(f);}}}/>)}
    </g>
    {onCountry&&countries.map(c=>{const f=land(c);if(!f)return null;const b=geoBounds(f),small=Math.abs(b[1][0]-b[0][0])<2;const xy=projection(c.center);return small&&<g key={c.iso} transform={`translate(${xy})`} role="button" tabIndex="0" aria-label={c.nameEn||c.name} data-country={c.countryCode||c.iso} onClick={()=>onCountry(c.countryCode||c.iso)} onKeyDown={e=>{if(e.key==='Enter')onCountry(c.countryCode||c.iso);}}><circle r="11" fill="#fbbf24" stroke="#0f172a"/><text x="14" y="4" fontSize="12">●</text></g>;})}
    {layoutCities(cities,projection).map(({city:c,actual,x,y},i)=><g key={c.id} transform={`translate(${x},${y})`} role="button" tabIndex="0" aria-label={c.name} data-city={c.id} onClick={()=>onCity?.(c.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onCity?.(c.id);}}}>
      <line x1={actual[0]-x} y1={actual[1]-y} x2="0" y2="0" stroke="#0f172a" strokeWidth="1" pointerEvents="none"/>
      <circle cx={actual[0]-x} cy={actual[1]-y} r="3" fill="#0f172a" pointerEvents="none"/>
      <circle data-hit="true" r="22" fill="#ffffff" fillOpacity=".85" stroke="#0f172a" strokeWidth="1.5"/>
      <text textAnchor="middle" y="5" fontSize="15" fontWeight="bold" pointerEvents="none">{i+1}</text>
      {labels&&<text x={x>550?-25:25} textAnchor={x>550?'end':'start'} y="-12" fontSize="13" pointerEvents="none" fontWeight="bold" paintOrder="stroke" stroke="white" strokeWidth="4" fill="#0f172a">{numbered?i+1:c.name}</text>}
    </g>)}
    {world&&<foreignObject x={view.x+view.w/720*10} y={view.y+view.w/720*8} width={view.w/720*400} height={view.w/720*60}>
      <div className="tp-geo-map-controls" style={{transform:`scale(${view.w/720})`,transformOrigin:'top left',width:380}}>
        <button type="button" aria-label="地図を拡大" onClick={()=>zoom(.5)}>＋</button><button type="button" aria-label="地図を縮小" onClick={()=>zoom(2)}>−</button>
        <button type="button" aria-label="地図を北へ移動" onClick={()=>pan(0,-1)}>↑</button><button type="button" aria-label="地図を南へ移動" onClick={()=>pan(0,1)}>↓</button>
        <button type="button" aria-label="地図を西へ移動" onClick={()=>pan(-1,0)}>←</button><button type="button" aria-label="地図を東へ移動" onClick={()=>pan(1,0)}>→</button>
        <button type="button" aria-label="地図全体を表示" onClick={()=>setView({x:0,y:0,w:720,h:360})}>全体</button>
      </div>
    </foreignObject>}
  </svg>;
}
function Photo({photo,small=false,onStatus}){
  const [failed,setFailed]=useState(false);
  return <figure className={small?'tp-geo-photo small':'tp-geo-photo'}>
    {failed?<div role="alert">写真を読み込めません。出典を確認してください。</div>:<img src={photo.url} alt={small?'景観の候補写真':photo.captionJa} onLoad={()=>onStatus?.(true)} onError={()=>{setFailed(true);onStatus?.(false);}} loading="eager"/>}
    <figcaption>{small?<span>{photo.credit} / {photo.license}</span>:<>{photo.captionJa} · <a href={photo.sourceUrl} target="_blank" rel="noreferrer">{photo.credit} / {photo.license}</a></>}</figcaption>
  </figure>;
}
const support={
 elementary:'地図や写真をよく見て、手がかりを見つけよう。',
 juniorHigh:'方角・位置関係・資料の根拠を使って考えよう。',
 highSchoolStandard:'場所ごとの違いと、資料から言える範囲を意識しよう。',
 highSchoolAdvanced:'地理的な接続と資料の限界を検討し、判断の根拠を説明してみよう。',
};
export default function CountryPlaceAdventure({countryCode,initialLevel='elementary',onProgressChange}){
  const p=getGeographyPackage(countryCode);
  const [index,setIndex]=useState(null),[done,setDone]=useState(()=>getPlaceProgress(countryCode).completedMissionIds);
  if(!p)return <p>この国の地理アドベンチャーは準備中です。</p>;
  return <div className="tp-geo-adventure">
    {index==null?<>
      <header className="tp-geo-home-header"><span>🌍 PLACE & GEOGRAPHY</span><h1>{p.nameJa} 地理アドベンチャー</h1><p>{p.nameEn} · 地図・写真・ルートを探る10のミッション</p><strong>{p.missions.filter(m=>done.includes(m.id)).length} / 10 CLEAR</strong></header>
      {!p.qa.releaseReady&&<p className="tp-geo-preview">制作・検証中：写真・地理・ルートの内容確認は未完了です。</p>}
      <div className="tp-geo-mission-grid">{p.missions.map((m,i)=><button type="button" key={m.id} data-mission={i+1} onClick={()=>setIndex(i)}><span>P{String(i+1).padStart(2,'0')} {done.includes(m.id)?'✓':''}</span><h2>{m.title}</h2><p>{['世界から位置を絞る','国境と方角を読む','輪郭を比べる','首都の場所を確かめる','都市の位置をつなぐ','景観の手がかりを探す','写真が示す事実を読む','港と海域のつながりを考える','事実と推測を分ける','3つの鍵で総仕上げ'][i]}</p></button>)}</div>
    </>:<Mission key={p.missions[index].id} p={p} index={index} level={initialLevel} wasDone={done.includes(p.missions[index].id)} onBack={()=>setIndex(null)} onNext={()=>setIndex(index<9?index+1:null)} onComplete={()=>{const result=completePlaceMission(p.countryCode,p.missions[index].id);setDone(result.progress.completedMissionIds);completeWorldMission(p.countryCode,p.missions[index].id);onProgressChange?.();}}/>}
  </div>;
}
function Mission({p,index,level,wasDone,onBack,onNext,onComplete}){
  const [error,setError]=useState(''),[cleared,setCleared]=useState(false),[selected,setSelected]=useState(null),[answer,setAnswer]=useState({}),[step,setStep]=useState(0),[imageState,setImageState]=useState({});
  const candidates=geographyCandidates(p);
  const mission=p.missions[index];
  const expectedPhotos=index===5?candidates.map(c=>c.countryCode):[p.countryCode];
  const photosReady=expectedPhotos.every(code=>imageState[code]===true);
  const imageStatus=(code,ready)=>setImageState(old=>({...old,[code]:ready}));
  const verify=value=>{if(cleared)return;if([5,6,8].includes(index)&&!photosReady){setError('写真を読み込めていないため判定できません。一覧に戻ってもう一度開いてください。');return;}if(evaluateGeography(p,index,value)){setCleared(true);setError('');onComplete();}else setError('もう一度、資料の手がかりを確かめよう。');};
  const choice=(id,label,action)=> <button key={id} type="button" data-answer={id} className="tp-geo-answer" onClick={action||(()=>verify(id))}>{label}</button>;
  const capital=p.cities.find(c=>c.id===p.capitalId);
  const instructions=[
    `${p.continent}にある${p.nameJa}を世界地図で見つけよう。小さい国は丸いマーカーでも選べます。`,
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
  const finalSelect=(key,value,expected)=>{if(value!==expected){setError('その鍵はまだ開きません。地図・首都・資料を確認しよう。');return;}setError('');const a=finalAnswer(key,value);if(key==='fact')verify(a);else setStep(step+1);};
  const discovery=index===9?`${p.nameJa}の首都は${capital.name}。${p.factJa}。`:index===1?`${p.neighborKind==='land-border'?'陸上の国境で接する相手':'海を隔てた周辺の国・地域'}：${p.neighbors.map(n=>n.name).join('、')}。${p.neighborNote}`:index===2?'各輪郭図の縮尺は異なります。形の比較だけでは国土面積の大小は分かりません。':index===7?`${p.route.via}の${p.route.port}港から${p.route.sea}につながる模式ルートです。${p.route.noteJa}`:index===6||index===8?'写真は一つの場所・日時を切り取った資料です。人口や年間の気候、国全体の様子を判断するには、他の地域や統計の資料も必要です。':index===5?`${p.photo.captionJa}。${p.photo.descriptionJa}`:p.factJa;
  return <div className="tp-geo-screen" data-testid="geography-mission" data-mission-type={mission.type}>
    <header className="tp-geo-top"><button onClick={onBack} type="button">← 一覧</button><span>{p.nameJa} · P{String(index+1).padStart(2,'0')} / 10</span><span>{wasDone?'復習':'100 WP'}</span></header>
    <div className="tp-geo-question"><h1>{mission.title}</h1><p>{instructions[index]}</p><small>{support[level]||support.elementary}</small></div>
    <main className="tp-geo-main">
      {index===0&&<GeoMap p={p} world countries={candidates} onCountry={verify}/>}
      {index===1&&<div className="tp-geo-split"><div><GeoMap p={p} countries={[p,...p.neighbors]}/><p className="tp-geo-note">{'周辺地域の拡大図。カードは各国・地域の輪郭。 '+p.neighborNote}</p></div><div className="tp-geo-puzzle"><div className="tp-geo-neighbor-cards">{p.neighbors.map(n=><button key={n.iso} type="button" aria-pressed={selected===n.iso} data-card={n.iso} onClick={()=>setSelected(n.iso)}>{n.name}<CountryShape country={n}/></button>)}</div><div className="tp-geo-slots">{p.neighbors.map((n,i)=><button key={n.iso} type="button" data-slot={n.iso} style={{borderColor:palette[i]}} onClick={()=>{if(!selected){setError('先に国・地域カードを選ぼう。');return;}if(selected!==n.iso){setError('色と形、位置関係を確認しよう。');return;}setError('');const a={...answer,[n.iso]:selected};setAnswer(a);setSelected(null);if(Object.keys(a).length===p.neighbors.length)verify(a);}}><span style={{background:palette[i]}}>{i+1}</span> {direction(p,n)}側：{answer[n.iso]?n.name:'カードを置く'}</button>)}</div></div></div>}
      {index===2&&<div className="tp-geo-split"><div><p className="tp-geo-note">参照：{p.nameJa}の国土</p><CountryShape country={p}/></div><div className="tp-geo-choice-grid">{candidates.map((c,i)=><button type="button" key={c.countryCode} data-answer={c.countryCode} aria-label={`形 ${i+1}`} onClick={()=>verify(c.countryCode)}><span>{i+1}</span><CountryShape country={c} label={`候補 ${i+1}`}/></button>)}</div></div>}
      {(index===3||index===4)&&<GeoMap p={p} cities={p.cities} labels={index===3||step===0&&level==='elementary'} onCity={id=>{if(index===3){verify(id);return;}if(id!==p.cities[step].id){setError('町の位置をもう一度確認しよう。');return;}setError('');const a={...answer,[id]:id};setAnswer(a);if(step===p.cities.length-1)verify(a);else setStep(step+1);}}/>}
      {index===5&&<div className="tp-geo-photo-grid">{candidates.map(c=><button key={c.countryCode} type="button" data-answer={c.countryCode} onClick={()=>verify(c.countryCode)}><Photo photo={c.photo} small onStatus={ready=>imageStatus(c.countryCode,ready)}/></button>)}</div>}
      {index===6&&<div className="tp-geo-split"><Photo photo={p.photo} onStatus={ready=>imageStatus(p.countryCode,ready)}/><div className="tp-geo-choice-stack">{[['visible',p.visibleClaimJa],['limited','この写真だけでは国全体の暮らしや気候までは分からない'],['climate','この写真だけで一年間の気候が確定できる'],['date','この写真だけで今日の人口が分かる']].map(([id,label])=><button key={id} data-answer={id} type="button" aria-pressed={!!answer[id]} onClick={()=>{const a={...answer,[id]:!answer[id]};setAnswer(a);}}>{answer[id]?'☑':'☐'} {label}</button>)}<button type="button" className="tp-geo-primary" onClick={()=>verify(Object.keys(answer).filter(k=>answer[k]))}>2つの説明を確かめる</button></div></div>}
      {index===7&&<div className="tp-geo-route"><div className="tp-geo-route-line"><span>{p.nameJa}</span> → <span>{answer.via||'国を選ぶ'}</span> → <span>{answer.port||'港を選ぶ'}</span> → <span>{p.route.sea}</span></div><div className="tp-geo-choice-grid">{[p.route.via,...geographyCountries.filter(c=>c.nameEn!==p.route.via).slice(0,2).map(c=>c.nameEn)].map(v=>choice('via-'+v,v,()=>{if(v!==p.route.via){setError('海域と国の位置関係を確認しよう。');return;}setAnswer({...answer,via:v});setError('');}))}</div><div className="tp-geo-choice-grid">{[...new Set([p.route.port,'Rotterdam','Singapore'])].map(v=>choice('port-'+v,v,()=>{if(v!==p.route.port){setError('目的の海域につながる港を選ぼう。');return;}const a={...answer,port:v};setAnswer(a);verify(a);}))}</div><p>{p.route.noteJa}</p></div>}
      {index===8&&<div className="tp-geo-split"><Photo photo={p.photo} onStatus={ready=>imageStatus(p.countryCode,ready)}/><div className="tp-geo-choice-stack">{choice('limited','この場所の景観の一例。国全体へ一般化するには他地域の資料も必要。')}{choice('population','写真に写る人数から、この国の人口が求められる。')}{choice('weather','この写真の天気が一年中続くと判断できる。')}{choice('distance','縮尺や撮影条件がなくても、国土全体の距離を測れる。')}</div></div>}
      {index===9&&<div className="tp-geo-final"><div className="tp-geo-keys"><span>{answer.map?'🔑':'🔒'} 位置</span><span>{answer.capital?'🔑':'🔒'} 首都</span><span>{answer.fact?'🔑':'🔒'} 地理</span></div>{step===0?<GeoMap p={p} world countries={candidates} onCountry={id=>finalSelect('map',id,p.countryCode)}/>:step===1?<GeoMap p={p} cities={p.cities} onCity={id=>finalSelect('capital',id,p.capitalId)}/>:<div className="tp-geo-choice-stack">{choice('fact',p.factJa,()=>finalSelect('fact','fact','fact'))}{choice('wrong-fact',p.landlocked?'この国から国境を越えずに外洋の海港に到着できる。':'この国は海岸を持たない内陸国である。',()=>finalSelect('fact','wrong-fact','fact'))}</div>}</div>}
    </main>
    <footer className="tp-geo-feedback" aria-live="polite">{error||'地図・写真・資料から考えてみよう。'} {index===5&&<div className="tp-geo-source-links">{candidates.map((c,i)=><a key={c.countryCode} href={c.photo.sourceUrl} target="_blank" rel="noreferrer">写真{i+1}の出典・利用条件</a>)}</div>} {p.capitalNote&&index===3&&<small>{p.capitalNote}</small>}</footer>
    {cleared&&<div className="tp-geo-success" role="dialog" aria-modal="true" aria-label="Mission clear"><div><span>🏆</span><h2>MISSION CLEAR!</h2><h3>{p.nameJa} · P{String(index+1).padStart(2,'0')}</h3><p>{discovery}</p><p>{wasDone?'復習完了 · 加点済み':'初回クリア · 100 WP'}</p><div><button type="button" onClick={onBack}>一覧へ</button><button type="button" onClick={onNext}>{index<9?'次のミッションへ':'地理マスター完了'}</button></div></div></div>}
  </div>;
}
