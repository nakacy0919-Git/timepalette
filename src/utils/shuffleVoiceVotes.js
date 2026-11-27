const words={
 a:0,'エー':0,'エイ':0,'えー':0,'えい':0,
 b:1,'ビー':1,'びー':1,
 c:2,'シー':2,'しー':2,
 d:3,'ディー':3,'ディ':3,'でぃー':3,'でぃ':3
};
// Only count standalone choice utterances, never letters inside normal words.
export function parseVoiceVotes(transcript){
 const tokens=String(transcript||'').normalize('NFKC').toLowerCase().replace(/[、。！？!?.,;:・/\\|]/g,' ').trim().split(/\s+/).filter(Boolean);
 const counts=[0,0,0,0];
 for(const token of tokens){
  const t=token.replace(/^(?:選択肢|答えは)/,'').replace(/(?:です|だと思う|番)$/,'');
  if(Object.hasOwn(words,t)){counts[words[t]]++;continue;}
  // Japanese recognizers occasionally concatenate repeated choice sounds.
  const parts=t.match(/エー|エイ|ビー|シー|ディー|えー|えい|びー|しー|でぃー/g);
  if(parts&&parts.join('')===t)for(const p of parts)counts[words[p]]++;
 }
 return counts;
}
export function voteSummary(counts){
 const total=counts.reduce((a,b)=>a+b,0),max=Math.max(...counts);
 const leaders=total?counts.flatMap((n,i)=>n===max?[i]:[]):[];
 return {total,leaders,percent:counts.map(n=>total?Math.round(n*100/total):0)};
}
