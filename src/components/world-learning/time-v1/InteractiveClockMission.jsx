import {
  CheckCircle2,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';

import {
  useRef,
  useState,
} from 'react';


const pad2 = (value) =>
  String(value).padStart(2, '0');


function playTick() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context =
      new AudioContextClass();

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type =
      'sine';

    oscillator.frequency.value =
      720;

    gain.gain.setValueAtTime(
      0.05,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      context.currentTime + 0.07
    );

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start();
    oscillator.stop(
      context.currentTime + 0.07
    );
  }
  catch {
    // Sound is optional.
  }
}


function playFanfare() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return;
    }

    const context =
      new AudioContextClass();

    const notes = [
      [523.25, 0.00, 0.18],
      [659.25, 0.16, 0.18],
      [783.99, 0.32, 0.18],
      [1046.50, 0.48, 0.45],
    ];

    notes.forEach(
      ([
        frequency,
        start,
        duration,
      ]) => {
        const oscillator =
          context.createOscillator();

        const gain =
          context.createGain();

        oscillator.type =
          'triangle';

        oscillator.frequency.value =
          frequency;

        gain.gain.setValueAtTime(
          0.0001,
          context.currentTime + start
        );

        gain.gain.exponentialRampToValueAtTime(
          0.12,
          context.currentTime + start + 0.02
        );

        gain.gain.exponentialRampToValueAtTime(
          0.001,
          context.currentTime + start + duration
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(
          context.currentTime + start
        );

        oscillator.stop(
          context.currentTime +
          start +
          duration +
          0.05
        );
      }
    );
  }
  catch {
    // Sound is optional.
  }
}


function parseTime(
  value = '12:00'
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
        : 12,

    minute:
      Number.isFinite(minute)
        ? minute
        : 0,
  };
}


function Confetti() {
  return (
    <>
      <style>
        {`
          @keyframes tp-confetti-fall {
            0% {
              transform:
                translate3d(0,-15vh,0)
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

          @keyframes tp-success-pop {
            0% {
              transform: scale(.65);
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
          z-[20000]
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
            ) => {
              const left =
                (
                  index * 37
                ) %
                100;

              const delay =
                (
                  index %
                  12
                ) *
                0.045;

              const duration =
                1.8 +
                (
                  index %
                  9
                ) *
                0.12;

              const drift =
                (
                  (
                    index %
                    2
                  )
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
                );

              const colors = [
                '#f97316',
                '#facc15',
                '#22c55e',
                '#3b82f6',
                '#ec4899',
                '#8b5cf6',
              ];

              const color =
                colors[
                  index %
                  colors.length
                ];

              return (
                <span
                  key={index}
                  className="
                    absolute
                    -top-8
                    h-3
                    w-2
                    rounded-sm
                  "
                  style={{
                    left:
                      `${left}%`,

                    background:
                      color,

                    animation:
                      `tp-confetti-fall ${duration}s linear ${delay}s forwards`,

                    '--drift':
                      `${drift}px`,
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


function AnalogClock({
  hour,
  minute,
  interactive = false,
  onHourChange,
}) {
  const ref =
    useRef(null);

  const [
    dragging,
    setDragging,
  ] =
    useState(false);


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


  const updateFromPointer =
    (event) => {
      if (
        !interactive ||
        !ref.current
      ) {
        return;
      }

      const rect =
        ref.current
          .getBoundingClientRect();

      const x =
        (
          (
            event.clientX -
            rect.left
          ) /
          rect.width
        ) *
        240;

      const y =
        (
          (
            event.clientY -
            rect.top
          ) /
          rect.height
        ) *
        240;

      const dx =
        x - 120;

      const dy =
        120 - y;

      let angle =
        Math.atan2(
          dx,
          dy
        ) *
        180 /
        Math.PI;

      if (
        angle < 0
      ) {
        angle += 360;
      }

      const nextHour =
        Math.round(
          angle / 30
        ) %
        12;

      const current12 =
        hour %
        12;

      if (
        nextHour !==
        current12
      ) {
        playTick();
      }

      onHourChange?.(
        nextHour
      );
    };


  return (
    <div
      className="
        relative
        mx-auto
        w-full
        max-w-[260px]
      "
    >
      <svg
        ref={ref}
        viewBox="0 0 240 240"
        className={`
          w-full
          select-none

          ${
            interactive
              ? 'cursor-grab touch-none active:cursor-grabbing'
              : ''
          }
        `}
        onPointerDown={
          (event) => {
            if (
              !interactive
            ) {
              return;
            }

            setDragging(true);

            event
              .currentTarget
              .setPointerCapture?.(
                event.pointerId
              );

            updateFromPointer(
              event
            );
          }
        }
        onPointerMove={
          (event) => {
            if (
              dragging
            ) {
              updateFromPointer(
                event
              );
            }
          }
        }
        onPointerUp={() =>
          setDragging(false)
        }
        onPointerCancel={() =>
          setDragging(false)
        }
      >
        <circle
          cx="120"
          cy="120"
          r="108"
          fill="white"
          stroke={
            interactive
              ? '#f59e0b'
              : '#cbd5e1'
          }
          strokeWidth="6"
        />

        <circle
          cx="120"
          cy="120"
          r="96"
          fill={
            interactive
              ? '#fffbeb'
              : '#f8fafc'
          }
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
                  ? 93
                  : 98;

              const outer =
                103;

              return (
                <line
                  key={
                    index
                  }
                  x1={
                    120 +
                    Math.sin(
                      angle
                    ) *
                    inner
                  }
                  y1={
                    120 -
                    Math.cos(
                      angle
                    ) *
                    inner
                  }
                  x2={
                    120 +
                    Math.sin(
                      angle
                    ) *
                    outer
                  }
                  y2={
                    120 -
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
                index + 1;

              const angle =
                (
                  number *
                  30 -
                  90
                ) *
                Math.PI /
                180;

              const x =
                120 +
                Math.cos(
                  angle
                ) *
                78;

              const y =
                120 +
                Math.sin(
                  angle
                ) *
                78;

              return (
                <text
                  key={
                    number
                  }
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="15"
                  fontWeight="800"
                  fill="#334155"
                >
                  {number}
                </text>
              );
            }
          )
        }

        <line
          x1="120"
          y1="120"
          x2="120"
          y2="50"
          stroke="#334155"
          strokeWidth="5"
          strokeLinecap="round"
          transform={
            `rotate(${minuteAngle} 120 120)`
          }
        />

        <line
          x1="120"
          y1="120"
          x2="120"
          y2="76"
          stroke={
            interactive
              ? '#f97316'
              : '#0f172a'
          }
          strokeWidth="9"
          strokeLinecap="round"
          transform={
            `rotate(${hourAngle} 120 120)`
          }
        />

        {
          interactive && (
            <circle
              cx="120"
              cy="76"
              r="10"
              fill="#f97316"
              transform={
                `rotate(${hourAngle} 120 120)`
              }
            />
          )
        }

        <circle
          cx="120"
          cy="120"
          r="9"
          fill={
            interactive
              ? '#f97316'
              : '#0f172a'
          }
        />

        <circle
          cx="120"
          cy="120"
          r="3"
          fill="white"
        />
      </svg>

      {
        interactive && (
          <div
            className="
              pointer-events-none
              absolute
              -bottom-2
              left-1/2
              -translate-x-1/2
              whitespace-nowrap
              rounded-full
              bg-orange-500
              px-4
              py-2
              text-xs
              font-black
              text-white
              shadow-lg
            "
          >
            👆 短い針を動かそう
          </div>
        )
      }
    </div>
  );
}


export default function InteractiveClockMission({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const challenge =
    mission
      ?.challenge ??
    {};

  const sourceTime =
    challenge.sourceTime ??
    '12:00';

  const source =
    parseTime(
      sourceTime
    );

  const offsetHours =
    Number(
      challenge.offsetHours ??
      -7
    );

  const correctHour =
    (
      source.hour +
      offsetHours +
      24
    ) %
    24;

  const [
    selectedHour,
    setSelectedHour,
  ] =
    useState(
      source.hour %
      12
    );

  const [
    result,
    setResult,
  ] =
    useState(null);

  const [
    showHint,
    setShowHint,
  ] =
    useState(false);


  const sourceLabel =
    challenge.sourceLabel ??
    'JAPAN';

  const targetLabel =
    challenge.targetLabel ??
    'KIGALI';


  const selectedTime =
    `${pad2(
      selectedHour
    )}:${pad2(
      source.minute
    )}`;

  const correctClockHour =
    correctHour %
    12;


  const check =
    () => {
      const correct =
        selectedHour ===
        correctClockHour;

      setResult(
        correct
      );

      if (
        correct
      ) {
        playFanfare();

        onComplete?.(
          mission
        );
      }
    };


  return (
    <div
      className="
        relative
      "
    >
      {
        result ===
        true && (
          <Confetti />
        )
      }

      <div
        className="
          rounded-[28px]
          border
          border-amber-200
          bg-gradient-to-r
          from-amber-50
          to-orange-50
          p-5
          md:p-6
        "
      >
        <p
          className="
            text-xs
            font-black
            tracking-[0.16em]
            text-orange-600
          "
        >
          やることは1つ！
        </p>

        <h3
          className="
            mt-2
            text-xl
            font-black
            text-slate-950
            md:text-2xl
          "
        >
          日本が12時。
          キガリは何時かな？ 🕒
        </h3>

        <p
          className="
            mt-2
            text-sm
            font-bold
            leading-7
            text-slate-600
            md:text-base
          "
        >
          日本とルワンダのキガリでは、
          時計の時刻がちがいます。
          右のキガリの
          <strong>
            「短い針」
          </strong>
          を動かして、
          正しい時刻にしよう！
        </p>
      </div>


      <div
        className="
          mt-6
          grid
          grid-cols-1
          gap-5
          md:grid-cols-[1fr_auto_1fr]
          md:items-center
        "
      >
        <div
          className="
            rounded-[30px]
            border
            border-slate-200
            bg-slate-50
            p-5
            text-center
          "
        >
          <p
            className="
              text-xs
              font-black
              tracking-[0.2em]
              text-slate-500
            "
          >
            🇯🇵 {sourceLabel}
          </p>

          <div className="mt-4">
            <AnalogClock
              hour={
                source.hour
              }
              minute={
                source.minute
              }
            />
          </div>

          <p
            className="
              mt-4
              text-3xl
              font-black
              text-slate-900
            "
          >
            {sourceTime}
          </p>

          <p
            className="
              mt-1
              text-xs
              font-bold
              text-slate-400
            "
          >
            日本の時計
          </p>
        </div>


        <div
          className="
            hidden
            text-4xl
            font-black
            text-orange-400
            md:block
          "
        >
          →
        </div>


        <div
          className="
            rounded-[30px]
            border-2
            border-orange-300
            bg-orange-50/50
            p-5
            text-center
            shadow-lg
            shadow-orange-100
          "
        >
          <p
            className="
              text-xs
              font-black
              tracking-[0.2em]
              text-orange-600
            "
          >
            🇷🇼 {targetLabel}
          </p>

          <div
            className="
              mt-4
              pb-4
            "
          >
            <AnalogClock
              hour={
                selectedHour
              }
              minute={
                source.minute
              }
              interactive
              onHourChange={
                (hour) => {
                  setSelectedHour(
                    hour
                  );

                  setResult(
                    null
                  );
                }
              }
            />
          </div>

          <p
            className="
              mt-4
              text-3xl
              font-black
              text-orange-600
            "
          >
            {selectedTime}
          </p>

          <p
            className="
              mt-1
              text-xs
              font-bold
              text-orange-500
            "
          >
            オレンジ色の短い針を動かそう
          </p>
        </div>
      </div>


      <button
        type="button"
        onClick={() =>
          setShowHint(
            (current) =>
              !current
          )
        }
        className="
          mt-6
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
          hover:bg-amber-100
        "
      >
        <Lightbulb
          size={18}
        />

        {
          showHint
            ? 'ヒントをかくす'
            : 'ヒントを見る'
        }
      </button>


      {
        showHint && (
          <div
            className="
              mt-3
              rounded-2xl
              border
              border-amber-200
              bg-amber-50
              p-4
              text-center
            "
          >
            <p
              className="
                text-lg
                font-black
                text-amber-800
              "
            >
              💡 キガリは日本より
              7時間前です。
            </p>

            <p
              className="
                mt-1
                text-sm
                font-bold
                text-amber-700
              "
            >
              日本の12時から、
              時計を7時間もどしてみよう。
            </p>
          </div>
        )
      }


      {
        result !==
        true && (
          <button
            type="button"
            onClick={check}
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
              hover:bg-orange-600
            "
          >
            これでOK！
          </button>
        )
      }


      {
        result ===
        false && (
          <div
            className="
              mt-4
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
              👀 おしい！もう一度。
            </p>

            <p
              className="
                mt-1
                text-sm
                font-bold
                text-orange-700
              "
            >
              日本の12時から、
              7時間もどすと何時かな？
            </p>

            <button
              type="button"
              onClick={() => {
                setSelectedHour(
                  source.hour %
                  12
                );

                setResult(
                  null
                );
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
              もう一度
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
                'tp-success-pop .4s ease-out',
            }}
            className="
              mt-5
              rounded-[30px]
              border-2
              border-emerald-300
              bg-gradient-to-r
              from-emerald-50
              to-green-50
              p-6
              text-center
              shadow-lg
            "
          >
            <CheckCircle2
              className="
                mx-auto
                text-emerald-600
              "
              size={42}
            />

            <p
              className="
                mt-3
                text-3xl
                font-black
                text-emerald-800
              "
            >
              Mission Clear! 🎉
            </p>

            <p
              className="
                mt-3
                text-lg
                font-black
                text-emerald-700
              "
            >
              日本が12:00なら、
              キガリは5:00！
            </p>

            <p
              className="
                mt-2
                text-sm
                font-bold
                text-emerald-600
              "
            >
              キガリは日本より
              7時間前です。
            </p>

            {
              alreadyCompleted && (
                <p
                  className="
                    mt-3
                    text-xs
                    font-bold
                    text-emerald-500
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