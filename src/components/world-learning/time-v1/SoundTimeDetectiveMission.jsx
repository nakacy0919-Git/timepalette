import {
  ArrowRight,
  CheckCircle2,
  Headphones,
  Lightbulb,
  Play,
  Sparkles,
  Volume2,
} from 'lucide-react';

import {
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


function note({
  frequency,
  delay = 0,
  duration = 0.08,
  volume = 0.04,
  type = 'sine',
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
    0.0001,
    start + duration
  );

  oscillator.connect(
    gain
  );

  gain.connect(
    context.destination
  );

  oscillator.start(
    start
  );

  oscillator.stop(
    start +
    duration +
    0.03
  );
}


function sweep({
  from,
  to,
  delay = 0,
  duration = 0.2,
  volume = 0.035,
  type = 'sine',
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
    from,
    start
  );

  oscillator.frequency.exponentialRampToValueAtTime(
    to,
    start + duration
  );

  gain.gain.setValueAtTime(
    0.0001,
    start
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    start + 0.015
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    start + duration
  );

  oscillator.connect(
    gain
  );

  gain.connect(
    context.destination
  );

  oscillator.start(
    start
  );

  oscillator.stop(
    start +
    duration +
    0.03
  );
}


function playMorning() {
  [
    0,
    0.19,
    0.38,
    0.66,
    0.84,
  ].forEach(
    (
      delay,
      index
    ) => {
      sweep({
        from:
          1250 +
          index *
            80,

        to:
          1750 +
          index *
            120,

        delay,

        duration:
          0.09,

        volume:
          0.026,
      });
    }
  );

  sweep({
    from: 520,
    to: 780,
    delay: 0.08,
    duration: 0.28,
    volume: 0.03,
    type: 'triangle',
  });

  sweep({
    from: 720,
    to: 430,
    delay: 0.36,
    duration: 0.30,
    volume: 0.028,
    type: 'triangle',
  });
}


function playDaytime() {
  note({
    frequency: 660,
    delay: 0,
    duration: 0.20,
    volume: 0.04,
    type: 'triangle',
  });

  note({
    frequency: 880,
    delay: 0.18,
    duration: 0.24,
    volume: 0.04,
    type: 'triangle',
  });

  [
    0.52,
    0.66,
    0.82,
  ].forEach(
    (
      delay,
      index
    ) => {
      note({
        frequency:
          390 +
          index *
            45,

        delay,

        duration:
          0.07,

        volume:
          0.024,

        type:
          'square',
      });
    }
  );

  note({
    frequency: 520,
    delay: 1.00,
    duration: 0.08,
    volume: 0.026,
  });

  note({
    frequency: 620,
    delay: 1.12,
    duration: 0.08,
    volume: 0.026,
  });
}


function playEvening() {
  [
    [440, 0.00],
    [554, 0.14],
    [659, 0.28],
  ].forEach(
    (
      [
        frequency,
        delay,
      ]
    ) => {
      note({
        frequency,
        delay,
        duration: 0.18,
        volume: 0.034,
        type: 'triangle',
      });
    }
  );

  [
    0.62,
    0.78,
    0.94,
  ].forEach(
    (
      delay,
      index
    ) => {
      note({
        frequency:
          970 +
          index *
            170,

        delay,

        duration:
          0.045,

        volume:
          0.018,

        type:
          'square',
      });
    }
  );
}


function playNight() {
  [
    0.00,
    0.10,
    0.26,
    0.38,
    0.62,
    0.73,
    0.98,
    1.09,
  ].forEach(
    (
      delay,
      index
    ) => {
      note({
        frequency:
          index %
            2 ===
            0
            ? 1800
            : 2050,

        delay,

        duration:
          0.035,

        volume:
          0.014,
      });
    }
  );

  sweep({
    from: 155,
    to: 95,
    delay: 0,
    duration: 1.30,
    volume: 0.012,
    type: 'sine',
  });
}


function playSoundscape(
  id
) {
  if (
    id ===
    'morning'
  ) {
    playMorning();
  }
  else if (
    id ===
    'daytime'
  ) {
    playDaytime();
  }
  else if (
    id ===
    'evening'
  ) {
    playEvening();
  }
  else {
    playNight();
  }
}


function playCorrect() {
  note({
    frequency: 659,
    duration: 0.11,
    volume: 0.055,
    type: 'triangle',
  });

  note({
    frequency: 880,
    delay: 0.09,
    duration: 0.14,
    volume: 0.065,
    type: 'triangle',
  });

  note({
    frequency: 1047,
    delay: 0.20,
    duration: 0.22,
    volume: 0.07,
    type: 'triangle',
  });
}


function playWrong() {
  note({
    frequency: 175,
    duration: 0.18,
    volume: 0.055,
    type: 'sawtooth',
  });

  note({
    frequency: 125,
    delay: 0.10,
    duration: 0.18,
    volume: 0.045,
    type: 'sawtooth',
  });
}


function playFinal() {
  [
    [523, 0.00],
    [659, 0.10],
    [784, 0.20],
    [1047, 0.32],
    [1319, 0.47],
    [1568, 0.64],
  ].forEach(
    (
      [
        frequency,
        delay,
      ],
      index
    ) => {
      note({
        frequency,
        delay,
        duration:
          index >=
            4
            ? 0.42
            : 0.17,

        volume:
          0.08,

        type:
          'triangle',
      });
    }
  );
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

  return Object.fromEntries(
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
          Number(
            part.value
          ),
        ]
      )
  );
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
    hour,
    minute,
  };
}


function instantFromBase(
  referenceDate,
  timeZone,
  localTime
) {
  const dateParts =
    getZoneParts(
      referenceDate,
      timeZone
    );

  const time =
    parseTime(
      localTime
    );

  const localAsUtc =
    Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      time.hour,
      time.minute,
      0
    );

  const probe =
    new Date(
      localAsUtc
    );

  const offset =
    getOffsetMinutes(
      probe,
      timeZone
    );

  return new Date(
    localAsUtc -
    offset *
      60000
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


function getBand(
  date,
  timeZone
) {
  const parts =
    getZoneParts(
      date,
      timeZone
    );

  const hour =
    parts.hour;

  if (
    hour >= 5 &&
    hour < 10
  ) {
    return 'morning';
  }

  if (
    hour >= 10 &&
    hour < 17
  ) {
    return 'daytime';
  }

  if (
    hour >= 17 &&
    hour < 21
  ) {
    return 'evening';
  }

  return 'night';
}


const SOUND_META = {
  morning: {
    icon: '🌅',
    title: '朝のサウンド',
    subtitle: 'Morning',
    hint: '鳥の声や、朝が始まるような音',
    gradient:
      'from-amber-100 via-orange-50 to-sky-100',
    accent:
      'text-orange-600',
    emoji:
      '🐦',
  },

  daytime: {
    icon: '☀️',
    title: '昼のサウンド',
    subtitle: 'Daytime',
    hint: '学校や町が動いているような音',
    gradient:
      'from-sky-100 via-blue-50 to-cyan-100',
    accent:
      'text-blue-600',
    emoji:
      '🏫',
  },

  evening: {
    icon: '🌇',
    title: '夕方のサウンド',
    subtitle: 'Evening',
    hint: '家に帰り、夕食が始まりそうな音',
    gradient:
      'from-orange-100 via-pink-100 to-violet-100',
    accent:
      'text-violet-600',
    emoji:
      '🍽️',
  },

  night: {
    icon: '🌙',
    title: '夜のサウンド',
    subtitle: 'Night',
    hint: '静かな夜や虫の音',
    gradient:
      'from-slate-800 via-indigo-950 to-violet-950',
    accent:
      'text-indigo-200',
    emoji:
      '✨',
  },
};


function FlagIcon({
  code,
}) {
  const common = {
    width: 46,
    height: 31,
    viewBox: '0 0 46 31',
    className:
      'rounded-md shadow-sm ring-1 ring-black/10',
  };


  if (
    code ===
    'jp'
  ) {
    return (
      <svg {...common}>
        <rect
          width="46"
          height="31"
          fill="#fff"
        />

        <circle
          cx="23"
          cy="15.5"
          r="7.7"
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
          width="15.34"
          height="31"
          fill="#0055A4"
        />

        <rect
          x="15.33"
          width="15.34"
          height="31"
          fill="#fff"
        />

        <rect
          x="30.66"
          width="15.34"
          height="31"
          fill="#EF4135"
        />
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
          width="46"
          height="10"
          fill="#000"
        />

        <rect
          y="10"
          width="46"
          height="2"
          fill="#fff"
        />

        <rect
          y="12"
          width="46"
          height="7"
          fill="#BB0000"
        />

        <rect
          y="19"
          width="46"
          height="2"
          fill="#fff"
        />

        <rect
          y="21"
          width="46"
          height="10"
          fill="#006600"
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
          width="46"
          height="31"
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
                  31 /
                  7
                }
                width="46"
                height={
                  31 /
                  14
                }
                fill="#B22234"
              />
            )
          )
        }

        <rect
          width="20"
          height="17"
          fill="#3C3B6E"
        />
      </svg>
    );
  }


  return (
    <svg {...common}>
      <rect
        width="46"
        height="15.5"
        fill="#00A1DE"
      />

      <rect
        y="15.5"
        width="46"
        height="7.75"
        fill="#FAD201"
      />

      <rect
        y="23.25"
        width="46"
        height="7.75"
        fill="#20603D"
      />

      <circle
        cx="37"
        cy="7"
        r="3.5"
        fill="#E5BE01"
      />
    </svg>
  );
}


function Confetti() {
  return (
    <>
      <style>
        {`
          @keyframes sound-confetti {
            from {
              transform:
                translateY(-10vh)
                rotate(0deg);
              opacity: 1;
            }

            to {
              transform:
                translate3d(
                  var(--x),
                  110vh,
                  0
                )
                rotate(900deg);
              opacity: 0;
            }
          }
        `}
      </style>

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-[25000]
          overflow-hidden
        "
      >
        {
          Array.from(
            {
              length: 75,
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
                        30 +
                        index %
                          8 *
                          8
                      )
                    }px`,

                  animation:
                    `sound-confetti ${
                      1.7 +
                      index %
                        8 *
                        0.12
                    }s linear ${
                      index %
                        10 *
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


function SoundCard({
  id,
  playing,
  correct,
  wrong,
  disabled,
  onPlay,
  onAnswer,
}) {
  const meta =
    SOUND_META[id];

  const dark =
    id ===
    'night';

  return (
    <div
      className={`
        relative
        overflow-hidden
        rounded-[28px]
        border-2
        bg-gradient-to-br
        p-5
        transition-all
        duration-300

        ${meta.gradient}

        ${
          correct
            ? 'border-emerald-400 ring-4 ring-emerald-100'
            : wrong
              ? 'border-red-400 ring-4 ring-red-100'
              : 'border-white shadow-lg hover:-translate-y-1 hover:shadow-xl'
        }
      `}
      style={
        wrong
          ? {
              animation:
                'sound-wrong .28s ease',
            }
          : undefined
      }
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-3
        "
      >
        <div>
          <p
            className="
              text-4xl
            "
          >
            {meta.icon}
          </p>

          <p
            className={`
              mt-3
              text-lg
              font-black

              ${
                dark
                  ? 'text-white'
                  : 'text-slate-950'
              }
            `}
          >
            {meta.title}
          </p>

          <p
            className={`
              mt-1
              text-xs
              font-bold

              ${
                dark
                  ? 'text-indigo-200'
                  : 'text-slate-500'
              }
            `}
          >
            {meta.subtitle}
          </p>
        </div>


        <div
          className={`
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-white/90
            shadow

            ${
              playing
                ? 'animate-pulse'
                : ''
            }
          `}
        >
          {
            playing
              ? (
                  <Volume2
                    size={23}
                    className={
                      meta.accent
                    }
                  />
                )
              : (
                  <Headphones
                    size={22}
                    className={
                      meta.accent
                    }
                  />
                )
          }
        </div>
      </div>


      <div
        className="
          relative
          mt-5
          flex
          h-24
          items-center
          justify-center
        "
      >
        {
          playing && (
            <>
              <span
                className="
                  absolute
                  h-12
                  w-12
                  animate-ping
                  rounded-full
                  border-2
                  border-white/70
                "
              />

              <span
                className="
                  absolute
                  h-20
                  w-20
                  animate-ping
                  rounded-full
                  border
                  border-white/40
                  [animation-delay:120ms]
                "
              />
            </>
          )
        }

        <span
          className={`
            text-5xl
            transition-transform
            duration-300

            ${
              playing
                ? 'scale-125'
                : ''
            }
          `}
        >
          {meta.emoji}
        </span>
      </div>


      <button
        type="button"
        onClick={
          onPlay
        }
        disabled={
          disabled
        }
        className={`
          mt-2
          flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-2xl
          px-4
          py-3
          text-sm
          font-black
          shadow-sm
          transition

          ${
            dark
              ? 'bg-white text-indigo-950'
              : 'bg-white text-slate-800'
          }

          hover:scale-[1.02]
          disabled:opacity-50
        `}
      >
        <Play
          size={17}
          fill="currentColor"
        />

        音を聞く
      </button>


      <button
        type="button"
        onClick={
          onAnswer
        }
        disabled={
          disabled
        }
        className={`
          mt-2
          w-full
          rounded-2xl
          px-4
          py-3
          text-sm
          font-black
          transition

          ${
            correct
              ? 'bg-emerald-600 text-white'
              : wrong
                ? 'bg-red-500 text-white'
                : dark
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                  : 'bg-slate-900 text-white hover:bg-violet-700'
          }

          disabled:opacity-50
        `}
      >
        {
          correct
            ? '✓ 正解！'
            : 'この音だ！'
        }
      </button>
    </div>
  );
}


export default function SoundTimeDetectiveMission({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const rounds =
    mission
      ?.challenge
      ?.rounds ??
    [];

  const now =
    useMemo(
      () =>
        new Date(),
      []
    );

  const [
    roundIndex,
    setRoundIndex,
  ] =
    useState(
      0
    );

  const [
    playingSound,
    setPlayingSound,
  ] =
    useState(
      null
    );

  const [
    correct,
    setCorrect,
  ] =
    useState(
      null
    );

  const [
    wrong,
    setWrong,
  ] =
    useState(
      null
    );

  const [
    hintLevel,
    setHintLevel,
  ] =
    useState(
      0
    );

  const [
    complete,
    setComplete,
  ] =
    useState(
      false
    );

  const completedRef =
    useRef(
      false
    );


  const round =
    rounds[
      roundIndex
    ];


  if (!round) {
    return null;
  }


  const instant =
    instantFromBase(
      now,
      round.baseZone,
      round.baseTime
    );


  const targetTime =
    formatZoneTime(
      instant,
      round.targetZone
    );


  const correctBand =
    getBand(
      instant,
      round.targetZone
    );


  const play =
    (
      id
    ) => {
      setPlayingSound(
        id
      );

      playSoundscape(
        id
      );

      window.setTimeout(
        () => {
          setPlayingSound(
            (
              current
            ) =>
              current ===
                id
                ? null
                : current
          );
        },
        1450
      );
    };


  const answer =
    (
      id
    ) => {
      if (
        correct
      ) {
        return;
      }

      if (
        id ===
        correctBand
      ) {
        setCorrect(
          id
        );

        setWrong(
          null
        );

        playCorrect();

        if (
          roundIndex ===
          rounds.length -
            1
        ) {
          window.setTimeout(
            () => {
              setComplete(
                true
              );

              playFinal();

              if (
                !completedRef
                  .current
              ) {
                completedRef.current =
                  true;

                onComplete?.(
                  mission
                );
              }
            },
            650
          );
        }

        return;
      }


      setWrong(
        id
      );

      playWrong();

      window.setTimeout(
        () => {
          setWrong(
            (
              current
            ) =>
              current ===
                id
                ? null
                : current
          );
        },
        650
      );
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

      setCorrect(
        null
      );

      setWrong(
        null
      );

      setPlayingSound(
        null
      );

      setHintLevel(
        0
      );
    };


  if (
    complete
  ) {
    return (
      <div
        className="
          relative
          overflow-hidden
          rounded-[34px]
          border-2
          border-violet-300
          bg-gradient-to-br
          from-violet-50
          via-white
          to-cyan-50
          p-10
          text-center
          shadow-xl
        "
      >
        <Confetti />

        <div
          className="
            mx-auto
            flex
            h-28
            w-28
            items-center
            justify-center
            rounded-full
            bg-gradient-to-br
            from-cyan-300
            via-violet-500
            to-fuchsia-500
            text-6xl
            shadow-2xl
          "
        >
          🎧
        </div>

        <Sparkles
          size={36}
          className="
            mx-auto
            mt-6
            text-amber-500
          "
        />

        <p
          className="
            mt-3
            text-xs
            font-black
            tracking-[0.22em]
            text-violet-600
          "
        >
          ALL SOUND CASES SOLVED
        </p>

        <h3
          className="
            mt-2
            text-4xl
            font-black
            text-slate-950
          "
        >
          SOUND TIME MASTER!
        </h3>

        <p
          className="
            mx-auto
            mt-4
            max-w-2xl
            font-bold
            leading-8
            text-slate-600
          "
        >
          時計の数字だけではなく、
          世界の「朝・昼・夕方・夜」を
          音からも想像できるようになりました。
          同じ瞬間でも、世界では違う一日が進んでいます。
        </p>

        {
          alreadyCompleted && (
            <p
              className="
                mt-4
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
    );
  }


  return (
    <div>
      <style>
        {`
          @keyframes sound-wrong {
            0%,100% {
              transform: translateX(0);
            }

            25% {
              transform: translateX(-6px);
            }

            75% {
              transform: translateX(6px);
            }
          }
        `}
      </style>


      <div
        className="
          rounded-[30px]
          border
          border-violet-200
          bg-gradient-to-r
          from-violet-50
          via-fuchsia-50
          to-cyan-50
          p-6
        "
      >
        <div
          className="
            flex
            flex-wrap
            items-start
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
              MISSION 07 · SOUND TIME DETECTIVE
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
              🎧 音だけで時間帯を見ぬけ！
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
              4つのサウンドを聞いて、
              同じ瞬間の
              <strong>
                {' '}
                {round.targetCity}
                {' '}
              </strong>
              が朝・昼・夕方・夜の
              どれに近いか考えよう。
            </p>
          </div>


          <div
            className="
              rounded-2xl
              bg-white
              px-5
              py-3
              text-center
              shadow
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
              SOUND CASE
            </p>

            <p
              className="
                text-2xl
                font-black
                text-violet-600
              "
            >
              {roundIndex + 1}
              {' / '}
              {rounds.length}
            </p>
          </div>
        </div>
      </div>


      <div
        className="
          mt-5
          rounded-[28px]
          bg-slate-950
          p-6
          text-white
          shadow-xl
        "
      >
        <div
          className="
            grid
            grid-cols-[1fr_auto_1fr]
            items-center
            gap-4
          "
        >
          <div
            className="
              text-center
            "
          >
            <div
              className="
                flex
                justify-center
              "
            >
              <FlagIcon
                code={
                  round.baseFlag
                }
              />
            </div>

            <p
              className="
                mt-2
                text-xs
                font-black
                tracking-[0.12em]
                text-orange-300
              "
            >
              {
                round.baseCity
              }
            </p>

            <p
              className="
                mt-1
                text-3xl
                font-black
              "
            >
              {
                round.baseTime
              }
            </p>
          </div>


          <ArrowRight
            size={34}
            className="
              text-cyan-300
            "
          />


          <div
            className="
              text-center
            "
          >
            <div
              className="
                flex
                justify-center
              "
            >
              <FlagIcon
                code={
                  round.targetFlag
                }
              />
            </div>

            <p
              className="
                mt-2
                text-xs
                font-black
                tracking-[0.12em]
                text-cyan-300
              "
            >
              {
                round.targetCity
              }
            </p>

            <p
              className="
                mt-1
                text-3xl
                font-black
              "
            >
              {
                correct
                  ? targetTime
                  : '??:??'
              }
            </p>
          </div>
        </div>
      </div>


      <div
        className="
          mt-6
          grid
          grid-cols-2
          gap-4
          xl:grid-cols-4
        "
      >
        {
          Object.keys(
            SOUND_META
          ).map(
            (
              id
            ) => (
              <SoundCard
                key={
                  id
                }
                id={
                  id
                }
                playing={
                  playingSound ===
                  id
                }
                correct={
                  correct ===
                  id
                }
                wrong={
                  wrong ===
                  id
                }
                disabled={
                  Boolean(
                    correct
                  )
                }
                onPlay={() =>
                  play(
                    id
                  )
                }
                onAnswer={() =>
                  answer(
                    id
                  )
                }
              />
            )
          )
        }
      </div>


      {
        !correct && (
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
        )
      }


      {
        hintLevel ===
          1 &&
        !correct && (
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
            💡 まず、どちらの都市の時計が
            先に進んでいるか考えてみよう。
          </div>
        )
      }


      {
        hintLevel ===
          2 &&
        !correct && (
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
            💡 {
              round.hint
            }
          </div>
        )
      }


      {
        hintLevel ===
          3 &&
        !correct && (
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
            💡 時刻は
            {' '}
            {targetTime}
            {' '}
            です。
            この時間帯に合う音を探そう。
          </div>
        )
      }


      {
        correct && (
          <div
            className="
              mt-6
              rounded-[28px]
              border-2
              border-emerald-300
              bg-gradient-to-r
              from-emerald-50
              to-cyan-50
              p-6
              text-center
            "
          >
            <CheckCircle2
              size={40}
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
              ピンポン♪ SOUND CASE SOLVED!
            </p>

            <p
              className="
                mt-2
                font-black
                text-emerald-700
              "
            >
              {
                round.targetCity
              }
              {' '}
              {
                targetTime
              }
              {' '}
              →
              {' '}
              {
                SOUND_META[
                  correct
                ].title
              }
            </p>

            {
              roundIndex <
              rounds.length -
                1 && (
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
                    px-7
                    py-3
                    font-black
                    text-white
                    shadow-lg
                    hover:bg-emerald-700
                  "
                >
                  次のSOUND CASEへ

                  <ArrowRight
                    size={18}
                  />
                </button>
              )
            }
          </div>
        )
      }
    </div>
  );
}