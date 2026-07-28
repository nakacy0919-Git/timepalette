import { useState, useEffect, useRef } from 'react';
import { Maximize, Minimize, ZoomIn, ZoomOut, Palette, Play, Pause, Square, Settings } from 'lucide-react';

export default function Timer() {
  const [time, setTime] = useState(180); // 現在の残り時間（秒）
  const [initialTime, setInitialTime] = useState(180); // 設定された初期時間（デフォルト3分）
  const [isRunning, setIsRunning] = useState(false);
  const [isColor, setIsColor] = useState(true); // カラー/モノクロ切替
  const [scale, setScale] = useState(1); // テキストサイズスケール
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [inputMin, setInputMin] = useState(3);
  const [inputSec, setInputSec] = useState(0);

  const containerRef = useRef(null);

  // タイマーのカウントダウン処理
  useEffect(() => {
    let interval;
    if (isRunning && time > 0) {
      interval = setInterval(() => setTime((prev) => prev - 1), 1000);
    } else if (time === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, time]);

  // フルスクリーン切り替え処理
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // 外部からのフルスクリーン解除を検知
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleStartPause = () => setIsRunning(!isRunning);
  
  const handleReset = () => {
    setIsRunning(false);
    setTime(initialTime);
  };

  const handleSetTime = () => {
    const totalSecs = (parseInt(inputMin) || 0) * 60 + (parseInt(inputSec) || 0);
    if (totalSecs > 0) {
      setInitialTime(totalSecs);
      setTime(totalSecs);
      setIsEditing(false);
      setIsRunning(false);
    }
  };

  // 時間フォーマット (MM:SS)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 視覚的なバーの計算 (20セグメント)
  const totalSegments = 20;
  const activeSegments = Math.ceil((time / initialTime) * totalSegments);

  // カラーグラデーションの取得（赤〜黄〜緑）
  const getSegmentColor = (index) => {
    if (!isColor) return 'bg-slate-700'; // モノクロ時
    if (index < 5) return 'bg-red-500';
    if (index < 10) return 'bg-orange-500';
    if (index < 15) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col items-center justify-center transition-colors duration-300 ${
        isFullscreen ? 'bg-white w-full h-screen fixed top-0 left-0 z-50' : 'w-full h-full p-8 bg-slate-50 rounded-3xl border border-gray-200'
      }`}
    >
      {/* 右上のコントロールパネル */}
      <div className="absolute top-6 right-6 flex gap-2 text-gray-500">
        <button onClick={() => setIsColor(!isColor)} className="p-2 hover:bg-gray-200 rounded-full transition-colors" title="カラー/モノクロ切替">
          <Palette size={24} className={isColor ? "text-blue-500" : ""} />
        </button>
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2 hover:bg-gray-200 rounded-full transition-colors" title="縮小">
          <ZoomOut size={24} />
        </button>
        <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-2 hover:bg-gray-200 rounded-full transition-colors" title="拡大">
          <ZoomIn size={24} />
        </button>
        <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-200 rounded-full transition-colors" title="フルスクリーン">
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </div>

      {/* メインタイマーエリア */}
      <div className="flex flex-col items-center gap-10" style={{ transform: `scale(${scale})`, transition: 'transform 0.2s' }}>
        
        {/* ビジュアルバー (VBT20風) */}
        <div className="flex gap-1 bg-slate-900 p-3 rounded-xl shadow-inner border-[3px] border-slate-700">
          {[...Array(totalSegments)].map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-16 rounded-sm transition-all duration-300 ${
                i < activeSegments ? getSegmentColor(i) : 'bg-slate-800 opacity-30'
              }`}
            ></div>
          ))}
        </div>

        {/* デジタル時計表示 (Share Tech Monoフォント使用) */}
        <div 
          className="text-9xl font-black text-slate-800 tracking-widest drop-shadow-sm"
          style={{ fontFamily: "'Share Tech Mono', monospace" }}
        >
          {formatTime(time)}
        </div>
      </div>

      {/* 操作ボタン ＆ 設定パネル */}
      <div className="mt-16 flex flex-col items-center gap-6">
        {isEditing ? (
          <div className="flex items-center gap-2 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <input 
              type="number" min="0" value={inputMin} onChange={(e) => setInputMin(e.target.value)}
              className="w-20 text-center text-2xl font-bold border-b-2 border-blue-500 focus:outline-none"
            />
            <span className="text-xl font-bold">分</span>
            <input 
              type="number" min="0" max="59" value={inputSec} onChange={(e) => setInputSec(e.target.value)}
              className="w-20 text-center text-2xl font-bold border-b-2 border-blue-500 focus:outline-none"
            />
            <span className="text-xl font-bold">秒</span>
            <button onClick={handleSetTime} className="ml-4 px-6 py-2 bg-green-500 text-white font-bold rounded-full hover:bg-green-600">
              設定完了
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={handleStartPause} 
              className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg text-white shadow-md transition-transform hover:scale-105 ${isRunning ? 'bg-orange-500' : 'bg-blue-600'}`}
            >
              {isRunning ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
              {isRunning ? '一時停止' : 'スタート'}
            </button>
            <button 
              onClick={handleReset} 
              className="flex items-center gap-2 px-6 py-4 rounded-full font-bold text-lg bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-sm"
            >
              <Square fill="currentColor" size={16} /> リセット
            </button>
            <button 
              onClick={() => setIsEditing(true)} 
              className="flex items-center gap-2 px-6 py-4 rounded-full font-bold text-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
            >
              <Settings size={20} /> タイマー設定
            </button>
          </div>
        )}
      </div>
    </div>
  );
}