import {useEffect,useMemo,useState} from 'react';
import {creatorRequest} from './api';
import {PUBLIC_DOMAINS,reconcilePublishedOrder,movePublishedOrder,identicalOrder} from './publicationOrder.js';
import R2PilotPanel from './R2PilotPanel.jsx';

export default function PublishedMissionManager({cloudflare=false,countries,questions,session,busy,onPublication,onInspect,onEditPublished}){
  const [countryIso,setCountryIso]=useState('rw');
  const [domain,setDomain]=useState('lifeCulture');
  const [countrySearch,setCountrySearch]=useState('');
  const [order,setOrder]=useState([]);
  const [savedOrder,setSavedOrder]=useState([]);
  const [loading,setLoading]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [revision,setRevision]=useState(0);

  const scope=useMemo(()=>questions.filter(q=>
    String(q.countryIso||'').toLowerCase()===countryIso && q.domain===domain),
    [questions,countryIso,domain]);
  const published=scope.filter(q=>q.status==='published');
  const approved=scope.filter(q=>q.status==='approved');
  const byId=useMemo(()=>new Map(published.map(q=>[q.id,q])),[published]);
  const publishedKey=published.map(q=>q.id).sort().join('|');
  const canEdit=!busy&&!saving&&!loading;
  const dirty=!identicalOrder(order,savedOrder);

  useEffect(()=>{
    let cancelled=false;
    setOrder([]);setSavedOrder([]);setError('');setNotice('');
    if(!publishedKey){setLoading(false);return undefined;}
    setLoading(true);
    creatorRequest('getPublicationOrder',{countryIso,domain},session)
      .then(result=>{
        if(cancelled)return;
        const next=reconcilePublishedOrder(result.questionIds,published);
        setOrder(next);setSavedOrder(next);
      })
      .catch(e=>{if(!cancelled){
        const fallback=reconcilePublishedOrder([],published);
        setOrder(fallback);setSavedOrder(fallback);
        setError('公開順序をサーバーから読み込めませんでした。画面上の並びは仮表示です：'+(e?.message||'通信エラー'));
      }})
      .finally(()=>{if(!cancelled)setLoading(false);});
    return ()=>{cancelled=true;};
    // Questions are refreshed after publication; id signature triggers a new order fetch.
  },[countryIso,domain,session,publishedKey,revision]);

  const syncImage=async q=>{
    setSaving(true);setNotice('');setError('');
    try{
      const response=await fetch('/api/mission-media-sync',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({questionId:q.id,countryIso:q.countryIso,domain:q.domain,session})});
      const data=await response.json();
      if(!response.ok||!data.ok)throw Error(data.error||'同期に失敗');
      setNotice('写真のR2同期が完了しました。TimePaletteで画像を再読み込みしてください。');
    }catch(e){setError('写真の同期に失敗しました：'+e.message);}
    finally{setSaving(false);}
  };
  const save=async()=>{
    if(!canEdit||!dirty||order.length!==published.length)return;
    if(!window.confirm('この国・カテゴリーの公開ミッション順を保存しますか？'))return;
    setSaving(true);setError('');setNotice('');
    try{
      const result=await creatorRequest('setPublicationOrder',
        {countryIso,domain,questionIds:order},session);
      const next=reconcilePublishedOrder(result.questionIds,published);
      setOrder(next);setSavedOrder(next);
      setNotice('順番を保存しました。TimePaletteへの反映には最大15秒ほどかかる場合があります。');
    }catch(e){
      setError('保存できませんでした：'+(e?.message||'通信エラー')+'。公開一覧を更新してから再試行してください。');
    }finally{setSaving(false);}
  };
  const countryOptions=countries.filter(c=>
    c.iso===countryIso || !countrySearch.trim() ||
    [c.name,c.nameEn,c.iso].some(x=>String(x||'').toLowerCase().includes(countrySearch.toLowerCase())));

  return <section className="mc-card mc-section" aria-label="公開ミッション管理">
    <div className="mc-section-top"><div><div className="mc-eyebrow">PUBLISHED MISSION MANAGER</div>
      <h2>公開ミッション管理</h2></div></div>
    <p className="mc-muted">公開すると問題に設定された国・カテゴリーへ自動追加されます。順番の変更はこの画面から保存できます。</p>
    <div className="mc-public-filter">
      <div><label htmlFor="mc-pub-search">国名で検索</label>
        <input id="mc-pub-search" type="search" value={countrySearch} onChange={e=>setCountrySearch(e.target.value)} placeholder="国名・英語名"/></div>
      <div><label htmlFor="mc-pub-country">国</label>
        <select id="mc-pub-country" value={countryIso} disabled={saving} onChange={e=>setCountryIso(e.target.value)}>
          {countryOptions.map(c=><option key={c.iso} value={c.iso}>{c.name}（{c.iso.toUpperCase()}）</option>)}
        </select></div>
      <div><label htmlFor="mc-pub-domain">カテゴリー</label>
        <select id="mc-pub-domain" value={domain} disabled={saving} onChange={e=>setDomain(e.target.value)}>
          {PUBLIC_DOMAINS.map(([value,label])=><option key={value} value={value}>{label}</option>)}
        </select></div>
    </div>
    <div className="mc-public-heading"><h3>公開済み {published.length} / 10問</h3>
      <button className="mc-outline mc-small" type="button" disabled={saving||loading}
        onClick={()=>setRevision(n=>n+1)}>順番を再取得</button></div>
    {loading && <p className="mc-save-progress" role="status">公開順序を読み込んでいます…</p>}
    {error && <p className="mc-error" role="alert">{error}</p>}
    {notice && <p className="mc-save-progress" role="status">{notice}</p>}
    {!loading && published.length===0 && <p className="mc-empty">この国・カテゴリーに公開済みミッションはありません。</p>}
    {!loading && published.length>0 && <div className="mc-public-list">
      {order.map((id,index)=>{
        const q=byId.get(id);if(!q)return null;
        return <div className="mc-public-item" key={id}>
          <span className="mc-public-position">{String(index+1).padStart(2,'0')}</span>
          <div className="mc-public-text"><strong>{q.prompt}</strong><small>作成：{q.authorName||'不明'} · {q.type}</small></div>
          <div className="mc-public-actions">
            <button className="mc-outline mc-small" type="button" disabled={!canEdit||index===0}
              aria-label={q.prompt+'を上へ'} onClick={()=>setOrder(previous=>movePublishedOrder(previous,id,-1))}>↑</button>
            <button className="mc-outline mc-small" type="button" disabled={!canEdit||index===order.length-1}
              aria-label={q.prompt+'を下へ'} onClick={()=>setOrder(previous=>movePublishedOrder(previous,id,1))}>↓</button>
            <button className="mc-outline mc-small" type="button" disabled={!canEdit} onClick={()=>onInspect(q)}>確認</button>
            <button className="mc-outline mc-small" type="button" disabled={!canEdit||dirty} onClick={()=>onEditPublished(q)}>編集</button>
            {!cloudflare&&['photo4','photoText4'].includes(q.type)&&<button className="mc-outline mc-small" type="button" disabled={!canEdit} onClick={()=>syncImage(q)}>画像を再同期</button>}
            <button className="mc-outline mc-small" type="button" disabled={!canEdit||dirty}
              onClick={()=>onPublication(q,'unpublish')}>公開停止</button>
          </div>
        </div>;
      })}
    </div>}
    <div className="mc-public-footer">
      <span className="mc-muted">{dirty?'順番が変更されています。保存してください。':'公開順序に未保存の変更はありません。'}</span>
      <button className="mc-primary" type="button" disabled={!canEdit||!dirty||order.length!==published.length}
        onClick={save}>この順番を保存</button>
    </div>
    <div className="mc-public-heading"><h3>承認済みの問題を追加</h3><span className="mc-count">{approved.length}件</span></div>
    {published.length>=10 && <p className="mc-hint">公開枠が10問に達しています。公開停止すると追加できます。</p>}
    {approved.length===0 && <p className="mc-empty">追加できる承認済み問題はありません。</p>}
    {approved.map(q=><div className="mc-public-item" key={q.id}>
      <div className="mc-public-text"><strong>{q.prompt}</strong><small>作成：{q.authorName||'不明'}</small></div>
      <div className="mc-public-actions">
        <button className="mc-outline mc-small" type="button" disabled={!canEdit} onClick={()=>onInspect(q)}>確認</button>
        <button className="mc-primary mc-small" type="button" disabled={!canEdit||dirty||published.length>=10}
          onClick={()=>onPublication(q,'publish')}>TimePaletteに公開</button>
      </div>
    </div>)}
    {new URLSearchParams(window.location.search).get('r2pilot')==='1' && <R2PilotPanel countryIso={countryIso} domain={domain} published={published} session={session}/>}
    <p className="mc-muted">写真・問題・出典の確認を終えてから公開してください。公開停止しても原本は削除されません。</p>
  </section>;
}
