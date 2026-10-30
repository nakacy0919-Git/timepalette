import {useCallback,useEffect,useRef,useState} from 'react';
import {
  evaluateSpeechDiagnostic,getSpeechDiagnosticPhrase,getSpeechRecognitionErrorMessage,
  getSpeechLanguageName,SPEECH_PASS_SCORE,
} from '../../../utils/speechRecognitionDiagnostics.js';

const browserRecognition=()=>typeof window==='undefined'?null:
  (window.SpeechRecognition||window.webkitSpeechRecognition||null);
const browserSpeechSynthesis=()=>typeof window!=='undefined'&&
  'speechSynthesis' in window&&typeof SpeechSynthesisUtterance!=='undefined';

export default function SpeechRecognitionDiagnostic({
  locale='en-US',languageName,onClose,onResult,
}){
  const name=languageName||getSpeechLanguageName(locale);
  const sample=getSpeechDiagnosticPhrase(locale);
  const [phase,setPhase]=useState('idle');
  const [transcript,setTranscript]=useState('');
  const [accuracy,setAccuracy]=useState(null);
  const [error,setError]=useState('');
  const [copied,setCopied]=useState(false);
  const [speechError,setSpeechError]=useState('');
  const [canSpeak,setCanSpeak]=useState(browserSpeechSynthesis);
  const recognitionRef=useRef(null);
  const phraseRef=useRef('');
  const errorCodeRef=useRef('');
  const isClosingRef=useRef(false);
  const latestRef=useRef(null);
  const onResultRef=useRef(onResult);
  onResultRef.current=onResult;
  const available=Boolean(browserRecognition());
  const secure=typeof window!=='undefined'&&Boolean(window.isSecureContext);

  useEffect(()=>{
    isClosingRef.current=false;
    return ()=>{
      isClosingRef.current=true;
      try{recognitionRef.current?.abort();}catch{/* closing */}
      recognitionRef.current=null;
      try{window.speechSynthesis?.cancel();}catch{/* closing */}
    };
  },[]);

  const finish=useCallback((finalText,code='')=>{
    if(isClosingRef.current)return;
    if(code){
      const message=getSpeechRecognitionErrorMessage(code,locale);
      setError(message);
      setPhase('error');
      setAccuracy(null);
      latestRef.current={locale,status:'error',errorCode:code,recognized:false};
      onResultRef.current?.({locale,status:'error',errorCode:code,recognized:false});
      return;
    }
    const result=evaluateSpeechDiagnostic(sample,finalText);
    setTranscript(finalText);
    setAccuracy(result.recognized?result.accuracy:null);
    setPhase(result.status);
    if(!result.recognized)setError('文字起こし結果がありません。マイクや認識言語を確認して再試行してください。');
    latestRef.current={locale,...result};
    onResultRef.current?.({locale,...result});
  },[locale,sample]);

  const start=()=>{
    if(phase==='listening'||phase==='processing')return;
    setCopied(false);
    setTranscript('');
    setAccuracy(null);
    setError('');
    phraseRef.current='';
    errorCodeRef.current='';
    latestRef.current=null;
    const Recognition=browserRecognition();
    if(!Recognition||!secure){
      finish('',!Recognition?'unsupported':'insecure-context');return;
    }
    try{
      const recognition=new Recognition();
      recognition.lang=locale;
      recognition.continuous=false;
      recognition.interimResults=false;
      recognition.maxAlternatives=1;
      recognitionRef.current=recognition;
      recognition.onstart=()=>{if(!isClosingRef.current)setPhase('listening');};
      recognition.onresult=event=>{
        const words=[];
        for(let i=event.resultIndex;i<event.results.length;i++){
          const entry=event.results[i];
          if(entry.isFinal&&entry[0]?.transcript)words.push(entry[0].transcript);
        }
        if(words.length)phraseRef.current=[phraseRef.current,...words].filter(Boolean).join(' ').trim();
        if(!isClosingRef.current&&phraseRef.current)setTranscript(phraseRef.current);
      };
      recognition.onerror=event=>{
        if(event.error!=='aborted')errorCodeRef.current=event.error||'unknown';
      };
      recognition.onnomatch=()=>{errorCodeRef.current='no-match';};
      recognition.onend=()=>{
        if(isClosingRef.current)return;
        recognitionRef.current=null;
        finish(phraseRef.current,errorCodeRef.current);
      };
      setPhase('processing');
      recognition.start();
    }catch(e){
      recognitionRef.current=null;
      finish('',e?.name||'start-error');
    }
  };
  const stop=()=>{
    if(!recognitionRef.current)return;
    setPhase('processing');
    try{recognitionRef.current.stop();}
    catch(e){finish(phraseRef.current,e?.name||'stop-error');}
  };

  const speakSample=()=>{
    setSpeechError('');
    if(!browserSpeechSynthesis()){
      setCanSpeak(false);
      setSpeechError('この端末では音声読み上げが利用できません。');
      return;
    }
    try{
      const utterance=new SpeechSynthesisUtterance(sample);
      utterance.lang=locale;
      utterance.rate=0.85;
      const voices=window.speechSynthesis.getVoices();
      const matching=voices.find(v=>v.lang.toLowerCase()===locale.toLowerCase())||
        voices.find(v=>v.lang.toLowerCase().startsWith(locale.split('-')[0].toLowerCase()));
      if(matching)utterance.voice=matching;
      utterance.onerror=()=>{if(!isClosingRef.current)setSpeechError('読み上げに失敗しました。端末の音声設定を確認してください。');};
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }catch(e){
      setSpeechError('音声読み上げを開始できませんでした（'+(e?.name||'error')+'）。');
    }
  };
  const copyReport=async()=>{
    const result=latestRef.current;
    const lines=[
      'TimePalette 音声認識チェック',
      '言語: '+name+' / '+locale,
      '日時: '+new Date().toLocaleString('ja-JP'),
      'ブラウザー: '+(typeof navigator==='undefined'?'unknown':navigator.userAgent),
      'セキュア接続: '+secure,
      'Web Speech API: '+available,
      '結果: '+(result?.status||'未実施'),
      'Accuracy: '+(result?.accuracy??'-'),
      'エラー: '+(result?.errorCode??'-'),
      'お手本: '+sample,
      '文字起こし: '+(transcript||'-'),
      '注: 単一の挨拶を用いた動作チェックです。すべての単語や端末での対応を保証しません。',
    ];
    try{
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
    }catch{setCopied(false);setError('結果をコピーできませんでした。ブラウザーのクリップボード許可を確認してください。');}
  };
  const statusLabel={
    idle:'未確認',listening:'マイク録音中',processing:'認識結果を確認中',
    matched:'挨拶の文字起こし・一致を確認',mismatch:'文字起こしは成功／一致度不足',
    'no-transcript':'文字起こし結果なし',error:'音声認識エラー',
  };
  return (
    <div role="presentation" className="fixed inset-0 z-[14000] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-label={name+' 音声認識チェック'}
        className="w-full max-w-xl max-h-[94dvh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-widest text-violet-600">LANGUAGE CHECK · {locale}</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900">{name} 音声認識チェック</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="診断を閉じる" className="rounded-full border border-slate-300 px-3 py-2 text-sm font-black text-slate-700">閉じる ×</button>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          マイクで下の挨拶を読んでください。選んだ言語での文字起こしと、お手本との一致度を調べます。
          このチェックだけで全てのフレーズの音声認識が保証されるわけではありません。
        </p>
        <div className="mt-4 rounded-2xl bg-violet-50 px-5 py-4">
          <p className="text-xs font-black text-violet-600">発話する言葉</p>
          <p className="mt-1 text-3xl font-black text-slate-900">{sample}</p>
          <p className="mt-1 text-xs text-slate-500">認識言語：{locale}　合格ライン：{SPEECH_PASS_SCORE}%</p>
          <button type="button" onClick={speakSample} disabled={!canSpeak} className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-black text-violet-700 shadow-sm disabled:opacity-50">
            ▶ お手本を聞く
          </button>
          {speechError&&<p role="alert" className="mt-2 text-sm text-red-700">{speechError}</p>}
        </div>
        <p className="mt-4 text-sm font-black text-slate-800" role="status" aria-live="polite">
          状態：{statusLabel[phase]||phase}
        </p>
        {!available&&<p role="alert" className="mt-2 text-sm text-red-700">{getSpeechRecognitionErrorMessage('unsupported',locale)}</p>}
        {!secure&&<p role="alert" className="mt-2 text-sm text-red-700">{getSpeechRecognitionErrorMessage('insecure-context',locale)}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={start} disabled={!available||!secure||phase==='listening'||phase==='processing'}
            className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-black text-white disabled:opacity-50">
            🎙 {phase==='matched'||phase==='mismatch'||phase==='no-transcript'||phase==='error'?'もう一度チェック':'発話してチェック'}
          </button>
          {(phase==='listening'||phase==='processing')&&<button type="button" onClick={stop} disabled={!recognitionRef.current}
            className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-black text-slate-800">録音を終了</button>}
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-black text-slate-500">認識した文字（翻訳ではありません）</p>
          <p className="mt-2 min-h-8 text-xl font-bold text-slate-900" aria-live="polite">{transcript||'まだ文字起こし結果はありません'}</p>
          {accuracy!==null&&<p className="mt-3 text-lg font-black text-violet-700">お手本との一致度：{accuracy}%</p>}
          {phase==='matched'&&<p className="mt-1 text-sm font-bold text-emerald-700">この端末で、指定した挨拶の文字起こしと一致を確認できました。</p>}
          {phase==='mismatch'&&<p className="mt-1 text-sm font-bold text-amber-700">文字は返りましたが、お手本と一致しません。認識言語・発話・周囲の音を確認してください。</p>}
          {error&&<p role="alert" className="mt-2 text-sm font-bold text-red-700">{error}</p>}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="max-w-xs text-xs leading-5 text-slate-500">診断結果はこの画面でのみ保持します。音声認識自体の処理はブラウザーのサービスを利用します。結果を共有する場合のみコピーしてください。</p>
          <button type="button" onClick={copyReport} disabled={!latestRef.current} className="rounded-xl border px-4 py-2 text-xs font-black text-slate-700 disabled:opacity-40">
            {copied?'✓ コピーしました':'診断結果をコピー'}
          </button>
        </div>
      </section>
    </div>
  );
}
