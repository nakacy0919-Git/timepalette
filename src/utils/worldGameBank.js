import {getGeography197Profile,getGeography197CountryCodes} from './geography197.js';
import {getTimePackage} from './time197.js';
import {getJicaWorldDiaryUrls} from './jicaWorldDiary.js';
import {validQuestion} from './worldGameEngine.js';

// Explicit eligibility boundary: only self-contained, reviewed questions enter games.
// AIA-derived original questions will use this same contract after rights/editorial review.
export function approvedStandaloneQuestions(records){
 return (Array.isArray(records)?records:[]).filter(q=>q?.gameEligible===true&&q?.reviewStatus==='approved'&&q?.rightsConfirmed===true&&Array.isArray(q.sources)&&q.sources.length>0&&!getJicaWorldDiaryUrls(q).length&&validQuestion(q));
}
export function makeLocalGameBank(countries,approved=[]){
 const profiles=getGeography197CountryCodes().map(getGeography197Profile).filter(Boolean);
 const allCapitals=[...new Set(profiles.map(p=>p.capitalNameJa).filter(Boolean))];
 const bank=[];
 for(const c of countries){
  const p=getGeography197Profile(c.iso);
  if(p?.capitalNameJa&&p.capitalRoleJa){
   const others=allCapitals.filter(x=>x!==p.capitalNameJa);
   const seed=c.iso.charCodeAt(0)*31+c.iso.charCodeAt(1);
   const distractors=Array.from({length:Math.min(3,others.length)},(_,i)=>others[(seed+i*Math.floor(others.length/3))%others.length]);
   bank.push({id:'game-capital-'+c.iso,country:c.iso,domain:'place',prompt:c.nameJa+'の'+p.capitalRoleJa+'はどこですか？',choices:[p.capitalNameJa,...distractors],correctIndex:0,explanation:c.nameJa+'の'+p.capitalRoleJa+'は'+p.capitalNameJa+'です。'+(p.capitalNote||''),sources:p.sources||[],origin:'TimePalette Geography'});
  }
  // Only time questions whose stem includes all necessary dates/times.
  const missions=getTimePackage(c.iso)?.missions||[];
  for(const m of missions.slice(0,3)){
   const opts=m.options||[];
   bank.push({id:'game-'+m.id,country:c.iso,domain:'time',prompt:m.prompt.replace('練習用の時計も動かせます。',''),choices:opts.map(o=>o.label),correctIndex:opts.findIndex(o=>o.correct),explanation:m.explanation,sources:m.sourceIds||[],origin:'TimePalette Time'});
  }
 }
 return [...bank.filter(validQuestion),...approvedStandaloneQuestions(approved)];
}
