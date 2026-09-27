import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  Play,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';

import {
  useRef,
  useState,
} from 'react';

import {
  createPortal,
} from 'react-dom';

import {
  completeWorldMission,
  getCountryProgress,
} from '../../utils/worldProgressStorage';

import {
  playUiSound,
} from '../../utils/uiSound';

import MissionPlayer from './MissionPlayer';


/* =========================================================
   PLAYABLE MISSION TYPES
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
    accent: '#10b981',
    tint: '#ecfdf5',
    glow: 'rgba(16,185,129,0.18)',
  },
  {
    id: 'juniorHigh',
    profileKey: 'challenger',
    icon: '🧑',
    label: '中学生',
    labelEn: 'Junior High',
    description: '比べる・理由を考える',
    accent: '#2563eb',
    tint: '#eff6ff',
    glow: 'rgba(37,99,235,0.18)',
  },
  {
    id: 'highSchoolStandard',
    profileKey: 'globalBridge',
    icon: '🎓',
    label: '高校生',
    labelEn: 'High School',
    description: '日本語で世界の課題を深く考える',
    accent: '#7c3aed',
    tint: '#f5f3ff',
    glow: 'rgba(124,58,237,0.18)',
  },
  {
    id: 'highSchoolAdvanced',
    profileKey: 'globalExplorer',
    icon: '🚀',
    label: '高校生 Challenge',
    labelEn: 'High School Challenge',
    description: '英語を使って世界を探究する',
    accent: '#ec4899',
    tint: '#fdf2f8',
    glow: 'rgba(236,72,153,0.18)',
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
   DATA / THEMES
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
            letter.charCodeAt(0)
        )
    )
    .join('');
};

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

const DOMAIN_THEME = {
  place: {
    accent: '#10b981',
    dark: '#047857',
    soft: '#ecfdf5',
    border: '#a7f3d0',
    gradient:
      'linear-gradient(135deg,#059669 0%,#10b981 56%,#6ee7b7 100%)',
    label: 'EXPLORE THE MAP',
  },
  time: {
    accent: '#f59e0b',
    dark: '#b45309',
    soft: '#fffbeb',
    border: '#fde68a',
    gradient:
      'linear-gradient(135deg,#d97706 0%,#f59e0b 58%,#fde68a 100%)',
    label: 'TRAVEL THROUGH TIME',
  },
  language: {
    accent: '#8b5cf6',
    dark: '#6d28d9',
    soft: '#f5f3ff',
    border: '#ddd6fe',
    gradient:
      'linear-gradient(135deg,#6d28d9 0%,#8b5cf6 58%,#c4b5fd 100%)',
    label: 'USE YOUR VOICE',
  },
  lifeCulture: {
    accent: '#f97316',
    dark: '#c2410c',
    soft: '#fff7ed',
    border: '#fed7aa',
    gradient:
      'linear-gradient(135deg,#ea580c 0%,#f97316 58%,#fdba74 100%)',
    label: 'DISCOVER DAILY LIFE',
  },
  japanConnection: {
    accent: '#3b82f6',
    dark: '#1d4ed8',
    soft: '#eff6ff',
    border: '#bfdbfe',
    gradient:
      'linear-gradient(135deg,#1d4ed8 0%,#3b82f6 58%,#93c5fd 100%)',
    label: 'CONNECT WITH JAPAN',
  },
  thinkConnect: {
    accent: '#ec4899',
    dark: '#be185d',
    soft: '#fdf2f8',
    border: '#fbcfe8',
    gradient:
      'linear-gradient(135deg,#be185d 0%,#ec4899 58%,#f9a8d4 100%)',
    label: 'THINK & CONNECT',
  },
};

const DEFAULT_DOMAIN_THEME = {
  accent: '#64748b',
  dark: '#334155',
  soft: '#f8fafc',
  border: '#e2e8f0',
  gradient:
    'linear-gradient(135deg,#334155 0%,#64748b 58%,#cbd5e1 100%)',
  label: 'WORLD ADVENTURE',
};


/* =========================================================
   STEP HEADER
========================================================= */

function StepHeader({
  currentStep,
}) {
  const items = [
    {
      id: 1,
      label: 'レベル',
    },
    {
      id: 2,
      label: 'ゾーン',
    },
    {
      id: 3,
      label: 'ミッション',
    },
  ];

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-white/95 px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-lg font-black text-white shadow-lg shadow-blue-200/70">
          {currentStep}
        </div>

        <div>
          <p className="text-[9px] font-black tracking-[0.18em] text-blue-500">
            STEP {currentStep}
          </p>
          <p className="text-sm font-black text-slate-900 md:text-base">
            {currentStep === 1 && '学習レベルを選ぶ'}
            {currentStep === 2 && '冒険ゾーンを選ぶ'}
            {currentStep === 3 && 'ミッションを選ぶ'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {items.map(
          (item) => {
            const complete =
              item.id <
              currentStep;

            const active =
              item.id ===
              currentStep;

            return (
              <div
                key={item.id}
                className={`
                  flex
                  items-center
                  gap-1.5
                  rounded-full
                  px-2.5
                  py-1.5
                  text-[10px]
                  font-black
                  transition
                  md:px-3

                  ${
                    active
                      ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                      : complete
                        ? 'text-emerald-600'
                        : 'text-slate-300'
                  }
                `}
              >
                <span
                  className={`
                    flex
                    h-5
                    w-5
                    items-center
                    justify-center
                    rounded-full
                    text-[9px]

                    ${
                      active
                        ? 'bg-blue-600 text-white'
                        : complete
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-100 text-slate-400'
                    }
                  `}
                >
                  {complete ? (
                    <Check
                      size={12}
                      strokeWidth={3}
                    />
                  ) : (
                    item.id
                  )}
                </span>

                <span className="hidden sm:inline">
                  {item.label}
                </span>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}


/* =========================================================
   COUNTRY SUMMARY BAR
========================================================= */

function CountryBar({
  countryCode,
  countryNameEn,
  countryNameJa,
  flagUrl,
  selectedLevelMeta,
  selectedDomainMeta,
  selectedDomainTheme,
  onBack,
  backLabel,
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-white via-white to-blue-50/60 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-7">
      <div className="flex flex-wrap items-center gap-2.5">
        {flagUrl ? (
          <img
            src={flagUrl}
            alt={`${countryNameEn} flag`}
            className="h-8 w-12 rounded-md object-cover shadow-sm ring-1 ring-slate-200"
          />
        ) : (
          <span className="text-2xl">
            {makeFlagEmoji(
              countryCode
            )}
          </span>
        )}

        <div className="mr-2">
          <span className="font-black text-slate-900">
            {countryNameEn}
          </span>
          {countryNameJa && (
            <span className="ml-1.5 text-xs font-bold text-slate-400">
              {countryNameJa}
            </span>
          )}
        </div>

        {selectedLevelMeta && (
          <span
            className="rounded-full px-3 py-1.5 text-[10px] font-black"
            style={{
              backgroundColor:
                selectedLevelMeta.tint,
              color:
                selectedLevelMeta.accent,
            }}
          >
            {selectedLevelMeta.icon}{' '}
            {selectedLevelMeta.label}
          </span>
        )}

        {selectedDomainMeta && (
          <span
            className="rounded-full px-3 py-1.5 text-[10px] font-black"
            style={{
              backgroundColor:
                selectedDomainTheme.soft,
              color:
                selectedDomainTheme.dark,
            }}
          >
            {selectedDomainMeta.icon}{' '}
            {selectedDomainMeta.labelJa}
          </span>
        )}
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-2 text-xs font-black text-blue-600 transition hover:bg-blue-50"
        >
          <ArrowLeft
            size={14}
          />
          {backLabel}
        </button>
      )}
    </div>
  );
}


/* =========================================================
   MISSION CLEAR — GLOBAL GAME FEEDBACK
========================================================= */

const CLEAR_CONFETTI = Array.from(
  { length: 76 },
  (_, index) => ({
    id: index,
    left: `${(index * 43) % 100}%`,
    delay: `${(index % 12) * 0.035}s`,
    duration: `${1.45 + (index % 7) * 0.14}s`,
    drift: `${((index * 31) % 220) - 110}px`,
    spin: `${360 + (index % 6) * 150}deg`,
    size: `${6 + (index % 4) * 2}px`,
    color: [
      '#38bdf8',
      '#a78bfa',
      '#f472b6',
      '#fbbf24',
      '#34d399',
      '#fb7185',
      '#ffffff',
    ][index % 7],
  })
);

let missionClearAudioContext = null;

function playMissionClearSound(
  firstClear = true
) {
  if (
    typeof window === 'undefined'
  ) {
    return;
  }

  const AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext;

  if (!AudioContextClass) {
    return;
  }

  if (!missionClearAudioContext) {
    missionClearAudioContext =
      new AudioContextClass();
  }

  const context =
    missionClearAudioContext;

  const run = () => {
    const now =
      context.currentTime + 0.015;

    const master =
      context.createGain();

    master.gain.setValueAtTime(
      0.0001,
      now
    );

    master.gain.exponentialRampToValueAtTime(
      firstClear ? 0.095 : 0.065,
      now + 0.025
    );

    master.gain.exponentialRampToValueAtTime(
      0.0001,
      now + (firstClear ? 1.25 : 0.75)
    );

    master.connect(
      context.destination
    );

    const notes = firstClear
      ? [
          [523.25, 0.00, 0.20, 'sine'],
          [659.25, 0.10, 0.24, 'triangle'],
          [783.99, 0.21, 0.28, 'sine'],
          [1046.50, 0.36, 0.46, 'triangle'],
        ]
      : [
          [523.25, 0.00, 0.18, 'sine'],
          [659.25, 0.11, 0.24, 'triangle'],
        ];

    notes.forEach(
      ([frequency, offset, duration, type]) => {
        const oscillator =
          context.createOscillator();

        const gain =
          context.createGain();

        const start =
          now + offset;

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(
          frequency,
          start
        );

        gain.gain.setValueAtTime(
          0.0001,
          start
        );

        gain.gain.exponentialRampToValueAtTime(
          0.72,
          start + 0.025
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          start + duration
        );

        oscillator.connect(gain);
        gain.connect(master);

        oscillator.start(start);
        oscillator.stop(
          start + duration + 0.03
        );
      }
    );
  };

  if (
    context.state === 'suspended'
  ) {
    context.resume()
      .then(run)
      .catch(() => {});
  } else {
    run();
  }

  try {
    if (
      'vibrate' in navigator
    ) {
      navigator.vibrate(
        firstClear
          ? [35, 30, 80]
          : [30]
      );
    }
  } catch {
    // Vibration is optional.
  }
}

function MissionClearFX({
  data,
  hasNextMission,
  onNext,
  onBackToList,
  onDismiss,
}) {
  if (
    !data ||
    typeof document === 'undefined'
  ) {
    return null;
  }

  const firstClear =
    data.firstClear;

  return createPortal(
    <div
      className="fixed inset-0 z-[100300] flex items-center justify-center overflow-hidden bg-slate-950/72 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={
        firstClear
          ? 'Mission clear'
          : 'Review complete'
      }
    >
      <style>{`
        @keyframes tp-clear-flash {
          0% { opacity: 0; }
          18% { opacity: .92; }
          100% { opacity: 0; }
        }

        @keyframes tp-clear-card {
          0% {
            opacity: 0;
            transform: translateY(34px) scale(.68) rotate(-1deg);
          }
          58% {
            opacity: 1;
            transform: translateY(-8px) scale(1.045) rotate(.4deg);
          }
          78% {
            transform: translateY(2px) scale(.985);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes tp-clear-badge {
          0% { transform: scale(.2) rotate(-24deg); opacity: 0; }
          62% { transform: scale(1.16) rotate(5deg); opacity: 1; }
          82% { transform: scale(.94) rotate(-2deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }

        @keyframes tp-clear-ring {
          0% { transform: scale(.45); opacity: .85; }
          100% { transform: scale(2.2); opacity: 0; }
        }

        @keyframes tp-clear-rays {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes tp-clear-wp {
          0% { opacity: 0; transform: translateY(30px) scale(.7); }
          65% { opacity: 1; transform: translateY(-6px) scale(1.12); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes tp-clear-confetti {
          0% {
            opacity: 0;
            transform: translate3d(0,-12vh,0) rotate(0deg);
          }
          8% { opacity: 1; }
          100% {
            opacity: 0;
            transform:
              translate3d(var(--tp-drift),112vh,0)
              rotate(var(--tp-spin));
          }
        }

        @keyframes tp-clear-star {
          0%,100% { opacity: .25; transform: scale(.7) rotate(0); }
          50% { opacity: 1; transform: scale(1.2) rotate(12deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .tp-clear-animated,
          .tp-clear-confetti {
            animation: none !important;
          }
          .tp-clear-confetti,
          .tp-clear-flash-layer,
          .tp-clear-rays-layer {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="tp-clear-flash-layer pointer-events-none absolute inset-0 bg-white"
        style={{
          animation:
            'tp-clear-flash 520ms ease-out both',
        }}
      />

      {firstClear && (
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          {CLEAR_CONFETTI.map(
            (piece) => (
              <span
                key={piece.id}
                className="tp-clear-confetti absolute top-[-12vh] rounded-[2px]"
                style={{
                  left: piece.left,
                  width: piece.size,
                  height:
                    `${Number.parseInt(piece.size, 10) + 7}px`,
                  backgroundColor:
                    piece.color,
                  '--tp-drift':
                    piece.drift,
                  '--tp-spin':
                    piece.spin,
                  animation:
                    `tp-clear-confetti ${piece.duration} cubic-bezier(.2,.7,.3,1) ${piece.delay} both`,
                }}
              />
            )
          )}
        </div>
      )}

      <div
        className="tp-clear-animated relative w-full max-w-[590px] overflow-hidden rounded-[38px] border border-white/65 bg-white px-5 pb-6 pt-7 text-center shadow-[0_45px_130px_rgba(0,0,0,.48)] md:px-9 md:pb-8 md:pt-9"
        style={{
          animation:
            'tp-clear-card 720ms cubic-bezier(.16,1,.3,1) both',
        }}
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
          aria-label="Clear画面を閉じる"
        >
          <X size={17} />
        </button>

        <div
          className={`absolute inset-x-0 top-0 h-48 ${
            firstClear
              ? 'bg-gradient-to-b from-emerald-100 via-cyan-50 to-transparent'
              : 'bg-gradient-to-b from-blue-100 via-violet-50 to-transparent'
          }`}
        />

        {firstClear && (
          <div
            className="tp-clear-rays-layer pointer-events-none absolute left-1/2 top-[-125px] h-[390px] w-[390px] -translate-x-1/2 rounded-full opacity-25"
            style={{
              background:
                'repeating-conic-gradient(from 0deg, #fbbf24 0deg 7deg, transparent 7deg 18deg)',
              animation:
                'tp-clear-rays 10s linear infinite',
            }}
          />
        )}

        <div className="relative z-10">
          <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
            <span
              className={`tp-clear-animated absolute h-24 w-24 rounded-full ${
                firstClear
                  ? 'bg-emerald-300'
                  : 'bg-blue-300'
              }`}
              style={{
                animation:
                  'tp-clear-ring 1000ms 120ms ease-out both',
              }}
            />

            <div
              className={`tp-clear-animated relative z-10 flex h-24 w-24 items-center justify-center rounded-[30px] text-white shadow-2xl ${
                firstClear
                  ? 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-cyan-600 shadow-emerald-300/50'
                  : 'bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-blue-300/50'
              }`}
              style={{
                animation:
                  'tp-clear-badge 760ms 80ms cubic-bezier(.16,1,.3,1) both',
              }}
            >
              {firstClear ? (
                <Trophy
                  size={51}
                  strokeWidth={2.2}
                />
              ) : (
                <CheckCircle2
                  size={51}
                  strokeWidth={2.4}
                />
              )}
            </div>

            <Sparkles
              size={22}
              className="tp-clear-animated absolute -left-1 top-2 text-amber-400"
              style={{
                animation:
                  'tp-clear-star 900ms .22s ease-in-out 2',
              }}
            />
            <Sparkles
              size={18}
              className="tp-clear-animated absolute -right-1 bottom-6 text-fuchsia-400"
              style={{
                animation:
                  'tp-clear-star 820ms .38s ease-in-out 2',
              }}
            />
          </div>

          <p
            className={`mt-3 text-[11px] font-black tracking-[0.28em] ${
              firstClear
                ? 'text-emerald-600'
                : 'text-blue-600'
            }`}
          >
            {firstClear
              ? 'MISSION CLEAR!'
              : 'REVIEW COMPLETE!'}
          </p>

          <h2 className="mt-2 text-4xl font-black tracking-[-0.045em] text-slate-950 md:text-5xl">
            {firstClear
              ? 'Great Job!'
              : 'Nice Review!'}
          </h2>

          <p className="mx-auto mt-2 max-w-[430px] text-sm font-bold leading-6 text-slate-500 md:text-base">
            {data.title}
          </p>

          {firstClear ? (
            <div
              className="tp-clear-animated mt-5"
              style={{
                animation:
                  'tp-clear-wp 700ms 300ms cubic-bezier(.16,1,.3,1) both',
              }}
            >
              <p className="text-[10px] font-black tracking-[0.22em] text-amber-500">
                WORLD POINTS GET!
              </p>

              <div className="mt-[-2px] flex items-end justify-center gap-2">
                <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 bg-clip-text text-7xl font-black tracking-[-0.06em] text-transparent md:text-8xl">
                  +{data.points}
                </span>
                <span className="mb-2 text-xl font-black text-slate-400">
                  WP
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto mt-5 max-w-[420px] rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
              <p className="text-xs font-black tracking-[0.16em] text-blue-500">
                REVIEW MODE
              </p>
              <p className="mt-1 text-sm font-bold text-slate-600">
                復習クリア！ WPは初回クリア時のみ加算されます。
              </p>
            </div>
          )}

          {data.position &&
            data.total && (
              <div className="mx-auto mt-5 max-w-[360px]">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-400">
                  <span>ADVENTURE PROGRESS</span>
                  <span>
                    {data.position} / {data.total}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 transition-all duration-700"
                    style={{
                      width:
                        `${Math.min(100, (data.position / data.total) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

          <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-[.8fr_1.35fr]">
            <button
              type="button"
              onClick={onBackToList}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-600 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              Mission一覧
            </button>

            <button
              type="button"
              onClick={
                hasNextMission
                  ? onNext
                  : onBackToList
              }
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 px-5 py-4 text-base font-black text-white shadow-[0_16px_38px_rgba(79,70,229,.32)] transition hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(79,70,229,.42)]"
            >
              {hasNextMission
                ? '次のMissionへ'
                : 'Adventureへ戻る'}
              <ChevronRight
                size={21}
                className="transition group-hover:translate-x-1"
              />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


/* =========================================================
   COMPONENT
========================================================= */

export default function WorldMissionPanel({
  countryCode,
  fileLetter,
  countryNameEn: countryNameEnProp,
  countryNameJa = '',
  flagUrl = '',
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
    missionClear,
    setMissionClear,
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

  const countryNameEn =
    countryNameEnProp ||
    missionData.countryNameEn ||
    String(countryCode || '')
      .toUpperCase();

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

  const completedIds =
    new Set(
      progress?.completedMissionIds ??
        []
    );

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
        50
      );
    };

  const selectLearningLevel =
    (
      learningLevelId
    ) => {
      playUiSound('tap');
      setMissionClear(null);
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
      setMissionClear(null);
      setSelectedDomain(
        domainId
      );
      setActiveMission(null);
      moveToLauncher();
    };

  const goToLevel =
    () => {
      playUiSound('back');
      setMissionClear(null);
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
      setMissionClear(null);
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
      setMissionClear(null);
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
      setMissionClear(null);
      setActiveMission(
        mission
      );
    };

  const closeMissionToList =
    () => {
      playUiSound('back');
      setMissionClear(null);
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

      const firstClear =
        Boolean(
          result.isNewCompletion
        );

      playMissionClearSound(
        firstClear
      );

      setMissionClear({
        firstClear,
        points:
          Number(
            mission?.points ?? 0
          ),
        title:
          mission?.title ??
          'Mission Clear',
        position:
          activeMissionIndex >= 0
            ? activeMissionIndex + 1
            : null,
        total:
          visibleMissions.length ||
          null,
      });

      if (firstClear) {
        setProgressRevision(
          (value) =>
            value + 1
        );
      }
    };

  const goNextFromClear =
    () => {
      setMissionClear(null);

      if (nextActiveMission) {
        moveToAdjacentMission(
          nextActiveMission
        );
        return;
      }

      closeMissionToList();
    };

  const goBackFromClear =
    () => {
      setMissionClear(null);
      closeMissionToList();
    };

  return (
    <section
      ref={launcherRef}
      className="relative z-20 scroll-mt-5"
    >
      <div className="overflow-hidden rounded-[30px] border border-white/80 bg-white/95 shadow-[0_24px_70px_rgba(15,23,42,0.16)] ring-1 ring-slate-200/70 backdrop-blur-xl">
        <StepHeader
          currentStep={
            currentStep
          }
        />

        {/* =====================================================
            STEP 1 — LEVEL ONLY
        ====================================================== */}
        {currentStep === 1 && (
          <div className="p-5 md:p-7 lg:p-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-[10px] font-black tracking-[0.2em] text-blue-500">
                FIRST CHOICE
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 md:text-4xl">
                まず、学習レベルを選ぼう
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-500 md:text-base">
                ここでは1つ選ぶだけ。選んだレベルに合わせてMissionの問い方・教材・難しさが変わります。
              </p>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {LEARNING_LEVELS.map(
                (level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() =>
                      selectLearningLevel(
                        level.id
                      )
                    }
                    className="group relative min-h-[220px] overflow-hidden rounded-[26px] border p-5 text-left transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.01] hover:shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                    style={{
                      background:
                        `linear-gradient(180deg, #ffffff 0%, ${level.tint} 100%)`,
                      borderColor:
                        `${level.accent}33`,
                      boxShadow:
                        `0 18px 44px ${level.glow}`,
                    }}
                  >
                    <div
                      className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full blur-2xl"
                      style={{
                        backgroundColor:
                          `${level.accent}18`,
                      }}
                    />

                    <div className="relative flex h-full flex-col">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-sm"
                        style={{
                          backgroundColor:
                            `${level.accent}16`,
                        }}
                      >
                        {level.icon}
                      </div>

                      <div className="mt-5">
                        <p className="text-xl font-black text-slate-950">
                          {level.label}
                        </p>
                        <p className="mt-1 text-[10px] font-black tracking-[0.1em] text-slate-400">
                          {level.labelEn}
                        </p>
                        <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
                          {level.description}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center justify-end pt-5">
                        <span
                          className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110"
                          style={{
                            backgroundColor:
                              level.accent,
                          }}
                        >
                          <ChevronRight
                            size={21}
                            strokeWidth={2.6}
                          />
                        </span>
                      </div>
                    </div>
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* =====================================================
            STEP 2 — ZONES ONLY
        ====================================================== */}
        {currentStep === 2 && (
          <div>
            <CountryBar
              countryCode={
                countryCode
              }
              countryNameEn={
                countryNameEn
              }
              countryNameJa={
                countryNameJa
              }
              flagUrl={
                flagUrl
              }
              selectedLevelMeta={
                selectedLevelMeta
              }
              selectedDomainMeta={
                null
              }
              selectedDomainTheme={
                DEFAULT_DOMAIN_THEME
              }
              onBack={
                goToLevel
              }
              backLabel="レベルを変更する"
            />

            <div className="p-5 md:p-7 lg:p-8">
              <div className="mb-6">
                <p className="text-[10px] font-black tracking-[0.2em] text-violet-500">
                  CHOOSE YOUR ADVENTURE
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 md:text-4xl">
                  どのゾーンから始める？
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  気になるテーマを1つ選んで、{countryNameEn}について深く学ぼう。
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {domains.map(
                  (
                    domain
                  ) => {
                    const theme =
                      DOMAIN_THEME[
                        domain.id
                      ] ??
                      DEFAULT_DOMAIN_THEME;

                    const domainMissions =
                      missions.filter(
                        (mission) =>
                          mission.domain ===
                          domain.id
                      );

                    const completeCount =
                      domainMissions.filter(
                        (mission) =>
                          completedIds.has(
                            mission.id
                          )
                      ).length;

                    return (
                      <button
                        key={domain.id}
                        type="button"
                        onClick={() =>
                          selectDomain(
                            domain.id
                          )
                        }
                        className="group relative min-h-[190px] overflow-hidden rounded-[28px] p-6 text-left text-white shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                        style={{
                          background:
                            theme.gradient,
                        }}
                      >
                        <div className="pointer-events-none absolute -right-7 -top-8 text-[118px] font-black leading-none text-white/10">
                          {domain.icon}
                        </div>

                        <div className="relative flex h-full flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/20 text-2xl shadow-inner backdrop-blur">
                              {domain.icon}
                            </div>

                            <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[9px] font-black backdrop-blur">
                              {completeCount} / {domainMissions.length}
                            </span>
                          </div>

                          <div className="mt-auto pt-6">
                            <p className="text-[9px] font-black tracking-[0.15em] text-white/70">
                              {theme.label}
                            </p>
                            <p className="mt-1 text-2xl font-black tracking-[-0.03em]">
                              {domain.labelJa}
                            </p>
                            <p className="mt-1 text-xs font-bold text-white/75">
                              {domain.labelEn}
                            </p>
                          </div>

                          <span className="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110">
                            <ChevronRight
                              size={21}
                              strokeWidth={2.6}
                            />
                          </span>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================
            STEP 3 — MISSIONS ONLY
        ====================================================== */}
        {currentStep === 3 && (
          <div>
            <CountryBar
              countryCode={
                countryCode
              }
              countryNameEn={
                countryNameEn
              }
              countryNameJa={
                countryNameJa
              }
              flagUrl={
                flagUrl
              }
              selectedLevelMeta={
                selectedLevelMeta
              }
              selectedDomainMeta={
                selectedDomainMeta
              }
              selectedDomainTheme={
                selectedDomainTheme
              }
              onBack={
                goToZone
              }
              backLabel="ゾーンを変更する"
            />

            <div className="p-5 md:p-7 lg:p-8">
              <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p
                    className="text-[10px] font-black tracking-[0.2em]"
                    style={{
                      color:
                        selectedDomainTheme.accent,
                    }}
                  >
                    CHOOSE A MISSION
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-slate-950 md:text-4xl">
                    Missionを選ぼう
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    「{selectedDomainMeta?.labelJa}」について、{visibleMissions.length}個のMissionがあります。
                  </p>
                </div>

                <div className="text-xs font-black text-slate-400">
                  {visibleMissions.length} MISSIONS
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

                    const recommended =
                      recommendedMission?.id ===
                      mission.id;

                    return (
                      <button
                        key={mission.id}
                        type="button"
                        disabled={!playable}
                        onClick={() =>
                          openMission(
                            mission
                          )
                        }
                        className={`
                          group
                          relative
                          min-h-[230px]
                          overflow-hidden
                          rounded-[26px]
                          border
                          bg-white
                          p-5
                          text-left
                          transition-all
                          duration-300
                          focus:outline-none
                          focus-visible:ring-4
                          focus-visible:ring-blue-200

                          ${
                            playable
                              ? 'hover:-translate-y-1.5 hover:shadow-2xl'
                              : 'cursor-not-allowed opacity-55'
                          }

                          ${
                            completed
                              ? 'border-emerald-200'
                              : recommended
                                ? 'border-blue-400 shadow-lg ring-2 ring-blue-100'
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
                                : selectedDomainTheme.accent,
                          }}
                        />

                        {recommended &&
                          !completed && (
                            <div className="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1.5 text-[9px] font-black tracking-[0.08em] text-white shadow-md">
                              NEXT
                            </div>
                          )}

                        <div className="flex items-start justify-between gap-3">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                            style={{
                              backgroundColor:
                                selectedDomainTheme.soft,
                            }}
                          >
                            {selectedDomainMeta?.icon}
                          </div>

                          {completed ? (
                            <CheckCircle2
                              size={25}
                              className="text-emerald-500"
                            />
                          ) : !playable ? (
                            <LockKeyhole
                              size={21}
                              className="text-slate-300"
                            />
                          ) : null}
                        </div>

                        <p
                          className="mt-5 text-[10px] font-black tracking-[0.12em]"
                          style={{
                            color:
                              selectedDomainTheme.accent,
                          }}
                        >
                          {getMissionNumber(
                            mission.id
                          )}
                        </p>

                        <h3 className="mt-2 text-xl font-black leading-snug text-slate-950">
                          {mission.title}
                        </h3>

                        <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
                          {mission.prompt}
                        </p>

                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-black text-amber-600">
                            +{mission.points} WP
                          </span>

                          {playable && (
                            <span
                              className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md transition-all duration-300 group-hover:translate-x-1 group-hover:scale-110"
                              style={{
                                backgroundColor:
                                  completed
                                    ? '#10b981'
                                    : selectedDomainTheme.accent,
                              }}
                            >
                              <Play
                                size={15}
                                fill="currentColor"
                              />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <MissionClearFX
        data={missionClear}
        hasNextMission={
          Boolean(
            nextActiveMission
          )
        }
        onNext={
          goNextFromClear
        }
        onBackToList={
          goBackFromClear
        }
        onDismiss={() =>
          setMissionClear(
            null
          )
        }
      />

      {activeMission && (
        <MissionPlayer
          key={`${activeMission.id}-${selectedLearningLevel}`}
          mission={activeMission}
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
