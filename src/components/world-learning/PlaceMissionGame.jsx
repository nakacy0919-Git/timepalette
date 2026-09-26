import {
  CheckCircle2,
  MapPin,
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

  const targetName =
    getTargetCountryName(
      mission
    );


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


  return (
    <div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#cfe8f3] shadow-sm">

        <div className="border-b border-slate-200 bg-white px-5 py-4">

          <p className="text-sm font-black text-slate-500">
            🌍 世界地図をタップ
          </p>

          <p className="mt-1 text-xs font-bold text-slate-400">
            国名ラベルはありません。形と位置から探してみよう。
          </p>

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
  <Geographies geography={worldAtlas}>
    {({ geographies }) =>
      geographies.map((geo) => {
        const name = geo?.properties?.name ?? '';
        const isTarget = result === true && name === targetName;
        const isWrong = result === false && name === lastCountry;

        let fill = '#d6dee8';

        if (isTarget) {
          fill = '#10b981';
        } else if (isWrong) {
          fill = '#fb7185';
        }

        return (
          <Geography
            key={geo.rsmKey}
            geography={geo}
            onClick={() => handleCountryClick(geo)}
            aria-label={name}
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleCountryClick(geo);
              }
            }}
            style={{
              default: {
                fill,
                stroke: '#ffffff',
                strokeWidth: 0.8,
                outline: 'none',
                cursor: 'pointer',
              },
              hover: {
                fill: isTarget ? '#10b981' : '#60a5fa',
                stroke: '#ffffff',
                strokeWidth: 1.2,
                outline: 'none',
                cursor: 'pointer',
              },
              pressed: {
                fill: '#2563eb',
                stroke: '#ffffff',
                strokeWidth: 1.2,
                outline: 'none',
              },
            }}
          />
        );
      })
    }
  </Geographies>
</ComposableMap>

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
              大陸・海・周辺国との位置関係を手がかりに、もう一度探してみましょう。
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


  const placedSet =
    new Set(
      placedCities
    );


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

      {/* CURRENT CITY */}

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
              この都市があると思う●を地図上でタップしてください。
            </p>

          </>
        ) : (

          <p className="mt-2 text-xl font-black text-emerald-700">
            すべての都市を配置できました！
          </p>

        )}

      </div>


      {/* MAP */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-[#cfeeff] shadow-sm">

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
                            isTargetCountry
                              ? 1
                              : 0.25,

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
                            isTargetCountry
                              ? 1.2
                              : 0.25,

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
                            isTargetCountry
                              ? 1.2
                              : 0.25,

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
                          ? 11
                          : 10
                      }
                      fill={
                        placed
                          ? '#10b981'
                          : wrong
                            ? '#fb7185'
                            : '#2563eb'
                      }
                      stroke="#ffffff"
                      strokeWidth={3}
                    />


                    {placed && (
                      <text
                        textAnchor="middle"
                        y={-18}
                        style={{
                          fontFamily:
                            'system-ui, sans-serif',

                          fontSize:
                            14,

                          fontWeight:
                            900,

                          fill:
                            '#0f172a',

                          paintOrder:
                            'stroke',

                          stroke:
                            '#ffffff',

                          strokeWidth:
                            4,
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

        </ComposableMap>

      </div>


      {/* CITY STATUS */}

      <div
        className="
          mt-4
          grid
          grid-cols-2
          gap-2
          md:grid-cols-4
        "
      >

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
                className={`
                  rounded-2xl
                  border
                  p-3
                  text-center
                  ${
                    placed
                      ? 'border-emerald-200 bg-emerald-50'
                      : selectedCity ===
                          cityName
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-slate-200 bg-white'
                  }
                `}
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