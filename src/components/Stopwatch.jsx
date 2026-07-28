import { useState, useEffect, useRef } from 'react';
import { Maximize, Minimize, ZoomIn, ZoomOut, Palette, Play, Pause, Square } from 'lucide-react';

export default function Stopwatch() {
  const [elapsedTime, setElapsedTime] = useState(0); // 経過時間（ミリ秒）
  const [isRunning, setIsRunning] = useState(false);
  const [isColor, setIsColor] = useState(true);
  const [scale, setScale] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);
  const requestRef = useRef(null);
  const startTimeRef = useRef(0);

  // 高精度なカウントアップ処理
  const updateTime = () => {
    setElapsedTime(Date.now() - startTimeRef.current);
    requestRef.current = requestAnimationFrame(updateTime);
  };

  const handleStartPause = () => {
    if (isRunning) {
      cancelAnimationFrame(requestRef.current);
      setIsRunning(false);
    } else {
      startTimeRef.current = Date.now() - elapsedTime;
      requestRef.current = requestAnimationFrame(updateTime);
      setIsRunning(true);
    }
  };

  const handleReset = () => {
    cancelAnimationFrame(requestRef.current);
    setIsRunning(false);
    setElapsedTime(0);
  };

  // コンポーネントが破棄される時にアニメーションをクリア
  useEffect(() => {
    return () => cancelAnimationFrame(requestRef.current);
  }, []);

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 時間フォーマット (MM:SS.ms)
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000).toString().padStart(2, '0');
    const seconds = Math.floor((ms % 60000) / 1000).toString().padStart(2, '0');
    const milliseconds = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return `${minutes}:${seconds}.${milliseconds}`;
  };

  // ビジュアルバーの設定 (1分間で満タンになるようにループ)
  const totalSegments = 20;
  // 60,000ミリ秒(1分)の進捗率をセグメント数に変換
  const activeSegments = Math.floor(((elapsedTime % 60000) / 60000) * totalSegments);

  const getSegmentColor = (index) => {
    if (!isColor) return 'bg-white';
    if (index < 5) return 'bg-red-500';
    if (index < 10) return 'bg-orange-500';
    if (index < 15) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col items-center justify-between relative transition-colors duration-300 overflow-y-auto ${
        isFullscreen ? 'bg-white w-full h-screen fixed top-0 left-0 z-50 p-8' : 'w-full h-full min-h-[600px] p-8 bg-slate-50 rounded-3xl border border-gray-200'
      }`}
    >
      {/* コントロールパネル */}
      <div className="absolute top-6 right-8 flex gap-3 text-slate-500 opacity-60 hover:opacity-100 transition-opacity duration-300 z-20">
        <button onClick={() => setIsColor(!isColor)} className="p-2 hover:bg-slate-200 rounded-full transition-colors" title="カラー/モノクロ切替">
          <Palette size={24} className={isColor ? "text-blue-500" : ""} />
        </button>
        <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} className="p-2 hover:bg-slate-200 rounded-full transition-colors" title="縮小">
          <ZoomOut size={24} />
        </button>
        <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-2 hover:bg-slate-200 rounded-full transition-colors" title="拡大">
          <ZoomIn size={24} />
        </button>
        <button onClick={toggleFullscreen} className="p-2 hover:bg-slate-200 rounded-full transition-colors" title="フルスクリーン">
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </div>

      {/* メインディスプレイエリア */}
      <div className="flex-1 flex flex-col items-center justify-center w-full mt-12 mb-8">
        <div 
          className="flex flex-col items-center justify-center w-full transition-all duration-200"
          style={{ fontSize: `${scale}rem` }}
        >
          {/* ビジュアルバー */}
          <div 
            className="flex bg-slate-900 shadow-inner border-slate-700"
            style={{ 
              gap: '0.25em', 
              padding: '0.75em', 
              borderRadius: '0.75em', 
              borderWidth: '0.15em', 
              marginBottom: '1em' 
            }}
          >
            {[...Array(totalSegments)].map((_, i) => (
              <div 
                key={i} 
                className={`transition-all duration-200 ${
                  i <= activeSegments ? getSegmentColor(i) : 'bg-slate-800 opacity-30'
                }`}
                style={{ width: '1em', height: '4em', borderRadius: '0.1em' }}
              ></div>
            ))}
          </div>

          {/* デジタル時計 */}
          <div 
            className="leading-none text-slate-800 tracking-widest drop-shadow-sm select-none"
            style={{ 
              fontFamily: "'Digital-7 Mono', sans-serif", 
              fontSize: '11em', // ミリ秒があって横長になるため少しだけベースを縮小
              transform: 'skewX(-6deg)',
              paddingRight: '0.1em' 
            }}
          >
            {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      {/* 操作ボタン */}
      <div className="flex flex-col items-center gap-6 z-10 bg-slate-50/90 backdrop-blur-sm p-4 rounded-3xl shrink-0">
        <div className="flex gap-4">
          <button 
            onClick={handleStartPause} 
            className={`flex items-center gap-2 px-10 py-4 rounded-full font-bold text-xl text-white shadow-md transition-transform hover:scale-105 ${isRunning ? 'bg-orange-500' : 'bg-blue-600'}`}
          >
            {isRunning ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
            {isRunning ? '一時停止' : 'スタート'}
          </button>
          <button 
            onClick={handleReset} 
            className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-xl bg-gray-200 text-gray-700 hover:bg-gray-300 shadow-sm transition-transform hover:scale-105"
          >
            <Square fill="currentColor" size={20} /> リセット
          </button>
        </div>
      </div>
    </div>
  );
}