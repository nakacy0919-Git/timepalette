import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Globe, Coins, Mountain, CloudSun, HeartHandshake, Info, Languages } from 'lucide-react';
import DetailedAnalogClock from './DetailedAnalogClock';
import InteractiveQuiz from './InteractiveQuiz';

export default function CountryDetailOverlay({ iso, onClose }) {
  const [countryData, setCountryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lang, setLanguage] = useState('ja');

  // ▼ 追加：画面の一番上に強制ジャンプさせるための「目印（Ref）」
  const topRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(false);
        const firstLetter = iso.charAt(0).toLowerCase();
        const dataModule = await import(`../data/countries_${firstLetter}.json`);
        const data = dataModule.default ? dataModule.default[iso] : dataModule[iso];
        
        if (data) {
          setCountryData(data);
        } else {
          throw new Error("データが見つかりません");
        }
      } catch (err) {
        console.error("データの読み込みに失敗しました:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [iso]);

  // ▼ 追加：データ読み込み完了後、少しだけ遅らせて強制的にトップへスクロールさせる
  useEffect(() => {
    if (!loading && topRef.current) {
      setTimeout(() => {
        topRef.current.scrollIntoView({ behavior: 'instant', block: 'start' });
      }, 100); // Google Map等の読み込みによる画面のズレを防ぐため0.1秒遅延
    }
  }, [loading, iso]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const t = (jaText, enText) => {
    if (lang === 'en' && enText) return enText;
    return jaText;
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-slate-900/80 backdrop-blur-sm overflow-y-auto p-4 md:p-8 flex justify-center items-start scroll-smooth"
      onClick={handleBackdropClick}
    >
      {/* ▼ 追加：ジャンプ先の目印となる透明な要素 */}
      <div ref={topRef} className="absolute top-0 left-0 w-full h-1 opacity-0 pointer-events-none" />

      <div className="bg-[#f8fafc] w-[95vw] max-w-[1400px] rounded-3xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300 mt-2 md:mt-6 mb-10">
        
        <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
          <div className="bg-white/80 backdrop-blur-md p-1 rounded-full shadow-sm flex items-center border border-white/50">
            <button 
              onClick={() => setLanguage('ja')}
              className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${lang === 'ja' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-600 hover:bg-white'}`}
            >
              日本語
            </button>
            <button 
              onClick={() => setLanguage('en')}
              className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all ${lang === 'en' ? 'bg-blue-500 text-white shadow-md' : 'text-slate-600 hover:bg-white'}`}
            >
              English
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="bg-white/80 hover:bg-white p-2.5 rounded-full backdrop-blur-md shadow-sm transition-all border border-white/50"
          >
            <X size={24} className="text-gray-800" />
          </button>
        </div>

        {loading ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-blue-600 font-bold text-lg animate-pulse">Loading Explorer...</p>
          </div>
        ) : error ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
            <div className="text-6xl mb-4">🌍💦</div>
            <h2 className="text-2xl font-bold text-red-500 mb-2">Data not found</h2>
            <button onClick={onClose} className="px-6 py-2 bg-blue-500 text-white rounded-full font-bold hover:bg-blue-600">Close</button>
          </div>
        ) : (
          <div className="flex flex-col">
            
            <div className="relative h-64 md:h-80 bg-slate-800 overflow-hidden flex items-end">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay"
                style={{ backgroundImage: `url(${countryData.flagUrl})` }}
              ></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
              
              <div className="relative z-10 w-full p-8 md:p-12 flex items-end gap-6">
                <img 
                  src={countryData.flagUrl} 
                  alt="Flag" 
                  className="w-32 md:w-48 h-auto rounded-lg shadow-xl border-2 border-white/20 object-cover"
                />
                <div className="text-white pb-2">
                  <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 drop-shadow-md">
                    {t(countryData.nameJa, countryData.nameEn)} 
                    {lang === 'ja' && <span className="text-2xl md:text-3xl font-medium text-slate-300 ml-3">{countryData.nameEn}</span>}
                  </h1>
                  <p className="text-lg md:text-xl text-blue-200 font-bold flex items-center gap-2">
                    <MapPin size={20} /> 
                    {lang === 'ja' ? '首都' : 'Capital'}: {t(countryData.capitalJa, countryData.capitalEn)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-10 xl:p-12 space-y-10">
              
              <div className="bg-white border-l-4 border-blue-500 p-5 md:p-6 rounded-r-2xl shadow-sm">
                <p className="text-xl md:text-2xl font-bold text-slate-700 leading-relaxed">
                  「{t(countryData.subtitle, countryData.subtitleEn || countryData.subtitle)}」
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12">
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 h-[450px] relative overflow-hidden group">
                  <h3 className="absolute top-6 left-6 bg-white/95 backdrop-blur px-5 py-2 rounded-full font-bold text-slate-800 shadow-md z-10 flex items-center gap-2">
                    <Globe size={18} className="text-blue-500"/> {lang === 'ja' ? '地図で見る' : 'Interactive Map'}
                  </h3>
                  {/* iframeがフォーカスを奪わないように tabIndex="-1" を追加 */}
                  <iframe 
                    title="Google Map" width="100%" height="100%" className="rounded-2xl bg-slate-100" style={{ border: 0 }}
                    loading="lazy" allowFullScreen tabIndex="-1"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(countryData.mapQuery)}&t=m&z=5&output=embed&hl=${lang}`}
                  ></iframe>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between h-full">
                  
                  {/* ▼ 修正：時計の高さ制限を無くし、縦長デザインでもスッポリ収まるように変更 */}
                  <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start mb-8 pb-6 border-b border-slate-100 gap-6">
                    <div className="flex-1 text-center sm:text-left flex flex-col justify-center mt-4">
                      <h3 className="text-3xl font-black text-slate-800 mb-3">{lang === 'ja' ? '現在の時間' : 'Local Time'}</h3>
                      <p className="text-slate-500 font-medium text-lg flex flex-col gap-2">
                        <span>Time Zone:</span>
                        <span className="font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-lg inline-block w-fit mx-auto sm:mx-0">
                          {countryData.timeZone}
                        </span>
                      </p>
                    </div>
                    {/* 時計エリアの横幅を大きく確保し、高さは中身（ChatGPT生成コード）に合わせて自動で伸びるようにする */}
                    <div className="shrink-0 flex items-center justify-center w-full sm:w-1/2 md:w-56 overflow-visible">
                      <DetailedAnalogClock timeZone={countryData.timeZone} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="bg-slate-50 p-5 rounded-2xl flex items-start gap-4 hover:bg-blue-50 transition-colors">
                      <Coins className="text-yellow-500 mt-1 shrink-0 w-6 h-6" />
                      <div>
                        <p className="text-sm font-bold text-slate-400 mb-1">{lang === 'ja' ? '通貨' : 'Currency'}</p>
                        <p className="font-bold text-slate-700 text-lg">{t(countryData.currency.nameJa, countryData.currency.nameEn)} ({countryData.currency.symbol})</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl flex items-start gap-4 hover:bg-blue-50 transition-colors">
                      <Languages className="text-green-500 mt-1 shrink-0 w-6 h-6" />
                      <div>
                        <p className="text-sm font-bold text-slate-400 mb-1">{lang === 'ja' ? '主な言語' : 'Languages'}</p>
                        <p className="font-bold text-slate-700 text-lg">{countryData.languages.map(l => t(l.nameJa, l.nameEn)).join(', ')}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl flex items-start gap-4 hover:bg-blue-50 transition-colors">
                      <Mountain className="text-stone-500 mt-1 shrink-0 w-6 h-6" />
                      <div>
                        <p className="text-sm font-bold text-slate-400 mb-1">{lang === 'ja' ? '標高の目安' : 'Elevation'}</p>
                        <p className="font-bold text-slate-700 text-lg">{t(countryData.elevation, countryData.elevationEn || countryData.elevation)}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-5 rounded-2xl flex items-start gap-4 hover:bg-blue-50 transition-colors">
                      <CloudSun className="text-blue-500 mt-1 shrink-0 w-6 h-6" />
                      <div>
                        <p className="text-sm font-bold text-slate-400 mb-1">{lang === 'ja' ? '気候の特徴' : 'Weather'}</p>
                        <p className="font-bold text-slate-700 text-sm line-clamp-2" title={t(countryData.weather.summary, countryData.weather.summaryEn || countryData.weather.summary)}>
                          {t(countryData.weather.summary, countryData.weather.summaryEn || countryData.weather.summary)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {countryData.japanConnection && (
                <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-8 md:p-10 rounded-3xl border border-rose-100 shadow-sm relative overflow-hidden">
                  <HeartHandshake className="absolute -right-10 -bottom-10 text-rose-200/50 w-64 h-64" />
                  <h3 className="text-3xl font-black text-rose-600 mb-6 flex items-center gap-3 relative z-10">
                    🇯🇵 {t(countryData.japanConnection.title, countryData.japanConnection.titleEn || countryData.japanConnection.title)}
                  </h3>
                  <p className="text-xl text-slate-700 leading-loose font-medium relative z-10 max-w-4xl">
                    {t(countryData.japanConnection.text, countryData.japanConnection.textEn || countryData.japanConnection.text)}
                  </p>
                </div>
              )}

              <div>
                <h3 className="text-3xl font-black text-slate-800 mb-8 px-2 flex items-center gap-3">
                  ✨ {lang === 'ja' ? '見どころ・文化' : 'Highlights & Culture'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {countryData.heritage?.map((item) => (
                    <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 group hover:shadow-xl transition-all">
                      <div className="h-56 overflow-hidden relative">
                        <span className="absolute top-4 left-4 z-10 text-xs font-black bg-blue-500 text-white px-3 py-1.5 rounded-full shadow-md">
                          {t(item.category, item.categoryEn || item.category)}
                        </span>
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="p-6">
                        <h4 className="text-xl font-black text-slate-800 mb-3">{t(item.title, item.titleEn || item.title)}</h4>
                        <p className="text-slate-600 font-medium leading-relaxed">{t(item.description, item.descriptionEn || item.description)}</p>
                      </div>
                    </div>
                  ))}
                  {countryData.culture?.map((item) => (
                    <div key={item.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 group hover:shadow-xl transition-all">
                      <div className="h-56 overflow-hidden relative">
                        <span className="absolute top-4 left-4 z-10 text-xs font-black bg-orange-500 text-white px-3 py-1.5 rounded-full shadow-md">
                          {t(item.category, item.categoryEn || item.category)}
                        </span>
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="p-6">
                        <h4 className="text-xl font-black text-slate-800 mb-3">{t(item.title, item.titleEn || item.title)}</h4>
                        <p className="text-slate-600 font-medium leading-relaxed">{t(item.description, item.descriptionEn || item.description)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {countryData.quiz && (
                <div className="mt-16 pt-10 border-t-2 border-dashed border-slate-300">
                  <InteractiveQuiz quizData={countryData.quiz} lang={lang} />
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}