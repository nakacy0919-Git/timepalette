import {useEffect,useRef,useState} from 'react';
import {parseVoiceVotes} from '../../utils/shuffleVoiceVotes.js';
import {getSpeechRecognitionErrorMessage} from '../../utils/speechRecognitionDiagnostics.js';
const empty=()=>[0,0,0,0];
export function useShuffleVoice(enabled,language,choices,readings){
 const [counts,setCounts]=useState(empty),[listening,setListening]=useState(false),[status,setStatus]=useState(''),[transcript,setTranscript]=useState('');
 const recognition=useRef(null),wanted=useRef(false),restart=useRef(null),generation=useRef(0);
 const supported=typeof window!=='undefined'&&!!(window.SpeechRecognition||window.webkitSpeechRecognition);
 const stop=()=>{wanted.current=false;generation.current++;clearTimeout(restart.current);const r=recognition.current;recognition.current=null;if(r){r.onend=null;r.onresult=null;r.onerror=null;try{r.abort();}catch{}}setListening(false);setStatus('');};
 const ingest=value=>{const v=parseVoiceVotes(value,choices,readings);setTranscript(value);if(v.some(Boolean)){setCounts(old=>old.map((n,i)=>n+v[i]));setStatus('回答を集計しました');return true;}setStatus('選択肢のフレーズと一致しませんでした');return false;};
 const start=()=>{
  if(!enabled||!supported||wanted.current)return;
  wanted.current=true;const id=++generation.current;setStatus('マイクを準備中…');setListening(true);
  const appleMobile=/iPad|iPhone|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  let emptySessions=0;
  const open=()=>{
   if(!wanted.current||generation.current!==id)return;
   const Constructor=window.SpeechRecognition||window.webkitSpeechRecognition;
   let r;
   try{
    r=new Constructor();recognition.current=r;r.lang=language==='en'?'en-US':'ja-JP';r.continuous=!appleMobile;r.interimResults=true;r.maxAlternatives=3;
    const seen=new Set();let received=false,interim='';
    r.onstart=()=>{if(generation.current===id)setStatus(language==='en'?'Listening: say the full answer, not its letter.':'受付中：記号ではなく選択肢の内容を発言');};
    r.onaudiostart=()=>{if(generation.current===id)setStatus('マイク接続済み：回答フレーズを話してください');};
    r.onspeechstart=()=>{if(generation.current===id)setStatus('声を検出しました。認識中…');};
    r.onresult=e=>{
     if(!wanted.current||generation.current!==id)return;
     for(let i=e.resultIndex;i<e.results.length;i++){
      const result=e.results[i];const first=result[0]?.transcript||'';if(first){received=true;setTranscript(first);}
      if(!result.isFinal){interim=first;continue;}if(seen.has(i))continue;seen.add(i);interim='';
      const alternatives=Array.from(result,a=>a.transcript);const matched=alternatives.find(a=>parseVoiceVotes(a,choices,readings).some(Boolean));ingest(matched||first);
     }
    };
    r.onerror=e=>{
     if(generation.current!==id)return;
     if(e.error==='no-speech')return;
     stop();setStatus(getSpeechRecognitionErrorMessage(e.error,r.lang)+' キーボードの音声入力も使えます。');
    };
    r.onend=()=>{if(!wanted.current||generation.current!==id)return;if(interim)ingest(interim);emptySessions=received?0:emptySessions+1;if(emptySessions>=3){stop();setStatus('音声を取得できませんでした。マイクを再開するか、キーボードの音声入力をお試しください。');return;}restart.current=setTimeout(open,350);};
    r.start();
   }catch{stop();setStatus('音声認識を開始できません。手動集計をご利用ください。');}
  };open();
 };
 useEffect(()=>{if(!enabled)stop();},[enabled]);
 useEffect(()=>()=>{wanted.current=false;generation.current++;clearTimeout(restart.current);try{recognition.current?.abort();}catch{}},[]);
 const adjust=(i,delta)=>setCounts(old=>old.map((n,j)=>j===i?Math.max(0,n+delta):n));
 return {counts,listening,status,transcript,supported,start,stop,adjust,ingest,reset:()=>{stop();setCounts(empty());setTranscript('');setStatus('');}};
}
