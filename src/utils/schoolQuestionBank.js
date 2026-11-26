import {validQuestion} from './worldGameEngine.js';
import {hasEnglishQuestion} from './worldGameLanguage.js';
export const SCHOOL_LEVELS=[['all','すべての学年','🌍'],['elementary','小学生','🎒'],['middle','中学生','📘'],['high','高校生','🎓']];
const grades=new Set(SCHOOL_LEVELS.slice(1).map(x=>x[0]));
const hasKanji=/[一-龯々〆]/u;
export function rubySegments(text,readings){
 const s=String(text??''),keys=Object.keys(readings||{}).filter(k=>k&&readings[k]).sort((a,b)=>b.length-a.length);
 const parts=[];let i=0,plain='';
 while(i<s.length){const key=keys.find(k=>s.startsWith(k,i));if(key){if(plain){parts.push({text:plain});plain='';}parts.push({text:key,reading:readings[key]});i+=key.length;}else{plain+=s[i];i++;}}
 if(plain)parts.push({text:plain});return parts;
}
export function hasCompleteReadings(q){return [q.prompt,...q.choices,q.explanation].every(s=>rubySegments(s,q.readings).every(v=>v.reading||!hasKanji.test(v.text)));}
export function provisionalGrade(q,index){
 if(grades.has(q.gradeBand))return q;
 const tag=index?.[q.id];
 if(tag&&grades.has(tag.gradeBand)){
  const next={...q,...tag,gradeReview:'provisional'};
  return tag.gradeBand==='elementary'&&!hasCompleteReadings(next)?{...q,gradeBand:'middle',gradeReview:'provisional'}:next;
 }
 return {...q,gradeBand:q.domain==='thinkConnect'||/統計|指数|割合|比率|GDP|制度|政策|経済|調査|分析|推論|根拠|一般化|比較|時差/.test(q.prompt)||q.prompt.length>105?'high':'middle',gradeReview:'provisional'};
}
async function loadPart(name){
 const r=await fetch(import.meta.env.BASE_URL+'world-games/school-level-v1/'+name+'.txt');
 if(!r.ok)throw Error('School question data unavailable: '+name);
 const bytes=Uint8Array.from(atob((await r.text()).trim()),c=>c.charCodeAt(0));
 return JSON.parse(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text());
}
let pending;
export function loadSchoolQuestionBank(){
 if(!pending)pending=Promise.all([...Array.from({length:5},(_,i)=>loadPart('part-'+String(i+1).padStart(2,'0'))),loadPart('aia-grade')]).then(p=>{
  const index=p.pop(),questions=p.flat(),ids=new Set(questions.map(q=>q.id)),countries=new Set(questions.map(q=>q.country));
  if(questions.length!==1008||ids.size!==1008||countries.size!==197||Object.keys(index).length!==4720||questions.some(q=>!validQuestion(q)||!hasEnglishQuestion(q)||!grades.has(q.gradeBand)||q.gradeBand==='elementary'&&!hasCompleteReadings(q)))throw Error('School question validation failed');
  return {questions,index};
 }).catch(e=>{pending=null;throw e;});
 return pending;
}
