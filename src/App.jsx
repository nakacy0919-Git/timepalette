import { useState } from 'react';
import { Map, GitCompare, Calculator, BookOpen, Clock } from 'lucide-react';
import MapClock from './components/MapClock';
import CompareClock from './components/CompareClock';
import MultiConverter from './components/MultiConverter'; // コメントアウトを外す
import CountryInfo from './components/CountryInfo'; // コメントアウトを外す
// import MultiConverter from './components/MultiConverter'; // 次のステップで作成
// import CountryInfo from './components/CountryInfo'; // 次のステップで作成

function App() {
  const [activeTab, setActiveTab] = useState('map'); // 'map', 'compare', 'multi', 'info'
  const [isAmPm, setIsAmPm] = useState(false); // AM/PM表示の切り替えフラグ

  return (
    <div className="min-h-screen flex flex-col items-center py-6 bg-slate-50 bg-[radial-gradient(#cbd5e1_2px,transparent_2px)] bg-[size:24px_24px]">
      
      {/* ヘッダーエリア */}
      <div className="w-full max-w-[98%] px-4 mb-4 flex flex-col md:flex-row justify-between items-end gap-4">
        <h1 className="text-4xl font-bold text-gray-800 tracking-wider drop-shadow-sm flex items-center gap-2">
          Time<span className="text-blue-600">Palette</span>
        </h1>
        
        <div className="flex flex-wrap gap-2 bg-white/90 backdrop-blur-md p-1.5 rounded-xl border border-white/60 shadow-sm">
          {/* AM/PM 切り替えトグル */}
          <button
            onClick={() => setIsAmPm(!isAmPm)}
            className="flex items-center gap-2 px-4 py-2 mr-2 rounded-lg font-bold transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
          >
            <Clock size={18} />
            {isAmPm ? "12時間制 (AM/PM)" : "24時間制"}
          </button>
          
          {/* タブメニュー */}
          <button onClick={() => setActiveTab('map')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'map' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-white/50'}`}>
            <Map size={18} /> ①地図時計
          </button>
          <button onClick={() => setActiveTab('compare')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'compare' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-white/50'}`}>
            <GitCompare size={18} /> ②時差比較
          </button>
          <button onClick={() => setActiveTab('multi')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'multi' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-white/50'}`}>
            <Calculator size={18} /> ③複数定刻
          </button>
          <button onClick={() => setActiveTab('info')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'info' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:bg-white/50'}`}>
            <BookOpen size={18} /> ④国別情報
          </button>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      {/* メインコンテンツエリア */}
      <main className="w-full max-w-[98%] flex-1 bg-white/90 backdrop-blur-lg border border-white/60 rounded-3xl shadow-xl p-6 flex flex-col">
        {activeTab === 'map' && <MapClock isAmPm={isAmPm} />}
        {activeTab === 'compare' && <CompareClock isAmPm={isAmPm} />}
        {activeTab === 'multi' && <MultiConverter isAmPm={isAmPm} />} {/* ← 追加 */}
        {activeTab === 'info' && <CountryInfo isAmPm={isAmPm} />} {/* ← 追加 */}
      </main>
    </div>
  );
}

export default App;