import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

export default function Timer() {
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(1); // プログレスバーの計算用
  const [isActive, setIsActive] = useState(false);

  // タイマーのカウントダウン処理
  useEffect(() => {
    let interval = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      playGentleChime(); // タイムアップ時に優しい音を鳴らす
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // プリセットボタンでタイマーをセットして開始
  const startPresetTimer = (minutes) => {
    const seconds = minutes * 60;
    setTimeLeft(seconds);
    setTotalTime(seconds);
    setIsActive(true);
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(0);
  };

  // 生徒がビクッとしない、優しいタイムアップ音（Web Audio API）
  const playGentleChime = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine'; // 丸みのある音色
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5 (ドの音)
    
    // フェードイン＆フェードアウトで優しく響かせる
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.5);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2.5);
  };

  // 時間のフォーマット (MM:SS)
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // プログレスバーの計算と色変更
  const progressPercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  let barColor = "bg-emerald-400";
  if (progressPercent <= 50 && progressPercent > 15) barColor = "bg-amber-400";
  if (progressPercent <= 15) barColor = "bg-rose-400";

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto py-4">
      
      {/* プリセットボタン */}
      <div className="flex gap-4 mb-10">
        {[1, 3, 5].map((min) => (
          <button
            key={min}
            onClick={() => startPresetTimer(min)}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:border-blue-400 hover:text-blue-600 hover:shadow-md transition-all font-bold text-lg"
          >
            {min} 分
          </button>
        ))}
      </div>

      {/* 時間表示 */}
      <div className="text-8xl font-black text-gray-800 tracking-widest mb-8 font-mono tabular-nums">
        {formatTime(timeLeft)}
      </div>

      {/* プログレスバー */}
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mb-10 shadow-inner">
        <div 
          className={`h-full ${barColor} transition-all duration-1000 ease-linear`}
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>

      {/* コントロールボタン */}
      <div className="flex gap-6">
        <button 
          onClick={toggleTimer}
          disabled={timeLeft === 0 && !isActive}
          className={`flex items-center justify-center w-16 h-16 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${
            isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
        </button>
        
        <button 
          onClick={resetTimer}
          className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 shadow-md transition-transform hover:scale-105 active:scale-95"
        >
          <RotateCcw size={28} />
        </button>
      </div>

    </div>
  );
}