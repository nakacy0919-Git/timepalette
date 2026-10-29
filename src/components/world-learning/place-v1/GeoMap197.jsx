import {useEffect,useMemo,useRef,useState} from 'react';
import {geoPath,geoBounds} from 'd3-geo';
import {select} from 'd3-selection';
import {zoom,zoomIdentity} from 'd3-zoom';
import {geographyWorld197 as world,countryFeatures197,geographyProjection197} from '../../../utils/geography197Map.js';

const colors=['#fbbf24','#60a5fa','#a78bfa','#4ade80','#fb7185','#22d3ee','#f97316','#e879f9'];
export default function GeoMap197({country,worldView=false,contextWorld=false,scopeCodes,places=[],onCountry,onPlace,numbered=false,showNames=false,focusPoints=[],onContinent}){
 const ref=useRef(null),behavior=useRef(null);
 const [transform,setTransform]=useState({x:0,y:0,k:1});
 const codes=scopeCodes??[country.countryCode];
 const height=460;
 const sceneKey=JSON.stringify({worldView,codes,places,focusPoints,countryCenter:country.center});
 const projection=useMemo(()=>geographyProjection197(JSON.parse(sceneKey)),[sceneKey]);
 const path=geoPath(projection);
 useEffect(()=>{const svg=select(ref.current);const z=zoom().extent([[0,0],[720,height]]).scaleExtent([1,16]).touchable(()=>true).on('zoom',event=>setTransform(event.transform));behavior.current=z;svg.call(z).on('dblclick.zoom',null);return()=>{svg.on('.zoom',null);behavior.current=null;};},[]);
 const positions=places.map((place,i)=>{const actual=projection(place.coordinates);return{place,i,actual,x:actual[0],y:actual[1]};});
 for(let pass=0;pass<40;pass++)for(let i=0;i<positions.length;i++)for(let j=i+1;j<positions.length;j++){
  const a=positions[i],b=positions[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
  if(d<65){if(d<.01){dx=0;dy=1;d=1;}const amount=(65-d)/2;a.x=Math.max(30,Math.min(690,a.x-dx/d*amount));a.y=Math.max(30,Math.min(height-30,a.y-dy/d*amount));b.x=Math.max(30,Math.min(690,b.x+dx/d*amount));b.y=Math.max(30,Math.min(height-30,b.y+dy/d*amount));}
 }
 const control=(factor)=>{if(behavior.current)select(ref.current).call(behavior.current.scaleBy,factor);};
 const drawing=useMemo(()=>{const sceneCodes=JSON.parse(sceneKey).codes;const features=worldView||contextWorld?world.features:world.features.filter(f=>sceneCodes.includes(f.properties.iso));const scenePath=geoPath(projection);return features.map(feature=>({feature,d:scenePath(feature)||''}));},[sceneKey,projection,worldView,contextWorld]);
 const activate=(event,fn)=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();fn();}};
 return <div className="overflow-hidden rounded-[28px] border-2 border-sky-100 bg-sky-50" data-testid="geography197-map">
  <svg ref={ref} viewBox={`0 0 720 ${height}`} className="block w-full touch-none" aria-label={worldView?'世界地図':'国と地点の拡大地図'} data-zoom={`${transform.x},${transform.y},${transform.k}`}>
   <defs><clipPath id={`place197-${country.countryCode}`}><rect width="720" height={height} rx="26"/></clipPath></defs>
   <rect width="720" height={height} fill="#e0f2fe"/>
   <g clipPath={`url(#place197-${country.countryCode})`}><g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
    {drawing.map(({feature:f,d})=><path key={f.id} d={d} fill={worldView||contextWorld?'#cbd5e1':colors[Math.max(0,codes.indexOf(f.properties.iso))%colors.length]} stroke="#fff" strokeWidth={worldView?.6:1.1} data-country={f.properties.iso} aria-label={f.properties.nameJa||f.properties.name} role={onCountry&&!onContinent?'button':undefined} tabIndex={onCountry&&!onContinent?0:undefined} onClick={()=>onCountry?.(f.properties.iso)} onKeyDown={e=>activate(e,()=>onCountry?.(f.properties.iso))}/>)}
    {onCountry&&!onContinent&&codes.map(code=>{const f=countryFeatures197(code)[0];if(!f)return null;const bounds=path.bounds(f),small=bounds[1][0]-bounds[0][0]<35||bounds[1][1]-bounds[0][1]<25;if(!small)return null;const xy=projection(code===country.countryCode?country.center:geoBounds(f).reduce((a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2]));return <g key={code} transform={`translate(${xy})`} role="button" tabIndex="0" aria-label={`${f.properties.nameJa}のマーカー`} data-country={code} onClick={()=>onCountry(code)} onKeyDown={e=>activate(e,()=>onCountry(code))}><circle r="15" fill="#facc15" stroke="#0f172a" strokeWidth="2"/><circle r="4" fill="#0f172a"/></g>;})}
    {positions.map(({place,i,actual,x,y})=><g key={place.id} transform={`translate(${x},${y})`} data-city={place.id} role={onPlace?'button':undefined} tabIndex={onPlace?0:undefined} aria-label={showNames?(place.labelJa||place.name):`地点 ${i+1}`} onClick={()=>onPlace?.(place.id)} onKeyDown={e=>activate(e,()=>onPlace?.(place.id))}>
     <line x1={actual[0]-x} y1={actual[1]-y} x2="0" y2="0" stroke="#0f172a"/><circle cx={actual[0]-x} cy={actual[1]-y} r="3" fill="#0f172a"/>
     <circle r="32" fill="#fff" fillOpacity=".02"/><circle r="23" fill="#fff" stroke="#0f172a" strokeWidth="2"/><text textAnchor="middle" y="6" fontSize="18" fontWeight="bold" pointerEvents="none">{numbered?i+1:'📍'}</text>
     {showNames&&<text x="0" y="-32" textAnchor="middle" fontSize="12" fontWeight="bold" paintOrder="stroke" stroke="white" strokeWidth="4" fill="#0f172a">{place.labelJa||place.name}</text>}
    </g>)}
    {onContinent&&[['africa','アフリカ',[19,3]],['europe','ヨーロッパ',[17,52]],['asia','アジア',[93,39]],['northAmerica','北アメリカ',[-105,43]],['southAmerica','南アメリカ',[-60,-14]],['oceania','オセアニア',[143,-24]]].map(([key,name,point])=><g key={key} transform={`translate(${projection(point)})`} role="button" tabIndex="0" aria-label={name} data-continent={key} onClick={()=>onContinent(key)} onKeyDown={e=>activate(e,()=>onContinent(key))}><rect x="-55" y="-20" width="110" height="40" rx="20" fill="#334155"/><text textAnchor="middle" y="5" fontSize="13" fill="white" fontWeight="bold">{name}</text></g>)}
   </g></g>
  </svg>
  <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3"><span className="text-xs font-bold text-slate-500">ドラッグで移動・2本指でズーム／線の先が実際の地点</span><div className="flex gap-2"><button type="button" className="rounded-lg border px-3 py-2 font-black" aria-label="地図を拡大" onClick={()=>control(2)}>＋</button><button type="button" className="rounded-lg border px-3 py-2 font-black" aria-label="地図を縮小" onClick={()=>control(.5)}>−</button><button type="button" className="rounded-lg border px-3 py-2 font-black" aria-label="地図全体を表示" onClick={()=>behavior.current&&select(ref.current).call(behavior.current.transform,zoomIdentity)}>↺</button></div></div>
 </div>;
}
