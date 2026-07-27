import { useState } from 'react';
import { Calculator, ArrowRight, Plus, Trash2 } from 'lucide-react';

// よく使うタイムゾーンのリスト
const tzOptions = [
  { label: "日本 (JST)", tz: "Asia/Tokyo" },
  { label: "米国・NY (EST)", tz: "America/New_York" },
  { label: "米国・LA (PST)", tz: "America/Los_Angeles" },
  { label: "イギリス (GMT/BST)", tz: "Europe/London" },
  { label: "豪州・シドニー (AEST)", tz: "Australia/Sydney" },
  { label: "フィリピン (PHT)", tz: "Asia/Manila" },
  { label: "中国・北京 (CST)", tz: "Asia/Shanghai" },
];

export default function TimeConverter() {
  const [baseTime, setBaseTime] = useState("21:00"); // 基準となる時間（デフォルト21:00）
  const [baseTz, setBaseTz] = useState("Asia/Tokyo"); // 基準のタイムゾーン
  const [targetTzs, setTargetTzs] = useState(["America/New_York", "Europe/London", "Australia/Sydney"]);

  // 指定した時間・タイムゾーンを、別のタイムゾーンの時間に変換する関数
  const calculateConvertedTime = (timeStr, fromTz, toTz) => {
    try {
      // 今日の日付に、入力された時間（HH:mm）をくっつける
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      // 一旦UTCに変換してから、目的のタイムゾーンに再フォーマットする疑似的な計算
      const formatter = new Intl.DateTimeFormat('ja-JP', {
        timeZone: toTz,
        hour: '2-digit', minute: '2-digit',
        hour12: false
      });
      
      // 時差を抽出して計算
      const fromOffset = new Date(date.toLocaleString('en-US', {timeZone: fromTz})).getTime();
      const toOffset = new Date(date.toLocaleString('en-US', {timeZone: toTz})).getTime();
      const diff = toOffset - fromOffset;
      
      const convertedDate = new Date(date.getTime() + diff);
      return formatter.format(convertedDate);
    } catch (e) {
      return "--:--";
    }
  };

  const addTz = () => {
    if (targetTzs.length < 6) setTargetTzs([...targetTzs, "Asia/Manila"]);
  };

  const removeTz = (index) => {
    setTargetTzs(targetTzs.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-4">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-gray-700 mb-2 flex items-center justify-center gap-2">
          <Calculator className="text-blue-500" />
          グローバル会議プランナー（時差シミュレーター）
        </h2>
        <p className="text-gray-500">基準となる時間を設定すると、指定したすべての国の時間が同時に計算されます。</p>
      </div>

      {/* 基準時間の入力エリア */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center justify-center gap-6 shadow-sm">
        <div className="flex flex-col">
          <label className="text-sm font-bold text-blue-700 mb-1">基準タイムゾーン</label>
          <select 
            value={baseTz} 
            onChange={(e) => setBaseTz(e.target.value)}
            className="p-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 text-lg font-medium"
          >
            {tzOptions.map(opt => <option key={opt.tz} value={opt.tz}>{opt.label}</option>)}
          </select>
        </div>
        
        <div className="text-blue-300 hidden md:block">
          <ArrowRight size={32} />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-bold text-blue-700 mb-1">設定時間</label>
          <input 
            type="time" 
            value={baseTime}
            onChange={(e) => setBaseTime(e.target.value)}
            className="p-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 text-2xl font-black text-gray-800"
          />
        </div>
      </div>

      {/* 比較する国のリスト */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {targetTzs.map((tz, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative group">
            <button 
              onClick={() => removeTz(index)}
              className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={18} />
            </button>
            
            <select 
              value={tz}
              onChange={(e) => {
                const newTzs = [...targetTzs];
                newTzs[index] = e.target.value;
                setTargetTzs(newTzs);
              }}
              className="w-full mb-3 text-sm border-b border-gray-200 bg-transparent focus:outline-none focus:border-blue-500 pb-1 text-gray-600 font-medium"
            >
              {tzOptions.map(opt => <option key={opt.tz} value={opt.tz}>{opt.label}</option>)}
            </select>
            
            <div className="text-4xl font-black text-gray-800 tabular-nums">
              {calculateConvertedTime(baseTime, baseTz, tz)}
            </div>
          </div>
        ))}

        {/* 追加ボタン */}
        {targetTzs.length < 6 && (
          <button 
            onClick={addTz}
            className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50/50 transition-all h-full min-h-[120px]"
          >
            <Plus size={32} className="mb-2" />
            <span className="font-bold">国を追加</span>
          </button>
        )}
      </div>
    </div>
  );
}