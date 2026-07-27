import { useState, useEffect } from 'react';
import { Calculator, ArrowRight, Plus, Trash2, Clock } from 'lucide-react';

const tzOptions = [
  { label: "日本 (JST)", tz: "Asia/Tokyo" },
  { label: "アメリカ・NY (EST)", tz: "America/New_York" },
  { label: "アメリカ・LA (PST)", tz: "America/Los_Angeles" },
  { label: "イギリス (GMT/BST)", tz: "Europe/London" },
  { label: "オーストラリア (AEST)", tz: "Australia/Sydney" },
  { label: "フィリピン (PHT)", tz: "Asia/Manila" },
  { label: "中国 (CST)", tz: "Asia/Shanghai" },
  { label: "ブラジル (BRT)", tz: "America/Sao_Paulo" },
];

export default function MultiConverter({ isAmPm }) {
  const [baseTime, setBaseTime] = useState("21:00");
  const [baseTz, setBaseTz] = useState("Asia/Tokyo");
  const [targetTzs, setTargetTzs] = useState(["America/New_York", "Europe/London", "Australia/Sydney", "Asia/Manila"]);

  // 指定時間を各タイムゾーンに変換
  const calculateConvertedTime = (timeStr, fromTz, toTz) => {
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

      const formatter = new Intl.DateTimeFormat('ja-JP', {
        timeZone: toTz,
        hour: '2-digit', minute: '2-digit',
        hour12: isAmPm // 全体設定に連動
      });
      
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
    if (targetTzs.length < 11) setTargetTzs([...targetTzs, "Asia/Shanghai"]);
  };

  const removeTz = (index) => {
    setTargetTzs(targetTzs.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full h-full flex flex-col max-w-5xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-700 mb-2 flex items-center justify-center gap-2">
          <Calculator className="text-blue-500" />
          グローバル会議・イベントプランナー
        </h2>
        <p className="text-gray-500">基準時間を設定すると、リストにあるすべての国の時間が一斉に計算されます。</p>
      </div>

      {/* 基準設定エリア */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-center justify-center gap-6 shadow-sm">
        <div className="flex flex-col">
          <label className="text-sm font-bold text-blue-700 mb-1">基準の国・地域</label>
          <select 
            value={baseTz} 
            onChange={(e) => setBaseTz(e.target.value)}
            className="p-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 text-lg font-medium bg-white"
          >
            {tzOptions.map(opt => <option key={opt.tz} value={opt.tz}>{opt.label}</option>)}
          </select>
        </div>
        
        <ArrowRight size={32} className="text-blue-300 hidden md:block" />

        <div className="flex flex-col">
          <label className="text-sm font-bold text-blue-700 mb-1">予定時刻</label>
          <input 
            type="time" 
            value={baseTime}
            onChange={(e) => setBaseTime(e.target.value)}
            className="p-3 rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 text-2xl font-black text-gray-800 bg-white"
          />
        </div>
      </div>

      {/* 変換先リスト（グリッド表示） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-4">
        {targetTzs.map((tz, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm relative group hover:border-blue-300 transition-colors">
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
              className="w-full mb-3 text-sm border-b border-gray-100 bg-transparent focus:outline-none focus:border-blue-500 pb-1 text-gray-600 font-medium"
            >
              {tzOptions.map(opt => <option key={opt.tz} value={opt.tz}>{opt.label}</option>)}
            </select>
            
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-gray-400" />
              <div className="text-3xl font-black text-gray-800 tabular-nums">
                {calculateConvertedTime(baseTime, baseTz, tz)}
              </div>
            </div>
          </div>
        ))}

        {targetTzs.length < 11 && (
          <button 
            onClick={addTz}
            className="border-2 border-dashed border-gray-300 rounded-xl p-5 flex flex-col items-center justify-center text-gray-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50/50 transition-all min-h-[120px]"
          >
            <Plus size={32} className="mb-2" />
            <span className="font-bold text-sm">地域を追加</span>
          </button>
        )}
      </div>
    </div>
  );
}