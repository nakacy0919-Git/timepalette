import {useEffect,useState} from 'react';
import {useShuffleVoice} from './useShuffleVoice.js';
import {voteSummary} from '../../utils/shuffleVoiceVotes.js';
import {answerGame,advanceGame} from '../../utils/worldGameEngine.js';
import {playUiSound} from '../../utils/uiSound.js';
import {rubySegments} from '../../utils/schoolQuestionBank.js';
import './shuffleTheater.css';

export default function ShuffleStage({game,setGame,teacher,timer,voiceMode,setVoiceMode,onExit,onFullscreen,full,countryJa,countryEn,countryFlag,domain,questionMedia,reviewMedia}){
 const q=game.question,english=q.language==='en',tr=(ja,en)=>english?en:ja,review=game.phase==='review';
 const [choice,setChoice]=useState(null),[seconds,setSeconds]=useState(timer),[paused,setPaused]=useState(false),[closed,setClosed]=useState(false);
 const voice=useShuffleVoice(voiceMode&&!review&&!closed,q.language,q.choices,q.readings),summary=voteSummary(voice.counts);
 const manual=teacher||voiceMode,canChoose=!review&&(!voiceMode||closed);
 const read=value=>!english&&q.gradeBand==='elementary'&&q.readings?rubySegments(value,q.readings).map((part,i)=>part.reading?<ruby key={i}>{part.text}<rt>{part.reading}</rt></ruby>:part.text):value;
 const answer=i=>{voice.stop();setGame(g=>g.phase==='question'&&g.question?.id===q.id?answerGame(g,i):g);};
 const endVote=()=>{voice.stop();setClosed(true);setChoice(summary.leaders.length===1?summary.leaders[0]:null);};
 const choose=i=>{if(!canChoose)return;playUiSound('tap');if(manual)setChoice(i);else answer(i);};
 const toggleVoice=()=>{voice.reset();setClosed(false);setChoice(null);setVoiceMode(!voiceMode);};
 useEffect(()=>{
  if(review||!timer||paused||seconds<=0)return;
  const id=setTimeout(()=>setSeconds(s=>Math.max(0,s-1)),1000);return()=>clearTimeout(id);
 },[review,timer,paused,seconds]);
 useEffect(()=>{
  if(review||!timer||seconds!==0)return;
  if(voiceMode){if(!closed)endVote();}
  else if(!teacher)answer(-1);
 },[seconds,review,timer,voiceMode,closed,teacher]);
 useEffect(()=>{if(review)playUiSound(game.last?.correct?'correct':'wrong');},[review]);
 const selected=review?game.answers[game.turn]:choice;
 const media=review?reviewMedia:questionMedia;
 return <section className={'wst-stage'+(review?' wst-review':'')+(voiceMode?' wst-voice':'')+(media?' wst-has-media':'')} aria-label={tr('大型クイズ画面','Quiz stage')} lang={english?'en':'ja'}>
 <header className="wst-head"><button className="wst-utility" onClick={onExit}>‹ {tr('終了','Exit')}</button><div className="wst-brand"><span>TIMEPALETTE PRESENTS</span><strong>WORLD <i>SHUFFLE</i></strong></div><div className="wst-utilities">{!review&&<button className="wst-utility" aria-pressed={voiceMode} onClick={toggleVoice}>🎙 {voiceMode?'VOICE ON':'VOICE OFF'}</button>}<button className="wst-utility" onClick={onFullscreen}>{full?tr('全画面解除','Exit fullscreen'):'⛶ '+tr('全画面','Fullscreen')}</button></div></header>
 <div className="wst-progress" role="progressbar" aria-valuemin={0} aria-valuemax={game.limit} aria-valuenow={game.round+1} aria-label={tr('進捗','Progress')}><i style={{width:100*(game.round+1)/game.limit+'%'}}/></div>
 <div className="wst-body">
 <div className="wst-instruments"><div className="wst-country"><img src={countryFlag} alt={countryJa+'の国旗'}/><div><small>NOW EXPLORING</small><strong>{english?countryEn:countryJa}</strong><span>{english?countryJa:countryEn} · {domain}</span></div></div><div className="wst-round"><small>QUESTION</small><b>{String(game.round+1).padStart(2,'0')}<em> / {game.limit}</em></b></div><div className="wst-score"><small>★ SCORE</small><b>{game.teams[0]?.score||0}</b><span>🔥 {game.teams[0]?.streak||0} {tr('連続正解','STREAK')}</span></div>{timer>0&&!review&&<button className={'wst-clock'+(seconds<=5?' urgent':'')} aria-label={tr('タイマーの一時停止・再開','Pause or resume timer')} onClick={()=>setPaused(p=>!p)}><small>{paused?'PAUSED':'TIME'}</small><b>{seconds}<em>s</em></b></button>}</div>
 <div className="wst-question-area"><div className="wst-prompt"><div className="wst-eyebrow">{review?(game.last?.correct?'★ CORRECT ANSWER':'◆ ANSWER REVEAL'):'◆ '+tr('世界の知識にチャレンジ','CHALLENGE THE WORLD')}</div><h2>{read(q.prompt)}</h2>{q.originalDraft&&<small>{tr('オリジナル試用問題（確認中）','Original preview — under review')}</small>}{q.practiceDraft&&!q.originalDraft&&<small>{tr('追加学習問題（確認中）','Supplementary practice — under review')}</small>}</div>{media&&<div className="wst-media">{media}</div>}</div>
 <div className="wst-options">{q.choices.map((label,i)=><div key={i} className={'wst-option wst-option-'+i+(review&&i===q.correctIndex?' correct':'')+(review&&i===selected&&i!==q.correctIndex?' incorrect':'')+(!review&&choice===i?' selected':'')+(voiceMode&&closed&&summary.leaders.includes(i)?' popular':'')}>
 {voiceMode&&<div className="wst-vote-fill" style={{width:summary.percent[i]+'%'}}/>}<button className="wst-answer" disabled={!canChoose} aria-pressed={!review&&choice===i} onClick={()=>choose(i)}><b>{'ABCD'[i]}</b><span>{review&&i===q.correctIndex?'✓ ':''}{read(label)}</span>{voiceMode?<strong className="wst-vote-num">{summary.percent[i]}%<small>{voice.counts[i]} {tr('回','votes')}</small></strong>:review&&i===q.correctIndex?<strong aria-label={tr('正解','Correct')}>✓</strong>:<strong>›</strong>}</button>
 {voiceMode&&!review&&!closed&&<div className="wst-adjust"><button aria-label={'ABCD'[i]+tr('を1票追加',' add one vote')} onClick={()=>voice.adjust(i,1)}>＋</button><button aria-label={'ABCD'[i]+tr('を1票減らす',' remove one vote')} disabled={!voice.counts[i]} onClick={()=>voice.adjust(i,-1)}>−</button></div>}
 </div>)}</div>
 {review?<div className="wst-reviewbar"><div><h3>{game.last?.correct?'🎉 '+tr('正解！','CORRECT!'):'💡 '+tr('正解を確認しよう','LET’S LEARN!')}</h3><p>{read(q.explanation)}</p><small>{q.origin||'TimePalette'} {q.sources?.filter(s=>typeof s==='string'&&s.startsWith('https://')).slice(0,2).map((s,i)=><a key={s} href={s} target="_blank" rel="noreferrer"> · {tr('出典','Source')} {i+1}</a>)}</small></div><button className="wst-gold" onClick={()=>setGame(advanceGame)}>{game.round+1===game.limit?tr('結果を見る','Results'):tr('次の問題','Next question')} →</button></div>
 :voiceMode?<div className="wst-voicebar"><div className="wst-voice-status" role="status"><span className={voice.listening?'wst-live live':'wst-live'}/><div><b>{closed?tr('受付終了','Voting closed'):voice.listening?tr('音声受付中','Listening'):tr('音声投票','Voice voting')} · {summary.total}{tr('回認識・集計',' responses')}</b><small>{closed?(summary.leaders.length===1?tr('最多の選択肢を選びました','Top choice selected'):tr('選択肢を先生が選んでください','Teacher: select an answer')):voice.status||(!voice.supported?tr('音声認識非対応：＋−で手動集計','Speech unavailable: use +/−'):tr('選択肢の内容をそのまま順番に発言。A〜Dだけではカウントしません。','Say the full answer in turn; letters alone do not count.'))}</small></div></div><div className="wst-voice-actions">{!closed?<><button className="wst-utility" onClick={voice.reset}>{tr('リセット','Reset')}</button><button className="wst-mic" disabled={!voice.supported} onClick={voice.listening?voice.stop:voice.start}>{voice.listening?'⏸ '+tr('一時停止','Pause mic'):'🎙 '+tr('マイク開始','Start mic')}</button><button className="wst-gold" onClick={endVote}>{tr('受付終了','Close voting')}</button></>:<><button className="wst-utility" onClick={()=>{setClosed(false);setChoice(null);}}>{tr('受付再開','Reopen')}</button><button className="wst-gold" disabled={choice===null} onClick={()=>answer(choice)}>{tr('正解発表','Reveal answer')} ✨</button><button className="wst-utility" onClick={()=>answer(-1)}>{tr('パス','Pass')}</button></>}</div><small className="wst-privacy">{tr('概算集計（人数ではありません）。マイク開始時、ブラウザの音声認識サービスに音声が送られる場合があります。','Approximate responses, not individuals. Browser speech recognition may send audio to its service.')}</small></div>
 :teacher?<div className="wst-actions"><button className="wst-utility" onClick={()=>answer(-1)}>{tr('パス','Pass')}</button><button className="wst-gold" disabled={choice===null} onClick={()=>answer(choice)}>{tr('正解発表','Reveal answer')} ✨</button></div>:<div className="wst-footnote">SELECT YOUR ANSWER · {tr('正解だと思う選択肢を選ぼう！','Choose your answer!')}</div>}
 </div></section>;
}
