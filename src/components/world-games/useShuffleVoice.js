import {useEffect,useRef,useState} from 'react';
import {parseVoiceVotes} from '../../utils/shuffleVoiceVotes.js';
const empty=()=>[0,0,0,0];
export function useShuffleVoice(enabled,language,choices,readings){
 const [counts,setCounts]=useState(empty),[listening,setListening]=useState(false),[status,setStatus]=useState('');
 const recognition=useRef(null),wanted=useRef(false),restart=useRef(null),generation=useRef(0);
 const supported=typeof window!=='undefined'&&!!(window.SpeechRecognition||window.webkitSpeechRecognition);
 const stop=()=>{wanted.current=false;generation.current++;clearTimeout(restart.current);const r=recognition.current;recognition.current=null;if(r){r.onend=null;r.onresult=null;r.onerror=null;try{r.abort();}catch{}}setListening(false);};
 const start=()=>{
  if(!enabled||!supported||wanted.current)return;
  wanted.current=true;const id=++generation.current;setStatus('マイクを準備中…');setListening(true);
  const open=()=>{
   if(!wanted.current||generation.current!==id)return;
   const Constructor=window.SpeechRecognition||window.webkitSpeechRecognition;
   let r;
   try{
    r=new Constructor();recognition.current=r;r.lang=language==='en'?'en-US':'ja-JP';r.continuous=true;r.interimResults=false;r.maxAlternatives=1;
    const seen=new Set();
    r.onstart=()=>{if(generation.current===id)setStatus(language==='en'?'Listening: say the full answer, not its letter.':'受付中：記号ではなく選択肢の内容を発言');};
    r.onresult=e=>{
     if(!wanted.current||generation.current!==id)return;
     const add=empty();
     for(let i=e.resultIndex;i<e.results.length;i++){
      const result=e.results[i];if(!result.isFinal||seen.has(i))continue;seen.add(i);
      const v=parseVoiceVotes(result[0]?.transcript,choices,readings);v.forEach((n,j)=>add[j]+=n);
     }
     if(add.some(Boolean))setCounts(old=>old.map((n,i)=>n+add[i]));
    };
    r.onerror=e=>{
     if(generation.current!==id)return;
     if(e.error==='no-speech')return;
     stop();setStatus(e.error==='not-allowed'||e.error==='service-not-allowed'?'マイク権限を確認してください。手動集計も使えます。':'音声認識が停止しました。再試行または手動集計を選べます。');
    };
    r.onend=()=>{if(wanted.current&&generation.current===id)restart.current=setTimeout(open,350);};
    r.start();
   }catch{stop();setStatus('音声認識を開始できません。手動集計をご利用ください。');}
  };open();
 };
 useEffect(()=>{if(!enabled)stop();},[enabled]);
 useEffect(()=>()=>{wanted.current=false;generation.current++;clearTimeout(restart.current);try{recognition.current?.abort();}catch{}},[]);
 const adjust=(i,delta)=>setCounts(old=>old.map((n,j)=>j===i?Math.max(0,n+delta):n));
 return {counts,listening,status,supported,start,stop,adjust,reset:()=>{stop();setCounts(empty());setStatus('');}};
}
