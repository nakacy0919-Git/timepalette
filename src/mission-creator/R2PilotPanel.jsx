import {useEffect,useMemo,useState} from 'react';

const ENDPOINT='/api/mission-r2-pilot';
async function pilotRequest(action,session,questionId,slot){
  const response=await fetch(ENDPOINT,{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({action,session,questionId,slot})
  });
  const data=await response.json();
  if(!response.ok||!data.ok)throw new Error(data.error||'接続できませんでした');
  return data;
}
export default function R2PilotPanel({countryIso,domain,published,session}){
  const photos=useMemo(()=>published.filter(q=>['photo4','photoText4'].includes(q.type))
    .flatMap(q=>(q.media||[]).filter(m=>[1,2,3,4].includes(Number(m.slot)))
      .map(m=>({id:q.id,slot:Number(m.slot),label:`${String(q.prompt||'').slice(0,35)}…（写真${m.slot}）`})) ),[published]);
  const [index,setIndex]=useState(0);
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState('');
  const [error,setError]=useState('');
  useEffect(()=>{setIndex(0);setResult('');setError('');},[countryIso,domain]);
  if(countryIso!=='rw'||domain!=='lifeCulture')return null;
  const selected=photos[index]||photos[0];
  const run=async action=>{
    if(busy)return;
    if(action==='delete'&&!window.confirm('試験コピーだけをR2から削除します。元写真は削除されません。続けますか？'))return;
    setBusy(true);setError('');setResult('');
    try{
      const r=await pilotRequest(action,session,selected?.id,selected?.slot);
      setResult(action==='check'?`接続OK：${r.latencyMs}ms`
        :`${{copy:'コピー',read:'R2読込',delete:'試験コピー削除'}[action]}：${r.latencyMs}ms`+
        (r.bytes?`、${Math.round(r.bytes/1024)}KB、SHA-256 ${r.sha256.slice(0,12)}…`:''));
    }catch(e){setError(e.message);}
    finally{setBusy(false);}
  };
  return <section className="mc-card mc-section" aria-label="Cloudflare R2接続試験">
    <div className="mc-eyebrow">R2 PREVIEW PILOT</div>
    <h3>R2画像読み込みテスト</h3>
    <p className="mc-muted">開発プレビュー専用です。本番表示・Google Drive・既存問題は変更しません。R2バケットは非公開のままです。</p>
    <div className="mc-public-filter">
      <label>写真を1枚選択
        <select value={Math.min(index,Math.max(0,photos.length-1))} onChange={e=>setIndex(Number(e.target.value))}>
          {photos.map((p,i)=><option value={i} key={`${p.id}:${p.slot}`}>{p.label}</option>)}
        </select>
      </label>
    </div>
    <div className="mc-public-actions" style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:12}}>
      <button className="mc-outline mc-small" disabled={busy} onClick={()=>run('check')}>R2接続確認</button>
      <button className="mc-primary mc-small" disabled={busy||!selected} onClick={()=>run('copy')}>この公開写真をR2へ試験コピー</button>
      <button className="mc-outline mc-small" disabled={busy||!selected} onClick={()=>run('read')}>R2読み込み速度を測る</button>
      <button className="mc-outline mc-small" disabled={busy||!selected} onClick={()=>run('delete')}>試験コピーを削除</button>
    </div>
    {busy&&<p role="status">処理中です…</p>}
    {result&&<p role="status" className="mc-save-progress">{result}</p>}
    {error&&<p role="alert" className="mc-error">{error}</p>}
  </section>;
}
