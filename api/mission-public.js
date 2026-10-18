// Read-only published questions and photos. No Sheets ID, Drive file ID or teacher session leaks.
const GOOGLE_URL_PATTERN=/^https:\/\/script\.google\.com\/macros\/s\//;
export default async function handler(req,res){
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='GET')return res.status(405).json({ok:false,error:'GET only'});
  const action=String(req.query.action||'catalog');
  const iso=String(req.query.country||'rw').toLowerCase();
  const domain=String(req.query.domain||'lifeCulture');
  if(!['catalog','image'].includes(action)||iso!=='rw'||domain!=='lifeCulture')
    return res.status(400).json({ok:false,error:'Unsupported public scope'});
  const endpoint=process.env.MISSION_CREATOR_GAS_URL;
  if(!endpoint||!GOOGLE_URL_PATTERN.test(endpoint))
    return res.status(503).json({ok:false,error:'Public missions are not configured'});
  const url=new URL(endpoint);
  url.searchParams.set('action',action==='catalog'?'publishedCatalog':'publishedPhoto');
  if(action==='catalog'){
    url.searchParams.set('countryIso',iso);url.searchParams.set('domain',domain);
  }else{
    const id=String(req.query.questionId||''),slot=Number(req.query.slot);
    if(!/^[a-f0-9-]{36}$/i.test(id)||![1,2,3,4].includes(slot))
      return res.status(400).json({ok:false,error:'Invalid image request'});
    url.searchParams.set('questionId',id);url.searchParams.set('slot',String(slot));
  }
  try{
    const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(22000)});
    if(!response.ok)throw new Error('GAS status');
    const txt=await response.text();
    if(txt.length>2_000_000)throw new Error('Response too large');
    let payload;try{payload=JSON.parse(txt);}catch{throw new Error('Invalid JSON');}
    if(!payload?.ok) return res.status(404).json({ok:false,error:'Not available'});
    if(action==='catalog'){
      if(!Array.isArray(payload?.data?.questions))throw new Error('Invalid catalog');
      res.setHeader('Cache-Control','public, s-maxage=15, max-age=0');
      return res.status(200).json({ok:true,questions:payload.data.questions});
    }
    const data=payload?.data;
    if(!data||data.mime!=='image/webp'||typeof data.base64!=='string'||
       data.base64.length>1_700_000||!/^[A-Za-z0-9+/]+={0,2}$/.test(data.base64))
      throw new Error('Invalid image data');
    const bytes=Buffer.from(data.base64,'base64');
    if(bytes.length>1_228_800||bytes.toString('ascii',0,4)!=='RIFF'||
       bytes.toString('ascii',8,12)!=='WEBP')throw new Error('Invalid WebP');
    // A stopped publication can remain CDN-cached for at most 30 seconds.
    res.setHeader('Content-Type','image/webp');
    res.setHeader('Cache-Control','public, s-maxage=30, max-age=0');
    return res.status(200).send(bytes);
  }catch(_){return res.status(502).json({ok:false,error:'公開ミッションの読み込みに失敗しました。しばらくして再試行してください。'});}
}
