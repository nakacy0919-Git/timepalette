import {
  CalendarClock,
  CheckCircle2,
  School,
  Sparkles,
} from 'lucide-react';

import {
  useMemo,
  useRef,
  useState,
} from 'react';


let schoolAudioContext = null;


function getAudioContext() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!schoolAudioContext) {
      schoolAudioContext =
        new AudioContextClass();
    }

    if (
      schoolAudioContext.state ===
      'suspended'
    ) {
      schoolAudioContext.resume();
    }

    return schoolAudioContext;
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
          index ===
            3
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
    volume: 0.045,
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
  const baseParts =
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
      baseParts.year,
      baseParts.month - 1,
      baseParts.day,
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


function dateKey(
  instant,
  zone
) {
  const parts =
    getZoneParts(
      instant,
      zone
    );

  return [
    parts.year,
    parts.month,
    parts.day,
  ].join(
    '-'
  );
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

  const sameLocalDay =
    dateKey(
      startInstant,
      zone
    ) ===
    dateKey(
      endInstant,
      zone
    );

  return (
    sameLocalDay &&
    start >=
      schoolStart &&
    end <=
      schoolEnd
  );
}


function Confetti() {
  return (
    <>
      <style>
        {`
          @keyframes school-confetti {
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
                        41
                      ) %
                      100
                    }%`,

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
                          8
                        ) *
                        8
                      )
                    }px`,

                  animation:
                    `school-confetti ${
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
  selectedTime,
  statuses,
  commonStart,
  commonEnd,
  onClose,
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
            tracking-[0.20em]
            text-emerald-600
          "
        >
          SCHOOL CONNECTION READY
        </p>

        <h3
          className="
            mt-2
            text-3xl
            font-black
            text-slate-950
          "
        >
          🎉 4校すべて授業時間内！
        </h3>

        <p
          className="
            mt-3
            font-bold
            text-slate-600
          "
        >
          Japan
          {' '}
          {formatMinutes(selectedTime)}
          {' '}
          から30分なら、
          4校すべてが学校にいる時間です。
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
                  <p
                    className="
                      text-3xl
                    "
                  >
                    {city.flag}
                  </p>

                  <p
                    className="
                      mt-1
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
              tracking-[0.14em]
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
            今日の時差では、
            日本時間
            {' '}
            {formatMinutes(commonStart)}
            {' '}
            〜
            {' '}
            {formatMinutes(commonEnd)}
            {' '}
            が4校の共通学校時間です。
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
            国際交流では、参加したい国を決めるだけでなく、
            「学校時間が重なるか」を最初に確認することが大切です。
          </p>
        </div>


        <button
          type="button"
          onClick={
            onClose
          }
          className="
            mt-6
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
          わかった！Mission Clear
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

  const cities =
    challenge.cities ??
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


  const baseZone =
    challenge.baseZone ??
    'Asia/Tokyo';

  const baseCity =
    challenge.baseCity ??
    'Tokyo';

  const baseCountry =
    challenge.baseCountry ??
    '日本';

  const baseFlag =
    challenge.baseFlag ??
    '🇯🇵';

  const now =
    useMemo(
      () =>
        new Date(),
      []
    );

  const [
    selectedTime,
    setSelectedTime,
  ] =
    useState(
      challenge.initialTimeMinutes ??
      960
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


  const getStatuses =
    (
      baseMinutes
    ) => {
      const startInstant =
        instantFromBaseMinutes(
          now,
          baseMinutes,
          baseZone
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
        now,
        cities,
        schoolStart,
        schoolEnd,
        duration,
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
            0;
          minute <
            1440;
          minute +=
            30
        ) {
          const cityStatuses =
            getStatuses(
              minute
            );

          if (
            cityStatuses.length >
              0 &&
            cityStatuses.every(
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
        now,
        cities,
        schoolStart,
        schoolEnd,
        duration,
      ]
    );


  const commonStart =
    validStartTimes[0] ??
    0;


  const lastStart =
    validStartTimes[
      validStartTimes.length -
        1
    ] ??
    commonStart;


  const commonEnd =
    Math.min(
      1440,
      lastStart +
      duration
    );


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


  const finish =
    () => {
      setShowSuccess(
        false
      );

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
            onClose={
              finish
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
        <p
          className="
            text-xs
            font-black
            tracking-[0.20em]
            text-cyan-300
          "
        >
          MISSION 09 · SCHOOL CONNECT WINDOW
        </p>

        <h3
          className="
            mt-2
            text-3xl
            font-black
          "
        >
          🤝 日本と海外3校が授業中の30分を探せ！
        </h3>

        <p
          className="
            mt-2
            font-bold
            text-indigo-100
          "
        >
          日本の学校から海外3校へオンライン交流！
          4校すべてが授業中になる30分を見つけよう。
        </p>
      </div>


      <div
        className="
          mt-5
          rounded-[24px]
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
              shrink-0
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
              このMissionのルール
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
              4校すべての学校時間を
              <strong>
                {' '}
                08:30〜16:00
                {' '}
              </strong>
              とします。
              実際の学校時間は国や学校によって異なります。
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
            relative
            mt-8
            pt-8
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              left-0
              right-0
              top-[43px]
              h-3
              rounded-full
              bg-gradient-to-r
              from-indigo-300
              via-cyan-300
              to-violet-300
            "
          />


          <input
            type="range"
            min="0"
            max="1410"
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
              relative
              z-10
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
              00:00
            </span>

            <span>
              06:00
            </span>

            <span>
              12:00
            </span>

            <span>
              18:00
            </span>

            <span>
              24:00
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
                    gap-3
                  "
                >
                  <div
                    className="
                      text-4xl
                    "
                  >
                    {city.flag}
                  </div>

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
                    gap-3
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
          transition-all

          ${
            allReady
              ? 'bg-emerald-600 hover:scale-[1.01] hover:bg-emerald-700'
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
            赤いカードの現地時刻を見て調整しよう！
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
            日本の午後は、
            アフリカやヨーロッパでは朝になることがあります。
            日本がまだ学校にいる間に、
            海外の学校も授業を始めている時間を探すのがポイントです。
          </p>
        </div>
      </div>


      {
        completed && (
          <div
            className="
              mt-5
              rounded-[24px]
              border-2
              border-emerald-300
              bg-emerald-50
              p-5
              text-center
            "
          >
            <CheckCircle2
              size={34}
              className="
                mx-auto
                text-emerald-600
              "
            />

            <p
              className="
                mt-2
                text-xl
                font-black
                text-emerald-800
              "
            >
              Mission 9 Clear!
            </p>

            {
              alreadyCompleted && (
                <p
                  className="
                    mt-1
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