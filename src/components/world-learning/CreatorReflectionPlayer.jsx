import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import CreatorSourceViewer,{ExplanationLinks,safeSourceUrl} from './CreatorSourceViewer.jsx';
import {reflectionReady} from '../../utils/creatorReflection.js';
import './creatorMissionPresentation.css';
import './creatorReflection.css';

export default function CreatorReflectionPlayer({mission,position,total,alreadyCompleted,onClose,onComplete,onNext}) {
  const dialog=useRef(null),submitted=useRef(false),result=useRef(null);
  const [answer,setAnswer]=useState(''),[confirmed,setConfirmed]=useState(false);
  const [complete,setComplete]=useState(false),[source,setSource]=useState(null);
  const [imageState,setImageState]=useState('loading'),[imageAttempt,setImageAttempt]=useState(0);
  const photo=mission.materials?.find(m=>m.type==='image')?.url;
  const evidenceReady=!photo||imageState==='ready';
  const ready=reflectionReady(answer,confirmed,evidenceReady);
  useEffect(()=>{
    const previous=document.activeElement,element=dialog.current;
    element.showModal();
    return ()=>{element.close();if(previous?.isConnected)previous.focus();};
  },[]);
  useEffect(()=>{if(complete)result.current?.focus();},[complete]);
  const submit=()=>{
    if(!ready||submitted.current)return;
    submitted.current=true;setComplete(true);
    if(!alreadyCompleted)onComplete(mission);
  };
  const save=()=>{
    const text=[mission.prompt,'',answer,'','TimePalette：本人の考え・機械による正誤判定なし'].join('\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='timepalette-reflection.txt';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return createPortal(<dialog ref={dialog} className="tp-creator-player tp-reflection-dialog" aria-labelledby="tp-reflection-title" onCancel={e=>{e.preventDefault();if(source)setSource(null);else onClose();}}>
    <header inert={source?true:undefined} className="tp-creator-heading"><div><span className="tp-creator-eyebrow">WORLD ADVENTURE · {position} / {total} · 考えて伝える</span><h1 id="tp-reflection-title">{mission.prompt}</h1></div><button type="button" aria-label="ミッションを閉じる" onClick={onClose}>×</button></header>
    <main inert={source?true:undefined} className={'tp-creator-task tp-reflection-task '+(!photo?'text-only':'')}>
      {photo&&<div className="tp-reflection-photo"><img key={imageAttempt} src={photo} alt="問題の資料となる写真" onLoad={()=>setImageState('ready')} onError={()=>setImageState('error')}/>{imageState==='loading'&&<p role="status">写真を読み込んでいます…</p>}{imageState==='error'&&<p role="alert">写真を読み込めません。<button onClick={()=>{setImageState('loading');setImageAttempt(n=>n+1);}}>写真を再読み込み</button></p>}</div>}
      <section className="tp-reflection-editor">
        {!complete?<>
          <label>気づいたことと、その根拠を書こう<textarea rows={5} maxLength={3000} value={answer} onChange={e=>setAnswer(e.target.value)} placeholder="写真のどこを見て、どのように考えましたか？" aria-describedby="tp-reflection-help"/></label>
          <p id="tp-reflection-help">10〜3,000文字。これは自分の考えを残す活動です。文字数は内容の正誤を判定するものではありません。</p>
          <label className="tp-reflection-check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>自分の考えと、そう考えた理由を書きました</label>
        </>:<div ref={result} tabIndex={-1} className="tp-reflection-discovery" role="status"><h2>考えを記録しました</h2><p>参考回答と比べ、同じ点・違う点を確かめよう。自動採点はしていません。</p><h3>自分の考え</h3><p>{answer}</p>{mission.referenceAnswer&&<><h3>参考回答・考えるヒント</h3><p>{mission.referenceAnswer}</p></>}<h3>解説</h3><p><ExplanationLinks text={mission.explanation||'どんな手がかりを使ったか、友達や先生と話してみましょう。'} onOpen={setSource}/></p></div>}
        <div className="tp-reflection-sources">{mission.sourceUrls?.filter(safeSourceUrl).map((url,i)=><button key={url+i} className="tp-source-link" onClick={()=>setSource(url)}>📖 参考資料 {i+1} を読む</button>)}</div>
        <p className="tp-reflection-privacy">回答文はサーバーに送信しません。この画面を閉じると消えるため、残したい場合は「回答を端末に保存」を押してください。クリア記録は学習モードの保存方法に従います。</p>
      </section>
    </main>
    <footer inert={source?true:undefined} className="tp-creator-footer"><button onClick={onClose}>← ミッション一覧</button><button onClick={save} disabled={!answer.trim()}>回答を端末に保存</button>{complete?<button onClick={onNext||onClose}>{onNext?'次のミッションへ →':'一覧へ戻る'}</button>:<button disabled={!ready} onClick={submit}>記録して解説を見る</button>}</footer>
    {source&&<CreatorSourceViewer key={source} url={source} onClose={()=>setSource(null)}/>}
  </dialog>,document.body);
}
