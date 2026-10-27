import {useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {CreatorVideoEmbed} from './CreatorVideoMission.jsx';
import {videoEmbedUrl} from '../../utils/creatorVideo.js';
import './creatorMissionPresentation.css';
import CreatorVoicePractice from './CreatorVoicePractice.jsx';
export default function CreatorChoicePlayer({mission,position,total,alreadyCompleted,onClose,onComplete,onNext}){
 const [selected,setSelected]=useState(null),[correct,setCorrect]=useState(false),[failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
 const choices=useMemo(()=>{const a=mission.challenge.choices.map((value,i)=>({value,index:i}));for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;},[mission.id,mission.challenge]);
 const [choiceImages,setChoiceImages]=useState({});
 const imageChoices=mission.challenge.choices.map((c,i)=>typeof c==='object'&&c.image?i:null).filter(i=>i!==null);
 const choicesReady=imageChoices.every(i=>choiceImages[i]);
 const photo=mission.materials?.find(m=>m.type==='image')?.url;
 const video=videoEmbedUrl(mission.video);
 const choose=index=>{if(correct||failed||!choicesReady||photo&&!loaded)return;setSelected(index);if(index===mission.challenge.correctIndex){setCorrect(true);if(!alreadyCompleted)onComplete(mission);}};
 return createPortal(<div className="tp-creator-overlay"><section className="tp-creator-player" role="dialog" aria-modal="true" aria-label="ミッション">
  <header className="tp-creator-heading"><div><span className="tp-creator-eyebrow">WORLD ADVENTURE · MISSION {String(position).padStart(2,'0')} / {total}</span><h1>{mission.prompt}</h1></div><button type="button" aria-label="ミッションを閉じる" onClick={onClose}>×</button></header>
  <main className={'tp-creator-task '+(!photo&&!video?'text-only':'')}>
   {(photo||video)&&<div className="tp-creator-evidence">{photo&&<img src={photo} alt="問題の手がかりとなる写真" onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/>} {video&&<CreatorVideoEmbed video={mission.video}/>} {failed&&<p role="alert">写真を読み込めません。一覧から開き直してください。</p>}</div>}
   <div className="tp-creator-answers" aria-label="回答の選択肢">{choices.map(({value,index},i)=>{const item=typeof value==='object'?value:{label:value};return <button type="button" key={index} disabled={correct||failed||!choicesReady||!!photo&&!loaded} aria-pressed={selected===index} onClick={()=>choose(index)} className={(selected===index?(correct?'is-correct':'is-wrong'):'')}><span className="tp-answer-number">{String.fromCharCode(65+i)}</span>{item.image&&<img src={item.image} alt={item.alt||'候補写真'} onLoad={()=>setChoiceImages(old=>({...old,[index]:true}))} onError={()=>setFailed(true)}/>}<span>{item.label}</span></button>;})}</div>
  </main>
  <div className="tp-creator-result" aria-live="polite">{correct?<><strong>MISSION CLEAR!</strong><p>{mission.explanation}</p></>:selected!==null?'もう一度、資料の手がかりを確かめよう。':''}</div>
  <footer className="tp-creator-footer"><button type="button" onClick={onClose}>← ミッション一覧</button>{mission.voice?.enabled&&<details><summary>音読練習</summary><div><CreatorVoicePractice mission={mission}/></div></details>}<details><summary>出典・教材情報</summary><div>{mission.author?.name&&<p>作成者：{mission.author.name}</p>}{mission.sourceUrls?.map((url,i)=><a key={url+i} href={url} target="_blank" rel="noreferrer">資料{i+1} </a>)}</div></details><button type="button" disabled={!correct} onClick={onNext||onClose}>{correct?(onNext?'次のミッションへ →':'一覧へ戻る'):'答えを選ぼう'}</button></footer>
 </section></div>,document.body);
}
