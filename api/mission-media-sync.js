// Admin-only repair/backfill for pre-existing published images. No GAS writes.
import {liveEnabled,validScope,adminVerified,publishMedia} from '../lib/r2-live-media.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'POST only'});
 const b=req.body||{},env=process.env;
 if(!liveEnabled(env))return res.status(503).json({ok:false,error:'R2 media not configured'});
 if(!validScope(b.questionId,b.countryIso,b.domain)||typeof b.session!=='string'||!/^[a-f0-9]{64}$/i.test(b.session))return res.status(400).json({ok:false,error:'Invalid request'});
 try{
   if(!await adminVerified(env.MISSION_CREATOR_GAS_URL,b.session,b.questionId,b.countryIso,b.domain))return res.status(403).json({ok:false,error:'管理者の公開権限を確認できません。'});
   const result=await publishMedia({id:b.questionId,iso:b.countryIso,domain:b.domain,endpoint:env.MISSION_CREATOR_GAS_URL});
   return res.status(200).json({ok:true,result});
 }catch(e){console.error('R2 backfill failed',{kind:String(e?.name||'upstream').slice(0,30)});return res.status(502).json({ok:false,error:'写真同期に失敗しました。時間をおいて再実行してください。'});}
}
