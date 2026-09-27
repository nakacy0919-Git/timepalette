import {
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  Play,
  Sparkles,
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
  'source-quest',
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
      mission?.challenge?.choices
    ) &&
    typeof mission?.challenge?.correctIndex ===
      'number';

  return (
    hasChoiceChallenge ||
    INTERACTIVE_MISSION_TYPES.has(
      mission?.type
    )
  );
};


/* =========================================================
   LEARNING LEVELS
========================================================= */

const LEARNING_LEVELS = [
  {
    id: 'elementary',
    profileKey: 'explorer',
    icon: '🧒',
    label: '小学生',
    labelEn: 'Elementary',
    description: '見る・選ぶ・発見する',
  },
  {
    id: 'juniorHigh',
    profileKey: 'challenger',
    icon: '🧑',
    label: '中学生',
    labelEn: 'Junior High',
    description: '比べる・理由を考える',
  },
  {
    id: 'highSchoolStandard',
    profileKey: 'globalBridge',
    icon: '🎓',
    label: '高校生',
    labelEn: 'High School',
    description: '日本語で世界の課題を深く考える',
  },
  {
    id: 'highSchoolAdvanced',
    profileKey: 'globalExplorer',
    icon: '🚀',
    label: '高校生 Challenge',
    labelEn: 'High School Challenge',
    description: '英語を使って世界を探究する',
  },
];


const getLearningLevelMeta = (
  learningLevelId
) =>
  LEARNING_LEVELS.find(
    (level) =>
      level.id ===
      learningLevelId
  ) ??
  LEARNING_LEVELS[2];


const applyLearningLevelToMission = (
  mission,
  learningLevelId
) => {
  if (!learningLevelId) {
    return mission;
  }

  const level =
    getLearningLevelMeta(
      learningLevelId
    );

  const variant =
    mission?.variants?.[
      learningLevelId
    ];

  if (variant) {
    return {
      ...mission,
      ...variant,
      id: mission.id,
      domain: mission.domain,
      points: mission.points,
      requiredForMastery:
        mission.requiredForMastery,
      learningLevelId,
      learningLevelLabel:
        level.label,
    };
  }

  const profile =
    mission?.difficultyProfiles?.[
      level.profileKey
    ];

  if (!profile) {
    return {
      ...mission,
      learningLevelId,
      learningLevelLabel:
        level.label,
    };
  }

  return {
    ...mission,
    title:
      profile.title ??
      mission.title,
    prompt:
      profile.prompt ??
      mission.prompt,
    defaultDifficulty:
      level.profileKey,
    difficultyProfiles: {
      [level.profileKey]:
        profile,
    },
    learningLevelId,
    learningLevelLabel:
      level.label,
  };
};


/* =========================================================
   HELPERS
========================================================= */

const getMissionNumber = (
  missionId
) => {
  const match =
    String(
      missionId ?? ''
    ).match(
      /-m(\d+)$/i
    );

  if (!match) {
    return 'MISSION';
  }

  return `M${String(
    match[1]
  ).padStart(
    2,
    '0'
  )}`;
};


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


const BADGE_META = {
  none: {
    icon: '🌍',
    label: 'Start Exploring',
    labelJa: '冒険を始めよう',
  },
  stamp: {
    icon: '🌏',
    label: 'Explorer Stamp',
    labelJa: '探索スタンプ',
  },
  bronze: {
    icon: '🥉',
    label: 'Explorer Badge',
    labelJa: 'エクスプローラー',
  },
  silver: {
    icon: '🥈',
    label: 'Discovery Badge',
    labelJa: 'ディスカバリー',
  },
  gold: {
    icon: '🥇',
    label: 'Country Master',
    labelJa: 'カントリーマスター',
  },
  diamond: {
    icon: '💎',
    label: 'Connector Badge',
    labelJa: 'コネクター',
  },
};


const DOMAIN_THEME = {
  place: {
    accent: '#10b981',
    dark: '#047857',
    soft: '#ecfdf5',
    border: '#a7f3d0',
    label: 'EXPLORE THE MAP',
  },
  time: {
    accent: '#f59e0b',
    dark: '#b45309',
    soft: '#fffbeb',
    border: '#fde68a',
    label: 'TRAVEL THROUGH TIME',
  },
  language: {
    accent: '#8b5cf6',
    dark: '#6d28d9',
    soft: '#f5f3ff',
    border: '#ddd6fe',
    label: 'USE YOUR VOICE',
  },
  lifeCulture: {
    accent: '#f97316',
    dark: '#c2410c',
    soft: '#fff7ed',
    border: '#fed7aa',
    label: 'DISCOVER DAILY LIFE',
  },
  japanConnection: {
    accent: '#3b82f6',
    dark: '#1d4ed8',
    soft: '#eff6ff',
    border: '#bfdbfe',
    label: 'CONNECT WITH JAPAN',
  },
  thinkConnect: {
    accent: '#ec4899',
    dark: '#be185d',
    soft: '#fdf2f8',
    border: '#fbcfe8',
    label: 'THINK & CONNECT',
  },
};


const DEFAULT_DOMAIN_THEME = {
  accent: '#64748b',
  dark: '#334155',
  soft: '#f8fafc',
  border: '#e2e8f0',
  label: 'WORLD ADVENTURE',
};


const getDomainCounts = (
  missionData,
  completedIds
) => {
  const counts = {};

  const domains =
    missionData?.design?.domains ??
    [];

  domains.forEach(
    (domain) => {
      counts[
        domain.id
      ] = 0;
    }
  );

  (
    missionData?.missions ??
    []
  ).forEach(
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
          ) >=
          minimum
      );

    if (!allDomainsClear) {
      return false;
    }
  }

  if (
    rule.requiredMissionIds
  ) {
    const allRequiredClear =
      rule.requiredMissionIds.every(
        (missionId) =>
          completedIds.has(
            missionId
          )
      );

    if (!allRequiredClear) {
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
    missionData?.badgeRules ??
    {};

  const shared = {
    completedCount,
    totalPoints,
    domainCounts,
    completedIds,
  };

  if (
    qualifiesForRule({
      rule: rules.diamond,
      ...shared,
    })
  ) {
    return 'diamond';
  }

  if (
    qualifiesForRule({
      rule: rules.gold,
      ...shared,
    })
  ) {
    return 'gold';
  }

  if (
    qualifiesForRule({
      rule: rules.silver,
      ...shared,
    })
  ) {
    return 'silver';
  }

  if (
    qualifiesForRule({
      rule: rules.bronze,
      ...shared,
    })
  ) {
    return 'bronze';
  }

  if (
    qualifiesForRule({
      rule: rules.stamp,
      ...shared,
    })
  ) {
    return 'stamp';
  }

  return 'none';
};


/* =========================================================
   STEP INDICATOR
========================================================= */

function StepIndicator({
  currentStep,
  selectedLearningLevel,
  selectedDomain,
  onGoLevel,
  onGoZone,
}) {
  const steps = [
    {
      number: 1,
      label: 'LEVEL',
      labelJa: '学習レベル',
      enabled: true,
      onClick: onGoLevel,
    },
    {
      number: 2,
      label: 'ZONE',
      labelJa: '冒険ゾーン',
      enabled:
        Boolean(
          selectedLearningLevel
        ),
      onClick: onGoZone,
    },
    {
      number: 3,
      label: 'MISSION',
      labelJa: 'ミッション',
      enabled:
        Boolean(
          selectedLearningLevel &&
          selectedDomain
        ),
      onClick: null,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 rounded-[22px] border border-slate-200 bg-white p-2 shadow-sm">
      {steps.map(
        (step) => {
          const active =
            currentStep ===
            step.number;

          const complete =
            currentStep >
            step.number;

          return (
            <button
              key={
                step.number
              }
              type="button"
              disabled={
                !step.enabled ||
                !step.onClick
              }
              onClick={
                step.onClick ??
                undefined
              }
              className={`
                flex
                min-w-0
                items-center
                gap-3
                rounded-2xl
                px-3
                py-3
                text-left
                transition
                md:px-4

                ${
                  active
                    ? 'bg-slate-950 text-white shadow-lg'
                    : complete
                      ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                      : 'bg-slate-50 text-slate-400'
                }

                ${
                  step.enabled &&
                  step.onClick
                    ? 'cursor-pointer'
                    : 'cursor-default'
                }
              `}
            >
              <span
                className={`
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  text-xs
                  font-black

                  ${
                    active
                      ? 'bg-white text-slate-950'
                      : complete
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-400'
                  }
                `}
              >
                {complete ? '✓' : step.number}
              </span>

              <span className="min-w-0">
                <span className="block text-[9px] font-black tracking-[0.14em] opacity-70">
                  {step.label}
                </span>
                <span className="mt-0.5 block truncate text-xs font-black md:text-sm">
                  {step.labelJa}
                </span>
              </span>
            </button>
          );
        }
      )}
    </div>
  );
}


/* =========================================================
   COMPONENT
========================================================= */

export default function WorldMissionPanel({
  countryCode,
  fileLetter,
}) {
  const launcherRef =
    useRef(null);

  const [
    selectedLearningLevel,
    setSelectedLearningLevel,
  ] = useState(null);

  const [
    selectedDomain,
    setSelectedDomain,
  ] = useState(null);

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

  const rawMissions =
    missionData.missions ??
    [];

  const missions =
    rawMissions.map(
      (mission) =>
        applyLearningLevelToMission(
          mission,
          selectedLearningLevel
        )
    );

  const domains =
    missionData?.design?.domains ??
    [];

  const selectedLevelMeta =
    selectedLearningLevel
      ? getLearningLevelMeta(
          selectedLearningLevel
        )
      : null;

  const completedIds =
    new Set(
      progress?.completedMissionIds ??
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

  const selectedDomainMeta =
    domains.find(
      (domain) =>
        domain.id ===
        selectedDomain
    ) ??
    null;

  const selectedDomainTheme =
    selectedDomainMeta
      ? DOMAIN_THEME[
          selectedDomainMeta.id
        ] ??
        DEFAULT_DOMAIN_THEME
      : DEFAULT_DOMAIN_THEME;

  const visibleMissions =
    selectedDomain
      ? missions.filter(
          (mission) =>
            mission.domain ===
            selectedDomain
        )
      : [];

  const recommendedMission =
    visibleMissions.find(
      (mission) =>
        !completedIds.has(
          mission.id
        ) &&
        isMissionPlayable(
          mission
        )
    ) ??
    visibleMissions.find(
      (mission) =>
        isMissionPlayable(
          mission
        )
    ) ??
    null;

  const currentStep =
    !selectedLearningLevel
      ? 1
      : !selectedDomain
        ? 2
        : 3;

  const activeMissionIndex =
    activeMission
      ? visibleMissions.findIndex(
          (mission) =>
            mission.id ===
            activeMission.id
        )
      : -1;

  const previousActiveMission =
    activeMissionIndex > 0
      ? visibleMissions[
          activeMissionIndex - 1
        ]
      : null;

  const nextActiveMission =
    activeMissionIndex >= 0 &&
    activeMissionIndex <
      visibleMissions.length - 1
      ? visibleMissions[
          activeMissionIndex + 1
        ]
      : null;

  const moveToLauncher =
    () => {
      window.setTimeout(
        () => {
          launcherRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        },
        40
      );
    };

  const selectLearningLevel =
    (
      learningLevelId
    ) => {
      playUiSound('tap');
      setSelectedLearningLevel(
        learningLevelId
      );
      setSelectedDomain(null);
      setActiveMission(null);
      moveToLauncher();
    };

  const selectDomain =
    (
      domainId
    ) => {
      playUiSound('tap');
      setSelectedDomain(
        domainId
      );
      setActiveMission(null);
      moveToLauncher();
    };

  const goToLevel =
    () => {
      playUiSound('back');
      setSelectedLearningLevel(null);
      setSelectedDomain(null);
      setActiveMission(null);
      moveToLauncher();
    };

  const goToZone =
    () => {
      if (!selectedLearningLevel) {
        return;
      }

      playUiSound('back');
      setSelectedDomain(null);
      setActiveMission(null);
      moveToLauncher();
    };

  const openMission =
    (
      mission
    ) => {
      if (
        !isMissionPlayable(
          mission
        )
      ) {
        return;
      }

      playUiSound('open');
      setActiveMission(
        mission
      );
    };

  const moveToAdjacentMission =
    (
      mission
    ) => {
      if (!mission) {
        return;
      }

      playUiSound('open');
      setActiveMission(
        mission
      );
    };

  const closeMissionToList =
    () => {
      playUiSound('back');
      setActiveMission(null);
      moveToLauncher();
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

      playUiSound('success');

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
          COMPACT DASHBOARD
      ====================================================== */}

      <div
        className="
          relative
          overflow-hidden
          rounded-[32px]
          bg-gradient-to-br
          from-slate-950
          via-blue-950
          to-violet-950
          text-white
          shadow-[0_24px_70px_rgba(15,23,42,0.20)]
        "
      >
        <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-[-5%] h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative grid gap-6 p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-9">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-[9px] font-black tracking-[0.16em] text-blue-200 backdrop-blur">
                <Sparkles size={14} />
                WORLD ADVENTURE
              </span>

              <span className="rounded-full border border-white/15 bg-white/5 px-3.5 py-2 text-[9px] font-black tracking-[0.12em] text-white/60">
                {makeFlagEmoji(
                  countryCode
                )}{' '}
                {missionData.countryNameEn}
              </span>
            </div>

            <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] md:text-4xl">
              3ステップで冒険を始めよう
            </h2>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/60">
              学習レベルを選ぶ → Adventure Zoneを選ぶ → Missionを始める。
              今やることだけを順番に表示します。
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <span className="rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-black">
                {completedCount} / {totalMissions} Missions
              </span>
              <span className="rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-black text-amber-300">
                {totalPoints} / {missionData.maxWorldPoints} WP
              </span>
              <span className="rounded-xl border border-white/10 bg-white/10 px-3.5 py-2 text-xs font-black text-cyan-300">
                {missionPercent}% Complete
              </span>
            </div>

            <div className="mt-4 max-w-2xl">
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 transition-all duration-700"
                  style={{
                    width:
                      `${missionPercent}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex min-w-[210px] items-center justify-between gap-4 rounded-[24px] border border-white/15 bg-white/10 p-4 backdrop-blur-xl lg:block lg:text-center">
            <div>
              <p className="text-[9px] font-black tracking-[0.15em] text-blue-200">
                CURRENT BADGE
              </p>
              <p className="mt-2 text-base font-black">
                {badgeMeta.label}
              </p>
              <p className="mt-1 text-[11px] font-bold text-white/45">
                {badgeMeta.labelJa}
              </p>
            </div>

            <div className="text-4xl lg:mt-4 lg:text-5xl">
              {badgeMeta.icon}
            </div>
          </div>
        </div>
      </div>


      {/* =====================================================
          3-STEP LAUNCHER
      ====================================================== */}

      <div
        ref={
          launcherRef
        }
        className="mt-7 scroll-mt-5"
      >
        <StepIndicator
          currentStep={
            currentStep
          }
          selectedLearningLevel={
            selectedLearningLevel
          }
          selectedDomain={
            selectedDomain
          }
          onGoLevel={
            currentStep > 1
              ? goToLevel
              : null
          }
          onGoZone={
            currentStep > 2
              ? goToZone
              : null
          }
        />

        <div
          className="
            mt-4
            overflow-hidden
            rounded-[30px]
            border
            border-slate-200
            bg-gradient-to-br
            from-white
            to-slate-50
            shadow-sm
          "
        >

          {/* =================================================
              STEP 1 / LEVEL
          ================================================== */}

          {currentStep === 1 && (
            <div className="p-5 md:p-7">
              <div className="mb-6">
                <p className="text-[10px] font-black tracking-[0.18em] text-blue-500">
                  STEP 1 · YOUR LEARNING LEVEL
                </p>
                <h3 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
                  まず、学習レベルを選ぼう
                </h3>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  選んだレベルに合わせてMissionの内容・問い・教材が変わります。
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {LEARNING_LEVELS.map(
                  (level) => (
                    <button
                      key={
                        level.id
                      }
                      type="button"
                      onClick={() =>
                        selectLearningLevel(
                          level.id
                        )
                      }
                      className="group relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-xl"
                    >
                      <div className="text-3xl">
                        {level.icon}
                      </div>

                      <p className="mt-4 text-lg font-black text-slate-900">
                        {level.label}
                      </p>

                      <p className="mt-1 text-[9px] font-black tracking-[0.1em] text-slate-400">
                        {level.labelEn}
                      </p>

                      <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                        {level.description}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                        <span className="text-[10px] font-black tracking-[0.1em] text-blue-600">
                          SELECT LEVEL
                        </span>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white transition-transform group-hover:translate-x-1">
                          →
                        </span>
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          )}


          {/* =================================================
              STEP 2 / ZONE
          ================================================== */}

          {currentStep === 2 && (
            <div className="p-5 md:p-7">
              <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-[10px] font-black tracking-[0.18em] text-blue-500">
                    STEP 2 · ADVENTURE ZONE
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
                    次に、冒険する分野を選ぼう
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    6つのZoneから1つ選ぶと、そのZoneのMissionだけが表示されます。
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={
                      goToLevel
                    }
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowLeft size={14} />
                    レベルを変更
                  </button>

                  <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">
                    {selectedLevelMeta?.icon}{' '}
                    {selectedLevelMeta?.label}
                  </span>
                </div>
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
                        className="group relative overflow-hidden rounded-[26px] border p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        style={{
                          backgroundColor:
                            theme.soft,
                          borderColor:
                            theme.border,
                        }}
                      >
                        <div
                          className="pointer-events-none absolute -right-2 -top-5 text-[88px] font-black leading-none opacity-[0.07]"
                          style={{
                            color:
                              theme.accent,
                          }}
                        >
                          {String(
                            domainIndex + 1
                          ).padStart(
                            2,
                            '0'
                          )}
                        </div>

                        <div className="relative">
                          <div className="flex items-start justify-between gap-3">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl text-white shadow-sm"
                              style={{
                                backgroundColor:
                                  theme.accent,
                              }}
                            >
                              {domain.icon}
                            </div>

                            <span
                              className="rounded-full px-3 py-1 text-[9px] font-black tracking-[0.1em]"
                              style={{
                                backgroundColor:
                                  `${theme.accent}18`,
                                color:
                                  theme.dark,
                              }}
                            >
                              {domainComplete} / {domainTotal}
                            </span>
                          </div>

                          <p
                            className="mt-5 text-[9px] font-black tracking-[0.15em]"
                            style={{
                              color:
                                theme.accent,
                            }}
                          >
                            {theme.label}
                          </p>

                          <h4 className="mt-1 text-lg font-black text-slate-900">
                            {domain.labelJa}
                          </h4>

                          <p className="mt-1 text-xs font-bold text-slate-400">
                            {domain.labelEn}
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
                              {domainPercent}%
                            </span>
                            <span
                              className="text-[10px] font-black tracking-[0.1em] transition-transform group-hover:translate-x-1"
                              style={{
                                color:
                                  theme.dark,
                              }}
                            >
                              SELECT →
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}


          {/* =================================================
              STEP 3 / MISSIONS
          ================================================== */}

          {currentStep === 3 && (
            <div className="p-5 md:p-7">
              <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <p className="text-[10px] font-black tracking-[0.18em] text-blue-500">
                    STEP 3 · CHOOSE A MISSION
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900 md:text-3xl">
                    {selectedDomainMeta?.labelJa}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    このZoneのMissionから1つ選んで始めよう。
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={
                      goToZone
                    }
                    className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"
                  >
                    <ArrowLeft size={14} />
                    Zoneを変更
                  </button>

                  <button
                    type="button"
                    onClick={
                      goToLevel
                    }
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-500 hover:bg-slate-50"
                  >
                    {selectedLevelMeta?.icon}{' '}
                    {selectedLevelMeta?.label}
                  </button>
                </div>
              </div>

              {recommendedMission && (
                <div
                  className="relative mb-6 overflow-hidden rounded-[26px] border p-5 md:p-6"
                  style={{
                    backgroundColor:
                      selectedDomainTheme.soft,
                    borderColor:
                      selectedDomainTheme.border,
                  }}
                >
                  <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                    <div>
                      <p
                        className="text-[10px] font-black tracking-[0.15em]"
                        style={{
                          color:
                            selectedDomainTheme.dark,
                        }}
                      >
                        NEXT RECOMMENDED MISSION
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-black"
                          style={{
                            backgroundColor:
                              `${selectedDomainTheme.accent}18`,
                            color:
                              selectedDomainTheme.dark,
                          }}
                        >
                          {getMissionNumber(
                            recommendedMission.id
                          )}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-amber-600 shadow-sm">
                          +{recommendedMission.points} WP
                        </span>
                      </div>

                      <h4 className="mt-3 text-xl font-black text-slate-900 md:text-2xl">
                        {recommendedMission.title}
                      </h4>

                      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
                        {recommendedMission.prompt}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        openMission(
                          recommendedMission
                        )
                      }
                      className="group flex min-w-[210px] items-center justify-between gap-5 rounded-2xl bg-slate-950 px-5 py-4 text-left text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-700"
                    >
                      <span>
                        <span className="block text-[9px] font-black tracking-[0.13em] text-white/50">
                          START NOW
                        </span>
                        <span className="mt-1 block text-sm font-black">
                          このMissionを始める
                        </span>
                      </span>

                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-950 transition-transform group-hover:scale-105">
                        <Play
                          size={15}
                          fill="currentColor"
                        />
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-black text-slate-400">
                  {visibleMissions.length} MISSIONS IN THIS ZONE
                </p>

                <span
                  className="rounded-full px-3 py-1.5 text-[10px] font-black"
                  style={{
                    backgroundColor:
                      `${selectedDomainTheme.accent}14`,
                    color:
                      selectedDomainTheme.dark,
                  }}
                >
                  {selectedDomainMeta?.labelEn}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {visibleMissions.map(
                  (mission) => {
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

                    const isRecommended =
                      recommendedMission?.id ===
                      mission.id;

                    return (
                      <button
                        key={
                          mission.id
                        }
                        type="button"
                        disabled={
                          !playable
                        }
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

                          ${
                            playable
                              ? 'hover:-translate-y-1 hover:shadow-xl'
                              : 'cursor-not-allowed opacity-65'
                          }

                          ${
                            completed
                              ? 'border-emerald-200'
                              : isRecommended
                                ? 'border-blue-300 shadow-md ring-2 ring-blue-100'
                                : 'border-slate-200'
                          }
                        `}
                      >
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
                              className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                              style={{
                                backgroundColor:
                                  theme.soft,
                              }}
                            >
                              {domain?.icon}
                            </span>

                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.08em]"
                                  style={{
                                    backgroundColor:
                                      `${theme.accent}14`,
                                    color:
                                      theme.dark,
                                  }}
                                >
                                  {getMissionNumber(
                                    mission.id
                                  )}
                                </span>

                                {isRecommended &&
                                  !completed && (
                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black text-blue-600">
                                      NEXT
                                    </span>
                                  )}
                              </div>

                              <p
                                className="mt-2 text-[9px] font-black tracking-[0.12em]"
                                style={{
                                  color:
                                    theme.accent,
                                }}
                              >
                                {domain?.labelEn}
                              </p>
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
                              className="flex h-9 w-9 items-center justify-center rounded-full text-white transition group-hover:scale-110"
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
                          {mission.title}
                        </h4>

                        <p className="mt-2 line-clamp-2 min-h-[48px] text-sm font-medium leading-6 text-slate-500">
                          {mission.prompt}
                        </p>

                        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
                          <div>
                            <p className="text-[9px] font-black tracking-[0.12em] text-slate-300">
                              REWARD
                            </p>
                            <p className="mt-1 font-black text-amber-500">
                              +{mission.points} WP
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
                              ? 'REVIEW →'
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
          )}
        </div>
      </div>


      {/* =====================================================
          ACTIVE MISSION
      ====================================================== */}

      {activeMission && (
        <MissionPlayer
          key={
            `${activeMission.id}-${selectedLearningLevel}`
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
          previousMission={
            previousActiveMission
          }
          nextMission={
            nextActiveMission
          }
          missionPosition={
            activeMissionIndex >= 0
              ? activeMissionIndex + 1
              : null
          }
          totalMissions={
            visibleMissions.length
          }
          onPreviousMission={
            moveToAdjacentMission
          }
          onNextMission={
            moveToAdjacentMission
          }
          onBackToList={
            closeMissionToList
          }
          onClose={
            closeMissionToList
          }
        />
      )}
    </section>
  );
}
