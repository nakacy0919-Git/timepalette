import {
  CheckCircle2,
  Lightbulb,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';

import {
  useMemo,
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


/* =========================================================
   HELPERS
========================================================= */

function getTargetCountryName(
  mission
) {
  return (
    mission
      ?.challenge
      ?.targetAtlasName ||
    mission
      ?.challenge
      ?.targetName ||
    ''
  );
}


function normalizeCities(
  mission
) {
  const rawCities =
    mission
      ?.challenge
      ?.cities ??
    [];

  return rawCities
    .map(
      (city) => ({
        name:
          city?.name ??
          '',

        labelJa:
          city?.labelJa ??
          city?.name ??
          '',

        coordinates:
          city?.coordinates,

        timeZone:
          city?.timeZone ??
          '',

        region:
          city?.region ??
          '',
      })
    )
    .filter(
      (city) =>
        city.name &&
        Array.isArray(
          city.coordinates
        ) &&
        city.coordinates.length ===
          2 &&
        city.coordinates.every(
          (value) =>
            Number.isFinite(
              Number(value)
            )
        )
    );
}


const clamp = (
  value,
  minimum,
  maximum
) =>
  Math.min(
    maximum,
    Math.max(
      minimum,
      value
    )
  );


const normalizeCountryName = (
  value
) =>
  String(
    value ?? ''
  )
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      ''
    )
    .replace(
      /[^a-z0-9]+/g,
      ' '
    )
    .trim();


/* =========================================================
   CONTINENT HINT

   Mission JSON側に challenge.hintRegion がある場合は
   それを最優先します。

   例:
   hintRegion: "northAmerica"
   hintMapCenter: [-100, 45]
   hintZoom: 2.1
========================================================= */

const REGION_META = {
  northAmerica: {
    labelJa: '北アメリカ',
    labelEn: 'North America',
    center: [
      -100,
      45,
    ],
    zoom: 2.05,
  },

  southAmerica: {
    labelJa: '南アメリカ',
    labelEn: 'South America',
    center: [
      -60,
      -15,
    ],
    zoom: 2.15,
  },

  europe: {
    labelJa: 'ヨーロッパ',
    labelEn: 'Europe',
    center: [
      16,
      51,
    ],
    zoom: 3.05,
  },

  africa: {
    labelJa: 'アフリカ',
    labelEn: 'Africa',
    center: [
      20,
      3,
    ],
    zoom: 2.25,
  },

  asia: {
    labelJa: 'アジア',
    labelEn: 'Asia',
    center: [
      88,
      32,
    ],
    zoom: 1.85,
  },

  oceania: {
    labelJa: 'オセアニア',
    labelEn: 'Oceania',
    center: [
      145,
      -22,
    ],
    zoom: 2.15,
  },
};


const NORTH_AMERICA_COUNTRIES =
  new Set([
    'bahamas',
    'belize',
    'canada',
    'costa rica',
    'cuba',
    'dominican rep',
    'dominican republic',
    'el salvador',
    'greenland',
    'guatemala',
    'haiti',
    'honduras',
    'jamaica',
    'mexico',
    'nicaragua',
    'panama',
    'puerto rico',
    'the bahamas',
    'trinidad and tobago',
    'united states',
    'united states of america',
  ]);


const SOUTH_AMERICA_COUNTRIES =
  new Set([
    'argentina',
    'bolivia',
    'brazil',
    'chile',
    'colombia',
    'ecuador',
    'falkland is',
    'falkland islands',
    'guyana',
    'paraguay',
    'peru',
    'suriname',
    'uruguay',
    'venezuela',
  ]);


const EUROPE_COUNTRIES =
  new Set([
    'albania',
    'austria',
    'belarus',
    'belgium',
    'bosnia and herz',
    'bosnia and herzegovina',
    'bulgaria',
    'croatia',
    'cyprus',
    'czechia',
    'czech republic',
    'denmark',
    'estonia',
    'finland',
    'france',
    'germany',
    'greece',
    'hungary',
    'iceland',
    'ireland',
    'italy',
    'kosovo',
    'latvia',
    'lithuania',
    'luxembourg',
    'moldova',
    'montenegro',
    'netherlands',
    'north macedonia',
    'norway',
    'poland',
    'portugal',
    'romania',
    'serbia',
    'slovakia',
    'slovenia',
    'spain',
    'sweden',
    'switzerland',
    'ukraine',
    'united kingdom',
  ]);


const AFRICA_COUNTRIES =
  new Set([
    'algeria',
    'angola',
    'benin',
    'botswana',
    'burkina faso',
    'burundi',
    'cameroon',
    'central african rep',
    'central african republic',
    'chad',
    'congo',
    'cote d ivoire',
    'dem rep congo',
    'democratic republic of the congo',
    'djibouti',
    'egypt',
    'equatorial guinea',
    'eritrea',
    'eswatini',
    'ethiopia',
    'gabon',
    'gambia',
    'ghana',
    'guinea',
    'guinea bissau',
    'ivory coast',
    'kenya',
    'lesotho',
    'liberia',
    'libya',
    'madagascar',
    'malawi',
    'mali',
    'mauritania',
    'morocco',
    'mozambique',
    'namibia',
    'niger',
    'nigeria',
    'rwanda',
    'senegal',
    'sierra leone',
    'somalia',
    'somaliland',
    'south africa',
    'south sudan',
    'sudan',
    'swaziland',
    'tanzania',
    'togo',
    'tunisia',
    'uganda',
    'united republic of tanzania',
    'western sahara',
    'zambia',
    'zimbabwe',
  ]);


const OCEANIA_COUNTRIES =
  new Set([
    'australia',
    'fiji',
    'new caledonia',
    'new zealand',
    'papua new guinea',
    'solomon is',
    'solomon islands',
    'vanuatu',
  ]);


function normalizeRegionId(
  value
) {
  const normalized =
    String(
      value ?? ''
    )
      .toLowerCase()
      .replace(
        /[^a-z]/g,
        ''
      );

  if (
    normalized.includes(
      'northamerica'
    )
  ) {
    return 'northAmerica';
  }

  if (
    normalized.includes(
      'southamerica'
    )
  ) {
    return 'southAmerica';
  }

  if (
    normalized.includes(
      'europe'
    )
  ) {
    return 'europe';
  }

  if (
    normalized.includes(
      'africa'
    )
  ) {
    return 'africa';
  }

  if (
    normalized.includes(
      'oceania'
    ) ||
    normalized.includes(
      'australia'
    )
  ) {
    return 'oceania';
  }

  if (
    normalized.includes(
      'asia'
    )
  ) {
    return 'asia';
  }

  return null;
}


function inferRegionForCountry(
  countryName,
  mission
) {
  const explicitRegion =
    normalizeRegionId(
      mission
        ?.challenge
        ?.hintRegion ??
      mission
        ?.challenge
        ?.continent ??
      mission
        ?.challenge
        ?.targetContinent
    );

  if (explicitRegion) {
    return explicitRegion;
  }

  const normalized =
    normalizeCountryName(
      countryName
    );

  if (
    NORTH_AMERICA_COUNTRIES.has(
      normalized
    )
  ) {
    return 'northAmerica';
  }

  if (
    SOUTH_AMERICA_COUNTRIES.has(
      normalized
    )
  ) {
    return 'southAmerica';
  }

  if (
    EUROPE_COUNTRIES.has(
      normalized
    )
  ) {
    return 'europe';
  }

  if (
    AFRICA_COUNTRIES.has(
      normalized
    )
  ) {
    return 'africa';
  }

  if (
    OCEANIA_COUNTRIES.has(
      normalized
    )
  ) {
    return 'oceania';
  }

  /*
   * 上記以外の主要国はAsiaとして扱う。
   * ロシア・トルコ等の大陸横断国は、必要に応じて
   * Mission JSONの hintRegion で上書きできる。
   */
  return 'asia';
}


function countryBelongsToRegion(
  countryName,
  regionId
) {
  const normalized =
    normalizeCountryName(
      countryName
    );

  if (
    regionId ===
    'northAmerica'
  ) {
    return NORTH_AMERICA_COUNTRIES.has(
      normalized
    );
  }

  if (
    regionId ===
    'southAmerica'
  ) {
    return SOUTH_AMERICA_COUNTRIES.has(
      normalized
    );
  }

  if (
    regionId ===
    'europe'
  ) {
    return EUROPE_COUNTRIES.has(
      normalized
    );
  }

  if (
    regionId ===
    'africa'
  ) {
    return AFRICA_COUNTRIES.has(
      normalized
    );
  }

  if (
    regionId ===
    'oceania'
  ) {
    return OCEANIA_COUNTRIES.has(
      normalized
    );
  }

  if (
    regionId ===
    'asia'
  ) {
    return (
      normalized !==
        'antarctica' &&
      !NORTH_AMERICA_COUNTRIES.has(
        normalized
      ) &&
      !SOUTH_AMERICA_COUNTRIES.has(
        normalized
      ) &&
      !EUROPE_COUNTRIES.has(
        normalized
      ) &&
      !AFRICA_COUNTRIES.has(
        normalized
      ) &&
      !OCEANIA_COUNTRIES.has(
        normalized
      )
    );
  }

  return false;
}


/* =========================================================
   MAP CONTROLS
========================================================= */

function MapControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
}) {
  return (
    <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 md:right-4 md:top-4">

      <button
        type="button"
        onClick={
          onZoomIn
        }
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/95 text-slate-800 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white"
        aria-label="地図を拡大"
        title="拡大"
      >
        <Plus
          size={21}
          strokeWidth={2.7}
        />
      </button>

      <button
        type="button"
        onClick={
          onZoomOut
        }
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/95 text-slate-800 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white"
        aria-label="地図を縮小"
        title="縮小"
      >
        <Minus
          size={21}
          strokeWidth={2.7}
        />
      </button>

      <button
        type="button"
        onClick={
          onReset
        }
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/95 text-slate-800 shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white"
        aria-label="地図を元に戻す"
        title="全体表示"
      >
        <RotateCcw
          size={18}
          strokeWidth={2.5}
        />
      </button>

      <div className="rounded-full border border-white/80 bg-slate-950/80 px-2 py-1 text-center text-[10px] font-black text-white shadow-lg backdrop-blur">
        ×{Number(
          zoom
        ).toFixed(
          1
        )}
      </div>

    </div>
  );
}


/* =========================================================
   RESULT
========================================================= */

function ClearResult({
  correct,
  explanation,
  points,
  alreadyCompleted,
  answerLabel,
}) {
  if (
    correct === null
  ) {
    return null;
  }

  if (!correct) {
    return (
      <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-700">

        <p className="font-black">
          もう一度地図をよく見てみよう！
        </p>

        <p className="mt-1 text-sm font-bold opacity-80">
          大陸・海・周辺国との位置関係を手がかりに考えてみましょう。
        </p>

      </div>
    );
  }

  return (
    <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">

      <div className="mb-3 flex items-center gap-3 text-emerald-700">

        <CheckCircle2
          size={26}
        />

        <p className="text-xl font-black">
          Mission Clear!
        </p>

      </div>

      {answerLabel && (
        <div className="mb-4 border-l-4 border-emerald-500 bg-white px-4 py-3">

          <p className="text-[10px] font-black tracking-[0.16em] text-emerald-600">
            CORRECT
          </p>

          <p className="mt-1 text-lg font-black text-slate-900">
            {answerLabel}
          </p>

        </div>
      )}

      <p className="font-bold leading-relaxed text-slate-700">
        {explanation}
      </p>

      <div className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 font-black text-white">
        {alreadyCompleted
          ? 'REVIEW COMPLETE'
          : `+${points} WP`}
      </div>

    </div>
  );
}


/* =========================================================
   COUNTRY MAP TAP
========================================================= */

function CountryMapTap({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const [
    result,
    setResult,
  ] = useState(null);

  const [
    lastCountry,
    setLastCountry,
  ] = useState('');

  const [
    hintActive,
    setHintActive,
  ] = useState(false);

  const [
    mapPosition,
    setMapPosition,
  ] = useState({
    coordinates: [
      0,
      0,
    ],
    zoom: 1,
  });

  const targetName =
    getTargetCountryName(
      mission
    );

  const hintRegionId =
    inferRegionForCountry(
      targetName,
      mission
    );

  const hintRegion =
    REGION_META[
      hintRegionId
    ] ??
    REGION_META.asia;


  const handleCountryClick =
    (geo) => {
      if (
        result === true
      ) {
        return;
      }

      const name =
        geo
          ?.properties
          ?.name ??
        '';

      setLastCountry(
        name
      );

      const correct =
        name === targetName;

      setResult(
        correct
      );

      if (correct) {
        onComplete(
          mission
        );
      }
    };


  const zoomIn =
    () => {
      setMapPosition(
        (current) => ({
          ...current,
          zoom:
            clamp(
              current.zoom *
                1.5,
              1,
              8
            ),
        })
      );
    };


  const zoomOut =
    () => {
      setMapPosition(
        (current) => ({
          ...current,
          zoom:
            clamp(
              current.zoom /
                1.5,
              1,
              8
            ),
        })
      );
    };


  const resetMap =
    () => {
      setMapPosition({
        coordinates: [
          0,
          0,
        ],
        zoom: 1,
      });
    };


  const toggleHint =
    () => {
      const nextActive =
        !hintActive;

      setHintActive(
        nextActive
      );

      if (
        nextActive
      ) {
        const customCenter =
          mission
            ?.challenge
            ?.hintMapCenter;

        const customZoom =
          Number(
            mission
              ?.challenge
              ?.hintZoom
          );

        setMapPosition({
          coordinates:
            Array.isArray(
              customCenter
            ) &&
            customCenter.length ===
              2
              ? customCenter
              : hintRegion.center,

          zoom:
            Number.isFinite(
              customZoom
            )
              ? clamp(
                  customZoom,
                  1,
                  8
                )
              : hintRegion.zoom,
        });
      }
    };


  return (
    <div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#cfe8f3] shadow-sm">

        <div className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">

          <div>

            <p className="text-sm font-black text-slate-600">
              🌍 世界地図をタップ
            </p>

            <p className="mt-1 text-xs font-bold text-slate-400">
              拡大・移動しながら、形と位置から探してみよう。
            </p>

          </div>

          {result !== true && (
            <button
              type="button"
              onClick={
                toggleHint
              }
              className={`inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-xs font-black transition ${
                hintActive
                  ? 'border-amber-300 bg-amber-100 text-amber-800'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              <Lightbulb
                size={16}
                fill={
                  hintActive
                    ? 'currentColor'
                    : 'none'
                }
              />

              {hintActive
                ? 'ヒント表示中'
                : '大陸ヒント'}
            </button>
          )}

        </div>


        {hintActive &&
          result !== true && (
          <div className="flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 sm:px-5">

            <Lightbulb
              size={18}
              className="mt-0.5 shrink-0"
            />

            <div>

              <p className="text-sm font-black">
                ヒント：{hintRegion.labelJa}のどこかにあります。
              </p>

              <p className="mt-1 text-xs font-bold text-amber-700/80">
                色がついた国々を比べて、海や周辺国との位置関係から探してみよう。
              </p>

            </div>

          </div>
        )}


        <div className="relative overflow-hidden bg-[#cfe8f3]">

          <MapControls
            zoom={
              mapPosition.zoom
            }
            onZoomIn={
              zoomIn
            }
            onZoomOut={
              zoomOut
            }
            onReset={
              resetMap
            }
          />

          <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full bg-slate-950/75 px-3 py-1.5 text-[10px] font-black text-white/90 shadow backdrop-blur">
            ドラッグで移動 · ホイール / ピンチで拡大
          </div>

          <ComposableMap
            projection="geoEquirectangular"
            projectionConfig={{
              scale: 190,
              center: [
                0,
                0,
              ],
            }}
            width={1200}
            height={600}
            className="block h-auto w-full bg-[#cfe8f3]"
          >

            <ZoomableGroup
              center={
                mapPosition.coordinates
              }
              zoom={
                mapPosition.zoom
              }
              minZoom={1}
              maxZoom={8}
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
                    (geo) => {
                      const name =
                        geo
                          ?.properties
                          ?.name ??
                        '';

                      const isTarget =
                        result ===
                          true &&
                        name ===
                          targetName;

                      const isWrong =
                        result ===
                          false &&
                        name ===
                          lastCountry;

                      const isHintCountry =
                        hintActive &&
                        result !==
                          true &&
                        countryBelongsToRegion(
                          name,
                          hintRegionId
                        );

                      let fill =
                        '#d6dee8';

                      if (isTarget) {
                        fill =
                          '#10b981';
                      } else if (
                        isWrong
                      ) {
                        fill =
                          '#fb7185';
                      } else if (
                        isHintCountry
                      ) {
                        fill =
                          '#fbbf24';
                      }

                      const hoverFill =
                        isTarget
                          ? '#10b981'
                          : isHintCountry
                            ? '#f59e0b'
                            : '#60a5fa';

                      return (
                        <Geography
                          key={
                            geo.rsmKey
                          }
                          geography={
                            geo
                          }
                          onClick={() =>
                            handleCountryClick(
                              geo
                            )
                          }
                          aria-label={
                            name
                          }
                          tabIndex={0}
                          onKeyDown={(
                            event
                          ) => {
                            if (
                              event.key ===
                                'Enter' ||
                              event.key ===
                                ' '
                            ) {
                              event.preventDefault();
                              handleCountryClick(
                                geo
                              );
                            }
                          }}
                          style={{
                            default: {
                              fill,
                              stroke:
                                '#ffffff',
                              strokeWidth:
                                0.8 /
                                Math.max(
                                  mapPosition.zoom,
                                  1
                                ),
                              outline:
                                'none',
                              cursor:
                                'pointer',
                            },
                            hover: {
                              fill:
                                hoverFill,
                              stroke:
                                '#ffffff',
                              strokeWidth:
                                1.2 /
                                Math.max(
                                  mapPosition.zoom,
                                  1
                                ),
                              outline:
                                'none',
                              cursor:
                                'pointer',
                            },
                            pressed: {
                              fill:
                                '#2563eb',
                              stroke:
                                '#ffffff',
                              strokeWidth:
                                1.2 /
                                Math.max(
                                  mapPosition.zoom,
                                  1
                                ),
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

      </div>


      {result === false && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-700">

          <MapPin
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>

            <p className="font-black">
              そこではありません。
            </p>

            <p className="mt-1 text-sm font-bold opacity-80">
              拡大して海・大陸・周辺国との位置関係を比べてみましょう。必要なら「大陸ヒント」も使えます。
            </p>

          </div>

        </div>
      )}


      <ClearResult
        correct={
          result
        }
        explanation={
          mission.explanation
        }
        points={
          mission.points
        }
        alreadyCompleted={
          alreadyCompleted
        }
        answerLabel={
          targetName
        }
      />

    </div>
  );
}


/* =========================================================
   CITY MAP
========================================================= */

function CityMapGame({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const cities =
    useMemo(
      () =>
        normalizeCities(
          mission
        ),
      [mission]
    );

  const cityNames =
    useMemo(
      () =>
        cities.map(
          (city) =>
            city.name
        ),
      [cities]
    );

  const cityByName =
    useMemo(
      () =>
        new Map(
          cities.map(
            (city) => [
              city.name,
              city,
            ]
          )
        ),
      [cities]
    );

  const [
    selectedCity,
    setSelectedCity,
  ] = useState(
    cityNames[0] ??
      ''
  );

  const [
    placedCities,
    setPlacedCities,
  ] = useState([]);

  const [
    wrongMarker,
    setWrongMarker,
  ] = useState('');

  const [
    complete,
    setComplete,
  ] = useState(false);

  const targetCountryName =
    getTargetCountryName(
      mission
    );

  const mapCenter =
    mission
      ?.challenge
      ?.mapConfig
      ?.center ??
    [
      0,
      20,
    ];

  const mapScale =
    Number(
      mission
        ?.challenge
        ?.mapConfig
        ?.scale ??
        600
    );

  const [
    mapPosition,
    setMapPosition,
  ] = useState({
    coordinates:
      mapCenter,
    zoom: 1,
  });

  const placedSet =
    new Set(
      placedCities
    );


  const handleMarkerClick =
    (
      cityName
    ) => {
      if (
        complete ||
        !selectedCity ||
        placedSet.has(
          cityName
        )
      ) {
        return;
      }

      if (
        cityName !==
        selectedCity
      ) {
        setWrongMarker(
          cityName
        );
        return;
      }

      const nextPlaced = [
        ...placedCities,
        cityName,
      ];

      setPlacedCities(
        nextPlaced
      );
      setWrongMarker(
        ''
      );

      const nextCity =
        cityNames.find(
          (name) =>
            !nextPlaced.includes(
              name
            )
        ) ??
        '';

      setSelectedCity(
        nextCity
      );

      if (
        nextPlaced.length ===
        cityNames.length
      ) {
        setComplete(
          true
        );
        onComplete(
          mission
        );
      }
    };


  const resetGame =
    () => {
      setPlacedCities(
        []
      );
      setWrongMarker(
        ''
      );
      setComplete(
        false
      );
      setSelectedCity(
        cityNames[0] ??
          ''
      );
      setMapPosition({
        coordinates:
          mapCenter,
        zoom: 1,
      });
    };


  const zoomIn =
    () => {
      setMapPosition(
        (current) => ({
          ...current,
          zoom:
            clamp(
              current.zoom *
                1.5,
              1,
              8
            ),
        })
      );
    };


  const zoomOut =
    () => {
      setMapPosition(
        (current) => ({
          ...current,
          zoom:
            clamp(
              current.zoom /
                1.5,
              1,
              8
            ),
        })
      );
    };


  const resetMap =
    () => {
      setMapPosition({
        coordinates:
          mapCenter,
        zoom: 1,
      });
    };


  if (
    cities.length === 0
  ) {
    return (
      <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6 text-orange-700">

        <p className="font-black">
          City Mapデータがありません。
        </p>

        <p className="mt-2 text-sm font-bold">
          mission.challenge.cities に都市座標が必要です。
        </p>

      </div>
    );
  }


  return (
    <div>

      <div className="mb-5 rounded-3xl border border-blue-100 bg-blue-50 p-5">

        <p className="text-xs font-black tracking-[0.15em] text-blue-400">
          CURRENT CITY
        </p>

        {selectedCity ? (
          <>
            <p className="mt-2 text-2xl font-black text-slate-800">
              {
                cityByName.get(
                  selectedCity
                )?.labelJa
              }
              <span className="ml-2 text-lg text-slate-400">
                {
                  selectedCity
                }
              </span>
            </p>

            <p className="mt-2 text-sm font-bold text-slate-500">
              この都市があると思う●を地図上でタップしてください。拡大して確認できます。
            </p>
          </>
        ) : (
          <p className="mt-2 text-xl font-black text-emerald-700">
            すべての都市を配置できました！
          </p>
        )}

      </div>


      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-[#cfeeff] shadow-sm">

        <MapControls
          zoom={
            mapPosition.zoom
          }
          onZoomIn={
            zoomIn
          }
          onZoomOut={
            zoomOut
          }
          onReset={
            resetMap
          }
        />

        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center:
              mapCenter,
            scale:
              mapScale,
          }}
          width={1000}
          height={620}
          className="h-auto w-full"
        >

          <ZoomableGroup
            center={
              mapPosition.coordinates
            }
            zoom={
              mapPosition.zoom
            }
            minZoom={1}
            maxZoom={8}
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
                  (geo) => {
                    const name =
                      geo
                        ?.properties
                        ?.name ??
                      '';

                    const isTargetCountry =
                      name ===
                      targetCountryName;

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
                              isTargetCountry
                                ? '#e2e8f0'
                                : '#f8fafc',
                            stroke:
                              isTargetCountry
                                ? '#64748b'
                                : '#e2e8f0',
                            strokeWidth:
                              (
                                isTargetCountry
                                  ? 1
                                  : 0.25
                              ) /
                              Math.max(
                                mapPosition.zoom,
                                1
                              ),
                            outline:
                              'none',
                          },
                          hover: {
                            fill:
                              isTargetCountry
                                ? '#dbeafe'
                                : '#f8fafc',
                            stroke:
                              isTargetCountry
                                ? '#2563eb'
                                : '#e2e8f0',
                            strokeWidth:
                              (
                                isTargetCountry
                                  ? 1.2
                                  : 0.25
                              ) /
                              Math.max(
                                mapPosition.zoom,
                                1
                              ),
                            outline:
                              'none',
                          },
                          pressed: {
                            fill:
                              isTargetCountry
                                ? '#dbeafe'
                                : '#f8fafc',
                            stroke:
                              isTargetCountry
                                ? '#2563eb'
                                : '#e2e8f0',
                            strokeWidth:
                              (
                                isTargetCountry
                                  ? 1.2
                                  : 0.25
                              ) /
                              Math.max(
                                mapPosition.zoom,
                                1
                              ),
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


            {cityNames.map(
              (
                cityName
              ) => {
                const city =
                  cityByName.get(
                    cityName
                  );

                if (!city) {
                  return null;
                }

                const placed =
                  placedSet.has(
                    cityName
                  );

                const wrong =
                  wrongMarker ===
                  cityName;

                return (
                  <Marker
                    key={
                      cityName
                    }
                    coordinates={
                      city.coordinates
                    }
                  >

                    <g
                      onClick={() =>
                        handleMarkerClick(
                          cityName
                        )
                      }
                      onKeyDown={(
                        event
                      ) => {
                        if (
                          event.key ===
                            'Enter' ||
                          event.key ===
                            ' '
                        ) {
                          event.preventDefault();
                          handleMarkerClick(
                            cityName
                          );
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={
                        placed
                          ? `${cityName} placed`
                          : `${cityName} marker`
                      }
                      style={{
                        cursor:
                          placed
                            ? 'default'
                            : 'pointer',
                        outline:
                          'none',
                      }}
                    >

                      <circle
                        r={
                          placed
                            ? 11 /
                              mapPosition.zoom
                            : 10 /
                              mapPosition.zoom
                        }
                        fill={
                          placed
                            ? '#10b981'
                            : wrong
                              ? '#fb7185'
                              : '#2563eb'
                        }
                        stroke="#ffffff"
                        strokeWidth={
                          3 /
                          mapPosition.zoom
                        }
                      />

                      {placed && (
                        <text
                          textAnchor="middle"
                          y={
                            -18 /
                            mapPosition.zoom
                          }
                          style={{
                            fontFamily:
                              'system-ui, sans-serif',
                            fontSize:
                              14 /
                              mapPosition.zoom,
                            fontWeight:
                              900,
                            fill:
                              '#0f172a',
                            paintOrder:
                              'stroke',
                            stroke:
                              '#ffffff',
                            strokeWidth:
                              4 /
                              mapPosition.zoom,
                          }}
                        >
                          {
                            cityName
                          }
                        </text>
                      )}

                    </g>

                  </Marker>
                );
              }
            )}

          </ZoomableGroup>

        </ComposableMap>

      </div>


      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">

        {cityNames.map(
          (
            cityName
          ) => {
            const city =
              cityByName.get(
                cityName
              );

            const placed =
              placedSet.has(
                cityName
              );

            return (
              <div
                key={
                  cityName
                }
                className={`rounded-2xl border p-3 text-center ${
                  placed
                    ? 'border-emerald-200 bg-emerald-50'
                    : selectedCity ===
                        cityName
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <p className="font-black text-slate-700">
                  {
                    city
                      ?.labelJa
                  }
                </p>
                <p className="text-xs font-bold text-slate-400">
                  {
                    cityName
                  }
                </p>
                <p className="mt-1 text-xs font-black">
                  {placed
                    ? '✓ PLACED'
                    : selectedCity ===
                        cityName
                      ? 'NOW'
                      : 'NEXT'}
                </p>
              </div>
            );
          }
        )}

      </div>


      {wrongMarker &&
        !complete && (
          <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-700">
            <p className="font-black">
              その場所ではありません。
            </p>
            <p className="mt-1 text-sm font-bold opacity-80">
              都市どうしの東西南北の位置関係を考えてみましょう。
            </p>
          </div>
        )}


      {!complete &&
        placedCities.length >
          0 && (
          <button
            type="button"
            onClick={
              resetGame
            }
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition-colors hover:bg-slate-200"
          >
            <RotateCcw
              size={17}
            />
            最初からやり直す
          </button>
        )}


      <ClearResult
        correct={
          complete
            ? true
            : null
        }
        explanation={
          mission.explanation
        }
        points={
          mission.points
        }
        alreadyCompleted={
          alreadyCompleted
        }
        answerLabel={
          cityNames.join(
            ' / '
          )
        }
      />

    </div>
  );
}


/* =========================================================
   ROUTER
========================================================= */

export default function PlaceMissionGame({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  if (
    mission.type ===
    'map-tap'
  ) {
    return (
      <CountryMapTap
        mission={
          mission
        }
        onComplete={
          onComplete
        }
        alreadyCompleted={
          alreadyCompleted
        }
      />
    );
  }

  if (
    mission.type ===
    'city-map'
  ) {
    return (
      <CityMapGame
        mission={
          mission
        }
        onComplete={
          onComplete
        }
        alreadyCompleted={
          alreadyCompleted
        }
      />
    );
  }

  return null;
}
