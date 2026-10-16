import {
  CheckCircle2,
  Globe2,
  Lightbulb,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';


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
    start +
    duration +
    0.04
  );
}


function playPick() {
  tone({
    frequency: 720,
    duration: 0.05,
    volume: 0.035,
  });
}


function playTick() {
  tone({
    frequency: 560,
    duration: 0.035,
    volume: 0.025,
  });
}


function playCorrect() {
  tone({
    frequency: 720,
    duration: 0.09,
    volume: 0.06,
  });

  tone({
    frequency: 960,
    duration: 0.15,
    volume: 0.07,
    delay: 0.08,
  });
}


function playWrong() {
  tone({
    frequency: 170,
    duration: 0.18,
    volume: 0.055,
    type: 'sawtooth',
  });

  tone({
    frequency: 120,
    duration: 0.16,
    volume: 0.045,
    delay: 0.10,
    type: 'sawtooth',
  });
}


function playStageClear() {
  [
    [523, 0.00],
    [659, 0.10],
    [784, 0.20],
    [1047, 0.32],
  ].forEach(
    (
      [
        frequency,
        delay,
      ]
    ) => {
      tone({
        frequency,
        duration: 0.20,
        volume: 0.075,
        delay,
      });
    }
  );
}


function playFinal() {
  [
    [523, 0.00, 0.15],
    [659, 0.10, 0.15],
    [784, 0.20, 0.16],
    [1047, 0.31, 0.23],
    [1319, 0.47, 0.34],
    [1568, 0.66, 0.60],
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


const FALLBACK_CITIES = [
  {
    id: 'kigali',
    city: 'Kigali',
    country: 'ルワンダ',
    zone: 'Africa/Kigali',
    flagCode: 'rw',
    availability: [
      '08:00',
      '20:00',
    ],
  },

  {
    id: 'tokyo',
    city: 'Tokyo',
    country: '日本',
    zone: 'Asia/Tokyo',
    flagCode: 'jp',
    availability: [
      '07:00',
      '22:00',
    ],
  },

  {
    id: 'paris',
    city: 'Paris',
    country: 'フランス',
    zone: 'Europe/Paris',
    flagCode: 'fr',
    availability: [
      '08:00',
      '20:00',
    ],
  },

  {
    id: 'nairobi',
    city: 'Nairobi',
    country: 'ケニア',
    zone: 'Africa/Nairobi',
    flagCode: 'ke',
    availability: [
      '08:00',
      '20:00',
    ],
  },

  {
    id: 'new-york',
    city: 'New York',
    country: 'アメリカ',
    zone: 'America/New_York',
    flagCode: 'us',
    availability: [
      '07:00',
      '21:00',
    ],
  },
];


function parseTime(
  value
) {
  const [
    hour,
    minute,
  ] =
    String(value)
      .split(':')
      .map(Number);

  return {
    hour:
      Number.isFinite(hour)
        ? hour
        : 0,

    minute:
      Number.isFinite(minute)
        ? minute
        : 0,
  };
}


function timeToMinutes(
  value
) {
  const parsed =
    parseTime(
      value
    );

  return (
    parsed.hour *
      60 +
    parsed.minute
  );
}


function formatMinutes(
  total
) {
  const value =
    (
      (
        total %
        1440
      ) +
      1440
    ) %
    1440;

  const hour =
    Math.floor(
      value /
      60
    );

  const minute =
    value %
    60;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}


function getZoneParts(
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

  return {
    year:
      Number(parts.year),

    month:
      Number(parts.month),

    day:
      Number(parts.day),

    hour:
      Number(parts.hour),

    minute:
      Number(parts.minute),

    second:
      Number(parts.second),
  };
}


function getOffsetMinutes(
  date,
  timeZone
) {
  const parts =
    getZoneParts(
      date,
      timeZone
    );

  const representedAsUtc =
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );

  return Math.round(
    (
      representedAsUtc -
      date.getTime()
    ) /
    60000
  );
}


function instantFromKigaliMinutes(
  referenceDate,
  totalMinutes
) {
  const base =
    getZoneParts(
      referenceDate,
      'Africa/Kigali'
    );

  const hour =
    Math.floor(
      totalMinutes /
      60
    );

  const minute =
    totalMinutes %
    60;

  const localAsUtc =
    Date.UTC(
      base.year,
      base.month - 1,
      base.day,
      hour,
      minute,
      0
    );

  const probe =
    new Date(
      localAsUtc
    );

  const offset =
    getOffsetMinutes(
      probe,
      'Africa/Kigali'
    );

  return new Date(
    localAsUtc -
    offset *
      60000
  );
}


function instantFromKigaliTime(
  referenceDate,
  value
) {
  const parsed =
    parseTime(
      value
    );

  return instantFromKigaliMinutes(
    referenceDate,
    parsed.hour *
      60 +
      parsed.minute
  );
}


function formatZoneTime(
  date,
  timeZone
) {
  const parts =
    getZoneParts(
      date,
      timeZone
    );

  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}


function dateSerial(
  parts
) {
  return Math.round(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day
    ) /
    86400000
  );
}


function getDayShift(
  date,
  timeZone
) {
  const base =
    getZoneParts(
      date,
      'Africa/Kigali'
    );

  const target =
    getZoneParts(
      date,
      timeZone
    );

  return (
    dateSerial(
      target
    ) -
    dateSerial(
      base
    )
  );
}


function dayShiftLabel(
  shift
) {
  if (
    shift ===
    1
  ) {
    return 'NEXT DAY';
  }

  if (
    shift ===
    -1
  ) {
    return 'PREVIOUS DAY';
  }

  return 'SAME DAY';
}


function isWithinWindow(
  minutes,
  startText,
  endText
) {
  const start =
    timeToMinutes(
      startText
    );

  const end =
    timeToMinutes(
      endText
    );

  if (
    start <=
    end
  ) {
    return (
      minutes >=
        start &&
      minutes <=
        end
    );
  }

  return (
    minutes >=
      start ||
    minutes <=
      end
  );
}


function getDayPeriod(
  minutes
) {
  const hour =
    Math.floor(
      minutes /
      60
    );

  if (
    hour >= 5 &&
    hour < 9
  ) {
    return {
      icon: '🌅',
      label: '朝',
      classes:
        'from-orange-50 to-sky-100',
    };
  }

  if (
    hour >= 9 &&
    hour < 16
  ) {
    return {
      icon: '☀️',
      label: '昼',
      classes:
        'from-sky-50 to-blue-100',
    };
  }

  if (
    hour >= 16 &&
    hour < 19
  ) {
    return {
      icon: '🌇',
      label: '夕方',
      classes:
        'from-orange-100 to-pink-100',
    };
  }

  return {
    icon: '🌙',
    label: '夜',
    classes:
      'from-slate-800 to-indigo-950',
  };
}


function FlagIcon({
  code,
  large = false,
}) {
  const width =
    large
      ? 54
      : 42;

  const height =
    large
      ? 36
      : 28;

  const common = {
    width,
    height,
    viewBox: '0 0 54 36',
    className:
      'shrink-0 overflow-hidden rounded-md shadow-sm ring-1 ring-black/10',
  };


  if (
    code ===
    'jp'
  ) {
    return (
      <svg {...common}>
        <rect
          width="54"
          height="36"
          fill="#fff"
        />

        <circle
          cx="27"
          cy="18"
          r="9"
          fill="#BC002D"
        />
      </svg>
    );
  }


  if (
    code ===
    'fr'
  ) {
    return (
      <svg {...common}>
        <rect
          width="18"
          height="36"
          fill="#0055A4"
        />

        <rect
          x="18"
          width="18"
          height="36"
          fill="#fff"
        />

        <rect
          x="36"
          width="18"
          height="36"
          fill="#EF4135"
        />
      </svg>
    );
  }


  if (
    code ===
    'us'
  ) {
    return (
      <svg {...common}>
        <rect
          width="54"
          height="36"
          fill="#fff"
        />

        {
          Array.from(
            {
              length: 7,
            },
            (
              _,
              index
            ) => (
              <rect
                key={index}
                y={
                  index *
                  36 /
                  7
                }
                width="54"
                height={
                  36 /
                  14
                }
                fill="#B22234"
              />
            )
          )
        }

        <rect
          width="23"
          height="19"
          fill="#3C3B6E"
        />

        {
          [
            [4,4],
            [9,4],
            [14,4],
            [19,4],
            [6,9],
            [11,9],
            [16,9],
            [4,14],
            [9,14],
            [14,14],
            [19,14],
          ].map(
            (
              point,
              index
            ) => (
              <circle
                key={index}
                cx={point[0]}
                cy={point[1]}
                r="1"
                fill="#fff"
              />
            )
          )
        }
      </svg>
    );
  }


  if (
    code ===
    'ke'
  ) {
    return (
      <svg {...common}>
        <rect
          width="54"
          height="11"
          fill="#000"
        />

        <rect
          y="11"
          width="54"
          height="2"
          fill="#fff"
        />

        <rect
          y="13"
          width="54"
          height="10"
          fill="#BB0000"
        />

        <rect
          y="23"
          width="54"
          height="2"
          fill="#fff"
        />

        <rect
          y="25"
          width="54"
          height="11"
          fill="#006600"
        />

        <ellipse
          cx="27"
          cy="18"
          rx="5"
          ry="12"
          fill="#BB0000"
          stroke="#fff"
          strokeWidth="1"
        />

        <line
          x1="21"
          y1="5"
          x2="33"
          y2="31"
          stroke="#fff"
          strokeWidth="1"
        />

        <line
          x1="33"
          y1="5"
          x2="21"
          y2="31"
          stroke="#fff"
          strokeWidth="1"
        />
      </svg>
    );
  }


  return (
    <svg {...common}>
      <rect
        width="54"
        height="18"
        fill="#00A1DE"
      />

      <rect
        y="18"
        width="54"
        height="9"
        fill="#FAD201"
      />

      <rect
        y="27"
        width="54"
        height="9"
        fill="#20603D"
      />

      <circle
        cx="44"
        cy="8"
        r="4"
        fill="#E5BE01"
      />

      {
        Array.from(
          {
            length: 8,
          },
          (
            _,
            index
          ) => {
            const angle =
              index *
              Math.PI /
              4;

            return (
              <line
                key={index}
                x1={
                  44 +
                  Math.cos(angle) *
                    5
                }
                y1={
                  8 +
                  Math.sin(angle) *
                    5
                }
                x2={
                  44 +
                  Math.cos(angle) *
                    7
                }
                y2={
                  8 +
                  Math.sin(angle) *
                    7
                }
                stroke="#E5BE01"
                strokeWidth="1"
              />
            );
          }
        )
      }
    </svg>
  );
}


function Confetti() {
  return (
    <>
      <style>
        {`
          @keyframes time-master-confetti {
            0% {
              transform:
                translateY(-12vh)
                rotate(0deg);
              opacity: 1;
            }

            100% {
              transform:
                translate3d(
                  var(--x),
                  110vh,
                  0
                )
                rotate(950deg);
              opacity: 0;
            }
          }

          @keyframes rescue-shake {
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

          @keyframes rescue-pulse {
            0%,100% {
              box-shadow:
                0 0 0 0
                rgba(34,197,94,.2);
            }

            50% {
              box-shadow:
                0 0 0 12px
                rgba(34,197,94,0);
            }
          }

          @keyframes satellite-glow {
            0%,100% {
              transform:
                translate(-50%,-50%)
                scale(1);
            }

            50% {
              transform:
                translate(-50%,-50%)
                scale(1.12);
            }
          }
        `}
      </style>

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-[24000]
          overflow-hidden
        "
      >
        {
          Array.from(
            {
              length: 90,
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
                        43
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

                  '--x':
                    `${
                      (
                        index %
                          2
                          ? 1
                          : -1
                      ) *
                      (
                        25 +
                        (
                          index %
                          9
                        ) *
                        9
                      )
                    }px`,

                  animation:
                    `time-master-confetti ${
                      1.8 +
                      (
                        index %
                        9
                      ) *
                      0.12
                    }s linear ${
                      (
                        index %
                        12
                      ) *
                      0.035
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


export default function GlobalTimeRescueMission({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const challenge =
    mission
      ?.challenge ??
    {};

  const cities =
    Array.isArray(
      challenge.cities
    ) &&
    challenge.cities.length
      ? challenge.cities
      : FALLBACK_CITIES;

  const now =
    useMemo(
      () =>
        new Date(),
      []
    );

  const stage1BaseTime =
    challenge
      .stage1BaseTime ??
    '18:00';

  const meetingStepMinutes =
    Number(
      challenge
        .meetingStepMinutes ??
        30
    );

  const meetingInitialMinutes =
    timeToMinutes(
      challenge
        .meetingInitialTime ??
        '23:00'
    );

  const [
    stage,
    setStage,
  ] =
    useState(
      1
    );

  const [
    placed,
    setPlaced,
  ] =
    useState(
      {}
    );

  const [
    selectedCardId,
    setSelectedCardId,
  ] =
    useState(
      null
    );

  const [
    dragGhost,
    setDragGhost,
  ] =
    useState(
      null
    );

  const [
    wrongTargetId,
    setWrongTargetId,
  ] =
    useState(
      null
    );

  const [
    stage1Feedback,
    setStage1Feedback,
  ] =
    useState(
      null
    );

  const [
    stage1Complete,
    setStage1Complete,
  ] =
    useState(
      false
    );

  const [
    meetingMinutes,
    setMeetingMinutes,
  ] =
    useState(
      meetingInitialMinutes
    );

  const [
    ringDragging,
    setRingDragging,
  ] =
    useState(
      false
    );

  const [
    hintLevel,
    setHintLevel,
  ] =
    useState(
      0
    );

  const [
    finalComplete,
    setFinalComplete,
  ] =
    useState(
      false
    );

  const ringRef =
    useRef(
      null
    );


  const kigaliCity =
    cities.find(
      (
        city
      ) =>
        city.id ===
        'kigali'
    ) ??
    cities[0];


  const stage1Instant =
    useMemo(
      () =>
        instantFromKigaliTime(
          now,
          stage1BaseTime
        ),
      [
        now,
        stage1BaseTime,
      ]
    );


  const stage1Cards =
    useMemo(
      () => {
        const preferredOrder = [
          'new-york',
          'tokyo',
          'nairobi',
          'paris',
        ];

        const otherCities =
          cities.filter(
            (
              city
            ) =>
              city.id !==
              'kigali'
          );

        return [
          ...otherCities,
        ]
          .sort(
            (
              a,
              b
            ) => {
              const ai =
                preferredOrder.indexOf(
                  a.id
                );

              const bi =
                preferredOrder.indexOf(
                  b.id
                );

              return (
                (
                  ai < 0
                    ? 99
                    : ai
                ) -
                (
                  bi < 0
                    ? 99
                    : bi
                )
              );
            }
          )
          .map(
            (
              city
            ) => ({
              cityId:
                city.id,

              time:
                formatZoneTime(
                  stage1Instant,
                  city.zone
                ),

              dayShift:
                getDayShift(
                  stage1Instant,
                  city.zone
                ),
            })
          );
      },
      [
        cities,
        stage1Instant,
      ]
    );


  const stage1TargetCities =
    cities.filter(
      (
        city
      ) =>
        city.id !==
        'kigali'
    );


  const handleDrop =
    (
      cardId,
      targetId
    ) => {
      if (
        stage1Complete ||
        placed[
          cardId
        ]
      ) {
        return;
      }

      if (
        cardId !==
        targetId
      ) {
        playWrong();

        setWrongTargetId(
          targetId
        );

        setStage1Feedback({
          type:
            'wrong',

          text:
            'ブブー！その都市の時刻ではないよ。別の都市を試してみよう。',
        });

        window.setTimeout(
          () => {
            setWrongTargetId(
              (
                current
              ) =>
                current ===
                targetId
                  ? null
                  : current
            );
          },
          650
        );

        return;
      }

      playCorrect();

      const nextPlaced = {
        ...placed,

        [
          cardId
        ]:
          true,
      };

      setPlaced(
        nextPlaced
      );

      setSelectedCardId(
        null
      );

      setWrongTargetId(
        null
      );

      const city =
        cities.find(
          (
            item
          ) =>
            item.id ===
            targetId
        );

      setStage1Feedback({
        type:
          'correct',

        text:
          `ピンポン♪ ${city?.city ?? ''} のTIME LINKが復旧した！`,
      });

      if (
        Object.keys(
          nextPlaced
        ).length ===
        stage1Cards.length
      ) {
        setStage1Complete(
          true
        );

        playStageClear();

        window.setTimeout(
          () => {
            setStage(
              2
            );

            setStage1Feedback(
              null
            );
          },
          1200
        );
      }
    };


  const meetingInstant =
    useMemo(
      () =>
        instantFromKigaliMinutes(
          now,
          meetingMinutes
        ),
      [
        now,
        meetingMinutes,
      ]
    );


  const meetingStatuses =
    useMemo(
      () =>
        cities.map(
          (
            city
          ) => {
            const parts =
              getZoneParts(
                meetingInstant,
                city.zone
              );

            const localMinutes =
              parts.hour *
                60 +
              parts.minute;

            const availability =
              city.availability ??
              [
                '08:00',
                '20:00',
              ];

            const available =
              isWithinWindow(
                localMinutes,
                availability[0],
                availability[1]
              );

            return {
              ...city,

              localMinutes,

              localTime:
                formatMinutes(
                  localMinutes
                ),

              dayShift:
                getDayShift(
                  meetingInstant,
                  city.zone
                ),

              available,

              period:
                getDayPeriod(
                  localMinutes
                ),

              availability,
            };
          }
        ),
      [
        cities,
        meetingInstant,
      ]
    );


  const onlineCount =
    meetingStatuses.filter(
      (
        city
      ) =>
        city.available
    ).length;


  const allAvailable =
    meetingStatuses.length >
      0 &&
    onlineCount ===
      meetingStatuses.length;


  useEffect(
    () => {
      if (
        stage !==
          2 ||
        finalComplete ||
        !allAvailable
      ) {
        return undefined;
      }

      const timer =
        window.setTimeout(
          () => {
            setFinalComplete(
              true
            );

            playFinal();

            onComplete?.(
              mission
            );
          },
          380
        );

      return () =>
        window.clearTimeout(
          timer
        );
    },
    [
      stage,
      finalComplete,
      allAvailable,
      onComplete,
      mission,
    ]
  );


  const updateRingFromPointer =
    (
      event
    ) => {
      if (
        finalComplete
      ) {
        return;
      }

      const rect =
        ringRef.current
          ?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      const centerX =
        rect.left +
        rect.width /
          2;

      const centerY =
        rect.top +
        rect.height /
          2;

      const dx =
        event.clientX -
        centerX;

      const dy =
        event.clientY -
        centerY;

      let degrees =
        Math.atan2(
          dy,
          dx
        ) *
          180 /
          Math.PI +
        90;

      if (
        degrees <
        0
      ) {
        degrees +=
          360;
      }

      const rawMinutes =
        degrees /
        360 *
        1440;

      const snapped =
        (
          Math.round(
            rawMinutes /
            meetingStepMinutes
          ) *
          meetingStepMinutes
        ) %
        1440;

      setMeetingMinutes(
        (
          current
        ) => {
          if (
            current !==
            snapped
          ) {
            playTick();
          }

          return snapped;
        }
      );
    };


  const satelliteAngle =
    meetingMinutes /
      1440 *
      Math.PI *
      2 -
    Math.PI /
      2;

  const satelliteX =
    50 +
    Math.cos(
      satelliteAngle
    ) *
      41;

  const satelliteY =
    50 +
    Math.sin(
      satelliteAngle
    ) *
      41;


  return (
    <div>
      {
        finalComplete && (
          <Confetti />
        )
      }

      <div
        className="
          overflow-hidden
          rounded-[30px]
          border
          border-violet-200
          bg-gradient-to-br
          from-slate-950
          via-indigo-950
          to-violet-950
          p-6
          text-white
          shadow-xl
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
          <div
            className="
              flex
              items-center
              gap-4
            "
          >
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-white/10
                shadow-inner
              "
            >
              <Globe2
                size={30}
              />
            </div>

            <div>
              <p
                className="
                  text-xs
                  font-black
                  tracking-[0.22em]
                  text-cyan-300
                "
              >
                FINAL MISSION
              </p>

              <h3
                className="
                  mt-1
                  text-2xl
                  font-black
                  md:text-3xl
                "
              >
                GLOBAL TIME RESCUE
              </h3>

              <p
                className="
                  mt-1
                  font-bold
                  text-indigo-200
                "
              >
                世界を同時につなげ！
              </p>
            </div>
          </div>


          <div
            className="
              flex
              gap-2
            "
          >
            <div
              className={`
                rounded-full
                px-4
                py-2
                text-xs
                font-black

                ${
                  stage >
                  1
                    ? 'bg-emerald-500 text-white'
                    : 'bg-cyan-400 text-slate-950'
                }
              `}
            >
              1 TIME RESTORE
            </div>

            <div
              className={`
                rounded-full
                px-4
                py-2
                text-xs
                font-black

                ${
                  stage ===
                  2
                    ? 'bg-cyan-400 text-slate-950'
                    : 'bg-white/10 text-white/50'
                }
              `}
            >
              2 GLOBAL MEETING
            </div>
          </div>
        </div>
      </div>


      {
        stage ===
          1 && (
          <>
            <div
              className="
                mt-6
                rounded-[28px]
                border
                border-cyan-200
                bg-gradient-to-r
                from-cyan-50
                to-blue-50
                p-6
              "
            >
              <p
                className="
                  text-xs
                  font-black
                  tracking-[0.16em]
                  text-cyan-700
                "
              >
                STAGE 1 · RESTORE THE TIME LINKS
              </p>

              <h4
                className="
                  mt-2
                  text-2xl
                  font-black
                  text-slate-950
                "
              >
                🛰️ 壊れた世界時計を復旧せよ！
              </h4>

              <p
                className="
                  mt-2
                  font-bold
                  leading-7
                  text-slate-600
                "
              >
                キガリが
                <strong>
                  {' '}
                  {stage1BaseTime}
                  {' '}
                </strong>
                の同じ瞬間、
                4つの都市では何時？
                下のTIME CARDを正しい都市へ届けよう。
              </p>
            </div>


            <div
              className="
                mt-5
                rounded-[26px]
                border-2
                border-orange-200
                bg-orange-50
                p-5
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-4
                "
              >
                <FlagIcon
                  code={
                    kigaliCity
                      ?.flagCode ??
                    'rw'
                  }
                  large
                />

                <div>
                  <p
                    className="
                      text-xs
                      font-black
                      tracking-[0.13em]
                      text-orange-600
                    "
                  >
                    MASTER CLOCK
                  </p>

                  <p
                    className="
                      text-xl
                      font-black
                      text-slate-950
                    "
                  >
                    Kigali · Rwanda
                  </p>
                </div>

                <p
                  className="
                    ml-auto
                    text-4xl
                    font-black
                    text-slate-950
                  "
                >
                  {stage1BaseTime}
                </p>
              </div>
            </div>


            <div
              className="
                mt-6
                grid
                grid-cols-2
                gap-3
                md:grid-cols-4
              "
            >
              {
                stage1Cards.map(
                  (
                    card
                  ) => {
                    const done =
                      placed[
                        card.cityId
                      ];

                    const selected =
                      selectedCardId ===
                      card.cityId;

                    return (
                      <div
                        key={
                          card.cityId
                        }
                        onClick={() => {
                          if (
                            !done
                          ) {
                            playPick();

                            setSelectedCardId(
                              card.cityId
                            );
                          }
                        }}
                        onPointerDown={
                          (
                            event
                          ) => {
                            if (
                              done
                            ) {
                              return;
                            }

                            playPick();

                            setSelectedCardId(
                              card.cityId
                            );

                            setDragGhost({
                              cityId:
                                card.cityId,

                              x:
                                event.clientX,

                              y:
                                event.clientY,
                            });

                            event
                              .currentTarget
                              .setPointerCapture?.(
                                event.pointerId
                              );
                          }
                        }
                        onPointerMove={
                          (
                            event
                          ) => {
                            if (
                              dragGhost
                                ?.cityId ===
                              card.cityId
                            ) {
                              setDragGhost({
                                cityId:
                                  card.cityId,

                                x:
                                  event.clientX,

                                y:
                                  event.clientY,
                              });
                            }
                          }
                        }
                        onPointerUp={
                          (
                            event
                          ) => {
                            const element =
                              document
                                .elementFromPoint(
                                  event.clientX,
                                  event.clientY
                                );

                            const target =
                              element
                                ?.closest?.(
                                  '[data-time-rescue-target]'
                                );

                            const targetId =
                              target
                                ?.getAttribute(
                                  'data-time-rescue-target'
                                );

                            setDragGhost(
                              null
                            );

                            if (
                              targetId
                            ) {
                              handleDrop(
                                card.cityId,
                                targetId
                              );
                            }
                          }
                        }
                        onPointerCancel={() =>
                          setDragGhost(
                            null
                          )
                        }
                        className={`
                          touch-none
                          select-none
                          rounded-[22px]
                          border-2
                          p-4
                          text-center
                          transition-all

                          ${
                            done
                              ? 'border-emerald-300 bg-emerald-50 opacity-60'
                              : selected
                                ? 'border-cyan-500 bg-cyan-50 ring-4 ring-cyan-100'
                                : 'border-slate-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg'
                          }
                        `}
                      >
                        <p
                          className="
                            text-[10px]
                            font-black
                            tracking-[0.16em]
                            text-slate-400
                          "
                        >
                          TIME CARD
                        </p>

                        <p
                          className="
                            mt-2
                            text-3xl
                            font-black
                            text-slate-950
                          "
                        >
                          {card.time}
                        </p>

                        <p
                          className="
                            mt-2
                            text-[10px]
                            font-black
                            text-indigo-500
                          "
                        >
                          {
                            dayShiftLabel(
                              card.dayShift
                            )
                          }
                        </p>

                        {
                          done && (
                            <p
                              className="
                                mt-2
                                font-black
                                text-emerald-600
                              "
                            >
                              ✓ LINKED
                            </p>
                          )
                        }
                      </div>
                    );
                  }
                )
              }
            </div>


            <div
              className="
                mt-6
                grid
                grid-cols-1
                gap-3
                md:grid-cols-2
              "
            >
              {
                stage1TargetCities.map(
                  (
                    city
                  ) => {
                    const done =
                      placed[
                        city.id
                      ];

                    const wrong =
                      wrongTargetId ===
                      city.id;

                    const correctCard =
                      stage1Cards.find(
                        (
                          card
                        ) =>
                          card.cityId ===
                          city.id
                      );

                    return (
                      <button
                        key={
                          city.id
                        }
                        type="button"
                        data-time-rescue-target={
                          city.id
                        }
                        onClick={() => {
                          if (
                            selectedCardId
                          ) {
                            handleDrop(
                              selectedCardId,
                              city.id
                            );
                          }
                        }}
                        style={
                          wrong
                            ? {
                                animation:
                                  'rescue-shake .28s ease',
                              }
                            : undefined
                        }
                        className={`
                          rounded-[24px]
                          border-2
                          p-5
                          text-left
                          transition-all

                          ${
                            done
                              ? 'border-emerald-400 bg-emerald-50'
                              : wrong
                                ? 'border-red-400 bg-red-50'
                                : selectedCardId
                                  ? 'border-dashed border-cyan-400 bg-cyan-50/50 hover:bg-cyan-100'
                                  : 'border-dashed border-slate-300 bg-slate-50'
                          }
                        `}
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-4
                          "
                        >
                          <FlagIcon
                            code={
                              city.flagCode
                            }
                            large
                          />

                          <div>
                            <p
                              className="
                                text-lg
                                font-black
                                text-slate-950
                              "
                            >
                              {city.city}
                            </p>

                            <p
                              className="
                                text-xs
                                font-bold
                                text-slate-500
                              "
                            >
                              {city.country}
                            </p>
                          </div>

                          <div
                            className="
                              ml-auto
                              text-right
                            "
                          >
                            {
                              done
                                ? (
                                    <>
                                      <CheckCircle2
                                        size={25}
                                        className="
                                          ml-auto
                                          text-emerald-600
                                        "
                                      />

                                      <p
                                        className="
                                          mt-1
                                          text-xl
                                          font-black
                                          text-emerald-700
                                        "
                                      >
                                        {
                                          correctCard
                                            ?.time
                                        }
                                      </p>
                                    </>
                                  )
                                : (
                                    <p
                                      className="
                                        text-3xl
                                        font-black
                                        text-slate-300
                                      "
                                    >
                                      ??:??
                                    </p>
                                  )
                            }
                          </div>
                        </div>
                      </button>
                    );
                  }
                )
              }
            </div>


            {
              stage1Feedback && (
                <div
                  className={`
                    mt-5
                    rounded-[22px]
                    border-2
                    p-4
                    text-center
                    font-black

                    ${
                      stage1Feedback.type ===
                        'correct'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                        : 'border-red-300 bg-red-50 text-red-700'
                    }
                  `}
                >
                  {stage1Feedback.text}
                </div>
              )
            }


            {
              stage1Complete && (
                <div
                  className="
                    mt-5
                    rounded-[26px]
                    bg-gradient-to-r
                    from-emerald-500
                    to-cyan-500
                    p-5
                    text-center
                    text-white
                    shadow-lg
                  "
                >
                  <p
                    className="
                      text-2xl
                      font-black
                    "
                  >
                    🛰️ TIME NETWORK RESTORED!
                  </p>

                  <p
                    className="
                      mt-1
                      font-bold
                    "
                  >
                    FINAL CHALLENGEを起動します…
                  </p>
                </div>
              )
            }
          </>
        )
      }


      {
        stage ===
          2 && (
          <>
            <div
              className="
                mt-6
                rounded-[28px]
                border
                border-violet-200
                bg-gradient-to-r
                from-violet-50
                to-fuchsia-50
                p-6
              "
            >
              <p
                className="
                  text-xs
                  font-black
                  tracking-[0.16em]
                  text-violet-700
                "
              >
                FINAL STAGE · GLOBAL MEETING
              </p>

              <h4
                className="
                  mt-2
                  text-2xl
                  font-black
                  text-slate-950
                "
              >
                🌍 全都市を同時にONLINEにせよ！
              </h4>

              <p
                className="
                  mt-2
                  font-bold
                  leading-7
                  text-slate-600
                "
              >
                衛星をTIME RINGの上で動かすと、
                世界5都市の時刻が同時に変わります。
                <strong>
                  全員が参加できる瞬間
                </strong>
                を探そう。
              </p>

              <p
                className="
                  mt-3
                  text-xs
                  font-bold
                  text-slate-400
                "
              >
                ※ 参加可能時間はこのゲームのために設定した仮想シナリオです。
              </p>
            </div>


            <div
              className="
                mt-6
                grid
                grid-cols-1
                gap-6
                xl:grid-cols-[410px_minmax(0,1fr)]
              "
            >
              <div
                className="
                  rounded-[30px]
                  border
                  border-indigo-200
                  bg-gradient-to-br
                  from-slate-950
                  to-indigo-950
                  p-5
                  text-white
                  shadow-xl
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >
                  <div>
                    <p
                      className="
                        text-xs
                        font-black
                        tracking-[0.16em]
                        text-cyan-300
                      "
                    >
                      GLOBAL TIME RING
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        font-bold
                        text-indigo-200
                      "
                    >
                      衛星をドラッグ
                    </p>
                  </div>

                  <div
                    className={`
                      rounded-full
                      px-4
                      py-2
                      text-sm
                      font-black

                      ${
                        allAvailable
                          ? 'bg-emerald-400 text-emerald-950'
                          : 'bg-white/10 text-white'
                      }
                    `}
                  >
                    {
                      onlineCount
                    }
                    {' / '}
                    {
                      meetingStatuses.length
                    }
                    {' '}
                    ONLINE
                  </div>
                </div>


                <div
                  ref={
                    ringRef
                  }
                  onPointerDown={
                    (
                      event
                    ) => {
                      if (
                        finalComplete
                      ) {
                        return;
                      }

                      setRingDragging(
                        true
                      );

                      event
                        .currentTarget
                        .setPointerCapture?.(
                          event.pointerId
                        );

                      updateRingFromPointer(
                        event
                      );
                    }
                  }
                  onPointerMove={
                    (
                      event
                    ) => {
                      if (
                        ringDragging
                      ) {
                        updateRingFromPointer(
                          event
                        );
                      }
                    }
                  }
                  onPointerUp={() =>
                    setRingDragging(
                      false
                    )
                  }
                  onPointerCancel={() =>
                    setRingDragging(
                      false
                    )
                  }
                  className="
                    relative
                    mx-auto
                    mt-6
                    aspect-square
                    w-full
                    max-w-[360px]
                    touch-none
                    select-none
                    rounded-full
                    border-[12px]
                    border-indigo-400/30
                    shadow-[inset_0_0_50px_rgba(59,130,246,.20),0_0_45px_rgba(99,102,241,.20)]
                  "
                  style={{
                    background:
                      'repeating-conic-gradient(from -90deg, rgba(255,255,255,.33) 0deg 1deg, transparent 1deg 15deg), radial-gradient(circle at center, #111827 0%, #172554 57%, #312e81 100%)',
                  }}
                >
                  <div
                    className="
                      absolute
                      left-1/2
                      top-3
                      -translate-x-1/2
                      text-xs
                      font-black
                      text-cyan-200
                    "
                  >
                    00
                  </div>

                  <div
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-xs
                      font-black
                      text-cyan-200
                    "
                  >
                    06
                  </div>

                  <div
                    className="
                      absolute
                      bottom-3
                      left-1/2
                      -translate-x-1/2
                      text-xs
                      font-black
                      text-cyan-200
                    "
                  >
                    12
                  </div>

                  <div
                    className="
                      absolute
                      left-3
                      top-1/2
                      -translate-y-1/2
                      text-xs
                      font-black
                      text-cyan-200
                    "
                  >
                    18
                  </div>


                  <div
                    className="
                      absolute
                      left-1/2
                      top-1/2
                      w-[54%]
                      -translate-x-1/2
                      -translate-y-1/2
                      rounded-full
                      border
                      border-white/10
                      bg-slate-950/70
                      p-6
                      text-center
                      backdrop-blur
                    "
                  >
                    <p
                      className="
                        text-[10px]
                        font-black
                        tracking-[0.15em]
                        text-cyan-300
                      "
                    >
                      KIGALI TIME
                    </p>

                    <p
                      className="
                        mt-1
                        text-4xl
                        font-black
                        text-white
                      "
                    >
                      {
                        formatMinutes(
                          meetingMinutes
                        )
                      }
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        font-bold
                        text-indigo-200
                      "
                    >
                      30分ずつ動きます
                    </p>
                  </div>


                  <div
                    className="
                      absolute
                      z-20
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-full
                      border-4
                      border-white
                      bg-gradient-to-br
                      from-cyan-300
                      to-violet-500
                      text-3xl
                      shadow-[0_0_30px_rgba(34,211,238,.8)]
                    "
                    style={{
                      left:
                        `${satelliteX}%`,

                      top:
                        `${satelliteY}%`,

                      transform:
                        'translate(-50%,-50%)',

                      animation:
                        finalComplete
                          ? 'satellite-glow .9s ease-in-out infinite'
                          : undefined,
                    }}
                  >
                    🛰️
                  </div>
                </div>


                <button
                  type="button"
                  onClick={() => {
                    setMeetingMinutes(
                      meetingInitialMinutes
                    );

                    setHintLevel(
                      0
                    );
                  }}
                  disabled={
                    finalComplete
                  }
                  className="
                    mt-5
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    bg-white/10
                    py-3
                    text-sm
                    font-black
                    text-white
                    hover:bg-white/20
                    disabled:opacity-40
                  "
                >
                  <RotateCcw
                    size={16}
                  />

                  最初の時刻へ戻す
                </button>
              </div>


              <div>
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-3
                    md:grid-cols-2
                  "
                >
                  {
                    meetingStatuses.map(
                      (
                        city
                      ) => {
                        const isNight =
                          city.period
                            .label ===
                          '夜';

                        return (
                          <div
                            key={
                              city.id
                            }
                            className={`
                              overflow-hidden
                              rounded-[24px]
                              border-2
                              bg-gradient-to-br
                              p-5
                              transition-all
                              duration-300

                              ${
                                city.available
                                  ? 'border-emerald-400 from-emerald-50 to-cyan-50 shadow-lg'
                                  : `border-rose-200 ${city.period.classes}`
                              }
                            `}
                            style={
                              city.available
                                ? {
                                    animation:
                                      'rescue-pulse 1.5s ease-in-out infinite',
                                  }
                                : undefined
                            }
                          >
                            <div
                              className="
                                flex
                                items-center
                                gap-3
                              "
                            >
                              <FlagIcon
                                code={
                                  city.flagCode
                                }
                                large
                              />

                              <div>
                                <p
                                  className={`
                                    text-lg
                                    font-black

                                    ${
                                      !city.available &&
                                      isNight
                                        ? 'text-white'
                                        : 'text-slate-950'
                                    }
                                  `}
                                >
                                  {city.city}
                                </p>

                                <p
                                  className={`
                                    text-xs
                                    font-bold

                                    ${
                                      !city.available &&
                                      isNight
                                        ? 'text-indigo-200'
                                        : 'text-slate-500'
                                    }
                                  `}
                                >
                                  {city.country}
                                </p>
                              </div>


                              <div
                                className="
                                  ml-auto
                                  text-right
                                "
                              >
                                <p
                                  className={`
                                    text-3xl
                                    font-black

                                    ${
                                      city.available
                                        ? 'text-emerald-700'
                                        : !city.available &&
                                            isNight
                                          ? 'text-white'
                                          : 'text-slate-900'
                                    }
                                  `}
                                >
                                  {
                                    city.localTime
                                  }
                                </p>

                                <p
                                  className={`
                                    text-[10px]
                                    font-black

                                    ${
                                      city.dayShift !==
                                      0
                                        ? 'text-violet-500'
                                        : 'text-slate-400'
                                    }
                                  `}
                                >
                                  {
                                    dayShiftLabel(
                                      city.dayShift
                                    )
                                  }
                                </p>
                              </div>
                            </div>


                            <div
                              className="
                                mt-4
                                flex
                                items-center
                                justify-between
                                gap-3
                              "
                            >
                              <div
                                className={`
                                  rounded-full
                                  px-3
                                  py-1.5
                                  text-xs
                                  font-black

                                  ${
                                    city.available
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-rose-500 text-white'
                                  }
                                `}
                              >
                                {
                                  city.available
                                    ? '● ONLINE'
                                    : '● NOT AVAILABLE'
                                }
                              </div>

                              <p
                                className={`
                                  text-xs
                                  font-black

                                  ${
                                    !city.available &&
                                    isNight
                                      ? 'text-indigo-200'
                                      : 'text-slate-500'
                                  }
                                `}
                              >
                                {
                                  city.period.icon
                                }
                                {' '}
                                {
                                  city.period.label
                                }
                              </p>
                            </div>


                            <p
                              className={`
                                mt-3
                                text-[11px]
                                font-bold

                                ${
                                  !city.available &&
                                  isNight
                                    ? 'text-indigo-200'
                                    : 'text-slate-400'
                                }
                              `}
                            >
                              参加可能：
                              {
                                city.availability[0]
                              }
                              {'–'}
                              {
                                city.availability[1]
                              }
                            </p>
                          </div>
                        );
                      }
                    )
                  }
                </div>


                {
                  !finalComplete && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setHintLevel(
                            (
                              current
                            ) =>
                              current >=
                                3
                                ? 0
                                : current +
                                  1
                          )
                        }
                        className="
                          mt-5
                          flex
                          w-full
                          items-center
                          justify-center
                          gap-2
                          rounded-2xl
                          bg-amber-50
                          py-3
                          font-black
                          text-amber-700
                        "
                      >
                        <Lightbulb
                          size={18}
                        />

                        {
                          hintLevel ===
                            0
                            ? 'ヒントを見る'
                            : hintLevel ===
                                1
                              ? 'もう1つヒント'
                              : hintLevel ===
                                  2
                                ? '最後のヒント'
                                : 'ヒントをかくす'
                        }
                      </button>


                      {
                        hintLevel ===
                          1 && (
                          <div
                            className="
                              mt-3
                              rounded-2xl
                              bg-amber-50
                              p-4
                              text-center
                              font-black
                              text-amber-800
                            "
                          >
                            💡 赤い都市を見よう。
                            「早すぎる国」と
                            「遅すぎる国」の間を探すのがコツ！
                          </div>
                        )
                      }


                      {
                        hintLevel ===
                          2 && (
                          <div
                            className="
                              mt-3
                              rounded-2xl
                              bg-amber-50
                              p-4
                              text-center
                              font-black
                              text-amber-800
                            "
                          >
                            💡 Tokyoが遅くなりすぎず、
                            New Yorkが早すぎない瞬間を探そう。
                          </div>
                        )
                      }


                      {
                        hintLevel ===
                          3 && (
                          <div
                            className="
                              mt-3
                              rounded-2xl
                              bg-amber-50
                              p-4
                              text-center
                              font-black
                              text-amber-900
                            "
                          >
                            💡 Kigaliの
                            「午後」のあたりを
                            ゆっくり探してみよう。
                          </div>
                        )
                      }
                    </>
                  )
                }
              </div>
            </div>


            {
              finalComplete && (
                <div
                  className="
                    mt-7
                    overflow-hidden
                    rounded-[34px]
                    border-2
                    border-emerald-300
                    bg-gradient-to-br
                    from-emerald-50
                    via-cyan-50
                    to-violet-50
                    p-8
                    text-center
                    shadow-xl
                  "
                >
                  <div
                    className="
                      mx-auto
                      flex
                      h-24
                      w-24
                      items-center
                      justify-center
                      rounded-full
                      bg-gradient-to-br
                      from-yellow-300
                      via-orange-400
                      to-violet-500
                      text-5xl
                      shadow-xl
                    "
                  >
                    🌍
                  </div>

                  <Sparkles
                    size={34}
                    className="
                      mx-auto
                      mt-5
                      text-amber-500
                    "
                  />

                  <p
                    className="
                      mt-2
                      text-xs
                      font-black
                      tracking-[0.22em]
                      text-emerald-600
                    "
                  >
                    GLOBAL CONNECTION ESTABLISHED
                  </p>

                  <h4
                    className="
                      mt-2
                      text-4xl
                      font-black
                      text-slate-950
                    "
                  >
                    YOU ARE A TIME MASTER!
                  </h4>

                  <p
                    className="
                      mx-auto
                      mt-4
                      max-w-3xl
                      font-bold
                      leading-8
                      text-slate-600
                    "
                  >
                    同じ瞬間でも、
                    世界の都市では時刻も日付も違います。
                    さらにParisやNew Yorkのように
                    季節で時差が変わる地域もあります。
                    世界をつなぐには、
                    「自分の時刻」だけでなく
                    相手の生活時間まで考えることが大切です。
                  </p>


                  <div
                    className="
                      mx-auto
                      mt-6
                      grid
                      max-w-3xl
                      grid-cols-2
                      gap-3
                      md:grid-cols-4
                    "
                  >
                    {
                      [
                        [
                          '⏰',
                          '時差',
                        ],

                        [
                          '📅',
                          '日付変更',
                        ],

                        [
                          '🌍',
                          '夏時間',
                        ],

                        [
                          '🤝',
                          '生活時間',
                        ],
                      ].map(
                        (
                          item
                        ) => (
                          <div
                            key={
                              item[1]
                            }
                            className="
                              rounded-2xl
                              bg-white
                              p-4
                              shadow-sm
                            "
                          >
                            <p
                              className="
                                text-3xl
                              "
                            >
                              {item[0]}
                            </p>

                            <p
                              className="
                                mt-1
                                text-sm
                                font-black
                                text-slate-800
                              "
                            >
                              {item[1]}
                            </p>
                          </div>
                        )
                      )
                    }
                  </div>


                  <p
                    className="
                      mt-6
                      text-lg
                      font-black
                      text-emerald-700
                    "
                  >
                    Kigali
                    {' '}
                    {
                      formatMinutes(
                        meetingMinutes
                      )
                    }
                    {' '}
                    で世界同時接続に成功！
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
          </>
        )
      }


      {
        dragGhost && (
          <div
            className="
              pointer-events-none
              fixed
              z-[25000]
              -translate-x-1/2
              -translate-y-1/2
              rounded-2xl
              border-2
              border-cyan-300
              bg-white
              px-6
              py-4
              text-center
              shadow-2xl
            "
            style={{
              left:
                dragGhost.x,

              top:
                dragGhost.y,
            }}
          >
            <p
              className="
                text-[10px]
                font-black
                tracking-[0.14em]
                text-cyan-600
              "
            >
              TIME CARD
            </p>

            <p
              className="
                mt-1
                text-3xl
                font-black
                text-slate-950
              "
            >
              {
                stage1Cards.find(
                  (
                    card
                  ) =>
                    card.cityId ===
                    dragGhost.cityId
                )?.time
              }
            </p>
          </div>
        )
      }
    </div>
  );
}