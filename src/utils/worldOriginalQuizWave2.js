import geo from '../data/geography/countries197.json' with {type:'json'};
import {validQuestion} from './worldGameEngine.js';
import {hasEnglishQuestion} from './worldGameLanguage.js';
import photoWave from '../data/world-games/originalQuizPhotoWave2.json' with {type:'json'};
import geographyPhotos from '../data/geography/photos197.json' with {type:'json'};

const localDraft=(q)=>({...q,reviewStatus:'draft',gradeReview:'provisional',sourceReviewStatus:'pending',translationReviewStatus:'pending',originalDraft:true,practiceDraft:true,gameEligible:false,requiresReading:false});
export function buildPhotoWave2(countries){
 const codes=new Set(countries.map(c=>c.iso));
 return photoWave.filter(r=>codes.has(r.iso)).map(r=>{
  const image=geographyPhotos[r.iso]?.[r.slot];
  return localDraft({id:'tp-original-photo-v2-'+r.iso,country:r.iso,domain:r.domain,subcategory:r.subcategory,gradeBand:r.grade,prompt:r.prompt,choices:r.choices,correctIndex:r.correctIndex,explanation:r.explanation,translations:{en:r.en},origin:'TimePalette original photo-linked quiz',photoSlot:r.slot,sources:[image?.sourceUrl].filter(Boolean),researchLinks:['https://whc.unesco.org/en/list/','https://github.com/nakacy0919-Git/timepalette/blob/main/src/data/countries_'+countries.find(c=>c.iso===r.iso)?.fileLetter+'.json'],authoringStyle:'photo_linked_reasoning'});
 }).filter(q=>validQuestion(q)&&hasEnglishQuestion(q));
}
const round=n=>Math.round(n*1000)/1000;
const coord=(n,pos,neg)=>Math.abs(n).toFixed(3)+'°'+(n>=0?pos:neg);
const latJa=n=>coord(n,'N','S'),lonJa=n=>coord(n,'E','W');
const asCity=c=>({ja:c.labelJa||c.name,en:c.name,lat:round(c.coordinates[1]),lon:round(c.coordinates[0]),source:c.source});
const km=(a,b)=>{const rad=Math.PI/180,dLat=(b.lat-a.lat)*rad,dLon=(b.lon-a.lon)*rad;const h=Math.sin(dLat/2)**2+Math.cos(a.lat*rad)*Math.cos(b.lat*rad)*Math.sin(dLon/2)**2;return 6371*2*Math.asin(Math.min(1,Math.sqrt(h)));};
const deltaLon=(a,b)=>Math.abs(((a-b+540)%360)-180);
const chooseIndex=(values,mode)=>{
 const ranked=values.map((v,i)=>[v,i]).sort((a,b)=>mode==='max'?b[0]-a[0]:a[0]-b[0]);
 return Math.abs(ranked[0][0]-ranked[1][0])<.000001?-1:ranked[0][1];
};
function buildDataQuestion(country,i){
 const p=geo[country.iso];if(!p||p.cities?.length!==4)return null;
 const cities=p.cities.map(asCity);
 if(cities.some(c=>!c.ja||!c.en||!Number.isFinite(c.lat)||!Number.isFinite(c.lon))||new Set(cities.map(c=>c.ja)).size!==4||new Set(cities.map(c=>c.en)).size!==4)return null;
 const types=['north','equator','latspan','closest','eastwest','south','distance'];
 const lines=(arr,lang,withLon=true)=>arr.map(c=>(lang==='ja'?c.ja:c.en)+' '+latJa(c.lat)+(withLon?' / '+lonJa(c.lon):'')).join('；');
 const list=arr=>arr.map(c=>c.en).join('; ');
 for(let attempt=0;attempt<types.length;attempt++){
  const kind=types[(i+attempt)%types.length];let ja,en,opts,optsEn,ex,exEn,correct,visual=null;
  if(['north','south','equator'].includes(kind)){
   const vals=cities.map(c=>kind==='equator'?Math.abs(c.lat):c.lat);
   correct=chooseIndex(vals,kind==='north'?'max':'min');if(correct<0)continue;
   opts=cities.map(c=>c.ja);optsEn=cities.map(c=>c.en);
   const words={north:['最も北にある','farthest north'],south:['最も南にある','farthest south'],equator:['赤道に最も近い','closest to the equator']}[kind];
   ja=country.nameJa+'の4つの都市・地点の緯度を比較すると、'+words[0]+'のは？ '+lines(cities,'ja',false);
   en='Which of these four places in '+country.nameEn+' is '+words[1]+'? '+lines(cities,'en',false);
   ex=cities[correct].ja+'（'+latJa(cities[correct].lat)+'）です。Nは北緯、Sは南緯で、赤道は0°です。';
   exEn=cities[correct].en+' ('+latJa(cities[correct].lat)+') is the answer. N and S denote north and south of the equator (0°).';
   visual={type:'latitude',places:cities.map((c,j)=>({labelJa:c.ja,labelEn:c.en,lat:c.lat,lon:c.lon,letter:'ABCD'[j]}))};
  }else if(kind==='latspan'||kind==='eastwest'){
   const pairs=[[0,1],[0,2],[1,3],[2,3]],v=pairs.map(([a,b])=>kind==='latspan'?Math.abs(cities[a].lat-cities[b].lat):deltaLon(cities[a].lon,cities[b].lon));
   correct=chooseIndex(v,'max');if(correct<0)continue;
   opts=pairs.map(([a,b])=>cities[a].ja+'・'+cities[b].ja);optsEn=pairs.map(([a,b])=>cities[a].en+' and '+cities[b].en);
   ja=country.nameJa+'の次の4地点で、'+(kind==='latspan'?'緯度差が最も大きい':'経度差（180°以下の短い方）が最も大きい')+'組み合わせは？ '+lines(cities,'ja',true);
   en='Which pair of places in '+country.nameEn+' has the largest '+(kind==='latspan'?'latitude difference':'longitude difference (the shorter angle, at most 180°)')+'? '+lines(cities,'en',true);
   ex=opts[correct]+'です。差は約'+v[correct].toFixed(3)+'°です。';exEn=optsEn[correct]+' have the greatest difference, about '+v[correct].toFixed(3)+'°.';
   visual={type:'coordinates',axis:kind==='eastwest'?'longitude':'latitude',places:cities.map((c,j)=>({labelJa:c.ja,labelEn:c.en,lat:c.lat,lon:c.lon,letter:'ABCD'[j]}))};
  }else{
   // Four explicitly displayed computed distances between distinct pairs.
   const pairs=[[0,1],[0,2],[1,3],[2,3]],v=pairs.map(([a,b])=>Math.round(km(cities[a],cities[b])*10)/10);
   correct=chooseIndex(v,kind==='closest'?'min':'max');if(correct<0)continue;
   opts=pairs.map(([a,b])=>cities[a].ja+'・'+cities[b].ja);optsEn=pairs.map(([a,b])=>cities[a].en+' and '+cities[b].en);
   const table=(opts)=>opts.map((s,j)=>s+' '+v[j].toFixed(1)+' km').join('；');
   ja=country.nameJa+'の4組の都市・地点間の直線距離（概算）を比較し、'+(kind==='closest'?'最も近い':'最も離れている')+'組を選ぼう。 '+table(opts);
   en='Compare these approximate great-circle distances between places in '+country.nameEn+'. Which pair is '+(kind==='closest'?'closest together':'farthest apart')+'? '+table(optsEn);
   ex=opts[correct]+'の約'+v[correct].toFixed(1)+' kmです。道路距離や移動時間ではありません。';exEn=optsEn[correct]+', approximately '+v[correct].toFixed(1)+' km. This is not a road distance or travel time.';
   visual={type:'distance',labelsJa:opts,labelsEn:optsEn,values:v};
  }
  if(correct<0||new Set(opts).size!==4||new Set(optsEn).size!==4)continue;
  // Rotate the choices independently of their initial ordering; keep Japanese/English aligned.
  const shift=(i+attempt)%4,rot=a=>a.slice(4-shift).concat(a.slice(0,4-shift));
  const q=localDraft({id:'tp-original-data-v2-'+country.iso,country:country.iso,domain:'thinkConnect',subcategory:'地理・データ読解',gradeBand:['north','south','equator'].includes(kind)?'middle':'high',prompt:ja,choices:rot(opts),correctIndex:(correct+shift)%4,explanation:ex,translations:{en:{prompt:en,choices:rot(optsEn),explanation:exEn}},sources:[...new Set(cities.map(c=>c.source).filter(Boolean))],origin:'TimePalette original geographic data literacy',authoringStyle:'coordinate_reasoning',dataVisual:visual,dataPrecision:'Coordinates rounded to 0.001 degrees; distances computed from those values, rounded to 0.1 km; ties excluded.'});
  if(validQuestion(q)&&hasEnglishQuestion(q))return q;
 }
 return null;
}
export function buildOriginalDataWave(countries){return [...countries].sort((a,b)=>a.iso.localeCompare(b.iso)).map(buildDataQuestion).filter(Boolean);}
