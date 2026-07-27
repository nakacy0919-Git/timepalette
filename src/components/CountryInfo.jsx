import { useState, useEffect } from 'react';
import { Search, MapPin, Globe, Coins, MessageSquare, Clock } from 'lucide-react';

// ※197か国のデータへ拡張するためのベース辞書
const countries = [
  { name: "日本", tz: "Asia/Tokyo", capital: "東京", region: "アジア", currency: "日本円 (JPY)", language: "日本語" },
  { name: "アメリカ合衆国", tz: "America/New_York", capital: "ワシントンD.C.", region: "北アメリカ", currency: "USドル (USD)", language: "英語" },
  { name: "イギリス", tz: "Europe/London", capital: "ロンドン", region: "ヨーロッパ", currency: "ポンド (GBP)", language: "英語" },
  { name: "オーストラリア", tz: "Australia/Sydney", capital: "キャンベラ", region: "オセアニア", currency: "豪ドル (AUD)", language: "英語" },
  { name: "ブラジル", tz: "America/Sao_Paulo", capital: "ブラジリア", region: "南アメリカ", currency: "レアル (BRL)", language: "ポルトガル語" },
  { name: "フィリピン", tz: "Asia/Manila", capital: "マニラ", region: "アジア", currency: "ペソ (PHP)", language: "フィリピノ語、英語" },
  { name: "中国", tz: "Asia/Shanghai", capital: "北京", region: "アジア", currency: "人民元 (CNY)", language: "中国語" },
  // ... ここにデータを追加していくことで197か国に対応可能です
];

export default function CountryInfo({ isAmPm }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  const filteredCountries = countries.filter(c => 
    c.name.includes(searchTerm) || c.region.includes(searchTerm)
  );

  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const timeFormatter = new Intl.DateTimeFormat('ja-JP', {
          timeZone: selectedCountry.tz,
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: isAmPm
        });
        const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
          timeZone: selectedCountry.tz, year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
        });
        setCurrentTime(timeFormatter.format(now));
        setCurrentDate(dateFormatter.format(now));
      } catch (e) {
        setCurrentTime("--:--:--");
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [selectedCountry, isAmPm]);

  return (
    <div className="flex flex-col md:flex-row w-full h-full gap-6">
      
      {/* 左側：検索＆リストエリア */}
      <div className="w-full md:w-1/3 flex flex-col bg-slate-50 border border-slate-200 rounded-2xl p-4 h-[600px]">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="国名や地域で検索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {filteredCountries.map((country, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedCountry(country)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${
                selectedCountry.name === country.name 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-white text-gray-700 hover:bg-blue-50 border border-gray-100'
              }`}
            >
              {country.name}
            </button>
          ))}
          {filteredCountries.length === 0 && (
            <div className="text-center text-gray-400 py-10 text-sm">見つかりませんでした</div>
          )}
        </div>
      </div>

      {/* 右側：詳細情報＆時計エリア */}
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        
        {/* 時計パネル */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
          <h2 className="text-4xl font-bold text-gray-800 mb-2">{selectedCountry.name}</h2>
          <div className="text-gray-500 font-medium mb-6">{currentDate}</div>
          <div className="flex items-center gap-4">
            <Clock size={36} className="text-blue-400" />
            <div className="text-7xl font-black text-gray-800 font-mono tabular-nums tracking-wide">
              {currentTime}
            </div>
          </div>
        </div>

        {/* 基本情報パネル */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
            <MapPin className="text-rose-500 mt-1" size={24} />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">首都</p>
              <p className="text-lg font-bold text-gray-800">{selectedCountry.capital}</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
            <Globe className="text-blue-500 mt-1" size={24} />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">地域</p>
              <p className="text-lg font-bold text-gray-800">{selectedCountry.region}</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
            <MessageSquare className="text-emerald-500 mt-1" size={24} />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">公用語・言語</p>
              <p className="text-lg font-bold text-gray-800">{selectedCountry.language}</p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
            <Coins className="text-amber-500 mt-1" size={24} />
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">通貨</p>
              <p className="text-lg font-bold text-gray-800">{selectedCountry.currency}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}