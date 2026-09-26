import {
  ArrowRight,
  Globe2,
  X,
} from 'lucide-react';

import {
  useMemo,
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

const countryByAtlasName =
  new Map(
    worldCountries.map(
      (country) => [
        country.atlasName,
        country,
      ]
    )
  );

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
              mission.points ||
                0
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

  const liveCountries =
    useMemo(
      () =>
        worldCountries.filter(
          (country) =>
            country.status ===
            'live'
        ),
      []
    );

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
    <div className="min-h-[calc(100vh-68px)] bg-[#f4f2ed]">

      {/* HEADER */}
      <section className="border-b border-slate-200 bg-white">

        <div className="mx-auto w-full max-w-[1500px] px-6 py-12 md:px-10 md:py-16">

          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">

            <div className="max-w-3xl">

              <p className="text-[11px] font-bold tracking-[0.24em] text-slate-400">
                EXPLORE THE WORLD
              </p>

              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] text-slate-950 md:text-5xl">
                次は、どこを探検する？
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                40のMissionが完成した国から、
                World Adventureに追加されていきます。
                地図から国を選び、
                世界を多面的に探検しましょう。
              </p>

            </div>

            <div className="flex flex-wrap items-center gap-7 border-l border-slate-200 pl-7">

              <div>

                <div className="text-2xl font-semibold text-slate-950">
                  {
                    liveCountries.length
                  }
                </div>

                <div className="mt-1 text-[10px] font-bold tracking-[0.15em] text-slate-400">
                  COUNTRIES
                </div>

              </div>

              <div>

                <div className="text-2xl font-semibold text-slate-950">
                  {
                    totalCompleted
                  }
                </div>

                <div className="mt-1 text-[10px] font-bold tracking-[0.15em] text-slate-400">
                  MISSIONS
                </div>

              </div>

              <div>

                <div className="text-2xl font-semibold text-slate-950">
                  {
                    totalWp
                  }
                </div>

                <div className="mt-1 text-[10px] font-bold tracking-[0.15em] text-slate-400">
                  WORLD POINTS
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* WORLD MAP */}
      <section className="mx-auto w-full max-w-[1500px] px-4 py-8 md:px-8">

        <div className="overflow-hidden border border-slate-200 bg-[#dceaf0] shadow-[0_12px_40px_rgba(15,23,42,0.06)]">

          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 md:flex-row md:items-center">

            <div className="flex items-center gap-3">

              <Globe2
                size={19}
                strokeWidth={
                  1.7
                }
                className="text-slate-600"
              />

              <div>

                <div className="text-sm font-semibold text-slate-900">
                  World Map
                </div>

                <div className="text-xs text-slate-500">
                  青い国は40 Missions完成済み
                </div>

              </div>

            </div>

            <div className="flex items-center gap-5 text-[10px] font-bold tracking-[0.08em] text-slate-500">

              <div className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 bg-blue-600" />

                WORLD ADVENTURE

              </div>

              <div className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 bg-slate-300" />

                COMING SOON

              </div>

            </div>

          </div>

          <div className="w-full bg-[#dbe9ee]">

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
                            if (
                              !live
                            ) {
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
                                  ? '#2563eb'
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
                                  ? '#1d4ed8'
                                  : '#cbd5e1',

                              stroke:
                                '#ffffff',

                              strokeWidth:
                                live
                                  ? 1.1
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
                                  ? '#1e40af'
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

      {/* LIVE COUNTRIES */}
      <section className="mx-auto w-full max-w-[1500px] px-6 pb-20 md:px-10">

        <div>

          <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400">
            WORLD ADVENTURES
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            探検できる国
          </h2>

        </div>

        {liveCountries.length ===
        0 ? (

          <div className="mt-8 border border-slate-200 bg-white p-10 text-center">

            <p className="font-semibold text-slate-700">
              Missionデータを準備しています。
            </p>

          </div>

        ) : (

          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

            {liveCountries.map(
              (country) => {
                const stats =
                  calculateCountryStats(
                    country
                  );

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
                      min-h-[285px]
                      border
                      border-slate-900
                      bg-slate-950
                      p-7
                      text-left
                      text-white
                      shadow-[0_16px_45px_rgba(15,23,42,0.14)]
                      transition
                      hover:-translate-y-1
                      hover:bg-slate-900
                    "
                  >

                    <div className="flex items-start justify-between">

                      <div className="text-5xl">
                        {
                          country.flagEmoji
                        }
                      </div>

                      <span className="text-[9px] font-bold tracking-[0.16em] text-blue-300">
                        LIVE
                      </span>

                    </div>

                    <h3 className="mt-7 text-2xl font-semibold">
                      {
                        country.nameEn
                      }
                    </h3>

                    <p className="mt-1 text-sm text-white/45">
                      {
                        country.nameJa
                      }
                    </p>

                    <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">

                      <div>

                        <div className="font-semibold">
                          {
                            stats.completedCount
                          }
                          <span className="text-white/35">
                            {' '}
                            /{' '}
                            {
                              stats.totalMissions
                            }
                          </span>
                        </div>

                        <div className="mt-1 text-[9px] font-bold tracking-wide text-white/35">
                          MISSIONS
                        </div>

                      </div>

                      <div>

                        <div className="font-semibold">
                          {
                            stats.worldPoints
                          }
                        </div>

                        <div className="mt-1 text-[9px] font-bold tracking-wide text-white/35">
                          WP
                        </div>

                      </div>

                      <div>

                        <div className="font-semibold">
                          {
                            stats.completionRate
                          }%
                        </div>

                        <div className="mt-1 text-[9px] font-bold tracking-wide text-white/35">
                          COMPLETE
                        </div>

                      </div>

                    </div>

                    <div className="mt-7 flex items-center justify-between">

                      <span className="text-xs font-semibold text-white/55">
                        START ADVENTURE
                      </span>

                      <ArrowRight
                        size={18}
                        className="transition-transform group-hover:translate-x-1"
                      />

                    </div>

                  </button>
                );
              }
            )}

          </div>

        )}

      </section>

      {/* COUNTRY DETAIL */}
      {activeCountry && (

        <div className="fixed inset-0 z-[2000] bg-black/30 backdrop-blur-sm">

          <div className="absolute inset-0 overflow-y-auto">

            <button
              type="button"
              onClick={
                closeCountry
              }
              className="
                fixed
                right-5
                top-5
                z-[2100]
                flex
                h-11
                w-11
                items-center
                justify-center
                bg-slate-950
                text-white
                shadow-xl
                transition
                hover:bg-blue-600
              "
              aria-label="閉じる"
            >
              <X
                size={20}
              />
            </button>

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

          </div>

        </div>

      )}

    </div>
  );
}