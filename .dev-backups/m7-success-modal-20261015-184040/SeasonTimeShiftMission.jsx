import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

import {
  useMemo,
  useRef,
  useState,
} from 'react';


const SEASONS = [
  {
    id: 'winter',
    monthDay: '01-15',
    month: 'JAN 15',
    label: '1月',
    season: '冬',
    icon: '❄️',
    sky:
      'from-sky-100 via-white to-indigo-100',
    accent:
      'text-indigo-700',
    badge:
      'bg-indigo-600',
  },

  {
    id: 'summer',
    monthDay: '07-15',
    month: 'JUL 15',
    label: '7月',
    season: '夏',
    icon: '☀️',
    sky:
      'from-sky-200 via-cyan-50 to-amber-100',
    accent:
      'text-orange-700',
    badge:
      'bg-orange-500',
  },
];


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
            Number(
              part.value
            ),
          ]
        )
    );

  return parts;
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


function localInstant({
  dateText,
  timeText,
  timeZone,
}) {
  const [
    year,
    month,
    day,
  ] =
    dateText
      .split('-')
      .map(Number);

  const [
    hour,
    minute,
  ] =
    timeText
      .split(':')
      .map(Number);

  const localAsUtc =
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


function getSnapshot({
  year,
  season,
  baseTime,
  targetZone,
}) {
  const dateText =
    `${year}-${season.monthDay}`;

  const instant =
    localInstant({
      dateText,
      timeText:
        baseTime,
      timeZone:
        'Africa/Kigali',
    });

  const baseOffset =
    getOffsetMinutes(
      instant,
      'Africa/Kigali'
    );

  const targetOffset =
    getOffsetMinutes(
      instant,
      targetZone
    );

  const baseParts =
    getZoneParts(
      instant,
      'Africa/Kigali'
    );

  const targetParts =
    getZoneParts(
      instant,
      targetZone
    );

  return {
    targetTime:
      formatZoneTime(
        instant,
        targetZone
      ),

    difference:
      targetOffset -
      baseOffset,

    dayShift:
      dateSerial(
        targetParts
      ) -
      dateSerial(
        baseParts
      ),
  };
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

  const abs =
    Math.abs(
      minutes
    );

  const hours =
    Math.floor(
      abs /
      60
    );

  const mins =
    abs %
    60;

  if (
    mins ===
    0
  ) {
    return `${sign}${hours}時間`;
  }

  return `${sign}${hours}時間${mins}分`;
}


function dayShiftLabel(
  value
) {
  if (
    value >
    0
  ) {
    return '次の日';
  }

  if (
    value <
    0
  ) {
    return '前の日';
  }

  return '同じ日';
}


function Flag({
  code,
}) {
  const common = {
    width: 48,
    height: 32,
    viewBox: '0 0 48 32',
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
          width="48"
          height="32"
          fill="#fff"
        />

        <circle
          cx="24"
          cy="16"
          r="8"
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
          width="16"
          height="32"
          fill="#0055A4"
        />

        <rect
          x="16"
          width="16"
          height="32"
          fill="#fff"
        />

        <rect
          x="32"
          width="16"
          height="32"
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
          width="48"
          height="32"
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
                  32 /
                  7
                }
                width="48"
                height={
                  32 /
                  14
                }
                fill="#B22234"
              />
            )
          )
        }

        <rect
          width="21"
          height="17"
          fill="#3C3B6E"
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
          width="48"
          height="10"
          fill="#000"
        />

        <rect
          y="10"
          width="48"
          height="2"
          fill="#fff"
        />

        <rect
          y="12"
          width="48"
          height="8"
          fill="#BB0000"
        />

        <rect
          y="20"
          width="48"
          height="2"
          fill="#fff"
        />

        <rect
          y="22"
          width="48"
          height="10"
          fill="#006600"
        />
      </svg>
    );
  }


  return (
    <svg {...common}>
      <rect
        width="48"
        height="16"
        fill="#00A1DE"
      />

      <rect
        y="16"
        width="48"
        height="8"
        fill="#FAD201"
      />

      <rect
        y="24"
        width="48"
        height="8"
        fill="#20603D"
      />

      <circle
        cx="39"
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
          @keyframes season-confetti {
            0% {
              transform:
                translateY(-10vh)
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
                        37
                      ) %
                      100
                    }%`,

                  background:
                    [
                      '#60a5fa',
                      '#facc15',
                      '#f97316',
                      '#22c55e',
                      '#8b5cf6',
                      '#ec4899',
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
                        25 +
                        index %
                          8 *
                          8
                      )
                    }px`,

                  animation:
                    `season-confetti ${
                      1.8 +
                      index %
                        8 *
                        0.13
                    }s linear ${
                      index %
                        11 *
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


function SeasonPortal({
  season,
  snapshot,
  targetCity,
  targetFlag,
  baseTime,
  opened,
  success,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        relative
        min-h-[300px]
        overflow-hidden
        rounded-[30px]
        border-2
        bg-gradient-to-br
        p-6
        text-left
        transition-all
        duration-500

        ${season.sky}

        ${
          success
            ? 'border-emerald-400 ring-4 ring-emerald-100 shadow-xl'
            : opened
              ? 'border-violet-400 shadow-xl'
              : 'border-white shadow-lg hover:-translate-y-1 hover:shadow-xl'
        }
      `}
    >
      {
        season.id ===
          'winter' && (
          <>
            <div
              className="
                absolute
                left-[15%]
                top-8
                text-3xl
                opacity-60
                animate-pulse
              "
            >
              ❄️
            </div>

            <div
              className="
                absolute
                right-[12%]
                top-24
                text-2xl
                opacity-50
              "
            >
              ❄
            </div>
          </>
        )
      }


      {
        season.id ===
          'summer' && (
          <div
            className="
              absolute
              right-8
              top-8
              text-6xl
              drop-shadow
            "
          >
            ☀️
          </div>
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
          "
        >
          <div>
            <p
              className={`
                text-xs
                font-black
                tracking-[0.18em]

                ${season.accent}
              `}
            >
              {season.month}
            </p>

            <p
              className="
                mt-1
                text-3xl
                font-black
                text-slate-950
              "
            >
              {season.icon}
              {' '}
              {season.label}
              ・
              {season.season}
            </p>
          </div>

          <div
            className={`
              rounded-full
              px-4
              py-2
              text-xs
              font-black
              text-white

              ${season.badge}
            `}
          >
            {season.label} CHECK
          </div>
        </div>


        <div
          className="
            mt-16
            grid
            grid-cols-[1fr_auto_1fr]
            items-center
            gap-3
          "
        >
          <div
            className="
              rounded-2xl
              bg-white/90
              p-4
              text-center
              shadow
            "
          >
            <div
              className="
                flex
                justify-center
              "
            >
              <Flag
                code="rw"
              />
            </div>

            <p
              className="
                mt-2
                text-xs
                font-black
                text-slate-500
              "
            >
              KIGALI
            </p>

            <p
              className="
                text-2xl
                font-black
                text-slate-950
              "
            >
              {baseTime}
            </p>
          </div>


          <ArrowRight
            size={28}
            className="
              text-slate-600
            "
          />


          <div
            className="
              rounded-2xl
              bg-white/90
              p-4
              text-center
              shadow
            "
          >
            <div
              className="
                flex
                justify-center
              "
            >
              <Flag
                code={
                  targetFlag
                }
              />
            </div>

            <p
              className="
                mt-2
                text-xs
                font-black
                text-slate-500
              "
            >
              {targetCity.toUpperCase()}
            </p>

            <p
              className="
                text-2xl
                font-black
                text-slate-950
              "
            >
              {
                opened
                  ? snapshot.targetTime
                  : '??:??'
              }
            </p>
          </div>
        </div>


        <div
          className="
            mt-4
            rounded-2xl
            bg-white/75
            px-4
            py-3
            text-center
            backdrop-blur
          "
        >
          {
            opened
              ? (
                  <>
                    <p
                      className="
                        text-lg
                        font-black
                        text-slate-900
                      "
                    >
                      時差：
                      {
                        formatDifference(
                          snapshot.difference
                        )
                      }
                    </p>

                    <p
                      className="
                        mt-1
                        text-xs
                        font-bold
                        text-slate-500
                      "
                    >
                      {
                        dayShiftLabel(
                          snapshot.dayShift
                        )
                      }
                    </p>
                  </>
                )
              : (
                  <p
                    className="
                      font-black
                      text-violet-700
                    "
                  >
                    👆 {season.label}の時刻を見る
                  </p>
                )
          }
        </div>
      </div>
    </button>
  );
}


export default function SeasonTimeShiftMission({
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

  const year =
    new Date()
      .getFullYear();

  const baseTime =
    challenge.baseTime ??
    '18:00';

  const [
    roundIndex,
    setRoundIndex,
  ] =
    useState(
      0
    );

  const [
    opened,
    setOpened,
  ] =
    useState(
      {}
    );

  const [
    feedback,
    setFeedback,
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
    seasonAnswer,
    setSeasonAnswer,
  ] =
    useState(
      null
    );


  const [
    compareAnswer,
    setCompareAnswer,
  ] =
    useState(
      null
    );

  const [
    finalSelected,
    setFinalSelected,
  ] =
    useState(
      []
    );

  const [
    wrongCity,
    setWrongCity,
  ] =
    useState(
      null
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


  const citySnapshots =
    useMemo(
      () => {
        if (
          !round ||
          round.mode ===
          'change-hunt'
        ) {
          return null;
        }

        return Object.fromEntries(
          SEASONS.map(
            (
              season
            ) => [
              season.id,

              getSnapshot({
                year,
                season,
                baseTime,
                targetZone:
                  round.targetZone,
              }),
            ]
          )
        );
      },
      [
        round,
        year,
        baseTime,
      ]
    );


  const finalCities =
    useMemo(
      () => {
        if (
          !round ||
          round.mode !==
          'change-hunt'
        ) {
          return [];
        }

        return (
          round.cities ??
          []
        ).map(
          (
            city
          ) => {
            const winter =
              getSnapshot({
                year,
                season:
                  SEASONS[0],
                baseTime,
                targetZone:
                  city.zone,
              });

            const summer =
              getSnapshot({
                year,
                season:
                  SEASONS[1],
                baseTime,
                targetZone:
                  city.zone,
              });

            return {
              ...city,
              winter,
              summer,

              changes:
                winter.difference !==
                summer.difference,
            };
          }
        );
      },
      [
        round,
        year,
        baseTime,
      ]
    );


  if (!round) {
    return null;
  }


  const nextRound =
    () => {
      setRoundIndex(
        (
          current
        ) =>
          current +
          1
      );

      setOpened(
        {}
      );

      setFeedback(
        null
      );

      setSolved(
        false
      );

      setSeasonAnswer(
        null
      );

      setCompareAnswer(
        null
      );

      setFinalSelected(
        []
      );

      setWrongCity(
        null
      );
    };


  const openSeason =
    (
      seasonId
    ) => {
      if (
        solved
      ) {
        return;
      }


      const season =
        SEASONS.find(
          (
            item
          ) =>
            item.id ===
            seasonId
        );


      const nextOpened = {
        ...opened,

        [
          seasonId
        ]:
          true,
      };


      setOpened(
        nextOpened
      );


      const snapshot =
        citySnapshots[
          seasonId
        ];


      if (
        nextOpened.winter &&
        nextOpened.summer
      ) {
        setFeedback({
          type:
            'explore',

          title:
            '1月と7月がそろった！',

          text:
            '2つの時刻を見比べて、下の質問に答えよう。',
        });

        return;
      }


      setFeedback({
        type:
          'explore',

        title:
          `${season?.label ?? ''}の時刻を確認！`,

        text:
          `${round.targetCity}は ${snapshot.targetTime}。次はもう一方の季節も見てみよう。`,
      });
    };


  const answerSeason =
    (
      seasonId
    ) => {
      if (
        solved ||
        !opened.winter ||
        !opened.summer
      ) {
        return;
      }


      let correctSeasonId =
        null;


      if (
        round.goal ===
        'same-time'
      ) {
        correctSeasonId =
          SEASONS.find(
            (
              season
            ) =>
              citySnapshots[
                season.id
              ].difference ===
              0
          )?.id ??
          null;
      }


      if (
        round.goal ===
        'smaller-gap'
      ) {
        correctSeasonId =
          Math.abs(
            citySnapshots
              .winter
              .difference
          ) <
          Math.abs(
            citySnapshots
              .summer
              .difference
          )
            ? 'winter'
            : 'summer';
      }


      setSeasonAnswer(
        seasonId
      );


      if (
        seasonId ===
        correctSeasonId
      ) {
        setSolved(
          true
        );

        setFeedback({
          type:
            'correct',

          title:
            '正解！',

          text:
            round.success,
        });

        return;
      }


      setFeedback({
        type:
          'wrong',

        title:
          'もう一度比べよう！',

        text:
          '1月と7月の「Kigaliとの差」をもう一度見比べてみよう。',
      });


      window.setTimeout(
        () => {
          setSeasonAnswer(
            null
          );
        },
        650
      );
    };


  const answerConstant =
    (
      answer
    ) => {
      const winter =
        citySnapshots.winter;

      const summer =
        citySnapshots.summer;

      const actuallyChanges =
        winter.difference !==
        summer.difference;


      const correct =
        (
          answer ===
            'changes' &&
          actuallyChanges
        ) ||
        (
          answer ===
            'constant' &&
          !actuallyChanges
        );


      setCompareAnswer(
        answer
      );


      if (
        correct
      ) {
        setSolved(
          true
        );

        setFeedback({
          type:
            'correct',

          title:
            'その通り！',

          text:
            round.success,
        });

        return;
      }


      setFeedback({
        type:
          'wrong',

        title:
          'もう一度見比べよう',

        text:
          '1月と7月の時差表示を比べてみよう。',
      });

      window.setTimeout(
        () => {
          setCompareAnswer(
            null
          );
        },
        650
      );
    };


  const chooseFinalCity =
    (
      city
    ) => {
      if (
        complete ||
        finalSelected.includes(
          city.id
        )
      ) {
        return;
      }


      if (
        !city.changes
      ) {
        setWrongCity(
          city.id
        );

        setFeedback({
          type:
            'wrong',

          title:
            'この都市は変わらない！',

          text:
            `${city.name}は1月と7月でKigaliとの時差が同じです。`,
        });

        window.setTimeout(
          () => {
            setWrongCity(
              null
            );
          },
          650
        );

        return;
      }


      const next = [
        ...finalSelected,
        city.id,
      ];

      setFinalSelected(
        next
      );

      setFeedback({
        type:
          'correct',

        title:
          '正解！',

        text:
          `${city.name}は1月と7月でKigaliとの時差が変わります。`,
      });


      const allChanging =
        finalCities
          .filter(
            (
              item
            ) =>
              item.changes
          )
          .map(
            (
              item
            ) =>
              item.id
          );


      if (
        next.length ===
        allChanging.length
      ) {
        window.setTimeout(
          () => {
            setComplete(
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
          },
          450
        );
      }
    };


  if (
    complete
  ) {
    return (
      <div
        className="
          relative
          overflow-hidden
          rounded-[36px]
          border-2
          border-violet-300
          bg-gradient-to-br
          from-sky-50
          via-white
          to-orange-50
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
            from-sky-400
            via-violet-500
            to-orange-400
            text-6xl
            shadow-2xl
          "
        >
          🌍
        </div>

        <Sparkles
          size={38}
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
          SEASON SHIFT COMPLETE
        </p>

        <h3
          className="
            mt-2
            text-4xl
            font-black
            text-slate-950
          "
        >
          SEASON TIME MASTER!
        </h3>

        <p
          className="
            mx-auto
            mt-5
            max-w-3xl
            font-bold
            leading-8
            text-slate-600
          "
        >
          ParisやNew Yorkでは、
          季節に合わせてサマータイムを使うため、
          Kigaliとの時差が1年の中で変わることがあります。
          Tokyo・Kigali・Nairobiのように、
          この比較では1月と7月で時差が変わらない都市もあります。
        </p>


        <div
          className="
            mx-auto
            mt-6
            max-w-3xl
            rounded-[24px]
            bg-amber-50
            p-5
            text-left
          "
        >
          <p
            className="
              font-black
              text-amber-900
            "
          >
            🌟 大切なポイント
          </p>

          <p
            className="
              mt-2
              font-bold
              leading-7
              text-amber-800
            "
          >
            「季節そのもの」が時差を変えるのではありません。
            サマータイムを採用している地域が、
            季節に合わせて時計を1時間動かすため、
            結果として国どうしの時差が変わります。
          </p>
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
          @keyframes season-wrong {
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
          rounded-[30px]
          border
          border-violet-200
          bg-gradient-to-r
          from-indigo-50
          via-white
          to-orange-50
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
              MISSION 07 · SEASON SHIFT LAB
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
              🗓️ 1月と7月で時差は変わる？
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
              同じKigali
              {' '}
              <strong>
                {baseTime}
              </strong>
              {' '}
              でも、1月と7月で世界の時計は同じとは限りません。
              SEASON CHECKを開いて調べよう。
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
              SEASON CASE
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


      {
        round.mode !==
          'change-hunt' && (
          <>
            <div
              className="
                mt-5
                rounded-[24px]
                bg-slate-950
                p-5
                text-center
                text-white
              "
            >
              <p
                className="
                  text-xs
                  font-black
                  tracking-[0.16em]
                  text-cyan-300
                "
              >
                CURRENT CHALLENGE
              </p>

              <p
                className="
                  mt-2
                  text-xl
                  font-black
                "
              >
                {round.question}
              </p>


              <div
                className="
                  mt-4
                  flex
                  flex-wrap
                  justify-center
                  gap-2
                  text-xs
                  font-black
                "
              >
                <span
                  className="
                    rounded-full
                    bg-white/10
                    px-4
                    py-2
                    text-cyan-200
                  "
                >
                  ① 1月を見る
                </span>

                <span
                  className="
                    rounded-full
                    bg-white/10
                    px-4
                    py-2
                    text-cyan-200
                  "
                >
                  ② 7月を見る
                </span>

                <span
                  className="
                    rounded-full
                    bg-white/10
                    px-4
                    py-2
                    text-cyan-200
                  "
                >
                  ③ 比べて答える
                </span>
              </div>
            </div>


            <div
              className="
                mt-5
                grid
                grid-cols-1
                gap-5
                lg:grid-cols-2
              "
            >
              {
                SEASONS.map(
                  (
                    season
                  ) => (
                    <SeasonPortal
                      key={
                        season.id
                      }
                      season={
                        season
                      }
                      snapshot={
                        citySnapshots[
                          season.id
                        ]
                      }
                      targetCity={
                        round.targetCity
                      }
                      targetFlag={
                        round.flagCode
                      }
                      baseTime={
                        baseTime
                      }
                      opened={
                        Boolean(
                          opened[
                            season.id
                          ]
                        )
                      }
                      success={
                        solved &&
                        seasonAnswer ===
                          season.id
                      }
                      onClick={() =>
                        openSeason(
                          season.id
                        )
                      }
                    />
                  )
                )
              }
            </div>


            {
              round.mode ===
                'season-find' &&
              opened.winter &&
              opened.summer && (
                <div
                  className="
                    mt-5
                    rounded-[26px]
                    border-2
                    border-violet-200
                    bg-violet-50
                    p-5
                  "
                >
                  <p
                    className="
                      text-center
                      text-xs
                      font-black
                      tracking-[0.16em]
                      text-violet-500
                    "
                  >
                    STEP 2 · ANSWER
                  </p>

                  <p
                    className="
                      mt-2
                      text-center
                      text-xl
                      font-black
                      text-slate-950
                    "
                  >
                    どちらが答え？
                  </p>

                  <div
                    className="
                      mt-4
                      grid
                      grid-cols-2
                      gap-4
                    "
                  >
                    <button
                      type="button"
                      onClick={() =>
                        answerSeason(
                          'winter'
                        )
                      }
                      className={`
                        rounded-[22px]
                        border-2
                        p-5
                        text-xl
                        font-black
                        transition-all

                        ${
                          solved &&
                          seasonAnswer ===
                            'winter'
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100'
                            : seasonAnswer ===
                                'winter'
                              ? 'border-red-400 bg-red-50 text-red-700'
                              : 'border-indigo-200 bg-white text-slate-900 hover:-translate-y-1 hover:border-indigo-500 hover:shadow-lg'
                        }
                      `}
                    >
                      ❄️ 1月
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        answerSeason(
                          'summer'
                        )
                      }
                      className={`
                        rounded-[22px]
                        border-2
                        p-5
                        text-xl
                        font-black
                        transition-all

                        ${
                          solved &&
                          seasonAnswer ===
                            'summer'
                            ? 'border-emerald-400 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100'
                            : seasonAnswer ===
                                'summer'
                              ? 'border-red-400 bg-red-50 text-red-700'
                              : 'border-orange-200 bg-white text-slate-900 hover:-translate-y-1 hover:border-orange-500 hover:shadow-lg'
                        }
                      `}
                    >
                      ☀️ 7月
                    </button>
                  </div>
                </div>
              )
            }


            {
              round.mode ===
                'constant-check' &&
              opened.winter &&
              opened.summer && (
                <div
                  className="
                    mt-5
                    grid
                    grid-cols-2
                    gap-4
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      answerConstant(
                        'changes'
                      )
                    }
                    className={`
                      rounded-[24px]
                      border-2
                      p-5
                      text-xl
                      font-black
                      transition

                      ${
                        compareAnswer ===
                          'changes'
                          ? 'border-red-400 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-violet-400'
                      }
                    `}
                  >
                    🔄 時差は変わる
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      answerConstant(
                        'constant'
                      )
                    }
                    className={`
                      rounded-[24px]
                      border-2
                      p-5
                      text-xl
                      font-black
                      transition

                      ${
                        solved &&
                        compareAnswer ===
                          'constant'
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-violet-400'
                      }
                    `}
                  >
                    🔒 時差は変わらない
                  </button>
                </div>
              )
            }
          </>
        )
      }


      {
        round.mode ===
          'change-hunt' && (
          <>
            <div
              className="
                mt-5
                rounded-[28px]
                bg-gradient-to-r
                from-violet-700
                to-indigo-900
                p-6
                text-white
              "
            >
              <p
                className="
                  text-xs
                  font-black
                  tracking-[0.17em]
                  text-cyan-300
                "
              >
                FINAL SEASON HUNT
              </p>

              <h4
                className="
                  mt-2
                  text-2xl
                  font-black
                "
              >
                🌍 1月と7月で時差が変わる都市を全部選べ！
              </h4>

              <p
                className="
                  mt-2
                  font-bold
                  text-indigo-100
                "
              >
                Kigali
                {' '}
                {baseTime}
                {' '}
                を基準に、
                JANとJULの時差を見比べよう。
              </p>
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
                finalCities.map(
                  (
                    city
                  ) => {
                    const selected =
                      finalSelected.includes(
                        city.id
                      );

                    const wrong =
                      wrongCity ===
                      city.id;

                    return (
                      <button
                        key={
                          city.id
                        }
                        type="button"
                        onClick={() =>
                          chooseFinalCity(
                            city
                          )
                        }
                        disabled={
                          selected
                        }
                        style={
                          wrong
                            ? {
                                animation:
                                  'season-wrong .28s ease',
                              }
                            : undefined
                        }
                        className={`
                          rounded-[28px]
                          border-2
                          bg-white
                          p-5
                          text-left
                          shadow-sm
                          transition-all

                          ${
                            selected
                              ? 'border-emerald-400 bg-emerald-50 ring-4 ring-emerald-100'
                              : wrong
                                ? 'border-red-400 bg-red-50'
                                : 'border-slate-200 hover:-translate-y-1 hover:border-violet-400 hover:shadow-lg'
                          }
                        `}
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-3
                          "
                        >
                          <Flag
                            code={
                              city.flagCode
                            }
                          />

                          <div>
                            <p
                              className="
                                text-xl
                                font-black
                                text-slate-950
                              "
                            >
                              {city.name}
                            </p>

                            <p
                              className="
                                text-xs
                                font-bold
                                text-slate-400
                              "
                            >
                              {city.country}
                            </p>
                          </div>

                          {
                            selected && (
                              <CheckCircle2
                                size={26}
                                className="
                                  ml-auto
                                  text-emerald-600
                                "
                              />
                            )
                          }
                        </div>


                        <div
                          className="
                            mt-5
                            grid
                            grid-cols-2
                            gap-3
                          "
                        >
                          <div
                            className="
                              rounded-2xl
                              bg-indigo-50
                              p-4
                              text-center
                            "
                          >
                            <p
                              className="
                                text-xs
                                font-black
                                text-indigo-500
                              "
                            >
                              ❄️ JAN
                            </p>

                            <p
                              className="
                                mt-1
                                text-2xl
                                font-black
                                text-slate-950
                              "
                            >
                              {
                                city.winter
                                  .targetTime
                              }
                            </p>

                            <p
                              className="
                                mt-1
                                text-xs
                                font-black
                                text-slate-500
                              "
                            >
                              {
                                formatDifference(
                                  city.winter
                                    .difference
                                )
                              }
                            </p>
                          </div>


                          <div
                            className="
                              rounded-2xl
                              bg-orange-50
                              p-4
                              text-center
                            "
                          >
                            <p
                              className="
                                text-xs
                                font-black
                                text-orange-500
                              "
                            >
                              ☀️ JUL
                            </p>

                            <p
                              className="
                                mt-1
                                text-2xl
                                font-black
                                text-slate-950
                              "
                            >
                              {
                                city.summer
                                  .targetTime
                              }
                            </p>

                            <p
                              className="
                                mt-1
                                text-xs
                                font-black
                                text-slate-500
                              "
                            >
                              {
                                formatDifference(
                                  city.summer
                                    .difference
                                )
                              }
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  }
                )
              }
            </div>
          </>
        )
      }


      {
        feedback && (
          <div
            className={`
              mt-5
              rounded-[24px]
              border-2
              p-5
              text-center

              ${
                feedback.type ===
                  'correct'
                  ? 'border-emerald-300 bg-emerald-50'
                  : feedback.type ===
                      'wrong'
                    ? 'border-red-300 bg-red-50'
                    : 'border-violet-200 bg-violet-50'
              }
            `}
          >
            <p
              className={`
                text-xl
                font-black

                ${
                  feedback.type ===
                    'correct'
                    ? 'text-emerald-800'
                    : feedback.type ===
                        'wrong'
                      ? 'text-red-700'
                      : 'text-violet-800'
                }
              `}
            >
              {feedback.title}
            </p>

            <p
              className="
                mt-1
                font-bold
                text-slate-600
              "
            >
              {feedback.text}
            </p>
          </div>
        )
      }


      {
        solved &&
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
              flex
              w-full
              items-center
              justify-center
              gap-2
              rounded-2xl
              bg-slate-950
              py-4
              text-lg
              font-black
              text-white
              shadow-lg
              hover:bg-violet-700
            "
          >
            次のSEASON CASEへ

            <ArrowRight
              size={19}
            />
          </button>
        )
      }


      <div
        className="
          mt-6
          rounded-[22px]
          border
          border-amber-200
          bg-amber-50
          px-5
          py-4
        "
      >
        <div
          className="
            flex
            items-start
            gap-3
          "
        >
          <CalendarDays
            size={22}
            className="
              mt-0.5
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
              季節と時差のポイント
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
              季節そのものが時差を変えるわけではありません。
              ParisやNew Yorkなどでは、
              季節に合わせて時計を動かす
              「サマータイム」があるため、
              Kigaliとの時差が変わることがあります。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}