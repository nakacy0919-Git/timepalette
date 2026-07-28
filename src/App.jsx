import { useState } from 'react';
import Header from './components/Header';
import Timer from './components/Timer';
import MapClock from './components/MapClock';
import Stopwatch from './components/Stopwatch';

// まだ完成していないタブ用の「仮画面（プレースホルダー）」コンポーネント
const Placeholder = ({ title }) => (
  <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 shadow-sm mt-6">
    <div className="text-6xl mb-4">🚧</div>
    <h2 className="text-3xl font-black text-slate-400 mb-2">{title}</h2>
    <p className="text-slate-500 font-medium">現在開発中です！今後のアップデートをお待ちください。</p>
  </div>
);

export default function App() {
  // 初期画面を「タイマー」に設定
  const [activeTab, setActiveTab] = useState('timer');

  // タブの状態に応じて表示する中身を切り替える関数
  const renderContent = () => {
    switch (activeTab) {
      case 'timer':
        return <Timer />;
      case 'stopwatch':
        return <Stopwatch />;
      case 'pacemark':
        return <Placeholder title="PaceMark" />;
      case 'mapClock':
        // 現在、MapClockの中に「地図」「マイ時計(複数定刻)」「リスト」が全て入っています
        return <MapClock isAmPm={false} />; 
      case 'timeDiff':
        return <Placeholder title="時差比較" />;
      case 'myClock':
        return <Placeholder title="マイ時計（複数定刻）単独ページ" />;
      default:
        return <Timer />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* 画面上部のナビゲーションヘッダー */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* 画面の中身（タブに応じて切り替わる部分） */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6 h-[calc(100vh-80px)]">
        {renderContent()}
      </main>
    </div>
  );
}