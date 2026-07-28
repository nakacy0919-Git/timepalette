import { Timer, Hourglass, Map, ArrowLeftRight, Clock, MapPin } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'timer', label: 'タイマー', icon: <Timer size={18} /> },
    { id: 'stopwatch', label: 'ストップウォッチ', icon: <Hourglass size={18} /> },
    { id: 'pacemark', label: 'PaceMark', icon: <MapPin size={18} /> },
    { id: 'mapClock', label: '地図時計', icon: <Map size={18} /> },
    { id: 'timeDiff', label: '時差比較', icon: <ArrowLeftRight size={18} /> },
    { id: 'myClock', label: 'マイ時計', icon: <Clock size={18} /> }, // 旧：複数定刻
  ];

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 py-3">
      {/* ロゴ部分 */}
      <div className="text-2xl font-black text-slate-800 tracking-wider">
        Time <span className="text-blue-500">Palette</span>
      </div>

      {/* ナビゲーションボタン群 */}
      <div className="flex items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              activeTab === item.id
                ? 'bg-blue-100 text-blue-600 shadow-inner'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}