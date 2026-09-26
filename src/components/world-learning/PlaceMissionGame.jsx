import {
  CheckCircle2,
  MapPin,
  RotateCcw,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';

import worldAtlas
  from 'world-atlas/countries-110m.json';


const TARGET_COUNTRY_NAMES = {
  au: 'Australia',
};

const AUSTRALIA_CITIES = {
  Sydney: {
    coordinates: [151.2093, -33.8688],
    labelJa: 'シドニー',
  },
  Perth: {
    coordinates: [115.8605, -31.9505],
    labelJa: 'パース',
  },
  Darwin: {
    coordinates: [130.8456, -12.4634],
    labelJa: 'ダーウィン',
  },
  Melbourne: {
    coordinates: [144.9631, -37.8136],
    labelJa: 'メルボルン',
  },
};

function ClearResult({
  correct,
  explanation,
  points,
  alreadyCompleted,
  answerLabel,
}) {
  if (correct === null) {
    return null;
  }

  if (!correct) {
    return (
      <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-700">
        <p className="font-black">
          もう一度地図をよく見てみよう！
        </p>
        <p className="mt-1 text-sm font-bold opacity-80">
          位置関係を手がかりに、別の場所を試してみましょう。
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="mb-3 flex items-center gap-3 text-emerald-700">
        <CheckCircle2 size={26} />
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

function CountryMapTap({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const [result, setResult] = useState(null);
  const [lastCountry, setLastCountry] = useState('');

  const targetName =
    TARGET_COUNTRY_NAMES[
      mission?.challenge?.targetIso
    ] || 'Australia';

  const handleCountryClick = (geo) => {
    if (result === true) {
      return;
    }

    const name =
      geo?.properties?.name || '';

    setLastCountry(name);

    const correct =
      name === targetName;

    setResult(correct);

    if (correct) {
      onComplete(mission);
    }
  };

  return (
    <div>
      <div className="overflow-hidden border border-slate-200 bg-[#dceaf0] shadow-sm md:rounded-2xl">
        <div className="border-b border-slate-200 bg-white px-5 py-4">
          <p className="text-sm font-black text-slate-500">
            🌍 世界地図をタップ
          </p>
          <p className="mt-1 text-xs font-bold text-slate-400">
            国名ラベルはありません。形と位置から探してみよう。
          </p>
        </div>

        <ComposableMap
  projection="geoEqualEarth"
  projectionConfig={{
    scale: 170,
    center: [8, 4],
  }}
  width={1100}
  height={540}
  className="h-auto w-full"
>
  <Geographies
    geography={worldAtlas}
  >
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name =
                    geo?.properties?.name || '';

                  const isTarget =
                    result === true &&
                    name === targetName;

                  const isWrong =
                    result === false &&
                    name === lastCountry;

                  let fill =
                    '#cbd5e1';

                  if (isTarget) {
                    fill = '#10b981';
                  } else if (isWrong) {
                    fill = '#fb7185';
                  }

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() =>
                        handleCountryClick(geo)
                      }
                      aria-label={name}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (
                          event.key === 'Enter' ||
                          event.key === ' '
                        ) {
                          event.preventDefault();
                          handleCountryClick(geo);
                        }
                      }}
                      style={{
                        default: {
                          fill,
                          stroke: '#ffffff',
                          strokeWidth: 0.55,
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        hover: {
                          fill: isTarget
                            ? '#10b981'
                            : '#60a5fa',
                          stroke: '#ffffff',
                          strokeWidth: 0.8,
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        pressed: {
                          fill: '#2563eb',
                          stroke: '#ffffff',
                          strokeWidth: 0.8,
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
              オーストラリアは南半球にあり、アジアの南東側に位置します。
            </p>
          </div>
        </div>
      )}

      <ClearResult
  correct={result}
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

function CityMapGame({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const cityNames = useMemo(
    () =>
      (mission?.challenge?.cities || [])
        .map((city) => city.name)
        .filter(
          (name) =>
            AUSTRALIA_CITIES[name]
        ),
    [mission]
  );

  const [selectedCity, setSelectedCity] = useState(
    cityNames[0] || ''
  );
  const [placedCities, setPlacedCities] = useState([]);
  const [wrongMarker, setWrongMarker] = useState('');
  const [complete, setComplete] = useState(false);

  const placedSet = new Set(placedCities);

  const handleMarkerClick = (cityName) => {
    if (
      complete ||
      !selectedCity ||
      placedSet.has(cityName)
    ) {
      return;
    }

    if (cityName !== selectedCity) {
      setWrongMarker(cityName);
      return;
    }

    const nextPlaced = [
      ...placedCities,
      cityName,
    ];

    setPlacedCities(nextPlaced);
    setWrongMarker('');

    const nextCity =
      cityNames.find(
        (name) =>
          !nextPlaced.includes(name)
      ) || '';

    setSelectedCity(nextCity);

    if (
      nextPlaced.length ===
      cityNames.length
    ) {
      setComplete(true);
      onComplete(mission);
    }
  };

  const resetGame = () => {
    setPlacedCities([]);
    setWrongMarker('');
    setComplete(false);
    setSelectedCity(
      cityNames[0] || ''
    );
  };

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
                AUSTRALIA_CITIES[
                  selectedCity
                ]?.labelJa
              }
              <span className="ml-2 text-lg text-slate-400">
                {selectedCity}
              </span>
            </p>

            <p className="mt-2 text-sm font-bold text-slate-500">
              この都市があると思う●を地図上でタップしてください。
            </p>
          </>
        ) : (
          <p className="mt-2 text-xl font-black text-emerald-700">
            4都市すべて配置できました！
          </p>
        )}
      </div>

      <div className="overflow-hidden border border-slate-200 bg-[#dceaf0] shadow-sm md:rounded-2xl">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [134, -25],
            scale: 720,
          }}
          width={1000}
height={620}
          className="h-auto w-full"
        >
          <Geographies
  geography={worldAtlas}
>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name =
                  geo?.properties?.name || '';

                const australia =
                  name === 'Australia';

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: australia
                          ? '#e2e8f0'
                          : '#f8fafc',
                        stroke: australia
                          ? '#94a3b8'
                          : '#e2e8f0',
                        strokeWidth: australia
                          ? 1
                          : 0.25,
                        outline: 'none',
                      },
                      hover: {
                        fill: australia
                          ? '#e2e8f0'
                          : '#f8fafc',
                        stroke: australia
                          ? '#94a3b8'
                          : '#e2e8f0',
                        strokeWidth: australia
                          ? 1
                          : 0.25,
                        outline: 'none',
                      },
                      pressed: {
                        fill: australia
                          ? '#e2e8f0'
                          : '#f8fafc',
                        stroke: australia
                          ? '#94a3b8'
                          : '#e2e8f0',
                        strokeWidth: australia
                          ? 1
                          : 0.25,
                        outline: 'none',
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {cityNames.map((cityName) => {
            const city =
              AUSTRALIA_CITIES[
                cityName
              ];

            const placed =
              placedSet.has(
                cityName
              );

            const wrong =
              wrongMarker ===
              cityName;

            return (
              <Marker
                key={cityName}
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
                  onKeyDown={(event) => {
                    if (
                      event.key === 'Enter' ||
                      event.key === ' '
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
                      : 'city marker'
                  }
                  style={{
                    cursor: placed
                      ? 'default'
                      : 'pointer',
                    outline: 'none',
                  }}
                >
                  <circle
                    r={placed ? 11 : 10}
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
                        fontSize: 14,
                        fontWeight: 900,
                        fill: '#0f172a',
                        paintOrder: 'stroke',
                        stroke: '#ffffff',
                        strokeWidth: 4,
                      }}
                    >
                      {cityName}
                    </text>
                  )}
                </g>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {cityNames.map(
          (cityName) => {
            const placed =
              placedSet.has(
                cityName
              );

            return (
              <div
                key={cityName}
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
                    AUSTRALIA_CITIES[
                      cityName
                    ]?.labelJa
                  }
                </p>
                <p className="text-xs font-bold text-slate-400">
                  {cityName}
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

      {wrongMarker && !complete && (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-700">
          <p className="font-black">
            その場所ではありません。
          </p>
          <p className="mt-1 text-sm font-bold opacity-80">
            オーストラリアの東・西・北・南東という位置関係を考えてみましょう。
          </p>
        </div>
      )}

      {!complete &&
        placedCities.length > 0 && (
          <button
            onClick={resetGame}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-600 transition-colors hover:bg-slate-200"
          >
            <RotateCcw size={17} />
            最初からやり直す
          </button>
        )}

      <ClearResult
  correct={
    complete ? true : null
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
    cityNames.join(' / ')
  }
/>
    </div>
  );
}

export default function PlaceMissionGame({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  if (
    mission.type === 'map-tap'
  ) {
    return (
      <CountryMapTap
        mission={mission}
        onComplete={onComplete}
        alreadyCompleted={
          alreadyCompleted
        }
      />
    );
  }

  if (
    mission.type === 'city-map'
  ) {
    return (
      <CityMapGame
        mission={mission}
        onComplete={onComplete}
        alreadyCompleted={
          alreadyCompleted
        }
      />
    );
  }

  return null;
}
