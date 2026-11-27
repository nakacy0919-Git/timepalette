// Draft authoring, NOT a publication/rights approval. Each country fact is distinct.
import {validQuestion} from './worldGameEngine.js';
import {hasEnglishQuestion} from './worldGameLanguage.js';
import {hasCompleteReadings} from './schoolQuestionBank.js';
import {HAND_AUTHORED_ORIGINALS} from '../data/world-games/originalQuizHandAuthored.js';

const clean=x=>String(x??'').trim().replace(/\s+/g,' ');
const norm=x=>clean(x).normalize('NFKC').toLowerCase().replace(/[\s・、。.,!?'’"「」()（）‐-]/g,'');
const hash=s=>[...s].reduce((h,c)=>(Math.imul(h,31)+c.charCodeAt(0))>>>0,2166136261);
const family=(item,kind)=>{
 const c=clean(item.category)+' '+clean(item.categoryEn);
 if(/飲料|茶文化|coffee|drink|beverage/i.test(c))return 'drink';
 if(/食|料理|農業|food|cuisine|culinary/i.test(c))return 'food';
 if(/舞踊|踊|dance/i.test(c))return 'dance';
 if(/音楽|語り|music/i.test(c))return 'music';
 if(/祭|祝|儀礼|宗教|festival|ritual/i.test(c)&&kind==='culture')return 'festival';
 if(/服飾|衣装|制服|clothing|costume/i.test(c))return 'clothing';
 if(/工芸|美術|描画|織|craft|art/i.test(c)&&kind==='culture')return 'craft';
 if(/建築|住居|遊牧|集会所|architecture/i.test(c)&&kind==='culture')return 'home';
 if(kind==='culture')return 'custom';
 if(/火山|地質|峡谷|山岳|山地|化石|volcan|geolog/i.test(c))return 'landform';
 if(/海洋|海岸|環礁|島嶼|湖|水|滝|marine|coast/i.test(c))return 'water';
 if(/自然|国立公園|生物|森林|natural|park/i.test(c))return 'nature';
 if(/建築|宗教|城|教会|美術|architecture/i.test(c))return 'architecture';
 return 'history';
};
const labels={
 food:['料理・食文化','Food','料理・食文化','food or culinary tradition'],
 drink:['飲み物','Drinks','飲み物・飲み方','drink or drinking tradition'],
 dance:['踊り','Dance','踊り','dance'],
 music:['音楽','Music','音楽・演奏','musical tradition'],
 festival:['行事・慣習','Festivals','行事・慣習','custom or festival'],
 clothing:['衣文化','Clothing','衣装・服飾','clothing tradition'],
 craft:['工芸・美術','Crafts','工芸・美術','craft or art tradition'],
 home:['住文化','Homes','建物・暮らし','building or way of life'],
 custom:['生活・文化','Culture','文化・慣習','cultural tradition'],
 landform:['地理・自然','Geography','地形・自然の場所','natural landmark'],
 water:['地理・自然','Geography','自然の場所','natural landmark'],
 nature:['地理・自然','Nature','自然の場所','natural site'],
 architecture:['歴史・建築','Architecture','建造物・場所','building or site'],
 history:['歴史・文化','History','歴史的な場所','historical site']
};
const geography=new Set(['landform','water','nature']);
const contains=(text,word)=>norm(word).length>=3&&norm(text).includes(norm(word));
const countryCue=(text,language,countries)=>countries.some(c=>contains(text,language==='ja'?c.nameJa:c.nameEn));
const fileSource=c=>'https://github.com/nakacy0919-Git/timepalette/blob/main/src/data/countries_'+c.fileLetter+'.json';
const photoCandidate=(item)=>{
 const license=clean(item.imageLicense);
 if(!/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/i.test(clean(item.imageSource))||!/^https:\/\/commons\.wikimedia\.org\/wiki\/Special:FilePath\//i.test(clean(item.image))||!clean(item.imageCredit)||!(/^(CC0(?: 1\.0)?|Public domain|CC BY(?:-SA)? [234]\.0)$/i.test(license))||!/^https:\/\//.test(clean(item.imageLicenseUrl)))return null;
 return {url:item.image,sourceUrl:item.imageSource,author:item.imageCredit,license,licenseUrl:item.imageLicenseUrl,title:item.titleEn,altJa:item.title,altEn:item.titleEn,stage:'review',licenseReviewStatus:'pending',changes:'Proposed uncropped display'};
};
function buildRecord(r,others,countries){
 const x=r.item,c=r.country,labelsFor=labels[r.family],id='tp-original-atlas-v1-'+c.iso+'-'+r.kind+'-'+r.index;
 const title=clean(x.title),titleEn=clean(x.titleEn),desc=clean(x.description),descEn=clean(x.descriptionEn);
 const same=others.filter(o=>o!==r&&o.family===r.family&&norm(o.item.title)!==norm(title)&&norm(o.item.titleEn)!==norm(titleEn));
 const nameSafe=!contains(desc,title)&&!contains(descEn,titleEn)&&!countryCue(title,'ja',countries)&&!countryCue(titleEn,'en',countries);
 const nameOptions=same.filter(o=>!countryCue(o.item.title,'ja',countries)&&!countryCue(o.item.titleEn,'en',countries)&&!contains(desc,o.item.title)&&!contains(descEn,o.item.titleEn));
 const choose=(pool,ja,en)=>{const seenJa=new Set([norm(ja(r))]),seenEn=new Set([norm(en(r))]),result=[];const ranked=[...pool].sort((a,b)=>((a.country.iso===c.iso?0:1)-(b.country.iso===c.iso?0:1))||Math.abs(ja(a).length-ja(r).length)-Math.abs(ja(b).length-ja(r).length)||hash(id+a.key)-hash(id+b.key));for(const o of ranked){const j=norm(ja(o)),e=norm(en(o));if(!j||!e||seenJa.has(j)||seenEn.has(e))continue;seenJa.add(j);seenEn.add(e);result.push(o);if(result.length===3)break;}return result;};
 const getTitle=o=>clean(o.item.title),getTitleEn=o=>clean(o.item.titleEn),getDesc=o=>clean(o.item.description),getDescEn=o=>clean(o.item.descriptionEn);
 let ds=nameSafe?choose(nameOptions,getTitle,getTitleEn):[];
 let prompt,ep,choices,ec,style;
 if(ds.length===3){
  prompt=c.nameJa+'の'+labelsFor[2]+'について、次の説明に当てはまるものは？ '+desc;
  ep='Which '+labelsFor[3]+' associated with '+c.nameEn+' matches this description? '+descEn;
  choices=[title,...ds.map(getTitle)];ec=[titleEn,...ds.map(getTitleEn)];style='clue_to_name';
 }else{
  // A country name in the answer would reveal it in all four games. Reverse the task instead.
  const compatible=same.filter(o=>!contains(o.item.description,title)&&!contains(o.item.descriptionEn,titleEn)&&!countryCue(o.item.description,'ja',countries)&&!countryCue(o.item.descriptionEn,'en',countries)&&!contains(o.item.description,o.item.title)&&!contains(o.item.descriptionEn,o.item.titleEn)&&Math.abs(clean(o.item.description).length-desc.length)<=55&&Math.abs(clean(o.item.descriptionEn).length-descEn.length)<=125);
  if(countryCue(desc,'ja',countries)||countryCue(descEn,'en',countries)||contains(desc,title)||contains(descEn,titleEn))return null;
  ds=choose(compatible,getDesc,getDescEn);
  if(ds.length!==3)return null;
  prompt='「'+title+'」について、正しい説明はどれ？';ep='Which description correctly matches '+titleEn+'?';
  choices=[desc,...ds.map(getDesc)];ec=[descEn,...ds.map(getDescEn)];style='name_to_description';
 }
 const shift=hash(id)%4;const rotate=a=>a.slice(4-shift).concat(a.slice(0,4-shift));
 const q={id,country:c.iso,domain:geography.has(r.family)||r.kind==='heritage'?'place':'lifeCulture',subcategory:labelsFor[0],gradeBand:'middle',gradeReview:'provisional',prompt,choices:rotate(choices),correctIndex:shift,explanation:title+'：'+desc,translations:{en:{prompt:ep,choices:rotate(ec),explanation:titleEn+': '+descEn,subcategory:labelsFor[1]}},origin:'TimePalette original atlas quiz',sources:[fileSource(c)],sourceRecordId:clean(x.id),sourceReviewStatus:'pending',translationReviewStatus:'pending',reviewStatus:'draft',originalDraft:true,practiceDraft:true,gameEligible:false,requiresReading:false,authoringStyle:style,imageCandidate:photoCandidate(x)};
 return validQuestion(q)&&hasEnglishQuestion(q)?q:null;
}
export function buildOriginalAtlasDrafts(countries){
 const records=[];const seen=new Set();
 for(const c of countries){
  for(const kind of ['culture','heritage'])for(const [index,item] of (c[kind]||[]).entries()){
   if(![item.title,item.titleEn,item.description,item.descriptionEn].every(v=>clean(v)))continue;
   const key=c.iso+'-'+norm(item.title);
   if(seen.has(key))continue;seen.add(key);
   records.push({country:c,item,index,kind,key,family:family(item,kind)});
  }
 }
 const bank=records.map(r=>buildRecord(r,records,countries)).filter(Boolean);
 const unique=new Set();return bank.filter(q=>!unique.has(q.id)&&unique.add(q.id));
}
export function buildHandAuthoredOriginals(countries){
 const byCode=new Map(countries.map(c=>[c.iso,c]));
 return HAND_AUTHORED_ORIGINALS.map(([country,slug,gradeBand,domain,subcategory,prompt,choices,correctIndex,explanation,ep,ec,ee])=>{
  const c=byCode.get(country);if(!c)return null;
  const q={id:'tp-original-hand-v1-'+country+'-'+slug,country,gradeBand,gradeReview:'provisional',domain,subcategory,prompt,choices,correctIndex,explanation,translations:{en:{prompt:ep,choices:ec,explanation:ee,subcategory}},origin:'TimePalette original authored quiz',sources:[],researchLinks:[fileSource(c)],sourceReviewStatus:'pending',translationReviewStatus:'pending',reviewStatus:'draft',originalDraft:true,practiceDraft:true,gameEligible:false,requiresReading:false};
  return validQuestion(q)&&hasEnglishQuestion(q)&&(gradeBand!=='elementary'||hasCompleteReadings(q))?q:null;
 }).filter(Boolean);
}
export function originalBankReport(bank,countries){const byCountry={},byGrade={},byDomain={},images={pending:0};for(const c of countries)byCountry[c.iso]=0;for(const q of bank){byCountry[q.country]=(byCountry[q.country]||0)+1;byGrade[q.gradeBand]=(byGrade[q.gradeBand]||0)+1;byDomain[q.domain]=(byDomain[q.domain]||0)+1;if(q.imageCandidate)images.pending++;}return{total:bank.length,covered:Object.values(byCountry).filter(Boolean).length,missing:Object.keys(byCountry).filter(k=>!byCountry[k]),byCountry,byGrade,byDomain,images};}
