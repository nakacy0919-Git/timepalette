import {useMemo,useState,useRef,useEffect} from 'react';
import {createPortal} from 'react-dom';
import {CreatorVideoEmbed} from './CreatorVideoMission.jsx';
import {videoEmbedUrl} from '../../utils/creatorVideo.js';
import './creatorMissionPresentation.css';
import CreatorSourceViewer,{ExplanationLinks,safeSourceUrl} from './CreatorSourceViewer.jsx';
import CreatorVoicePractice from './CreatorVoicePractice.jsx';
import SourceStudyReader from './SourceStudyReader.jsx';
import {getJicaWorldDiaryUrls} from '../../utils/jicaWorldDiary.js';
import './worldDiaryChoice.css';
export default function CreatorChoicePlayer({mission,position,total,alreadyCompleted,onClose,onComplete,onNext}){
 const [source,setSource]=useState(null);
 const [diaryFullscreen,setDiaryFullscreen]=useState(false);
 const diaryUrl=mission.jicaDiarySourceUrl||getJicaWorldDiaryUrls(mission)[0]||null;
 const [completedOnEntry]=useState(alreadyCompleted);
 const [feedback,setFeedback]=useState(null),[muted,setMuted]=useState(false);
 const submitted=useRef(false),audio=useRef(null),feedbackButton=useRef(null);
 useEffect(()=>{if(feedback)feedbackButton.current?.focus();},[feedback]);
 useEffect(()=>()=>{audio.current?.close().catch(()=>{});},[]);
 const sound=success=>{if(muted)return;try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)return;const ctx=audio.current||(audio.current=new Audio());ctx.resume().catch(()=>{});const start=ctx.currentTime; (success?[523.25,659.25,783.99]:[349.23,293.66]).forEach((frequency,i)=>{const tone=ctx.createOscillator(),gain=ctx.createGain(),t=start+i*.13;tone.type='sine';tone.frequency.value=frequency;gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.055,t+.025);gain.gain.exponentialRampToValueAtTime(.0001,t+.23);tone.connect(gain);gain.connect(ctx.destination);tone.start(t);tone.stop(t+.25);});}catch{/* Audio is optional; visual feedback always works. */}};
 const [selected,setSelected]=useState(null),[correct,setCorrect]=useState(false),[failed,setFailed]=useState(false),[loaded,setLoaded]=useState(false);
 const choices=useMemo(()=>{const a=mission.challenge.choices.map((value,i)=>({value,index:i}));for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;},[mission.id,mission.challenge]);
 const [choiceImages,setChoiceImages]=useState({});
 const imageChoices=mission.challenge.choices.map((c,i)=>typeof c==='object'&&c.image?i:null).filter(i=>i!==null);
 const choicesReady=imageChoices.every(i=>choiceImages[i]);
 const photo=diaryUrl?null:mission.materials?.find(m=>m.type==='image')?.url;
 const video=diaryUrl?null:videoEmbedUrl(mission.video);
 const choose=index=>{if(submitted.current||feedback||correct||failed||!choicesReady||photo&&!loaded)return;setSelected(index);const success=index===mission.challenge.correctIndex;sound(success);if(success){submitted.current=true;setCorrect(true);if(!completedOnEntry)onComplete(mission);}setFeedback(success?'correct':'wrong');};

 return createPortal(<div className="tp-creator-overlay"><section className={'tp-creator-player'+(diaryUrl?' tp-creator-diary-mode':'')+(diaryFullscreen?' tp-creator-diary-expanded':'')} role="dialog" aria-modal="true" aria-label="ミッション">
  <header inert={feedback||source?true:undefined} className="tp-creator-heading"><div><span className="tp-creator-eyebrow">WORLD ADVENTURE · MISSION {String(position).padStart(2,'0')} / {total}</span><h1>{mission.prompt}</h1></div><button type="button" aria-label="ミッションを閉じる" onClick={onClose}>×</button></header>
  <main inert={feedback||source?true:undefined} className={'tp-creator-task '+(diaryUrl?'tp-creator-diary-task':(!photo&&!video?'text-only':''))}>
   {diaryUrl&&<div className="tp-creator-diary-evidence" aria-label="世界日記の原文"><SourceStudyReader source={{title:'JICA海外協力隊 世界日記',organization:'JICA · 隊員による体験談',url:diaryUrl}} className="tp-creator-diary-reader" allowFullscreen defaultZoom={0.75} onFullscreenChange={setDiaryFullscreen}/></div>}
   {(photo||video)&&<div className="tp-creator-evidence">{photo&&<img src={photo} alt="問題の手がかりとなる写真" onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)}/>} {video&&<CreatorVideoEmbed video={mission.video}/>} {failed&&<p role="alert">写真を読み込めません。一覧から開き直してください。</p>}</div>}
   <div className={diaryUrl?'tp-creator-diary-question':'tp-creator-choice-area'}>
   {diaryUrl&&<p className="tp-creator-diary-notice" role="note" data-testid="jica-diary-subjective-notice"><strong>資料の読み方（必ず確認）</strong>これはJICA海外協力隊員が自身の体験や見解をもとに書いた「世界日記」です。隊員個人の主観が含まれており、記事の内容がその国や地域全体に当てはまるとは限りません。この4択の答えは記事の記述に基づいています。</p>}
   <div className="tp-creator-answers" aria-label="回答の選択肢">{choices.map(({value,index},i)=>{const item=typeof value==='object'?value:{label:value};return <button type="button" key={index} disabled={correct||failed||!choicesReady||!!photo&&!loaded} aria-pressed={selected===index} onClick={()=>choose(index)} className={(selected===index?(correct?'is-correct':'is-wrong'):'')}><span className="tp-answer-number">{String.fromCharCode(65+i)}</span>{item.image&&<img src={item.image} alt={item.alt||'候補写真'} onLoad={()=>setChoiceImages(old=>({...old,[index]:true}))} onError={()=>setFailed(true)}/>}<span>{item.label}</span></button>;})}</div></div>
  </main>
  <div className="tp-creator-result" aria-live="polite">{correct?'ミッションクリア！ 解説をもう一度確認できます。':''}</div>
  {feedback&&<div inert={source?true:undefined} className="tp-choice-feedback"><section className={'tp-choice-feedback-card '+feedback} role="alertdialog" aria-modal="true" aria-labelledby="tp-feedback-title" onKeyDown={event=>{if(event.key==='Escape'&&feedback==='wrong'){setFeedback(null);setSelected(null);}if(event.key==='Tab'){const buttons=[...event.currentTarget.querySelectorAll('button')];const first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}}>
   {feedback==='correct'&&<div className="tp-confetti" aria-hidden="true">{Array.from({length:54},(_,i)=><i key={i} style={{'--x':`${(i*37)%100}%`,'--delay':`${(i%9)*.12}s`,'--turn':`${i%2?360:-360}deg`,'--confetti-color':['#ffcb45','#ef779b','#39bac5','#8b85df','#79c96c'][i%5]}}/>)}</div>}
   <header><span className="tp-feedback-symbol" aria-hidden="true">{feedback==='correct'?'✦':'↻'}</span><h2 id="tp-feedback-title">{feedback==='correct'?'MISSION CLEAR!':'もう一度チャレンジ！'}</h2><p>{feedback==='correct'?(completedOnEntry?'復習完了 · 加点済み':`初回クリア · ${mission.points??10} WP`):'今回は不正解。写真や資料の手がかりを、もう一度探してみよう。'}</p></header>
   {feedback==='correct'&&<div className={'tp-feedback-discovery '+(!photo?'without-photo':'')}>{photo&&<img src={photo} alt="解説と見比べる、問題と同じ写真"/>}<div><h3>{diaryUrl?'世界日記の記述を振り返ろう':'写真・資料からの発見'}</h3>{diaryUrl&&<p className="tp-creator-diary-feedback-warning">この記事は隊員個人の体験談であり、主観を含みます。正答は記事に書かれた内容に基づくもので、国全体の一般的な事実を示すものではありません。</p>}<p><ExplanationLinks text={mission.explanation||'記事の記述と答えを照らし合わせてみましょう。'} onOpen={setSource}/></p>{mission.sourceUrls?.filter(safeSourceUrl).map((url,i)=><button key={url+i} type="button" className="tp-source-link" onClick={()=>setSource(url)}>📖 参考資料 {i+1} を読む</button>)}</div></div>}
   <footer>{feedback==='wrong'?<button ref={feedbackButton} type="button" onClick={()=>{setFeedback(null);setSelected(null);}}>もう一度挑戦する</button>:<><button ref={feedbackButton} type="button" onClick={()=>setFeedback(null)}>写真と問題に戻る</button><button type="button" onClick={onNext||onClose}>{onNext?'次のミッションへ →':'一覧へ戻る'}</button></>}</footer>
  </section></div>}

  <footer inert={feedback||source?true:undefined} className="tp-creator-footer"><button type="button" aria-pressed={muted} onClick={()=>setMuted(v=>!v)}>{muted?'音：オフ':'音：オン'}</button><button type="button" onClick={onClose}>← ミッション一覧</button>{mission.voice?.enabled&&<details><summary>音読練習</summary><div><CreatorVoicePractice mission={mission}/></div></details>}<details><summary>出典・教材情報</summary><div>{mission.author?.name&&<p>作成者：{mission.author.name}</p>}{mission.sourceUrls?.map((url,i)=><button key={url+i} type="button" className="tp-source-link" onClick={()=>safeSourceUrl(url)&&setSource(url)}>資料{i+1} を読む</button>)}</div></details><button type="button" disabled={!correct} onClick={()=>setFeedback('correct')}>{correct?'写真と解説を見る':'答えを選ぼう'}</button></footer>
 {source&&<CreatorSourceViewer key={source} url={source} onClose={()=>setSource(null)}/>}
 </section></div>,document.body);
}
