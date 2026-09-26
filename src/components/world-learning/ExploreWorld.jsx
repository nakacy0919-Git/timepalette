import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Globe2,
  ListOrdered,
  Map as MapIcon,
  Search,
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


/* =========================================================
   COUNTRY DATA
========================================================= */

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


/* =========================================================
   FIND MODES
========================================================= */

const FIND_MODES = [
  {
    id: 'map',
    icon: MapIcon,
    label: '地図から',
    labelEn: 'MAP',
  },

  {
    id: 'continent',
    icon: Compass,
    label: '大陸から',
    labelEn: 'CONTINENT',
  },

  {
    id: 'alphabet',
    icon: ListOrdered,
    label: 'A-Zから',
    labelEn: 'A–Z',
  },

  {
    id: 'search',
    icon: Search,
    label: '検索から',
    labelEn: 'SEARCH',
  },
];


/* =========================================================
   CONTINENTS
========================================================= */

const CONTINENTS = [
  {
    id: 'asia',
    emoji: '🌏',
    label: 'アジア',
    labelEn: 'ASIA',
  },

  {
    id: 'europe',
    emoji: '🌍',
    label: 'ヨーロッパ',
    labelEn: 'EUROPE',
  },

  {
    id: 'africa',
    emoji: '🌍',
    label: 'アフリカ',
    labelEn: 'AFRICA',
  },

  {
    id: 'americas',
    emoji: '🌎',
    label: '南北アメリカ',
    labelEn: 'AMERICAS',
  },

  {
    id: 'oceania',
    emoji: '🌏',
    label: 'オセアニア',
    labelEn: 'OCEANIA',
  },
];


const OTHER_CONTINENT = {
  id: 'other',
  emoji: '🌐',
  label: 'その他',
  labelEn: 'OTHER',
};


/* =========================================================
   COLORS
========================================================= */

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
    String(
      iso || ''
    )
      .split('')
      .reduce(
        (
          total,
          char
        ) =>
          total +
          char.charCodeAt(
            0
          ),
        0
      );

  return COUNTRY_COLORS[
    value %
      COUNTRY_COLORS.length
  ];
}


/* =========================================================
   HELPERS
========================================================= */

function getAtlasCountryName(
  geo
) {
  return (
    geo?.properties?.name ??
    ''
  );
}


function getContinentId(
  country
) {
  const region =
    String(
      country?.region ??
      ''
    ).toLowerCase();


  if (
    region.includes(
      'asia'
    )
  ) {
    return 'asia';
  }


  if (
    region.includes(
      'europe'
    )
  ) {
    return 'europe';
  }


  if (
    region.includes(
      'africa'
    )
  ) {
    return 'africa';
  }


  if (
    region.includes(
      'america'
    )
  ) {
    return 'americas';
  }


  if (
    region.includes(
      'oceania'
    ) ||
    region.includes(
      'australia'
    ) ||
    region.includes(
      'pacific'
    )
  ) {
    return 'oceania';
  }


  return 'other';
}


function hiraganaToKatakana(
  value
) {
  return String(
    value ?? ''
  ).replace(
    /[\u3041-\u3096]/g,
    (character) =>
      String.fromCharCode(
        character.charCodeAt(
          0
        ) + 0x60
      )
  );
}


function normalizeSearchText(
  value
) {
  return hiraganaToKatakana(
    String(
      value ?? ''
    )
      .normalize(
        'NFKC'
      )
      .toLowerCase()
      .trim()
  );
}


function countryMatchesSearch(
  country,
  query
) {
  const normalizedQuery =
    normalizeSearchText(
      query
    );


  if (
    !normalizedQuery
  ) {
    return true;
  }


  const searchValues = [
    country.nameJa,
    country.nameEn,
    country.capitalJa,
    country.capitalEn,
    country.iso,
    country.region,

    ...(
      country
        .mainLanguagesJa ??
      []
    ),

    ...(
      country
        .mainLanguagesEn ??
      []
    ),
  ];


  return searchValues.some(
    (value) =>
      normalizeSearchText(
        value
      ).includes(
        normalizedQuery
      )
  );
}


function getCountryInitial(
  country
) {
  const first =
    String(
      country?.nameEn ??
      ''
    )
      .charAt(
        0
      )
      .toUpperCase();


  return /^[A-Z]$/.test(
    first
  )
    ? first
    : '#';
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
              mission.points ??
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


/* =========================================================
   COUNTRY CARD
========================================================= */

function CountryCard({
  country,
  onOpen,
}) {
  const visual =
    getCountryVisual(
      country.iso
    );


  const stats =
    calculateCountryStats(
      country
    );


  return (
    <button
      type="button"
      onClick={() =>
        onOpen(
          country
        )
      }
      className="
        group
        relative
        flex
        min-h-[108px]
        w-full
        items-center
        gap-4
        overflow-hidden
        rounded-[22px]
        border
        border-slate-200
        bg-white
        p-4
        text-left
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
      "
    >

      <div
        className="
          absolute
          bottom-0
          left-0
          top-0
          w-1.5
        "
        style={{
          backgroundColor:
            visual.primary,
        }}
      />


      {/* FLAG */}

      <div
        className="
          flex
          h-[58px]
          w-[84px]
          shrink-0
          items-center
          justify-center
          overflow-hidden
          rounded-xl
          bg-slate-100
          shadow-sm
        "
      >

        {country.flagUrl ? (

          <img
            src={
              country.flagUrl
            }
            alt={`${country.nameEn} flag`}
            className="
              h-full
              w-full
              object-cover
            "
          />

        ) : (

          <span
            className="
              text-4xl
            "
          >
            {
              country.flagEmoji
            }
          </span>

        )}

      </div>


      {/* NAME */}

      <div
        className="
          min-w-0
          flex-1
        "
      >

        <p
          className="
            truncate
            text-lg
            font-black
            text-slate-900
          "
        >
          {
            country.nameEn
          }
        </p>


        <p
          className="
            mt-0.5
            truncate
            text-sm
            font-bold
            text-slate-400
          "
        >
          {
            country.nameJa
          }
        </p>


        <div
          className="
            mt-2
            flex
            items-center
            gap-3
          "
        >

          <span
            className="
              text-[9px]
              font-black
              tracking-[0.10em]
              text-slate-400
            "
          >
            {
              country.region
            }
          </span>


          {stats.completedCount > 0 && (

            <span
              className="
                text-[9px]
                font-black
                text-blue-500
              "
            >
              {
                stats.completionRate
              }%
            </span>

          )}

        </div>

      </div>


      {/* ARROW */}

      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-full
          text-white
          transition
          duration-300
          group-hover:translate-x-1
        "
        style={{
          backgroundColor:
            visual.primary,
        }}
      >

        <ArrowRight
          size={17}
        />

      </div>

    </button>
  );
}


/* =========================================================
   EXPLORE WORLD
========================================================= */

export default function ExploreWorld() {
  const [
    activeCountry,
    setActiveCountry,
  ] = useState(
    null
  );


  const [
    activeMode,
    setActiveMode,
  ] = useState(
    null
  );


  const [
    selectedContinent,
    setSelectedContinent,
  ] = useState(
    null
  );


  const [
    selectedLetter,
    setSelectedLetter,
  ] = useState(
    'ALL'
  );


  const [
    searchQuery,
    setSearchQuery,
  ] = useState(
    ''
  );


  const [
    hoveredCountry,
    setHoveredCountry,
  ] = useState(
    null
  );


  const [
    ,
    setProgressRevision,
  ] = useState(
    0
  );


  /* =======================================================
     COUNTRY ACTIONS
  ======================================================= */

  const openCountry =
    (
      country
    ) => {
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


  /* =======================================================
     MODE
  ======================================================= */

  const chooseMode =
    (
      modeId
    ) => {
      playUiSound(
        'tap'
      );


      setActiveMode(
        modeId
      );


      setHoveredCountry(
        null
      );
    };


  const backToModeSelection =
    () => {
      playUiSound(
        'back'
      );


      setActiveMode(
        null
      );


      setSelectedContinent(
        null
      );


      setSelectedLetter(
        'ALL'
      );


      setSearchQuery(
        ''
      );


      setHoveredCountry(
        null
      );
    };


  /* =======================================================
     CONTINENTS
  ======================================================= */

  const continentCounts =
    liveCountries.reduce(
      (
        result,
        country
      ) => {
        const continentId =
          getContinentId(
            country
          );


        result[
          continentId
        ] =
          (
            result[
              continentId
            ] ??
            0
          ) + 1;


        return result;
      },
      {}
    );


  const availableContinents = [
    ...CONTINENTS.filter(
      (continent) =>
        (
          continentCounts[
            continent.id
          ] ??
          0
        ) > 0
    ),

    ...(
      (
        continentCounts.other ??
        0
      ) > 0
        ? [
            OTHER_CONTINENT,
          ]
        : []
    ),
  ];


  const continentCountries =
    selectedContinent
      ? liveCountries.filter(
          (country) =>
            getContinentId(
              country
            ) ===
            selectedContinent
        )
      : [];


  /* =======================================================
     ALPHABET
  ======================================================= */

  const alphabet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      .split(
        ''
      );


  const availableLetters =
    new Set(
      liveCountries.map(
        (
          country
        ) =>
          getCountryInitial(
            country
          )
      )
    );


  const alphabetCountries =
    selectedLetter ===
    'ALL'
      ? liveCountries
      : liveCountries.filter(
          (country) =>
            getCountryInitial(
              country
            ) ===
            selectedLetter
        );


  /* =======================================================
     SEARCH
  ======================================================= */

  const searchResults =
    liveCountries.filter(
      (
        country
      ) =>
        countryMatchesSearch(
          country,
          searchQuery
        )
    );


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="
        h-[calc(100dvh-68px)]
        min-h-[620px]
        overflow-hidden
        bg-[#f5f3ee]
      "
    >

      <div
        className="
          mx-auto
          flex
          h-full
          w-full
          max-w-[1500px]
          flex-col
          px-5
          py-5
          md:px-8
          md:py-6
          lg:px-10
        "
      >

        {/* =================================================
            HEADER
        ================================================== */}

        <div
          className="
            flex
            shrink-0
            items-end
            justify-between
            gap-4
            border-b
            border-slate-200
            pb-5
          "
        >

          <div>

            <p
              className="
                text-[10px]
                font-black
                tracking-[0.20em]
                text-blue-500
              "
            >
              WORLD ADVENTURE
            </p>


            <h1
              className="
                mt-1
                text-3xl
                font-black
                tracking-[-0.04em]
                text-slate-950
                md:text-4xl
              "
            >
              国を選ぼう
            </h1>

          </div>


          <div
            className="
              hidden
              items-center
              gap-2
              rounded-full
              bg-white
              px-4
              py-2
              text-xs
              font-black
              text-slate-500
              shadow-sm
              md:flex
            "
          >

            <Globe2
              size={15}
              className="text-blue-500"
            />

            {
              liveCountries.length
            } COUNTRIES

          </div>

        </div>


        {/* =================================================
            MODE SELECTION
        ================================================== */}

        {!activeMode ? (

          <div
            className="
              flex
              min-h-0
              flex-1
              items-center
              justify-center
            "
          >

            <div
              className="
                grid
                w-full
                max-w-[1050px]
                grid-cols-2
                gap-4
                lg:grid-cols-4
              "
            >

              {FIND_MODES.map(
                (
                  mode
                ) => {
                  const Icon =
                    mode.icon;


                  return (
                    <button
                      key={
                        mode.id
                      }
                      type="button"
                      onClick={() =>
                        chooseMode(
                          mode.id
                        )
                      }
                      className="
                        group
                        relative
                        min-h-[220px]
                        overflow-hidden
                        rounded-[28px]
                        border
                        border-slate-200
                        bg-white
                        p-6
                        text-left
                        shadow-[0_10px_35px_rgba(15,23,42,0.06)]
                        transition-all
                        duration-300
                        hover:-translate-y-2
                        hover:border-blue-200
                        hover:shadow-[0_22px_55px_rgba(37,99,235,0.14)]
                      "
                    >

                      <div
                        className="
                          pointer-events-none
                          absolute
                          -right-8
                          -top-8
                          h-32
                          w-32
                          rounded-full
                          bg-blue-50
                          transition
                          duration-300
                          group-hover:scale-125
                          group-hover:bg-blue-100
                        "
                      />


                      <div
                        className="
                          relative
                          flex
                          h-14
                          w-14
                          items-center
                          justify-center
                          rounded-2xl
                          bg-slate-950
                          text-white
                          shadow-lg
                          transition
                          duration-300
                          group-hover:bg-blue-600
                        "
                      >

                        <Icon
                          size={25}
                        />

                      </div>


                      <p
                        className="
                          relative
                          mt-8
                          text-[10px]
                          font-black
                          tracking-[0.16em]
                          text-blue-500
                        "
                      >
                        {
                          mode.labelEn
                        }
                      </p>


                      <h2
                        className="
                          relative
                          mt-1
                          text-xl
                          font-black
                          text-slate-900
                          md:text-2xl
                        "
                      >
                        {
                          mode.label
                        }
                      </h2>


                      <div
                        className="
                          absolute
                          bottom-5
                          right-5
                          flex
                          h-10
                          w-10
                          items-center
                          justify-center
                          rounded-full
                          bg-slate-100
                          text-slate-500
                          transition
                          duration-300
                          group-hover:translate-x-1
                          group-hover:bg-blue-600
                          group-hover:text-white
                        "
                      >

                        <ArrowRight
                          size={18}
                        />

                      </div>

                    </button>
                  );
                }
              )}

            </div>

          </div>

        ) : (

          <>
            {/* ===============================================
                MODE BAR
            ================================================ */}

            <div
              className="
                mt-4
                flex
                shrink-0
                items-center
                gap-2
                overflow-x-auto
                pb-1
              "
            >

              <button
                type="button"
                onClick={
                  backToModeSelection
                }
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-500
                  transition
                  hover:bg-slate-950
                  hover:text-white
                "
                aria-label="選び方に戻る"
              >

                <ArrowLeft
                  size={18}
                />

              </button>


              {FIND_MODES.map(
                (
                  mode
                ) => {
                  const Icon =
                    mode.icon;


                  const active =
                    activeMode ===
                    mode.id;


                  return (
                    <button
                      key={
                        mode.id
                      }
                      type="button"
                      onClick={() =>
                        chooseMode(
                          mode.id
                        )
                      }
                      className={`
                        flex
                        shrink-0
                        items-center
                        gap-2
                        rounded-xl
                        px-4
                        py-3
                        text-xs
                        font-black
                        transition

                        ${
                          active
                            ? 'bg-slate-950 text-white shadow-lg'
                            : 'border border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                        }
                      `}
                    >

                      <Icon
                        size={15}
                      />

                      {
                        mode.label
                      }

                    </button>
                  );
                }
              )}

            </div>


            {/* ===============================================
                CONTENT
            ================================================ */}

            <div
              className="
                mt-4
                min-h-0
                flex-1
                overflow-hidden
              "
            >

              {/* =============================================
                  MAP
              ============================================== */}

              {activeMode ===
                'map' && (

                <div
                  className="
                    relative
                    h-full
                    overflow-hidden
                    rounded-[28px]
                    border
                    border-slate-200
                    bg-[#dceaf0]
                    shadow-sm
                  "
                >

                  {/* HOVERED COUNTRY */}

                  {hoveredCountry && (

                    <div
                      className="
                        absolute
                        left-5
                        top-5
                        z-20
                        flex
                        items-center
                        gap-3
                        rounded-2xl
                        border
                        border-white/70
                        bg-white/95
                        px-4
                        py-3
                        shadow-xl
                        backdrop-blur
                      "
                    >

                      <span
                        className="
                          text-2xl
                        "
                      >
                        {
                          hoveredCountry
                            .flagEmoji
                        }
                      </span>


                      <div>

                        <p
                          className="
                            font-black
                            text-slate-900
                          "
                        >
                          {
                            hoveredCountry
                              .nameEn
                          }
                        </p>

                        <p
                          className="
                            text-xs
                            font-bold
                            text-slate-400
                          "
                        >
                          {
                            hoveredCountry
                              .nameJa
                          }
                        </p>

                      </div>

                    </div>

                  )}


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
                    className="
                      h-full
                      w-full
                    "
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
                          (
                            geo
                          ) => {
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
                                    ? `${country.nameJa}を探検する`
                                    : undefined
                                }
                                onMouseEnter={() => {
                                  if (
                                    live
                                  ) {
                                    setHoveredCountry(
                                      country
                                    );
                                  }
                                }}
                                onMouseLeave={() =>
                                  setHoveredCountry(
                                    null
                                  )
                                }
                                onFocus={() => {
                                  if (
                                    live
                                  ) {
                                    setHoveredCountry(
                                      country
                                    );
                                  }
                                }}
                                onBlur={() =>
                                  setHoveredCountry(
                                    null
                                  )
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
                                        ? 1.25
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

              )}


              {/* =============================================
                  CONTINENT
              ============================================== */}

              {activeMode ===
                'continent' && (

                <div
                  className="
                    flex
                    h-full
                    flex-col
                    overflow-hidden
                  "
                >

                  {!selectedContinent ? (

                    <div
                      className="
                        flex
                        flex-1
                        items-center
                        justify-center
                      "
                    >

                      <div
                        className="
                          grid
                          w-full
                          max-w-[1050px]
                          grid-cols-2
                          gap-4
                          lg:grid-cols-3
                        "
                      >

                        {availableContinents.map(
                          (
                            continent
                          ) => (

                            <button
                              key={
                                continent.id
                              }
                              type="button"
                              onClick={() => {
                                playUiSound(
                                  'tap'
                                );


                                setSelectedContinent(
                                  continent.id
                                );
                              }}
                              className="
                                group
                                flex
                                min-h-[160px]
                                items-center
                                gap-5
                                rounded-[26px]
                                border
                                border-slate-200
                                bg-white
                                p-6
                                text-left
                                shadow-sm
                                transition-all
                                duration-300
                                hover:-translate-y-1
                                hover:border-blue-200
                                hover:shadow-xl
                              "
                            >

                              <span
                                className="
                                  text-5xl
                                "
                              >
                                {
                                  continent.emoji
                                }
                              </span>


                              <div
                                className="
                                  min-w-0
                                  flex-1
                                "
                              >

                                <p
                                  className="
                                    text-[9px]
                                    font-black
                                    tracking-[0.15em]
                                    text-blue-500
                                  "
                                >
                                  {
                                    continent.labelEn
                                  }
                                </p>


                                <p
                                  className="
                                    mt-1
                                    text-xl
                                    font-black
                                    text-slate-900
                                  "
                                >
                                  {
                                    continent.label
                                  }
                                </p>


                                <p
                                  className="
                                    mt-2
                                    text-xs
                                    font-black
                                    text-slate-400
                                  "
                                >
                                  {
                                    continentCounts[
                                      continent.id
                                    ] ??
                                    0
                                  }
                                  {' '}
                                  COUNTRIES
                                </p>

                              </div>


                              <ArrowRight
                                size={19}
                                className="
                                  text-slate-300
                                  transition
                                  group-hover:translate-x-1
                                  group-hover:text-blue-500
                                "
                              />

                            </button>

                          )
                        )}

                      </div>

                    </div>

                  ) : (

                    <div
                      className="
                        flex
                        h-full
                        flex-col
                      "
                    >

                      <div
                        className="
                          flex
                          shrink-0
                          items-center
                          gap-3
                          pb-4
                        "
                      >

                        <button
                          type="button"
                          onClick={() => {
                            playUiSound(
                              'back'
                            );


                            setSelectedContinent(
                              null
                            );
                          }}
                          className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-full
                            bg-white
                            text-slate-500
                            shadow-sm
                            transition
                            hover:bg-slate-950
                            hover:text-white
                          "
                        >

                          <ArrowLeft
                            size={16}
                          />

                        </button>


                        <p
                          className="
                            text-lg
                            font-black
                            text-slate-900
                          "
                        >
                          {
                            availableContinents.find(
                              (
                                continent
                              ) =>
                                continent.id ===
                                selectedContinent
                            )?.label
                          }
                        </p>

                      </div>


                      <div
                        className="
                          min-h-0
                          flex-1
                          overflow-y-auto
                          pr-1
                        "
                      >

                        <div
                          className="
                            grid
                            grid-cols-1
                            gap-3
                            md:grid-cols-2
                            xl:grid-cols-3
                          "
                        >

                          {continentCountries.map(
                            (
                              country
                            ) => (

                              <CountryCard
                                key={
                                  country.iso
                                }
                                country={
                                  country
                                }
                                onOpen={
                                  openCountry
                                }
                              />

                            )
                          )}

                        </div>

                      </div>

                    </div>

                  )}

                </div>

              )}


              {/* =============================================
                  ALPHABET
              ============================================== */}

              {activeMode ===
                'alphabet' && (

                <div
                  className="
                    flex
                    h-full
                    flex-col
                  "
                >

                  {/* LETTERS */}

                  <div
                    className="
                      flex
                      shrink-0
                      flex-wrap
                      gap-2
                      pb-4
                    "
                  >

                    <button
                      type="button"
                      onClick={() => {
                        playUiSound(
                          'tap'
                        );


                        setSelectedLetter(
                          'ALL'
                        );
                      }}
                      className={`
                        h-10
                        rounded-xl
                        px-4
                        text-xs
                        font-black
                        transition

                        ${
                          selectedLetter ===
                            'ALL'
                            ? 'bg-slate-950 text-white'
                            : 'border border-slate-200 bg-white text-slate-500'
                        }
                      `}
                    >
                      ALL
                    </button>


                    {alphabet.map(
                      (
                        letter
                      ) => {
                        const enabled =
                          availableLetters.has(
                            letter
                          );


                        const selected =
                          selectedLetter ===
                          letter;


                        return (
                          <button
                            key={
                              letter
                            }
                            type="button"
                            disabled={
                              !enabled
                            }
                            onClick={() => {
                              playUiSound(
                                'tap'
                              );


                              setSelectedLetter(
                                letter
                              );
                            }}
                            className={`
                              flex
                              h-10
                              w-10
                              items-center
                              justify-center
                              rounded-xl
                              text-xs
                              font-black
                              transition

                              ${
                                selected
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : enabled
                                    ? 'border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                                    : 'border border-slate-100 bg-slate-100 text-slate-300'
                              }
                            `}
                          >
                            {
                              letter
                            }
                          </button>
                        );
                      }
                    )}

                  </div>


                  {/* COUNTRY LIST */}

                  <div
                    className="
                      min-h-0
                      flex-1
                      overflow-y-auto
                      pr-1
                    "
                  >

                    <div
                      className="
                        grid
                        grid-cols-1
                        gap-3
                        md:grid-cols-2
                        xl:grid-cols-3
                      "
                    >

                      {alphabetCountries.map(
                        (
                          country
                        ) => (

                          <CountryCard
                            key={
                              country.iso
                            }
                            country={
                              country
                            }
                            onOpen={
                              openCountry
                            }
                          />

                        )
                      )}

                    </div>

                  </div>

                </div>

              )}


              {/* =============================================
                  SEARCH
              ============================================== */}

              {activeMode ===
                'search' && (

                <div
                  className="
                    flex
                    h-full
                    flex-col
                  "
                >

                  {/* SEARCH BAR */}

                  <div
                    className="
                      relative
                      shrink-0
                    "
                  >

                    <Search
                      size={21}
                      className="
                        absolute
                        left-5
                        top-1/2
                        -translate-y-1/2
                        text-slate-400
                      "
                    />


                    <input
                      autoFocus
                      type="search"
                      value={
                        searchQuery
                      }
                      onChange={(
                        event
                      ) =>
                        setSearchQuery(
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="国名を日本語・英語で検索"
                      className="
                        h-16
                        w-full
                        rounded-[20px]
                        border
                        border-slate-200
                        bg-white
                        pl-14
                        pr-5
                        text-base
                        font-bold
                        text-slate-900
                        shadow-sm
                        outline-none
                        transition
                        placeholder:text-slate-300
                        focus:border-blue-400
                        focus:ring-4
                        focus:ring-blue-100
                      "
                    />

                  </div>


                  {/* RESULTS */}

                  <div
                    className="
                      mt-4
                      min-h-0
                      flex-1
                      overflow-y-auto
                      pr-1
                    "
                  >

                    {searchResults.length >
                    0 ? (

                      <div
                        className="
                          grid
                          grid-cols-1
                          gap-3
                          md:grid-cols-2
                          xl:grid-cols-3
                        "
                      >

                        {searchResults.map(
                          (
                            country
                          ) => (

                            <CountryCard
                              key={
                                country.iso
                              }
                              country={
                                country
                              }
                              onOpen={
                                openCountry
                              }
                            />

                          )
                        )}

                      </div>

                    ) : (

                      <div
                        className="
                          flex
                          h-full
                          items-center
                          justify-center
                        "
                      >

                        <div
                          className="
                            text-center
                          "
                        >

                          <div
                            className="
                              text-4xl
                            "
                          >
                            🔎
                          </div>

                          <p
                            className="
                              mt-3
                              font-black
                              text-slate-500
                            "
                          >
                            見つかりませんでした
                          </p>

                        </div>

                      </div>

                    )}

                  </div>

                </div>

              )}

            </div>

          </>

        )}

      </div>


      {/* ===================================================
          COUNTRY DETAIL
      ==================================================== */}

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