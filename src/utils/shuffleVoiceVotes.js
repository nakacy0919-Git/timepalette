import {rubySegments} from './schoolQuestionBank.js';
const normalize=value=>String(value??'').normalize('NFKC').toLowerCase()
 .replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60))
 .replace(/[\p{P}\p{Z}\s]/gu,'');
const letters=/^(?:[a-d]|えー|えい|びー|しー|でぃー|でぃ)$/;
// Require an entire displayed answer (or its reading), not the option letter.
export function parseVoiceVotes(transcript,choices=[],readings={}){
 const aliases=choices.map(label=>new Set([normalize(label),normalize(rubySegments(label,readings).map(p=>p.reading||p.text).join(''))].filter(v=>v&&!letters.test(v))));
 const counts=[0,0,0,0];
 const match=value=>{
  const s=normalize(value);
  if(!s||letters.test(s))return false;
  const candidates=[s,s.replace(/^(?:答えは|こたえは)/,'').replace(/(?:です|だと思います|だとおもいます)$/,'')];
  const found=aliases.flatMap((set,i)=>candidates.some(v=>set.has(v))?[i]:[]);
  if(found.length===1){counts[found[0]]++;return true;}
  return false;
 };
 if(!match(transcript))for(const part of String(transcript??'').split(/[、。！？!?;\n]+/u))match(part);
 return counts;
}
export function voteSummary(counts){
 const total=counts.reduce((a,b)=>a+b,0),max=Math.max(...counts);
 const leaders=total?counts.flatMap((n,i)=>n===max?[i]:[]):[];
 return {total,leaders,percent:counts.map(n=>total?Math.round(n*100/total):0)};
}
