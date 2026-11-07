import { ArrowUpRight, Compass, Globe2, Sparkles } from 'lucide-react';

export default function JourneySummaryCard({ summary, onOpen }) {
  const percent = summary.totalCountries
    ? Math.round(100 * summary.exploredCountries / summary.totalCountries)
    : 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="My World Journey：自分の世界探究の進捗を見る"
      className="group relative block w-[340px] max-w-full overflow-hidden rounded-[28px] border border-cyan-100/25 bg-[#07172c]/80 p-5 text-left text-white shadow-[0_24px_78px_rgba(0,0,0,0.38)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/70 hover:shadow-[0_26px_95px_rgba(16,126,195,0.32)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-200 xl:w-[370px]"
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-cyan-400/20 blur-[70px]" />
      <span className="relative flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.19em] text-cyan-200/90">
            <Sparkles size={13} strokeWidth={2} /> MY WORLD JOURNEY
          </span>
          <span className="mt-1 block text-[23px] font-black tracking-[-0.04em]">世界探究のあしあと</span>
        </span>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] border border-white/20 bg-white/10 text-cyan-100 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1">
          <ArrowUpRight size={23} />
        </span>
      </span>

      <span className="relative mt-5 grid grid-cols-3 gap-2">
        <span className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.09] px-2 py-3 text-center">
          <span className="block text-[24px] font-black leading-none text-cyan-100 tabular-nums">{summary.exploredCountries}</span>
          <span className="mt-2 block whitespace-nowrap text-[10px] font-semibold text-slate-300">探検した国</span>
        </span>
        <span className="rounded-xl border border-white/10 bg-white/[0.06] px-2 py-3 text-center">
          <span className="block text-[24px] font-black leading-none text-white tabular-nums">{summary.completedMissions}</span>
          <span className="mt-2 block whitespace-nowrap text-[10px] font-semibold text-slate-300">クリア数</span>
        </span>
        <span className="rounded-xl border border-white/10 bg-white/[0.06] px-2 py-3 text-center">
          <span className="block text-[24px] font-black leading-none text-white tabular-nums">{summary.activeDomains}<span className="text-[12px] text-slate-400">/6</span></span>
          <span className="mt-2 block whitespace-nowrap text-[10px] font-semibold text-slate-300">学んだ分野</span>
        </span>
      </span>

      <span className="relative mt-4 flex items-center justify-between text-[11px] font-semibold">
        <span className="inline-flex items-center gap-1.5 text-slate-200"><Globe2 size={13} /> 世界の探究</span>
        <span className="tabular-nums text-cyan-100">{summary.exploredCountries} / {summary.totalCountries} カ国</span>
      </span>
      <span className="relative mt-2 block h-2 overflow-hidden rounded-full bg-white/10">
        <span className="block h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 shadow-[0_0_20px_rgba(103,232,249,0.55)] transition-all" style={{ width: percent + '%' }} />
      </span>

      <span className="relative mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="min-w-0 truncate text-[11px] text-slate-300">
          {summary.lastCountry
            ? '最近の探究  ' + (summary.lastCountry.flagEmoji || '🌍') + ' ' + summary.lastCountry.nameJa
            : '最初の国を探検してみよう'}
        </span>
        <span className="ml-3 inline-flex shrink-0 items-center gap-1 text-xs font-bold text-cyan-200">
          進捗を見る <Compass size={14} />
        </span>
      </span>
    </button>
  );
}
