// Read-only capability detection. Does not return private Worker URL or keys.
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({ok:false});
 return res.status(200).json({ok:true,backend:process.env.MISSION_CREATOR_BACKEND==='cloudflare'?'cloudflare':'google'});
}
