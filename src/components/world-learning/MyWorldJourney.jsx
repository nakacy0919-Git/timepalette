import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Compass, Globe2, MapPinned, Search, Sparkles, X } from 'lucide-react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import worldAtlas from 'world-atlas/countries-110m.json';

const dateLabel = timestamp => timestamp
  ? new Date(timestamp).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
  : '';
const missionLabel = id => {
  const match = String(id).match(/-(\d{2})$/);
  if (match) return 'ミッション ' + Number(match[1]);
  return '投稿ミッション';
};

function JourneyMap({ countries, selectedIso, onSelect }) {
  const lookup = useMemo(() => {
    const name = new Map();
    const atlasId = new Map();
    for (const country of countries) {
      if (country.atlasName) name.set(country.atlasName, country);
      if (country.atlasId && country.atlasId !== '-99') atlasId.set(String(country.atlasId).padStart(3, '0'), country);
    }
    return { name, atlasId };
  }, [countries]);
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-[#07162b]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(28,130,183,0.2),transparent_66%)]" />
      <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 166 }} width={980} height={480}
        style={{ width: '100%', height: 'auto', maxHeight: '350px' }} aria-label="学習した国を色分けした世界地図">
        <Geographies geography={worldAtlas}>
          {({ geographies }) => geographies.map(geo => {
            const country = lookup.atlasId.get(String(geo.id).padStart(3, '0'))
              || lookup.name.get(geo.properties?.name);
            const active = country?.iso === selectedIso;
            const explored = country?.explored;
            const fill = active ? '#f5d28a' : explored ? '#49d9cb' : '#2b4361';
            return (
              <Geography key={geo.rsmKey} geography={geo}
                onClick={() => country && onSelect(country.iso)}
                role={country ? 'button' : undefined}
                tabIndex={country ? 0 : -1}
                onKeyDown={event => {
                  if (country && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault(); onSelect(country.iso);
                  }
                }}
                aria-label={country ? country.nameJa + (explored ? '・探究済み' : '・未探究') : undefined}
                style={{
                  default: { fill, outline: 'none', stroke: '#101f35', strokeWidth: 0.65, cursor: country ? 'pointer' : 'default' },
                  hover: { fill: country ? '#aaf5e6' : fill, outline: 'none', stroke: '#152238', strokeWidth: 0.75, cursor: country ? 'pointer' : 'default' },
                  pressed: { fill: '#f5d28a', outline: 'none', stroke: '#152238', strokeWidth: 0.75 },
                }}
              />
            );
          })}
        </Geographies>
      </ComposableMap>
      <div className="absolute bottom-3 left-4 flex items-center gap-3 rounded-full bg-slate-950/75 px-3 py-1.5 text-[10px] font-semibold text-slate-200 backdrop-blur-md">
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#49d9cb]" /> 探究済み</span>
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#f5d28a]" /> 選択中</span>
      </div>
    </div>
  );
}

export default function MyWorldJourney({ summary, onClose, onExplore }) {
  const [selectedIso, setSelectedIso] = useState(summary.lastCountry?.iso || 'jp');
  const [filter, setFilter] = useState('explored');
  const [search, setSearch] = useState('');
  const selected = summary.countries.find(c => c.iso === selectedIso) || summary.countries[0];
  const percent = summary.totalCountries ? Math.round(summary.exploredCountries / summary.totalCountries * 100) : 0;
  const filtered = useMemo(() => summary.countries
    .filter(c => (filter === 'all' || c.explored) &&
      (!search || [c.nameJa, c.nameEn, c.iso].some(name => String(name || '').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))))
    .sort((a, b) => Number(b.explored) - Number(a.explored) || (b.lastAt || 0) - (a.lastAt || 0) || (a.nameJa || '').localeCompare(b.nameJa || '', 'ja')),
  [summary.countries, filter, search]);

  useEffect(() => {
    const handleKey = event => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#061123] text-white" role="dialog" aria-modal="true" aria-label="My World Journey 世界探究の進捗">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(15,133,180,0.17),transparent_54%)]" />
      <div className="relative mx-auto max-w-[1420px] px-4 pb-10 pt-5 sm:px-6 lg:px-9">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={onClose} aria-label="冒険ホームに戻る" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"><ArrowLeft size={20} /></button>
            <div className="min-w-0">
              <p className="flex items-center gap-1 text-[10px] font-black tracking-[0.19em] text-cyan-200"><Sparkles size={13} /> MY WORLD JOURNEY</p>
              <h1 className="mt-0.5 text-[22px] font-black tracking-tight sm:text-[29px]">わたしの世界探究</h1>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-bold transition hover:bg-white/15"><X size={16} /> 閉じる</button>
        </header>

        <section className="mt-5 grid grid-cols-3 gap-2 sm:gap-3" aria-label="世界探究の合計">
          {[
            { label: '探究した国', value: summary.exploredCountries, suffix: ' / ' + summary.totalCountries, glow: true },
            { label: 'クリアしたミッション', value: summary.completedMissions, suffix: '', glow: false },
            { label: '探究した分野', value: summary.activeDomains, suffix: ' / 6', glow: false },
          ].map(stat => (
            <div key={stat.label} className={'rounded-[18px] border px-3 py-3.5 sm:px-5 ' + (stat.glow ? 'border-cyan-300/30 bg-cyan-300/[0.09]' : 'border-white/10 bg-white/[0.045]')}>
              <p className="text-[10px] font-bold text-slate-300 sm:text-xs">{stat.label}</p>
              <p className="mt-1.5 whitespace-nowrap text-[25px] font-black leading-none tabular-nums sm:text-[35px]">
                {stat.value}<span className="text-xs font-semibold text-slate-400 sm:text-sm">{stat.suffix}</span>
              </p>
            </div>
          ))}
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.22fr)_minmax(320px,0.78fr)]">
          <section className="min-w-0 rounded-[26px] border border-white/10 bg-white/[0.045] p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-black sm:text-base"><Globe2 size={18} className="text-cyan-200" /> 世界に広がる探究</h2>
              <span className="text-[11px] font-semibold tabular-nums text-cyan-200">{percent}% explored</span>
            </div>
            <JourneyMap countries={summary.countries} selectedIso={selectedIso} onSelect={setSelectedIso} />
          </section>

          <section className="min-w-0 rounded-[26px] border border-white/10 bg-white/[0.05] p-4 sm:p-5">
            {selected && <>
              <div className="flex items-center gap-3">
                <span className="flex h-14 w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/10">
                  {selected.flagUrl ? <img src={selected.flagUrl} alt="" className="h-full w-full object-contain" loading="lazy" /> : <span className="text-[38px]">{selected.flagEmoji || '🌍'}</span>}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold tracking-[0.13em] text-cyan-200">COUNTRY JOURNEY</p>
                  <h2 className="truncate text-xl font-black">{selected.nameJa || selected.nameEn}</h2>
                  <p className="truncate text-xs text-slate-400">{selected.nameEn}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[26px] font-black leading-none tabular-nums">{selected.completedCount}</p>
                  <p className="mt-1 text-[10px] text-slate-400">クリア</p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                {selected.domains.map(d => {
                  const ratio = d.available ? Math.min(100, d.completed / d.available * 100) : 0;
                  return <div key={d.id} className="grid grid-cols-[minmax(0,1fr)_50px] items-center gap-x-3 gap-y-1">
                    <span className="truncate text-[12px] font-bold text-slate-200">{d.icon} {d.label}</span>
                    <span className="text-right text-[12px] font-bold tabular-nums text-slate-300">{d.completed}<span className="text-slate-500">/{d.available}</span></span>
                    <div className="col-span-2 h-[6px] overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full transition-all" style={{ width: ratio + '%', backgroundColor: d.color }} />
                    </div>
                  </div>;
                })}
              </div>
              {selected.unclassified > 0 &&
                <p className="mt-3 text-[11px] text-slate-400">分野未分類の過去の達成記録：{selected.unclassified}件</p>}
              {selected.lastAt && <p className="mt-3 text-[11px] text-slate-400">最近の学習：{dateLabel(selected.lastAt)}</p>}
              <button type="button" onClick={onExplore} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[15px] bg-gradient-to-r from-[#0873d8] to-[#20b7dc] px-4 py-3 text-sm font-black shadow-[0_10px_25px_rgba(10,116,197,0.25)] transition hover:brightness-110">
                <Compass size={17} /> 世界の冒険へ <ArrowRight size={17} />
              </button>
            </>}
          </section>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
          <section className="min-w-0 rounded-[24px] border border-white/10 bg-white/[0.045] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-base font-black"><MapPinned size={19} className="text-cyan-200" /> 国別パスポート</h2>
              <div className="flex rounded-lg border border-white/10 bg-black/20 p-0.5 text-[11px] font-bold">
                <button type="button" onClick={() => setFilter('explored')} aria-pressed={filter === 'explored'} className={'rounded-md px-2.5 py-1.5 ' + (filter === 'explored' ? 'bg-cyan-100 text-slate-900' : 'text-slate-300')}>探究した国</button>
                <button type="button" onClick={() => setFilter('all')} aria-pressed={filter === 'all'} className={'rounded-md px-2.5 py-1.5 ' + (filter === 'all' ? 'bg-cyan-100 text-slate-900' : 'text-slate-300')}>すべて</button>
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input value={search} onChange={event => setSearch(event.target.value)} placeholder="国名で検索" className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
            </label>
            <div className="mt-3 max-h-[264px] space-y-1.5 overflow-y-auto pr-1">
              {!filtered.length && <p className="px-2 py-6 text-center text-sm text-slate-400">{search ? '該当する国がありません' : 'ミッションをクリアすると、ここに国が増えます'}</p>}
              {filtered.map(country => (
                <button type="button" key={country.iso} onClick={() => setSelectedIso(country.iso)}
                  aria-pressed={selectedIso === country.iso}
                  className={'flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ' + (selectedIso === country.iso ? 'border-cyan-300/45 bg-cyan-300/[0.12]' : 'border-white/[0.05] bg-white/[0.035] hover:bg-white/[0.09]')}>
                  <span className="text-2xl">{country.flagEmoji || '🌍'}</span>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-bold">{country.nameJa}</span>
                  {country.explored ? <span className="flex items-center gap-1 text-xs font-bold tabular-nums text-cyan-200"><Check size={14} /> {country.completedCount}</span> :
                    <span className="text-[11px] text-slate-500">未探究</span>}
                </button>
              ))}
            </div>
          </section>
          <section className="min-w-0 rounded-[24px] border border-white/10 bg-white/[0.045] p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-black"><Check size={19} className="text-emerald-300" /> この国でクリアしたミッション</h2>
            {selected && selected.completedIds.length
              ? <div className="mt-3 grid max-h-[306px] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-1">
                {selected.domains.flatMap(d => d.ids.map(id => ({ id, label: d.label, icon: d.icon }))).map(({ id, label, icon }) =>
                  <div key={id} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-emerald-200/10 bg-emerald-300/[0.07] px-3 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-300/15 text-emerald-200"><Check size={16} /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-bold">{icon} {label}</span>
                      <span className="block truncate text-[11px] text-slate-400">{missionLabel(id)}</span>
                    </span>
                  </div>
                )}
              </div>
              : <div className="flex h-36 flex-col items-center justify-center gap-2 text-sm text-slate-400"><Globe2 size={31} className="text-slate-500" /> この国の最初の発見を集めよう</div>}
            <p className="mt-3 text-[11px] text-slate-500">この端末に保存された学習記録を表示しています。</p>
          </section>
        </div>
      </div>
    </div>
  );
}
