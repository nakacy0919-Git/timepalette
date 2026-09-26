import {
  CheckCircle2,
  LockKeyhole,
  Play,
  Sparkles,
  Trophy,
} from 'lucide-react';

import {
  useRef,
  useState,
} from 'react';

import {
  completeWorldMission,
  getCountryProgress,
} from '../../utils/worldProgressStorage';

import {
  playUiSound,
} from '../../utils/uiSound';

import MissionPlayer from './MissionPlayer';


/* =========================================================
   SUPPORTED MISSION TYPES
========================================================= */

const INTERACTIVE_MISSION_TYPES = new Set([
  'live-time-compare',
  'time-dial',
  'daypart-match',
  'schedule-builder',
  'global-challenge',

  'map-tap',
  'city-map',

  'matching',
  'speaking',
  'speaking-template',
  'speaking-creator',

  'region-sort',

  'sorting',
  'connection-chain',
  'daily-life-hunt',
  'quiz-creator',

  'compare-builder',
  'evidence-check',
  'question-creator',
  'creator-capstone',
]);


const isMissionPlayable = (
  mission
) => {
  const hasChoiceChallenge =
    Array.isArray(
      mission
        ?.challenge
        ?.choices
    ) &&
    typeof mission
      ?.challenge
      ?.correctIndex ===
      'number';

  return (
    hasChoiceChallenge ||
    INTERACTIVE_MISSION_TYPES.has(
      mission?.type
    )
  );
};


/* =========================================================
   MISSION JSON LOADER
========================================================= */

const missionModules =
  import.meta.glob(
    '../../data/missions_*.json',
    {
      eager: true,
    }
  );


const getMissionCountryData = (
  fileLetter,
  countryCode
) => {
  if (
    !fileLetter ||
    !countryCode
  ) {
    return null;
  }

  const key =
    `../../data/missions_${fileLetter.toLowerCase()}.json`;

  const module =
    missionModules[key];

  if (!module) {
    return null;
  }

  const data =
    module.default ??
    module;

  return (
    data?.[
      countryCode.toLowerCase()
    ] ??
    null
  );
};


/* =========================================================
   FLAG
========================================================= */

const makeFlagEmoji = (
  countryCode
) => {
  const upper =
    String(
      countryCode || ''
    ).toUpperCase();

  if (
    !/^[A-Z]{2}$/.test(
      upper
    )
  ) {
    return '🌍';
  }

  return upper
    .split('')
    .map(
      (letter) =>
        String.fromCodePoint(
          127397 +
            letter.charCodeAt(
              0
            )
        )
    )
    .join('');
};


/* =========================================================
   BADGES
========================================================= */

const BADGE_META = {
  none: {
    icon: '🌍',
    label:
      'Start Exploring',
    labelJa:
      '冒険を始めよう',
  },

  stamp: {
    icon: '🌏',
    label:
      'Explorer Stamp',
    labelJa:
      '探索スタンプ',
  },

  bronze: {
    icon: '🥉',
    label:
      'Explorer Badge',
    labelJa:
      'エクスプローラー',
  },

  silver: {
    icon: '🥈',
    label:
      'Discovery Badge',
    labelJa:
      'ディスカバリー',
  },

  gold: {
    icon: '🥇',
    label:
      'Country Master',
    labelJa:
      'カントリーマスター',
  },

  diamond: {
    icon: '💎',
    label:
      'Connector Badge',
    labelJa:
      'コネクター',
  },
};


/* =========================================================
   DOMAIN COLORS
========================================================= */

const DOMAIN_THEME = {
  place: {
    accent:
      '#10b981',

    dark:
      '#047857',

    soft:
      '#ecfdf5',

    border:
      '#a7f3d0',

    label:
      'EXPLORE THE MAP',
  },

  time: {
    accent:
      '#f59e0b',

    dark:
      '#b45309',

    soft:
      '#fffbeb',

    border:
      '#fde68a',

    label:
      'TRAVEL THROUGH TIME',
  },

  language: {
    accent:
      '#8b5cf6',

    dark:
      '#6d28d9',

    soft:
      '#f5f3ff',

    border:
      '#ddd6fe',

    label:
      'USE YOUR VOICE',
  },

  lifeCulture: {
    accent:
      '#f97316',

    dark:
      '#c2410c',

    soft:
      '#fff7ed',

    border:
      '#fed7aa',

    label:
      'DISCOVER DAILY LIFE',
  },

  japanConnection: {
    accent:
      '#3b82f6',

    dark:
      '#1d4ed8',

    soft:
      '#eff6ff',

    border:
      '#bfdbfe',

    label:
      'CONNECT WITH JAPAN',
  },

  thinkConnect: {
    accent:
      '#ec4899',

    dark:
      '#be185d',

    soft:
      '#fdf2f8',

    border:
      '#fbcfe8',

    label:
      'THINK & CONNECT',
  },
};


const DEFAULT_DOMAIN_THEME = {
  accent:
    '#64748b',

  dark:
    '#334155',

  soft:
    '#f8fafc',

  border:
    '#e2e8f0',

  label:
    'WORLD ADVENTURE',
};


/* =========================================================
   DOMAIN PROGRESS
========================================================= */

const getDomainCounts = (
  missionData,
  completedIds
) => {
  const counts = {};

  const domains =
    missionData
      ?.design
      ?.domains ??
    [];

  domains.forEach(
    (domain) => {
      counts[
        domain.id
      ] = 0;
    }
  );

  missionData.missions.forEach(
    (mission) => {
      if (
        completedIds.has(
          mission.id
        )
      ) {
        counts[
          mission.domain
        ] =
          (
            counts[
              mission.domain
            ] ??
            0
          ) + 1;
      }
    }
  );

  return counts;
};


/* =========================================================
   BADGE CALCULATION
========================================================= */

const qualifiesForRule = ({
  rule,
  completedCount,
  totalPoints,
  domainCounts,
  completedIds,
}) => {
  if (!rule) {
    return false;
  }

  if (
    rule.minMissions &&
    completedCount <
      rule.minMissions
  ) {
    return false;
  }

  if (
    rule.minWorldPoints &&
    totalPoints <
      rule.minWorldPoints
  ) {
    return false;
  }

  if (
    rule.minDomains
  ) {
    const activeDomains =
      Object.values(
        domainCounts
      ).filter(
        (count) =>
          count > 0
      ).length;

    if (
      activeDomains <
      rule.minDomains
    ) {
      return false;
    }
  }

  if (
    rule.domainMinimums
  ) {
    const allDomainsClear =
      Object.entries(
        rule.domainMinimums
      ).every(
        ([
          domainId,
          minimum,
        ]) =>
          (
            domainCounts[
              domainId
            ] ??
            0
          ) >= minimum
      );

    if (
      !allDomainsClear
    ) {
      return false;
    }
  }

  if (
    rule.requiredMissionIds
  ) {
    const allRequiredClear =
      rule
        .requiredMissionIds
        .every(
          (missionId) =>
            completedIds.has(
              missionId
            )
        );

    if (
      !allRequiredClear
    ) {
      return false;
    }
  }

  return true;
};


const calculateBadge = (
  missionData,
  completedIds,
  totalPoints,
  domainCounts
) => {
  const completedCount =
    completedIds.size;

  const rules =
    missionData
      ?.badgeRules ??
    {};

  const shared = {
    completedCount,
    totalPoints,
    domainCounts,
    completedIds,
  };

  if (
    qualifiesForRule({
      rule:
        rules.diamond,
      ...shared,
    })
  ) {
    return 'diamond';
  }

  if (
    qualifiesForRule({
      rule:
        rules.gold,
      ...shared,
    })
  ) {
    return 'gold';
  }

  if (
    qualifiesForRule({
      rule:
        rules.silver,
      ...shared,
    })
  ) {
    return 'silver';
  }

  if (
    qualifiesForRule({
      rule:
        rules.bronze,
      ...shared,
    })
  ) {
    return 'bronze';
  }

  if (
    qualifiesForRule({
      rule:
        rules.stamp,
      ...shared,
    })
  ) {
    return 'stamp';
  }

  return 'none';
};


/* =========================================================
   COMPONENT
========================================================= */

export default function WorldMissionPanel({
  countryCode,
  fileLetter,
}) {
  const missionListRef =
    useRef(null);

  const [
    selectedDomain,
    setSelectedDomain,
  ] = useState('all');

  const [
    activeMission,
    setActiveMission,
  ] = useState(null);

  const [
    ,
    setProgressRevision,
  ] = useState(0);


  const missionData =
    getMissionCountryData(
      fileLetter,
      countryCode
    );


  const progress =
    getCountryProgress(
      countryCode
    );


  if (!missionData) {
    return null;
  }


  const missions =
    missionData.missions ??
    [];


  const domains =
    missionData
      ?.design
      ?.domains ??
    [];


  const completedIds =
    new Set(
      progress
        ?.completedMissionIds ??
        []
    );


  const totalPoints =
    missions.reduce(
      (
        total,
        mission
      ) => {
        if (
          completedIds.has(
            mission.id
          )
        ) {
          return (
            total +
            Number(
              mission.points ??
                0
            )
          );
        }

        return total;
      },
      0
    );


  const domainCounts =
    getDomainCounts(
      missionData,
      completedIds
    );


  const completedCount =
    completedIds.size;


  const totalMissions =
    Number(
      missionData.totalMissions ??
        missions.length
    );


  const missionPercent =
    totalMissions > 0
      ? Math.round(
          (
            completedCount /
            totalMissions
          ) *
            100
        )
      : 0;


  const badge =
    calculateBadge(
      missionData,
      completedIds,
      totalPoints,
      domainCounts
    );


  const badgeMeta =
    BADGE_META[
      badge
    ] ??
    BADGE_META.none;


  const visibleMissions =
    selectedDomain ===
    'all'
      ? missions
      : missions.filter(
          (mission) =>
            mission.domain ===
            selectedDomain
        );


  const nextMission =
    missions.find(
      (mission) =>
        !completedIds.has(
          mission.id
        ) &&
        isMissionPlayable(
          mission
        )
    ) ??
    null;


  const moveToMissionList =
    () => {
      window.setTimeout(
        () => {
          missionListRef.current
            ?.scrollIntoView({
              behavior:
                'smooth',

              block:
                'start',
            });
        },
        80
      );
    };


  const selectDomain =
    (
      domainId
    ) => {
      playUiSound(
        'tap'
      );

      setSelectedDomain(
        domainId
      );

      moveToMissionList();
    };


  const openMission =
    (
      mission
    ) => {
      playUiSound(
        'open'
      );

      setActiveMission(
        mission
      );
    };


  const handleComplete =
    (
      mission
    ) => {
      const result =
        completeWorldMission(
          countryCode,
          mission.id
        );

      playUiSound(
        'success'
      );

      if (
        result.isNewCompletion
      ) {
        setProgressRevision(
          (value) =>
            value + 1
        );
      }
    };


  return (
    <section className="relative">

      {/* =====================================================
          ADVENTURE DASHBOARD
      ====================================================== */}

      <div
        className="
          relative
          overflow-hidden
          rounded-[34px]
          bg-gradient-to-br
          from-slate-950
          via-blue-950
          to-violet-950
          text-white
          shadow-[0_25px_70px_rgba(15,23,42,0.20)]
        "
      >

        <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 right-[-5%] h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="pointer-events-none absolute left-[45%] top-[10%] h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative p-6 md:p-9 lg:p-10">

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_370px] lg:items-center">

            {/* LEFT */}

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <span
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-white/15
                    bg-white/10
                    px-4
                    py-2
                    text-[10px]
                    font-black
                    tracking-[0.18em]
                    text-blue-200
                    backdrop-blur
                  "
                >

                  <Sparkles
                    size={15}
                  />

                  WORLD ADVENTURE

                </span>

                <span
                  className="
                    rounded-full
                    border
                    border-white/15
                    bg-white/5
                    px-4
                    py-2
                    text-[10px]
                    font-black
                    tracking-[0.15em]
                    text-white/55
                  "
                >

                  {makeFlagEmoji(
                    countryCode
                  )}{' '}

                  {
                    missionData.countryNameEn
                  }

                </span>

              </div>


              <h2
                className="
                  mt-6
                  text-3xl
                  font-black
                  tracking-[-0.04em]
                  md:text-5xl
                "
              >
                どの冒険から
                <br />
                始める？
              </h2>


              <p
                className="
                  mt-4
                  max-w-2xl
                  text-sm
                  font-semibold
                  leading-7
                  text-white/60
                  md:text-base
                "
              >
                地図、時間、ことば、文化、
                日本とのつながり、
                そして自分で考えるMission。
                6つのAdventure Zoneから
                世界を探検しよう。
              </p>


              {/* MAIN STATS */}

              <div
                className="
                  mt-8
                  grid
                  max-w-2xl
                  grid-cols-3
                  gap-3
                "
              >

                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">

                  <p className="text-2xl font-black md:text-3xl">

                    {
                      completedCount
                    }

                    <span className="text-sm text-white/30">
                      {' / '}
                      {
                        totalMissions
                      }
                    </span>

                  </p>

                  <p className="mt-1 text-[9px] font-black tracking-[0.14em] text-white/40">
                    MISSIONS
                  </p>

                </div>


                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">

                  <p className="text-2xl font-black text-amber-300 md:text-3xl">

                    {
                      totalPoints
                    }

                    <span className="text-sm text-white/30">
                      {' / '}
                      {
                        missionData.maxWorldPoints
                      }
                    </span>

                  </p>

                  <p className="mt-1 text-[9px] font-black tracking-[0.14em] text-white/40">
                    WORLD POINTS
                  </p>

                </div>


                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">

                  <p className="text-2xl font-black text-cyan-300 md:text-3xl">
                    {
                      missionPercent
                    }%
                  </p>

                  <p className="mt-1 text-[9px] font-black tracking-[0.14em] text-white/40">
                    COMPLETE
                  </p>

                </div>

              </div>


              {/* TOTAL PROGRESS */}

              <div className="mt-5 max-w-2xl">

                <div className="h-2 overflow-hidden rounded-full bg-white/10">

                  <div
                    className="
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      from-blue-400
                      via-cyan-300
                      to-emerald-300
                      transition-all
                      duration-700
                    "
                    style={{
                      width:
                        `${missionPercent}%`,
                    }}
                  />

                </div>

              </div>

            </div>


            {/* NEXT MISSION */}

            <div
              className="
                rounded-[28px]
                border
                border-white/15
                bg-white/10
                p-5
                shadow-xl
                backdrop-blur-xl
                md:p-6
              "
            >

              <div className="flex items-center justify-between gap-4">

                <div>

                  <p className="text-[9px] font-black tracking-[0.17em] text-blue-200">
                    CURRENT BADGE
                  </p>

                  <p className="mt-2 text-lg font-black">
                    {
                      badgeMeta.label
                    }
                  </p>

                  <p className="mt-1 text-xs font-bold text-white/40">
                    {
                      badgeMeta.labelJa
                    }
                  </p>

                </div>

                <div className="text-5xl">
                  {
                    badgeMeta.icon
                  }
                </div>

              </div>


              <div className="my-5 h-px bg-white/10" />


              {nextMission ? (
                <>

                  <p className="text-[9px] font-black tracking-[0.17em] text-white/40">
                    NEXT ADVENTURE
                  </p>

                  <p className="mt-2 text-lg font-black leading-snug">
                    {
                      nextMission.title
                    }
                  </p>

                  <p className="mt-2 line-clamp-2 text-xs font-semibold leading-6 text-white/50">
                    {
                      nextMission.prompt
                    }
                  </p>

                  <div className="mt-4 flex items-center justify-between">

                    <span className="text-xs font-black text-amber-300">
                      +
                      {
                        nextMission.points
                      } WP
                    </span>

                    <span className="text-[10px] font-black tracking-[0.1em] text-white/35">
                      LV.
                      {
                        nextMission.level
                      }
                    </span>

                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      openMission(
                        nextMission
                      )
                    }
                    className="
                      group
                      mt-5
                      flex
                      w-full
                      items-center
                      justify-between
                      rounded-2xl
                      bg-white
                      px-5
                      py-4
                      text-sm
                      font-black
                      text-slate-950
                      shadow-lg
                      transition
                      hover:-translate-y-0.5
                    "
                  >

                    <span>
                      PLAY NEXT MISSION
                    </span>

                    <span
                      className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-full
                        bg-slate-950
                        text-white
                        transition
                        group-hover:scale-105
                      "
                    >
                      <Play
                        size={15}
                        fill="currentColor"
                      />
                    </span>

                  </button>

                </>
              ) : (

                <div className="py-7 text-center">

                  <div className="text-6xl">
                    🏆
                  </div>

                  <p className="mt-4 text-lg font-black">
                    ALL MISSIONS CLEAR!
                  </p>

                  <p className="mt-2 text-xs font-bold text-white/45">
                    40 Mission 完全クリア
                  </p>

                </div>

              )}

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          ADVENTURE MAP
      ====================================================== */}

      <div className="mt-9">

        <div className="mb-5 flex items-end justify-between gap-4">

          <div>

            <p className="text-[10px] font-black tracking-[0.18em] text-slate-400">
              ADVENTURE MAP
            </p>

            <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
              6つのAdventure Zone
            </h3>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              気になる分野から自由に探検できます。
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              selectDomain(
                'all'
              )
            }
            className={`
              hidden
              rounded-full
              px-5
              py-2.5
              text-xs
              font-black
              transition
              md:block
              ${
                selectedDomain ===
                'all'
                  ? 'bg-slate-950 text-white'
                  : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
              }
            `}
          >
            ALL 40
          </button>

        </div>


        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">

          {domains.map(
            (
              domain,
              domainIndex
            ) => {
              const domainMissions =
                missions.filter(
                  (mission) =>
                    mission.domain ===
                    domain.id
                );

              const domainTotal =
                domainMissions.length;

              const domainComplete =
                domainCounts[
                  domain.id
                ] ??
                0;

              const selected =
                selectedDomain ===
                domain.id;

              const domainPercent =
                domainTotal > 0
                  ? Math.round(
                      (
                        domainComplete /
                        domainTotal
                      ) *
                        100
                    )
                  : 0;

              const theme =
                DOMAIN_THEME[
                  domain.id
                ] ??
                DEFAULT_DOMAIN_THEME;

              return (
                <button
                  key={
                    domain.id
                  }
                  type="button"
                  onClick={() =>
                    selectDomain(
                      domain.id
                    )
                  }
                  className={`
                    group
                    relative
                    overflow-hidden
                    rounded-[26px]
                    border
                    p-5
                    text-left
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-xl
                    ${
                      selected
                        ? 'shadow-lg ring-2 ring-slate-900/5'
                        : 'shadow-sm'
                    }
                  `}
                  style={{
                    backgroundColor:
                      theme.soft,

                    borderColor:
                      selected
                        ? theme.accent
                        : theme.border,
                  }}
                >

                  {/* LARGE NUMBER */}

                  <div
                    className="
                      pointer-events-none
                      absolute
                      -right-2
                      -top-5
                      text-[88px]
                      font-black
                      leading-none
                      opacity-[0.07]
                    "
                    style={{
                      color:
                        theme.accent,
                    }}
                  >
                    {
                      String(
                        domainIndex +
                          1
                      ).padStart(
                        2,
                        '0'
                      )
                    }
                  </div>


                  <div className="relative">

                    <div className="flex items-start justify-between gap-3">

                      <div
                        className="
                          flex
                          h-12
                          w-12
                          items-center
                          justify-center
                          rounded-2xl
                          text-2xl
                          text-white
                          shadow-sm
                        "
                        style={{
                          backgroundColor:
                            theme.accent,
                        }}
                      >
                        {
                          domain.icon
                        }
                      </div>


                      <span
                        className="
                          rounded-full
                          px-3
                          py-1
                          text-[9px]
                          font-black
                          tracking-[0.1em]
                        "
                        style={{
                          backgroundColor:
                            `${theme.accent}18`,

                          color:
                            theme.dark,
                        }}
                      >
                        {
                          domainComplete
                        }
                        {' / '}
                        {
                          domainTotal
                        }
                      </span>

                    </div>


                    <p
                      className="mt-5 text-[9px] font-black tracking-[0.15em]"
                      style={{
                        color:
                          theme.accent,
                      }}
                    >
                      {
                        theme.label
                      }
                    </p>


                    <h4 className="mt-1 text-lg font-black text-slate-900">
                      {
                        domain.labelJa
                      }
                    </h4>


                    <p className="mt-1 text-xs font-bold text-slate-400">
                      {
                        domain.labelEn
                      }
                    </p>


                    <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/80">

                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width:
                            `${domainPercent}%`,

                          backgroundColor:
                            theme.accent,
                        }}
                      />

                    </div>


                    <div className="mt-4 flex items-center justify-between">

                      <span className="text-xs font-black text-slate-500">
                        {
                          domainPercent
                        }%
                      </span>

                      <span
                        className="
                          text-[10px]
                          font-black
                          tracking-[0.1em]
                          transition-transform
                          group-hover:translate-x-1
                        "
                        style={{
                          color:
                            theme.dark,
                        }}
                      >
                        EXPLORE →
                      </span>

                    </div>

                  </div>

                </button>
              );
            }
          )}

        </div>


        {/* MOBILE ALL */}

        <div className="mt-4 md:hidden">

          <button
            type="button"
            onClick={() =>
              selectDomain(
                'all'
              )
            }
            className={`
              w-full
              rounded-2xl
              px-5
              py-3
              text-sm
              font-black
              transition
              ${
                selectedDomain ===
                'all'
                  ? 'bg-slate-950 text-white'
                  : 'border border-slate-200 bg-white text-slate-600'
              }
            `}
          >
            ALL 40 MISSIONS
          </button>

        </div>

      </div>


      {/* =====================================================
          MISSION LIST
      ====================================================== */}

      <div
        ref={
          missionListRef
        }
        className="
          mt-10
          scroll-mt-6
        "
      >

        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-end">

          <div>

            <p className="text-[10px] font-black tracking-[0.18em] text-slate-400">
              MISSIONS
            </p>

            <h3 className="mt-2 text-2xl font-black text-slate-900">
              {selectedDomain ===
              'all'
                ? '全40 Mission'
                : domains.find(
                    (domain) =>
                      domain.id ===
                      selectedDomain
                  )
                    ?.labelJa ??
                  'Mission'}
            </h3>

          </div>

          <div className="text-xs font-black text-slate-400">
            {
              visibleMissions.length
            } MISSIONS
          </div>

        </div>


        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

          {visibleMissions.map(
            (
              mission
            ) => {
              const completed =
                completedIds.has(
                  mission.id
                );

              const playable =
                isMissionPlayable(
                  mission
                );

              const domain =
                domains.find(
                  (item) =>
                    item.id ===
                    mission.domain
                );

              const theme =
                DOMAIN_THEME[
                  mission.domain
                ] ??
                DEFAULT_DOMAIN_THEME;

              return (
                <button
                  key={
                    mission.id
                  }
                  type="button"
                  onClick={() =>
                    openMission(
                      mission
                    )
                  }
                  className={`
                    group
                    relative
                    overflow-hidden
                    rounded-[24px]
                    border
                    bg-white
                    p-5
                    text-left
                    transition-all
                    duration-300
                    hover:-translate-y-1
                    hover:shadow-xl
                    ${
                      completed
                        ? 'border-emerald-200'
                        : playable
                          ? 'border-slate-200'
                          : 'border-slate-200 opacity-75'
                    }
                  `}
                >

                  {/* DOMAIN STRIPE */}

                  <div
                    className="absolute left-0 top-0 h-full w-1.5"
                    style={{
                      backgroundColor:
                        completed
                          ? '#10b981'
                          : theme.accent,
                    }}
                  />


                  <div className="flex items-start justify-between gap-3">

                    <div className="flex items-center gap-2">

                      <span
                        className="
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-xl
                          text-xl
                        "
                        style={{
                          backgroundColor:
                            theme.soft,
                        }}
                      >
                        {
                          domain?.icon
                        }
                      </span>

                      <div>

                        <p
                          className="text-[9px] font-black tracking-[0.12em]"
                          style={{
                            color:
                              theme.accent,
                          }}
                        >
                          {
                            domain?.labelEn
                          }
                        </p>

                        <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-500">
                          LV.
                          {
                            mission.level
                          }
                        </span>

                      </div>

                    </div>


                    {completed ? (

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">

                        <CheckCircle2
                          size={21}
                          className="text-emerald-500"
                        />

                      </div>

                    ) : playable ? (

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          items-center
                          justify-center
                          rounded-full
                          text-white
                          transition
                          group-hover:scale-110
                        "
                        style={{
                          backgroundColor:
                            theme.accent,
                        }}
                      >

                        <Play
                          size={14}
                          fill="currentColor"
                        />

                      </div>

                    ) : (

                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">

                        <LockKeyhole
                          size={17}
                          className="text-slate-400"
                        />

                      </div>

                    )}

                  </div>


                  <h4 className="mt-5 text-lg font-black leading-snug text-slate-900">
                    {
                      mission.title
                    }
                  </h4>


                  <p className="mt-2 line-clamp-2 min-h-[48px] text-sm font-medium leading-6 text-slate-500">
                    {
                      mission.prompt
                    }
                  </p>


                  <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">

                    <div>

                      <p className="text-[9px] font-black tracking-[0.12em] text-slate-300">
                        REWARD
                      </p>

                      <p className="mt-1 font-black text-amber-500">
                        +
                        {
                          mission.points
                        } WP
                      </p>

                    </div>


                    <span
                      className="text-[10px] font-black tracking-[0.11em]"
                      style={{
                        color:
                          completed
                            ? '#059669'
                            : playable
                              ? theme.dark
                              : '#94a3b8',
                      }}
                    >
                      {completed
                        ? 'CLEARED ✓'
                        : playable
                          ? 'PLAY →'
                          : 'COMING NEXT'}
                    </span>

                  </div>

                </button>
              );
            }
          )}

        </div>

      </div>


      {/* =====================================================
          BADGE JOURNEY
      ====================================================== */}

      <div
        className="
          mt-12
          overflow-hidden
          rounded-[30px]
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >

        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center md:p-8">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">

              <Trophy
                className="text-amber-500"
              />

            </div>

            <div>

              <p className="text-[9px] font-black tracking-[0.15em] text-amber-500">
                BADGE JOURNEY
              </p>

              <h3 className="mt-1 text-2xl font-black text-slate-900">
                冒険の記録
              </h3>

            </div>

          </div>


          <div className="flex items-center gap-3">

            <span className="text-3xl">
              {
                badgeMeta.icon
              }
            </span>

            <div>

              <p className="text-[9px] font-black text-slate-400">
                CURRENT
              </p>

              <p className="font-black text-slate-800">
                {
                  badgeMeta.label
                }
              </p>

            </div>

          </div>

        </div>


        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 md:grid-cols-5 md:p-7">

          {[
            [
              'stamp',
              '🌏',
            ],
            [
              'bronze',
              '🥉',
            ],
            [
              'silver',
              '🥈',
            ],
            [
              'gold',
              '🥇',
            ],
            [
              'diamond',
              '💎',
            ],
          ].map(
            ([
              badgeKey,
              icon,
            ]) => {
              const order = [
                'none',
                'stamp',
                'bronze',
                'silver',
                'gold',
                'diamond',
              ];

              const achieved =
                order.indexOf(
                  badge
                ) >=
                order.indexOf(
                  badgeKey
                );

              return (
                <div
                  key={
                    badgeKey
                  }
                  className={`
                    relative
                    overflow-hidden
                    rounded-2xl
                    border
                    p-4
                    transition
                    ${
                      achieved
                        ? 'border-amber-200 bg-gradient-to-br from-amber-50 to-white'
                        : 'border-slate-200 bg-slate-50'
                    }
                  `}
                >

                  {!achieved && (
                    <LockKeyhole
                      size={14}
                      className="absolute right-3 top-3 text-slate-300"
                    />
                  )}

                  <div
                    className={`
                      text-3xl
                      ${
                        achieved
                          ? ''
                          : 'grayscale opacity-40'
                      }
                    `}
                  >
                    {
                      icon
                    }
                  </div>

                  <p
                    className={`
                      mt-3
                      text-sm
                      font-black
                      ${
                        achieved
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }
                    `}
                  >
                    {
                      BADGE_META[
                        badgeKey
                      ].label
                    }
                  </p>

                  <p
                    className={`
                      mt-2
                      text-[9px]
                      font-black
                      tracking-[0.12em]
                      ${
                        achieved
                          ? 'text-amber-600'
                          : 'text-slate-300'
                      }
                    `}
                  >
                    {achieved
                      ? 'UNLOCKED'
                      : 'LOCKED'}
                  </p>

                </div>
              );
            }
          )}

        </div>

      </div>


      {/* =====================================================
          ACTIVE MISSION
      ====================================================== */}

      {activeMission && (

        <MissionPlayer
          key={
            activeMission.id
          }
          mission={
            activeMission
          }
          domain={
            domains.find(
              (domain) =>
                domain.id ===
                activeMission.domain
            )
          }
          alreadyCompleted={
            completedIds.has(
              activeMission.id
            )
          }
          onComplete={
            handleComplete
          }
          onClose={() => {
            playUiSound(
              'back'
            );

            setActiveMission(
              null
            );
          }}
        />

      )}

    </section>
  );
}