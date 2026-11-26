import {validQuestion} from './worldGameEngine.js';
import {hasEnglishQuestion} from './worldGameLanguage.js';
import {getJicaWorldDiaryUrls} from './jicaWorldDiary.js';
const EXPECTED=4720,PARTS=30;
const domains=new Set(['place','time','language','lifeCulture','japanConnection','thinkConnect']);
// Permission was confirmed by the site owner. These are still original practice
// drafts, not the independently editorially approved AIA publication catalog.
export function validatePracticeBank(records){
 const ids=new Set(),countries=new Map();
 for(const q of records){
  if(!validQuestion(q)||!hasEnglishQuestion(q)||!domains.has(q.domain)||!q.sources?.length||getJicaWorldDiaryUrls(q).length||ids.has(q.id))throw Error('Invalid bilingual practice question');
  ids.add(q.id);countries.set(q.country,(countries.get(q.country)||0)+1);
 }
 if(ids.size!==EXPECTED||countries.size!==118||[...countries.values()].some(n=>n!==40))throw Error('Incomplete bilingual practice catalog');
 return records.map(q=>({...q,practiceDraft:true}));
}
let pending;
async function loadPart(i){
 const name='part-'+String(i).padStart(2,'0')+'.txt';
 const response=await fetch(import.meta.env.BASE_URL+'world-games/aia-practice-v1/'+name);
 if(!response.ok)throw Error('Practice catalog unavailable: '+name);
 const raw=atob((await response.text()).trim());
 const bytes=Uint8Array.from(raw,s=>s.charCodeAt(0));
 const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
 return JSON.parse(await new Response(stream).text());
}
export function loadAiaPracticeBank(){
 if(!pending)pending=Promise.all(Array.from({length:PARTS},(_,i)=>loadPart(i+1))).then(parts=>validatePracticeBank(parts.flat())).catch(e=>{pending=null;throw e;});
 return pending;
}
