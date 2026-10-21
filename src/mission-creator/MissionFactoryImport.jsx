import {useState} from 'react';
import {readMissionFactoryZip,importFactoryDrafts} from './missionFactoryImport.js';

export default function MissionFactoryImport({session,questions,user,demo,onDone}) {
  const [plan,setPlan]=useState(null);
  const [filename,setFilename]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const [progress,setProgress]=useState('');
  const [report,setReport]=useState(null);

  async function selectZip(event){
    const f=event.target.files?.[0];
    event.target.value='';
    if(!f)return;
    setPlan(null);setFilename(f.name);setError('');setReport(null);setLoading(true);setProgress('ZIPを検証しています…');
    try {setPlan(await readMissionFactoryZip(f,questions));}
    catch(e){setError(e.message||'ZIPの読み込みに失敗しました。');}
    finally{setLoading(false);setProgress('');}
  }
  async function startImport(){
    if(!plan||loading||demo||!user||!session)return;
    if(!window.confirm(`検証済みの最大${plan.items.length}問を下書きとして保存します。\n画像はCloudflare R2に登録されます。\n問題は公開されません。続行しますか？`))return;
    setLoading(true);setError('');setReport(null);
    try {
      const rows=await importFactoryDrafts(plan,{session,onProgress:p=>setProgress(`${p.current}/${p.total}：${p.step}`)});
      setReport(rows);
      await onDone();
    }catch(e){setError(e.message||'一括登録に失敗しました。');}
    finally{setLoading(false);setProgress('');setPlan(null);}
  }
  return <div className="mc-stack">
    <section className="mc-card mc-section">
      <div className="mc-section-top"><div><div className="mc-eyebrow">MISSION FACTORY</div><h2>AI教材を5問まとめて取り込む</h2></div></div>
      <p>他のChatGPTチャットやWorkで作成した <strong>questions.json ＋ 個別画像</strong> のZIPを読み込み、Cloudflare D1とR2に下書き登録します。</p>
      <p className="mc-hint">対応形式：文章4択、写真1枚＋文章4択、写真4枚の4択。1〜5問、ZIP最大40MB。小・中・高・Challengeの複数レベル指定も保持します。</p>
      <p className="mc-hint">公開は行いません。先生が正答・出典・画像の権利・レベルを確認してから、従来の承認・公開操作をしてください。</p>
      <label style={{display:'block',maxWidth:480,marginTop:15}}>教材ZIPファイル
        <input type="file" accept=".zip,application/zip" onChange={selectZip} disabled={loading||demo}/>
      </label>
      {filename&&<p className="mc-hint">選択したファイル：{filename}</p>}
      {error&&<p role="alert" className="mc-error">{error}</p>}
      {progress&&<p role="status" className="mc-save-progress">{progress}</p>}
      {plan&&<div className="mc-stack">
        <h3>登録前の確認：{plan.items.length}問</h3>
        <div style={{display:'grid',gap:8}}>{plan.items.map((item,i)=><div key={i} style={{padding:12,border:'1px solid #cbd5e1',borderRadius:10}}>
          <strong>{i+1}. {item.question.prompt}</strong>
          <p className="mc-hint">国：{item.question.countryIso.toUpperCase()} ／ カテゴリー：{item.question.domain} ／ {item.question.type} ／ 写真：{item.images.length}枚 ／ 対象レベル：{item.question.learning.levels.join('、')}</p>
          {item.duplicate&&<p style={{color:'#b45309'}}>既存問題と重複：自動スキップ</p>}
        </div>)}</div>
        <button type="button" className="mc-primary" disabled={loading||demo||plan.items.every(item=>item.duplicate)} onClick={startImport}>確認して下書き登録する（自動公開なし）</button>
      </div>}
      {report&&<div className="mc-stack" aria-live="polite">
        <h3>登録結果：成功 {report.filter(r=>r.status==='saved').length}問／重複スキップ {report.filter(r=>r.status==='skipped').length}問／失敗 {report.filter(r=>r.status==='failed').length}問</h3>
        <p className="mc-hint">一部の画像送信が失敗した場合も、その問題の下書きは残ります。問題一覧から該当IDを確認して画像を再登録してください。同じZIPをそのまま再登録すると重複問題はスキップされます。</p>
        {report.map(r=><div key={r.number} style={{padding:10,border:'1px solid #cbd5e1',borderRadius:8}}>
          <strong>{r.number}. {r.status==='saved'?'保存済み':r.status==='skipped'?'スキップ':'要確認'}</strong>：{r.prompt}<p className="mc-hint">{r.reason}</p>
        </div>)}
      </div>}
    </section>
  </div>;
}
