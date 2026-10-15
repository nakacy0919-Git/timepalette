import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Lightbulb,
  MapPin,
  Plane,
  Sparkles,
} from 'lucide-react';

import {
  useMemo,
  useRef,
  useState,
} from 'react';


let finalAudioContext = null;


function getAudioContext() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!finalAudioContext) {
      finalAudioContext =
        new AudioContextClass();
    }

    if (
      finalAudioContext.state ===
      'suspended'
    ) {
      finalAudioContext.resume();
    }

    return finalAudioContext;
  }
  catch {
    return null;
  }
}


function tone({
  frequency,
  delay = 0,
  duration = 0.12,
  volume = 0.05,
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


function playCorrect() {
  [
    [659, 0.00],
    [880, 0.09],
    [1047, 0.19],
    [1319, 0.34],
  ].forEach(
    (
      [
        frequency,
        delay,
      ],
      index
    ) => {
      tone({
        frequency,
        delay,
        duration:
          index === 3
            ? 0.30
            : 0.13,
        volume: 0.07,
      });
    }
  );
}


function playWrong() {
  tone({
    frequency: 175,
    duration: 0.18,
    volume: 0.05,
    type: 'sawtooth',
  });

  tone({
    frequency: 120,
    delay: 0.10,
    duration: 0.18,
    volume: 0.04,
    type: 'sawtooth',
  });
}


function playFinalFanfare() {
  [
    [523, 0.00],
    [659, 0.10],
    [784, 0.20],
    [1047, 0.32],
    [1319, 0.49],
    [1568, 0.67],
    [2093, 0.88],
  ].forEach(
    (
      [
        frequency,
        delay,
      ],
      index
    ) => {
      tone({
        frequency,
        delay,
        duration:
          index >= 4
            ? 0.42
            : 0.18,
        volume: 0.085,
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


function localDateTimeToInstant({
  date,
  time,
  zone,
}) {
  const [
    year,
    month,
    day,
  ] =
    date
      .split('-')
      .map(Number);

  const [
    hour,
    minute,
  ] =
    time
      .split(':')
      .map(Number);

  const naive =
    Date.UTC(
      year,
      month - 1,
      day,
      hour,
      minute,
      0
    );

  const probe =
    new Date(
      naive
    );

  const offset =
    getOffsetMinutes(
      probe,
      zone
    );

  return new Date(
    naive -
    offset *
      60000
  );
}


function formatLocalTime(
  instant,
  zone
) {
  const parts =
    getZoneParts(
      instant,
      zone
    );

  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}


function formatLocalDate(
  instant,
  zone
) {
  const parts =
    getZoneParts(
      instant,
      zone
    );

  return `${parts.month}月${parts.day}日`;
}


function localDateSerial(
  instant,
  zone
) {
  const parts =
    getZoneParts(
      instant,
      zone
    );

  return Math.floor(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day
    ) /
    86400000
  );
}


function dayShiftBetween({
  departureInstant,
  departureZone,
  arrivalInstant,
  arrivalZone,
}) {
  return (
    localDateSerial(
      arrivalInstant,
      arrivalZone
    ) -
    localDateSerial(
      departureInstant,
      departureZone
    )
  );
}


function dayShiftLabel(
  shift
) {
  if (
    shift >
    0
  ) {
    return '翌日';
  }

  if (
    shift <
    0
  ) {
    return '前の日';
  }

  return '同じ日';
}


function durationLabel(
  minutes
) {
  const hours =
    Math.floor(
      minutes /
      60
    );

  const mins =
    minutes %
    60;

  if (
    mins ===
    0
  ) {
    return `${hours}時間`;
  }

  return `${hours}時間${mins}分`;
}


function shuffle(
  source
) {
  const result = [
    ...source,
  ];

  for (
    let i =
      result.length - 1;
    i > 0;
    i -= 1
  ) {
    const j =
      Math.floor(
        Math.random() *
        (
          i + 1
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


function FlagImage({
  code,
  size = 'normal',
}) {
  return (
    <img
      src={`https://flagcdn.com/w160/${code}.png`}
      alt=""
      loading="lazy"
      decoding="async"
      className={`
        rounded-lg
        object-cover
        shadow-md
        ring-1
        ring-black/10

        ${
          size ===
            'large'
            ? 'h-[48px] w-[72px]'
            : 'h-[34px] w-[52px]'
        }
      `}
    />
  );
}


function buildLegData(
  leg
) {
  const departureInstant =
    localDateTimeToInstant({
      date:
        leg.departDate,

      time:
        leg.departTime,

      zone:
        leg.fromZone,
    });


  const arrivalInstant =
    new Date(
      departureInstant.getTime() +
      leg.durationMinutes *
        60000
    );


  const correct = {
    id:
      'correct',

    date:
      formatLocalDate(
        arrivalInstant,
        leg.toZone
      ),

    time:
      formatLocalTime(
        arrivalInstant,
        leg.toZone
      ),

    shift:
      dayShiftBetween({
        departureInstant,
        departureZone:
          leg.fromZone,
        arrivalInstant,
        arrivalZone:
          leg.toZone,
      }),

    correct:
      true,
  };


  const oneHourLater =
    new Date(
      arrivalInstant.getTime() +
      60 *
        60000
    );


  const wrongTime = {
    id:
      'wrong-time',

    date:
      formatLocalDate(
        oneHourLater,
        leg.toZone
      ),

    time:
      formatLocalTime(
        oneHourLater,
        leg.toZone
      ),

    shift:
      dayShiftBetween({
        departureInstant,
        departureZone:
          leg.fromZone,
        arrivalInstant:
          oneHourLater,
        arrivalZone:
          leg.toZone,
      }),

    correct:
      false,
  };


  const wrongDateInstant =
    new Date(
      arrivalInstant.getTime() +
      (
        correct.shift <=
          0
          ? 1
          : -1
      ) *
      24 *
      60 *
      60000
    );


  const wrongDate = {
    id:
      'wrong-date',

    date:
      formatLocalDate(
        wrongDateInstant,
        leg.toZone
      ),

    time:
      correct.time,

    shift:
      dayShiftBetween({
        departureInstant,
        departureZone:
          leg.fromZone,
        arrivalInstant:
          wrongDateInstant,
        arrivalZone:
          leg.toZone,
      }),

    correct:
      false,
  };


  return {
    departureInstant,
    arrivalInstant,
    correct,
    answers:
      shuffle([
        correct,
        wrongTime,
        wrongDate,
      ]),
  };
}


function Confetti({
  huge = false,
}) {
  const count =
    huge
      ? 120
      : 60;

  return (
    <>
      <style>
        {`
          @keyframes final-confetti {
            from {
              transform:
                translateY(-12vh)
                rotate(0deg);
              opacity: 1;
            }

            to {
              transform:
                translate3d(
                  var(--x),
                  112vh,
                  0
                )
                rotate(1000deg);
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
          z-[30000]
          overflow-hidden
        "
      >
        {
          Array.from(
            {
              length:
                count,
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
                    `${(
                      index *
                      43
                    ) %
                    100}%`,

                  background:
                    [
                      '#22d3ee',
                      '#3b82f6',
                      '#8b5cf6',
                      '#ec4899',
                      '#f97316',
                      '#facc15',
                      '#22c55e',
                    ][
                      index %
                      7
                    ],

                  '--x':
                    `${(
                      index %
                        2
                        ? 1
                        : -1
                    ) *
                    (
                      30 +
                      (
                        index %
                        10
                      ) *
                      8
                    )}px`,

                  animation:
                    `final-confetti ${
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


function ExplanationModal({
  leg,
  result,
  legIndex,
  legCount,
  onContinue,
}) {
  const finalLeg =
    legIndex ===
    legCount -
      1;

  return (
    <div
      className="
        fixed
        inset-0
        z-[28000]
        flex
        items-center
        justify-center
        bg-slate-950/75
        p-5
        backdrop-blur-md
      "
    >
      <Confetti />

      <div
        className="
          relative
          w-full
          max-w-3xl
          overflow-hidden
          rounded-[36px]
          border-4
          border-cyan-300
          bg-white
          p-8
          shadow-[0_35px_120px_rgba(0,0,0,.5)]
        "
      >
        <div
          className="
            absolute
            -right-16
            -top-16
            h-44
            w-44
            rounded-full
            bg-cyan-200/40
            blur-2xl
          "
        />

        <div
          className="
            text-center
          "
        >
          <div
            className="
              mx-auto
              flex
              h-20
              w-20
              items-center
              justify-center
              rounded-full
              bg-gradient-to-br
              from-cyan-400
              to-violet-600
              text-4xl
              text-white
              shadow-xl
            "
          >
            ✓
          </div>

          <p
            className="
              mt-4
              text-xs
              font-black
              tracking-[0.20em]
              text-cyan-600
            "
          >
            FLIGHT GATE {legIndex + 1} CLEAR
          </p>

          <h3
            className="
              mt-2
              text-3xl
              font-black
              text-slate-950
            "
          >
            ✈️ ARRIVAL CONFIRMED!
          </h3>


          <div
            className="
              mx-auto
              mt-6
              flex
              max-w-2xl
              items-center
              justify-center
              gap-5
              rounded-[26px]
              bg-slate-50
              p-5
            "
          >
            <div
              className="
                text-center
              "
            >
              <FlagImage
                code={
                  leg.fromFlag
                }
              />

              <p
                className="
                  mt-2
                  font-black
                "
              >
                {leg.fromCity}
              </p>

              <p
                className="
                  text-sm
                  font-bold
                  text-slate-500
                "
              >
                {leg.departDate.slice(5).replace('-', '月')}日
                {' '}
                {leg.departTime}
              </p>
            </div>


            <div
              className="
                text-center
              "
            >
              <Plane
                size={30}
                className="
                  mx-auto
                  text-violet-600
                "
              />

              <p
                className="
                  mt-1
                  text-xs
                  font-black
                  text-violet-600
                "
              >
                {durationLabel(
                  leg.durationMinutes
                )}
              </p>
            </div>


            <div
              className="
                text-center
              "
            >
              <FlagImage
                code={
                  leg.toFlag
                }
              />

              <p
                className="
                  mt-2
                  font-black
                "
              >
                {leg.toCity}
              </p>

              <p
                className="
                  text-xl
                  font-black
                  text-emerald-700
                "
              >
                {result.correct.date}
                {' '}
                {result.correct.time}
              </p>
            </div>
          </div>


          <div
            className="
              mx-auto
              mt-5
              max-w-2xl
              rounded-[24px]
              border-2
              border-emerald-200
              bg-emerald-50
              p-5
            "
          >
            <p
              className="
                text-xs
                font-black
                tracking-[0.15em]
                text-emerald-600
              "
            >
              💡 今回の発見
            </p>

            <p
              className="
                mt-2
                text-lg
                font-black
                leading-8
                text-emerald-900
              "
            >
              {leg.explanation}
            </p>
          </div>


          <div
            className="
              mx-auto
              mt-4
              max-w-2xl
              rounded-2xl
              bg-amber-50
              p-4
            "
          >
            <p
              className="
                font-black
                text-amber-900
              "
            >
              📅 到着日は
              {' '}
              {dayShiftLabel(
                result.correct.shift
              )}
            </p>

            <p
              className="
                mt-1
                text-sm
                font-bold
                leading-6
                text-amber-800
              "
            >
              出発地と到着地では時計だけでなく、
              日付まで変わることがあります。
            </p>
          </div>


          <button
            type="button"
            onClick={
              onContinue
            }
            className="
              mt-6
              inline-flex
              items-center
              gap-2
              rounded-2xl
              bg-slate-950
              px-8
              py-4
              text-lg
              font-black
              text-white
              shadow-xl
              hover:bg-violet-700
            "
          >
            {
              finalLeg
                ? 'FINAL MASTERへ'
                : '次のFLIGHTへ'
            }

            <ArrowRight
              size={20}
            />
          </button>
        </div>
      </div>
    </div>
  );
}


function FinalMaster({
  legs,
  onFinish,
}) {
  return (
    <div
      className="
        relative
        overflow-hidden
        rounded-[38px]
        bg-gradient-to-br
        from-slate-950
        via-violet-950
        to-cyan-950
        p-10
        text-center
        text-white
        shadow-2xl
      "
    >
      <Confetti huge />

      <style>
        {`
          @keyframes orbit-master {
            from {
              transform:
                rotate(0deg)
                translateX(125px)
                rotate(0deg);
            }

            to {
              transform:
                rotate(360deg)
                translateX(125px)
                rotate(-360deg);
            }
          }

          @keyframes globe-pulse {
            0%,100% {
              transform: scale(1);
              filter:
                drop-shadow(
                  0 0 20px
                  rgba(34,211,238,.55)
                );
            }

            50% {
              transform: scale(1.07);
              filter:
                drop-shadow(
                  0 0 42px
                  rgba(139,92,246,.9)
                );
            }
          }
        `}
      </style>


      <div
        className="
          relative
          mx-auto
          h-[290px]
          w-[290px]
        "
      >
        <div
          className="
            absolute
            inset-5
            rounded-full
            border
            border-cyan-300/30
          "
        />

        <div
          className="
            absolute
            inset-0
            rounded-full
            border-2
            border-dashed
            border-violet-300/30
          "
        />


        <div
          className="
            absolute
            left-1/2
            top-1/2
            flex
            h-36
            w-36
            -translate-x-1/2
            -translate-y-1/2
            items-center
            justify-center
            rounded-full
            bg-gradient-to-br
            from-cyan-400
            via-blue-600
            to-violet-700
            text-7xl
            shadow-2xl
          "
          style={{
            animation:
              'globe-pulse 2s ease-in-out infinite',
          }}
        >
          🌍
        </div>


        <div
          className="
            absolute
            left-1/2
            top-1/2
            -ml-6
            -mt-6
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-white
            text-violet-700
            shadow-xl
          "
          style={{
            animation:
              'orbit-master 5s linear infinite',
          }}
        >
          <Plane
            size={25}
          />
        </div>
      </div>


      <Sparkles
        size={38}
        className="
          mx-auto
          text-amber-300
        "
      />

      <p
        className="
          mt-3
          text-xs
          font-black
          tracking-[0.25em]
          text-cyan-300
        "
      >
        ALL TIME SYSTEMS MASTERED
      </p>

      <h2
        className="
          mt-2
          text-4xl
          font-black
          md:text-5xl
        "
      >
        TIME TRAVELER MASTER!
      </h2>

      <p
        className="
          mx-auto
          mt-5
          max-w-3xl
          font-bold
          leading-8
          text-indigo-100
        "
      >
        時差・飛行時間・日付・季節・サマータイム・日付変更線。
        世界の時間を使って、3つの国際ルートをすべて解読しました。
      </p>


      <div
        className="
          mx-auto
          mt-7
          grid
          max-w-4xl
          grid-cols-1
          gap-3
          md:grid-cols-3
        "
      >
        {
          legs.map(
            (
              leg,
              index
            ) => (
              <div
                key={
                  leg.id
                }
                className="
                  rounded-[24px]
                  border
                  border-white/15
                  bg-white/10
                  p-5
                  backdrop-blur
                "
              >
                <p
                  className="
                    text-xs
                    font-black
                    tracking-[0.14em]
                    text-cyan-300
                  "
                >
                  PASSPORT STAMP {index + 1}
                </p>

                <div
                  className="
                    mt-3
                    flex
                    items-center
                    justify-center
                    gap-3
                  "
                >
                  <FlagImage
                    code={
                      leg.fromFlag
                    }
                  />

                  <ArrowRight
                    size={17}
                  />

                  <FlagImage
                    code={
                      leg.toFlag
                    }
                  />
                </div>

                <p
                  className="
                    mt-3
                    font-black
                  "
                >
                  {leg.fromCity}
                  {' → '}
                  {leg.toCity}
                </p>

                <p
                  className="
                    mt-2
                    text-2xl
                  "
                >
                  ✅
                </p>
              </div>
            )
          )
        }
      </div>


      <div
        className="
          mx-auto
          mt-7
          max-w-3xl
          rounded-[26px]
          border
          border-amber-300/40
          bg-amber-300/10
          p-5
        "
      >
        <p
          className="
            font-black
            text-amber-200
          "
        >
          🌟 Final Learning
        </p>

        <p
          className="
            mt-2
            font-bold
            leading-7
            text-amber-50
          "
        >
          世界を移動するときは、
          「何時間飛ぶか」だけでは到着時刻は決まりません。
          出発地と目的地の時差、季節によるサマータイム、
          そして日付まで考える必要があります。
        </p>
      </div>


      <button
        type="button"
        onClick={
          onFinish
        }
        className="
          mt-7
          rounded-2xl
          bg-gradient-to-r
          from-cyan-400
          to-violet-500
          px-9
          py-4
          text-lg
          font-black
          text-white
          shadow-xl
          hover:scale-[1.03]
        "
      >
        🏆 Time Adventure Complete!
      </button>
    </div>
  );
}


export default function TimeTravelerFinalMission({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const legs =
    mission
      ?.challenge
      ?.legs ??
    [];

  const [
    legIndex,
    setLegIndex,
  ] =
    useState(
      0
    );

  const [
    flightProgress,
    setFlightProgress,
  ] =
    useState(
      0
    );

  const [
    unlocked,
    setUnlocked,
  ] =
    useState(
      false
    );

  const [
    wrongAnswer,
    setWrongAnswer,
  ] =
    useState(
      null
    );

  const [
    solved,
    setSolved,
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
    showExplanation,
    setShowExplanation,
  ] =
    useState(
      false
    );

  const [
    finalMaster,
    setFinalMaster,
  ] =
    useState(
      false
    );

  const completedRef =
    useRef(
      false
    );


  const leg =
    legs[
      legIndex
    ];


  const result =
    useMemo(
      () =>
        leg
          ? buildLegData(
              leg
            )
          : null,
      [
        legIndex,
        leg,
      ]
    );


  if (
    !leg ||
    !result
  ) {
    return null;
  }


  const planeX =
    7 +
    flightProgress *
      0.86;

  const planeY =
    73 -
    Math.sin(
      flightProgress /
      100 *
      Math.PI
    ) *
      43;


  const elapsedMinutes =
    Math.round(
      leg.durationMinutes *
      flightProgress /
      100 /
      30
    ) *
    30;


  const chooseAnswer =
    (
      answer
    ) => {
      if (
        solved
      ) {
        return;
      }


      if (
        answer.correct
      ) {
        setSolved(
          true
        );

        setWrongAnswer(
          null
        );

        playCorrect();

        window.setTimeout(
          () => {
            setShowExplanation(
              true
            );
          },
          350
        );

        return;
      }


      setWrongAnswer(
        answer.id
      );

      playWrong();

      window.setTimeout(
        () => {
          setWrongAnswer(
            null
          );
        },
        600
      );
    };


  const continueAfterExplanation =
    () => {
      setShowExplanation(
        false
      );


      if (
        legIndex <
        legs.length -
          1
      ) {
        setLegIndex(
          (
            current
          ) =>
            current +
            1
        );

        setFlightProgress(
          0
        );

        setUnlocked(
          false
        );

        setSolved(
          false
        );

        setWrongAnswer(
          null
        );

        setHintLevel(
          0
        );

        return;
      }


      playFinalFanfare();

      setFinalMaster(
        true
      );
    };


  const finishMission =
    () => {
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
    };


  if (
    finalMaster
  ) {
    return (
      <FinalMaster
        legs={
          legs
        }
        onFinish={
          finishMission
        }
      />
    );
  }


  return (
    <div>
      <style>
        {`
          @keyframes answer-shake {
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

          @keyframes route-glow {
            0%,100% {
              opacity: .55;
            }

            50% {
              opacity: 1;
            }
          }

          @keyframes plane-float {
            0%,100% {
              transform:
                translate(-50%,-50%)
                rotate(-8deg)
                translateY(0);
            }

            50% {
              transform:
                translate(-50%,-50%)
                rotate(-8deg)
                translateY(-5px);
            }
          }
        `}
      </style>


      {
        showExplanation && (
          <ExplanationModal
            leg={
              leg
            }
            result={
              result
            }
            legIndex={
              legIndex
            }
            legCount={
              legs.length
            }
            onContinue={
              continueAfterExplanation
            }
          />
        )
      }


      <div
        className="
          overflow-hidden
          rounded-[34px]
          bg-gradient-to-r
          from-slate-950
          via-violet-950
          to-cyan-950
          p-7
          text-white
          shadow-xl
        "
      >
        <div
          className="
            flex
            flex-wrap
            items-start
            justify-between
            gap-5
          "
        >
          <div>
            <p
              className="
                text-xs
                font-black
                tracking-[0.20em]
                text-cyan-300
              "
            >
              MISSION 10 · FINAL WORLD TOUR
            </p>

            <h3
              className="
                mt-2
                text-3xl
                font-black
              "
            >
              🚀 TIME TRAVELER WORLD TOUR
            </h3>

            <p
              className="
                mt-2
                font-bold
                text-indigo-100
              "
            >
              世界を飛び、到着した国の
              「日付＋現地時刻」を解読せよ！
            </p>
          </div>


          <div
            className="
              flex
              gap-2
            "
          >
            {
              legs.map(
                (
                  _,
                  index
                ) => (
                  <div
                    key={index}
                    className={`
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-full
                      font-black

                      ${
                        index <
                        legIndex
                          ? 'bg-emerald-500 text-white'
                          : index ===
                              legIndex
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-white/10 text-white/50'
                      }
                    `}
                  >
                    {
                      index <
                      legIndex
                        ? '✓'
                        : index +
                          1
                    }
                  </div>
                )
              )
            }
          </div>
        </div>
      </div>


      <div
        className="
          mt-5
          rounded-[30px]
          border-2
          border-violet-200
          bg-white
          p-6
          shadow-sm
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
            <p
              className="
                text-xs
                font-black
                tracking-[0.17em]
                text-violet-600
              "
            >
              FINAL FLIGHT {legIndex + 1} / {legs.length}
            </p>

            <h4
              className="
                mt-1
                text-2xl
                font-black
                text-slate-950
              "
            >
              {leg.title}
            </h4>
          </div>


          <div
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
            TRAINING ROUTE
          </div>
        </div>


        <div
          className="
            mt-6
            grid
            grid-cols-[1fr_auto_1fr]
            items-center
            gap-4
          "
        >
          <div
            className="
              rounded-[22px]
              bg-slate-50
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <FlagImage
                code={
                  leg.fromFlag
                }
                size="large"
              />

              <div>
                <p
                  className="
                    text-xs
                    font-black
                    text-slate-400
                  "
                >
                  DEPARTURE
                </p>

                <p
                  className="
                    text-xl
                    font-black
                    text-slate-950
                  "
                >
                  {leg.fromCity}
                </p>
              </div>
            </div>

            <p
              className="
                mt-4
                text-3xl
                font-black
                text-violet-700
              "
            >
              {leg.departTime}
            </p>

            <p
              className="
                mt-1
                text-sm
                font-black
                text-slate-500
              "
            >
              {leg.departDate}
            </p>
          </div>


          <div
            className="
              text-center
            "
          >
            <Plane
              size={30}
              className="
                mx-auto
                text-violet-600
              "
            />

            <p
              className="
                mt-2
                text-xs
                font-black
                text-violet-600
              "
            >
              {durationLabel(
                leg.durationMinutes
              )}
            </p>
          </div>


          <div
            className="
              rounded-[22px]
              bg-cyan-50
              p-4
            "
          >
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <FlagImage
                code={
                  leg.toFlag
                }
                size="large"
              />

              <div>
                <p
                  className="
                    text-xs
                    font-black
                    text-slate-400
                  "
                >
                  DESTINATION
                </p>

                <p
                  className="
                    text-xl
                    font-black
                    text-slate-950
                  "
                >
                  {leg.toCity}
                </p>
              </div>
            </div>

            <p
              className="
                mt-4
                text-3xl
                font-black
                text-cyan-700
              "
            >
              ??:??
            </p>

            <p
              className="
                mt-1
                text-sm
                font-black
                text-slate-500
              "
            >
              ARRIVAL LOCKED
            </p>
          </div>
        </div>
      </div>


      <div
        className="
          mt-5
          overflow-hidden
          rounded-[32px]
          bg-gradient-to-b
          from-sky-200
          via-cyan-50
          to-indigo-100
          p-6
        "
      >
        <div
          className="
            relative
            h-[230px]
            overflow-hidden
            rounded-[26px]
            bg-gradient-to-b
            from-sky-300
            via-sky-100
            to-white
          "
        >
          <div
            className="
              absolute
              left-6
              top-6
              flex
              items-center
              gap-2
              rounded-full
              bg-white/90
              px-4
              py-2
              font-black
              shadow
            "
          >
            <FlagImage
              code={
                leg.fromFlag
              }
            />

            {leg.fromCity}
          </div>


          <div
            className="
              absolute
              right-6
              top-6
              flex
              items-center
              gap-2
              rounded-full
              bg-white/90
              px-4
              py-2
              font-black
              shadow
            "
          >
            {leg.toCity}

            <FlagImage
              code={
                leg.toFlag
              }
            />
          </div>


          <svg
            viewBox="0 0 1000 230"
            preserveAspectRatio="none"
            className="
              absolute
              inset-0
              h-full
              w-full
            "
          >
            <path
              d="M 80 175 Q 500 25 920 175"
              fill="none"
              stroke="rgba(99,102,241,.35)"
              strokeWidth="6"
              strokeDasharray="12 12"
            />

            <path
              d="M 80 175 Q 500 25 920 175"
              fill="none"
              stroke="rgba(34,211,238,.75)"
              strokeWidth="3"
              style={{
                animation:
                  'route-glow 1.5s ease-in-out infinite',
              }}
            />
          </svg>


          <div
            className="
              absolute
              text-violet-700
              drop-shadow-lg
            "
            style={{
              left:
                `${planeX}%`,

              top:
                `${planeY}%`,

              animation:
                'plane-float .9s ease-in-out infinite',
            }}
          >
            <Plane
              size={44}
              fill="white"
            />
          </div>


          <div
            className="
              absolute
              bottom-5
              left-1/2
              -translate-x-1/2
              rounded-full
              bg-slate-950
              px-5
              py-2
              text-sm
              font-black
              text-white
              shadow-xl
            "
          >
            ✈️ 飛行
            {' '}
            {durationLabel(
              elapsedMinutes
            )}
            {' / '}
            {durationLabel(
              leg.durationMinutes
            )}
          </div>
        </div>


        <div
          className="
            mt-5
            rounded-[22px]
            bg-white
            p-5
            shadow-sm
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              gap-3
            "
          >
            <p
              className="
                font-black
                text-slate-950
              "
            >
              ✈️ 飛行機を目的地まで動かそう
            </p>

            <p
              className="
                text-sm
                font-black
                text-violet-600
              "
            >
              {flightProgress}%
            </p>
          </div>


          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={
              flightProgress
            }
            disabled={
              solved
            }
            onChange={
              (
                event
              ) => {
                const value =
                  Number(
                    event.target.value
                  );

                setFlightProgress(
                  value
                );

                if (
                  value ===
                  100
                ) {
                  setUnlocked(
                    true
                  );
                }

                setWrongAnswer(
                  null
                );
              }
            }
            className="
              mt-4
              w-full
              cursor-pointer
              accent-violet-600
            "
          />


          <div
            className="
              mt-2
              flex
              justify-between
              text-xs
              font-black
              text-slate-400
            "
          >
            <span>
              DEPARTURE
            </span>

            <span>
              FLYING...
            </span>

            <span>
              ARRIVAL
            </span>
          </div>
        </div>
      </div>


      {
        !unlocked && (
          <div
            className="
              mt-5
              rounded-[24px]
              border
              border-violet-200
              bg-violet-50
              p-5
              text-center
            "
          >
            <Plane
              size={28}
              className="
                mx-auto
                text-violet-600
              "
            />

            <p
              className="
                mt-2
                font-black
                text-violet-800
              "
            >
              まず飛行機を100%まで飛ばそう！
            </p>
          </div>
        )
      }


      {
        unlocked && (
          <div
            className="
              mt-6
              rounded-[30px]
              border-2
              border-amber-200
              bg-gradient-to-r
              from-amber-50
              via-white
              to-cyan-50
              p-6
            "
          >
            <div
              className="
                text-center
              "
            >
              <CalendarDays
                size={30}
                className="
                  mx-auto
                  text-amber-600
                "
              />

              <p
                className="
                  mt-2
                  text-xs
                  font-black
                  tracking-[0.16em]
                  text-amber-600
                "
              >
                ARRIVAL PASSPORT
              </p>

              <h4
                className="
                  mt-1
                  text-2xl
                  font-black
                  text-slate-950
                "
              >
                到着したとき、
                {leg.toCity}
                は何月何日の何時？
              </h4>
            </div>


            <div
              className="
                mt-5
                grid
                grid-cols-1
                gap-4
                md:grid-cols-3
              "
            >
              {
                result.answers.map(
                  (
                    answer
                  ) => (
                    <button
                      key={
                        answer.id
                      }
                      type="button"
                      disabled={
                        solved
                      }
                      onClick={() =>
                        chooseAnswer(
                          answer
                        )
                      }
                      style={
                        wrongAnswer ===
                          answer.id
                          ? {
                              animation:
                                'answer-shake .28s ease',
                            }
                          : undefined
                      }
                      className={`
                        rounded-[24px]
                        border-2
                        bg-white
                        p-5
                        text-center
                        shadow-sm
                        transition-all

                        ${
                          wrongAnswer ===
                            answer.id
                            ? 'border-red-400 bg-red-50'
                            : solved &&
                                answer.correct
                              ? 'border-emerald-400 bg-emerald-50 ring-4 ring-emerald-100'
                              : 'border-slate-200 hover:-translate-y-1 hover:border-violet-400 hover:shadow-xl'
                        }
                      `}
                    >
                      <p
                        className="
                          text-xs
                          font-black
                          tracking-[0.12em]
                          text-slate-400
                        "
                      >
                        PASSPORT STAMP
                      </p>

                      <p
                        className="
                          mt-3
                          text-2xl
                          font-black
                          text-slate-950
                        "
                      >
                        {answer.date}
                      </p>

                      <p
                        className="
                          mt-1
                          text-4xl
                          font-black
                          text-violet-700
                        "
                      >
                        {answer.time}
                      </p>

                      <p
                        className="
                          mt-3
                          inline-flex
                          rounded-full
                          bg-slate-100
                          px-3
                          py-1
                          text-xs
                          font-black
                          text-slate-600
                        "
                      >
                        {dayShiftLabel(
                          answer.shift
                        )}
                      </p>
                    </button>
                  )
                )
              }
            </div>


            {
              !solved && (
                <button
                  type="button"
                  onClick={() =>
                    setHintLevel(
                      (
                        current
                      ) =>
                        Math.min(
                          current +
                            1,
                          2
                        )
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
                    bg-amber-100
                    py-3
                    font-black
                    text-amber-800
                  "
                >
                  <Lightbulb
                    size={18}
                  />

                  ヒントを見る
                </button>
              )
            }


            {
              hintLevel >=
                1 &&
              !solved && (
                <div
                  className="
                    mt-3
                    rounded-2xl
                    bg-amber-50
                    p-4
                    text-center
                    font-bold
                    text-amber-800
                  "
                >
                  💡 まず
                  「出発時刻＋飛行時間」
                  で、何時間後の瞬間かを考えよう。
                </div>
              )
            }


            {
              hintLevel >=
                2 &&
              !solved && (
                <div
                  className="
                    mt-3
                    rounded-2xl
                    bg-violet-50
                    p-4
                    text-center
                    font-bold
                    text-violet-800
                  "
                >
                  💡 その同じ瞬間を、
                  {leg.toCity}
                  の現地時計に読み替えよう。
                  日付が変わることもあります。
                </div>
              )
            }
          </div>
        )
      }


      <div
        className="
          mt-5
          rounded-[22px]
          border
          border-cyan-200
          bg-cyan-50
          p-4
        "
      >
        <div
          className="
            flex
            items-start
            gap-3
          "
        >
          <Clock3
            size={22}
            className="
              mt-0.5
              shrink-0
              text-cyan-700
            "
          />

          <div>
            <p
              className="
                font-black
                text-cyan-900
              "
            >
              FINAL BOSS RULE
            </p>

            <p
              className="
                mt-1
                text-sm
                font-bold
                leading-6
                text-cyan-800
              "
            >
              表示されている飛行時間は
              この学習ゲーム用のシナリオです。
              実際の航空便の所要時間を表しているものではありません。
            </p>
          </div>
        </div>
      </div>


      {
        alreadyCompleted && (
          <p
            className="
              mt-4
              text-center
              text-xs
              font-bold
              text-slate-400
            "
          >
            このMissionは以前クリア済みです。
          </p>
        )
      }
    </div>
  );
}