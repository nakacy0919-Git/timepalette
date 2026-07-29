import { Timer, Hourglass, Map, ArrowLeftRight, Clock, MapPin } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  // ▼ ナビゲーションの設定（PaceMarkにurlを追加）
  const navItems = [
    { id: 'timer', label: 'タイマー', icon: <Timer size={18} /> },
    { id: 'stopwatch', label: 'ストップウォッチ', icon: <Hourglass size={18} /> },
    { 
      id: 'pacemark', 
      label: 'PaceMark', 
      icon: <MapPin size={18} />, 
      url: 'https://pacemark.pic-speak-story.com/' // ← ここにリンク先を指定
    },
    { id: 'mapClock', label: '地図時計', icon: <Map size={18} /> },
    { id: 'timeDiff', label: '時差比較', icon: <ArrowLeftRight size={18} /> },
    { id: 'myClock', label: 'マイ時計', icon: <Clock size={18} /> },
  ];

  return (
    <div className="w-full bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-6 py-3">
      {/* ロゴ部分 */}
      <div className="text-2xl font-black text-slate-800 tracking-wider">
        Time <span className="text-blue-500">Palette</span>
      </div>

      {/* ナビゲーションボタン群 */}
      <div className="flex items-center gap-2">
        {navItems.map((item) => {
          // ▼ URLが設定されている場合（PaceMark）は、別タブで開くリンクにする
          if (item.url) {
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank" // 新しいタブで開く
                rel="noopener noreferrer" // セキュリティ対策
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                {item.icon}
                {item.label}
              </a>
            );
          }

          // ▼ それ以外は通常のタブ切り替えボタン
          return (
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
          );
        })}
      </div>
    </div>
  );
}