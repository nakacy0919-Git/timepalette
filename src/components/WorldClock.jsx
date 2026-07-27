import { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { MapPin, Clock, ArrowRightLeft } from 'lucide-react';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// 日本に住む外国人に配慮した19か国語＋αの言語リスト
const languages = [
  { code: 'ja', name: '日本語' }, { code: 'en', name: 'English' },
  { code: 'zh-CN', name: '简体中文' }, { code: 'zh-TW', name: '繁體中文' },
  { code: 'ko', name: '한국어' }, { code: 'pt', name: 'Português' },
  { code: 'es', name: 'Español' }, { code: 'tl', name: 'Tagalog' },
  { code: 'vi', name: 'Tiếng Việt' }, { code: 'id', name: 'Bahasa Indonesia' },
  { code: 'th', name: 'ไทย' }, { code: 'ne', name: 'नेपाली' },
  { code: 'my', name: 'မြန်မာ' }, { code: 'km', name: 'ខ្មែរ' },
  { code: 'ru', name: 'Русский' }, { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' }, { code: 'it', name: 'Italiano' },
  { code: 'ar', name: 'العربية' }, { code: 'hi', name: 'हिन्दी' }
];

// 国の英語名からISOコードとタイムゾーンを紐づける辞書（一部抜粋。全197か国へ拡張可能）
const countryData = {
  "Japan": { iso: "JP", tz: "Asia/Tokyo" },
  "United States of America": { iso: "US", tz: "America/New_York" },
  "China": { iso: "CN", tz: "Asia/Shanghai" },
  "Philippines": { iso: "PH", tz: "Asia/Manila" },
  "Brazil": { iso: "BR", tz: "America/Sao_Paulo" },
  "Vietnam": { iso: "VN", tz: "Asia/Ho_Chi_Minh" },
  "Indonesia": { iso: "ID", tz: "Asia/Jakarta" },
  "United Kingdom": { iso: "GB", tz: "Europe/London" },
  "Australia": { iso: "AU", tz: "Australia/Sydney" },
  "South Korea": { iso: "KR", tz: "Asia/Seoul" }
};

export default function WorldClock() {
  const [lang, setLang] = useState('ja'); // 選択中の言語
  const [countryA, setCountryA] = useState({ engName: "Japan", ...countryData["Japan"] });
  const [countryB, setCountryB] = useState({ engName: "United States of America", ...countryData["United States of America"] });
  const [nextUpdate, setNextUpdate] = useState('B'); // 次にクリックした時に更新する枠 (A or B)
  
  const [timeA, setTimeA] = useState("");
  const [timeB, setTimeB] = useState("");
  const [dateA, setDateA] = useState("");
  const [dateB, setDateB] = useState("");
  const [diffText, setDiffText] = useState("");

  // ブラウザのIntl機能を使って、ISOコードから各言語の国名を自動生成
  const getTranslatedName = (iso, engName) => {
    if (!iso) return engName;
    try {
      return new Intl.DisplayNames([lang], { type: 'region' }).of(iso);
    } catch (e) {
      return engName;
    }
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      
      const formatTime = (tz) => tz ? new Intl.DateTimeFormat('ja-JP', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now) : "--:--:--";
      const formatDate = (tz) => tz ? new Intl.DateTimeFormat(lang, { timeZone: tz, month: 'short', day: 'numeric', weekday: 'short' }).format(now) : "---";

      setTimeA(formatTime(countryA.tz));
      setDateA(formatDate(countryA.tz));
      
      setTimeB(formatTime(countryB.tz));
      setDateB(formatDate(countryB.tz));

      // 2国間の時差計算
      if (countryA.tz && countryB.tz) {
        const tA = new Date(now.toLocaleString('en-US', { timeZone: countryA.tz }));
        const tB = new Date(now.toLocaleString('en-US', { timeZone: countryB.tz }));
        const diffHours = Math.round((tB - tA) / (1000 * 60 * 60));
        
        if (diffHours === 0) setDiffText("時差なし");
        else if (diffHours > 0) setDiffText(`右が +${diffHours}時間 進んでいます`);
        else setDiffText(`右が ${Math.abs(diffHours)}時間 遅れています`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [countryA, countryB, lang]);

  const handleCountryClick = (geo) => {
    const engName = geo.properties.name;
    const data = countryData[engName] || { iso: "", tz: "" }; // 辞書にない場合は空
    
    if (nextUpdate === 'A') {
      setCountryA({ engName, ...data });
      setNextUpdate('B');
    } else {
      setCountryB({ engName, ...data });
      setNextUpdate('A');
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-[700px]">
      {/* ツールバー（言語切り替え） */}
      <div className="flex justify-between items-center mb-4 px-2">
        <p className="text-gray-500 font-medium">※地図をクリックすると、左右のパネルが交互に書き換わり時差を比較できます。</p>
        <select 
          value={lang} 
          onChange={(e) => setLang(e.target.value)}
          className="p-2 rounded-lg border border-gray-300 bg-white shadow-sm focus:ring-blue-500 text-sm font-bold text-gray-700"
        >
          {languages.map(l => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>

      {/* 3カラムレイアウト（左パネル・中央地図・右パネル） */}
      <div className="flex w-full gap-6 flex-1">
        
        {/* 左パネル (国A) */}
        <div className={`w-1/4 bg-white border-2 rounded-2xl shadow-sm p-6 text-center flex flex-col justify-center relative transition-all ${nextUpdate === 'A' ? 'border-blue-400 shadow-blue-100 ring-4 ring-blue-50' : 'border-gray-200 opacity-80'}`}>
          <div className="absolute top-4 left-4 text-xs font-bold text-gray-400">PANEL A</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{getTranslatedName(countryA.iso, countryA.engName)}</h2>
          <div className="text-gray-500 font-medium mb-4">{dateA}</div>
          <div className="text-5xl font-black text-gray-800 tracking-wider font-mono tabular-nums">{timeA || "N/A"}</div>
        </div>

        {/* 中央パネル (地図と時差情報) */}
        <div className="w-2/4 flex flex-col relative">
          {/* 時差インジケーター */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur border border-blue-200 px-6 py-2 rounded-full shadow-md flex items-center gap-3">
            <ArrowRightLeft className="text-blue-500" size={20} />
            <span className="font-bold text-blue-700">{diffText}</span>
          </div>

          <div className="flex-1 bg-[#f0f9ff] rounded-2xl border-2 border-blue-100 overflow-hidden shadow-inner">
            <ComposableMap projectionConfig={{ scale: 160 }} width={800} height={500} style={{ width: "100%", height: "100%" }}>
              <ZoomableGroup zoom={1} minZoom={1} maxZoom={8}>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const engName = geo.properties.name;
                      const isA = countryA.engName === engName;
                      const isB = countryB.engName === engName;
                      
                      let fillColor = "#cbd5e1";
                      if (isA) fillColor = "#3b82f6"; // 青
                      if (isB) fillColor = "#f59e0b"; // オレンジ
                      if (isA && isB) fillColor = "#10b981"; // 同一選択時は緑

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => handleCountryClick(geo)}
                          fill={fillColor}
                          stroke="#ffffff"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: "#94a3b8", outline: "none", cursor: "pointer" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>
        </div>

        {/* 右パネル (国B) */}
        <div className={`w-1/4 bg-white border-2 rounded-2xl shadow-sm p-6 text-center flex flex-col justify-center relative transition-all ${nextUpdate === 'B' ? 'border-orange-400 shadow-orange-100 ring-4 ring-orange-50' : 'border-gray-200 opacity-80'}`}>
          <div className="absolute top-4 right-4 text-xs font-bold text-gray-400">PANEL B</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">{getTranslatedName(countryB.iso, countryB.engName)}</h2>
          <div className="text-gray-500 font-medium mb-4">{dateB}</div>
          <div className="text-5xl font-black text-gray-800 tracking-wider font-mono tabular-nums">{timeB || "N/A"}</div>
        </div>

      </div>
    </div>
  );
}