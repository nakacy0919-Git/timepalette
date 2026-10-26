// Transform only validated, published Mission Creator questions into playable missions.
function imageUrl(questionId,slot,r2MediaBase){
  // Catalog-controlled R2 URL; unknown origins cannot become media URLs.
  if(typeof r2MediaBase==='string' &&
    r2MediaBase.startsWith('https://timepalette-r2-image-pilot.timepalette-images.workers.dev/v2/') &&
    r2MediaBase.endsWith('/') && !r2MediaBase.includes('?'))
    return r2MediaBase+'P0'+slot+'.webp';
  return '/api/mission-public?action=image&questionId='+encodeURIComponent(questionId)+'&slot='+slot;
}
function videoEmbedValid(video){return !!video&&/^[A-Za-z0-9_-]{11}$/.test(String(video.youtubeId||''))&&
  Number.isInteger(Number(video.startSeconds||0))&&Number(video.startSeconds||0)>=0&&
  (!Number(video.endSeconds||0)||Number(video.endSeconds)>Number(video.startSeconds||0));}
export function toPublishedMission(q){
  if(!q||!/^[a-z]{2}$/.test(String(q.countryIso||''))||!['place','time','language','lifeCulture','japanConnection','thinkConnect'].includes(q.domain)||!['photo4','photoText4','text4','video4','videoReflect'].includes(q.type)||
     !/^[a-f0-9-]{36}$/i.test(String(q.id||''))||!String(q.prompt||'').trim())return null;
  const common={id:String(q.countryIso||'rw').toLowerCase()+'-mc-'+q.id,domain:q.domain,
    title:String(q.prompt).trim().split(/[\n。！？?]/)[0].slice(0,50),prompt:String(q.prompt).trim(),
    points:10,requiredForMastery:false,creatorQuestionId:q.id,author:q.creator||null,video:q.video||null,learning:q.learning||null,
    voice:q.learning?.voice||null,
    explanation:String(q.explanation||'').slice(0,3500),sourceUrls:Array.isArray(q.sources)?q.sources:[]};
  if(['video4','videoReflect'].includes(q.type)&&!videoEmbedValid(q.video))return null;
  if(q.type==='videoReflect')return {...common,type:'creator-video-reflection',reflection:q.video};
  let choices,correctIndex;
  if(q.type==='photo4'){
    const match=String(q.answer||'').match(/写真スロット\s*([1-4])/i);
    if(!match||![1,2,3,4].every(slot=>q.media?.some(m=>m.slot===slot)))return null;
    correctIndex=Number(match[1])-1;
    choices=[1,2,3,4].map(slot=>({id:'photo-'+slot,label:'写真 '+slot,
      image:imageUrl(q.id,slot,q.r2MediaBase),alt:'候補写真 '+slot}));
  }else{
    const wrong=Array.isArray(q.choices)?q.choices:[];
    choices=[q.answer,...wrong].map(x=>String(x||'').trim());
    if(choices.length!==4||choices.some(x=>!x)||new Set(choices).size!==4)return null;
    correctIndex=0;
    if(q.type==='photoText4'&&!q.media?.some(m=>m.slot===1))return null;
  }
  return {
    ...common,type:'single-choice',
    title:String(q.prompt).trim().split(/[\n。！？?]/)[0].slice(0,50),
    prompt:String(q.prompt).trim(),points:10,requiredForMastery:false,
    challenge:{choices,correctIndex},
    explanation:String(q.explanation||'').slice(0,3500),
    materials:q.type==='photoText4'?[{id:'mc-media-'+q.id,type:'image',
      url:imageUrl(q.id,1,q.r2MediaBase),role:'primary',alt:'問題を考えるための写真',
      display:{placement:'beforeChallenge',aspectRatio:'16:9'}}]:[],
    sourceUrls:Array.isArray(q.sources)?q.sources:[],creatorQuestionId:q.id
  };
}
export function normalizePublishedCatalog(questions){
  return (Array.isArray(questions)?questions:[])
    .map(toPublishedMission).filter(Boolean);
}

// Each country/domain is requested explicitly. Never fall back to embedded missions.
export async function fetchPublishedCountry(countryIso,{signal,fetcher=fetch}={}){
  const domains=['language','lifeCulture','japanConnection','thinkConnect'];
  const groups=await Promise.all(domains.map(async domain=>{
    const response=await fetcher('/api/mission-public?action=catalog&country='+encodeURIComponent(countryIso)+'&domain='+domain,{cache:'no-store',signal});
    if(!response.ok)throw Error('Catalog request failed');
    const payload=await response.json();
    if(!payload?.ok||!Array.isArray(payload.questions))throw Error('Invalid catalog');
    if(payload.questions.some(q=>q.countryIso!==countryIso||q.domain!==domain))throw Error('Catalog scope mismatch');
    return normalizePublishedCatalog(payload.questions);
  }));
  const seen=new Set();
  return groups.flat().filter(m=>{if(seen.has(m.id))return false;seen.add(m.id);return true;});
}
