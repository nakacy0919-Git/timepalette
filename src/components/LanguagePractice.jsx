import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mic, Volume2, Info, Languages, Play, Square, RefreshCw, Award, XCircle } from 'lucide-react';

// --- 発音精度の計算ロジック（レーベンシュタイン距離） ---
const calculateAccuracy = (target, transcript) => {
  const cleanStr = (str) => str.replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
  const s1 = cleanStr(target);
  const s2 = cleanStr(transcript);

  if (s1.length === 0) return 100;
  if (s2.length === 0) return 0;

  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, 
        matrix[j - 1][i] + 1, 
        matrix[j - 1][i - 1] + indicator 
      );
    }
  }
  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  const accuracy = ((maxLength - distance) / maxLength) * 100;
  return Math.max(0, Math.round(accuracy));
};

export default function LanguagePractice({ countryCode = "au", languageData }) {
  const [activeLangKey, setActiveLangKey] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [activeChallenge, setActiveChallenge] = useState(null);
  
  const [recordingState, setRecordingState] = useState('idle');
  const [transcript, setTranscript] = useState("");
  const [accuracy, setAccuracy] = useState(0);
  
  const recognitionRef = useRef(null);

  // --- データの初期化と安全性チェック ---
  const countryLangs = languageData?.[countryCode];
  const langKeys = countryLangs ? Object.keys(countryLangs) : [];

  useEffect(() => {
    if (langKeys.length > 0 && !activeLangKey) {
      setActiveLangKey(langKeys[0]);
    }
  }, [langKeys, activeLangKey]);

  const currentLanguage = activeLangKey ? countryLangs?.[activeLangKey] : null;

  useEffect(() => {
    if (currentLanguage?.challenges) {
      const cats = [...new Set(currentLanguage.challenges.map(c => c.category))];
      if (!cats.includes(activeCategory)) {
        setActiveCategory(cats[0]);
      }
    }
  }, [currentLanguage, activeCategory]);

  if (!countryLangs || !currentLanguage) {
    return null; // データがない場合は何も表示しない
  }

  const challenges = currentLanguage.challenges || [];
  const categories = [...new Set(challenges.map(c => c.category))];
  const activeChallenges = challenges.filter(c => c.category === activeCategory);

  // --- 音声関連の処理 ---
  const playSound = (type) => {
    const audio = new Audio();
    if (type === 'start') audio.src = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
    if (type === 'success') audio.src = 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3';
    if (type === 'fail') audio.src = 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3';
    audio.volume = 0.5;
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const handleListen = (phrase, langCode) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    utterance.lang = langCode;
    utterance.rate = 0.85; 
    window.speechSynthesis.speak(utterance);
  };

  const openChallenge = (challenge) => {
    setActiveChallenge(challenge);
    setRecordingState('idle');
    setTranscript("");
    setAccuracy(0);
  };

  const closeChallenge = () => {
    if (recordingState === 'recording' && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setActiveChallenge(null);
  };

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Chromeブラウザをご利用ください。");

    playSound('start');
    setRecordingState('recording');
    setTranscript("");
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = activeChallenge.langCode;
    recognitionRef.current.interimResults = true;
    
    recognitionRef.current.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech error", event.error);
      setRecordingState('idle');
      alert("マイクが認識できませんでした。設定を確認してください。");
    };

    recognitionRef.current.start();
  };

  const stopRecording = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setRecordingState('processing');
    
    setTimeout(() => {
      const resultAccuracy = calculateAccuracy(activeChallenge.phrase, transcript);
      setAccuracy(resultAccuracy);
      setRecordingState('result');
      resultAccuracy >= 80 ? playSound('success') : playSound('fail');
    }, 1000);
  };

  // --- 円グラフコンポーネント ---
  const CircularProgress = ({ value }) => {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (value / 100) * circumference;
    const color = value >= 80 ? 'text-green-500' : value >= 50 ? 'text-orange-500' : 'text-red-500';

    return (
      <div className="relative flex items-center justify-center w-40 h-40">
        <svg className="transform -rotate-90 w-40 h-40">
          <circle cx="80" cy="80" r={radius} className="stroke-current text-slate-200" strokeWidth="12" fill="transparent" />
          <circle 
            cx="80" cy="80" r={radius} 
            className={`stroke-current ${color} transition-all duration-1000 ease-out`} 
            strokeWidth="12" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" 
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center animate-in zoom-in duration-500 delay-300">
          <span className={`text-4xl font-black ${color}`}>{value}%</span>
          <span className="text-xs font-bold text-slate-400">Accuracy</span>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mt-8">
      
      {/* --- 上部：言語とカテゴリの切り替え --- */}
      <div className="bg-slate-50 p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Languages className="text-blue-500" />
            言語・音読トレーニング
          </h2>
          
          {/* ここで公用語の数を明示し、言語タブを表示 */}
          {langKeys.length > 0 && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-sm font-bold text-slate-500 pl-3 pr-1">
                公用語 ({langKeys.length}つ):
              </span>
              <div className="flex gap-1">
                {langKeys.map(key => (
                  <button
                    key={key}
                    onClick={() => setActiveLangKey(key)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      activeLangKey === key 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {countryLangs[key].languageName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* カテゴリタブ */}
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                activeCategory === cat ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* --- 下部：フレーズカード一覧（グリッド表示） --- */}
      <div className="p-6 bg-slate-100/50 max-h-[500px] overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeChallenges.map((challenge) => {
            const isPartner = challenge.speaker === "partner";
            const isRtl = challenge.langCode.includes('ps') || challenge.langCode.includes('prs');
            
            return (
              <div 
                key={challenge.id} 
                onClick={() => openChallenge(challenge)}
                className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${
                      isPartner ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                    }`}>
                      {isPartner ? '👂 相手のフレーズ' : '🗣️ 自分のフレーズ'}
                    </span>
                    <div className="bg-slate-100 p-2 rounded-full text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                      <Mic size={16} />
                    </div>
                  </div>
                  <p className="font-bold text-slate-600 text-sm mb-2">{challenge.meaning}</p>
                  <p className="text-xl font-black text-slate-800 mb-2 leading-snug" dir={isRtl ? 'rtl' : 'ltr'}>{challenge.phrase}</p>
                </div>
                <p className="text-xs font-bold text-blue-500/80 bg-blue-50 px-2 py-1 rounded w-fit mt-2">{challenge.yomi}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- 🚀 音読ミッション画面（モーダル） --- */}
      {activeChallenge && createPortal(
        <div className="fixed inset-0 z-[99999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
            
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2 font-bold">
                <Mic className="text-blue-400" /> スピーキング・ミッション
              </div>
              <button onClick={closeChallenge} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <XCircle size={24} />
              </button>
            </div>

            <div className="p-8 text-center border-b border-gray-100">
              <p className="text-sm font-bold text-blue-500 mb-2">TARGET PHRASE</p>
              <h3 className="text-3xl md:text-4xl font-black text-slate-800 mb-3" dir={activeChallenge.langCode.includes('ps') || activeChallenge.langCode.includes('prs') ? 'rtl' : 'ltr'}>
                {activeChallenge.phrase}
              </h3>
              <p className="text-lg font-bold text-slate-400 mb-1">{activeChallenge.yomi}</p>
              <p className="text-base font-medium text-slate-600">{activeChallenge.meaning}</p>
              
              <button 
                onClick={() => handleListen(activeChallenge.phrase, activeChallenge.langCode)}
                className="mt-5 inline-flex items-center gap-2 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-sm transition-colors"
              >
                <Volume2 size={18} /> お手本を再生する
              </button>
            </div>

            <div className="p-8 bg-slate-50 flex flex-col items-center justify-center min-h-[250px]">
              
              {recordingState === 'idle' && (
                <div className="flex flex-col items-center animate-in fade-in">
                  <p className="text-slate-500 font-bold mb-6">準備ができたら開始ボタンを押してください</p>
                  <button onClick={startRecording} className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95">
                    <Play size={24} fill="currentColor" /> 録音スタート
                  </button>
                </div>
              )}

              {recordingState === 'recording' && (
                <div className="flex flex-col items-center w-full animate-in fade-in">
                  <div className="flex items-center gap-2 text-red-500 font-bold animate-pulse mb-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    録音中... はっきりと発音してください
                  </div>
                  <div className="w-full max-w-md bg-white p-4 rounded-xl border-2 border-blue-200 min-h-[60px] text-center text-lg font-bold text-slate-700 mb-6 shadow-inner" dir={activeChallenge.langCode.includes('ps') || activeChallenge.langCode.includes('prs') ? 'rtl' : 'ltr'}>
                    {transcript || "..."}
                  </div>
                  <button onClick={stopRecording} className="flex items-center gap-3 px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-black text-xl shadow-lg transition-all hover:scale-105 active:scale-95">
                    <Square size={24} fill="currentColor" /> 録音ストップ
                  </button>
                </div>
              )}

              {recordingState === 'processing' && (
                <div className="flex flex-col items-center animate-in fade-in">
                  <RefreshCw size={40} className="text-blue-500 animate-spin mb-4" />
                  <p className="font-bold text-slate-600 text-lg">AIが発音を分析中...</p>
                </div>
              )}

              {recordingState === 'result' && (
                <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-4 duration-500">
                  <CircularProgress value={accuracy} />
                  
                  <div className="mt-6 text-center">
                    {accuracy >= 80 ? (
                      <p className="text-2xl font-black text-green-500 flex items-center justify-center gap-2 mb-2"><Award size={28} /> Excellent!!</p>
                    ) : accuracy >= 50 ? (
                      <p className="text-2xl font-black text-orange-500 mb-2">Good try!</p>
                    ) : (
                      <p className="text-2xl font-black text-red-500 mb-2">Let's try again!</p>
                    )}
                    
                    <div className="bg-white p-4 rounded-xl border border-gray-200 mt-4 max-w-md w-full mx-auto">
                      <p className="text-xs font-bold text-slate-400 text-left">あなたの発音:</p>
                      <p className="text-lg font-bold text-slate-700" dir={activeChallenge.langCode.includes('ps') || activeChallenge.langCode.includes('prs') ? 'rtl' : 'ltr'}>
                        {transcript || "(聞き取れませんでした)"}
                      </p>
                    </div>
                  </div>

                  <button onClick={() => { setRecordingState('idle'); setTranscript(""); }} className="mt-6 px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full font-bold transition-colors">
                    もう一度挑戦する
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-amber-50 p-4 border-t border-amber-100 flex items-start gap-3 text-amber-800 text-sm font-medium">
              <Info size={20} className="shrink-0 text-amber-500" />
              <p>{activeChallenge.culturalNote}</p>
            </div>

          </div>
        </div>,
        document.body 
      )}
    </div>
  );
}