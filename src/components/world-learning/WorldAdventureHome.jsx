import {
  ArrowRight,
  BrainCircuit,
  Clock3,
  Compass,
  Globe2,
  Languages,
  Map,
  Network,
  Play,
  TimerReset,
  Volume2,
  VolumeX,
} from 'lucide-react';

import {
  useState,
} from 'react';

import timePaletteLogo
  from '../../assets/branding/timepalette_global_adventure_logo.png';

import openingBackground
  from '../../assets/opening/timepalette_opening_background.png';

import {
  getCountryProgress,
} from '../../utils/worldProgressStorage';

import ModeGuideModal
  from './ModeGuideModal';

import placeGuide
  from '../../assets/mode-guides/mode_place_treasure_map.png';

import timeGuide
  from '../../assets/mode-guides/mode_time_global_clock.png';

import languageGuide
  from '../../assets/mode-guides/mode_language_carnival.png';

import cultureGuide
  from '../../assets/mode-guides/mode_life_culture_world_stories.png';

import japanGuide
  from '../../assets/mode-guides/mode_japan_connection_global_ties.png';

import thinkGuide
  from '../../assets/mode-guides/mode_think_connect_world_learning.png';

import {
  getUiSoundEnabled,
  playUiSound,
  setUiSoundEnabled,
} from '../../utils/uiSound';

const learningModes = [
  {
    id: 'place',
    number: '01',
    title: 'PLACE',
    subtitle:
      '地図から世界を発見する',
    description:
      '国や都市の位置、地域の特徴を地図から読み取ります。',
    icon: Map,
    accent:
      'border-emerald-500',
    guideImage:
      placeGuide,
  },
  {
    id: 'time',
    number: '02',
    title: 'TIME',
    subtitle:
      '世界の時間を体験する',
    description:
      '時差や時間帯を使って、世界との距離を実感します。',
    icon: Clock3,
    accent:
      'border-blue-500',
    guideImage:
      timeGuide,
  },
  {
    id: 'language',
    number: '03',
    title: 'LANGUAGE',
    subtitle:
      'ことばでつながる',
    description:
      '聞く・話す・質問する活動から交流の表現を学びます。',
    icon: Languages,
    accent:
      'border-violet-500',
    guideImage:
      languageGuide,
  },
  {
    id: 'culture',
    number: '04',
    title:
      'LIFE & CULTURE',
    subtitle:
      'くらしと文化を知る',
    description:
      '気候、学校生活、食文化など、多様なくらしを比べます。',
    icon: Globe2,
    accent:
      'border-amber-500',
    guideImage:
      cultureGuide,
  },
  {
    id: 'japan',
    number: '05',
    title:
      'JAPAN CONNECTION',
    subtitle:
      '日本とのつながりを探す',
    description:
      '世界の国々と日本の生活・産業との関係を考えます。',
    icon: Network,
    accent:
      'border-rose-500',
    guideImage:
      japanGuide,
  },
  {
    id: 'think',
    number: '06',
    title:
      'THINK & CONNECT',
    subtitle:
      '比べて、考えて、伝える',
    description:
      '根拠を使って考え、自分の問いや意見へつなげます。',
    icon: BrainCircuit,
    accent:
      'border-slate-700',
    guideImage:
      thinkGuide,
  },
];

const tools = [
  {
    id: 'timer',
    title: 'Timer',
    description:
      '授業や活動時間を管理',
    icon: TimerReset,
  },
  {
    id: 'stopwatch',
    title: 'Stopwatch',
    description:
      'スピーチや活動時間を計測',
    icon: Play,
  },
  {
    id: 'mapClock',
    title: 'World Clock',
    description:
      '世界の都市と時刻を見る',
    icon: Globe2,
  },
  {
    id: 'timeDiff',
    title:
      'Meeting Planner',
    description:
      '国際交流の時間を調整',
    icon: Clock3,
  },
];

export default function WorldAdventureHome({
  onExploreWorld,
  onOpenTool,
}) {

  const [
    selectedMode,
    setSelectedMode,
  ] = useState(null);

  const [
    soundEnabled,
    setSoundEnabledState,
  ] = useState(
    () =>
      getUiSoundEnabled()
  );

  const progress =
    getCountryProgress(
      'au'
    );

  const completedCount =
    progress
      ?.completedMissionIds
      ?.length ?? 0;

  const toggleSound =
    () => {
      const next =
        !soundEnabled;

      setUiSoundEnabled(
        next
      );

      setSoundEnabledState(
        next
      );

      if (next) {
        window.setTimeout(
          () => {
            playUiSound(
              'tap'
            );
          },
          20
        );
      }
    };

  const startAdventure =
    () => {
      playUiSound(
        'open'
      );

      onExploreWorld?.();
    };

  const openTool =
    (toolId) => {
      playUiSound(
        'tap'
      );

      onOpenTool?.(
        toolId
      );
    };

  return (
    <div className="min-h-screen bg-[#f4f2ed] text-slate-900">

      {/* HERO */}
      <section className="relative min-h-[720px] overflow-hidden bg-slate-950">

        <img
          src={
            openingBackground
          }
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/66 to-slate-950/30" />

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20" />

        {/* Top */}
        <div className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">

          <div className="text-xs font-semibold tracking-[0.22em] text-white/70">
            TIMEPALETTE
            <span className="ml-3 text-white/40">
              WORLD LEARNING
            </span>
          </div>

          <button
            type="button"
            onClick={
              toggleSound
            }
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/20 text-white/80 backdrop-blur-md transition hover:bg-white/10 hover:text-white"
            aria-label={
              soundEnabled
                ? 'ボタン音をオフ'
                : 'ボタン音をオン'
            }
          >
            {soundEnabled ? (
              <Volume2
                size={18}
              />
            ) : (
              <VolumeX
                size={18}
              />
            )}
          </button>

        </div>

        {/* Main hero */}
        <div className="relative z-10 mx-auto grid min-h-[610px] w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-20 lg:grid-cols-[1.15fr_0.85fr] lg:px-10">

          <div className="max-w-3xl">

            <img
              src={
                timePaletteLogo
              }
              alt="TimePalette"
              className="mb-8 w-full max-w-xl drop-shadow-2xl"
            />

            <p className="mb-4 text-xs font-bold tracking-[0.28em] text-sky-300">
              EXPLORE · LEARN · CONNECT
            </p>

            <h1 className="max-w-2xl text-4xl font-semibold leading-[1.15] tracking-tight text-white md:text-5xl lg:text-6xl">
              世界を、
              <br />
              地図・時間・ことば・文化から学ぶ。
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/72 md:text-lg">
              世界の国を訪れ、
              観察し、比べ、問いをつくる。
              TimePaletteは、
              世界を知ることから
              人とつながるところまでを
              一つの学びにします。
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">

              <button
                type="button"
                onClick={
                  startAdventure
                }
                className="group inline-flex items-center gap-3 bg-white px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl transition hover:-translate-y-0.5 hover:bg-sky-50"
              >
                <Compass
                  size={19}
                />

                世界を探検する

                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-1"
                />
              </button>

              <button
                type="button"
                onClick={
                  startAdventure
                }
                className="inline-flex items-center gap-3 border border-white/25 bg-black/20 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
              >
                Australia
                を続ける
              </button>

            </div>

          </div>

          {/* Progress */}
          <div
  id="journey"
  className="lg:justify-self-end scroll-mt-28"
>

            <div className="w-full max-w-sm border border-white/15 bg-slate-950/55 p-6 text-white shadow-2xl backdrop-blur-xl">

              <p className="text-[11px] font-bold tracking-[0.24em] text-white/50">
                CURRENT JOURNEY
              </p>

              <div className="mt-6 flex items-start justify-between">

                <div>
                  <div className="text-4xl">
                    🇦🇺
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold">
                    Australia
                  </h2>

                  <p className="mt-1 text-sm text-white/55">
                    World Learning
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-light">
                    {
                      completedCount
                    }
                  </div>

                  <div className="mt-1 text-xs tracking-wide text-white/50">
                    / 40 MISSIONS
                  </div>
                </div>

              </div>

              <div className="mt-7 h-1 overflow-hidden bg-white/15">

                <div
                  className="h-full bg-sky-400 transition-all"
                  style={{
                    width:
                      `${Math.min(
                        100,
                        (completedCount /
                          40) *
                          100
                      )}%`,
                  }}
                />

              </div>

              <p className="mt-5 text-sm leading-6 text-white/60">
                次のミッションから
                そのまま学習を続けられます。
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* LEARNING MODES */}
      <section className="mx-auto w-full max-w-7xl px-6 py-20 lg:px-10">

        <div className="max-w-2xl">

          <p className="text-xs font-bold tracking-[0.24em] text-slate-400">
            SIX WAYS TO DISCOVER
          </p>

          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            世界を見る6つの視点
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            正解を覚えるだけではなく、
            場所・時間・ことば・文化・日本との関係・問いの6つから
            一つの国を立体的に学びます。
          </p>

        </div>

                <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

          {learningModes.map(
            (mode) => {
              const Icon =
                mode.icon;

              return (
                <button
                  key={
                    mode.id
                  }
                  type="button"
                  onClick={() => {
                    playUiSound(
                      'open'
                    );

                    setSelectedMode(
                      mode
                    );
                  }}
                  className={`
                    group
                    border-t-4
                    ${mode.accent}
                    bg-white
                    p-7
                    text-left
                    shadow-[0_8px_30px_rgba(15,23,42,0.05)]
                    transition
                    hover:-translate-y-1
                    hover:shadow-[0_14px_35px_rgba(15,23,42,0.09)]
                  `}
                >

                  <div className="flex items-center justify-between">

                    <Icon
                      size={26}
                      strokeWidth={
                        1.7
                      }
                      className="text-slate-700"
                    />

                    <span className="text-xs font-semibold tracking-[0.18em] text-slate-300">
                      {
                        mode.number
                      }
                    </span>

                  </div>

                  <h3 className="mt-8 text-lg font-bold tracking-wide">
                    {
                      mode.title
                    }
                  </h3>

                  <p className="mt-2 text-lg font-medium text-slate-800">
                    {
                      mode.subtitle
                    }
                  </p>

                  <p className="mt-4 text-sm leading-7 text-slate-500">
                    {
                      mode.description
                    }
                  </p>

                  <div className="mt-7 flex items-center gap-2 text-[10px] font-bold tracking-[0.16em] text-slate-400 transition group-hover:text-slate-700">

                    VIEW GUIDE

                    <ArrowRight
                      size={13}
                    />

                  </div>

                </button>
              );
            }
          )}

        </div>

      </section>

      {/* TOOLS */}
      <section
        id="tools"
        className="border-t border-slate-200 bg-white"
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-10">

          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

            <div>
              <p className="text-xs font-bold tracking-[0.24em] text-slate-400">
                TOOLS
              </p>

              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                学びと交流を支える道具
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-500">
              タイマーや世界時計は、
              TimePaletteの学習や国際交流を支えるツールとして利用できます。
            </p>

          </div>

          <div className="mt-9 grid grid-cols-1 border-y border-slate-200 sm:grid-cols-2 lg:grid-cols-4">

            {tools.map(
              (tool) => {
                const Icon =
                  tool.icon;

                return (
                  <button
                    key={
                      tool.id
                    }
                    type="button"
                    onClick={() =>
                      openTool(
                        tool.id
                      )
                    }
                    className="group flex min-h-36 items-start gap-4 border-b border-slate-200 p-6 text-left transition hover:bg-slate-50 sm:border-r lg:border-b-0"
                  >

                    <Icon
                      size={22}
                      strokeWidth={
                        1.7
                      }
                      className="mt-1 shrink-0 text-slate-500"
                    />

                    <div>
                      <div className="font-semibold text-slate-900">
                        {
                          tool.title
                        }
                      </div>

                      <div className="mt-2 text-sm leading-6 text-slate-500">
                        {
                          tool.description
                        }
                      </div>

                      <div className="mt-5 flex items-center gap-1 text-xs font-bold text-slate-400 transition group-hover:text-slate-700">
                        OPEN
                        <ArrowRight
                          size={
                            14
                          }
                        />
                      </div>
                    </div>

                  </button>
                );
              }
            )}

          </div>

        </div>
      </section>

      <footer className="border-t border-slate-200 bg-[#f4f2ed] px-6 py-8 text-center text-xs tracking-wide text-slate-400">
        TIMEPALETTE ·
        EXPLORE · LEARN ·
        CONNECT
      </footer>
      <ModeGuideModal
        mode={
          selectedMode
        }
        onClose={() =>
          setSelectedMode(
            null
          )
        }
        onExplore={
          onExploreWorld
        }
      />
    </div>
  );
}