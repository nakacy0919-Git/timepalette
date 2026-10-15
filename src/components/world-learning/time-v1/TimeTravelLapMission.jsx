import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';

import {
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
    0.03
  );
}


function playTick(
  direction
) {
  tone({
    frequency:
      direction > 0
        ? 690
        : 500,

    duration: 0.055,
    volume: 0.045,
  });
}


function playDayChange() {
  tone({
    frequency: 440,
    duration: 0.11,
    volume: 0.06,
  });

  tone({
    frequency: 660,
    duration: 0.14,
    volume: 0.06,
    delay: 0.08,
  });
}


function playPeriodChange(
  period
) {
  const frequencies = {
    morning: 880,
    day: 760,
    evening: 590,
    night: 430,
  };

  const base =
    frequencies[
      period
    ] ??
    650;

  tone({
    frequency: base,
    duration: 0.12,
    volume: 0.055,
    type: 'sine',
  });

  tone({
    frequency:
      base + 140,

    duration: 0.15,
    volume: 0.04,
    type: 'sine',
    delay: 0.07,
  });
}


function playWrong() {
  tone({
    frequency: 220,
    duration: 0.18,
    volume: 0.045,
    type: 'sawtooth',
  });
}


function playRoundClear() {
  [
    659,
    784,
    988,
  ].forEach(
    (
      frequency,
      index
    ) => {
      tone({
        frequency,
        duration: 0.17,
        volume: 0.08,
        delay:
          index *
          0.10,
      });
    }
  );
}


function playFanfare() {
  const notes = [
    [523, 0.00, 0.17],
    [659, 0.12, 0.17],
    [784, 0.24, 0.18],
    [1047, 0.38, 0.42],
    [1319, 0.56, 0.50],
  ];

  notes.forEach(
    (
      [
        frequency,
        delay,
        duration,
      ]
    ) => {
      tone({
        frequency,
        duration,
        volume: 0.10,
        delay,
      });
    }
  );
}


const pad2 = (
  value
) =>
  String(
    value
  ).padStart(
    2,
    '0'
  );


function parseClock(
  value
) {
  const raw =
    typeof value ===
      'string'
      ? value
      : '12:00';

  const [
    rawHour,
    rawMinute,
  ] =
    raw
      .split(':')
      .map(Number);

  const hour =
    Number.isFinite(
      rawHour
    )
      ? rawHour
      : 12;

  const minute =
    Number.isFinite(
      rawMinute
    )
      ? rawMinute
      : 0;

  return {
    hour,
    minute,
  };
}

function normalizeMinutes(
  value
) {
  return (
    (
      value %
      1440
    ) +
    1440
  ) %
  1440;
}


function formatClock(
  value
) {
  const minutes =
    normalizeMinutes(
      value
    );

  const hour =
    Math.floor(
      minutes /
      60
    );

  const minute =
    minutes %
    60;

  return `${pad2(hour)}:${pad2(minute)}`;
}


function getDayShift(
  value
) {
  if (
    value <
    0
  ) {
    return -1;
  }

  if (
    value >=
    1440
  ) {
    return 1;
  }

  return 0;
}


function dayLabel(
  shift
) {
  if (
    shift >
    0
  ) {
    return '次の日';
  }

  if (
    shift <
    0
  ) {
    return '前の日';
  }

  return '同じ日';
}


function getDayPeriodTheme(
  totalMinutes
) {
  const normalized =
    normalizeMinutes(
      totalMinutes
    );

  const hour =
    Math.floor(
      normalized /
      60
    );

  if (
    hour >= 5 &&
    hour < 9
  ) {
    return {
      id: 'morning',
      label: '朝',
      icon: '🌅',

      background:
        'linear-gradient(145deg, #fffdf8 0%, #fff7ed 42%, #dbeafe 100%)',

      border:
        '#fbbf24',

      text:
        '#78350f',

      subtext:
        '#92400e',

      glow:
        'rgba(251,191,36,.25)',
    };
  }

  if (
    hour >= 9 &&
    hour < 16
  ) {
    return {
      id: 'day',
      label: '昼',
      icon: '☀️',

      background:
        'linear-gradient(145deg, #f0f9ff 0%, #ffffff 45%, #bfdbfe 100%)',

      border:
        '#60a5fa',

      text:
        '#0f172a',

      subtext:
        '#2563eb',

      glow:
        'rgba(56,189,248,.22)',
    };
  }

  if (
    hour >= 16 &&
    hour < 19
  ) {
    return {
      id: 'evening',
      label: '夕方',
      icon: '🌇',

      background:
        'linear-gradient(145deg, #ffedd5 0%, #fecdd3 45%, #ddd6fe 100%)',

      border:
        '#fb923c',

      text:
        '#7c2d12',

      subtext:
        '#c2410c',

      glow:
        'rgba(249,115,22,.25)',
    };
  }

  return {
    id: 'night',
    label: '夜',
    icon: '🌙',

    background:
      'linear-gradient(145deg, #172554 0%, #1e293b 48%, #312e81 100%)',

    border:
      '#818cf8',

    text:
      '#ffffff',

    subtext:
      '#c7d2fe',

    glow:
      'rgba(99,102,241,.30)',
  };
}



function CountryFlag({
  code,
  large = false,
}) {
  const width =
    large
      ? 38
      : 28;

  const height =
    large
      ? 26
      : 19;


  if (
    code ===
    'rw'
  ) {
    return (
      <svg
        viewBox="0 0 36 24"
        width={width}
        height={height}
        role="img"
        aria-label="ルワンダ国旗"
        className="
          shrink-0
          overflow-hidden
          rounded-[4px]
          shadow-sm
          ring-1
          ring-black/10
        "
      >
        <rect
          x="0"
          y="0"
          width="36"
          height="12"
          fill="#00A1DE"
        />

        <rect
          x="0"
          y="12"
          width="36"
          height="6"
          fill="#FAD201"
        />

        <rect
          x="0"
          y="18"
          width="36"
          height="6"
          fill="#20603D"
        />

        <g
          stroke="#E5BE01"
          strokeWidth="0.75"
          strokeLinecap="round"
        >
          <line
            x1="29"
            y1="1.0"
            x2="29"
            y2="2.4"
          />

          <line
            x1="29"
            y1="8.5"
            x2="29"
            y2="9.9"
          />

          <line
            x1="24.7"
            y1="5.5"
            x2="26.1"
            y2="5.5"
          />

          <line
            x1="31.9"
            y1="5.5"
            x2="33.3"
            y2="5.5"
          />

          <line
            x1="25.9"
            y1="2.4"
            x2="26.9"
            y2="3.4"
          />

          <line
            x1="31.1"
            y1="7.6"
            x2="32.1"
            y2="8.6"
          />

          <line
            x1="32.1"
            y1="2.4"
            x2="31.1"
            y2="3.4"
          />

          <line
            x1="26.9"
            y1="7.6"
            x2="25.9"
            y2="8.6"
          />
        </g>

        <circle
          cx="29"
          cy="5.5"
          r="2.35"
          fill="#E5BE01"
        />
      </svg>
    );
  }


  return (
    <svg
      viewBox="0 0 36 24"
      width={width}
      height={height}
      role="img"
      aria-label="日本国旗"
      className="
        shrink-0
        overflow-hidden
        rounded-[4px]
        bg-white
        shadow-sm
        ring-1
        ring-black/10
      "
    >
      <rect
        x="0"
        y="0"
        width="36"
        height="24"
        fill="#ffffff"
      />

      <circle
        cx="18"
        cy="12"
        r="6.2"
        fill="#BC002D"
      />
    </svg>
  );
}

function ClockFace({
  totalMinutes,
  interactive = false,
  onStep,
}) {
  const svgRef =
    useRef(null);

  const dragRef =
    useRef({
      active: false,
      lastAngle: null,
      carry: 0,
    });


  const normalized =
    normalizeMinutes(
      totalMinutes
    );

  const hour =
    Math.floor(
      normalized /
      60
    );

  const minute =
    normalized %
    60;

  const hourAngle =
    (
      (
        hour %
        12
      ) +
      minute /
        60
    ) *
    30;

  const minuteAngle =
    minute *
    6;


  const getAngle =
    (
      event
    ) => {
      const rect =
        svgRef.current
          ?.getBoundingClientRect();

      if (!rect) {
        return 0;
      }

      const x =
        event.clientX -
        (
          rect.left +
          rect.width /
          2
        );

      const y =
        event.clientY -
        (
          rect.top +
          rect.height /
          2
        );

      let angle =
        Math.atan2(
          x,
          -y
        ) *
        180 /
        Math.PI;

      if (
        angle <
        0
      ) {
        angle +=
          360;
      }

      return angle;
    };


  const handleMove =
    (
      event
    ) => {
      if (
        !interactive ||
        !dragRef.current.active
      ) {
        return;
      }

      const angle =
        getAngle(
          event
        );

      const previous =
        dragRef.current
          .lastAngle;

      if (
        previous ===
        null
      ) {
        dragRef.current.lastAngle =
          angle;

        return;
      }

      let delta =
        angle -
        previous;

      if (
        delta >
        180
      ) {
        delta -=
          360;
      }

      if (
        delta <
        -180
      ) {
        delta +=
          360;
      }

      dragRef.current.lastAngle =
        angle;

      dragRef.current.carry +=
        delta;

      while (
        dragRef.current.carry >=
        24
      ) {
        onStep?.(1);

        dragRef.current.carry -=
          30;
      }

      while (
        dragRef.current.carry <=
        -24
      ) {
        onStep?.(-1);

        dragRef.current.carry +=
          30;
      }
    };


  return (
    <svg
      ref={
        svgRef
      }
      viewBox="0 0 260 260"
      className={`
        mx-auto
        w-full
        max-w-[260px]
        select-none

        ${
          interactive
            ? 'cursor-grab touch-none active:cursor-grabbing'
            : ''
        }
      `}
      onPointerDown={
        (
          event
        ) => {
          if (
            !interactive
          ) {
            return;
          }

          event
            .currentTarget
            .setPointerCapture?.(
              event.pointerId
            );

          dragRef.current = {
            active:
              true,

            lastAngle:
              getAngle(
                event
              ),

            carry:
              0,
          };
        }
      }
      onPointerMove={
        handleMove
      }
      onPointerUp={() => {
        dragRef.current.active =
          false;

        dragRef.current.lastAngle =
          null;

        dragRef.current.carry =
          0;
      }}
      onPointerCancel={() => {
        dragRef.current.active =
          false;

        dragRef.current.lastAngle =
          null;

        dragRef.current.carry =
          0;
      }}
    >
      <circle
        cx="130"
        cy="130"
        r="118"
        fill="#ffffff"
        stroke={
          interactive
            ? '#2563eb'
            : '#cbd5e1'
        }
        strokeWidth="6"
      />

      {
        Array.from(
          {
            length: 60,
          },
          (
            _,
            index
          ) => {
            const angle =
              index *
              6 *
              Math.PI /
              180;

            const major =
              index %
                5 ===
              0;

            const inner =
              major
                ? 101
                : 107;

            const outer =
              113;

            return (
              <line
                key={
                  index
                }
                x1={
                  130 +
                  Math.sin(
                    angle
                  ) *
                  inner
                }
                y1={
                  130 -
                  Math.cos(
                    angle
                  ) *
                  inner
                }
                x2={
                  130 +
                  Math.sin(
                    angle
                  ) *
                  outer
                }
                y2={
                  130 -
                  Math.cos(
                    angle
                  ) *
                  outer
                }
                stroke={
                  major
                    ? '#64748b'
                    : '#cbd5e1'
                }
                strokeWidth={
                  major
                    ? 2
                    : 1
                }
              />
            );
          }
        )
      }

      {
        Array.from(
          {
            length: 12,
          },
          (
            _,
            index
          ) => {
            const number =
              index +
              1;

            const angle =
              (
                number *
                  30 -
                90
              ) *
              Math.PI /
              180;

            const x =
              130 +
              Math.cos(
                angle
              ) *
              86;

            const y =
              130 +
              Math.sin(
                angle
              ) *
              86;

            return (
              <text
                key={
                  number
                }
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="16"
                fontWeight="900"
                fill="#334155"
              >
                {number}
              </text>
            );
          }
        )
      }

      <line
        x1="130"
        y1="130"
        x2="130"
        y2="52"
        stroke="#475569"
        strokeWidth="5"
        strokeLinecap="round"
        transform={
          `rotate(${minuteAngle} 130 130)`
        }
      />

      <line
        x1="130"
        y1="130"
        x2="130"
        y2="80"
        stroke={
          interactive
            ? '#2563eb'
            : '#0f172a'
        }
        strokeWidth="10"
        strokeLinecap="round"
        transform={
          `rotate(${hourAngle} 130 130)`
        }
      />

      {
        interactive && (
          <circle
            cx="130"
            cy="80"
            r="11"
            fill="#2563eb"
            transform={
              `rotate(${hourAngle} 130 130)`
            }
          />
        )
      }

      <circle
        cx="130"
        cy="130"
        r="10"
        fill={
          interactive
            ? '#2563eb'
            : '#0f172a'
        }
      />

      <circle
        cx="130"
        cy="130"
        r="3"
        fill="white"
      />
    </svg>
  );
}


function TimeSkyCard({
  totalMinutes,
  country,
  countryCode,
  flag,
  subtitle,
  interactive = false,
  onStep,
}) {
  const theme =
    getDayPeriodTheme(
      totalMinutes
    );

  const shift =
    getDayShift(
      totalMinutes
    );

  const isNight =
    theme.id ===
    'night';

  const displaySubtitle =
    String(
      subtitle ??
      ''
    ).replace(
      /^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u,
      ''
    );


  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-[30px]
        border-2
        p-5
        text-center
        shadow-lg
      "
      style={{
        background:
          theme.background,

        borderColor:
          theme.border,

        boxShadow:
          `0 18px 45px ${theme.glow}`,

        transition:
          'background 650ms ease, border-color 650ms ease, box-shadow 650ms ease',
      }}
    >
      <div
        className="
          pointer-events-none
          absolute
          right-5
          top-4
          text-5xl
          opacity-20
          transition-all
          duration-500
        "
      >
        {theme.icon}
      </div>

      {
        isNight && (
          <>
            <span
              className="
                pointer-events-none
                absolute
                left-[10%]
                top-[18%]
                text-white/70
              "
            >
              ✦
            </span>

            <span
              className="
                pointer-events-none
                absolute
                right-[18%]
                top-[32%]
                text-white/60
              "
            >
              ✧
            </span>

            <span
              className="
                pointer-events-none
                absolute
                left-[20%]
                top-[42%]
                text-white/60
              "
            >
              ✦
            </span>
          </>
        )
      }

      <div
        className="
          relative
          z-10
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-2
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <CountryFlag
              code={
                countryCode
              }
            />

            <p
              className="
                text-xs
                font-black
                tracking-[0.18em]
              "
              style={{
                color:
                  theme.text,
              }}
            >
              {country}
            </p>
          </div>

          <span
            className="
              rounded-full
              bg-white/80
              px-3
              py-1
              text-xs
              font-black
              text-slate-700
              shadow-sm
              backdrop-blur
            "
          >
            {theme.icon}
            {' '}
            {theme.label}
          </span>
        </div>

        <div
          className="
            mt-3
          "
        >
          <ClockFace
            totalMinutes={
              totalMinutes
            }
            interactive={
              interactive
            }
            onStep={
              onStep
            }
          />
        </div>

        <p
          className="
            mt-2
            text-3xl
            font-black
          "
          style={{
            color:
              theme.text,
          }}
        >
          {
            formatClock(
              totalMinutes
            )
          }
        </p>

        <div
          className="
            mt-2
            flex
            flex-wrap
            items-center
            justify-center
            gap-2
          "
        >
          {
            shift !==
              0 && (
              <span
                className="
                  rounded-full
                  bg-indigo-100
                  px-3
                  py-1
                  text-xs
                  font-black
                  text-indigo-700
                "
              >
                📅 {
                  dayLabel(
                    shift
                  )
                }
              </span>
            )
          }

          {
            interactive && (
              <span
                className="
                  rounded-full
                  bg-white/75
                  px-3
                  py-1
                  text-xs
                  font-black
                  text-blue-700
                  backdrop-blur
                "
              >
                👆 短い針をドラッグ
              </span>
            )
          }
        </div>

        <div
          className="
            mt-4
            inline-flex
            items-center
            gap-3
            rounded-full
            bg-white/90
            px-5
            py-2.5
            shadow-md
            backdrop-blur
          "
        >
          <CountryFlag
            code={
              countryCode
            }
            large
          />

          <span
            className="
              text-sm
              font-black
              text-slate-800
              md:text-base
            "
          >
            {displaySubtitle}
          </span>
        </div>
      </div>
    </div>
  );
}


function Confetti() {
  return (
    <>
      <style>
        {`
          @keyframes time-final-confetti {
            0% {
              transform:
                translate3d(0,-12vh,0)
                rotate(0deg);
              opacity: 1;
            }

            100% {
              transform:
                translate3d(
                  var(--drift),
                  112vh,
                  0
                )
                rotate(900deg);
              opacity: 0;
            }
          }

          @keyframes time-final-pop {
            0% {
              transform: scale(.6);
              opacity: 0;
            }

            70% {
              transform: scale(1.08);
              opacity: 1;
            }

            100% {
              transform: scale(1);
              opacity: 1;
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
              length: 90,
            },
            (
              _,
              index
            ) => {
              const colors = [
                '#f97316',
                '#facc15',
                '#22c55e',
                '#3b82f6',
                '#ec4899',
                '#8b5cf6',
              ];

              return (
                <span
                  key={
                    index
                  }
                  className="
                    absolute
                    -top-8
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
                      colors[
                        index %
                        colors.length
                      ],

                    '--drift':
                      `${
                        (
                          index %
                            2 ===
                          0
                            ? -1
                            : 1
                        ) *
                        (
                          35 +
                          (
                            index %
                            8
                          ) *
                          9
                        )
                      }px`,

                    animation:
                      `time-final-confetti ${
                        1.8 +
                        (
                          index %
                          8
                        ) *
                        0.12
                      }s linear ${
                        (
                          index %
                          14
                        ) *
                        0.035
                      }s forwards`,
                  }}
                />
              );
            }
          )
        }
      </div>
    </>
  );
}


export default function TimeTravelLapMission({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const rounds =
    mission
      ?.challenge
      ?.rounds ??
    [];

  const [
    roundIndex,
    setRoundIndex,
  ] =
    useState(
      0
    );

  const [
    steps,
    setSteps,
  ] =
    useState(
      0
    );

  const [
    result,
    setResult,
  ] =
    useState(
      null
    );

  const [
    completedRounds,
    setCompletedRounds,
  ] =
    useState(
      []
    );

  const [
    hintLevel,
    setHintLevel,
  ] =
    useState(
      0
    );

  const [
    finished,
    setFinished,
  ] =
    useState(
      false
    );


  const round =
    rounds[
      roundIndex
    ];

  if (!round) {
    return null;
  }


  const kigali =
    parseClock(
      round.kigaliTime
    );

  const sourceMinutes =
    kigali.hour *
      60 +
    kigali.minute;

  const selectedMinutes =
    sourceMinutes +
    steps *
      60;

  const correctMinutes =
    sourceMinutes +
    7 *
      60;

  const correctDayShift =
    getDayShift(
      correctMinutes
    );

  const sourceClock =
    formatClock(
      sourceMinutes
    );

  const selectedClock =
    formatClock(
      selectedMinutes
    );

  const correctClock =
    formatClock(
      correctMinutes
    );


  const handleStep =
    (
      direction
    ) => {
      setResult(
        null
      );

      setSteps(
        (
          current
        ) => {
          const next =
            Math.max(
              -12,
              Math.min(
                12,
                current +
                direction
              )
            );

          if (
            next ===
            current
          ) {
            return current;
          }

          playTick(
            direction
          );

          const before =
            sourceMinutes +
            current *
              60;

          const after =
            sourceMinutes +
            next *
              60;

          if (
            getDayShift(
              before
            ) !==
            getDayShift(
              after
            )
          ) {
            window.setTimeout(
              playDayChange,
              20
            );
          }

          const beforeTheme =
            getDayPeriodTheme(
              before
            );

          const afterTheme =
            getDayPeriodTheme(
              after
            );

          if (
            beforeTheme.id !==
            afterTheme.id
          ) {
            window.setTimeout(
              () =>
                playPeriodChange(
                  afterTheme.id
                ),
              30
            );
          }

          return next;
        }
      );
    };


  const check =
    () => {
      const correct =
        steps ===
        7;

      setResult(
        correct
      );

      if (
        !correct
      ) {
        playWrong();
        return;
      }

      const nextCompleted = [
        ...completedRounds,
        roundIndex,
      ];

      setCompletedRounds(
        nextCompleted
      );

      if (
        roundIndex ===
        rounds.length -
          1
      ) {
        setFinished(
          true
        );

        playFanfare();

        onComplete?.(
          mission
        );

        return;
      }

      playRoundClear();
    };


  const nextRound =
    () => {
      setRoundIndex(
        (
          current
        ) =>
          current +
          1
      );

      setSteps(
        0
      );

      setResult(
        null
      );

      setHintLevel(
        0
      );
    };


  if (
    finished
  ) {
    return (
      <div
        className="
          relative
          min-h-[520px]
          overflow-hidden
          rounded-[34px]
          bg-gradient-to-br
          from-blue-50
          via-white
          to-amber-50
          p-8
          text-center
        "
      >
        <Confetti />

        <div
          style={{
            animation:
              'time-final-pop .45s ease-out',
          }}
          className="
            mx-auto
            max-w-2xl
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
              to-orange-500
              text-5xl
              shadow-xl
            "
          >
            🏆
          </div>

          <p
            className="
              mt-6
              text-xs
              font-black
              tracking-[0.22em]
              text-blue-600
            "
          >
            3 ROUNDS COMPLETE
          </p>

          <h2
            className="
              mt-2
              text-4xl
              font-black
              text-slate-950
              md:text-5xl
            "
          >
            TIME MASTER!
          </h2>

          <p
            className="
              mt-4
              text-lg
              font-black
              text-slate-700
            "
          >
            キガリの時刻から、
            日本の時刻を作れたね！
          </p>

          <div
            className="
              mt-7
              grid
              grid-cols-1
              gap-3
              sm:grid-cols-3
            "
          >
            {
              rounds.map(
                (
                  item,
                  index
                ) => {
                  const value =
                    parseClock(
                      item.kigaliTime
                    );

                  const minutes =
                    value.hour *
                      60 +
                    value.minute;

                  return (
                    <div
                      key={
                        index
                      }
                      className="
                        rounded-2xl
                        bg-white
                        p-4
                        shadow
                      "
                    >
                      <p
                        className="
                          text-xs
                          font-black
                          text-blue-500
                        "
                      >
                        ROUND {
                          index +
                          1
                        }
                      </p>

                      <p
                        className="
                          mt-2
                          text-sm
                          font-black
                        "
                      >
                        🇷🇼 {
                          item.kigaliTime
                        }
                      </p>

                      <p
                        className="
                          my-1
                          text-slate-400
                        "
                      >
                        ↓
                      </p>

                      <p
                        className="
                          text-lg
                          font-black
                          text-emerald-700
                        "
                      >
                        🇯🇵 {
                          formatClock(
                            minutes +
                            420
                          )
                        }
                      </p>
                    </div>
                  );
                }
              )
            }
          </div>

          {
            alreadyCompleted && (
              <p
                className="
                  mt-5
                  text-xs
                  font-bold
                  text-slate-400
                "
              >
                このMissionは
                クリア済みです。
              </p>
            )
          }
        </div>
      </div>
    );
  }


  return (
    <div>
      <div
        className="
          rounded-[28px]
          border
          border-blue-200
          bg-gradient-to-r
          from-blue-50
          to-sky-50
          p-5
          md:p-6
        "
      >
        <div
          className="
            flex
            flex-wrap
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
                tracking-[0.2em]
                text-blue-600
              "
            >
              KIGALI → JAPAN
            </p>

            <h3
              className="
                mt-1
                text-2xl
                font-black
                text-slate-950
              "
            >
              日本の時計を作ろう！
            </h3>

            <p
              className="
                mt-2
                text-sm
                font-bold
                leading-6
                text-slate-600
              "
            >
              左のキガリの時計を見て、
              右の日本の
              <strong>
                短い針
              </strong>
              を動かそう。
              日本では何時かな？
            </p>
          </div>

          <div
            className="
              rounded-2xl
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
                tracking-[0.16em]
                text-slate-400
              "
            >
              ROUND
            </p>

            <p
              className="
                text-2xl
                font-black
                text-blue-600
              "
            >
              {
                roundIndex +
                1
              }
              {' / '}
              {
                rounds.length
              }
            </p>
          </div>
        </div>

        <div
          className="
            mt-5
            flex
            gap-2
          "
        >
          {
            rounds.map(
              (
                _,
                index
              ) => (
                <div
                  key={
                    index
                  }
                  className={`
                    h-3
                    flex-1
                    rounded-full
                    transition-all

                    ${
                      completedRounds.includes(
                        index
                      )
                        ? 'bg-emerald-500'
                        : index ===
                            roundIndex
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


      <div
        className="
          mt-6
          grid
          grid-cols-1
          gap-5
          lg:grid-cols-[1fr_auto_1fr]
          lg:items-center
        "
      >
        <TimeSkyCard
          totalMinutes={
            sourceMinutes
          }
          country="KIGALI"
          countryCode="rw"
          flag="🇷🇼"
          subtitle="ルワンダ・キガリ"
        />


        <div
          className="
            hidden
            text-center
            lg:block
          "
        >
          <ArrowRight
            size={40}
            strokeWidth={3}
            className="
              mx-auto
              text-blue-500
            "
          />

          <p
            className="
              mt-1
              text-xs
              font-black
              text-blue-600
            "
          >
            日本は何時？
          </p>
        </div>


        <TimeSkyCard
          totalMinutes={
            selectedMinutes
          }
          country="JAPAN"
          countryCode="jp"
          flag="🇯🇵"
          subtitle="日本・東京"
          interactive
          onStep={
            handleStep
          }
        />
      </div>


      <div
        className="
          mt-5
          rounded-[24px]
          border
          border-slate-200
          bg-slate-50
          p-4
        "
      >
        <div
          className="
            flex
            flex-wrap
            items-center
            justify-between
            gap-3
          "
        >
          <div>
            <p
              className="
                text-[10px]
                font-black
                tracking-[0.15em]
                text-slate-400
              "
            >
              YOU MOVED THE CLOCK
            </p>

            <p
              className="
                mt-1
                text-xl
                font-black
                text-slate-800
              "
            >
              {
                steps ===
                0
                  ? 'まだ動かしていません'
                  : steps >
                      0
                    ? `＋${steps}時間`
                    : `${steps}時間`
              }
            </p>
          </div>

          <div
            className="
              rounded-2xl
              bg-white
              px-4
              py-2
              text-xs
              font-bold
              text-slate-500
              shadow-sm
            "
          >
            自分で考えてみよう 🧠
          </div>
        </div>
      </div>


      {
        getDayShift(
          selectedMinutes
        ) >
          0 && (
          <div
            className="
              mt-4
              rounded-2xl
              bg-indigo-50
              p-4
              text-center
            "
          >
            <p
              className="
                font-black
                text-indigo-700
              "
            >
              🌙 0時をこえた！
              日本では
              「次の日」になったよ。
            </p>
          </div>
        )
      }


      <button
        type="button"
        onClick={() =>
          setHintLevel(
            (
              current
            ) =>
              current >=
                2
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
          text-sm
          font-black
          text-amber-700
          transition
          hover:bg-amber-100
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
              border
              border-amber-200
              bg-amber-50
              p-4
              text-center
              font-black
              text-amber-800
            "
          >
            💡 🇯🇵 日本・東京は、
            キガリより
            <strong>
              先に進んでいる
            </strong>
            よ。
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
              border
              border-amber-300
              bg-amber-50
              p-4
              text-center
            "
          >
            <p
              className="
                font-black
                text-amber-900
              "
            >
              💡 日本はキガリより
              7時間進んでいます。
            </p>

            <p
              className="
                mt-1
                text-sm
                font-bold
                text-amber-700
              "
            >
              時計を右へ
              7時間進めてみよう。
            </p>
          </div>
        )
      }


      {
        result ===
        false && (
          <div
            className="
              mt-5
              rounded-3xl
              border
              border-orange-200
              bg-orange-50
              p-5
            "
          >
            <p
              className="
                font-black
                text-orange-800
              "
            >
              👀 おしい！
            </p>

            <p
              className="
                mt-1
                text-sm
                font-bold
                text-orange-700
              "
            >
              今は
              {
                steps >
                0
                  ? `＋${steps}`
                  : steps
              }
              時間動かしています。
              ヒントも使えるよ。
            </p>

            <button
              type="button"
              onClick={() => {
                setSteps(0);
                setResult(null);
              }}
              className="
                mt-3
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-white
                px-4
                py-2
                text-sm
                font-black
                text-slate-600
              "
            >
              <RotateCcw
                size={17}
              />

              やり直す
            </button>
          </div>
        )
      }


      {
        result ===
        true && (
          <div
            style={{
              animation:
                'time-final-pop .35s ease-out',
            }}
            className="
              mt-5
              rounded-[28px]
              border-2
              border-emerald-300
              bg-emerald-50
              p-6
              text-center
            "
          >
            <CheckCircle2
              size={38}
              className="
                mx-auto
                text-emerald-600
              "
            />

            <p
              className="
                mt-2
                text-2xl
                font-black
                text-emerald-800
              "
            >
              ROUND {
                roundIndex +
                1
              } CLEAR! ⭐
            </p>

            <p
              className="
                mt-2
                font-black
                text-emerald-700
              "
            >
              キガリ {
                sourceClock
              }
              {' → '}
              日本 {
                correctClock
              }
              {' · '}
              {
                dayLabel(
                  correctDayShift
                )
              }
            </p>

            <button
              type="button"
              onClick={
                nextRound
              }
              className="
                mt-5
                inline-flex
                items-center
                gap-2
                rounded-2xl
                bg-emerald-600
                px-6
                py-3
                font-black
                text-white
                shadow-lg
                transition
                hover:scale-105
              "
            >
              次のROUNDへ

              <ArrowRight
                size={18}
              />
            </button>
          </div>
        )
      }


      {
        result !==
          true && (
          <button
            type="button"
            onClick={
              check
            }
            className="
              mt-6
              w-full
              rounded-2xl
              bg-slate-950
              py-4
              text-lg
              font-black
              text-white
              shadow-lg
              transition
              hover:bg-blue-600
            "
          >
            この時刻でOK！
          </button>
        )
      }
    </div>
  );
}