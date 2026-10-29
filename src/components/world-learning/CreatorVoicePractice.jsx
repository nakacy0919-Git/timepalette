import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, Keyboard, CheckCircle2, RotateCcw } from 'lucide-react';
import { compareCreatorVoice, validVoiceLocale } from '../../utils/creatorVoiceMatch.js';

// Optional, non-scored practice for teacher-published Creator missions.
// Audio never goes to TimePalette APIs, but browsers MAY process recognition remotely.
export default function CreatorVoicePractice({ mission }) {
  const voice = mission?.voice;
  const locale = validVoiceLocale(voice?.lang) ? voice.lang : 'en-US';
  const target = String(voice?.target || '').trim();
  const [mode, setMode] = useState('idle');
  const [heard, setHeard] = useState('');
  const [typed, setTyped] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [notice, setNotice] = useState('');
  const [exampleVisible, setExampleVisible] = useState(false);
  const recognitionRef = useRef(null);
  const recognitionClass = typeof window === 'undefined' ? null :
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    setMode('idle'); setHeard(''); setTyped(''); setFeedback(null);
    setNotice(''); setExampleVisible(false);
    return () => {
      const running = recognitionRef.current;
      recognitionRef.current = null;
      if (running) {
        running.onresult = null;
        running.onerror = null;
        running.onend = null;
        try { running.abort(); } catch { /* already stopped */ }
      }
    };
  }, [mission.id, locale]);

  if (!voice?.enabled || !target) return null;

  function assess(text) {
    const result = compareCreatorVoice(text, voice);
    setHeard(String(text || ''));
    setFeedback(result.matched ? 'matched' : result.heard ? 'retry' : null);
  }

  function listen() {
    if (!recognitionClass || mode === 'listening') return;
    setFeedback(null); setHeard(''); setNotice('');
    const recognition = new recognitionClass();
    recognitionRef.current = recognition;
    recognition.lang = locale;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 3;
    recognition.onresult = event => {
      if (recognitionRef.current !== recognition) return;
      const list = event.results?.[0];
      const alternatives = Array.from(list || []).map(item => String(item.transcript || ''));
      const exact = alternatives.find(x => compareCreatorVoice(x, voice).matched);
      assess(exact || alternatives[0] || '');
      setMode('idle');
    };
    recognition.onerror = event => {
      if (recognitionRef.current !== recognition) return;
      const code = String(event.error || '');
      setNotice(code === 'not-allowed' || code === 'service-not-allowed'
        ? 'マイクの利用が許可されていません。端末の設定を確認するか、手入力を使用してください。'
        : code === 'language-not-supported'
          ? 'この言語の音声認識に対応していません。手入力を使用してください。'
          : code === 'no-speech'
            ? '音声を認識できませんでした。もう一度試してください。'
            : '音声認識を利用できません。手入力を使用できます。');
      setMode('idle');
    };
    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setMode('idle');
      }
    };
    try { recognition.start(); setMode('listening'); }
    catch { setMode('idle'); setNotice('音声認識を開始できませんでした。手入力を使用してください。'); }
  }

  function stop() {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognitionRef.current = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.abort(); } catch { /* already ended */ }
    }
    setMode('idle');
  }

  function playExample() {
    if (typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      setNotice('この端末では読み上げを利用できません。お手本文字を表示してください。');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(target);
      utterance.lang = locale;
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch { setNotice('読み上げできませんでした。文字で確認してください。'); }
  }

  return (
    <section className="mb-6 rounded-[24px] border border-sky-200 bg-sky-50 p-5" aria-label="発話練習">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-black text-sky-900">🎤 世界のことばに挑戦！</h3>
        <span className="text-xs font-bold text-sky-700">発話言語：{locale}</span>
      </div>
      {voice.prompt && <p className="mt-2 whitespace-pre-wrap font-medium text-slate-800">{voice.prompt}</p>}
      <p className="mt-2 text-xs leading-relaxed text-slate-700">
        マイクを押すとブラウザの音声認識が動きます。認識サービスへ音声が送信される場合があります。
        TimePaletteは録音や認識結果をサーバーに保存しません。発音の良し悪しではなく、認識された語句との一致を確認します。
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {recognitionClass ? (
          <button type="button" onClick={mode === 'listening' ? stop : listen}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-bold text-white">
            {mode === 'listening' ? <><MicOff size={19}/>停止する</> : <><Mic size={19}/>マイクで話す</>}
          </button>
        ) : <span className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">このブラウザでは音声認識非対応です。手入力で練習できます。</span>}
        <button type="button" onClick={playExample} className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-4 py-3 font-bold text-sky-900">
          <Volume2 size={19}/>お手本を聞く
        </button>
        <button type="button" onClick={() => setExampleVisible(x => !x)}
          className="rounded-xl border border-sky-300 bg-white px-4 py-3 font-bold text-sky-900">
          {exampleVisible ? 'お手本を隠す' : 'お手本の文字を見る'}
        </button>
      </div>
      {mode === 'listening' && <p role="status" className="mt-2 text-sm font-bold text-blue-700">聞き取っています…</p>}
      {exampleVisible && <p className="mt-3 rounded-xl bg-white p-3 text-lg font-bold" lang={locale}>{target}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-amber-800">{notice}</p>}
      {heard && <p className="mt-3 text-sm">認識結果：<strong lang={locale}>{heard}</strong></p>}
      {feedback && <div role="status" className={`mt-3 flex items-center gap-2 rounded-xl p-3 text-sm font-bold ${feedback === 'matched' ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}>
        {feedback === 'matched' ? <><CheckCircle2 size={18}/>お手本の語句が認識されました！</> : <><RotateCcw size={18}/>違う語句として認識されました。何度でも試せます。</>}
      </div>}
      <label className="mt-4 block text-sm font-bold text-slate-800"><Keyboard size={17} className="mr-1 inline"/>音声を使えない場合の手入力
        <input value={typed} onChange={e => setTyped(e.target.value)} maxLength={180} lang={locale}
          className="mt-2 w-full rounded-xl border border-sky-200 bg-white p-3 font-normal text-slate-900" placeholder="言ってみたい言葉を入力" />
      </label>
      <button type="button" onClick={() => assess(typed)} disabled={!typed.trim()}
        className="mt-2 rounded-xl border border-sky-300 bg-white px-4 py-2 font-bold text-sky-900 disabled:opacity-50">文字で確認する</button>
      <p className="mt-3 text-xs text-slate-600">これは任意の練習です。ミッションの得点は従来の解答で判定します。</p>
    </section>
  );
}
