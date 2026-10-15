import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  School,
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
            ? 0.28
            : 0.13,
        volume: 0.07,
      });
    }
  );
}


function playWrong() {
  tone({
    frequency: 170,
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


function instantFromBaseMinutes(
  referenceDate,
  minutes,
  timeZone
) {
  const base =
    getZoneParts(
      referenceDate,
      timeZone
    );

  const hour =
    Math.floor(
      minutes /
      60
    );

  const minute =
    minutes %
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
      timeZone
    );

  return new Date(
    localAsUtc -
    offset *
      60000
  );
}


function formatMinutes(
  minutes
) {
  const value =
    (
      (
        minutes %
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


function localMinutes(
  instant,
  zone
) {
  const parts =
    getZoneParts(
      instant,
      zone
    );

  return (
    parts.hour *
      60 +
    parts.minute
  );
}


function localTime(
  instant,
  zone
) {
  return formatMinutes(
    localMinutes(
      instant,
      zone
    )
  );
}


function localDateKey(
  instant,
  zone
) {
  const parts =
    getZoneParts(
      instant,
      zone
    );

  return `${parts.year}-${parts.month}-${parts.day}`;
}


function withinSchoolSession({
  startInstant,
  endInstant,
  zone,
  schoolStart,
  schoolEnd,
}) {
  const start =
    localMinutes(
      startInstant,
      zone
    );

  const end =
    localMinutes(
      endInstant,
      zone
    );

  const sameDay =
    localDateKey(
      startInstant,
      zone
    ) ===
    localDateKey(
      endInstant,
      zone
    );

  return (
    sameDay &&
    start >=
      schoolStart &&
    end <=
      schoolEnd
  );
}


function CountryFlag({
  code,
}) {
  return (
    <img
      src={`https://flagcdn.com/w80/${code}.png`}
      alt=""
      width="56"
      height="38"
      loading="lazy"
      decoding="async"
      className="
        h-[38px]
        w-[56px]
        rounded-lg
        object-cover
        shadow-md
        ring-1
        ring-black/10
      "
    />
  );
}


function Confetti() {
  return (
    <>
      <style>
        {`
          @keyframes world-school-confetti {
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

          @keyframes school-shake {
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
          z-[25000]
          overflow-hidden
        "
      >
        {
          Array.from(
            {
              length: 70,
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
                      41
                    ) %
                    100}%`,

                  background:
                    [
                      '#22c55e',
                      '#06b6d4',
                      '#3b82f6',
                      '#facc15',
                      '#f97316',
                      '#8b5cf6',
                    ][
                      index %
                      6
                    ],

                  '--x':
                    `${(
                      index %
                        2
                        ? 1
                        : -1
                    ) *
                    (
                      25 +
                      (
                        index %
                        8
                      ) *
                      8
                    )}px`,

                  animation:
                    `world-school-confetti ${
                      1.8 +
                      (
                        index %
                        8
                      ) *
                      0.12
                    }s linear ${
                      (
                        index %
                        10
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


function SuccessModal({
  round,
  roundIndex,
  roundCount,
  selectedTime,
  statuses,
  commonStart,
  commonEnd,
  finalRound,
  onContinue,
}) {
  return (
    <div
      className="
        fixed
        inset-0
        z-[26000]
        flex
        items-center
        justify-center
        bg-slate-950/70
        p-5
        backdrop-blur-sm
      "
    >
      <Confetti />

      <div
        className="
          relative
          w-full
          max-w-3xl
          rounded-[34px]
          border-4
          border-emerald-300
          bg-white
          p-8
          text-center
          shadow-[0_30px_100px_rgba(0,0,0,.45)]
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
            bg-emerald-500
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
            tracking-[0.18em]
            text-emerald-600
          "
        >
          ROUND {roundIndex + 1} / {roundCount} CLEAR
        </p>

        <h3
          className="
            mt-2
            text-3xl
            font-black
            text-slate-950
          "
        >
          🎉 {round.regionJa}の学校をつなげた！
        </h3>

        <p
          className="
            mt-3
            font-bold
            text-slate-600
          "
        >
          日本時間
          {' '}
          {formatMinutes(selectedTime)}
          {' '}
          から30分なら、
          4校すべてが授業時間内です。
        </p>


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
            statuses.map(
              (
                city
              ) => (
                <div
                  key={
                    city.id
                  }
                  className="
                    rounded-2xl
                    bg-emerald-50
                    p-4
                  "
                >
                  <div
                    className="
                      flex
                      justify-center
                    "
                  >
                    <CountryFlag
                      code={
                        city.flagCode
                      }
                    />
                  </div>

                  <p
                    className="
                      mt-2
                      font-black
                      text-slate-950
                    "
                  >
                    {city.city}
                  </p>

                  <p
                    className="
                      mt-1
                      text-2xl
                      font-black
                      text-emerald-700
                    "
                  >
                    {city.localTime}
                  </p>
                </div>
              )
            )
          }
        </div>


        <div
          className="
            mt-6
            rounded-[24px]
            bg-cyan-50
            p-5
          "
        >
          <p
            className="
              text-xs
              font-black
              tracking-[0.15em]
              text-cyan-700
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
              text-slate-800
            "
          >
            日本時間
            {' '}
            {formatMinutes(commonStart)}
            {' '}
            〜
            {' '}
            {formatMinutes(commonEnd)}
            {' '}
            が、この4校の共通学校時間です。
          </p>

          <p
            className="
              mt-2
              text-sm
              font-bold
              leading-6
              text-slate-600
            "
          >
            {round.learning}
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
            justify-center
            gap-2
            rounded-2xl
            bg-slate-950
            px-8
            py-4
            text-lg
            font-black
            text-white
            shadow-lg
            hover:bg-emerald-700
          "
        >
          {
            finalRound
              ? 'わかった！Mission 9 Clear'
              : 'わかった！次の地域へ'
          }

          {
            !finalRound && (
              <ArrowRight
                size={20}
              />
            )
          }
        </button>
      </div>
    </div>
  );
}


export default function SchoolOverlapPlannerMission({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const challenge =
    mission
      ?.challenge ??
    {};

  const rounds =
    challenge.rounds ??
    [];

  const schoolStart =
    challenge.schoolStartMinutes ??
    510;

  const schoolEnd =
    challenge.schoolEndMinutes ??
    960;

  const duration =
    challenge.sessionMinutes ??
    30;

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

  const round =
    rounds[
      roundIndex
    ];

  const [
    selectedTime,
    setSelectedTime,
  ] =
    useState(
      rounds[0]
        ?.initialTimeMinutes ??
      720
    );

  const [
    wrong,
    setWrong,
  ] =
    useState(
      false
    );

  const [
    showSuccess,
    setShowSuccess,
  ] =
    useState(
      false
    );

  const [
    completed,
    setCompleted,
  ] =
    useState(
      false
    );

  const completedRef =
    useRef(
      false
    );


  if (!round) {
    return null;
  }


  const cities =
    round.cities ??
    [];


  const getStatuses =
    (
      baseMinutes
    ) => {
      const startInstant =
        instantFromBaseMinutes(
          now,
          baseMinutes,
          'Asia/Tokyo'
        );

      const endInstant =
        new Date(
          startInstant.getTime() +
          duration *
            60000
        );


      return cities.map(
        (
          city
        ) => ({
          ...city,

          localTime:
            localTime(
              startInstant,
              city.zone
            ),

          available:
            withinSchoolSession({
              startInstant,
              endInstant,
              zone:
                city.zone,
              schoolStart,
              schoolEnd,
            }),
        })
      );
    };


  const statuses =
    useMemo(
      () =>
        getStatuses(
          selectedTime
        ),
      [
        selectedTime,
        roundIndex,
        now,
      ]
    );


  const readyCount =
    statuses.filter(
      (
        city
      ) =>
        city.available
    ).length;


  const allReady =
    statuses.length >
      0 &&
    readyCount ===
      statuses.length;


  const validStartTimes =
    useMemo(
      () => {
        const result =
          [];

        for (
          let minute =
            schoolStart;
          minute <=
            schoolEnd -
              duration;
          minute +=
            30
        ) {
          const list =
            getStatuses(
              minute
            );

          if (
            list.length >
              0 &&
            list.every(
              (
                city
              ) =>
                city.available
            )
          ) {
            result.push(
              minute
            );
          }
        }

        return result;
      },
      [
        roundIndex,
        now,
      ]
    );


  const commonStart =
    validStartTimes[0] ??
    0;


  const commonEnd =
    validStartTimes.length
      ? validStartTimes[
          validStartTimes.length -
            1
        ] +
        duration
      : 0;


  const connect =
    () => {
      if (
        allReady
      ) {
        playCorrect();

        setShowSuccess(
          true
        );

        return;
      }


      playWrong();

      setWrong(
        true
      );

      window.setTimeout(
        () => {
          setWrong(
            false
          );
        },
        500
      );
    };


  const continueRound =
    () => {
      setShowSuccess(
        false
      );


      if (
        roundIndex <
        rounds.length -
          1
      ) {
        const nextIndex =
          roundIndex +
          1;

        setRoundIndex(
          nextIndex
        );

        setSelectedTime(
          rounds[
            nextIndex
          ]
            ?.initialTimeMinutes ??
          720
        );

        setWrong(
          false
        );

        return;
      }


      setCompleted(
        true
      );


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


  return (
    <div>
      {
        showSuccess && (
          <SuccessModal
            round={
              round
            }
            roundIndex={
              roundIndex
            }
            roundCount={
              rounds.length
            }
            selectedTime={
              selectedTime
            }
            statuses={
              statuses
            }
            commonStart={
              commonStart
            }
            commonEnd={
              commonEnd
            }
            finalRound={
              roundIndex ===
              rounds.length -
                1
            }
            onContinue={
              continueRound
            }
          />
        )
      }


      <div
        className="
          rounded-[30px]
          bg-gradient-to-r
          from-slate-950
          via-indigo-950
          to-cyan-950
          p-6
          text-white
          shadow-xl
        "
      >
        <div
          className="
            flex
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
              MISSION 09 · GLOBAL SCHOOL CONNECT
            </p>

            <h3
              className="
                mt-2
                text-3xl
                font-black
              "
            >
              🌏 日本から世界の学校をつなげ！
            </h3>

            <p
              className="
                mt-2
                font-bold
                text-indigo-100
              "
            >
              日本の授業時間内で、
              海外3校も授業中になる30分を探そう。
            </p>
          </div>


          <div
            className="
              rounded-2xl
              bg-white/10
              px-5
              py-3
              text-center
            "
          >
            <p
              className="
                text-[10px]
                font-black
                tracking-[0.14em]
                text-cyan-300
              "
            >
              WORLD ROUND
            </p>

            <p
              className="
                mt-1
                text-2xl
                font-black
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
          border-2
          border-violet-200
          bg-gradient-to-r
          from-violet-50
          via-white
          to-cyan-50
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
          <div
            className="
              text-4xl
            "
          >
            {round.icon}
          </div>

          <div>
            <p
              className="
                text-xs
                font-black
                tracking-[0.16em]
                text-violet-600
              "
            >
              ROUND {roundIndex + 1}
            </p>

            <h4
              className="
                text-2xl
                font-black
                text-slate-950
              "
            >
              {round.regionJa}
            </h4>

            <p
              className="
                mt-1
                text-sm
                font-bold
                text-slate-600
              "
            >
              {round.challengeText}
            </p>
          </div>
        </div>
      </div>


      <div
        className="
          mt-5
          rounded-[22px]
          border
          border-amber-200
          bg-amber-50
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
          <School
            size={22}
            className="
              mt-1
              text-amber-600
            "
          />

          <div>
            <p
              className="
                font-black
                text-amber-900
              "
            >
              このMissionの共通ルール
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
              このゲームでは、
              すべての学校時間を
              <strong>
                {' '}
                08:30〜16:00
                {' '}
              </strong>
              とします。
              30分間すべてがこの時間内に入る場所を探します。
            </p>
          </div>
        </div>
      </div>


      <div
        className="
          mt-5
          rounded-[30px]
          border
          border-indigo-200
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
                tracking-[0.15em]
                text-indigo-500
              "
            >
              JAPAN MASTER TIMELINE
            </p>

            <p
              className="
                mt-1
                text-4xl
                font-black
                text-slate-950
              "
            >
              {formatMinutes(
                selectedTime
              )}
            </p>
          </div>


          <div
            className={`
              rounded-full
              px-5
              py-3
              text-sm
              font-black
              text-white

              ${
                allReady
                  ? 'bg-emerald-500'
                  : 'bg-slate-500'
              }
            `}
          >
            {readyCount}
            {' / '}
            {statuses.length}
            {' '}
            SCHOOL READY
          </div>
        </div>


        <div
          className="
            mt-8
          "
        >
          <input
            type="range"
            min="510"
            max="930"
            step="30"
            value={
              selectedTime
            }
            onChange={
              (
                event
              ) => {
                setSelectedTime(
                  Number(
                    event.target.value
                  )
                );

                setWrong(
                  false
                );
              }
            }
            className="
              w-full
              cursor-pointer
              accent-violet-600
            "
          />


          <div
            className="
              mt-3
              flex
              justify-between
              text-[10px]
              font-black
              text-slate-400
            "
          >
            <span>
              08:30
            </span>

            <span>
              10:00
            </span>

            <span>
              12:00
            </span>

            <span>
              14:00
            </span>

            <span>
              15:30
            </span>
          </div>
        </div>
      </div>


      <div
        className="
          mt-5
          grid
          grid-cols-1
          gap-4
          md:grid-cols-2
        "
      >
        {
          statuses.map(
            (
              city
            ) => (
              <div
                key={
                  city.id
                }
                className={`
                  rounded-[26px]
                  border-2
                  p-5
                  transition-all

                  ${
                    city.available
                      ? 'border-emerald-400 bg-emerald-50 shadow-md'
                      : 'border-rose-300 bg-rose-50'
                  }
                `}
              >
                <div
                  className="
                    flex
                    items-start
                    gap-4
                  "
                >
                  <CountryFlag
                    code={
                      city.flagCode
                    }
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
                    <p
                      className={`
                        text-3xl
                        font-black

                        ${
                          city.available
                            ? 'text-emerald-700'
                            : 'text-rose-600'
                        }
                      `}
                    >
                      {city.localTime}
                    </p>

                    <p
                      className="
                        mt-1
                        text-[10px]
                        font-black
                        text-slate-400
                      "
                    >
                      LOCAL TIME
                    </p>
                  </div>
                </div>


                <div
                  className="
                    mt-4
                    flex
                    items-center
                    justify-between
                  "
                >
                  <span
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
                        ? '● SCHOOL TIME'
                        : '● OUTSIDE SCHOOL'
                    }
                  </span>

                  <span
                    className="
                      text-xs
                      font-black
                      text-slate-500
                    "
                  >
                    🏫 08:30–16:00
                  </span>
                </div>
              </div>
            )
          )
        }
      </div>


      <button
        type="button"
        onClick={
          connect
        }
        style={
          wrong
            ? {
                animation:
                  'school-shake .28s ease',
              }
            : undefined
        }
        className={`
          mt-6
          w-full
          rounded-[22px]
          py-4
          text-lg
          font-black
          text-white
          shadow-lg
          transition

          ${
            allReady
              ? 'bg-emerald-600 hover:bg-emerald-700'
              : 'bg-slate-950 hover:bg-rose-700'
          }
        `}
      >
        {
          allReady
            ? '🌍 この30分で4校をつなぐ！'
            : '🛰️ この時間でCONNECTしてみる'
        }
      </button>


      {
        wrong && (
          <div
            className="
              mt-4
              rounded-2xl
              border-2
              border-rose-300
              bg-rose-50
              p-4
              text-center
              font-black
              text-rose-700
            "
          >
            まだ学校時間外の都市があります。
            赤いカードの現地時刻を見よう！
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
            gap-3
          "
        >
          <CalendarClock
            size={22}
            className="
              shrink-0
              text-cyan-700
            "
          />

          <p
            className="
              text-sm
              font-bold
              leading-6
              text-cyan-900
            "
          >
            ヒント：
            {round.hint}
          </p>
        </div>
      </div>


      {
        completed && (
          <div
            className="
              mt-6
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
              🌏 Mission 9 Complete!
            </p>

            <p
              className="
                mt-2
                font-bold
                text-emerald-700
              "
            >
              日本からアフリカ・中東・アジア・オセアニアの
              学校をつなぐ時間を見つけました。
            </p>

            {
              alreadyCompleted && (
                <p
                  className="
                    mt-2
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