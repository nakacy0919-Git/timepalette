import approvedCatalog from '../data/world-games/approvedQuestions.json' with {type:'json'};
import {getGeography197Profile,getGeography197CountryCodes} from './geography197.js';
import {getTimePackage,TIME_COUNTRIES} from './time197.js';
import {getJicaWorldDiaryUrls} from './jicaWorldDiary.js';
import {validQuestion} from './worldGameEngine.js';
import {englishCapital,englishTime} from './worldGameLanguage.js';
import {isAiaQuestion,aiaQuestionIssues} from './worldGameAiaAuthoring.js';

// Explicit eligibility boundary: only self-contained, reviewed questions enter games.
// AIA-derived original questions will use this same contract after rights/editorial review.
export function approvedStandaloneQuestions(records){
 const seen=new Set();
 return (Array.isArray(records)?records:[]).filter(q=>{
  if(!q||q.gameEligible!==true||q.reviewStatus!=='approved'||q.rightsConfirmed!==true||!Array.isArray(q.sources)||!q.sources.length||getJicaWorldDiaryUrls(q).length||!validQuestion(q)||seen.has(q.id))return false;
  if(!['place','time','language','lifeCulture','japanConnection','thinkConnect'].includes(q.domain)||typeof q.explanation!=='string'||!q.explanation.trim())return false;
  if(isAiaQuestion(q)&&aiaQuestionIssues(q,{publish:true}).length)return false;
  seen.add(q.id);return true;
 });
}
export function makeLocalGameBank(countries,approved=approvedCatalog.questions){
 const profiles=getGeography197CountryCodes().map(getGeography197Profile).filter(Boolean);
 const capitalNames=new Map(profiles.map(p=>[p.capitalNameJa,p.cities.find(c=>c.id===p.capitalId)?.name]));
 const allCapitals=[...capitalNames.keys()].filter(Boolean);
 const bank=[];
 for(const c of countries){
  const p=getGeography197Profile(c.iso);
  if(p?.capitalNameJa&&p.capitalRoleJa){
   const others=allCapitals.filter(x=>x!==p.capitalNameJa);
   const seed=c.iso.charCodeAt(0)*31+c.iso.charCodeAt(1);
   const distractors=Array.from({length:Math.min(3,others.length)},(_,i)=>others[(seed+i*Math.floor(others.length/3))%others.length]);
   const options=[p.capitalNameJa,...distractors];
   const en=englishCapital(p,options,capitalNames);
   bank.push({id:'game-capital-'+c.iso,country:c.iso,domain:'place',prompt:c.nameJa+'の'+p.capitalRoleJa+'はどこですか？',choices:options,correctIndex:0,explanation:c.nameJa+'の'+p.capitalRoleJa+'は'+p.capitalNameJa+'です。'+(p.capitalNote||''),sources:p.sources||[],origin:'TimePalette Geography',translations:{en}});
  }
  // Only time questions whose stem includes all necessary dates/times.
  // Japan-to-Tokyo comparisons are tautological; Japan has dedicated school questions.
  const missions=c.iso==='jp'?[]:(getTimePackage(c.iso)?.missions||[]);
  for(const m of missions.slice(0,3)){
   const opts=m.options||[];
   bank.push({id:'game-'+m.id,country:c.iso,domain:'time',prompt:m.prompt.replace('練習用の時計も動かせます。',''),choices:opts.map(o=>o.label),correctIndex:opts.findIndex(o=>o.correct),explanation:m.explanation,sources:m.sourceIds||[],origin:'TimePalette Time',translations:{en:englishTime(m,TIME_COUNTRIES[c.iso])}});
  }
 }
 return [...bank.filter(validQuestion),...approvedStandaloneQuestions(approved)];
}
