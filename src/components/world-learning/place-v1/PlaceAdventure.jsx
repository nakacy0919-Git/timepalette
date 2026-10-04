import {
  Check,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from 'react-simple-maps';

import worldAtlas
  from 'world-atlas/countries-110m.json';

import data
  from '../../../data/place_r.json';

import {
  playUiSound,
} from '../../../utils/uiSound';

import {
  completePlaceMission,
  getPlaceProgress,
} from '../../../utils/placeProgressStorage';

import CommonsImage
  from './CommonsImage';

import PlaceMissionSuccessModal
  from './PlaceMissionSuccessModal';


/* =========================================================
   BASIC
========================================================= */

const LEVELS = [
  {
    id: 'elementary',
    ja: '小学生',
    en: 'Elementary',
    icon: '🧒',
  },
  {
    id: 'juniorHigh',
    ja: '中学生',
    en: 'Junior High',
    icon: '🧑',
  },
  {
    id: 'highSchoolStandard',
    ja: '高校生',
    en: 'High School',
    icon: '🎓',
  },
  {
    id: 'highSchoolAdvanced',
    ja: '高校生 Challenge',
    en: 'High School Challenge',
    icon: '🚀',
  },
];


const COUNTRY =
  data.country;


const buttonBase =
  `
    rounded-2xl
    border-2
    px-4
    py-3
    font-black
    transition
    active:scale-[0.98]
  `;


function t(
  value,
  language
) {
  if (
    typeof value ===
    'string'
  ) {
    return value;
  }

  return (
    value?.[language] ??
    value?.ja ??
    value?.en ??
    ''
  );
}


function shuffleArray(
  array
) {
  const result = [
    ...array,
  ];

  for (
    let i =
      result.length -
      1;
    i > 0;
    i -= 1
  ) {
    const j =
      Math.floor(
        Math.random() *
        (
          i +
          1
        )
      );

    [
      result[i],
      result[j],
    ] = [
      result[j],
      result[i],
    ];
  }

  return result;
}


/* =========================================================
   RETRY MESSAGE
========================================================= */

function RetryMessage({
  show,
  children,
}) {
  if (
    !show
  ) {
    return null;
  }

  return (
    <div
      className="
        mt-5
        rounded-3xl
        border
        border-orange-200
        bg-orange-50
        p-5
        text-orange-800
      "
    >
      <p
        className="
          text-lg
          font-black
        "
      >
        👀 もう一度考えてみよう
      </p>

      <p
        className="
          mt-2
          text-sm
          font-bold
          leading-6
        "
      >
        {children}
      </p>
    </div>
  );
}


/* =========================================================
   MAP CONTROLS
========================================================= */

function MapControls({
  zoom,
  minZoom,
  maxZoom,
  onZoomIn,
  onZoomOut,
  onReset,
}) {
  return (
    <div
      className="
        absolute
        right-4
        top-4
        z-30
        flex
        flex-col
        gap-2
      "
    >
      <button
        type="button"
        onClick={
          onZoomIn
        }
        disabled={
          zoom >=
          maxZoom
        }
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          border
          border-white/80
          bg-white/95
          text-slate-700
          shadow-lg
          backdrop-blur
          transition
          hover:bg-blue-50
          disabled:opacity-30
        "
        title="拡大"
      >
        <Plus
          size={20}
          strokeWidth={3}
        />
      </button>

      <button
        type="button"
        onClick={
          onZoomOut
        }
        disabled={
          zoom <=
          minZoom
        }
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          border
          border-white/80
          bg-white/95
          text-slate-700
          shadow-lg
          backdrop-blur
          transition
          hover:bg-blue-50
          disabled:opacity-30
        "
        title="縮小"
      >
        <Minus
          size={20}
          strokeWidth={3}
        />
      </button>

      <button
        type="button"
        onClick={
          onReset
        }
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          border
          border-white/80
          bg-white/95
          text-slate-700
          shadow-lg
          backdrop-blur
          transition
          hover:bg-blue-50
        "
        title="初期位置へ戻す"
      >
        <RotateCcw
          size={17}
        />
      </button>
    </div>
  );
}


/* =========================================================
   COUNTRY MAP
========================================================= */

function CountryMap({
  children,
}) {
  const MIN_ZOOM =
    1;

  const MAX_ZOOM =
    5;

  const initial = {
    coordinates:
      COUNTRY.mapCenter,

    zoom:
      1,
  };

  const [
    position,
    setPosition,
  ] = useState(
    initial
  );


  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-[28px]
        border
        border-slate-200
        bg-sky-50
      "
    >
      <MapControls
        zoom={
          position.zoom
        }
        minZoom={
          MIN_ZOOM
        }
        maxZoom={
          MAX_ZOOM
        }
        onZoomIn={() =>
          setPosition(
            (
              current
            ) => ({
              ...current,

              zoom:
                Math.min(
                  MAX_ZOOM,
                  current.zoom +
                  0.6
                ),
            })
          )
        }
        onZoomOut={() =>
          setPosition(
            (
              current
            ) => ({
              ...current,

              zoom:
                Math.max(
                  MIN_ZOOM,
                  current.zoom -
                  0.6
                ),
            })
          )
        }
        onReset={() =>
          setPosition(
            initial
          )
        }
      />

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center:
            COUNTRY.mapCenter,

          scale:
            COUNTRY.mapScale,
        }}
        width={900}
        height={590}
        className="h-auto w-full"
      >
        <ZoomableGroup
          center={
            position.coordinates
          }
          zoom={
            position.zoom
          }
          minZoom={
            MIN_ZOOM
          }
          maxZoom={
            MAX_ZOOM
          }
          onMoveEnd={
            setPosition
          }
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
                  const name =
                    geo
                      ?.properties
                      ?.name ??
                    '';

                  const target =
                    name ===
                    'Rwanda';

                  return (
                    <Geography
                      key={
                        geo.rsmKey
                      }
                      geography={
                        geo
                      }
                      style={{
                        default: {
                          fill:
                            target
                              ? '#d1fae5'
                              : '#f8fafc',

                          stroke:
                            target
                              ? '#047857'
                              : '#e2e8f0',

                          strokeWidth:
                            target
                              ? 2
                              : 0.2,

                          outline:
                            'none',
                        },

                        hover: {
                          fill:
                            target
                              ? '#a7f3d0'
                              : '#f8fafc',

                          stroke:
                            target
                              ? '#047857'
                              : '#e2e8f0',

                          strokeWidth:
                            target
                              ? 2
                              : 0.2,

                          outline:
                            'none',
                        },

                        pressed: {
                          fill:
                            target
                              ? '#6ee7b7'
                              : '#f8fafc',

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

          {children}
        </ZoomableGroup>
      </ComposableMap>

      <div
        className="
          pointer-events-none
          absolute
          bottom-3
          left-3
          rounded-full
          bg-slate-950/75
          px-3
          py-1.5
          text-[10px]
          font-black
          text-white
        "
      >
        ＋ − でズーム / ドラッグで移動
      </div>
    </div>
  );
}


/* =========================================================
   P01 WORLD LOCATOR
========================================================= */

function WorldLocator({
  language,
  onClear,
}) {
  const [
    stage,
    setStage,
  ] = useState(0);

  const [
    wrong,
    setWrong,
  ] = useState(false);

  const [
    correctFlash,
    setCorrectFlash,
  ] = useState(false);

  const [
    hoveredGroup,
    setHoveredGroup,
  ] = useState(null);


  const CONTINENTS = {
    africa: {
      ja: 'アフリカ',
      en: 'AFRICA',
      labelPosition: [
        18,
        7,
      ],
      color: '#bfdbfe',

      countries:
        new Set([
          'Algeria',
          'Angola',
          'Benin',
          'Botswana',
          'Burkina Faso',
          'Burundi',
          'Cameroon',
          'Central African Rep.',
          'Chad',
          'Congo',
          'Dem. Rep. Congo',
          'Djibouti',
          'Egypt',
          'Eq. Guinea',
          'Eritrea',
          'Eswatini',
          'Ethiopia',
          'Gabon',
          'Gambia',
          'Ghana',
          'Guinea',
          'Guinea-Bissau',
          'Ivory Coast',
          'Kenya',
          'Lesotho',
          'Liberia',
          'Libya',
          'Madagascar',
          'Malawi',
          'Mali',
          'Mauritania',
          'Morocco',
          'Mozambique',
          'Namibia',
          'Niger',
          'Nigeria',
          'Rwanda',
          'Senegal',
          'Sierra Leone',
          'Somalia',
          'Somaliland',
          'South Africa',
          'S. Sudan',
          'Sudan',
          'Tanzania',
          'Togo',
          'Tunisia',
          'Uganda',
          'W. Sahara',
          'Zambia',
          'Zimbabwe',
        ]),
    },

    asia: {
      ja: 'アジア',
      en: 'ASIA',
      labelPosition: [
        92,
        35,
      ],
      color: '#d1fae5',

      countries:
        new Set([
          'Afghanistan',
          'Bangladesh',
          'Bhutan',
          'Brunei',
          'Cambodia',
          'China',
          'India',
          'Indonesia',
          'Iran',
          'Iraq',
          'Japan',
          'Jordan',
          'Kazakhstan',
          'Kuwait',
          'Kyrgyzstan',
          'Laos',
          'Malaysia',
          'Mongolia',
          'Myanmar',
          'Nepal',
          'North Korea',
          'N. Korea',
          'Oman',
          'Pakistan',
          'Philippines',
          'Qatar',
          'Saudi Arabia',
          'South Korea',
          'S. Korea',
          'Sri Lanka',
          'Syria',
          'Taiwan',
          'Tajikistan',
          'Thailand',
          'Turkmenistan',
          'United Arab Emirates',
          'Uzbekistan',
          'Vietnam',
          'Yemen',
        ]),
    },

    europe: {
      ja: 'ヨーロッパ',
      en: 'EUROPE',
      labelPosition: [
        10,
        52,
      ],
      color: '#ede9fe',

      countries:
        new Set([
          'Albania',
          'Austria',
          'Belarus',
          'Belgium',
          'Bosnia and Herz.',
          'Bulgaria',
          'Croatia',
          'Czechia',
          'Denmark',
          'Estonia',
          'Finland',
          'France',
          'Germany',
          'Greece',
          'Hungary',
          'Iceland',
          'Ireland',
          'Italy',
          'Kosovo',
          'Latvia',
          'Lithuania',
          'Luxembourg',
          'Moldova',
          'Montenegro',
          'Netherlands',
          'Norway',
          'Poland',
          'Portugal',
          'Romania',
          'Russia',
          'Serbia',
          'Slovakia',
          'Slovenia',
          'Spain',
          'Sweden',
          'Switzerland',
          'Turkey',
          'Ukraine',
          'United Kingdom',
        ]),
    },

    northAmerica: {
      ja: '北アメリカ',
      en: 'NORTH AMERICA',
      labelPosition: [
        -105,
        42,
      ],
      color: '#fed7aa',

      countries:
        new Set([
          'Canada',
          'United States of America',
          'United States',
          'Mexico',
          'Belize',
          'Costa Rica',
          'El Salvador',
          'Guatemala',
          'Honduras',
          'Nicaragua',
          'Panama',
          'Cuba',
          'Haiti',
          'Jamaica',
          'Dominican Rep.',
        ]),
    },

    southAmerica: {
      ja: '南アメリカ',
      en: 'SOUTH AMERICA',
      labelPosition: [
        -60,
        -18,
      ],
      color: '#fde68a',

      countries:
        new Set([
          'Argentina',
          'Bolivia',
          'Brazil',
          'Chile',
          'Colombia',
          'Ecuador',
          'Guyana',
          'Paraguay',
          'Peru',
          'Suriname',
          'Uruguay',
          'Venezuela',
        ]),
    },

    oceania: {
      ja: 'オセアニア',
      en: 'OCEANIA',
      labelPosition: [
        135,
        -25,
      ],
      color: '#fecdd3',

      countries:
        new Set([
          'Australia',
          'Fiji',
          'New Caledonia',
          'New Zealand',
          'Papua New Guinea',
          'Solomon Is.',
          'Vanuatu',
        ]),
    },
  };


  const AFRICA_REGIONS = {
    north: {
      color: '#f6d365',

      countries:
        new Set([
          'Algeria',
          'Egypt',
          'Libya',
          'Morocco',
          'Sudan',
          'Tunisia',
          'W. Sahara',
        ]),
    },

    west: {
      color: '#93bce8',

      countries:
        new Set([
          'Benin',
          'Burkina Faso',
          'Gambia',
          'Ghana',
          'Guinea',
          'Guinea-Bissau',
          'Ivory Coast',
          'Liberia',
          'Mali',
          'Mauritania',
          'Niger',
          'Nigeria',
          'Senegal',
          'Sierra Leone',
          'Togo',
        ]),
    },

    central: {
      color: '#c4b9ef',

      countries:
        new Set([
          'Cameroon',
          'Central African Rep.',
          'Chad',
          'Congo',
          'Dem. Rep. Congo',
          'Eq. Guinea',
          'Gabon',
        ]),
    },

    east: {
      color: '#7dddb7',

      countries:
        new Set([
          'Burundi',
          'Djibouti',
          'Eritrea',
          'Ethiopia',
          'Kenya',
          'Rwanda',
          'Somalia',
          'Somaliland',
          'S. Sudan',
          'Tanzania',
          'Uganda',
        ]),
    },

    south: {
      color: '#f4aeb8',

      countries:
        new Set([
          'Angola',
          'Botswana',
          'Eswatini',
          'Lesotho',
          'Madagascar',
          'Malawi',
          'Mozambique',
          'Namibia',
          'South Africa',
          'Zambia',
          'Zimbabwe',
        ]),
    },
  };


  const NEIGHBORS = {
    Uganda: {
      ja: 'ウガンダ',
      en: 'Uganda',
      directionJa: '北',
      directionEn: 'North',
      color: '#fbbf24',
    },

    Tanzania: {
      ja: 'タンザニア',
      en: 'Tanzania',
      directionJa: '東',
      directionEn: 'East',
      color: '#34d399',
    },

    Burundi: {
      ja: 'ブルンジ',
      en: 'Burundi',
      directionJa: '南',
      directionEn: 'South',
      color: '#fb7185',
    },

    'Dem. Rep. Congo': {
      ja: 'コンゴ民主共和国',
      en: 'DR Congo',
      directionJa: '西',
      directionEn: 'West',
      color: '#a78bfa',
    },
  };


  const VIEWS = [
    {
      center: [
        0,
        10,
      ],
      zoom: 1,
      minZoom: 1,
      maxZoom: 4,
    },

    {
      center: [
        18,
        2,
      ],
      zoom: 2.45,
      minZoom: 1.8,
      maxZoom: 5.5,
    },

    {
      center: [
        31,
        -2,
      ],
      zoom: 7.3,
      minZoom: 5,
      maxZoom: 11,
    },
  ];


  const view =
    VIEWS[
      stage
    ];


  const [
    position,
    setPosition,
  ] = useState({
    coordinates:
      view.center,

    zoom:
      view.zoom,
  });


  useEffect(
    () => {
      setPosition({
        coordinates:
          view.center,

        zoom:
          view.zoom,
      });

      setWrong(
        false
      );

      setCorrectFlash(
        false
      );

      setHoveredGroup(
        null
      );
    },
    [
      stage,
    ]
  );


  const getContinentId =
    (
      countryName
    ) => {
      const found =
        Object.entries(
          CONTINENTS
        ).find(
          ([
            ,
            continent,
          ]) =>
            continent
              .countries
              .has(
                countryName
              )
        );

      return (
        found?.[0] ??
        null
      );
    };


  const getRegionId =
    (
      countryName
    ) => {
      const found =
        Object.entries(
          AFRICA_REGIONS
        ).find(
          ([
            ,
            region,
          ]) =>
            region
              .countries
              .has(
                countryName
              )
        );

      return (
        found?.[0] ??
        null
      );
    };


  const correctStage =
    () => {
      if (
        correctFlash
      ) {
        return;
      }

      setWrong(
        false
      );

      setCorrectFlash(
        true
      );

      playUiSound(
        'success'
      );

      window.setTimeout(
        () => {
          if (
            stage ===
            2
          ) {
            onClear();

            return;
          }

          setStage(
            (
              current
            ) =>
              current +
              1
          );
        },
        650
      );
    };


  const handleCountryClick =
    (
      countryName
    ) => {
      if (
        correctFlash
      ) {
        return;
      }


      if (
        stage ===
        0
      ) {
        const continentId =
          getContinentId(
            countryName
          );

        if (
          continentId ===
          'africa'
        ) {
          correctStage();
        } else {
          setWrong(
            true
          );
        }

        return;
      }


      if (
        stage ===
        1
      ) {
        const regionId =
          getRegionId(
            countryName
          );

        if (
          regionId ===
          'east'
        ) {
          correctStage();
        } else {
          setWrong(
            true
          );
        }

        return;
      }


      if (
        countryName ===
        'Rwanda'
      ) {
        correctStage();
      } else {
        setWrong(
          true
        );
      }
    };


  const getStageOneFill =
    (
      countryName
    ) => {
      const continentId =
        getContinentId(
          countryName
        );

      if (
        !continentId
      ) {
        return '#dbe4ee';
      }

      if (
        hoveredGroup ===
        continentId
      ) {
        return '#60a5fa';
      }

      return (
        CONTINENTS[
          continentId
        ]?.color ??
        '#dbe4ee'
      );
    };


  const getStageTwoFill =
    (
      countryName
    ) => {
      const regionId =
        getRegionId(
          countryName
        );

      if (
        !regionId
      ) {
        return '#e2e8f0';
      }

      if (
        hoveredGroup ===
        regionId
      ) {
        return '#10b981';
      }

      return (
        AFRICA_REGIONS[
          regionId
        ].color
      );
    };


  const getStageThreeFill =
    (
      countryName
    ) => {
      if (
        countryName ===
        'Rwanda'
      ) {
        if (
          hoveredGroup ===
          'Rwanda'
        ) {
          return '#60a5fa';
        }

        return '#f8fafc';
      }

      if (
        NEIGHBORS[
          countryName
        ]
      ) {
        return (
          NEIGHBORS[
            countryName
          ].color
        );
      }

      return '#e2e8f0';
    };


  const stageText = [
    {
      label:
        'CONTINENT QUEST',

      ja:
        '世界地図から、ルワンダがある大陸をタップしよう！',

      en:
        'Tap the continent where Rwanda is located.',
    },

    {
      label:
        'REGION QUEST',

      ja:
        'アフリカのどの地域？ コンパスを手がかりに「東アフリカ」をタップしよう！',

      en:
        'Which part of Africa? Use the compass and tap East Africa.',
    },

    {
      label:
        'COUNTRY QUEST',

      ja:
        '4つの隣国に囲まれた国を探そう。そこがルワンダ！',

      en:
        'Find the country surrounded by Rwanda’s four neighbors.',
    },
  ];


  return (
    <div>
      <div
        className="
          mb-5
          flex
          flex-col
          gap-4
          md:flex-row
          md:items-center
          md:justify-between
        "
      >
        <div>
          <p
            className="
              text-[10px]
              font-black
              tracking-[0.2em]
              text-blue-500
            "
          >
            {
              stageText[
                stage
              ].label
            }
            {' · '}
            STAGE {
              stage +
              1
            } / 3
          </p>

          <p
            className="
              mt-2
              text-lg
              font-black
              leading-7
              text-slate-800
            "
          >
            {
              language ===
              'ja'
                ? stageText[
                    stage
                  ].ja
                : stageText[
                    stage
                  ].en
            }
          </p>
        </div>

        <div
          className="
            flex
            gap-1.5
          "
        >
          {
            [
              0,
              1,
              2,
            ].map(
              (
                item
              ) => (
                <div
                  key={
                    item
                  }
                  className={`
                    h-2.5
                    w-11
                    rounded-full

                    ${
                      item <=
                      stage
                        ? 'bg-blue-500'
                        : 'bg-slate-200'
                    }
                  `}
                />
              )
            )
          }
        </div>
      </div>


      {
        stage ===
        2 && (
          <div
            className="
              mb-4
              grid
              grid-cols-2
              gap-2
              md:grid-cols-4
            "
          >
            {
              Object.entries(
                NEIGHBORS
              ).map(
                ([
                  id,
                  item,
                ]) => (
                  <div
                    key={
                      id
                    }
                    className="
                      flex
                      items-center
                      gap-3
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      px-4
                      py-3
                      shadow-sm
                    "
                  >
                    <span
                      className="
                        h-4
                        w-4
                        shrink-0
                        rounded-full
                      "
                      style={{
                        backgroundColor:
                          item.color,
                      }}
                    />

                    <div>
                      <p
                        className="
                          text-[9px]
                          font-black
                          tracking-[0.12em]
                          text-slate-400
                        "
                      >
                        {
                          language ===
                          'ja'
                            ? item.directionJa
                            : item.directionEn
                        }
                      </p>

                      <p
                        className="
                          text-xs
                          font-black
                          text-slate-800
                        "
                      >
                        {
                          language ===
                          'ja'
                            ? item.ja
                            : item.en
                        }
                      </p>
                    </div>
                  </div>
                )
              )
            }
          </div>
        )
      }


      <div
        className="
          relative
          overflow-hidden
          rounded-[30px]
          border
          border-slate-200
          bg-sky-100
          shadow-sm
        "
      >
        <MapControls
          zoom={
            position.zoom
          }
          minZoom={
            view.minZoom
          }
          maxZoom={
            view.maxZoom
          }
          onZoomIn={() =>
            setPosition(
              (
                current
              ) => ({
                ...current,

                zoom:
                  Math.min(
                    view.maxZoom,
                    current.zoom +
                    0.65
                  ),
              })
            )
          }
          onZoomOut={() =>
            setPosition(
              (
                current
              ) => ({
                ...current,

                zoom:
                  Math.max(
                    view.minZoom,
                    current.zoom -
                    0.65
                  ),
              })
            )
          }
          onReset={() =>
            setPosition({
              coordinates:
                view.center,

              zoom:
                view.zoom,
            })
          }
        />

        <ComposableMap
          projection="geoEqualEarth"
          width={1100}
          height={610}
          className="h-auto w-full"
        >
          <ZoomableGroup
            center={
              position.coordinates
            }
            zoom={
              position.zoom
            }
            minZoom={
              view.minZoom
            }
            maxZoom={
              view.maxZoom
            }
            onMoveEnd={
              setPosition
            }
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
                    const name =
                      geo
                        ?.properties
                        ?.name ??
                      '';

                    const continentId =
                      getContinentId(
                        name
                      );

                    const regionId =
                      getRegionId(
                        name
                      );

                    const hoverId =
                      stage ===
                      0
                        ? continentId
                        : stage ===
                            1
                          ? regionId
                          : name;

                    const fill =
                      stage ===
                      0
                        ? getStageOneFill(
                            name
                          )
                        : stage ===
                            1
                          ? getStageTwoFill(
                              name
                            )
                          : getStageThreeFill(
                              name
                            );

                    const showBorders =
                      stage ===
                      2;

                    return (
                      <Geography
                        key={
                          geo.rsmKey
                        }
                        geography={
                          geo
                        }
                        onMouseEnter={() =>
                          setHoveredGroup(
                            hoverId
                          )
                        }
                        onMouseLeave={() =>
                          setHoveredGroup(
                            null
                          )
                        }
                        onClick={() =>
                          handleCountryClick(
                            name
                          )
                        }
                        style={{
                          default: {
                            fill,

                            stroke:
                              showBorders
                                ? '#ffffff'
                                : 'transparent',

                            strokeWidth:
                              showBorders
                                ? 0.7 /
                                  Math.max(
                                    position.zoom,
                                    1
                                  )
                                : 0,

                            outline:
                              'none',

                            cursor:
                              'pointer',

                            transition:
                              'fill 160ms ease',
                          },

                          hover: {
                            fill:
                              stage ===
                              0
                                ? '#60a5fa'
                                : stage ===
                                    1
                                  ? '#10b981'
                                  : name ===
                                      'Rwanda'
                                    ? '#60a5fa'
                                    : fill,

                            stroke:
                              showBorders
                                ? '#ffffff'
                                : 'transparent',

                            outline:
                              'none',

                            cursor:
                              'pointer',
                          },

                          pressed: {
                            fill:
                              '#2563eb',

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


            {
              stage ===
              0 &&
              Object.entries(
                CONTINENTS
              ).map(
                ([
                  id,
                  continent,
                ]) => (
                  <Marker
                    key={
                      id
                    }
                    coordinates={
                      continent
                        .labelPosition
                    }
                  >
                    <g
                      onMouseEnter={() =>
                        setHoveredGroup(
                          id
                        )
                      }
                      onMouseLeave={() =>
                        setHoveredGroup(
                          null
                        )
                      }
                      style={{
                        cursor:
                          'pointer',
                      }}
                    >
                      <rect
                        x={-48}
                        y={-14}
                        width={96}
                        height={28}
                        rx={14}
                        fill={
                          hoveredGroup ===
                          id
                            ? '#2563eb'
                            : 'rgba(15,23,42,0.78)'
                        }
                        stroke="#ffffff"
                        strokeWidth={0.8}
                        onClick={() => {
                          if (
                            id ===
                            'africa'
                          ) {
                            correctStage();
                          } else {
                            setWrong(
                              true
                            );
                          }
                        }}
                      />

                      <text
                        textAnchor="middle"
                        y={4}
                        fill="#ffffff"
                        fontSize={9}
                        fontWeight={900}
                        pointerEvents="none"
                      >
                        {
                          language ===
                          'ja'
                            ? continent.ja
                            : continent.en
                        }
                      </text>
                    </g>
                  </Marker>
                )
              )
            }


            {
              stage ===
              2 && (
                <Marker
                  coordinates={
                    COUNTRY.center
                  }
                >
                  <circle
                    r={23}
                    fill="transparent"
                    stroke="transparent"
                    onClick={() =>
                      handleCountryClick(
                        'Rwanda'
                      )
                    }
                    style={{
                      cursor:
                        'pointer',
                    }}
                  />
                </Marker>
              )
            }
          </ZoomableGroup>
        </ComposableMap>


        {
          stage ===
          1 && (
            <div
              className="
                pointer-events-none
                absolute
                bottom-4
                right-4
                rounded-2xl
                border
                border-white/80
                bg-white/95
                px-4
                py-3
                text-center
                shadow-lg
                backdrop-blur
              "
            >
              <div
                className="
                  text-[10px]
                  font-black
                  text-slate-400
                "
              >
                北
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-3
                  text-xs
                  font-black
                "
              >
                <span
                  className="
                    text-slate-500
                  "
                >
                  ← 西
                </span>

                <span
                  className="
                    text-xl
                  "
                >
                  🧭
                </span>

                <span
                  className="
                    text-emerald-600
                  "
                >
                  東 →
                </span>
              </div>

              <div
                className="
                  text-[10px]
                  font-black
                  text-slate-400
                "
              >
                南
              </div>
            </div>
          )
        }


        <div
          className="
            pointer-events-none
            absolute
            bottom-4
            left-4
            rounded-full
            bg-slate-950/75
            px-3
            py-1.5
            text-[10px]
            font-black
            text-white
          "
        >
          {
            stage ===
            0
              ? '大陸をタップ'
              : stage ===
                  1
                ? '地図の地域を直接タップ'
                : '国をタップ'
          }
          {' / '}
          ＋−でズーム
        </div>


        {
          correctFlash && (
            <div
              className="
                pointer-events-none
                absolute
                inset-0
                z-20
                flex
                items-center
                justify-center
                bg-emerald-500/15
                backdrop-blur-[1px]
              "
            >
              <div
                className="
                  rounded-[28px]
                  bg-emerald-500
                  px-8
                  py-5
                  text-center
                  text-white
                  shadow-2xl
                "
              >
                <div
                  className="
                    text-4xl
                  "
                >
                  ✨
                </div>

                <p
                  className="
                    mt-1
                    text-2xl
                    font-black
                  "
                >
                  {
                    stage ===
                    0
                      ? 'アフリカ発見！'
                      : stage ===
                          1
                        ? '東アフリカ発見！'
                        : 'ルワンダ発見！'
                  }
                </p>
              </div>
            </div>
          )
        }
      </div>


      {
        stage ===
        2 && (
          <div
            className="
              mt-4
              rounded-[24px]
              border
              border-slate-200
              bg-slate-50
              px-5
              py-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-violet-100
                  text-xl
                "
              >
                💡
              </div>

              <p
                className="
                  text-sm
                  font-bold
                  leading-6
                  text-slate-700
                "
              >
                {
                  language ===
                  'ja'
                    ? '国名は地図に書いてありません。上の4色のヒントと東西南北を使って、真ん中にある小さな国を探そう。'
                    : 'Country names are hidden. Use the four colored neighbors and directions to find the small country in the middle.'
                }
              </p>
            </div>
          </div>
        )
      }


      <RetryMessage
        show={
          wrong
        }
      >
        {
          stage ===
          0
            ? '今は国ではなく「大陸」を探します。アフリカ大陸全体を選ぼう！'
            : stage ===
                1
              ? '東は地図の右側です。下の選択肢はありません。地図そのものから東側の地域を探そう！'
              : '4つのヒントを確認しよう。北＝ウガンダ、東＝タンザニア、南＝ブルンジ、西＝コンゴ民主共和国。その間にある国はどこかな？'
        }
      </RetryMessage>
    </div>
  );
}


/* =========================================================
   P02 NEIGHBOR PUZZLE
========================================================= */

const P02_COUNTRIES = [
  {
    id: 'Uganda',
    ja: 'ウガンダ',
    en: 'Uganda',
    flagCode: 'ug',
    atlasName: 'Uganda',
    mapCenter: [
      32.3,
      1.4,
    ],
    mapScale: 1450,
  },
  {
    id: 'Tanzania',
    ja: 'タンザニア',
    en: 'Tanzania',
    flagCode: 'tz',
    atlasName: 'Tanzania',
    mapCenter: [
      35.1,
      -6.2,
    ],
    mapScale: 720,
  },
  {
    id: 'Burundi',
    ja: 'ブルンジ',
    en: 'Burundi',
    flagCode: 'bi',
    atlasName: 'Burundi',
    mapCenter: [
      29.9,
      -3.4,
    ],
    mapScale: 3000,
  },
  {
    id: 'DR Congo',
    ja: 'コンゴ民主共和国',
    en: 'DR Congo',
    flagCode: 'cd',
    atlasName: 'Dem. Rep. Congo',
    mapCenter: [
      23.7,
      -2.8,
    ],
    mapScale: 420,
  },
  {
    id: 'Kenya',
    ja: 'ケニア',
    en: 'Kenya',
    flagCode: 'ke',
    atlasName: 'Kenya',
    mapCenter: [
      37.8,
      0.4,
    ],
    mapScale: 880,
  },
];


const P02_SLOTS = [
  {
    id: 'north',
    direction: '北',
    directionEn: 'NORTH',
    answer: 'Uganda',
  },
  {
    id: 'west',
    direction: '西',
    directionEn: 'WEST',
    answer: 'DR Congo',
  },
  {
    id: 'east',
    direction: '東',
    directionEn: 'EAST',
    answer: 'Tanzania',
  },
  {
    id: 'south',
    direction: '南',
    directionEn: 'SOUTH',
    answer: 'Burundi',
  },
];


const P02_RWANDA = {
  id: 'Rwanda',
  ja: 'ルワンダ',
  en: 'Rwanda',
  flagCode: 'rw',
  atlasName: 'Rwanda',
  mapCenter: [
    29.9,
    -1.95,
  ],
  mapScale: 3600,
};


function P02CountryFlag({
  card,
  small = false,
}) {
  return (
    <div
      className={`
        overflow-hidden
        rounded-md
        border
        border-slate-200
        bg-white
        shadow-sm

        ${
          small
            ? 'h-[23px] w-[34px]'
            : 'h-[31px] w-[46px]'
        }
      `}
    >
      <img
        src={
          `https://flagcdn.com/w160/${card.flagCode}.png`
        }
        alt={
          `${card.en} flag`
        }
        draggable="false"
        loading="eager"
        decoding="async"
        className="
          block
          h-full
          w-full
          object-cover
        "
      />
    </div>
  );
}


function P02CountrySilhouette({
  card,
  compact = false,
}) {
  return (
    <div
      className={`
        overflow-hidden
        rounded-xl
        bg-gradient-to-br
        from-sky-50
        via-white
        to-emerald-50

        ${
          compact
            ? 'h-[72px] w-[92px]'
            : 'h-[104px] w-full'
        }
      `}
      aria-hidden="true"
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center:
            card.mapCenter,

          scale:
            card.mapScale,
        }}
        width={260}
        height={160}
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
                const name =
                  geo
                    ?.properties
                    ?.name ??
                  '';

                if (
                  name !==
                  card.atlasName
                ) {
                  return null;
                }

                return (
                  <Geography
                    key={
                      geo.rsmKey
                    }
                    geography={
                      geo
                    }
                    style={{
                      default: {
                        fill:
                          '#173a59',

                        stroke:
                          '#ffffff',

                        strokeWidth:
                          1.2,

                        outline:
                          'none',
                      },

                      hover: {
                        fill:
                          '#173a59',

                        stroke:
                          '#ffffff',

                        strokeWidth:
                          1.2,

                        outline:
                          'none',
                      },

                      pressed: {
                        fill:
                          '#173a59',

                        stroke:
                          '#ffffff',

                        strokeWidth:
                          1.2,

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
  );
}


function P02CountryCard({
  card,
  used,
  onPointerDown,
}) {
  return (
    <button
      type="button"
      disabled={
        used
      }
      onPointerDown={
        onPointerDown
      }
      onDragStart={(
        event
      ) =>
        event.preventDefault()
      }
      style={{
        touchAction:
          'none',

        userSelect:
          'none',

        WebkitUserSelect:
          'none',
      }}
      className={`
        tp-p02-country-card
        relative
        overflow-hidden
        rounded-[24px]
        border-2
        bg-white
        text-left
        shadow-sm
        transition-[transform,border-color,box-shadow,opacity]
        duration-150

        ${
          used
            ? `
              cursor-default
              border-emerald-200
              opacity-20
            `
            : `
              cursor-grab
              border-slate-200
              hover:-translate-y-1
              hover:border-blue-400
              hover:shadow-xl
              active:cursor-grabbing
            `
        }
      `}
    >
      <div
        className="
          absolute
          left-3
          top-3
          z-20
        "
      >
        <P02CountryFlag
          card={
            card
          }
        />
      </div>

      <div
        className="
          absolute
          right-3
          top-3
          z-20
          rounded-lg
          bg-white/90
          px-2
          py-1
          text-xs
          text-slate-400
          shadow-sm
        "
      >
        ✋
      </div>

      <div
        className="
          px-3
          pb-1
          pt-4
        "
      >
        <P02CountrySilhouette
          card={
            card
          }
        />
      </div>

      <div
        className="
          border-t
          border-slate-100
          px-3
          py-3
          text-center
        "
      >
        <p
          className="
            text-sm
            font-black
            text-slate-900
          "
        >
          {
            card.ja
          }
        </p>

        <p
          className="
            mt-0.5
            text-[10px]
            font-bold
            text-slate-400
          "
        >
          {
            card.en
          }
        </p>
      </div>
    </button>
  );
}


function P02PlacedCountry({
  card,
  fresh,
}) {
  return (
    <div
      className={`
        relative
        flex
        h-full
        w-full
        items-center
        justify-center
        overflow-hidden
        rounded-[21px]
        bg-gradient-to-br
        from-white
        to-emerald-50
        p-3

        ${
          fresh
            ? 'tp-p02-snap'
            : ''
        }
      `}
    >
      <div
        className="
          flex
          w-full
          items-center
          gap-3
        "
      >
        <P02CountrySilhouette
          card={
            card
          }
          compact
        />

        <div
          className="
            min-w-0
            flex-1
            text-left
          "
        >
          <P02CountryFlag
            card={
              card
            }
            small
          />

          <p
            className="
              mt-2
              truncate
              text-sm
              font-black
              text-slate-900
            "
          >
            {
              card.ja
            }
          </p>

          <p
            className="
              truncate
              text-[10px]
              font-bold
              text-emerald-600
            "
          >
            {
              card.en
            }
          </p>
        </div>
      </div>

      <div
        className="
          absolute
          right-2
          top-2
          flex
          h-7
          w-7
          items-center
          justify-center
          rounded-full
          bg-emerald-500
          text-sm
          font-black
          text-white
          shadow-md
        "
      >
        ✓
      </div>

      {
        fresh && (
          <div
            className="
              absolute
              bottom-2
              right-2
              rounded-full
              bg-emerald-600
              px-2.5
              py-1
              text-[9px]
              font-black
              text-white
              shadow-lg
            "
          >
            ぴったり！
          </div>
        )
      }
    </div>
  );
}


function P02DropSlot({
  slot,
  card,
  fresh,
  registerNode,
}) {
  return (
    <div
      ref={(
        node
      ) =>
        registerNode(
          slot.id,
          node
        )
      }
      data-neighbor-slot={
        slot.id
      }
      className={`
        tp-p02-drop-slot
        relative
        flex
        min-h-[150px]
        items-center
        justify-center
        overflow-hidden
        rounded-[26px]
        border-2
        p-2
        text-center

        ${
          card
            ? `
              border-solid
              border-emerald-400
              bg-emerald-50
            `
            : `
              border-dashed
              border-slate-300
              bg-slate-50
            `
        }
      `}
    >
      {
        card
          ? (
            <P02PlacedCountry
              card={
                card
              }
              fresh={
                fresh
              }
            />
          )
          : (
            <div
              className="
                pointer-events-none
              "
            >
              <p
                className="
                  text-[10px]
                  font-black
                  tracking-[0.16em]
                  text-slate-400
                "
              >
                {
                  slot.direction
                }
                {' · '}
                {
                  slot.directionEn
                }
              </p>

              <div
                className="
                  mt-2
                  text-2xl
                  text-slate-300
                "
              >
                ↓
              </div>

              <p
                className="
                  mt-1
                  text-sm
                  font-black
                  text-slate-400
                "
              >
                ここにドロップ
              </p>
            </div>
          )
      }
    </div>
  );
}


function NeighborPuzzle({
  onClear,
}) {
  const [
    placed,
    setPlaced,
  ] = useState({});

  const [
    wrong,
    setWrong,
  ] = useState(false);

  const [
    justPlaced,
    setJustPlaced,
  ] = useState(null);

  const ghostRef =
    useRef(null);

  const ghostFlagRef =
    useRef(null);

  const ghostJaRef =
    useRef(null);

  const ghostEnRef =
    useRef(null);

  const cardsAreaRef =
    useRef(null);

  const slotNodesRef =
    useRef(
      new Map()
    );

  const dragRef =
    useRef({
      active:
        false,

      pointerId:
        null,

      card:
        null,

      sourceNode:
        null,

      activeSlot:
        null,

      x:
        0,

      y:
        0,

      raf:
        null,

      previousBodyUserSelect:
        '',

      previousBodyWebkitUserSelect:
        '',

      previousBodyOverscrollBehavior:
        '',

      previousBodyCursor:
        '',
    });

  const placedRef =
    useRef(
      placed
    );


  useEffect(
    () => {
      placedRef.current =
        placed;
    },
    [
      placed,
    ]
  );


  const registerSlotNode =
    (
      id,
      node
    ) => {
      if (
        node
      ) {
        slotNodesRef
          .current
          .set(
            id,
            node
          );
      } else {
        slotNodesRef
          .current
          .delete(
            id
          );
      }
    };


  const restoreSlotVisual =
    (
      slotId
    ) => {
      if (
        !slotId
      ) {
        return;
      }

      const node =
        slotNodesRef
          .current
          .get(
            slotId
          );

      if (
        !node
      ) {
        return;
      }

      node.style.transform =
        '';

      node.style.borderColor =
        '';

      node.style.backgroundColor =
        '';

      node.style.boxShadow =
        '';
    };


  const highlightSlot =
    (
      slotId
    ) => {
      if (
        !slotId
      ) {
        return;
      }

      const node =
        slotNodesRef
          .current
          .get(
            slotId
          );

      if (
        !node
      ) {
        return;
      }

      node.style.transform =
        'scale(1.018)';

      node.style.borderColor =
        '#3b82f6';

      node.style.backgroundColor =
        '#eff6ff';

      node.style.boxShadow =
        '0 12px 32px rgba(59,130,246,0.20)';
    };


  const setActiveSlot =
    (
      slotId
    ) => {
      const previous =
        dragRef
          .current
          .activeSlot;

      if (
        previous ===
        slotId
      ) {
        return;
      }

      restoreSlotVisual(
        previous
      );

      dragRef.current.activeSlot =
        slotId;

      highlightSlot(
        slotId
      );
    };


  const findSlotAtPoint =
    (
      x,
      y
    ) => {
      const elements =
        document.elementsFromPoint(
          x,
          y
        );

      const target =
        elements.find(
          (
            element
          ) =>
            element
              ?.dataset
              ?.neighborSlot
        );

      return (
        target
          ?.dataset
          ?.neighborSlot ??
        null
      );
    };


  const lockPage =
    () => {
      const body =
        document.body;

      dragRef.current.previousBodyUserSelect =
        body.style.userSelect;

      dragRef.current.previousBodyWebkitUserSelect =
        body.style.webkitUserSelect;

      dragRef.current.previousBodyOverscrollBehavior =
        body.style.overscrollBehavior;

      dragRef.current.previousBodyCursor =
        body.style.cursor;

      body.style.userSelect =
        'none';

      body.style.webkitUserSelect =
        'none';

      body.style.overscrollBehavior =
        'none';

      body.style.cursor =
        'grabbing';

      document
        .documentElement
        .classList
        .add(
          'tp-p02-dragging'
        );

      if (
        cardsAreaRef.current
      ) {
        cardsAreaRef.current.style.pointerEvents =
          'none';
      }
    };


  const unlockPage =
    () => {
      const body =
        document.body;

      body.style.userSelect =
        dragRef.current.previousBodyUserSelect;

      body.style.webkitUserSelect =
        dragRef.current.previousBodyWebkitUserSelect;

      body.style.overscrollBehavior =
        dragRef.current.previousBodyOverscrollBehavior;

      body.style.cursor =
        dragRef.current.previousBodyCursor;

      document
        .documentElement
        .classList
        .remove(
          'tp-p02-dragging'
        );

      if (
        cardsAreaRef.current
      ) {
        cardsAreaRef.current.style.pointerEvents =
          '';
      }
    };


  const showGhost =
    (
      card,
      x,
      y
    ) => {
      if (
        ghostFlagRef.current
      ) {
        ghostFlagRef.current.src =
          `https://flagcdn.com/w160/${card.flagCode}.png`;

        ghostFlagRef.current.alt =
          `${card.en} flag`;
      }

      if (
        ghostJaRef.current
      ) {
        ghostJaRef.current.textContent =
          card.ja;
      }

      if (
        ghostEnRef.current
      ) {
        ghostEnRef.current.textContent =
          card.en;
      }

      if (
        ghostRef.current
      ) {
        ghostRef.current.style.visibility =
          'visible';

        ghostRef.current.style.opacity =
          '1';

        ghostRef.current.style.transform =
          `translate3d(${x}px, ${y}px, 0) translate3d(-50%, -50%, 0)`;
      }
    };


  const hideGhost =
    () => {
      if (
        !ghostRef.current
      ) {
        return;
      }

      ghostRef.current.style.opacity =
        '0';

      ghostRef.current.style.visibility =
        'hidden';
    };


  const updateGhost =
    (
      x,
      y
    ) => {
      dragRef.current.x =
        x;

      dragRef.current.y =
        y;

      if (
        dragRef.current.raf
      ) {
        return;
      }

      dragRef.current.raf =
        requestAnimationFrame(
          () => {
            dragRef.current.raf =
              null;

            if (
              !ghostRef.current ||
              !dragRef.current.active
            ) {
              return;
            }

            ghostRef.current.style.transform =
              `translate3d(${dragRef.current.x}px, ${dragRef.current.y}px, 0) translate3d(-50%, -50%, 0)`;
          }
        );
    };


  const restoreSourceCard =
    () => {
      const source =
        dragRef.current.sourceNode;

      if (
        !source
      ) {
        return;
      }

      source.style.opacity =
        '';

      source.style.transform =
        '';

      source.style.boxShadow =
        '';
    };


  function handleNativePointerMove(
    event
  ) {
    if (
      !dragRef.current.active ||
      event.pointerId !==
        dragRef.current.pointerId
    ) {
      return;
    }

    event.preventDefault();

    updateGhost(
      event.clientX,
      event.clientY
    );

    const slotId =
      findSlotAtPoint(
        event.clientX,
        event.clientY
      );

    setActiveSlot(
      slotId
    );
  }


  function handleNativePointerUp(
    event
  ) {
    if (
      !dragRef.current.active ||
      event.pointerId !==
        dragRef.current.pointerId
    ) {
      return;
    }

    event.preventDefault();

    const card =
      dragRef.current.card;

    const slotId =
      findSlotAtPoint(
        event.clientX,
        event.clientY
      );

    let accepted =
      false;

    if (
      card &&
      slotId
    ) {
      const slot =
        P02_SLOTS.find(
          (
            item
          ) =>
            item.id ===
            slotId
        );

      if (
        slot &&
        slot.answer ===
        card.id &&
        !placedRef.current[
          slot.id
        ]
      ) {
        accepted =
          true;

        finishDragVisuals();

        acceptDrop(
          slot,
          card
        );
      }
    }

    if (
      !accepted
    ) {
      finishDragVisuals();

      if (
        slotId
      ) {
        setWrong(
          true
        );

        if (
          typeof navigator !==
            'undefined' &&
          'vibrate' in
            navigator
        ) {
          navigator.vibrate(
            55
          );
        }
      }
    }
  }


  function handleNativePointerCancel(
    event
  ) {
    if (
      !dragRef.current.active ||
      event.pointerId !==
        dragRef.current.pointerId
    ) {
      return;
    }

    finishDragVisuals();
  }


  const removeNativeListeners =
    () => {
      window.removeEventListener(
        'pointermove',
        handleNativePointerMove
      );

      window.removeEventListener(
        'pointerup',
        handleNativePointerUp
      );

      window.removeEventListener(
        'pointercancel',
        handleNativePointerCancel
      );
    };


  const finishDragVisuals =
    () => {
      restoreSlotVisual(
        dragRef.current.activeSlot
      );

      restoreSourceCard();

      hideGhost();

      unlockPage();

      removeNativeListeners();

      if (
        dragRef.current.raf
      ) {
        cancelAnimationFrame(
          dragRef.current.raf
        );

        dragRef.current.raf =
          null;
      }

      dragRef.current.active =
        false;

      dragRef.current.pointerId =
        null;

      dragRef.current.card =
        null;

      dragRef.current.sourceNode =
        null;

      dragRef.current.activeSlot =
        null;
    };


  const acceptDrop =
    (
      slot,
      card
    ) => {
      const next = {
        ...placedRef.current,

        [
          slot.id
        ]:
          card.id,
      };

      placedRef.current =
        next;

      setPlaced(
        next
      );

      setJustPlaced(
        slot.id
      );

      setWrong(
        false
      );

      playUiSound(
        'success'
      );

      if (
        typeof navigator !==
          'undefined' &&
        'vibrate' in
          navigator
      ) {
        navigator.vibrate([
          18,
          14,
          34,
        ]);
      }

      window.setTimeout(
        () => {
          setJustPlaced(
            null
          );
        },
        620
      );

      if (
        Object.keys(
          next
        ).length ===
        4
      ) {
        window.setTimeout(
          onClear,
          850
        );
      }
    };


  const startDrag =
    (
      event,
      card
    ) => {
      if (
        dragRef.current.active ||
        Object.values(
          placedRef.current
        ).includes(
          card.id
        )
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      window
        .getSelection?.()
        ?.removeAllRanges?.();

      dragRef.current.active =
        true;

      dragRef.current.pointerId =
        event.pointerId;

      dragRef.current.card =
        card;

      dragRef.current.sourceNode =
        event.currentTarget;

      dragRef.current.activeSlot =
        null;

      dragRef.current.x =
        event.clientX;

      dragRef.current.y =
        event.clientY;

      event.currentTarget.style.opacity =
        '0.28';

      event.currentTarget.style.transform =
        'scale(0.985)';

      event.currentTarget.style.boxShadow =
        'none';

      setWrong(
        false
      );

      lockPage();

      showGhost(
        card,
        event.clientX,
        event.clientY
      );

      window.addEventListener(
        'pointermove',
        handleNativePointerMove,
        {
          passive:
            false,
        }
      );

      window.addEventListener(
        'pointerup',
        handleNativePointerUp,
        {
          passive:
            false,
        }
      );

      window.addEventListener(
        'pointercancel',
        handleNativePointerCancel,
        {
          passive:
            false,
        }
      );
    };


  useEffect(
    () => {
      return () => {
        if (
          dragRef.current.active
        ) {
          finishDragVisuals();
        } else {
          removeNativeListeners();
          unlockPage();
        }
      };
    },
    []
  );


  const getPlacedCard =
    (
      slotId
    ) => {
      const cardId =
        placed[
          slotId
        ];

      return (
        P02_COUNTRIES.find(
          (
            card
          ) =>
            card.id ===
            cardId
        ) ??
        null
      );
    };


  return (
    <div>
      <style>
        {`
          @keyframes tpP02Snap {
            0% {
              transform: scale(.92);
              box-shadow: 0 0 0 rgba(16,185,129,0);
            }

            42% {
              transform: scale(1.045);
              box-shadow: 0 0 34px rgba(16,185,129,.38);
            }

            72% {
              transform: scale(.99);
            }

            100% {
              transform: scale(1);
              box-shadow: 0 0 0 rgba(16,185,129,0);
            }
          }

          .tp-p02-snap {
            animation:
              tpP02Snap .56s
              cubic-bezier(.22,1.15,.36,1)
              both;
          }

          .tp-p02-drop-slot {
            transition:
              transform 110ms ease,
              border-color 110ms ease,
              background-color 110ms ease,
              box-shadow 110ms ease;
          }

          .tp-p02-dragging .tp-p02-country-card {
            transition: none !important;
          }

          .tp-p02-dragging .tp-p02-country-card:hover {
            transform: none !important;
            box-shadow: none !important;
          }
        `}
      </style>


      <div
        className="
          mb-5
          flex
          items-center
          gap-3
          rounded-2xl
          border
          border-blue-100
          bg-blue-50
          px-4
          py-3
        "
      >
        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-white
            text-xl
            shadow-sm
          "
        >
          ✋
        </div>

        <div>
          <p
            className="
              text-[10px]
              font-black
              tracking-[0.16em]
              text-blue-500
            "
          >
            HOW TO PLAY
          </p>

          <p
            className="
              mt-0.5
              text-sm
              font-bold
              text-slate-700
            "
          >
            国旗と国の形を見ながらカードをつかみ、
            ルワンダの正しい方向へ運ぼう。
            正しく入ると
            <span
              className="
                mx-1
                font-black
                text-emerald-600
              "
            >
              カチッ！ ✓
            </span>
          </p>
        </div>
      </div>


      <div
        className="
          mx-auto
          grid
          max-w-[860px]
          grid-cols-[1fr_1.25fr_1fr]
          grid-rows-3
          gap-4
        "
      >
        <div />

        <P02DropSlot
          slot={
            P02_SLOTS[0]
          }
          card={
            getPlacedCard(
              'north'
            )
          }
          fresh={
            justPlaced ===
            'north'
          }
          registerNode={
            registerSlotNode
          }
        />

        <div />


        <P02DropSlot
          slot={
            P02_SLOTS[1]
          }
          card={
            getPlacedCard(
              'west'
            )
          }
          fresh={
            justPlaced ===
            'west'
          }
          registerNode={
            registerSlotNode
          }
        />


        <div
          className="
            relative
            flex
            min-h-[185px]
            items-center
            justify-center
            overflow-hidden
            rounded-[34px]
            border-4
            border-emerald-300
            bg-gradient-to-br
            from-emerald-100
            via-white
            to-lime-100
            shadow-[0_18px_45px_rgba(16,185,129,0.16)]
          "
        >
          <div
            className="
              w-full
              max-w-[210px]
            "
          >
            <P02CountrySilhouette
              card={
                P02_RWANDA
              }
            />

            <div
              className="
                mt-2
                text-center
              "
            >
              <div
                className="
                  mx-auto
                  mb-2
                  w-fit
                "
              >
                <P02CountryFlag
                  card={
                    P02_RWANDA
                  }
                />
              </div>

              <p
                className="
                  text-xl
                  font-black
                  text-emerald-950
                "
              >
                ルワンダ
              </p>

              <p
                className="
                  text-xs
                  font-black
                  tracking-[0.15em]
                  text-emerald-600
                "
              >
                RWANDA
              </p>
            </div>
          </div>
        </div>


        <P02DropSlot
          slot={
            P02_SLOTS[2]
          }
          card={
            getPlacedCard(
              'east'
            )
          }
          fresh={
            justPlaced ===
            'east'
          }
          registerNode={
            registerSlotNode
          }
        />

        <div />


        <P02DropSlot
          slot={
            P02_SLOTS[3]
          }
          card={
            getPlacedCard(
              'south'
            )
          }
          fresh={
            justPlaced ===
            'south'
          }
          registerNode={
            registerSlotNode
          }
        />

        <div />
      </div>


      <div
        ref={
          cardsAreaRef
        }
        className="
          mt-7
          rounded-[28px]
          border
          border-slate-200
          bg-slate-50
          p-4
        "
      >
        <div
          className="
            mb-4
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <div>
            <p
              className="
                text-xs
                font-black
                tracking-[0.17em]
                text-slate-400
              "
            >
              COUNTRY CARDS
            </p>

            <p
              className="
                mt-1
                text-sm
                font-bold
                text-slate-600
              "
            >
              国旗・国土の形・国名を見て考えよう
            </p>
          </div>

          <div
            className="
              rounded-full
              bg-white
              px-3
              py-1.5
              text-[10px]
              font-black
              text-slate-400
              shadow-sm
            "
          >
            5 cards / 4 neighbors
          </div>
        </div>


        <div
          className="
            grid
            grid-cols-2
            gap-3
            md:grid-cols-5
          "
        >
          {
            P02_COUNTRIES.map(
              (
                card
              ) => (
                <P02CountryCard
                  key={
                    card.id
                  }
                  card={
                    card
                  }
                  used={
                    Object.values(
                      placed
                    ).includes(
                      card.id
                    )
                  }
                  onPointerDown={(
                    event
                  ) =>
                    startDrag(
                      event,
                      card
                    )
                  }
                />
              )
            )
          }
        </div>
      </div>


      <div
        ref={
          ghostRef
        }
        className="
          pointer-events-none
          fixed
          left-0
          top-0
          z-[10000]
          flex
          w-[190px]
          items-center
          gap-3
          rounded-[20px]
          border-2
          border-blue-400
          bg-white
          px-4
          py-3
          opacity-0
          shadow-[0_22px_60px_rgba(37,99,235,0.30)]
          will-change-transform
        "
        style={{
          visibility:
            'hidden',

          transform:
            'translate3d(-9999px, -9999px, 0)',

          transition:
            'none',

          backfaceVisibility:
            'hidden',

          WebkitBackfaceVisibility:
            'hidden',

          contain:
            'layout paint style',
        }}
      >
        <div
          className="
            h-[31px]
            w-[46px]
            shrink-0
            overflow-hidden
            rounded-md
            border
            border-slate-200
            bg-white
            shadow-sm
          "
        >
          <img
            ref={
              ghostFlagRef
            }
            src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="
            alt=""
            draggable="false"
            className="
              block
              h-full
              w-full
              object-cover
            "
          />
        </div>

        <div
          className="
            min-w-0
          "
        >
          <p
            ref={
              ghostJaRef
            }
            className="
              truncate
              text-sm
              font-black
              text-slate-900
            "
          />

          <p
            ref={
              ghostEnRef
            }
            className="
              truncate
              text-[10px]
              font-bold
              text-blue-500
            "
          />
        </div>
      </div>


      <RetryMessage
        show={
          wrong
        }
      >
        そこではありません。
        カードは元の位置に戻りました。
        東西南北を確認して、もう一度運んでみよう。
      </RetryMessage>
    </div>
  );
}


/* =========================================================
   P03 SHAPE
========================================================= */

function ShapeChoice({
  mission,
  onClear,
}) {
  const [
    wrong,
    setWrong,
  ] = useState(false);


  const choices =
    useMemo(
      () =>
        shuffleArray(
          mission.choices
        ),
      [
        mission.id,
      ]
    );


  return (
    <div>
      <div
        className="
          grid
          grid-cols-2
          gap-4
          lg:grid-cols-4
        "
      >
        {
          choices.map(
            (
              choice,
              index
            ) => (
              <button
                key={
                  choice.atlasName
                }
                type="button"
                onClick={() => {
                  if (
                    choice.correct
                  ) {
                    onClear();
                  } else {
                    setWrong(
                      true
                    );
                  }
                }}
                className="
                  overflow-hidden
                  rounded-[26px]
                  border-2
                  border-slate-200
                  bg-white
                  transition
                  hover:-translate-y-1
                  hover:border-blue-400
                  hover:shadow-xl
                "
              >
                <div
                  className="
                    aspect-square
                    bg-gradient-to-br
                    from-sky-50
                    to-emerald-50
                  "
                >
                  <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{
                      center:
                        choice.center,

                      scale:
                        choice.scale,
                    }}
                    width={420}
                    height={420}
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
                            const name =
                              geo
                                ?.properties
                                ?.name ??
                              '';

                            if (
                              name !==
                              choice.atlasName
                            ) {
                              return null;
                            }

                            return (
                              <Geography
                                key={
                                  geo.rsmKey
                                }
                                geography={
                                  geo
                                }
                                style={{
                                  default: {
                                    fill:
                                      '#0f172a',

                                    stroke:
                                      '#fff',

                                    outline:
                                      'none',
                                  },

                                  hover: {
                                    fill:
                                      '#2563eb',

                                    stroke:
                                      '#fff',

                                    outline:
                                      'none',
                                  },

                                  pressed: {
                                    fill:
                                      '#1d4ed8',

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

                <div
                  className="
                    p-4
                    text-xl
                    font-black
                    text-slate-700
                  "
                >
                  {
                    [
                      'A',
                      'B',
                      'C',
                      'D',
                    ][index]
                  }
                </div>
              </button>
            )
          )
        }
      </div>


      <RetryMessage
        show={
          wrong
        }
      >
        輪郭をよく見くらべて、
        もう一度選んでみよう。
      </RetryMessage>
    </div>
  );
}


/* =========================================================
   P04 CAPITAL
========================================================= */

function CapitalHunt({
  onClear,
}) {
  const [
    wrong,
    setWrong,
  ] = useState(false);


  return (
    <div>
      <CountryMap>
        {
          COUNTRY.cities.map(
            (
              city
            ) => (
              <Marker
                key={
                  city.name
                }
                coordinates={
                  city.coordinates
                }
              >
                <g
                  onClick={() => {
                    if (
                      city.name ===
                      'Kigali'
                    ) {
                      onClear();
                    } else {
                      setWrong(
                        true
                      );
                    }
                  }}
                  style={{
                    cursor:
                      'pointer',
                  }}
                >
                  <circle
                    r={15}
                    fill="#2563eb"
                    stroke="#fff"
                    strokeWidth={4}
                  />

                  <circle
                    r={30}
                    fill="transparent"
                  />
                </g>
              </Marker>
            )
          )
        }
      </CountryMap>


      <RetryMessage
        show={
          wrong
        }
      >
        キガリはルワンダの中央部に近い場所です。
        地図を拡大して探してみよう。
      </RetryMessage>
    </div>
  );
}


/* =========================================================
   P05 CITY
========================================================= */

function CityChallenge({
  onClear,
}) {
  const [
    index,
    setIndex,
  ] = useState(0);

  const [
    wrong,
    setWrong,
  ] = useState(false);


  const current =
    COUNTRY.cities[
      index
    ];


  const choose =
    (
      city
    ) => {
      if (
        city.name !==
        current.name
      ) {
        setWrong(
          true
        );

        return;
      }

      setWrong(
        false
      );

      if (
        index ===
        COUNTRY.cities.length -
        1
      ) {
        onClear();

        return;
      }

      setIndex(
        (
          value
        ) =>
          value +
          1
      );
    };


  return (
    <div>
      <div
        className="
          mb-4
          rounded-3xl
          border
          border-blue-100
          bg-blue-50
          p-5
        "
      >
        <p
          className="
            text-xs
            font-black
            tracking-[0.18em]
            text-blue-500
          "
        >
          ROUND {
            index +
            1
          } / 4
        </p>

        <p
          className="
            mt-2
            text-2xl
            font-black
          "
        >
          {
            current.labelJa
          }

          <span
            className="
              ml-2
              text-base
              text-slate-400
            "
          >
            {
              current.name
            }
          </span>
        </p>
      </div>


      <CountryMap>
        {
          COUNTRY.cities.map(
            (
              city
            ) => (
              <Marker
                key={
                  city.name
                }
                coordinates={
                  city.coordinates
                }
              >
                <g
                  onClick={() =>
                    choose(
                      city
                    )
                  }
                  style={{
                    cursor:
                      'pointer',
                  }}
                >
                  <circle
                    r={15}
                    fill="#7c3aed"
                    stroke="#fff"
                    strokeWidth={4}
                  />

                  <circle
                    r={30}
                    fill="transparent"
                  />
                </g>
              </Marker>
            )
          )
        }
      </CountryMap>


      <RetryMessage
        show={
          wrong
        }
      >
        北・南・東・西の位置関係を
        もう一度確認してみよう。
      </RetryMessage>
    </div>
  );
}


/* =========================================================
   P06 LANDSCAPE
========================================================= */

function LandscapeDetective({
  mission,
  language,
  onClear,
}) {
  const [
    wrong,
    setWrong,
  ] = useState(false);


  const choices =
    useMemo(
      () =>
        shuffleArray(
          mission
            .landscapeChoices
        ),
      [
        mission.id,
      ]
    );


  return (
    <div>
      <div
        className="
          grid
          grid-cols-1
          gap-4
          md:grid-cols-2
        "
      >
        {
          choices.map(
            (
              choice
            ) => (
              <button
                key={
                  choice.id
                }
                type="button"
                onClick={() => {
                  if (
                    choice.correct
                  ) {
                    onClear();
                  } else {
                    setWrong(
                      true
                    );
                  }
                }}
                className="
                  overflow-hidden
                  rounded-[28px]
                  border-2
                  border-slate-200
                  bg-white
                  transition
                  hover:-translate-y-1
                  hover:border-blue-400
                  hover:shadow-xl
                "
              >
                <CommonsImage
                  file={
                    choice
                      .commonsImage
                      .file
                  }
                  width={
                    choice
                      .commonsImage
                      .width
                  }
                  alt={
                    t(
                      choice.label,
                      language
                    )
                  }
                  className="
                    aspect-[4/3]
                    w-full
                  "
                  showCredit={
                    false
                  }
                />

                <div
                  className="
                    p-4
                    font-black
                    text-slate-800
                  "
                >
                  {
                    t(
                      choice.label,
                      language
                    )
                  }
                </div>
              </button>
            )
          )
        }
      </div>


      <RetryMessage
        show={
          wrong
        }
      >
        「千の丘の国」という名前をヒントに、
        地形をよく見てみよう。
      </RetryMessage>
    </div>
  );
}


/* =========================================================
   P07 LIFE PHOTOS
========================================================= */

function LifePhotoEvidence({
  mission,
  language,
  onClear,
}) {
  const [
    selected,
    setSelected,
  ] = useState([]);

  const [
    wrong,
    setWrong,
  ] = useState(false);


  const choices =
    useMemo(
      () =>
        shuffleArray(
          mission.choices
        ),
      [
        mission.id,
      ]
    );


  const toggle =
    (
      id
    ) => {
      setWrong(
        false
      );

      setSelected(
        (
          current
        ) => {
          if (
            current.includes(
              id
            )
          ) {
            return current.filter(
              (
                item
              ) =>
                item !==
                id
            );
          }

          if (
            current.length >=
            2
          ) {
            return current;
          }

          return [
            ...current,
            id,
          ];
        }
      );
    };


  const check =
    () => {
      const correctIds =
        new Set(
          mission
            .choices
            .filter(
              (
                item
              ) =>
                item.correct
            )
            .map(
              (
                item
              ) =>
                item.id
            )
        );

      const correct =
        selected.length ===
        2 &&
        selected.every(
          (
            id
          ) =>
            correctIds.has(
              id
            )
        );

      if (
        correct
      ) {
        onClear();
      } else {
        setWrong(
          true
        );
      }
    };


  return (
    <div>
      <div
        className="
          grid
          gap-4
          md:grid-cols-2
        "
      >
        {
          mission.photos.map(
            (
              photo
            ) => (
              <div
                key={
                  photo.id
                }
                className="
                  overflow-hidden
                  rounded-[28px]
                  border
                  border-slate-200
                  bg-white
                  shadow-sm
                "
              >
                <CommonsImage
                  file={
                    photo
                      .commonsImage
                      .file
                  }
                  width={
                    photo
                      .commonsImage
                      .width
                  }
                  alt={
                    t(
                      photo.caption,
                      language
                    )
                  }
                  className="
                    aspect-[16/10]
                    w-full
                  "
                  showCredit={
                    false
                  }
                />

                <div
                  className="
                    p-4
                  "
                >
                  <p
                    className="
                      text-xs
                      font-black
                      tracking-[0.15em]
                      text-blue-500
                    "
                  >
                    {
                      t(
                        photo.label,
                        language
                      )
                    }
                  </p>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-bold
                      text-slate-600
                    "
                  >
                    {
                      t(
                        photo.caption,
                        language
                      )
                    }
                  </p>
                </div>
              </div>
            )
          )
        }
      </div>


      <div
        className="
          mt-5
          rounded-[28px]
          border
          border-slate-200
          bg-slate-50
          p-5
        "
      >
        <p
          className="
            mb-4
            font-black
            text-slate-800
          "
        >
          写真から確かにわかることを
          <span
            className="
              mx-1
              text-blue-600
            "
          >
            2つ
          </span>
          選ぼう。
        </p>

        <div
          className="
            grid
            gap-3
            md:grid-cols-2
          "
        >
          {
            choices.map(
              (
                choice
              ) => {
                const active =
                  selected.includes(
                    choice.id
                  );

                return (
                  <button
                    key={
                      choice.id
                    }
                    type="button"
                    onClick={() =>
                      toggle(
                        choice.id
                      )
                    }
                    className={`
                      ${buttonBase}
                      min-h-[86px]
                      text-left

                      ${
                        active
                          ? `
                            border-blue-500
                            bg-blue-50
                            text-blue-800
                            ring-4
                            ring-blue-100
                          `
                          : `
                            border-slate-200
                            bg-white
                            text-slate-700
                          `
                      }
                    `}
                  >
                    {
                      t(
                        choice,
                        language
                      )
                    }
                  </button>
                );
              }
            )
          }
        </div>

        <button
          type="button"
          disabled={
            selected.length !==
            2
          }
          onClick={
            check
          }
          className="
            mt-5
            w-full
            rounded-2xl
            bg-blue-600
            px-5
            py-4
            font-black
            text-white
            disabled:bg-slate-300
          "
        >
          2つ選んで答え合わせ
        </button>
      </div>


      <RetryMessage
        show={
          wrong
        }
      >
        写真に写っている事実と、
        国全体についての決めつけを
        分けて考えてみよう。
      </RetryMessage>
    </div>
  );
}


/* =========================================================
   PHOTO CARD
========================================================= */

function PhotoChoiceCard({
  item,
  language,
  selected,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        overflow-hidden
        rounded-[24px]
        border-2
        bg-white
        text-left
        transition
        hover:-translate-y-1
        hover:shadow-lg

        ${
          selected
            ? `
              border-blue-500
              ring-4
              ring-blue-100
            `
            : `
              border-slate-200
              hover:border-blue-300
            `
        }
      `}
    >
      <CommonsImage
        file={
          item
            .commonsImage
            .file
        }
        width={
          item
            .commonsImage
            .width
        }
        alt={
          t(
            item,
            language
          )
        }
        className="
          aspect-[16/9]
          w-full
        "
        showCredit={
          false
        }
      />

      <div
        className="
          p-4
          text-center
          font-black
          text-slate-800
        "
      >
        {
          t(
            item,
            language
          )
        }
      </div>
    </button>
  );
}


/* =========================================================
   P08 ROUTE
========================================================= */

function RouteChallenge({
  mission,
  language,
  onClear,
}) {
  const [
    country,
    setCountry,
  ] = useState(null);

  const [
    port,
    setPort,
  ] = useState(null);

  const [
    wrong,
    setWrong,
  ] = useState(false);


  const countryChoices =
    useMemo(
      () =>
        shuffleArray(
          mission
            .route
            .countryChoices
        ),
      [
        mission.id,
      ]
    );


  const portChoices =
    useMemo(
      () =>
        shuffleArray(
          mission
            .route
            .portChoices
        ),
      [
        mission.id,
      ]
    );


  const check =
    () => {
      const countryItem =
        mission
          .route
          .countryChoices
          .find(
            (
              item
            ) =>
              item.id ===
              country
          );

      const portItem =
        mission
          .route
          .portChoices
          .find(
            (
              item
            ) =>
              item.id ===
              port
          );

      if (
        countryItem
          ?.correct &&
        portItem
          ?.correct
      ) {
        onClear();
      } else {
        setWrong(
          true
        );
      }
    };


  return (
    <div>
      <div
        className="
          rounded-[28px]
          border
          border-emerald-100
          bg-gradient-to-r
          from-emerald-50
          via-white
          to-cyan-50
          p-5
        "
      >
        <div
          className="
            flex
            flex-wrap
            items-center
            justify-center
            gap-3
            font-black
          "
        >
          <div
            className="
              rounded-2xl
              bg-emerald-600
              px-5
              py-4
              text-white
            "
          >
            🇷🇼 ルワンダ
          </div>

          <ChevronRight />

          <div
            className="
              rounded-2xl
              border-2
              border-dashed
              border-blue-300
              bg-white
              px-5
              py-4
              text-blue-600
            "
          >
            {
              country
                ? t(
                    mission
                      .route
                      .countryChoices
                      .find(
                        (
                          item
                        ) =>
                          item.id ===
                          country
                      ),
                    language
                  )
                : '国を選ぶ'
            }
          </div>

          <ChevronRight />

          <div
            className="
              rounded-2xl
              border-2
              border-dashed
              border-amber-300
              bg-white
              px-5
              py-4
              text-amber-700
            "
          >
            {
              port
                ? t(
                    mission
                      .route
                      .portChoices
                      .find(
                        (
                          item
                        ) =>
                          item.id ===
                          port
                      ),
                    language
                  )
                : '港を選ぶ'
            }
          </div>

          <ChevronRight />

          <div
            className="
              rounded-2xl
              bg-cyan-500
              px-5
              py-4
              text-white
            "
          >
            🌊 インド洋
          </div>
        </div>
      </div>


      <div
        className="
          mt-6
        "
      >
        <p
          className="
            mb-3
            text-xs
            font-black
            tracking-[0.18em]
            text-blue-500
          "
        >
          STEP 1 · 通過する国
        </p>

        <div
          className="
            grid
            gap-4
            md:grid-cols-3
          "
        >
          {
            countryChoices.map(
              (
                item
              ) => (
                <PhotoChoiceCard
                  key={
                    item.id
                  }
                  item={
                    item
                  }
                  language={
                    language
                  }
                  selected={
                    country ===
                    item.id
                  }
                  onClick={() => {
                    setCountry(
                      item.id
                    );

                    setWrong(
                      false
                    );
                  }}
                />
              )
            )
          }
        </div>
      </div>


      <div
        className="
          mt-7
        "
      >
        <p
          className="
            mb-3
            text-xs
            font-black
            tracking-[0.18em]
            text-amber-600
          "
        >
          STEP 2 · 港を選ぶ
        </p>

        <div
          className="
            grid
            gap-4
            md:grid-cols-3
          "
        >
          {
            portChoices.map(
              (
                item
              ) => (
                <PhotoChoiceCard
                  key={
                    item.id
                  }
                  item={
                    item
                  }
                  language={
                    language
                  }
                  selected={
                    port ===
                    item.id
                  }
                  onClick={() => {
                    setPort(
                      item.id
                    );

                    setWrong(
                      false
                    );
                  }}
                />
              )
            )
          }
        </div>
      </div>


      <button
        type="button"
        disabled={
          !country ||
          !port
        }
        onClick={
          check
        }
        className="
          mt-6
          w-full
          rounded-2xl
          bg-gradient-to-r
          from-emerald-600
          to-cyan-600
          px-5
          py-4
          text-lg
          font-black
          text-white
          shadow-lg
          disabled:bg-slate-300
          disabled:shadow-none
        "
      >
        🚚 トラックを出発させる！
      </button>


      <RetryMessage
        show={
          wrong
        }
      >
        ルワンダの東側にある国と、
        インド洋に面する港を考えてみよう。
      </RetryMessage>
    </div>
  );
}


/* =========================================================
   P09 PHOTO EVIDENCE
========================================================= */

function PhotoEvidence({
  mission,
  language,
  onClear,
}) {
  const [
    wrong,
    setWrong,
  ] = useState(false);


  const choices =
    useMemo(
      () =>
        shuffleArray(
          mission.choices
        ),
      [
        mission.id,
      ]
    );


  return (
    <div>
      <CommonsImage
        file={
          mission
            .commonsImage
            .file
        }
        width={
          mission
            .commonsImage
            .width
        }
        alt="Kigali skyline"
        className="
          aspect-[16/7]
          w-full
          rounded-[28px]
        "
        showCredit={
          false
        }
      />


      <div
        className="
          mt-5
          grid
          gap-3
          md:grid-cols-2
        "
      >
        {
          choices.map(
            (
              choice
            ) => (
              <button
                key={
                  choice.id
                }
                type="button"
                onClick={() => {
                  if (
                    choice.correct
                  ) {
                    onClear();
                  } else {
                    setWrong(
                      true
                    );
                  }
                }}
                className={`
                  ${buttonBase}
                  min-h-[90px]
                  border-slate-200
                  bg-white
                  text-left
                  text-slate-700
                  hover:border-blue-400
                `}
              >
                {
                  t(
                    choice,
                    language
                  )
                }
              </button>
            )
          )
        }
      </div>


      <RetryMessage
        show={
          wrong
        }
      >
        この写真から直接確認できることと、
        国全体についての推測を分けて考えてみよう。
      </RetryMessage>
    </div>
  );
}


/* =========================================================
   FINAL REGION MAP
========================================================= */

function FinalRegionMap({
  onCorrect,
}) {
  const [
    wrong,
    setWrong,
  ] = useState(false);

  const [
    position,
    setPosition,
  ] = useState({
    coordinates: [
      30,
      -1.5,
    ],

    zoom:
      5.8,
  });


  return (
    <div>
      <div
        className="
          relative
          overflow-hidden
          rounded-[28px]
          border
          border-slate-200
          bg-sky-100
        "
      >
        <MapControls
          zoom={
            position.zoom
          }
          minZoom={
            3
          }
          maxZoom={
            10
          }
          onZoomIn={() =>
            setPosition(
              (
                current
              ) => ({
                ...current,

                zoom:
                  Math.min(
                    10,
                    current.zoom +
                    0.7
                  ),
              })
            )
          }
          onZoomOut={() =>
            setPosition(
              (
                current
              ) => ({
                ...current,

                zoom:
                  Math.max(
                    3,
                    current.zoom -
                    0.7
                  ),
              })
            )
          }
          onReset={() =>
            setPosition({
              coordinates: [
                30,
                -1.5,
              ],

              zoom:
                5.8,
            })
          }
        />

        <ComposableMap
          projection="geoEqualEarth"
          width={1000}
          height={550}
          className="
            h-auto
            w-full
          "
        >
          <ZoomableGroup
            center={
              position.coordinates
            }
            zoom={
              position.zoom
            }
            minZoom={
              3
            }
            maxZoom={
              10
            }
            onMoveEnd={
              setPosition
            }
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
                    const name =
                      geo
                        ?.properties
                        ?.name ??
                      '';

                    return (
                      <Geography
                        key={
                          geo.rsmKey
                        }
                        geography={
                          geo
                        }
                        onClick={() => {
                          if (
                            name ===
                            'Rwanda'
                          ) {
                            onCorrect();
                          } else {
                            setWrong(
                              true
                            );
                          }
                        }}
                        style={{
                          default: {
                            fill:
                              '#dbe4ee',

                            stroke:
                              '#ffffff',

                            strokeWidth:
                              0.25,

                            cursor:
                              'pointer',

                            outline:
                              'none',
                          },

                          hover: {
                            fill:
                              '#60a5fa',

                            stroke:
                              '#ffffff',

                            cursor:
                              'pointer',

                            outline:
                              'none',
                          },

                          pressed: {
                            fill:
                              '#2563eb',

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
      </div>


      <RetryMessage
        show={
          wrong
        }
      >
        東アフリカの中央付近にある
        小さな国を探してみよう。
      </RetryMessage>
    </div>
  );
}


/* =========================================================
   P10 GEO MASTER
========================================================= */

function GeoMaster({
  mission,
  language,
  onClear,
}) {
  const [
    round,
    setRound,
  ] = useState(0);

  const [
    keys,
    setKeys,
  ] = useState([
    false,
    false,
    false,
  ]);

  const [
    selectedFacts,
    setSelectedFacts,
  ] = useState([]);

  const [
    wrong,
    setWrong,
  ] = useState(false);


  const factChoices =
    useMemo(
      () =>
        shuffleArray(
          mission.facts
        ),
      [
        mission.id,
      ]
    );


  const getKey =
    (
      keyIndex
    ) => {
      setKeys(
        (
          current
        ) =>
          current.map(
            (
              value,
              index
            ) =>
              index ===
              keyIndex
                ? true
                : value
          )
      );

      setWrong(
        false
      );

      window.setTimeout(
        () =>
          setRound(
            keyIndex +
            1
          ),
        350
      );
    };


  const toggleFact =
    (
      id
    ) => {
      setWrong(
        false
      );

      setSelectedFacts(
        (
          current
        ) => {
          if (
            current.includes(
              id
            )
          ) {
            return current.filter(
              (
                item
              ) =>
                item !==
                id
            );
          }

          if (
            current.length >=
            3
          ) {
            return current;
          }

          return [
            ...current,
            id,
          ];
        }
      );
    };


  const checkFacts =
    () => {
      const correctIds =
        new Set(
          mission
            .facts
            .filter(
              (
                item
              ) =>
                item.correct
            )
            .map(
              (
                item
              ) =>
                item.id
            )
        );

      const correct =
        selectedFacts.length ===
        3 &&
        selectedFacts.every(
          (
            id
          ) =>
            correctIds.has(
              id
            )
        );

      if (
        correct
      ) {
        setKeys([
          true,
          true,
          true,
        ]);

        window.setTimeout(
          onClear,
          450
        );
      } else {
        setWrong(
          true
        );
      }
    };


  return (
    <div>
      <div
        className="
          mb-6
          rounded-[30px]
          bg-slate-950
          p-5
          text-white
        "
      >
        <div
          className="
            flex
            flex-wrap
            items-center
            justify-between
            gap-4
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-black
                tracking-[0.2em]
                text-cyan-300
              "
            >
              FINAL ADVENTURE
            </p>

            <p
              className="
                mt-1
                text-xl
                font-black
              "
            >
              3つの鍵を集めろ！
            </p>
          </div>

          <div
            className="
              flex
              gap-3
            "
          >
            {
              keys.map(
                (
                  unlocked,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className={`
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-2xl
                      border

                      ${
                        unlocked
                          ? `
                            border-amber-300
                            bg-amber-400
                            text-slate-950
                          `
                          : `
                            border-white/15
                            bg-white/10
                            text-white/30
                          `
                      }
                    `}
                  >
                    <KeyRound
                      size={
                        23
                      }
                    />
                  </div>
                )
              )
            }
          </div>
        </div>
      </div>


      {
        round ===
        0 && (
          <>
            <div
              className="
                mb-4
                rounded-2xl
                bg-blue-50
                p-4
              "
            >
              <p
                className="
                  text-xs
                  font-black
                  text-blue-500
                "
              >
                🔑 KEY 1 · MAP KEY
              </p>

              <p
                className="
                  mt-1
                  font-black
                "
              >
                東アフリカから
                ルワンダをタップしよう！
              </p>
            </div>

            <FinalRegionMap
              onCorrect={() =>
                getKey(
                  0
                )
              }
            />
          </>
        )
      }


      {
        round ===
        1 && (
          <>
            <div
              className="
                mb-4
                rounded-2xl
                bg-violet-50
                p-4
              "
            >
              <p
                className="
                  text-xs
                  font-black
                  text-violet-500
                "
              >
                🔑 KEY 2 · CITY KEY
              </p>

              <p
                className="
                  mt-1
                  font-black
                "
              >
                首都キガリをタップしよう！
              </p>
            </div>


            <CountryMap>
              {
                COUNTRY.cities.map(
                  (
                    city
                  ) => (
                    <Marker
                      key={
                        city.name
                      }
                      coordinates={
                        city.coordinates
                      }
                    >
                      <g
                        onClick={() => {
                          if (
                            city.name ===
                            'Kigali'
                          ) {
                            getKey(
                              1
                            );
                          } else {
                            setWrong(
                              true
                            );
                          }
                        }}
                        style={{
                          cursor:
                            'pointer',
                        }}
                      >
                        <circle
                          r={15}
                          fill="#7c3aed"
                          stroke="#fff"
                          strokeWidth={4}
                        />

                        <circle
                          r={30}
                          fill="transparent"
                        />
                      </g>
                    </Marker>
                  )
                )
              }
            </CountryMap>

            <RetryMessage
              show={
                wrong
              }
            >
              キガリは国土の中央部に近い場所です。
            </RetryMessage>
          </>
        )
      }


      {
        round ===
        2 && (
          <>
            <div
              className="
                mb-4
                rounded-2xl
                bg-amber-50
                p-4
              "
            >
              <p
                className="
                  text-xs
                  font-black
                  text-amber-600
                "
              >
                🔑 KEY 3 · GEOGRAPHY KEY
              </p>

              <p
                className="
                  mt-1
                  font-black
                "
              >
                正しい情報を3つ選ぼう！
              </p>
            </div>


            <div
              className="
                grid
                gap-3
                md:grid-cols-2
                lg:grid-cols-3
              "
            >
              {
                factChoices.map(
                  (
                    item
                  ) => {
                    const active =
                      selectedFacts.includes(
                        item.id
                      );

                    return (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() =>
                          toggleFact(
                            item.id
                          )
                        }
                        className={`
                          rounded-[24px]
                          border-2
                          p-5
                          text-left
                          transition

                          ${
                            active
                              ? `
                                border-amber-500
                                bg-amber-50
                                ring-4
                                ring-amber-100
                              `
                              : `
                                border-slate-200
                                bg-white
                              `
                          }
                        `}
                      >
                        <div
                          className="
                            text-4xl
                          "
                        >
                          {
                            item.emoji
                          }
                        </div>

                        <p
                          className="
                            mt-3
                            text-sm
                            font-black
                            leading-6
                          "
                        >
                          {
                            t(
                              item,
                              language
                            )
                          }
                        </p>
                      </button>
                    );
                  }
                )
              }
            </div>


            <button
              type="button"
              disabled={
                selectedFacts.length !==
                3
              }
              onClick={
                checkFacts
              }
              className="
                mt-5
                w-full
                rounded-2xl
                bg-gradient-to-r
                from-amber-500
                via-orange-500
                to-pink-500
                px-5
                py-4
                text-lg
                font-black
                text-white
                disabled:bg-slate-300
              "
            >
              🔑 最後の鍵をアンロック！
            </button>


            <RetryMessage
              show={
                wrong
              }
            >
              これまでのMissionで学んだ
              地形・首都・海との関係を思い出そう。
            </RetryMessage>
          </>
        )
      }
    </div>
  );
}


/* =========================================================
   GAME ROUTER
========================================================= */

function MissionGame({
  mission,
  language,
  onClear,
}) {
  switch (
    mission.type
  ) {
    case 'world-locator':
      return (
        <WorldLocator
          language={
            language
          }
          onClear={
            onClear
          }
        />
      );

    case 'neighbor-puzzle':
      return (
        <NeighborPuzzle
          onClear={
            onClear
          }
        />
      );

    case 'shape-choice':
      return (
        <ShapeChoice
          mission={
            mission
          }
          onClear={
            onClear
          }
        />
      );

    case 'capital-hunt':
      return (
        <CapitalHunt
          onClear={
            onClear
          }
        />
      );

    case 'city-challenge':
      return (
        <CityChallenge
          onClear={
            onClear
          }
        />
      );

    case 'landscape-detective':
      return (
        <LandscapeDetective
          mission={
            mission
          }
          language={
            language
          }
          onClear={
            onClear
          }
        />
      );

    case 'life-photo-evidence':
      return (
        <LifePhotoEvidence
          mission={
            mission
          }
          language={
            language
          }
          onClear={
            onClear
          }
        />
      );

    case 'route-challenge':
      return (
        <RouteChallenge
          mission={
            mission
          }
          language={
            language
          }
          onClear={
            onClear
          }
        />
      );

    case 'photo-evidence':
      return (
        <PhotoEvidence
          mission={
            mission
          }
          language={
            language
          }
          onClear={
            onClear
          }
        />
      );

    case 'geo-master':
      return (
        <GeoMaster
          mission={
            mission
          }
          language={
            language
          }
          onClear={
            onClear
          }
        />
      );

    default:
      return (
        <div
          className="
            rounded-3xl
            bg-red-50
            p-8
            text-center
            font-black
            text-red-600
          "
        >
          Mission type not found:
          {' '}
          {
            mission.type
          }
        </div>
      );
  }
}


/* =========================================================
   PAGE
========================================================= */

export default function PlaceAdventure({
  initialLevel =
    data.defaultLevel,

  countryCode =
    data.countryCode ??
    'rw',

  onProgressChange,
}) {
  const [
    level,
    setLevel,
  ] = useState(
    initialLevel ||
    data.defaultLevel
  );

  const [
    language,
    setLanguage,
  ] = useState(
    data.defaultLanguage
  );

  const [
    currentIndex,
    setCurrentIndex,
  ] = useState(0);

  const [
    completed,
    setCompleted,
  ] = useState(
    () =>
      getPlaceProgress(
        countryCode
      ).completedMissionIds
  );

  const [
    runKey,
    setRunKey,
  ] = useState(0);

  const [
    celebration,
    setCelebration,
  ] = useState(null);


  const mission =
    data.missions[
      currentIndex
    ];


  const levelMeta =
    LEVELS.find(
      (
        item
      ) =>
        item.id ===
        level
    ) ??
    LEVELS[0];


  const isDone =
    completed.includes(
      mission.id
    );


  const points =
    completed.reduce(
      (
        total,
        id
      ) => {
        const item =
          data.missions.find(
            (
              candidate
            ) =>
              candidate.id ===
              id
          );

        return (
          total +
          Number(
            item?.points ??
            0
          )
        );
      },
      0
    );


  useEffect(
    () => {
      if (
        initialLevel &&
        initialLevel !==
        level
      ) {
        setLevel(
          initialLevel
        );
      }
    },
    [
      initialLevel,
    ]
  );


  useEffect(
    () => {
      const stored =
        getPlaceProgress(
          countryCode
        );

      setCompleted(
        stored.completedMissionIds
      );
    },
    [
      countryCode,
    ]
  );


  useEffect(
    () => {
      if (
        level ===
        'highSchoolAdvanced'
      ) {
        setLanguage(
          'en'
        );
      } else {
        setLanguage(
          'ja'
        );
      }
    },
    [
      level,
    ]
  );


  const go =
    (
      index
    ) => {
      if (
        index < 0 ||
        index >=
        data.missions.length
      ) {
        return;
      }

      setCurrentIndex(
        index
      );

      setRunKey(
        (
          value
        ) =>
          value +
          1
      );

      window.scrollTo({
        top:
          0,

        behavior:
          'smooth',
      });
    };


  const handleClear =
    () => {
      const result =
        completePlaceMission(
          countryCode,
          mission.id
        );

      const firstClear =
        Boolean(
          result.isNewCompletion
        );

      if (
        firstClear
      ) {
        setCompleted(
          result
            .progress
            .completedMissionIds
        );

        onProgressChange?.(
          result.progress
        );
      }

      playUiSound(
        'success'
      );

      if (
        typeof navigator !==
          'undefined' &&
        'vibrate' in
          navigator
      ) {
        navigator.vibrate([
          45,
          35,
          90,
          45,
          130,
        ]);
      }

      setCelebration({
        firstClear,

        points:
          Number(
            mission.points ??
            0
          ),

        title:
          t(
            mission.title,
            language
          ),

        headline:
          t(
            mission
              .success
              ?.headline,
            language
          ) ||
          'Great Job!',

        discovery:
          t(
            mission
              .success
              ?.discovery,
            language
          ),

        isFinal:
          currentIndex ===
          data.missions.length -
          1,
      });
    };


  const nextMission =
    currentIndex <
    data.missions.length -
    1
      ? data.missions[
          currentIndex +
          1
        ]
      : null;


  const instruction =
    mission
      ?.instruction
      ?.[level];


  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-br
        from-slate-100
        via-white
        to-blue-50
        text-slate-900
      "
    >
      <PlaceMissionSuccessModal
        celebration={
          celebration
        }
        nextMission={
          nextMission
            ? t(
                nextMission.title,
                language
              )
            : null
        }
        onNext={() => {
          setCelebration(
            null
          );

          if (
            nextMission
          ) {
            go(
              currentIndex +
              1
            );
          } else {
            go(
              0
            );
          }
        }}
        onBackToList={() => {
          setCelebration(
            null
          );

          window.scrollTo({
            top:
              0,

            behavior:
              'smooth',
          });
        }}
        onReview={() => {
          setCelebration(
            null
          );

          setRunKey(
            (
              value
            ) =>
              value +
              1
          );
        }}
      />


      <header
        className="
          sticky
          top-0
          z-50
          border-b
          border-white/70
          bg-slate-950/95
          text-white
          shadow-xl
          backdrop-blur
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-[1500px]
            flex-wrap
            items-center
            justify-between
            gap-4
            px-4
            py-4
            md:px-7
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-2xl
                bg-gradient-to-br
                from-emerald-400
                to-cyan-400
                text-2xl
              "
            >
              🌍
            </div>

            <div>
              <p
                className="
                  text-[10px]
                  font-black
                  tracking-[0.22em]
                  text-cyan-300
                "
              >
                TIMEPALETTE · WORLD ADVENTURE
              </p>

              <h1
                className="
                  text-xl
                  font-black
                  md:text-2xl
                "
              >
                Rwanda · Place & Geography Adventure
              </h1>
            </div>
          </div>


          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <select
              value={
                level
              }
              onChange={(
                event
              ) =>
                setLevel(
                  event
                    .target
                    .value
                )
              }
              className="
                rounded-xl
                border
                border-white/15
                bg-white/10
                px-3
                py-2
                text-sm
                font-black
                text-white
              "
            >
              {
                LEVELS.map(
                  (
                    item
                  ) => (
                    <option
                      key={
                        item.id
                      }
                      value={
                        item.id
                      }
                      className="
                        text-slate-900
                      "
                    >
                      {
                        item.icon
                      }
                      {' '}
                      {
                        item.ja
                      }
                    </option>
                  )
                )
              }
            </select>


            <div
              className="
                flex
                rounded-xl
                bg-white/10
                p-1
              "
            >
              {
                [
                  [
                    'ja',
                    '日本語',
                  ],
                  [
                    'en',
                    'English',
                  ],
                ].map(
                  ([
                    id,
                    label,
                  ]) => (
                    <button
                      key={
                        id
                      }
                      type="button"
                      onClick={() =>
                        setLanguage(
                          id
                        )
                      }
                      className={`
                        rounded-lg
                        px-3
                        py-1.5
                        text-xs
                        font-black

                        ${
                          language ===
                          id
                            ? `
                              bg-white
                              text-slate-950
                            `
                            : `
                              text-white/65
                            `
                        }
                      `}
                    >
                      {
                        label
                      }
                    </button>
                  )
                )
              }
            </div>
          </div>
        </div>
      </header>


      <div
        className="
          mx-auto
          grid
          max-w-[1500px]
          gap-6
          p-4
          md:p-6
          lg:grid-cols-[280px_minmax(0,1fr)]
        "
      >
        <aside
          className="
            self-start
            lg:sticky
            lg:top-[94px]
          "
        >
          <div
            className="
              rounded-[30px]
              border
              border-slate-200
              bg-white
              p-4
              shadow-lg
            "
          >
            <div
              className="
                rounded-2xl
                bg-gradient-to-br
                from-emerald-500
                to-cyan-500
                p-4
                text-white
              "
            >
              <p
                className="
                  text-xs
                  font-black
                  tracking-[0.15em]
                  text-white/70
                "
              >
                YOUR PROGRESS
              </p>

              <div
                className="
                  mt-3
                  flex
                  items-end
                  justify-between
                "
              >
                <div>
                  <p
                    className="
                      text-4xl
                      font-black
                    "
                  >
                    {
                      completed.length
                    }

                    <span
                      className="
                        text-lg
                        text-white/60
                      "
                    >
                      /10
                    </span>
                  </p>

                  <p
                    className="
                      text-xs
                      font-bold
                      text-white/70
                    "
                  >
                    missions
                  </p>
                </div>

                <div
                  className="
                    text-right
                  "
                >
                  <p
                    className="
                      text-2xl
                      font-black
                    "
                  >
                    {
                      points
                    }
                  </p>

                  <p
                    className="
                      text-[10px]
                      font-black
                      text-white/70
                    "
                  >
                    WP
                  </p>
                </div>
              </div>
            </div>


            <div
              className="
                mt-4
                space-y-2
              "
            >
              {
                data.missions.map(
                  (
                    item,
                    index
                  ) => {
                    const active =
                      index ===
                      currentIndex;

                    const done =
                      completed.includes(
                        item.id
                      );

                    return (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() =>
                          go(
                            index
                          )
                        }
                        className={`
                          flex
                          w-full
                          items-center
                          gap-3
                          rounded-2xl
                          border
                          px-3
                          py-3
                          text-left

                          ${
                            active
                              ? `
                                border-blue-300
                                bg-blue-50
                              `
                              : `
                                border-transparent
                                hover:bg-slate-50
                              `
                          }
                        `}
                      >
                        <div
                          className={`
                            flex
                            h-10
                            w-10
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl

                            ${
                              done
                                ? `
                                  bg-emerald-500
                                  text-white
                                `
                                : `
                                  bg-slate-100
                                `
                            }
                          `}
                        >
                          {
                            done
                              ? (
                                <Check
                                  size={
                                    18
                                  }
                                />
                              )
                              : item.icon
                          }
                        </div>

                        <div
                          className="
                            min-w-0
                          "
                        >
                          <p
                            className="
                              text-[10px]
                              font-black
                              text-slate-400
                            "
                          >
                            P{
                              String(
                                index +
                                1
                              ).padStart(
                                2,
                                '0'
                              )
                            }
                          </p>

                          <p
                            className="
                              truncate
                              text-sm
                              font-black
                              text-slate-800
                            "
                          >
                            {
                              t(
                                item.title,
                                language
                              )
                            }
                          </p>
                        </div>
                      </button>
                    );
                  }
                )
              }
            </div>
          </div>
        </aside>


        <main
          className="
            min-w-0
          "
        >
          <section
            className="
              overflow-hidden
              rounded-[34px]
              border
              border-slate-200
              bg-white
              shadow-[0_20px_60px_rgba(15,23,42,0.10)]
            "
          >
            <div
              className="
                bg-gradient-to-r
                from-slate-950
                via-blue-950
                to-emerald-950
                px-5
                py-6
                text-white
                md:px-8
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >
                <div>
                  <div
                    className="
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
                        py-1
                        text-xs
                        font-black
                      "
                    >
                      P{
                        String(
                          currentIndex +
                          1
                        ).padStart(
                          2,
                          '0'
                        )
                      }
                    </span>

                    <span
                      className="
                        rounded-full
                        bg-cyan-300/15
                        px-3
                        py-1
                        text-xs
                        font-black
                        text-cyan-200
                      "
                    >
                      {
                        levelMeta.icon
                      }
                      {' '}
                      {
                        language ===
                        'ja'
                          ? levelMeta.ja
                          : levelMeta.en
                      }
                    </span>

                    <span
                      className="
                        rounded-full
                        bg-amber-300/15
                        px-3
                        py-1
                        text-xs
                        font-black
                        text-amber-200
                      "
                    >
                      +{
                        mission.points
                      } WP
                    </span>
                  </div>

                  <div
                    className="
                      mt-4
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <div
                      className="
                        text-4xl
                      "
                    >
                      {
                        mission.icon
                      }
                    </div>

                    <h2
                      className="
                        text-3xl
                        font-black
                        tracking-tight
                        md:text-4xl
                      "
                    >
                      {
                        t(
                          mission.title,
                          language
                        )
                      }
                    </h2>
                  </div>
                </div>


                {
                  isDone && (
                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        rounded-full
                        bg-emerald-400/20
                        px-4
                        py-2
                        font-black
                        text-emerald-200
                      "
                    >
                      <Sparkles
                        size={
                          18
                        }
                      />

                      CLEAR
                    </div>
                  )
                }
              </div>
            </div>


            <div
              className="
                p-5
                md:p-8
              "
            >
              <div
                className="
                  mb-6
                  rounded-[26px]
                  border
                  border-blue-100
                  bg-gradient-to-br
                  from-blue-50
                  to-cyan-50
                  p-5
                  md:p-6
                "
              >
                <p
                  className="
                    text-xs
                    font-black
                    tracking-[0.16em]
                    text-blue-500
                  "
                >
                  YOUR MISSION
                </p>

                <p
                  className="
                    mt-2
                    text-lg
                    font-black
                    leading-8
                    text-slate-800
                    md:text-xl
                  "
                >
                  {
                    t(
                      instruction,
                      language
                    )
                  }
                </p>
              </div>


              <MissionGame
                key={
                  `${mission.id}-${runKey}-${level}-${language}`
                }
                mission={
                  mission
                }
                language={
                  language
                }
                onClear={
                  handleClear
                }
              />


              <div
                className="
                  mt-8
                  flex
                  flex-wrap
                  items-center
                  justify-between
                  gap-3
                  border-t
                  border-slate-100
                  pt-5
                "
              >
                <button
                  type="button"
                  disabled={
                    currentIndex ===
                    0
                  }
                  onClick={() =>
                    go(
                      currentIndex -
                      1
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-sm
                    font-black
                    text-slate-600
                    disabled:opacity-30
                  "
                >
                  <ChevronLeft
                    size={
                      18
                    }
                  />

                  前のMission
                </button>


                <button
                  type="button"
                  onClick={() =>
                    setRunKey(
                      (
                        value
                      ) =>
                        value +
                        1
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-slate-100
                    px-4
                    py-3
                    text-sm
                    font-black
                    text-slate-600
                  "
                >
                  <RotateCcw
                    size={
                      17
                    }
                  />

                  このMissionをリセット
                </button>


                <button
                  type="button"
                  disabled={
                    !isDone ||
                    currentIndex ===
                    data.missions.length -
                    1
                  }
                  onClick={() =>
                    go(
                      currentIndex +
                      1
                    )
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    bg-blue-600
                    px-5
                    py-3
                    text-sm
                    font-black
                    text-white
                    disabled:cursor-not-allowed
                    disabled:bg-blue-200
                  "
                >
                  次のMission

                  <ChevronRight
                    size={
                      18
                    }
                  />
                </button>
              </div>
            </div>
          </section>


          {
            completed.length ===
            10 && (
              <section
                className="
                  mt-6
                  rounded-[34px]
                  bg-gradient-to-r
                  from-amber-400
                  via-orange-500
                  to-pink-500
                  p-8
                  text-center
                  text-white
                  shadow-xl
                "
              >
                <Trophy
                  size={
                    58
                  }
                  className="
                    mx-auto
                  "
                />

                <p
                  className="
                    mt-4
                    text-xs
                    font-black
                    tracking-[0.22em]
                  "
                >
                  GEOGRAPHY MASTER
                </p>

                <h2
                  className="
                    mt-2
                    text-4xl
                    font-black
                  "
                >
                  10 Missions Complete!
                </h2>
              </section>
            )
          }
        </main>
      </div>
    </div>
  );
}