import {
  ArrowRight,
  Globe2,
  Languages,
  MapPin,
  Sparkles,
} from 'lucide-react';

import {
  useState,
} from 'react';

import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps';

import worldAtlas
  from 'world-atlas/countries-110m.json';

import CountryDetailOverlay
  from '../CountryDetailOverlay';

import {
  getWorldLearningCountries,
} from '../../utils/worldLearningRegistry';

import {
  getCountryProgress,
} from '../../utils/worldProgressStorage';

import {
  playUiSound,
} from '../../utils/uiSound';

const worldCountries =
  getWorldLearningCountries();

const liveCountries =
  worldCountries.filter(
    (country) =>
      country.status ===
      'live'
  );

const countryByAtlasName =
  new Map(
    worldCountries.map(
      (country) => [
        country.atlasName,
        country,
      ]
    )
  );

const COUNTRY_COLORS = [
  {
    primary: '#2563eb',
    dark: '#1e3a8a',
    soft: '#eff6ff',
    map: '#3b82f6',
  },
  {
    primary: '#059669',
    dark: '#065f46',
    soft: '#ecfdf5',
    map: '#10b981',
  },
  {
    primary: '#d97706',
    dark: '#92400e',
    soft: '#fffbeb',
    map: '#f59e0b',
  },
  {
    primary: '#7c3aed',
    dark: '#5b21b6',
    soft: '#f5f3ff',
    map: '#8b5cf6',
  },
  {
    primary: '#dc2626',
    dark: '#991b1b',
    soft: '#fef2f2',
    map: '#ef4444',
  },
  {
    primary: '#0891b2',
    dark: '#155e75',
    soft: '#ecfeff',
    map: '#06b6d4',
  },
  {
    primary: '#db2777',
    dark: '#9d174d',
    soft: '#fdf2f8',
    map: '#ec4899',
  },
];

function getCountryVisual(
  iso
) {
  const value =
    String(iso || '')
      .split('')
      .reduce(
        (
          total,
          char
        ) =>
          total +
          char.charCodeAt(0),
        0
      );

  return COUNTRY_COLORS[
    value %
      COUNTRY_COLORS.length
  ];
}

function getAtlasCountryName(
  geo
) {
  return (
    geo?.properties?.name ??
    ''
  );
}

function calculateCountryStats(
  country
) {
  const progress =
    getCountryProgress(
      country.iso
    );

  const completedIds =
    progress
      ?.completedMissionIds ??
    [];

  const completedSet =
    new Set(
      completedIds
    );

  const missions =
    country
      ?.missionData
      ?.missions ??
    [];

  const worldPoints =
    missions.reduce(
      (
        total,
        mission
      ) => {
        if (
          completedSet.has(
            mission.id
          )
        ) {
          return (
            total +
            Number(
              mission.points || 0
            )
          );
        }

        return total;
      },
      0
    );

  const totalMissions =
    missions.length;

  const completionRate =
    totalMissions > 0
      ? Math.round(
          (
            completedIds.length /
            totalMissions
          ) *
            100
        )
      : 0;

  return {
    completedCount:
      completedIds.length,

    totalMissions,

    worldPoints,

    completionRate,
  };
}

export default function ExploreWorld() {
  const [
    activeCountry,
    setActiveCountry,
  ] = useState(null);

  const [
    ,
    setProgressRevision,
  ] = useState(0);

  const totalCompleted =
    liveCountries.reduce(
      (
        total,
        country
      ) =>
        total +
        calculateCountryStats(
          country
        ).completedCount,
      0
    );

  const totalWp =
    liveCountries.reduce(
      (
        total,
        country
      ) =>
        total +
        calculateCountryStats(
          country
        ).worldPoints,
      0
    );

  const openCountry =
    (country) => {
      if (
        country.status !==
        'live'
      ) {
        return;
      }

      playUiSound(
        'open'
      );

      setActiveCountry(
        country
      );
    };

  const closeCountry =
    () => {
      playUiSound(
        'back'
      );

      setActiveCountry(
        null
      );

      setProgressRevision(
        (value) =>
          value + 1
      );
    };

  return (
    <div className="min-h-[calc(100vh-68px)] bg-[#f5f3ee]">

      {/* HERO */}
      <section className="overflow-hidden border-b border-slate-200 bg-white">

        <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-10 px-6 py-12 md:px-10 md:py-16 lg:grid-cols-[1fr_auto] lg:items-end">

          <div className="max-w-3xl">

            <div className="flex items-center gap-2 text-blue-600">

              <Sparkles
                size={17}
              />

              <p className="text-[11px] font-bold tracking-[0.24em]">
                WORLD ADVENTURE
              </p>

            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-slate-950 md:text-6xl">
              世界を選んで、
              <br />
              冒険を始めよう。
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              国旗、ことば、時間、文化。
              40のMissionを通して、
              世界を「知る」から
              「つながる」へ進めます。
            </p>

          </div>

          <div className="grid grid-cols-3 overflow-hidden border border-slate-200 bg-white shadow-sm">

            <div className="min-w-[105px] border-r border-slate-200 p-5 text-center">

              <div className="text-3xl font-semibold text-slate-950">
                {
                  liveCountries.length
                }
              </div>

              <div className="mt-1 text-[9px] font-bold tracking-[0.16em] text-slate-400">
                COUNTRIES
              </div>

            </div>

            <div className="min-w-[105px] border-r border-slate-200 p-5 text-center">

              <div className="text-3xl font-semibold text-slate-950">
                {
                  totalCompleted
                }
              </div>

              <div className="mt-1 text-[9px] font-bold tracking-[0.16em] text-slate-400">
                CLEARED
              </div>

            </div>

            <div className="min-w-[105px] p-5 text-center">

              <div className="text-3xl font-semibold text-slate-950">
                {
                  totalWp
                }
              </div>

              <div className="mt-1 text-[9px] font-bold tracking-[0.16em] text-slate-400">
                WP
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* MAP */}
      <section className="mx-auto w-full max-w-[1500px] px-4 py-8 md:px-8">

        <div className="overflow-hidden border border-slate-200 bg-[#dceaf0] shadow-[0_14px_45px_rgba(15,23,42,0.07)]">

          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 md:flex-row md:items-center">

            <div className="flex items-center gap-3">

              <Globe2
                size={20}
                strokeWidth={1.7}
                className="text-blue-600"
              />

              <div>

                <div className="text-sm font-semibold text-slate-900">
                  Explore the World
                </div>

                <div className="text-xs text-slate-500">
                  色のついた国をクリックして冒険を始めよう
                </div>

              </div>

            </div>

            <div className="text-[10px] font-bold tracking-[0.14em] text-slate-400">
              EXPLORE · LEARN · CONNECT
            </div>

          </div>

          <div className="w-full bg-[#dceaf0]">

            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{
                scale: 147,
                center: [
                  5,
                  6,
                ],
              }}
              width={1000}
              height={480}
              className="h-auto w-full"
            >

              <Geographies
                geography={
                  worldAtlas
                }
              >

                {({
                  geographies,
                }) =>
                  geographies.map(
                    (geo) => {
                      const atlasName =
                        getAtlasCountryName(
                          geo
                        );

                      const country =
                        countryByAtlasName.get(
                          atlasName
                        );

                      const live =
                        country
                          ?.status ===
                        'live';

                      const visual =
                        live
                          ? getCountryVisual(
                              country.iso
                            )
                          : null;

                      return (
                        <Geography
                          key={
                            geo.rsmKey
                          }
                          geography={
                            geo
                          }
                          tabIndex={
                            live
                              ? 0
                              : -1
                          }
                          role={
                            live
                              ? 'button'
                              : undefined
                          }
                          aria-label={
                            live
                              ? `${country.nameEn}を探検する`
                              : undefined
                          }
                          onClick={() => {
                            if (
                              live
                            ) {
                              openCountry(
                                country
                              );
                            }
                          }}
                          onKeyDown={(
                            event
                          ) => {
                            if (!live) {
                              return;
                            }

                            if (
                              event.key ===
                                'Enter' ||
                              event.key ===
                                ' '
                            ) {
                              event.preventDefault();

                              openCountry(
                                country
                              );
                            }
                          }}
                          style={{
                            default: {
                              fill:
                                live
                                  ? visual.map
                                  : '#cbd5e1',

                              stroke:
                                '#f8fafc',

                              strokeWidth:
                                0.65,

                              outline:
                                'none',
                            },

                            hover: {
                              fill:
                                live
                                  ? visual.dark
                                  : '#cbd5e1',

                              stroke:
                                '#ffffff',

                              strokeWidth:
                                live
                                  ? 1.2
                                  : 0.65,

                              outline:
                                'none',

                              cursor:
                                live
                                  ? 'pointer'
                                  : 'default',
                            },

                            pressed: {
                              fill:
                                live
                                  ? visual.dark
                                  : '#cbd5e1',

                              stroke:
                                '#ffffff',

                              strokeWidth:
                                1,

                              outline:
                                'none',
                            },
                          }}
                        />
                      );
                    }
                  )
                }

              </Geographies>

            </ComposableMap>

          </div>

        </div>

      </section>

      {/* COUNTRIES */}
      <section className="mx-auto w-full max-w-[1500px] px-6 pb-20 md:px-10">

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

          <div>

            <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400">
              DESTINATIONS
            </p>

            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              探検できる国
            </h2>

          </div>

          <p className="max-w-lg text-sm leading-6 text-slate-500">
            国旗や基本情報から気になる国を選んでください。
            すべて40 Missionの正式版です。
          </p>

        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

          {liveCountries.map(
            (country) => {
              const stats =
                calculateCountryStats(
                  country
                );

              const visual =
                getCountryVisual(
                  country.iso
                );

              const languageLabel =
                country
                  .mainLanguagesJa
                  ?.slice(0, 2)
                  .join(' / ') ||
                '—';

              return (
                <button
                  key={
                    country.iso
                  }
                  type="button"
                  onClick={() =>
                    openCountry(
                      country
                    )
                  }
                  className="
                    group
                    overflow-hidden
                    border
                    border-slate-200
                    bg-white
                    text-left
                    shadow-[0_10px_30px_rgba(15,23,42,0.05)]
                    transition-all
                    duration-300
                    hover:-translate-y-1.5
                    hover:shadow-[0_18px_50px_rgba(15,23,42,0.12)]
                  "
                  style={{
                    borderTopColor:
                      visual.primary,
                    borderTopWidth:
                      '4px',
                  }}
                >

                  {/* FLAG HERO */}
                  <div
                    className="relative h-32 overflow-hidden"
                    style={{
                      background:
                        `linear-gradient(135deg, ${visual.dark}, ${visual.primary})`,
                    }}
                  >

                    {country.flagUrl && (
                      <img
                        src={
                          country.flagUrl
                        }
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-[0.14] blur-[1px]"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/50 to-transparent" />

                    <div className="relative flex h-full items-center justify-between px-6">

                      <div className="flex items-center gap-4">

                        {country.flagUrl ? (
                          <img
                            src={
                              country.flagUrl
                            }
                            alt={`${country.nameEn} flag`}
                            className="h-[62px] w-[94px] object-cover shadow-xl ring-1 ring-white/40"
                          />
                        ) : (
                          <div className="text-5xl">
                            {
                              country.flagEmoji
                            }
                          </div>
                        )}

                        <div className="text-white">

                          <div className="text-[10px] font-bold tracking-[0.18em] text-white/60">
                            {
                              country.iso.toUpperCase()
                            }
                          </div>

                          <div className="mt-1 text-lg font-semibold">
                            {
                              country.region
                            }
                          </div>

                        </div>

                      </div>

                      <div className="bg-white/15 px-3 py-1.5 text-[9px] font-bold tracking-[0.15em] text-white backdrop-blur">
                        40 MISSIONS
                      </div>

                    </div>

                  </div>

                  {/* CONTENT */}
                  <div className="p-6">

                    <h3 className="text-2xl font-semibold tracking-tight text-slate-950">
                      {
                        country.nameEn
                      }
                    </h3>

                    <p className="mt-1 text-sm font-medium text-slate-400">
                      {
                        country.nameJa
                      }
                    </p>

                    <p className="mt-4 line-clamp-2 min-h-[48px] text-sm leading-6 text-slate-600">
                      {
                        country.subtitleJa ||
                        `${country.nameJa}を40のMissionで多面的に探検します。`
                      }
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div
                        className="p-3"
                        style={{
                          backgroundColor:
                            visual.soft,
                        }}
                      >

                        <div className="flex items-center gap-2 text-slate-400">

                          <MapPin
                            size={14}
                          />

                          <span className="text-[9px] font-bold tracking-[0.1em]">
                            CAPITAL
                          </span>

                        </div>

                        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                          {
                            country.capitalJa
                          }
                        </p>

                      </div>

                      <div
                        className="p-3"
                        style={{
                          backgroundColor:
                            visual.soft,
                        }}
                      >

                        <div className="flex items-center gap-2 text-slate-400">

                          <Languages
                            size={14}
                          />

                          <span className="text-[9px] font-bold tracking-[0.1em]">
                            LANGUAGE
                          </span>

                        </div>

                        <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                          {
                            languageLabel
                          }
                        </p>

                      </div>

                    </div>

                    {/* PROGRESS */}
                    <div className="mt-6">

                      <div className="flex items-end justify-between">

                        <div>

                          <p className="text-[9px] font-bold tracking-[0.13em] text-slate-400">
                            YOUR JOURNEY
                          </p>

                          <p className="mt-1 font-semibold text-slate-800">
                            {
                              stats.completedCount
                            }
                            <span className="text-slate-300">
                              {' '}
                              /{' '}
                              {
                                stats.totalMissions
                              }
                            </span>
                            {' '}
                            Missions
                          </p>

                        </div>

                        <div
                          className="text-2xl font-semibold"
                          style={{
                            color:
                              visual.primary,
                          }}
                        >
                          {
                            stats.completionRate
                          }%
                        </div>

                      </div>

                      <div className="mt-3 h-1.5 overflow-hidden bg-slate-100">

                        <div
                          className="h-full transition-all duration-500"
                          style={{
                            width:
                              `${stats.completionRate}%`,

                            backgroundColor:
                              visual.primary,
                          }}
                        />

                      </div>

                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">

                      <div>

                        <span className="text-xs font-semibold text-slate-900">
                          Start Adventure
                        </span>

                        <span className="ml-2 text-[10px] font-bold text-slate-400">
                          {
                            stats.worldPoints
                          } WP
                        </span>

                      </div>

                      <span
                        className="flex h-9 w-9 items-center justify-center text-white transition-transform group-hover:translate-x-1"
                        style={{
                          backgroundColor:
                            visual.primary,
                        }}
                      >
                        <ArrowRight
                          size={17}
                        />
                      </span>

                    </div>

                  </div>

                </button>
              );
            }
          )}

        </div>

      </section>

      {activeCountry && (
        <CountryDetailOverlay
          iso={
            activeCountry.iso
          }
          fileLetter={
            activeCountry.fileLetter
          }
          onClose={
            closeCountry
          }
        />
      )}

    </div>
  );
}