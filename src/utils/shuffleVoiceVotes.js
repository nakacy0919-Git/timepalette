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
  const candidates=[s,s.replace(/^(?:答えは|こたえは|theansweris|ithinkits|ithinkitis)/,'').replace(/(?:です|だと思います|だとおもいます|だと思う|だとおもう)$/,'')];
  const found=aliases.flatMap((set,i)=>candidates.some(v=>set.has(v))?[i]:[]);
  if(found.length===1){counts[found[0]]++;return true;}
  return false;
 };
 if(!match(transcript)){
  const parts=String(transcript??'').split(/[、。！？!?;,\n]+/u);
  for(const part of parts){if(match(part))continue;
   // A recognizer may join successive identical/full answers without punctuation.
   // Only accept when the ENTIRE remaining transcript can be segmented uniquely.
   const s=normalize(part),memo=new Map();
   const walk=at=>{if(at===s.length)return [[]];if(memo.has(at))return memo.get(at);let ways=[];for(let i=0;i<aliases.length;i++)for(const a of aliases[i])if(s.startsWith(a,at)){for(const tail of walk(at+a.length))ways.push([i,...tail]);if(ways.length>1){memo.set(at,ways.slice(0,2));return ways.slice(0,2);}}memo.set(at,ways);return ways;};
   if(s&&s.length<=500){const ways=walk(0);if(ways.length===1&&ways[0].length>1)for(const i of ways[0])counts[i]++;}
  }
 }
 return counts;
}
export function voteSummary(counts){
 const total=counts.reduce((a,b)=>a+b,0),max=Math.max(...counts);
 const leaders=total?counts.flatMap((n,i)=>n===max?[i]:[]):[];
 return {total,leaders,percent:counts.map(n=>total?Math.round(n*100/total):0)};
}
