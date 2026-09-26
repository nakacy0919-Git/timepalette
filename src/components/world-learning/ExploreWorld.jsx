import {
  ArrowLeft,
  ArrowRight,
  Compass,
  Globe2,
  ListOrdered,
  Map as MapIcon,
  Minus,
  Plus,
  RotateCcw,
  Search,
} from 'lucide-react';

import exploreWorldBackground
  from '../../assets/world-adventure/explore_world_background.png';

import timePaletteLogo
  from '../../assets/branding/timepalette_global_adventure_logo.png';

import buttonMap
  from '../../assets/world-adventure/buttons/button1.png';

import buttonContinent
  from '../../assets/world-adventure/buttons/button2.png';

import buttonAlphabet
  from '../../assets/world-adventure/buttons/button3.png';

import buttonSearch
  from '../../assets/world-adventure/buttons/button4.png';

import {
  useState,
} from 'react';

import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
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

const DEFAULT_MAP_CENTER = [
  5,
  6,
];

const DEFAULT_MAP_ZOOM = 1.18;

const MAP_MIN_ZOOM = 1;

const MAP_MAX_ZOOM = 4;

const MAP_ZOOM_STEP = 0.45;

/* =========================================================
   FIND MODES
========================================================= */

const FIND_MODES = [
  {
    id: 'map',
    icon: MapIcon,
    image: buttonMap,
    label: '地図から',
    labelEn: 'MAP',
  },

  {
    id: 'continent',
    icon: Compass,
    image: buttonContinent,
    label: '大陸から',
    labelEn: 'CONTINENT',
  },

  {
    id: 'alphabet',
    icon: ListOrdered,
    image: buttonAlphabet,
    label: 'A-Zから',
    labelEn: 'A–Z',
  },

  {
    id: 'search',
    icon: Search,
    image: buttonSearch,
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
  border-white/80
  bg-white/[0.72]
  p-4
  text-left
  shadow-[0_12px_35px_rgba(14,165,233,0.10)]
  backdrop-blur-xl
  transition-all
  duration-300
  hover:-translate-y-1
  hover:border-cyan-300/80
  hover:bg-white/90
  hover:shadow-[0_20px_50px_rgba(14,165,233,0.20)]
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


function CountrySelectionLanding({
  onChooseMode,
}) {
  return (
    <div
      className="
        relative
        h-[calc(100dvh-68px)]
        min-h-[650px]
        overflow-hidden
        bg-[#07111f]
        text-white
      "
    >

      <style>
        {`
          @keyframes tp-world-drift {
            0% {
              transform:
                scale(1.04)
                translate3d(0, 0, 0);
            }

            50% {
              transform:
                scale(1.09)
                translate3d(-1.2%, -0.6%, 0);
            }

            100% {
              transform:
                scale(1.06)
                translate3d(1%, 0.4%, 0);
            }
          }

          @keyframes tp-glow-float {
            0% {
              transform:
                translate3d(0, 0, 0)
                scale(1);
            }

            50% {
              transform:
                translate3d(30px, -18px, 0)
                scale(1.08);
            }

            100% {
              transform:
                translate3d(-15px, 12px, 0)
                scale(0.96);
            }
          }

          .tp-world-background {
            animation:
              tp-world-drift
              24s
              ease-in-out
              infinite
              alternate;
            transform-origin:
              center center;
          }

          .tp-world-glow {
            animation:
              tp-glow-float
              12s
              ease-in-out
              infinite
              alternate;
          }

          @media (
            prefers-reduced-motion:
            reduce
          ) {
            .tp-world-background,
            .tp-world-glow {
              animation: none;
            }
          }
        `}
      </style>


      {/* BACKGROUND */}

      <img
        src={
          exploreWorldBackground
        }
        alt=""
        aria-hidden="true"
        className="
          tp-world-background
          absolute
          inset-0
          h-full
          w-full
          object-cover
          object-center
        "
      />


      {/* CINEMATIC OVERLAYS */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-b
          from-slate-950/42
          via-slate-950/18
          to-slate-950/72
        "
      />


      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-slate-950/46
          via-transparent
          to-slate-950/35
        "
      />


      <div
        className="
          absolute
          inset-x-0
          bottom-0
          h-[45%]
          bg-gradient-to-t
          from-[#07111f]/90
          via-[#07111f]/35
          to-transparent
        "
      />


      {/* MOVING LIGHT */}

      <div
        className="
          tp-world-glow
          pointer-events-none
          absolute
          -left-24
          top-[18%]
          h-[430px]
          w-[430px]
          rounded-full
          bg-blue-500/20
          blur-[120px]
        "
      />


      <div
        className="
          tp-world-glow
          pointer-events-none
          absolute
          right-[-120px]
          top-[28%]
          h-[450px]
          w-[450px]
          rounded-full
          bg-violet-500/15
          blur-[130px]
        "
        style={{
          animationDelay:
            '-5s',
        }}
      />


      {/* CONTENT */}

      <div
        className="
          relative
          z-10
          mx-auto
          flex
          h-full
          w-full
          max-w-none
           flex-col
px-2
py-4
sm:px-3
md:px-5
md:py-5
lg:px-6
        "
      >

        {/* TOP */}

        <div
          className="
            flex
            shrink-0
            items-start
            justify-between
          "
        >

          <img
            src={
              timePaletteLogo
            }
            alt="TimePalette World Adventure"
            className="
              w-[190px]
              drop-shadow-[0_10px_25px_rgba(0,0,0,0.45)]
              sm:w-[220px]
              lg:w-[255px]
            "
          />


          <div
            className="
              flex
              items-center
              gap-3
              rounded-full
              border
              border-white/20
              bg-slate-950/30
              px-4
              py-2.5
              shadow-lg
              backdrop-blur-xl
            "
          >

            <Globe2
              size={16}
              className="
                text-cyan-300
              "
            />


            <span
              className="
                text-xs
                font-black
                tracking-[0.10em]
                text-white/85
              "
            >
              {
                liveCountries.length
              } COUNTRIES
            </span>

          </div>

        </div>


        {/* TITLE */}

        <div
          className="
            mt-2
            shrink-0
            text-center
            md:mt-0
          "
        >

          <p
            className="
              text-[10px]
              font-black
              tracking-[0.32em]
              text-cyan-200
              md:text-xs
            "
          >
            WORLD ADVENTURE
          </p>


          <h1
            className="
              mt-2
              text-4xl
              font-black
              tracking-[-0.045em]
              text-white
              drop-shadow-[0_5px_20px_rgba(0,0,0,0.55)]
              md:text-5xl
              lg:text-[58px]
            "
          >
            国を選ぼう
          </h1>

        </div>


        {/* MODE BUTTONS */}

<div
  className="
    flex
    min-h-0
    flex-1
    items-center
    justify-center
    px-2
    pb-2
    pt-1
    md:-translate-y-1
  "
>

  <div
  className="
    grid
    w-full
    max-w-[1280px]
    grid-cols-2
    items-center
    justify-items-center
    gap-x-3
    gap-y-2

    sm:gap-x-5

    lg:grid-cols-4
    lg:gap-x-2
  "
>

            {FIND_MODES.map(
  (mode) => (
    <button
      key={mode.id}
      type="button"
      onClick={() =>
        onChooseMode(
          mode.id
        )
      }
      aria-label={mode.label}
      className="
        group
        relative
        flex
        items-center
        justify-center
        bg-transparent
        p-0
        outline-none
        transition-all
        duration-300

        hover:-translate-y-2
        hover:scale-[1.045]

        focus-visible:scale-[1.04]
      "
    >

      {/* HOVER GLOW */}

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[78%]
          w-[82%]
          -translate-x-1/2
          -translate-y-1/2
          rounded-[35%]
          bg-cyan-400/0
          blur-[32px]
          transition-all
          duration-300

          group-hover:bg-cyan-400/30
        "
      />


      {/* PNG BUTTON */}

      <img
        src={mode.image}
        alt=""
        aria-hidden="true"
        draggable="false"
        className="
          relative
          z-10
          h-auto
          w-full
          max-w-[300px]
          select-none
          object-contain

          drop-shadow-[0_18px_28px_rgba(0,0,0,0.35)]

          transition-all
          duration-300

          group-hover:
          drop-shadow-[0_24px_35px_rgba(56,189,248,0.45)]
        "
      />

    </button>
  )
)}
          </div>

        </div>


        {/* BOTTOM */}

        <div
          className="
            hidden
            shrink-0
            justify-center
            pb-1
            md:flex
          "
        >

          <div
            className="
              rounded-full
              border
              border-white/10
              bg-black/20
              px-5
              py-2
              text-[9px]
              font-black
              tracking-[0.25em]
              text-white/45
              backdrop-blur-md
            "
          >
            EXPLORE · LEARN · CONNECT
          </div>

        </div>

      </div>

    </div>
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

  const [
  mapPosition,
  setMapPosition,
] = useState({
  coordinates:
    DEFAULT_MAP_CENTER,

  zoom:
    DEFAULT_MAP_ZOOM,
});

const zoomMapIn =
  () => {
    playUiSound(
      'tap'
    );

    setMapPosition(
      (
        current
      ) => ({
        ...current,

        zoom:
          Math.min(
            MAP_MAX_ZOOM,
            current.zoom +
              MAP_ZOOM_STEP
          ),
      })
    );
  };


const zoomMapOut =
  () => {
    playUiSound(
      'tap'
    );

    setMapPosition(
      (
        current
      ) => ({
        ...current,

        zoom:
          Math.max(
            MAP_MIN_ZOOM,
            current.zoom -
              MAP_ZOOM_STEP
          ),
      })
    );
  };


const resetMapView =
  () => {
    playUiSound(
      'tap'
    );

    setMapPosition({
      coordinates:
        DEFAULT_MAP_CENTER,

      zoom:
        DEFAULT_MAP_ZOOM,
    });
  };

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

if (
  !activeMode
) {
  return (
    <CountrySelectionLanding
      onChooseMode={
        chooseMode
      }
    />
  );
}
  /* =======================================================
     RENDER
  ======================================================= */

  return (
  <div
    className="
      relative
      h-[calc(100dvh-68px)]
      min-h-[620px]
      overflow-hidden
      bg-[#dff4ff]
    "
  >

    {/* WORLD BACKGROUND */}

    <img
      src={exploreWorldBackground}
      alt=""
      aria-hidden="true"
      className="
        pointer-events-none
        absolute
        inset-0
        h-full
        w-full
        scale-[1.05]
        object-cover
        object-center
        opacity-[0.20]
      "
    />


    {/* BLUE / CYAN VEIL */}

    <div
      className="
        pointer-events-none
        absolute
        inset-0
        bg-gradient-to-br
        from-cyan-50/80
        via-sky-100/72
        to-blue-100/82
      "
    />


    {/* LIGHT GLOWS */}

    <div
      className="
        pointer-events-none
        absolute
        -left-40
        top-[5%]
        h-[560px]
        w-[560px]
        rounded-full
        bg-cyan-300/30
        blur-[130px]
      "
    />

    <div
      className="
        pointer-events-none
        absolute
        left-[38%]
        top-[20%]
        h-[480px]
        w-[480px]
        rounded-full
        bg-sky-300/22
        blur-[150px]
      "
    />

    <div
      className="
        pointer-events-none
        absolute
        -right-40
        bottom-[-10%]
        h-[620px]
        w-[620px]
        rounded-full
        bg-blue-300/28
        blur-[150px]
      "
    />


    {/* CONTENT */}

    <div
      className="
        relative
        z-10
        mx-auto
        flex
        h-full
        w-full
        max-w-none
         flex-col
px-2
py-4
sm:px-3
md:px-5
md:py-5
lg:px-6
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

  {/* BACK TO MODE SELECTION */}

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
      border-white/80
      bg-white/70
      text-slate-500
      shadow-[0_8px_24px_rgba(14,165,233,0.10)]
      backdrop-blur-xl
      transition-all
      duration-300
      hover:-translate-y-0.5
      hover:border-cyan-300
      hover:bg-blue-600
      hover:text-white
      hover:shadow-[0_10px_28px_rgba(14,165,233,0.22)]
    "
    aria-label="選び方に戻る"
  >

    <ArrowLeft
      size={18}
    />

  </button>


  {/* MODE BUTTONS */}

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
            border
            px-4
            py-3
            text-xs
            font-black
            backdrop-blur-xl
            transition-all
            duration-300

            ${
              active
                ? `
                  border-cyan-300/70
                  bg-gradient-to-r
                  from-blue-600
                  to-cyan-500
                  text-white
                  shadow-[0_8px_24px_rgba(14,165,233,0.30)]
                `
                : `
                  border-white/80
                  bg-white/65
                  text-slate-600
                  shadow-[0_6px_18px_rgba(14,165,233,0.08)]
                  hover:-translate-y-0.5
                  hover:border-cyan-300
                  hover:bg-white/90
                  hover:text-blue-600
                  hover:shadow-[0_10px_26px_rgba(14,165,233,0.16)]
                `
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
      w-full
      overflow-hidden
      rounded-[28px]
      border
      border-white/80
      bg-gradient-to-br
      from-cyan-50/85
      via-sky-100/80
      to-blue-100/85
      shadow-[0_24px_70px_rgba(14,165,233,0.16)]
      backdrop-blur-xl
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
    scale: 170,

    center: [
      0,
      5,
    ],
  }}
  width={1200}
  height={590}
  className="
    h-full
    w-full
  "
>

  <ZoomableGroup
    center={
      mapPosition.coordinates
    }
    zoom={
      mapPosition.zoom
    }
    minZoom={
      MAP_MIN_ZOOM
    }
    maxZoom={
      MAP_MAX_ZOOM
    }
    onMoveEnd={(
      position
    ) => {
      setMapPosition({
        coordinates:
          position.coordinates,

        zoom:
          position.zoom,
      });
    }}
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
                      0.6,

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
                        ? 1.1
                        : 0.6,

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

  </ZoomableGroup>

</ComposableMap>

{/* MAP CONTROLS */}

<div
  className="
    absolute
    bottom-4
    right-4
    z-30
    flex
    flex-col
    gap-2
    md:bottom-5
    md:right-5
  "
>

  {/* PLUS */}

  <button
    type="button"
    onClick={
      zoomMapIn
    }
    disabled={
      mapPosition.zoom >=
      MAP_MAX_ZOOM
    }
    aria-label="地図を拡大"
    className="
      flex
      h-12
      w-12
      items-center
      justify-center
      rounded-2xl
      border
      border-white/80
      bg-white/90
      text-blue-600
      shadow-[0_10px_30px_rgba(15,23,42,0.18)]
      backdrop-blur-xl
      transition-all
      duration-200
      hover:-translate-y-0.5
      hover:bg-blue-600
      hover:text-white
      disabled:opacity-35
      md:h-14
      md:w-14
    "
  >
    <Plus
      size={24}
      strokeWidth={2.5}
    />
  </button>


  {/* MINUS */}

  <button
    type="button"
    onClick={
      zoomMapOut
    }
    disabled={
      mapPosition.zoom <=
      MAP_MIN_ZOOM
    }
    aria-label="地図を縮小"
    className="
      flex
      h-12
      w-12
      items-center
      justify-center
      rounded-2xl
      border
      border-white/80
      bg-white/90
      text-blue-600
      shadow-[0_10px_30px_rgba(15,23,42,0.18)]
      backdrop-blur-xl
      transition-all
      duration-200
      hover:-translate-y-0.5
      hover:bg-blue-600
      hover:text-white
      disabled:opacity-35
      md:h-14
      md:w-14
    "
  >
    <Minus
      size={24}
      strokeWidth={2.5}
    />
  </button>


  {/* RESET */}

  <button
    type="button"
    onClick={
      resetMapView
    }
    aria-label="地図を元の大きさに戻す"
    className="
      flex
      h-10
      w-12
      items-center
      justify-center
      rounded-xl
      border
      border-white/70
      bg-white/80
      text-slate-500
      shadow-lg
      backdrop-blur-xl
      transition-all
      duration-200
      hover:bg-slate-900
      hover:text-white
      md:h-11
      md:w-14
    "
  >
    <RotateCcw
      size={18}
    />
  </button>

</div>

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
  border-white/80
  bg-white/68
  p-6
  text-left
  shadow-[0_14px_40px_rgba(14,165,233,0.10)]
  backdrop-blur-xl
  transition-all
  duration-300
  hover:-translate-y-1
  hover:border-cyan-300
  hover:bg-white/85
  hover:shadow-[0_22px_55px_rgba(14,165,233,0.20)]
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
    ? 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-[0_8px_22px_rgba(14,165,233,0.32)]'
    : 'border border-white/80 bg-white/[0.65] text-slate-600 backdrop-blur-lg hover:bg-white/90 hover:text-blue-600'
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
    ? 'bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-[0_8px_22px_rgba(14,165,233,0.32)]'
    : enabled
      ? 'border border-white/80 bg-white/[0.65] text-slate-600 backdrop-blur-lg hover:bg-white/90 hover:border-cyan-300 hover:text-blue-600'
      : 'border border-white/40 bg-white/30 text-slate-300'
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
    border-white/85
    bg-white/70
    pl-14
    pr-5
    text-base
    font-bold
    text-slate-900
    shadow-[0_14px_45px_rgba(14,165,233,0.12)]
    backdrop-blur-xl
    outline-none
    transition-all
    duration-300
    placeholder:text-slate-400
    focus:border-cyan-400
    focus:bg-white/90
    focus:ring-4
    focus:ring-cyan-200/50
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