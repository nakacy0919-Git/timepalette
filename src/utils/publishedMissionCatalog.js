// Transform only validated, published Mission Creator questions into playable missions.
function imageUrl(questionId,slot){
  return '/api/mission-public?action=image&questionId='+encodeURIComponent(questionId)+'&slot='+slot;
}
export function toPublishedMission(q){
  if(!q||!['photo4','photoText4','text4'].includes(q.type)||
     !/^[a-f0-9-]{36}$/i.test(String(q.id||''))||!String(q.prompt||'').trim())return null;
  let choices,correctIndex;
  if(q.type==='photo4'){
    const match=String(q.answer||'').match(/写真スロット\s*([1-4])/i);
    if(!match||![1,2,3,4].every(slot=>q.media?.some(m=>m.slot===slot)))return null;
    correctIndex=Number(match[1])-1;
    choices=[1,2,3,4].map(slot=>({id:'photo-'+slot,label:'写真 '+slot,
      image:imageUrl(q.id,slot),alt:'候補写真 '+slot}));
  }else{
    const wrong=Array.isArray(q.choices)?q.choices:[];
    choices=[q.answer,...wrong].map(x=>String(x||'').trim());
    if(choices.length!==4||choices.some(x=>!x)||new Set(choices).size!==4)return null;
    correctIndex=0;
    if(q.type==='photoText4'&&!q.media?.some(m=>m.slot===1))return null;
  }
  return {
    id:'rw-mc-'+q.id,domain:q.domain,type:'single-choice',
    title:String(q.prompt).trim().split(/[\n。！？?]/)[0].slice(0,50),
    prompt:String(q.prompt).trim(),points:10,requiredForMastery:false,
    challenge:{choices,correctIndex},
    explanation:String(q.explanation||'').slice(0,3500),
    materials:q.type==='photoText4'?[{id:'mc-media-'+q.id,type:'image',
      url:imageUrl(q.id,1),role:'primary',alt:'問題を考えるための写真',
      display:{placement:'beforeChallenge',aspectRatio:'16:9'}}]:[],
    sourceUrls:Array.isArray(q.sources)?q.sources:[],creatorQuestionId:q.id
  };
}
export function normalizePublishedCatalog(questions){
  return (Array.isArray(questions)?questions:[]).slice(0,10)
    .map(toPublishedMission).filter(Boolean);
}
