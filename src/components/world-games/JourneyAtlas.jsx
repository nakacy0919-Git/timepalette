import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {geoMercator,geoPath,geoGraticule10} from 'd3-geo';
import {feature} from 'topojson-client';
import atlas from 'world-atlas/countries-50m.json';
import {getGeography197Profile,getGeography197CountryCodes} from '../../utils/geography197.js';
import {journeyReading} from '../../utils/worldJourneyStops.js';
import flags from '../../data/exploreCountryFlags.json';
import './journeyAtlas.css';
import './journeyMapExtras.css';
import {VEHICLES,journeyEdges,cityVideos,extraLandmarks} from '../../utils/journeyMapFeatures.js';
const features=feature(atlas,atlas.objects.countries).features;
const profiles=getGeography197CountryCodes().map(getGeography197Profile);
const aliases={'United States of America':'us','South Korea':'kr','North Korea':'kp','Taiwan':'tw','Russia':'ru','Vietnam':'vn','Laos':'la','Myanmar':'mm','Czechia':'cz','United Kingdom':'gb','Ivory Coast':'ci','Dem. Rep. Congo':'cd','Congo':'cg','Central African Rep.':'cf','Dominican Rep.':'do','Bosnia and Herz.':'ba','S. Sudan':'ss','Solomon Is.':'sb','eSwatini':'sz','Palestine':'ps'};
const isoByName=Object.fromEntries(profiles.flatMap(p=>[[p.name,p.iso],[p.nameEn,p.iso],[p.atlasName,p.iso]]));
const landColors=['#b8dc79','#a0d181','#c5e08c','#a9d6a0','#cbdc8d','#b7dca1'];
const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const isAsia=s=>s?.continent==='Asia';
// Approximate positions of real landmarks; illustrations are symbols, not terrain geometry.
const landmarks=[...extraLandmarks,
 ['jp','富士山','ふじさん','mountain',[138.73,35.36],'日本で最も高い山。美しい形で知られ、文化遺産にも登録されている。'],
 ['jp','琵琶湖','びわこ','lake',[136.08,35.25],'滋賀県にある日本最大の湖。'],
 ['jp','姫路城','ひめじじょう','heritage',[134.69,34.84],'白い外壁が美しい歴史的な城。'],
 ['kr','漢江','ハンガン','river',[126.96,37.52],'ソウルを流れる大きな川。'],
 ['kr','済州島','チェジュとう','mountain',[126.53,33.36],'火山地形が特徴の島。'],
 ['cn','万里の長城','ばんりのちょうじょう','heritage',[116.57,40.43],'中国の北部に築かれた長い歴史的な防御施設。'],
 ['cn','長江','ちょうこう','river',[121.1,31.45],'中国を東へ流れる長い川。'],
 ['in','タージ・マハル','','heritage',[78.04,27.17],'アグラにある白い大理石の建築。'],
 ['np','エベレスト','','mountain',[86.925,27.988],'ヒマラヤ山脈にある世界最高峰。'],
 ['th','アユタヤ','','heritage',[100.56,14.36],'歴史ある都の遺跡が残る場所。'],
 ['kh','アンコール・ワット','','heritage',[103.87,13.41],'カンボジアの歴史的な寺院群。'],
 ['vn','ハロン湾','ハロンわん','river',[107.17,20.91],'海に石灰岩の島々が浮かぶ美しい湾。'],
 ['id','ボロブドゥール','','heritage',[110.20,-7.61],'ジャワ島の仏教遺跡。'],
 ['au','ウルル','','mountain',[131.04,-25.34],'オーストラリア中央部にある大きな岩山。'],
 ['nz','アオラキ','','mountain',[170.14,-43.60],'ニュージーランドで最も高い山。'],
 ['eg','ギザのピラミッド','','heritage',[31.13,29.98],'古代エジプトの大きな石造建築。'],
 ['eg','ナイル川','ナイルがわ','river',[31.23,30.04],'エジプトを北へ流れる川。'],
 ['tz','キリマンジャロ','','mountain',[37.35,-3.07],'アフリカで最も高い山。'],
 ['tz','ビクトリア湖','ビクトリアこ','lake',[33.0,-1.0],'東アフリカの大きな湖。'],
 ['fr','エッフェル塔','エッフェルとう','heritage',[2.29,48.86],'パリの街を象徴する塔。'],
 ['gb','ストーンヘンジ','','heritage',[-1.83,51.18],'イングランドに残る巨大な石の遺跡。'],
 ['it','コロッセオ','','heritage',[12.49,41.89],'古代ローマの円形闘技場。'],
 ['ch','マッターホルン','','mountain',[7.66,45.98],'アルプスの特徴的な形の山。'],
 ['us','グランドキャニオン','','heritage',[-112.11,36.05],'コロラド川が長い時間をかけて作った峡谷。'],
 ['us','自由の女神','じゆうのめがみ','heritage',[-74.04,40.69],'ニューヨーク港にある有名な像。'],
 ['ca','ナイアガラの滝','ナイアガラのたき','river',[-79.07,43.08],'カナダとアメリカの国境にある大きな滝。'],
 ['br','アマゾン川','アマゾンがわ','river',[-60.02,-3.13],'南アメリカを流れる巨大な川。'],
 ['pe','マチュ・ピチュ','','heritage',[-72.54,-13.16],'アンデス山地に残るインカの遺跡。'],
 ['bo','ウユニ塩湖','ウユニえんこ','lake',[-67.5,-20.25],'広い塩の平原。雨が降ると水面が鏡のようになる。'],
 ['mx','チチェン・イッツァ','','heritage',[-88.57,20.68],'マヤ文明の歴史的な遺跡。'],
 ['tr','カッパドキア','','heritage',[34.83,38.64],'独特な岩の地形で知られる地域。']
];
const landmarkPhotos={"富士山":{"url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cd/Fuji_Kawaguchi_357.JPG/960px-Fuji_Kawaguchi_357.JPG","source":"https://commons.wikimedia.org/wiki/File:Fuji_Kawaguchi_357.JPG","credit":"Marion & Christoph Aistleitner","license":"CC0 1.0","licenseUrl":"https://creativecommons.org/publicdomain/zero/1.0/","detail":"山梨県と静岡県にまたがる標高3,776mの山です。信仰や芸術の題材として親しまれ、2013年に世界文化遺産に登録されました。"},"琵琶湖":{"url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/3/30/Aerial_view_of_the_Lake_Biwa.jpg/960px-Aerial_view_of_the_Lake_Biwa.jpg","source":"https://commons.wikimedia.org/wiki/File:Aerial_view_of_the_Lake_Biwa.jpg","credit":"Oita trip","license":"CC BY-SA 3.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/3.0/","detail":"滋賀県の中央に広がる、日本で最も面積が大きい湖です。水鳥や魚など多くの生き物がくらし、近畿地方の人々の水源にもなっています。"},"姫路城":{"url":"https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/Himeji_Castle%2C_Hy%C5%8Dgo_Prefecture%3B_August_2018_%2804%29.jpg/960px-Himeji_Castle%2C_Hy%C5%8Dgo_Prefecture%3B_August_2018_%2804%29.jpg","source":"https://commons.wikimedia.org/wiki/File:Himeji_Castle,_Hy%C5%8Dgo_Prefecture;_August_2018_(04).jpg","credit":"_steffen","license":"CC BY-SA 2.0","licenseUrl":"https://creativecommons.org/licenses/by-sa/2.0/","detail":"兵庫県姫路市にある白い外壁の城です。白鷺城とも呼ばれ、複雑な通路や門など、城を守るための工夫が残っています。"},"万里の長城":{"url":"https://upload.wikimedia.org/wikipedia/commons/d/d8/Great_Wall_Of_China.JPG","source":"https://commons.wikimedia.org/wiki/File:Great_Wall_Of_China.JPG","credit":"Johnrich121","license":"CC BY 3.0","licenseUrl":"https://creativecommons.org/licenses/by/3.0/","detail":"中国の北部に、さまざまな時代を通して築かれた城壁や見張り台の集まりです。北京周辺にも見学できる区間があり、1987年に世界文化遺産に登録されました。"}};
const spotIcons={mountain:'🏔',lake:'💧',river:'🌊',heritage:'🏛'};
const readings={'咸興':'ハムフン','南浦':'ナムポ','新北市':'しんほくし','台中':'たいちゅう','東京':'とうきょう','大阪':'おおさか','福岡':'ふくおか','釜山':'プサン','済州':'チェジュ','北京':'ペキン','上海':'シャンハイ','西安':'シーアン'};

function Train({x,y,color,number,active,vehicle='car'}){
 if(vehicle!=='car')return <g className={active?'wj-atlas-train active':'wj-atlas-train'} style={{transform:'translate('+x+'px,'+y+'px) scale('+(active?1.12:.87)+')'}}><ellipse cy="13" rx="27" ry="6" fill="#163959" opacity=".26"/>{vehicle==='plane'?<g transform="translate(0 -2)"><path d="M-31 0L-7-4-14-23-6-23 9-5 24-4Q35 0 24 5L9 6-6 23H-14L-7 7-31 4Z" fill="#fff" stroke="#375978" strokeWidth="2" strokeLinejoin="round"/><path d="M-27 0H23" stroke={color} strokeWidth="4" strokeLinecap="round"/><circle cx="16" cy="0" r="2" fill="#194a7c"/></g>:<text textAnchor="middle" y="9" fontSize="43" stroke="#fff" strokeWidth="2" paintOrder="stroke">{VEHICLES.find(v=>v[0]===vehicle)?.[1]}</text>}<circle cy="-35" r="13" fill={color} stroke="#fff" strokeWidth="2.5"/><text y="-30" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="950">{number}</text></g>;
 return <g className={active?'wj-atlas-train active':'wj-atlas-train'} style={{transform:'translate('+x+'px,'+y+'px) scale('+(active?1.12:.87)+')'}}><ellipse cy="11" rx="29" ry="7" fill="#163959" opacity=".24"/><path d="M-28-6Q-28-12-21-15L-12-16-7-26H12L23-14Q30-11 30-5V3Q30 9 24 9H-23Q-29 9-29 3Z" fill={color} stroke="#fff" strokeWidth="2.8" strokeLinejoin="round"/><path d="M-12-16-6-23H3V-16ZM7-23H11L19-16H7Z" fill="#ddf9ff" stroke="#31556e" strokeWidth="1.3"/><path d="M-23-10H23" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity=".75"/><rect x="23" y="-5" width="6" height="5" rx="2" fill="#fff0a0"/><circle cx="-18" cy="7" r="7.5" fill="#24364e" stroke="#fff" strokeWidth="1.5"/><circle cx="18" cy="7" r="7.5" fill="#24364e" stroke="#fff" strokeWidth="1.5"/><circle cx="-18" cy="7" r="3.5" fill="#c0d7e9"/><circle cx="18" cy="7" r="3.5" fill="#c0d7e9"/><circle cy="-32" r="13" fill={color} stroke="#fff" strokeWidth="2.5"/><text y="-27" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="950">{number}</text></g>;
}

export default function JourneyAtlas({game,cursor,countryName,countryFlag,moving=false,stepMs=850,settingsOpen=false,onCloseSettings,settingsContent,vehicles={},seaMoving=false}){
 const ref=useRef(null),uid=useId().replace(/[^a-zA-Z0-9_-]/g,''),[size,setSize]=useState({w:1200,h:600}),[view,setView]=useState('local'),[zoom,setZoom]=useState(1),[pan,setPan]=useState([0,0]),[spot,setSpot]=useState(null),[city,setCity]=useState(null),[watch,setWatch]=useState(false),drag=useRef(null);
 const current=game.journeyStops[cursor],center=current?.coordinates||[105,30],{w,h}=size;
 useEffect(()=>{const el=ref.current;if(!el)return;const ob=new ResizeObserver(([e])=>{const {width,height}=e.contentRect;if(width>0&&height>0)setSize({w:Math.round(width),h:Math.round(height)});});ob.observe(el);return()=>ob.disconnect();},[]);
 useEffect(()=>{setPan([0,0]);setSpot(null);setCity(null);setWatch(false);},[cursor,view]);
 useEffect(()=>{setView('local');setZoom(1);},[game.turn]);
 useEffect(()=>{if(moving){setView('local');setZoom(1);setPan([0,0]);setSpot(null);setCity(null);setWatch(false);}},[moving]);
 const target=view==='world'?[center[0],10]:view==='region'&&isAsia(current)?[clamp(center[0],84,110),clamp(center[1],20,34)]:center;
 const [camera,setCamera]=useState(target);
 const camRef=useRef(camera);
 const duration=moving?Math.max(120,stepMs-35):330;
 useEffect(()=>{const from=camRef.current,to=target;let id,last=0;const start=performance.now(),reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lon=((to[0]-from[0]+540)%360)-180;
  const tick=now=>{const p=reduced?1:Math.min(1,(now-start)/duration);if(p<1&&now-last<30){id=requestAnimationFrame(tick);return;}last=now;const t=p*p*(3-2*p);const v=[from[0]+lon*t,from[1]+(to[1]-from[1])*t];camRef.current=v;setCamera(v);if(p<1)id=requestAnimationFrame(tick);};id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);
 },[target[0],target[1]]);
 const base=camera;
 const factor=view==='world'?Math.min(w/6.45,h/5.8):view==='region'?Math.min(w/2.6,h/1.75):Math.min(w/.40,h/.30);
 const projection=useMemo(()=>geoMercator().rotate([-base[0],0]).center([0,clamp(base[1],-75,75)]).scale(factor*zoom).translate([w/2+pan[0],h/2+pan[1]]).clipExtent([[0,0],[w,h]]),[base[0],base[1],factor,zoom,w,h,pan]);
 const path=useMemo(()=>geoPath(projection),[projection]);
 const visible=(p,margin=0)=>p&&p[0]>=-margin&&p[0]<=w+margin&&p[1]>=-margin&&p[1]<=h+margin;
 const routeSet=new Set(game.route);
 const edges=useMemo(()=>journeyEdges(game.journeyStops),[game.journeyStops]);
 const places=game.journeyStops.map((s,i)=>({s,i,p:valid(s.coordinates)?projection(s.coordinates):null})).filter(o=>o.p&&o.p.every(Number.isFinite));
 const onMap=places.filter(o=>visible(o.p,20));
 const priority=o=>o.i===cursor?0:game.teams.some(t=>t.position===o.i)?1:2+Math.min((o.i-cursor+game.journeyStops.length)%game.journeyStops.length,100);
 const ordered=[...onMap].sort((a,b)=>priority(a)-priority(b));
 const carPoint=projection(moving&&view==='local'?camera:center);const labels=[],occupied=[{x:w-68,y:0,w:68,h:255},...(carPoint?[{x:carPoint[0]-36,y:carPoint[1]-62,w:72,h:65}]:[])];
 for(const o of ordered){
  const [x,y]=o.p,text=o.s.label,reading=journeyReading(text),len=Math.min(228,Math.max(80,text.length*14+52)),height=reading?41:32;
  for(const [dx,dy] of [[16,16],[-len-16,16],[36,-38],[-len-36,-38],[16,44],[-len-16,44]]){
   const rect={x:x+dx,y:y+dy,w:len,h:height};
   if(rect.x<3||rect.y<3||rect.x+len>w-3||rect.y+height>h-3||occupied.some(b=>rect.x<b.x+b.w+3&&rect.x+len>b.x-3&&rect.y<b.y+b.h+3&&rect.y+height>b.y-3))continue;
   labels.push({...o,rect,text,reading});occupied.push(rect);break;
  }
  if(labels.length>=(view==='local'?Math.max(6,Math.floor(w*h/35000)):Math.max(10,Math.floor(w*h/48000))))break;
 }
 const shownLandmarks=[];
 const rails=edges.map(e=>({d:path({type:'LineString',coordinates:[e.a.coordinates,e.b.coordinates]}),sea:e.sea,cross:e.a.country!==e.b.country,active:e.i>=cursor&&e.i<cursor+18})).filter(e=>e.d);
 const changeView=v=>{setView(v);setZoom(1);setPan([0,0]);setSpot(null);setCity(null);setWatch(false);};
 return <div className={"wj-atlas wj-geo-atlas"+(moving?" wj-moving":"")} ref={ref}>
 <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="group" aria-label="実際の国土と都市位置を使った世界旅行すごろく" onPointerDown={e=>{if(e.button!==0)return;drag.current={x:e.clientX,y:e.clientY,pan};e.currentTarget.setPointerCapture(e.pointerId);}} onPointerMove={e=>{if(drag.current)setPan([drag.current.pan[0]+e.clientX-drag.current.x,drag.current.pan[1]+e.clientY-drag.current.y]);}} onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}>
 <defs><linearGradient id={uid+'sea'} x2="0" y2="1"><stop stopColor="#c5f7ff"/><stop offset=".46" stopColor="#6ed7f4"/><stop offset="1" stopColor="#268fc9"/></linearGradient><filter id={uid+'shadow'} x="-25%" y="-25%" width="150%" height="150%"><feDropShadow dx="0" dy="1.5" stdDeviation="1.2" floodColor="#184b56" floodOpacity=".25"/></filter><pattern id={uid+'waves'} width="70" height="45" patternUnits="userSpaceOnUse"><path d="M8 10q7-4 14 0t14 0M35 33q7-4 14 0" fill="none" stroke="#fff" opacity=".17" strokeWidth="1.5"/></pattern><linearGradient id={uid+'land'} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#e1f6a1"/><stop offset=".48" stopColor="#b3db79"/><stop offset="1" stopColor="#81b877"/></linearGradient></defs>
 <rect width={w} height={h} fill={`url(#${uid}sea)`}/><rect width={w+140} height={h+90} x="-70" y="-45" className="wj-sea-waves" fill={`url(#${uid}waves)`}/>
 <path d={path(geoGraticule10())||''} fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth=".7"/>
 {features.map((f,i)=>{const iso=aliases[f.properties.name]||isoByName[f.properties.name],d=path(f);return d?<path key={i} d={d} fill={iso===current?.country?`url(#${uid}land)`:routeSet.has(iso)?landColors[i%landColors.length]:'#c7d9bf'} stroke="#f6fff2" strokeWidth={iso===current?.country?2.5:1} strokeLinejoin="round"/>:null;})}
 {!moving&&profiles.filter(p=>valid(p.center)).map(p=>{const pt=projection(p.center);if(!visible(pt,0)||!routeSet.has(p.iso)||view==='local')return null;const [x,y]=pt;return <g key={p.iso} opacity={p.iso===current?.country?1:.8}><image href={flags.flags[p.iso]} x={x-11} y={y-33} width="22" height="14" preserveAspectRatio="xMidYMid meet"/><text x={x} y={y-5} textAnchor="middle" fontSize="11" fontWeight="850" fill="#345e46" stroke="#f3ffdc" strokeWidth="2.5" paintOrder="stroke">{countryName(p.iso)}</text></g>;})}
 {rails.map((r,i)=><g key={i} opacity={r.sea ? .92 : r.active ? 1 : .52}><path d={r.d} stroke={r.sea?'#0768ad':'#24465f'} strokeWidth={r.sea?4:r.cross?4:8} fill="none" strokeLinecap="round"/><path d={r.d} stroke={r.sea?'#fff5b5':r.cross?'#f9e6a2':'#fff'} strokeWidth={r.sea?2.5:r.cross?2.2:5} strokeDasharray={r.sea?'10 7':r.cross?'5 5':'3 4'} fill="none" strokeLinecap="round"/></g>)}
 {onMap.map(({s,i,p:[x,y]})=><g key={s.id} className="wj-atlas-node wj-city-label" role="button" aria-label={s.label+'の地点'} tabIndex={moving?-1:0} onPointerDown={e=>e.stopPropagation()} onClick={e=>{if(!moving){e.stopPropagation();setCity(s);setWatch(false);}}} onKeyDown={e=>{if(!moving&&(e.key==='Enter'||e.key===' ')){e.preventDefault();setCity(s);setWatch(false);}}} data-stop={s.id} data-current={i===cursor} transform={`translate(${x} ${y})`}><title>{s.label} · {countryName(s.country)}</title>{i===cursor&&<circle r="15" fill="#ffef82" stroke="#fff" strokeWidth="2" className="wj-atlas-halo"/>}<rect x="-5" y="-5" width="10" height="10" rx="2.5" fill={['#1488e8','#aa57d8','#f0a326'][s.index%3]} stroke="#fff" strokeWidth="1.6"/></g>)}
 {!moving&&view!=='world'&&landmarks.map((l,j)=>{const pt=projection(l[4]);if(!visible(pt,0)||view==='local'&&carPoint&&Math.hypot(pt[0]-carPoint[0],pt[1]-carPoint[1])<54||shownLandmarks.some(p=>Math.hypot(pt[0]-p[0],pt[1]-p[1])<49)||labels.some(o=>pt[0]>o.rect.x-22&&pt[0]<o.rect.x+o.rect.w+22&&pt[1]>o.rect.y-22&&pt[1]<o.rect.y+o.rect.h+22))return null;shownLandmarks.push(pt);const [x,y]=pt;return <g key={l[1]} className="wj-landmark" role="button" aria-label={l[1]+'の説明'} tabIndex={0} transform={'translate('+x+' '+y+')'} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();setSpot(l);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSpot(l);}}}><title>{l[1]}をタップ</title><circle r="19" fill="#fff9dc" stroke="#d78b25" strokeWidth="2.6" filter={`url(#${uid}shadow)`}/><text textAnchor="middle" y="7" fontSize="23">{spotIcons[l[3]]}</text><circle cx="14" cy="-14" r="8" fill="#f7ac25" stroke="#fff" strokeWidth="1.5"/><text x="14" y="-11" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fff">i</text></g>;})}
 {!moving&&labels.map(({s,i,p:[x,y],rect:r,text,reading})=><g key={s.id} className="wj-city-label" role="button" tabIndex={0} aria-label={s.label+'の街情報'} onPointerDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();setCity(s);setWatch(false);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setCity(s);setWatch(false);}}}><path d={`M${x} ${y}L${r.x+r.w/2} ${r.y+r.h/2}`} stroke="#315a6b" opacity=".6" strokeWidth="1" fill="none"/><rect x={r.x} y={r.y} width={r.w} height={r.h} rx="9" fill={i===cursor?'#ffef98':'#fffff5'} stroke={i===cursor?'#f0a020':'#6fa1ad'} strokeWidth={i===cursor?2.3:1.3} filter={`url(#${uid}shadow)`}/><image href={flags.flags[s.country]} x={r.x+7} y={r.y+(r.h-15)/2} width="23" height="15" preserveAspectRatio="xMidYMid meet"/><text x={r.x+r.w/2+12} y={r.y+(reading?30:22)} textAnchor="middle" fontSize={text.length>15?12:16} fontWeight="800" fill="#23445c">{text.length>20?text.slice(0,19)+'…':text}</text>{reading&&<text x={r.x+r.w/2+12} y={r.y+11} textAnchor="middle" fontSize="10" fontWeight="800" fill="#496f7d">{reading}</text>}</g>)}
 {game.teams.map(t=>{const i=t.id===game.turn?cursor:t.position;const p=t.id===game.turn&&moving&&view==='local'?camera:game.journeyStops[i]?.coordinates;if(!valid(p))return null;const pt=projection(p);if(!visible(pt))return null;if(t.id!==game.turn&&carPoint&&Math.hypot(pt[0]-carPoint[0],pt[1]-carPoint[1])<36)return null;return <Train key={t.id} x={pt[0]+(t.id%3-1)*12} y={pt[1]-12} color={t.color} number={t.id+1} active={t.id===game.turn} vehicle={t.id===game.turn&&moving&&seaMoving?'plane':vehicles[t.id]||'car'}/>;})}
 </svg>
 <nav className="wj-map-corner" aria-label="地図の操作"><button title="拡大" aria-label="地図を拡大" onClick={()=>setZoom(z=>Math.min(4,z*1.4))}>＋</button><button title="縮小" aria-label="地図を縮小" onClick={()=>setZoom(z=>Math.max(.65,z/1.4))}>−</button><button title="鳥瞰表示" aria-label="鳥瞰表示" aria-pressed={view!=='local'} onClick={()=>changeView(view==='local'?'region':view==='region'?'world':'local')}>🌍</button><button title="現在地に戻る" aria-label="現在地に戻る" onClick={()=>changeView('local')}>⌖</button></nav>
 {settingsOpen&&<div className="wj-map-settings-overlay" role="dialog" aria-modal="true" aria-label="ゲーム設定"><section className="wj-map-settings-panel"><header><h2>⚙️ ゲーム設定</h2><button onClick={onCloseSettings} aria-label="閉じる">×</button></header><h3>地図表示</h3><div className="wj-map-tools" aria-label="地図表示"><button aria-pressed={view==='region'} onClick={()=>changeView('region')}>{isAsia(current)?'アジア全体':'周辺地域'}</button><button aria-pressed={view==='local'} onClick={()=>changeView('local')}>都市を拡大</button><button aria-pressed={view==='world'} onClick={()=>changeView('world')}>世界</button><button aria-label="拡大" onClick={()=>setZoom(z=>Math.min(4,z*1.4))}>＋</button><button aria-label="縮小" onClick={()=>setZoom(z=>Math.max(.65,z/1.4))}>−</button><button onClick={()=>{changeView('local');onCloseSettings?.();}}>現在地</button></div><h3>プレイ設定</h3>{settingsContent}<button className="wj-settings-close" onClick={onCloseSettings}>ゲームに戻る →</button></section></div>}
 {spot&&<div className="wj-landmark-overlay" role="dialog" aria-modal="true" aria-label={spot[1]+'の説明'} onClick={()=>setSpot(null)}><section className="wj-landmark-panel" onClick={e=>e.stopPropagation()}><header><div><small>{spotIcons[spot[3]]} 世界の名所 · {countryName(spot[0])}</small><h2>{spot[2]?<ruby>{spot[1]}<rt>{spot[2]}</rt></ruby>:spot[1]}</h2></div><button autoFocus aria-label="説明を閉じる" onClick={()=>setSpot(null)}>×</button></header>{landmarkPhotos[spot[1]]&&<figure><img src={landmarkPhotos[spot[1]].url} alt={spot[1]+'の写真'} onError={e=>{e.currentTarget.style.display='none';e.currentTarget.parentElement.classList.add('photo-unavailable');}}/><figcaption>写真：{landmarkPhotos[spot[1]].credit} · <a href={landmarkPhotos[spot[1]].licenseUrl} target="_blank" rel="noreferrer">{landmarkPhotos[spot[1]].license}</a> · <a href={landmarkPhotos[spot[1]].source} target="_blank" rel="noreferrer">原画像・出典</a></figcaption></figure>}<div className="wj-landmark-detail"><p>{landmarkPhotos[spot[1]]?.detail||spot[5]}</p><button onClick={()=>setSpot(null)}>地図に戻る →</button></div></section></div>}
 {city&&<div className="wj-landmark-overlay" role="dialog" aria-modal="true" aria-label={city.label+'の街情報'} onClick={()=>{setCity(null);setWatch(false);}}><section className="wj-landmark-panel wj-city-panel" onClick={e=>e.stopPropagation()}><header><div><small>🏙️ CITY DISCOVERY · {countryName(city.country)}</small><h2><img src={flags.flags[city.country]} alt="" className="wj-city-flag"/> {journeyReading(city.label)?<ruby>{city.label}<rt>{journeyReading(city.label)}</rt></ruby>:city.label}</h2></div><button autoFocus aria-label="街情報を閉じる" onClick={()=>{setCity(null);setWatch(false);}}>×</button></header><div className="wj-city-meta"><b>{city.labelEn}{getGeography197Profile(city.country)?.cities?.some(c=>c.name===city.labelEn&&c.isCapital)?' · 首都':''}</b><span>📍 {countryName(city.country)} · {Math.abs(city.coordinates[1]).toFixed(2)}°{city.coordinates[1]>=0?'N':'S'} / {Math.abs(city.coordinates[0]).toFixed(2)}°{city.coordinates[0]>=0?'E':'W'}</span></div>{cityVideos[city.label]?<><p>{cityVideos[city.label][2]}</p>{watch?<iframe title={cityVideos[city.label][1]} src={'https://www.youtube-nocookie.com/embed/'+cityVideos[city.label][0]+'?rel=0'} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin"/>:<button className="wj-video-launch" onClick={()=>setWatch(true)}>▶ {cityVideos[city.label][1]}<small>TimePalette内で見る</small></button>}<small>公開YouTube動画 · 投稿者の設定やネットワークにより再生できない場合があります。</small></>:<p>この街の動画はまだ登録されていません。</p>}<button className="wj-city-close" onClick={()=>{setCity(null);setWatch(false);}}>地図に戻る →</button></section></div>}
 <small className="wj-map-credit"><span className="wj-sea-legend">✈ 青い点線：海上・空のルート</span>　Natural Earth · GeoNames / 模式的な移動ルート</small>
 </div>;
}
