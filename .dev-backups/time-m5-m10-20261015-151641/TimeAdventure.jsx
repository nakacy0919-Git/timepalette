import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LockKeyhole,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import timeData
  from '../../../data/world-adventure/time/time_r.json';

import {
  completeWorldAdventureMission,
  getWorldAdventureDomainProgress,
} from '../../../utils/worldAdventureProgress';

import TimeMissionRouter
  from './TimeMissionRouter';


const LEVEL_META = {
  elementary: {
    icon: '🧒',
    label: '小学生',
  },

  juniorHigh: {
    icon: '🧑',
    label: '中学生',
  },

  highSchoolStandard: {
    icon: '🎓',
    label: '高校生',
  },

  highSchoolAdvanced: {
    icon: '🚀',
    label: '高校生 Challenge',
  },
};


function textOf(
  value
) {
  if (
    typeof value === 'string'
  ) {
    return value;
  }

  return (
    value?.ja ??
    value?.en ??
    ''
  );
}


function applyLevel(
  mission,
  level
) {
  const variant =
    mission
      ?.variants
      ?.[level] ??
    {};

  return {
    ...mission,
    ...variant,

    id:
      mission.id,

    type:
      mission.type,

    domain:
      mission.domain ??
      'time',

    challenge: {
      ...(mission.challenge ?? {}),
      ...(variant.challenge ?? {}),
    },

    title:
      textOf(
        variant.title ??
        mission.title
      ),

    prompt:
      textOf(
        variant.prompt ??
        mission.prompt
      ),

    explanation:
      textOf(
        variant.explanation ??
        mission.explanation
      ),

    points:
      variant.points ??
      mission.points ??
      0,
  };
}


function getMissionMeta(
  type
) {
  switch (
    type
  ) {
    case 'time-zone-express':
      return {
        icon: '🚆',
        label: 'TIME ZONE EXPRESS',
      };

    case 'global-time-rescue':
      return {
        icon: '🌍',
        label: 'GLOBAL TIME RESCUE',
      };
    case 'world-life-detective':
      return {
        icon: '🕵️',
        label: 'LIFE DETECTIVE',
      };

    case 'time-travel-lap':
      return {
        icon: '⏳',
        label: 'TIME TRAVEL',
      };

    case 'clock-offset':
      return {
        icon: '🕒',
        label: 'CLOCK CHALLENGE',
      };

    case 'live-time-compare':
      return {
        icon: '🌍',
        label: 'LIVE TIME',
      };

    case 'time-dial':
      return {
        icon: '🕒',
        label: 'CLOCK CHALLENGE',
      };

    case 'daypart-match':
      return {
        icon: '🌅',
        label: 'DAY & NIGHT',
      };

    case 'schedule-builder':
      return {
        icon: '🤝',
        label: 'GLOBAL PLANNER',
      };

    default:
      return {
        icon: '⏰',
        label: 'TIME MISSION',
      };
  }
}


function MissionCard({
  mission,
  index,
  selected,
  completed,
  unlocked,
  onClick,
}) {
  const meta =
    getMissionMeta(
      mission.type
    );

  return (
    <button
      type="button"
      disabled={!unlocked}
      onClick={onClick}
      className={`
        w-full
        rounded-[22px]
        border-2
        p-4
        text-left
        transition-all

        ${
          selected
            ? 'border-amber-400 bg-amber-50 shadow-lg'
            : completed
              ? 'border-emerald-200 bg-emerald-50'
              : unlocked
                ? 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md'
                : 'cursor-not-allowed border-slate-200 bg-slate-100 opacity-45'
        }
      `}
    >
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <div
          className={`
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-2xl
            text-xl

            ${
              completed
                ? 'bg-emerald-500 text-white'
                : selected
                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                  : 'bg-slate-100'
            }
          `}
        >
          {
            completed
              ? (
                  <Check
                    size={22}
                    strokeWidth={3}
                  />
                )
              : unlocked
                ? meta.icon
                : (
                    <LockKeyhole
                      size={19}
                    />
                  )
          }
        </div>

        <div
          className="
            min-w-0
            flex-1
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              className="
                text-[10px]
                font-black
                tracking-[0.15em]
                text-amber-600
              "
            >
              MISSION {
                String(
                  index + 1
                ).padStart(
                  2,
                  '0'
                )
              }
            </span>

            <span
              className="
                rounded-full
                bg-slate-100
                px-2
                py-1
                text-[9px]
                font-black
                text-slate-500
              "
            >
              {meta.label}
            </span>
          </div>

          <p
            className="
              mt-1
              truncate
              text-sm
              font-black
              text-slate-900
            "
          >
            {mission.title}
          </p>

          <p
            className="
              mt-1
              line-clamp-2
              text-xs
              font-bold
              leading-5
              text-slate-500
            "
          >
            {mission.prompt}
          </p>
        </div>
      </div>
    </button>
  );
}


export default function TimeAdventure({
  initialLevel = 'highSchoolStandard',
  countryCode = 'rw',
  onProgressChange,
}) {
  const normalizedCountry =
    String(
      countryCode
    ).toLowerCase();

  const packageData =
    timeData?.[normalizedCountry] ??
    timeData?.rw;

  const level =
    initialLevel ??
    'highSchoolStandard';

  const levelMeta =
    LEVEL_META[level] ??
    LEVEL_META.highSchoolStandard;

  const missions =
    useMemo(
      () =>
        (
          packageData
            ?.missions ??
          []
        ).map(
          (
            mission
          ) =>
            applyLevel(
              mission,
              level
            )
        ),
      [
        packageData,
        level,
      ]
    );

  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(
      0
    );

  const [
    progress,
    setProgress,
  ] =
    useState(
      () =>
        getWorldAdventureDomainProgress(
          normalizedCountry,
          'time'
        )
    );

  const completedSet =
    new Set(
      progress
        ?.completedMissionIds ??
      []
    );

  const completedCount =
    missions.filter(
      (
        mission
      ) =>
        completedSet.has(
          mission.id
        )
    ).length;

  const activeMission =
    missions[
      activeIndex
    ];

  const isUnlocked =
    (
      index
    ) => {
      if (
        index ===
        0
      ) {
        return true;
      }

      const current =
        missions[
          index
        ];

      const previous =
        missions[
          index - 1
        ];

      return (
        completedSet.has(
          current?.id
        ) ||
        completedSet.has(
          previous?.id
        )
      );
    };

  const handleComplete =
    (
      mission
    ) => {
      const result =
        completeWorldAdventureMission({
          countryCode:
            normalizedCountry,

          domainId:
            'time',

          missionId:
            mission.id,

          points:
            mission.points ??
            0,
        });

      setProgress(
        result.progress
      );

      onProgressChange?.(
        result.progress
      );
    };


  if (
    !packageData ||
    missions.length ===
      0
  ) {
    return (
      <div
        className="
          min-h-screen
          bg-slate-100
          p-10
          text-center
        "
      >
        <p className="text-5xl">
          ⏰
        </p>

        <h2
          className="
            mt-4
            text-2xl
            font-black
          "
        >
          Time Adventure data
          がありません
        </h2>
      </div>
    );
  }


  const activeMeta =
    getMissionMeta(
      activeMission.type
    );

  const progressPercent =
    missions.length
      ? (
          completedCount /
          missions.length
        ) *
        100
      : 0;


  return (
    <div
      className="
        min-h-screen
        bg-slate-100
        text-slate-900
      "
    >
      <header
        className="
          relative
          overflow-hidden
          bg-gradient-to-r
          from-slate-950
          via-amber-950
          to-orange-900
          text-white
        "
      >
        <div
          className="
            absolute
            -left-24
            -top-24
            h-72
            w-72
            rounded-full
            bg-amber-400/20
            blur-3xl
          "
        />

        <div
          className="
            absolute
            -bottom-28
            right-24
            h-72
            w-72
            rounded-full
            bg-orange-500/20
            blur-3xl
          "
        />

        <div
          className="
            relative
            mx-auto
            flex
            max-w-[1500px]
            flex-col
            gap-6
            px-6
            py-8
            lg:flex-row
            lg:items-end
            lg:justify-between
          "
        >
          <div
            className="
              flex
              items-start
              gap-4
            "
          >
            <div
              className="
                flex
                h-16
                w-16
                shrink-0
                items-center
                justify-center
                rounded-[22px]
                bg-white/10
                text-4xl
                ring-1
                ring-white/20
              "
            >
              ⏰
            </div>

            <div>
              <p
                className="
                  text-[10px]
                  font-black
                  tracking-[0.24em]
                  text-amber-300
                "
              >
                EXPLORE · LEARN · CONNECT
              </p>

              <h1
                className="
                  mt-2
                  text-3xl
                  font-black
                  tracking-tight
                  md:text-5xl
                "
              >
                Rwanda Time Adventure
              </h1>

              <p
                className="
                  mt-2
                  font-bold
                  text-amber-100/80
                "
              >
                時間・時差 · Time & Time Zones
              </p>

              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  gap-2
                "
              >
                <span
                  className="
                    rounded-full
                    bg-white/10
                    px-3
                    py-1.5
                    text-xs
                    font-black
                  "
                >
                  🇷🇼 Rwanda
                </span>

                <span
                  className="
                    rounded-full
                    bg-white/10
                    px-3
                    py-1.5
                    text-xs
                    font-black
                  "
                >
                  {levelMeta.icon}
                  {' '}
                  {levelMeta.label}
                </span>

                <span
                  className="
                    rounded-full
                    bg-amber-400
                    px-3
                    py-1.5
                    text-xs
                    font-black
                    text-slate-950
                  "
                >
                  {missions.length}
                  {' '}
                  MISSIONS
                </span>
              </div>
            </div>
          </div>

          <div
            className="
              w-full
              max-w-lg
            "
          >
            <div
              className="
                flex
                justify-between
                text-xs
                font-black
              "
            >
              <span
                className="
                  tracking-[0.18em]
                  text-amber-200
                "
              >
                ADVENTURE PROGRESS
              </span>

              <span>
                {completedCount}
                {' / '}
                {missions.length}
              </span>
            </div>

            <div
              className="
                mt-2
                h-3
                overflow-hidden
                rounded-full
                bg-white/15
              "
            >
              <div
                className="
                  h-full
                  rounded-full
                  bg-gradient-to-r
                  from-yellow-300
                  via-amber-300
                  to-orange-400
                  transition-all
                  duration-500
                "
                style={{
                  width:
                    `${progressPercent}%`,
                }}
              />
            </div>
          </div>
        </div>
      </header>


      <main
        className="
          mx-auto
          grid
          max-w-[1500px]
          grid-cols-1
          gap-7
          px-5
          py-7
          lg:grid-cols-[380px_minmax(0,1fr)]
        "
      >
        <aside
          className="
            rounded-[30px]
            border
            border-slate-200
            bg-white
            p-4
            shadow-sm
            lg:sticky
            lg:top-5
            lg:self-start
          "
        >
          <div
            className="
              mb-4
              flex
              items-center
              justify-between
              px-2
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-black
                  tracking-[0.18em]
                  text-amber-600
                "
              >
                MISSION ROUTE
              </p>

              <h2
                className="
                  mt-1
                  text-xl
                  font-black
                "
              >
                時間の冒険
              </h2>
            </div>

            <Clock3
              size={27}
              className="
                text-amber-500
              "
            />
          </div>

          <div
            className="
              max-h-[72vh]
              space-y-3
              overflow-y-auto
              pr-1
            "
          >
            {
              missions.map(
                (
                  mission,
                  index
                ) => (
                  <MissionCard
                    key={
                      mission.id
                    }
                    mission={
                      mission
                    }
                    index={
                      index
                    }
                    selected={
                      activeIndex ===
                      index
                    }
                    completed={
                      completedSet.has(
                        mission.id
                      )
                    }
                    unlocked={
                      isUnlocked(
                        index
                      )
                    }
                    onClick={() =>
                      setActiveIndex(
                        index
                      )
                    }
                  />
                )
              )
            }
          </div>
        </aside>


        <section
          className="
            min-w-0
          "
        >
          <div
            className="
              rounded-[34px]
              bg-gradient-to-br
              from-slate-950
              via-amber-950
              to-orange-900
              p-7
              text-white
              shadow-2xl
            "
          >
            <div
              className="
                flex
                flex-wrap
                items-center
                justify-between
                gap-3
              "
            >
              <span
                className="
                  rounded-full
                  bg-white/10
                  px-4
                  py-2
                  text-[10px]
                  font-black
                  tracking-[0.18em]
                  text-amber-200
                "
              >
                MISSION {
                  String(
                    activeIndex + 1
                  ).padStart(
                    2,
                    '0'
                  )
                }
                {' · '}
                {activeMeta.label}
              </span>

              <span
                className="
                  rounded-full
                  bg-amber-400
                  px-4
                  py-2
                  text-xs
                  font-black
                  text-slate-950
                "
              >
                +{activeMission.points ?? 0} WP
              </span>
            </div>

            <div
              className="
                mt-6
                flex
                items-start
                gap-4
              "
            >
              <div
                className="
                  flex
                  h-16
                  w-16
                  shrink-0
                  items-center
                  justify-center
                  rounded-3xl
                  bg-white/10
                  text-4xl
                "
              >
                {activeMeta.icon}
              </div>

              <div>
                <p
                  className="
                    text-xs
                    font-black
                    tracking-[0.18em]
                    text-amber-300
                  "
                >
                  RWANDA TIME ADVENTURE
                </p>

                <h2
                  className="
                    mt-2
                    text-3xl
                    font-black
                  "
                >
                  {activeMission.title}
                </h2>

                <p
                  className="
                    mt-3
                    max-w-3xl
                    font-bold
                    leading-7
                    text-amber-50/85
                  "
                >
                  {activeMission.prompt}
                </p>
              </div>
            </div>
          </div>


          <div
            className="
              mt-5
              rounded-[34px]
              border
              border-slate-200
              bg-white
              p-6
              shadow-xl
            "
          >
            <TimeMissionRouter
              key={
                `${activeMission.id}-${level}`
              }
              mission={
                activeMission
              }
              alreadyCompleted={
                completedSet.has(
                  activeMission.id
                )
              }
              onComplete={
                handleComplete
              }
            />
          </div>


          <div
            className="
              mt-5
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <button
              type="button"
              disabled={
                activeIndex ===
                0
              }
              onClick={() =>
                setActiveIndex(
                  Math.max(
                    0,
                    activeIndex - 1
                  )
                )
              }
              className="
                flex
                items-center
                gap-2
                rounded-2xl
                border-2
                border-slate-200
                bg-white
                px-5
                py-3
                font-black
                disabled:opacity-30
              "
            >
              <ChevronLeft size={19} />
              前へ
            </button>

            <span
              className="
                rounded-full
                bg-white
                px-4
                py-2
                text-xs
                font-black
                shadow-sm
              "
            >
              {activeIndex + 1}
              {' / '}
              {missions.length}
            </span>

            <button
              type="button"
              disabled={
                activeIndex >=
                  missions.length - 1 ||
                !isUnlocked(
                  activeIndex + 1
                )
              }
              onClick={() =>
                setActiveIndex(
                  Math.min(
                    missions.length - 1,
                    activeIndex + 1
                  )
                )
              }
              className="
                flex
                items-center
                gap-2
                rounded-2xl
                bg-gradient-to-r
                from-amber-500
                to-orange-500
                px-5
                py-3
                font-black
                text-white
                disabled:opacity-30
              "
            >
              次へ
              <ChevronRight size={19} />
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}