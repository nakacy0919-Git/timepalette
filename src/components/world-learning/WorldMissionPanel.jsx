import {
  CheckCircle2,
  LockKeyhole,
  Play,
  Sparkles,
  Trophy,
} from 'lucide-react';

import {
  useState,
} from 'react';

import {
  completeWorldMission,
  getCountryProgress,
} from '../../utils/worldProgressStorage';

import MissionPlayer from './MissionPlayer';

const INTERACTIVE_MISSION_TYPES = new Set([
  'live-time-compare',
  'time-dial',
  'daypart-match',
  'schedule-builder',

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

const isMissionPlayable = (mission) => {
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
    module.default ||
    module;

  return (
    data?.[
      countryCode
    ] || null
  );
};

const BADGE_META = {
  none: {
    icon: '🌍',
    label: 'Start Exploring',
    labelJa: 'まだ未探索',
  },

  stamp: {
    icon: '🌏',
    label: 'Explorer Stamp',
    labelJa: '探索スタンプ',
  },

  bronze: {
    icon: '🥉',
    label: 'Explorer Badge',
    labelJa: 'Explorer Badge',
  },

  silver: {
    icon: '🥈',
    label: 'Discovery Badge',
    labelJa: 'Discovery Badge',
  },

  gold: {
    icon: '🥇',
    label: 'Country Master',
    labelJa: 'Country Master',
  },

  diamond: {
    icon: '💎',
    label: 'Connector Badge',
    labelJa: 'Connector Badge',
  },
};

const getDomainCounts = (
  missionData,
  completedIds
) => {
  const counts = {};

  missionData.design.domains.forEach(
    (domain) => {
      counts[domain.id] = 0;
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
          (counts[
            mission.domain
          ] || 0) + 1;
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

  if (rule.minDomains) {
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
    const domainEntries =
      Object.entries(
        rule.domainMinimums
      );

    const allDomainsClear =
      domainEntries.every(
        ([
          domainId,
          minimum,
        ]) =>
          (domainCounts[
            domainId
          ] || 0) >=
          minimum
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
      rule.requiredMissionIds.every(
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
    missionData.badgeRules;

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

export default function WorldMissionPanel({
  countryCode,
  fileLetter,
}) {
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

  const completedIds =
    new Set(
      progress.completedMissionIds ||
        []
    );

  const totalPoints =
    missionData.missions.reduce(
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
            mission.points
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

  const missionPercent =
    Math.round(
      (completedCount /
        missionData.totalMissions) *
        100
    );

  const badge =
    calculateBadge(
      missionData,
      completedIds,
      totalPoints,
      domainCounts
    );

  const badgeMeta =
    BADGE_META[badge];

  const visibleMissions =
    selectedDomain ===
    'all'
      ? missionData.missions
      : missionData.missions.filter(
          (mission) =>
            mission.domain ===
            selectedDomain
        );

  const handleComplete = (
    mission
  ) => {
    const result =
      completeWorldMission(
        countryCode,
        mission.id
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
    <section className="mt-16 pt-10 border-t-2 border-dashed border-slate-300">
      <div className="relative overflow-hidden rounded-[36px] bg-slate-950 text-white shadow-xl">
        <div className="absolute -right-20 -top-24 w-72 h-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="absolute -left-20 bottom-0 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />

        <div className="relative p-6 md:p-9">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 text-blue-300 font-black text-sm tracking-[0.18em] mb-3">
                <Sparkles
                  size={18}
                />
                WORLD LEARNING
              </div>

              <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3">
                WORLD MISSION
              </h2>

              <p className="text-slate-300 font-bold max-w-2xl leading-relaxed">
                世界を「知って終わり」にしない。
                地理・時差・ことば・文化・日本とのつながり・思考の6分野から、この国を多面的に探検しよう。
              </p>
            </div>

            <div className="min-w-[260px] rounded-3xl bg-white/10 border border-white/10 backdrop-blur p-5">
              <div className="flex items-center gap-4">
                <div className="text-5xl">
                  {
                    badgeMeta.icon
                  }
                </div>

                <div>
                  <p className="text-xs font-black text-slate-400">
                    CURRENT BADGE
                  </p>

                  <p className="text-lg font-black">
                    {
                      badgeMeta.label
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-9 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-xs text-slate-400 font-black mb-1">
                MISSIONS
              </p>

              <p className="text-2xl font-black">
                {completedCount}
                <span className="text-sm text-slate-400">
                  {' '}
                  /{' '}
                  {
                    missionData.totalMissions
                  }
                </span>
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-xs text-slate-400 font-black mb-1">
                WORLD POINTS
              </p>

              <p className="text-2xl font-black text-amber-300">
                {totalPoints}
                <span className="text-sm text-slate-400">
                  {' '}
                  /{' '}
                  {
                    missionData.maxWorldPoints
                  }
                </span>
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-xs text-slate-400 font-black mb-1">
                PROGRESS
              </p>

              <p className="text-2xl font-black text-blue-300">
                {missionPercent}%
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 border border-white/10">
              <p className="text-xs text-slate-400 font-black mb-1">
                COUNTRY
              </p>

              <p className="text-xl font-black">
                🇦🇺{' '}
                {
                  missionData.countryNameEn
                }
              </p>
            </div>
          </div>

          <div className="mt-5 h-3 rounded-full overflow-hidden bg-white/10">
            <div
              className="h-full bg-blue-500 transition-all duration-500 rounded-full"
              style={{
                width: `${missionPercent}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {missionData.design.domains.map(
          (domain) => {
            const domainTotal =
              missionData.missions.filter(
                (mission) =>
                  mission.domain ===
                  domain.id
              ).length;

            const domainComplete =
              domainCounts[
                domain.id
              ] || 0;

            const selected =
              selectedDomain ===
              domain.id;

            return (
              <button
                key={
                  domain.id
                }
                onClick={() =>
                  setSelectedDomain(
                    domain.id
                  )
                }
                className={`rounded-3xl border p-4 text-left transition-all ${
                  selected
                    ? 'border-blue-500 bg-blue-50 shadow-md -translate-y-1'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:-translate-y-1'
                }`}
              >
                <div className="text-3xl mb-3">
                  {
                    domain.icon
                  }
                </div>

                <p className="font-black text-slate-800 text-sm leading-tight">
                  {
                    domain.labelJa
                  }
                </p>

                <p className="mt-2 text-xs font-black text-slate-400">
                  {domainComplete}
                  {' / '}
                  {domainTotal}
                </p>
              </button>
            );
          }
        )}
      </div>

      <div className="mt-4">
        <button
          onClick={() =>
            setSelectedDomain(
              'all'
            )
          }
          className={`px-5 py-2.5 rounded-full font-black text-sm transition-colors ${
            selectedDomain ===
            'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          ALL 40 MISSIONS
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
              missionData.design.domains.find(
                (item) =>
                  item.id ===
                  mission.domain
              );

            return (
              <button
                key={
                  mission.id
                }
                onClick={() =>
                  setActiveMission(
                    mission
                  )
                }
                className={`group relative text-left rounded-3xl border p-5 transition-all ${
                  completed
                    ? 'border-emerald-200 bg-emerald-50/50 hover:shadow-md'
                    : playable
                      ? 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-lg hover:-translate-y-1'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {
                        domain?.icon
                      }
                    </span>

                    <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                      LV.
                      {
                        mission.level
                      }
                    </span>
                  </div>

                  {completed ? (
                    <CheckCircle2
                      size={24}
                      className="text-emerald-500"
                    />
                  ) : playable ? (
                    <Play
                      size={21}
                      className="text-blue-500"
                    />
                  ) : (
                    <LockKeyhole
                      size={20}
                      className="text-slate-400"
                    />
                  )}
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-800">
                  {
                    mission.title
                  }
                </h3>

                <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed line-clamp-2">
                  {
                    mission.prompt
                  }
                </p>

                <div className="mt-5 flex items-center justify-between">
                  <span className="font-black text-amber-500">
                    +
                    {
                      mission.points
                    }{' '}
                    WP
                  </span>

                  <span
                    className={`text-[11px] font-black ${
                      completed
                        ? 'text-emerald-600'
                        : playable
                          ? 'text-blue-500'
                          : 'text-slate-400'
                    }`}
                  >
                    {completed
                      ? 'CLEAR'
                      : playable
                        ? 'PLAY'
                        : 'COMING NEXT'}
                  </span>
                </div>
              </button>
            );
          }
        )}
      </div>

      <div className="mt-10 bg-white rounded-[32px] border border-slate-200 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="text-amber-500" />

          <h3 className="text-2xl font-black text-slate-800">
            Badge Journey
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[
            ['stamp', '🌏'],
            ['bronze', '🥉'],
            ['silver', '🥈'],
            ['gold', '🥇'],
            ['diamond', '💎'],
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
                  className={`rounded-2xl p-4 border ${
                    achieved
                      ? 'border-amber-200 bg-amber-50'
                      : 'border-slate-200 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="text-3xl mb-2">
                    {icon}
                  </div>

                  <p className="text-sm font-black text-slate-700">
                    {
                      BADGE_META[
                        badgeKey
                      ].label
                    }
                  </p>

                  <p className="text-xs font-bold mt-2 text-slate-400">
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

      {activeMission && (
        <MissionPlayer
          key={
            activeMission.id
          }
          mission={
            activeMission
          }
          domain={missionData.design.domains.find(
            (domain) =>
              domain.id ===
              activeMission.domain
          )}
          alreadyCompleted={completedIds.has(
            activeMission.id
          )}
          onComplete={
            handleComplete
          }
          onClose={() =>
            setActiveMission(
              null
            )
          }
        />
      )}
    </section>
  );
}