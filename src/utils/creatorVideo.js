// TimePalette video missions: strict parsing, never render arbitrary embeds or HTML.
export function parseYouTubeId(input) {
  const s=String(input||'').trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u=new URL(s);
    if(u.protocol!=='https:') return '';
    const h=u.hostname.toLowerCase();
    if(h==='youtu.be') return /^[\w-]{11}$/.test(u.pathname.slice(1))?u.pathname.slice(1):'';
    if(['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(h)) {
      const segments=u.pathname.split('/').filter(Boolean);
      const id=segments[0]==='watch'?u.searchParams.get('v'):['embed','shorts','live'].includes(segments[0])?segments[1]:'';
      return /^[\w-]{11}$/.test(id||'')?id:'';
    }
  } catch { /* invalid URL */ }
  return '';
}
export function videoEmbedUrl(video){
  const id=parseYouTubeId(video?.youtubeId||video?.youtubeUrl);
  if(!id)return '';
  const start=Number(video?.startSeconds||0), end=Number(video?.endSeconds||0);
  if(!Number.isInteger(start)||start<0||start>21600||!Number.isInteger(end)||end<0||end>21600||(end&&end<=start))return '';
  const p=new URLSearchParams({rel:'0',start:String(start)});
  if(end)p.set('end',String(end));
  return 'https://www.youtube-nocookie.com/embed/'+id+'?'+p.toString();
}
export function checkReflection(text,config={}) {
  const answer=String(text||'').trim(),len=[...answer].length;
  const min=Math.max(1,Math.min(1000,Number(config.minChars)||80));
  const max=Math.max(min,Math.min(3000,Number(config.maxChars)||600));
  const keywords=(Array.isArray(config.keywords)?config.keywords:[]).map(k=>String(k||'').trim()).filter(Boolean);
  const norm=s=>String(s).normalize('NFKC').toLocaleLowerCase('ja-JP').replace(/\s+/g,'');
  const includes=keywords.map(k=>norm(answer).includes(norm(k)));
  const missing=keywords.filter((_,i)=>!includes[i]);
  const matches=keywords.length===0||(config.keywordMode==='any'?includes.some(Boolean):missing.length===0);
  return {passed:len>=min&&len<=max&&matches,length:len,minChars:min,maxChars:max,missingKeywords:config.keywordMode==='any'&&!matches?keywords:missing};
}
