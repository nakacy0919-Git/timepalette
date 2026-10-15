import {
  CheckCircle2,
  Globe2,
  MapPinned,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

import {
  useMemo,
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


let sharedAudioContext = null;


function getAudioContext() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!sharedAudioContext) {
      sharedAudioContext =
        new AudioContextClass();
    }

    if (
      sharedAudioContext.state ===
      'suspended'
    ) {
      sharedAudioContext.resume();
    }

    return sharedAudioContext;
  }
  catch {
    return null;
  }
}


function tone({
  frequency,
  duration = 0.08,
  volume = 0.05,
  delay = 0,
  type = 'triangle',
}) {
  const context =
    getAudioContext();

  if (!context) {
    return;
  }

  const oscillator =
    context.createOscillator();

  const gain =
    context.createGain();

  const start =
    context.currentTime +
    delay;

  oscillator.type =
    type;

  oscillator.frequency.setValueAtTime(
    frequency,
    start
  );

  gain.gain.setValueAtTime(
    0.0001,
    start
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    start + 0.01
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    start + duration
  );

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(start);
  oscillator.stop(
    start + duration + 0.03
  );
}


function playCorrect() {
  tone({
    frequency: 760,
    duration: 0.10,
    volume: 0.065,
  });

  tone({
    frequency: 980,
    duration: 0.17,
    volume: 0.07,
    delay: 0.08,
  });
}


function playWrong() {
  tone({
    frequency: 175,
    duration: 0.20,
    volume: 0.06,
    type: 'sawtooth',
  });

  tone({
    frequency: 125,
    duration: 0.18,
    volume: 0.05,
    delay: 0.12,
    type: 'sawtooth',
  });
}


function playFinal() {
  [
    [523, 0.00, 0.15],
    [659, 0.11, 0.15],
    [784, 0.22, 0.17],
    [1047, 0.34, 0.38],
    [1319, 0.51, 0.48],
  ].forEach(
    (
      [
        frequency,
        delay,
        duration,
      ]
    ) => {
      tone({
        frequency,
        delay,
        duration,
        volume: 0.09,
      });
    }
  );
}


const COUNTRIES = [
  {
    id: 'bi',
    geoId: '108',
    name: 'ブルンジ',
    en: 'Burundi',
    zone: 'Africa/Bujumbura',
    kind: 'always',
  },

  {
    id: 'bw',
    geoId: '072',
    name: 'ボツワナ',
    en: 'Botswana',
    zone: 'Africa/Gaborone',
    kind: 'always',
  },

  {
    id: 'za',
    geoId: '710',
    name: '南アフリカ',
    en: 'South Africa',
    zone: 'Africa/Johannesburg',
    kind: 'always',
  },

  {
    id: 'zm',
    geoId: '894',
    name: 'ザンビア',
    en: 'Zambia',
    zone: 'Africa/Lusaka',
    kind: 'always',
  },

  {
    id: 'fr',
    geoId: '250',
    name: 'フランス本土',
    en: 'France',
    zone: 'Europe/Paris',
    kind: 'seasonal',
  },

  {
    id: 'de',
    geoId: '276',
    name: 'ドイツ',
    en: 'Germany',
    zone: 'Europe/Berlin',
    kind: 'seasonal',
  },

  {
    id: 'gr',
    geoId: '300',
    name: 'ギリシャ',
    en: 'Greece',
    zone: 'Europe/Athens',
    kind: 'seasonal',
  },

  {
    id: 'ke',
    geoId: '404',
    name: 'ケニア',
    en: 'Kenya',
    zone: 'Africa/Nairobi',
    kind: 'different',
  },
];


function getOffsetMinutes(
  date,
  timeZone
) {
  const formatter =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }
    );

  const parts =
    Object.fromEntries(
      formatter
        .formatToParts(
          date
        )
        .filter(
          (
            part
          ) =>
            part.type !==
            'literal'
        )
        .map(
          (
            part
          ) => [
            part.type,
            part.value,
          ]
        )
    );

  const representedAsUtc =
    Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );

  return Math.round(
    (
      representedAsUtc -
      date.getTime()
    ) /
    60000
  );
}


function formatZonedTime(
  date,
  timeZone
) {
  return new Intl.DateTimeFormat(
    'ja-JP',
    {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
  ).format(
    date
  );
}


function formatDifference(
  minutes
) {
  if (
    minutes ===
    0
  ) {
    return '同じ時刻';
  }

  const sign =
    minutes >
      0
      ? '＋'
      : '−';

  const absolute =
    Math.abs(
      minutes
    );

  const hour =
    Math.floor(
      absolute /
      60
    );

  const minute =
    absolute %
    60;

  if (
    minute ===
    0
  ) {
    return `${sign}${hour}時間`;
  }

  return `${sign}${hour}時間${minute}分`;
}


function FlagIcon({
  code,
}) {
  const common = {
    width: 50,
    height: 34,
    viewBox: '0 0 50 34',
    className:
      'rounded-md shadow-sm ring-1 ring-black/10',
  };


  if (
    code === 'fr'
  ) {
    return (
      <svg {...common}>
        <rect
          width="16.67"
          height="34"
          fill="#0055A4"
        />

        <rect
          x="16.66"
          width="16.67"
          height="34"
          fill="#fff"
        />

        <rect
          x="33.33"
          width="16.67"
          height="34"
          fill="#EF4135"
        />
      </svg>
    );
  }


  if (
    code === 'de'
  ) {
    return (
      <svg {...common}>
        <rect
          width="50"
          height="11.34"
          fill="#000"
        />

        <rect
          y="11.33"
          width="50"
          height="11.34"
          fill="#DD0000"
        />

        <rect
          y="22.66"
          width="50"
          height="11.34"
          fill="#FFCE00"
        />
      </svg>
    );
  }


  if (
    code === 'bw'
  ) {
    return (
      <svg {...common}>
        <rect
          width="50"
          height="34"
          fill="#75AADB"
        />

        <rect
          y="13"
          width="50"
          height="8"
          fill="#fff"
        />

        <rect
          y="15"
          width="50"
          height="4"
          fill="#000"
        />
      </svg>
    );
  }


  if (
    code === 'zm'
  ) {
    return (
      <svg {...common}>
        <rect
          width="50"
          height="34"
          fill="#198A00"
        />

        <rect
          x="32"
          y="21"
          width="6"
          height="13"
          fill="#EF3340"
        />

        <rect
          x="38"
          y="21"
          width="6"
          height="13"
          fill="#000"
        />

        <rect
          x="44"
          y="21"
          width="6"
          height="13"
          fill="#FF8200"
        />

        <path
          d="M35 6 L42 10 L38 10 L35 14 L34 10 L29 10 Z"
          fill="#FF8200"
        />
      </svg>
    );
  }


  if (
    code === 'gr'
  ) {
    return (
      <svg {...common}>
        <rect
          width="50"
          height="34"
          fill="#0D5EAF"
        />

        {
          [
            3.8,
            11.4,
            19,
            26.6,
          ].map(
            (
              y
            ) => (
              <rect
                key={y}
                y={y}
                width="50"
                height="3.8"
                fill="#fff"
              />
            )
          )
        }

        <rect
          width="19"
          height="19"
          fill="#0D5EAF"
        />

        <rect
          x="8"
          width="3"
          height="19"
          fill="#fff"
        />

        <rect
          y="8"
          width="19"
          height="3"
          fill="#fff"
        />
      </svg>
    );
  }


  if (
    code === 'ke'
  ) {
    return (
      <svg {...common}>
        <rect
          width="50"
          height="11"
          fill="#000"
        />

        <rect
          y="11"
          width="50"
          height="2"
          fill="#fff"
        />

        <rect
          y="13"
          width="50"
          height="8"
          fill="#BB0000"
        />

        <rect
          y="21"
          width="50"
          height="2"
          fill="#fff"
        />

        <rect
          y="23"
          width="50"
          height="11"
          fill="#006600"
        />

        <ellipse
          cx="25"
          cy="17"
          rx="4.5"
          ry="11"
          fill="#BB0000"
          stroke="#fff"
          strokeWidth="1"
        />

        <line
          x1="19"
          y1="5"
          x2="31"
          y2="29"
          stroke="#fff"
          strokeWidth="1"
        />

        <line
          x1="31"
          y1="5"
          x2="19"
          y2="29"
          stroke="#fff"
          strokeWidth="1"
        />
      </svg>
    );
  }


  if (
    code === 'bi'
  ) {
    return (
      <svg {...common}>
        <rect
          width="50"
          height="34"
          fill="#CE1126"
        />

        <polygon
          points="0,0 25,17 0,34"
          fill="#1EB53A"
        />

        <polygon
          points="50,0 25,17 50,34"
          fill="#1EB53A"
        />

        <line
          x1="0"
          y1="0"
          x2="50"
          y2="34"
          stroke="#fff"
          strokeWidth="5"
        />

        <line
          x1="50"
          y1="0"
          x2="0"
          y2="34"
          stroke="#fff"
          strokeWidth="5"
        />

        <circle
          cx="25"
          cy="17"
          r="7.5"
          fill="#fff"
        />

        <circle
          cx="25"
          cy="13"
          r="1.3"
          fill="#CE1126"
        />

        <circle
          cx="21.5"
          cy="19"
          r="1.3"
          fill="#CE1126"
        />

        <circle
          cx="28.5"
          cy="19"
          r="1.3"
          fill="#CE1126"
        />
      </svg>
    );
  }


  if (
    code === 'za'
  ) {
    return (
      <svg {...common}>
        <rect
          width="50"
          height="17"
          fill="#DE3831"
        />

        <rect
          y="17"
          width="50"
          height="17"
          fill="#002395"
        />

        <polygon
          points="0,3 28,17 0,31"
          fill="#007A4D"
        />

        <polygon
          points="0,7 20,17 0,27"
          fill="#FFB612"
        />

        <polygon
          points="0,10 14,17 0,24"
          fill="#000"
        />

        <polyline
          points="0,4 25,17 0,30"
          fill="none"
          stroke="#fff"
          strokeWidth="4"
        />
      </svg>
    );
  }


  return (
    <div
      className="
        flex
        h-[34px]
        w-[50px]
        items-center
        justify-center
        rounded-md
        bg-slate-200
        text-xs
        font-black
        text-slate-600
      "
    >
      {code.toUpperCase()}
    </div>
  );
}


function Confetti() {
  return (
    <>
      <style>
        {`
          @keyframes same-time-confetti {
            0% {
              transform:
                translateY(-12vh)
                rotate(0deg);
              opacity: 1;
            }

            100% {
              transform:
                translate3d(
                  var(--drift),
                  110vh,
                  0
                )
                rotate(900deg);
              opacity: 0;
            }
          }

          @keyframes same-time-wrong {
            0%,100% {
              transform: translateX(0);
            }

            25% {
              transform: translateX(-7px);
            }

            75% {
              transform: translateX(7px);
            }
          }
        `}
      </style>

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-[22000]
          overflow-hidden
        "
      >
        {
          Array.from(
            {
              length: 80,
            },
            (
              _,
              index
            ) => (
              <span
                key={index}
                className="
                  absolute
                  -top-6
                  h-3
                  w-2
                  rounded-sm
                "
                style={{
                  left:
                    `${
                      (
                        index *
                        37
                      ) %
                      100
                    }%`,

                  background:
                    [
                      '#f97316',
                      '#facc15',
                      '#22c55e',
                      '#3b82f6',
                      '#ec4899',
                      '#8b5cf6',
                    ][
                      index %
                      6
                    ],

                  '--drift':
                    `${
                      (
                        index %
                          2
                          ? 1
                          : -1
                      ) *
                      (
                        30 +
                        (
                          index %
                          8
                        ) *
                        8
                      )
                    }px`,

                  animation:
                    `same-time-confetti ${
                      1.7 +
                      (
                        index %
                        8
                      ) *
                      0.12
                    }s linear ${
                      (
                        index %
                        12
                      ) *
                      0.04
                    }s forwards`,
                }}
              />
            )
          )
        }
      </div>
    </>
  );
}


export default function TimeZoneExpressMission({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const now =
    useMemo(
      () =>
        new Date(),
      []
    );

  const kigaliOffset =
    useMemo(
      () =>
        getOffsetMinutes(
          now,
          'Africa/Kigali'
        ),
      [
        now,
      ]
    );

  const candidates =
    useMemo(
      () =>
        COUNTRIES.map(
          (
            country
          ) => {
            const offset =
              getOffsetMinutes(
                now,
                country.zone
              );

            return {
              ...country,

              offset,

              same:
                offset ===
                kigaliOffset,

              currentTime:
                formatZonedTime(
                  now,
                  country.zone
                ),
            };
          }
        ),
      [
        now,
        kigaliOffset,
      ]
    );

  const correctIds =
    useMemo(
      () =>
        candidates
          .filter(
            (
              country
            ) =>
              country.same
          )
          .map(
            (
              country
            ) =>
              country.id
          ),
      [
        candidates,
      ]
    );

  const [
    selected,
    setSelected,
  ] =
    useState(
      []
    );

  const [
    wrongId,
    setWrongId,
  ] =
    useState(
      null
    );

  const [
    feedback,
    setFeedback,
  ] =
    useState(
      null
    );

  const [
    cleared,
    setCleared,
  ] =
    useState(
      false
    );

  const [
    mapPosition,
    setMapPosition,
  ] =
    useState({
      coordinates: [
        12,
        8,
      ],

      zoom:
        1,
    });


  const kigaliTime =
    formatZonedTime(
      now,
      'Africa/Kigali'
    );


  const chooseCountry =
    (
      country
    ) => {
      if (
        cleared ||
        selected.includes(
          country.id
        )
      ) {
        return;
      }

      if (
        country.same
      ) {
        playCorrect();

        const next = [
          ...selected,
          country.id,
        ];

        setSelected(
          next
        );

        setWrongId(
          null
        );

        setFeedback({
          type:
            'correct',

          text:
            `ピンポン♪ ${country.name}も今 ${country.currentTime}。キガリと同じ時刻！`,
        });

        if (
          next.length ===
          correctIds.length
        ) {
          window.setTimeout(
            () => {
              playFinal();

              setCleared(
                true
              );

              onComplete?.(
                mission
              );
            },
            280
          );
        }

        return;
      }

      playWrong();

      setWrongId(
        country.id
      );

      const difference =
        country.offset -
        kigaliOffset;

      setFeedback({
        type:
          'wrong',

        text:
          `ブブー！ ${country.name}は今 ${country.currentTime}。キガリとは ${formatDifference(difference)} ちがうよ。`,
      });

      window.setTimeout(
        () => {
          setWrongId(
            (
              current
            ) =>
              current ===
              country.id
                ? null
                : current
          );
        },
        700
      );
    };


  const zoomIn =
    () => {
      setMapPosition(
        (
          current
        ) => ({
          ...current,

          zoom:
            Math.min(
              6,
              current.zoom *
              1.45
            ),
        })
      );
    };


  const zoomOut =
    () => {
      setMapPosition(
        (
          current
        ) => ({
          ...current,

          zoom:
            Math.max(
              1,
              current.zoom /
              1.45
            ),
        })
      );
    };


  const focusAfricaEurope =
    () => {
      setMapPosition({
        coordinates: [
          18,
          15,
        ],

        zoom:
          1.85,
      });
    };


  const resetMap =
    () => {
      setMapPosition({
        coordinates: [
          12,
          8,
        ],

        zoom:
          1,
      });
    };


  const selectedCount =
    selected.length;

  const remaining =
    Math.max(
      0,
      correctIds.length -
      selectedCount
    );


  return (
    <div>
      {
        cleared && (
          <Confetti />
        )
      }

      <div
        className="
          rounded-[30px]
          border
          border-violet-200
          bg-gradient-to-r
          from-violet-50
          via-blue-50
          to-cyan-50
          p-6
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
                text-xs
                font-black
                tracking-[0.18em]
                text-violet-600
              "
            >
              WORLD SAME-TIME HUNT
            </p>

            <h3
              className="
                mt-2
                text-2xl
                font-black
                text-slate-950
                md:text-3xl
              "
            >
              🌍 キガリと同じ時刻の国を探せ！
            </h3>

            <p
              className="
                mt-2
                max-w-3xl
                font-bold
                leading-7
                text-slate-600
              "
            >
              今、キガリは
              <strong>
                {' '}
                {kigaliTime}
                {' '}
              </strong>
              です。
              国旗を見て、
              <strong>
                今キガリと時計の時刻が同じ国
              </strong>
              を全部タップしよう。
              地図で場所も確かめられるよ。
            </p>
          </div>

          <div
            className="
              rounded-[22px]
              bg-white
              px-5
              py-3
              text-center
              shadow-sm
            "
          >
            <p
              className="
                text-[10px]
                font-black
                tracking-[0.14em]
                text-slate-400
              "
            >
              FOUND
            </p>

            <p
              className="
                mt-1
                text-2xl
                font-black
                text-violet-600
              "
            >
              {selectedCount}
              {' / '}
              {correctIds.length}
            </p>
          </div>
        </div>
      </div>


      {/* ===================================================
          FLAGS FIRST
         =================================================== */}

      <div
        className="
          mt-5
        "
      >
        <div
          className="
            mb-3
            flex
            flex-wrap
            items-end
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
                text-orange-600
              "
            >
              STEP 1 · FLAGS
            </p>

            <h4
              className="
                mt-1
                text-xl
                font-black
                text-slate-900
              "
            >
              国旗から選んでみよう
            </h4>
          </div>

          {
            !cleared && (
              <p
                className="
                  rounded-full
                  bg-violet-50
                  px-4
                  py-2
                  text-xs
                  font-black
                  text-violet-700
                "
              >
                あと
                {' '}
                {remaining}
                {' '}
                か国
              </p>
            )
          }
        </div>


        <div
          className="
            grid
            grid-cols-2
            gap-3
            md:grid-cols-4
          "
        >
          {
            candidates.map(
              (
                country
              ) => {
                const chosen =
                  selected.includes(
                    country.id
                  );

                const wrong =
                  wrongId ===
                    country.id;

                return (
                  <button
                    key={
                      country.id
                    }
                    type="button"
                    onClick={() =>
                      chooseCountry(
                        country
                      )
                    }
                    disabled={
                      chosen ||
                      cleared
                    }
                    style={
                      wrong
                        ? {
                            animation:
                              'same-time-wrong .28s ease',
                          }
                        : undefined
                    }
                    className={`
                      relative
                      rounded-[22px]
                      border-2
                      p-4
                      text-left
                      transition-all

                      ${
                        chosen
                          ? 'border-emerald-400 bg-emerald-50 shadow-md'
                          : wrong
                            ? 'border-red-400 bg-red-50'
                            : 'border-slate-200 bg-white hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg'
                      }
                    `}
                  >
                    {
                      chosen && (
                        <CheckCircle2
                          size={23}
                          className="
                            absolute
                            right-3
                            top-3
                            text-emerald-600
                          "
                        />
                      )
                    }

                    {
                      wrong && (
                        <div
                          className="
                            absolute
                            right-3
                            top-1
                            text-3xl
                            font-black
                            text-red-500
                          "
                        >
                          ×
                        </div>
                      )
                    }

                    <FlagIcon
                      code={
                        country.id
                      }
                    />

                    <p
                      className="
                        mt-3
                        text-sm
                        font-black
                        text-slate-900
                        md:text-base
                      "
                    >
                      {country.name}
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-[0.08em]
                        text-slate-400
                      "
                    >
                      {country.en}
                    </p>

                    {
                      chosen && (
                        <p
                          className="
                            mt-2
                            text-xs
                            font-black
                            text-emerald-600
                          "
                        >
                          ✓ 同じ時刻！
                        </p>
                      )
                    }

                    {
                      cleared && (
                        <div
                          className="
                            mt-3
                          "
                        >
                          <span
                            className={`
                              inline-flex
                              rounded-full
                              px-2.5
                              py-1
                              text-[10px]
                              font-black

                              ${
                                country.kind ===
                                  'always'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : country.kind ===
                                      'seasonal'
                                    ? 'bg-violet-100 text-violet-700'
                                    : 'bg-slate-100 text-slate-500'
                              }
                            `}
                          >
                            {
                              country.kind ===
                                'always'
                                ? '一年中同じ'
                                : country.kind ===
                                    'seasonal'
                                  ? '季節で変わる'
                                  : '時刻が違う'
                            }
                          </span>
                        </div>
                      )
                    }
                  </button>
                );
              }
            )
          }
        </div>
      </div>


      {/* ===================================================
          IMMEDIATE FEEDBACK
         =================================================== */}

      {
        feedback && (
          <div
            className={`
              mt-5
              rounded-[24px]
              border-2
              p-4
              text-center
              font-black

              ${
                feedback.type ===
                  'correct'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-red-300 bg-red-50 text-red-700'
              }
            `}
          >
            {
              feedback.type ===
                'correct'
                ? '✨ '
                : '🚫 '
            }

            {feedback.text}
          </div>
        )
      }


      {/* ===================================================
          MAP BELOW
         =================================================== */}

      <div
        className="
          mt-7
        "
      >
        <div
          className="
            mb-3
            flex
            flex-wrap
            items-end
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
                text-blue-600
              "
            >
              STEP 2 · MAP
            </p>

            <h4
              className="
                mt-1
                text-xl
                font-black
                text-slate-900
              "
            >
              世界のどこにあるか見てみよう
            </h4>
          </div>

          <p
            className="
              text-xs
              font-bold
              text-slate-500
            "
          >
            指で移動・ピンチズームもできます
          </p>
        </div>


        <div
          className="
            overflow-hidden
            rounded-[30px]
            border
            border-slate-200
            bg-sky-50
            shadow-inner
          "
        >
          {/* MAP TOOLBAR */}

          <div
            className="
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
              border-b
              border-slate-200
              bg-white
              px-4
              py-3
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <Globe2
                size={20}
                className="
                  text-blue-600
                "
              />

              <p
                className="
                  text-sm
                  font-black
                  text-slate-700
                "
              >
                地図の国をタップしても判定できます
              </p>
            </div>


            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >
              <button
                type="button"
                onClick={
                  zoomOut
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-700
                  shadow-sm
                  hover:bg-slate-50
                "
                aria-label="地図を縮小"
              >
                <Minus
                  size={19}
                />
              </button>

              <div
                className="
                  min-w-[70px]
                  rounded-xl
                  bg-slate-100
                  px-3
                  py-2
                  text-center
                  text-xs
                  font-black
                  text-slate-600
                "
              >
                ×{
                  mapPosition
                    .zoom
                    .toFixed(
                      1
                    )
                }
              </div>

              <button
                type="button"
                onClick={
                  zoomIn
                }
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  text-slate-700
                  shadow-sm
                  hover:bg-slate-50
                "
                aria-label="地図を拡大"
              >
                <Plus
                  size={19}
                />
              </button>

              <button
                type="button"
                onClick={
                  focusAfricaEurope
                }
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-xl
                  bg-blue-600
                  px-4
                  py-2.5
                  text-xs
                  font-black
                  text-white
                  shadow-sm
                  hover:bg-blue-700
                "
              >
                <MapPinned
                  size={16}
                />

                アフリカ＋ヨーロッパ
              </button>

              <button
                type="button"
                onClick={
                  resetMap
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
                  py-2.5
                  text-xs
                  font-black
                  text-slate-600
                  shadow-sm
                  hover:bg-slate-50
                "
              >
                <RotateCcw
                  size={15}
                />

                世界全体
              </button>
            </div>
          </div>


          <div
            className="
              relative
              min-h-[500px]
              bg-gradient-to-b
              from-sky-50
              to-blue-100
              p-2
              md:p-4
            "
          >
            <ComposableMap
              width={900}
              height={500}
              projectionConfig={{
                scale: 145,
              }}
              style={{
                width: '100%',
                height: 'auto',
              }}
            >
              <ZoomableGroup
                center={
                  mapPosition
                    .coordinates
                }
                zoom={
                  mapPosition
                    .zoom
                }
                minZoom={1}
                maxZoom={6}
                onMoveEnd={
                  (
                    position
                  ) => {
                    setMapPosition(
                      position
                    );
                  }
                }
              >
                <Geographies
                  geography={
                    worldAtlas
                  }
                >
                  {
                    ({
                      geographies,
                    }) =>
                      geographies.map(
                        (
                          geo
                        ) => {
                          const geoId =
                            String(
                              geo.id
                            ).padStart(
                              3,
                              '0'
                            );

                          const country =
                            candidates.find(
                              (
                                item
                              ) =>
                                item.geoId ===
                                geoId
                            );

                          const chosen =
                            country &&
                            selected.includes(
                              country.id
                            );

                          const wrong =
                            country &&
                            wrongId ===
                              country.id;

                          return (
                            <Geography
                              key={
                                geo.rsmKey
                              }
                              geography={
                                geo
                              }
                              onClick={
                                country
                                  ? () =>
                                      chooseCountry(
                                        country
                                      )
                                  : undefined
                              }
                              style={{
                                default: {
                                  fill:
                                    chosen
                                      ? '#22c55e'
                                      : wrong
                                        ? '#ef4444'
                                        : country
                                          ? '#f59e0b'
                                          : '#dbe4ee',

                                  stroke:
                                    country
                                      ? '#ffffff'
                                      : '#cbd5e1',

                                  strokeWidth:
                                    country
                                      ? 1
                                      : 0.35,

                                  outline:
                                    'none',

                                  cursor:
                                    country
                                      ? 'pointer'
                                      : 'grab',

                                  transition:
                                    'fill 180ms ease',
                                },

                                hover: {
                                  fill:
                                    chosen
                                      ? '#16a34a'
                                      : wrong
                                        ? '#dc2626'
                                        : country
                                          ? '#fb923c'
                                          : '#cbd5e1',

                                  stroke:
                                    '#ffffff',

                                  strokeWidth:
                                    country
                                      ? 1.3
                                      : 0.35,

                                  outline:
                                    'none',

                                  cursor:
                                    country
                                      ? 'pointer'
                                      : 'grab',
                                },

                                pressed: {
                                  fill:
                                    country
                                      ? '#8b5cf6'
                                      : '#cbd5e1',

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


            <div
              className="
                absolute
                bottom-4
                left-1/2
                flex
                -translate-x-1/2
                flex-wrap
                justify-center
                gap-3
                rounded-2xl
                bg-white/90
                px-4
                py-2
                text-[11px]
                font-bold
                text-slate-500
                shadow-lg
                backdrop-blur
              "
            >
              <span>
                🟧 まだ選んでいない
              </span>

              <span>
                🟩 正解
              </span>

              <span>
                🟥 間違い
              </span>
            </div>
          </div>
        </div>
      </div>


      {
        cleared && (
          <div
            className="
              mt-6
              rounded-[30px]
              border-2
              border-emerald-300
              bg-gradient-to-r
              from-emerald-50
              to-cyan-50
              p-6
              text-center
            "
          >
            <Sparkles
              size={36}
              className="
                mx-auto
                text-amber-500
              "
            />

            <p
              className="
                mt-2
                text-3xl
                font-black
                text-emerald-800
              "
            >
              SAME-TIME HUNT CLEAR! 🎉
            </p>

            <p
              className="
                mx-auto
                mt-3
                max-w-2xl
                font-bold
                leading-7
                text-slate-600
              "
            >
              アフリカには、
              キガリと一年中同じ時刻の国があります。
              一方ヨーロッパでは
              <strong>
                夏時間
              </strong>
              があるため、
              季節によってキガリと同じ時刻になる国が変わります。
            </p>

            <p
              className="
                mt-3
                text-sm
                font-black
                text-violet-600
              "
            >
              時差は、世界地図の場所だけでなく
              季節とも関係しているんだね！
            </p>

            {
              alreadyCompleted && (
                <p
                  className="
                    mt-3
                    text-xs
                    font-bold
                    text-slate-400
                  "
                >
                  このMissionはクリア済みです。
                </p>
              )
            }
          </div>
        )
      }
    </div>
  );
}