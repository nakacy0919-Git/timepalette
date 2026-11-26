import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {journeyPage} from '../../utils/worldJourneyStops.js';
import './journeyAtlas.css';

const palette={Asia:['#97d86b','#479e63','#f2d68c'],Europe:['#9adf92','#4c9e79','#e8c48e'],Africa:['#efd17f','#91b45a','#f3bc68'],Oceania:['#87dcb0','#399c77','#e9d291'],'North America':['#99d88b','#4e9871','#e7ca89'],'South America':['#92d978','#388f63','#efbd81']};
function random(seed){let n=seed>>>0;return()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
const seedOf=s=>[...s].reduce((n,c)=>n*31+c.charCodeAt(0),17);
function Tree({x,y,s=1,kind=0}){
 return <g transform={`translate(${x} ${y}) scale(${s})`}><ellipse cy="4" rx="12" ry="5" fill="#205943" opacity=".2"/><path d="M-2 4V-16H2V4" fill="#96613c"/>{kind===1?<><path d="M0-38L-12-16H-7L-17-5H17L7-16H12Z" fill="#197e58" stroke="#125e49" strokeWidth="1"/><path d="M0-35L-8-17H0Z" fill="#79cb79"/></>:<><circle cx="-7" cy="-15" r="10" fill={kind===2?'#e78ab5':'#429d48'}/><circle cx="7" cy="-13" r="10" fill={kind===2?'#f6b2d1':'#55b758'}/><circle cy="-23" r="12" fill={kind===2?'#ffc6e1':'#78ca64'}/><ellipse cx="-4" cy="-25" rx="5" ry="4" fill="#fff" opacity=".22"/></>}</g>;
}
function House({x,y,s=1,color='#e4b87c',roof='#c9574f'}){
 return <g transform={`translate(${x} ${y}) scale(${s})`} strokeLinejoin="round"><ellipse cy="5" rx="21" ry="7" fill="#23604d" opacity=".16"/><path d="M-18-20L0-30L18-20V2L0 12L-18 2Z" fill={color} stroke="#9e7858" strokeWidth=".8"/><path d="M0-10L18-20V2L0 12Z" fill="#c58f68"/><path d="M-23-19L-7-39L17-28L23-17L0-6Z" fill={roof} stroke="#98484a" strokeWidth=".8"/><path d="M-23-19L-7-39L0-21L0-6Z" fill="#fff" opacity=".2"/><path d="M-13-11H-7V-4H-13Z M7-9L13-12V-5L7-2Z" fill="#5e9fbd" stroke="#fff" strokeWidth="1"/><path d="M-4-2V8L0 10V0Z" fill="#885c3c"/></g>;
}
function Tower({x,y,s=1,h=54,color='#d6e6f5'}){
 return <g transform={`translate(${x} ${y}) scale(${s})`}><ellipse cy="6" rx="21" ry="8" fill="#2d6e55" opacity=".18"/><path d={`M-15-${h}L0-${h+8}L16-${h}V0L0 8L-15 0Z`} fill={color} stroke="#95adbb"/><path d={`M0-${h-8}L16-${h}V0L0 8Z`} fill="#8ba9c5"/><path d={`M-15-${h}L0-${h+8}L16-${h}L0-${h-8}Z`} fill="#f0f8ff"/>{Array.from({length:Math.floor(h/10)},(_,i)=><g key={i}><path d={`M-11-${i*10+4}l7 3v-6l-7-3Z`} fill="#44769c"/><path d={`M4-${i*10+1}l8-4v-6l-8 4Z`} fill="#548eab"/></g>)}</g>;
}
function Landmark({country,x,y}){
 if(country==='jp')return <g transform={`translate(${x} ${y})`}><path d="M-92 28L-34-58L-12-93L12-86L85 28Z" fill="#6d92ce" stroke="#5a82b6"/><path d="M-34-58L-12-93L12-86L37-50L15-56L6-45L-6-59L-19-47Z" fill="#fff"/><path d="M-12-93L-6-59L15-56L12-86Z" fill="#daeafa"/><g transform="translate(64 42)"><path d="M-24 0H24V-6H-24Z M-17-7H17V-13H-17Z" fill="#73563f"/><path d="M-13-15H13V-69H-13Z" fill="#fbebd8"/>{[0,1,2].map(i=><g key={i} transform={`translate(0 ${-26-i*18}) scale(${1-i*.15})`}><path d="M-28 0Q-20-1-15-12L0-18L15-12Q20-1 28 0Z" fill="#be3a39" stroke="#8b292d"/><path d="M-20 1H20V5H-20Z" fill="#edaa48"/></g>)}</g></g>;
 if(country==='fr'||country==='gb')return <g transform={`translate(${x} ${y})`} strokeLinejoin="round">{country==='fr'?<><path d="M-40 36L-11-20L-3-87H3L11-20L40 36H22L0-2L-22 36Z" fill="#a57d54" stroke="#795839" strokeWidth="2"/><path d="M-23 5H23M-12-23H12M-4-59H4M-35 28L18-5M35 28L-18-5" stroke="#795839" strokeWidth="4"/><path d="M0-87V-101" stroke="#795839" strokeWidth="3"/></>:<><path d="M-18-60H18V39H-18Z" fill="#d9b476" stroke="#99774c"/><path d="M-22-60L0-94L22-60Z" fill="#426e6e"/><circle cy="-43" r="12" fill="#fff5cc" stroke="#957142" strokeWidth="3"/><path d="M0-43V-51M0-43L6-39" stroke="#62452a" strokeWidth="2"/><path d="M-12-24V28M0-24V28M12-24V28" stroke="#a4885c" strokeWidth="3"/></>}</g>;
 if(country==='in')return <g transform={`translate(${x} ${y})`} stroke="#d3b795" strokeWidth="1.4"><path d="M-78 37H78V47H-78Z" fill="#eee0c5"/>{[-64,64].map(a=><g key={a}><rect x={a-6} y="-55" width="12" height="92" rx="3" fill="#fdf3e2"/><path d={`M${a-10}-55Q${a}-77 ${a+10}-55Z`} fill="#fff9eb"/></g>)}<rect x="-43" y="-19" width="86" height="56" fill="#fff8e7"/><path d="M-33-18Q-35-45 0-68Q35-45 33-18Z" fill="#fff5e3"/><path d="M0-68V-77" stroke="#c99855" strokeWidth="3"/><path d="M-12 37V10Q0-14 12 10V37Z" fill="#bd9d85"/>{[-30,30].map(a=><path key={a} d={`M${a-6} 28V6Q${a}-5 ${a+6} 6V28Z`} fill="#a5c1c6"/>)}</g>;
 if(country==='eg')return <g transform={`translate(${x} ${y})`}><path d="M-94 40L-23-70L47 40Z" fill="#e1b060" stroke="#c78d46"/><path d="M-23-70L47 40H-23Z" fill="#c78d46"/><path d="M2 40L54-40L110 40Z" fill="#f3c57c"/><path d="M54-40L110 40H54Z" fill="#d59e58"/></g>;
 return <g transform={`translate(${x} ${y})`}><Tower x={-32} y={20} h={52} color="#c7e7ed"/><Tower x={7} y={15} h={86} color="#dbeafa"/><Tower x={38} y={27} h={62} color="#ffe3c2"/><House x={-60} y={37} s={.8}/><House x={60} y={38} s={.8} roof="#507eab"/></g>;
}
function scenery(country,index){
 const r=random(seedOf(country+index));
 return Array.from({length:38},(_,i)=>({x:14+r()*370,y:92+r()*346,s:.55+r()*.55,kind:country==='jp'&&i%5===0?2:i%4===0?1:0})).filter(p=>!((p.x<106&&p.y>177&&p.y<268)||(p.x>133&&p.x<267&&p.y>286&&p.y<386)||(p.x>294&&p.y>177&&p.y<268)));
}
const localCoords=[[66,222],[200,338],[334,222]];
function CountryScene({country,continent,landlocked,x,y,index,label,flag}){
 const colors=palette[continent]||palette.Asia;
 const trees=useMemo(()=>scenery(country,index),[country,index]);
 return <g transform={`translate(${x} ${y})`}>
  <path d="M13 85Q64 43 136 64Q196 31 263 59Q337 42 386 92L392 391Q361 458 282 443Q199 479 126 443Q43 461 8 398Z" fill="#226e68" opacity=".25" transform="translate(0 9)"/>
  <path d="M13 85Q64 43 136 64Q196 31 263 59Q337 42 386 92L392 391Q361 458 282 443Q199 479 126 443Q43 461 8 398Z" fill={colors[0]} stroke="#e8f7b8" strokeWidth="4"/>
  <path d="M16 305Q88 250 148 295T277 293T391 275V391Q360 457 282 443Q199 479 126 443Q43 461 8 398Z" fill={colors[1]} opacity=".3"/>
  <path d="M30 110Q80 65 146 107T257 108T376 96" fill="none" stroke="#e4f6a9" strokeWidth="22" opacity=".35" strokeLinecap="round"/>
  <path d="M24 396Q83 344 141 394T263 397T376 383" fill="none" stroke={landlocked?'#80c9e8':'#79e2ee'} strokeWidth="21" opacity=".9" strokeLinecap="round"/>
  <path d="M24 396Q83 344 141 394T263 397T376 383" fill="none" stroke="#ecffff" strokeWidth="2" strokeDasharray="13 15" opacity=".65"/>
  {Array.from({length:9},(_,i)=><path key={i} d={`M${32+i*7} 122l35 0l15 43l-35 0Z`} fill={i%2?'#f2dd85':'#b2c856'} opacity=".78"/>)}
  {trees.map((p,i)=><Tree key={i} {...p}/>)}
  <Landmark country={country} x={200} y={153}/>
  {[[-16,-4],[16,5],[0,-28]].map(([dx,dy],i)=><House key={i} x={62+dx} y={166+dy} s={.75} roof={i%2?'#456ca0':'#cb5949'}/>)}
  {[[-22,0],[12,-6],[29,4]].map(([dx,dy],i)=><Tower key={i} x={334+dx} y={164+dy} s={.65} h={36+i*12}/>)}
  {[[-35,-4],[25,3]].map(([dx,dy],i)=><House key={i} x={200+dx} y={285+dy} s={.9} roof="#507f9c"/>)}
  <rect x="20" y="17" width="360" height="45" rx="20" fill="#fffdf2" stroke="#fff" strokeWidth="3"/>
  <text x="200" y="47" fontSize="22" fontWeight="900" textAnchor="middle" fill="#234c65">{flag} {label}</text>
 </g>;
}
function Train({x,y,color,number,active}){
 return <g className={active?'wj-atlas-train active':'wj-atlas-train'} transform={`translate(${x} ${y})`}><ellipse cy="8" rx="23" ry="7" fill="#0a3a4f" opacity=".25"/><path d="M-22-14Q-22-22-13-24H11Q23-20 23-8V4H-22Z" fill={color} stroke="#fff" strokeWidth="2.8"/><path d="M-15-18H6V-7H-15Z M10-17H16Q20-14 20-7H10Z" fill="#def8ff" stroke="#235275" strokeWidth="1"/><circle cx="-13" cy="5" r="5" fill="#284254" stroke="#fff"/><circle cx="13" cy="5" r="5" fill="#284254" stroke="#fff"/><circle cx="0" cy="-30" r="12" fill={color} stroke="#fff" strokeWidth="2"/><text y="-26" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="900">{number}</text></g>;
}
export default function JourneyAtlas({game,cursor,countryName,countryFlag}){
 const ref=useRef(null),uid=useId().replace(/:/g,''),[compact,setCompact]=useState(false);
 useEffect(()=>{const el=ref.current;if(!el)return;const observer=new ResizeObserver(([e])=>setCompact(e.contentRect.width<e.contentRect.height*1.45));observer.observe(el);return()=>observer.disconnect();},[]);
 const {start,stops}=journeyPage(game,cursor,compact),groups=Math.ceil(stops.length/3);
 const width=400*groups,height=485;
 const points=stops.map((_,i)=>[localCoords[i%3][0]+400*Math.floor(i/3),localCoords[i%3][1]]);
 const path=points.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' ');
 return <div className="wj-atlas" ref={ref}><svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="世界の国と都市を結ぶ旅行すごろく" data-country-count={groups}>
  <defs><linearGradient id={uid+'sea'} x2=".3" y2="1"><stop stopColor="#91eaff"/><stop offset="1" stopColor="#1b94d0"/></linearGradient><linearGradient id={uid+'rail'} x2="0" y2="1"><stop stopColor="#fffef1"/><stop offset="1" stopColor="#c4c9c4"/></linearGradient><linearGradient id={uid+'tile'} x2="0" y2="1"><stop stopColor="#fff"/><stop offset="1" stopColor="#d3edff"/></linearGradient><pattern id={uid+'waves'} width="80" height="47" patternUnits="userSpaceOnUse"><path d="M8 11q8-5 16 0t16 0M42 32q8-5 16 0" stroke="#fff" opacity=".25" strokeWidth="2" fill="none" strokeLinecap="round"/></pattern></defs>
  <rect width={width} height={height} rx="16" fill={`url(#${uid}sea)`}/><rect width={width} height={height} fill={`url(#${uid}waves)`}/>
  {Array.from({length:groups},(_,i)=>{const p=stops[i*3];return <CountryScene key={p.country} country={p.country} continent={p.continent} landlocked={p.landlocked} x={i*400} y={0} index={i} label={countryName(p.country)} flag={countryFlag(p.country)}/>;})}
  <path d={path} stroke="#295d66" strokeWidth="23" strokeLinecap="round" strokeLinejoin="round" opacity=".27" transform="translate(0 5)" fill="none"/>
  <path d={path} stroke={`url(#${uid}rail)`} strokeWidth="20" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  <path d={path} stroke="#42616c" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 7" fill="none"/>
  <path d={path} stroke="#f8fcff" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  {stops.map((s,i)=>{const [x,y]=points[i],current=start+i===cursor;const hue=['#158eea','#bf65df','#f2a92f'][s.index];const name=s.label;const size=name.length>17?10:name.length>11?13:17;
   return <g key={s.id} className="wj-node wj-atlas-node" transform={`translate(${x} ${y})`} data-stop={s.id} data-current={current}><ellipse cy="5" rx="28" ry="11" fill="#144d61" opacity=".35"/>{current&&<circle r="35" fill="#fff6a3" stroke="#fff" strokeWidth="4" className="wj-atlas-halo"/>}<rect x="-24" y="-17" width="48" height="33" rx="6" fill={hue} stroke="#fff" strokeWidth="4"/><path d="M-17-11H17V-5H-17Z" fill="#fff" opacity=".4"/><rect x="-63" y="21" width="126" height="28" rx="12" fill={`url(#${uid}tile)`} stroke={current?'#f6b727':'#47768d'} strokeWidth="1.6"/><text textAnchor="middle" y="40" fontSize={size} fontWeight="900" fill="#23435a">{name.length>25?name.slice(0,24)+'…':name}</text><title>{name} · {countryName(s.country)}</title></g>;
  })}
  {game.teams.map(t=>{const i=(t.id===game.turn?cursor:t.position)-start;if(i<0||i>=points.length)return null;const [x,y]=points[i];return <Train key={t.id} x={x+(t.id%3-1)*15} y={y-12-Math.floor(t.id/3)*12} color={t.color} number={t.id+1} active={t.id===game.turn}/>;})}
  <g transform={`translate(${width-18} 468)`}><text textAnchor="end" fill="#fff" fontWeight="700" fontSize="12">TIMEPALETTE · ILLUSTRATED GAME ROUTE</text></g>
 </svg></div>;
}
