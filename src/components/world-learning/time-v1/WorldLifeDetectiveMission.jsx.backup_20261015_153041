import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';

import {
  useState,
} from 'react';


let audioContext = null;


function getAudio() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!audioContext) {
      audioContext =
        new AudioContextClass();
    }

    if (
      audioContext.state ===
      'suspended'
    ) {
      audioContext.resume();
    }

    return audioContext;
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
    getAudio();

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


function playPick() {
  tone({
    frequency: 680,
    duration: 0.05,
    volume: 0.04,
  });
}


function playWrong() {
  tone({
    frequency: 210,
    duration: 0.19,
    volume: 0.045,
    type: 'sawtooth',
  });
}


function playCorrect() {
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
        duration: 0.16,
        volume: 0.075,
        delay:
          index *
          0.10,
      });
    }
  );
}


function playFinal() {
  [
    523,
    659,
    784,
    1047,
    1319,
  ].forEach(
    (
      frequency,
      index
    ) => {
      tone({
        frequency,
        duration:
          index >= 3
            ? 0.38
            : 0.16,
        volume: 0.09,
        delay:
          index *
          0.11,
      });
    }
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


function formatJapanTime(
  kigaliTime
) {
  const parsed =
    parseTime(
      kigaliTime
    );

  const total =
    parsed.hour *
      60 +
    parsed.minute +
    420;

  const normalized =
    total %
    1440;

  const hour =
    Math.floor(
      normalized /
      60
    );

  const minute =
    normalized %
    60;

  return {
    label:
      `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,

    nextDay:
      total >=
      1440,
  };
}


const ACTIVITIES = [
  {
    id: 'breakfast',
    icon: '🥣',
    title: '朝ごはん',
    note: '朝の時間',
  },

  {
    id: 'school',
    icon: '🏫',
    title: '学校で勉強',
    note: '昼の時間',
  },

  {
    id: 'evening',
    icon: '🍛',
    title: '夕食・家で過ごす',
    note: '夜のはじめ',
  },

  {
    id: 'sleep',
    icon: '😴',
    title: 'ねている',
    note: '深夜',
  },
];


function Confetti() {
  return (
    <>
      <style>
        {`
          @keyframes life-confetti {
            0% {
              transform:
                translateY(-10vh)
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
          z-[22000]
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
                  -top-5
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
                    ][
                      index %
                      5
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
                    `life-confetti ${
                      1.7 +
                      (
                        index %
                        7
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


export default function WorldLifeDetectiveMission({
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
    dragging,
    setDragging,
  ] =
    useState(
      null
    );

  const [
    selectedCard,
    setSelectedCard,
  ] =
    useState(
      null
    );

  const [
    result,
    setResult,
  ] =
    useState(
      null
    );

  const [
    hint,
    setHint,
  ] =
    useState(
      0
    );

  const [
    completed,
    setCompleted,
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


  const japan =
    formatJapanTime(
      round.kigaliTime
    );


  const checkCard =
    (
      id
    ) => {
      setSelectedCard(
        id
      );

      const correct =
        id ===
        round.correctActivity;

      setResult(
        correct
      );

      if (
        !correct
      ) {
        playWrong();
        return;
      }

      if (
        roundIndex ===
        rounds.length -
          1
      ) {
        playFinal();

        setCompleted(
          true
        );

        onComplete?.(
          mission
        );
      }
      else {
        playCorrect();
      }
    };


  const nextRound =
    () => {
      setRoundIndex(
        (
          value
        ) =>
          value +
          1
      );

      setSelectedCard(
        null
      );

      setResult(
        null
      );

      setHint(
        0
      );
    };


  if (
    completed
  ) {
    return (
      <div
        className="
          relative
          overflow-hidden
          rounded-[34px]
          bg-gradient-to-br
          from-emerald-50
          via-white
          to-blue-50
          p-8
          text-center
        "
      >
        <Confetti />

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
          🕵️
        </div>

        <p
          className="
            mt-5
            text-xs
            font-black
            tracking-[0.2em]
            text-emerald-600
          "
        >
          ALL CASES SOLVED
        </p>

        <h3
          className="
            mt-2
            text-4xl
            font-black
            text-slate-950
          "
        >
          WORLD TIME DETECTIVE!
        </h3>

        <p
          className="
            mt-4
            font-black
            text-slate-600
          "
        >
          キガリと日本では、
          同じ瞬間でも生活している時間が違うんだね。
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
    );
  }


  return (
    <div>
      <div
        className="
          rounded-[28px]
          border
          border-emerald-200
          bg-gradient-to-r
          from-emerald-50
          to-sky-50
          p-6
        "
      >
        <div
          className="
            flex
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
                text-emerald-600
              "
            >
              WORLD LIFE DETECTIVE
            </p>

            <h3
              className="
                mt-2
                text-2xl
                font-black
                text-slate-950
              "
            >
              🕵️ 日本のAさんは何してる？
            </h3>

            <p
              className="
                mt-2
                font-bold
                leading-7
                text-slate-600
              "
            >
              キガリの時刻を見て、
              同じ瞬間の日本を考えよう。
              正しい生活カードを
              日本の枠へ届けてね。
            </p>
          </div>

          <div
            className="
              rounded-2xl
              bg-white
              px-4
              py-3
              text-center
              shadow
            "
          >
            <p
              className="
                text-[10px]
                font-black
                text-slate-400
              "
            >
              CASE
            </p>

            <p
              className="
                text-2xl
                font-black
                text-emerald-600
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
          rounded-[24px]
          border
          border-slate-200
          bg-slate-50
          p-4
        "
      >
        <p
          className="
            text-xs
            font-black
            tracking-[0.15em]
            text-slate-500
          "
        >
          📋 このゲームの
          「日本のAさん」の
          ある日の予定
        </p>

        <div
          className="
            mt-3
            grid
            grid-cols-2
            gap-2
            md:grid-cols-4
          "
        >
          <div
            className="
              rounded-xl
              bg-white
              p-3
              text-center
              text-xs
              font-black
              shadow-sm
            "
          >
            🥣 06–08
            <br />
            朝ごはん
          </div>

          <div
            className="
              rounded-xl
              bg-white
              p-3
              text-center
              text-xs
              font-black
              shadow-sm
            "
          >
            🏫 09–15
            <br />
            学校
          </div>

          <div
            className="
              rounded-xl
              bg-white
              p-3
              text-center
              text-xs
              font-black
              shadow-sm
            "
          >
            🍛 19–21
            <br />
            夕食・家
          </div>

          <div
            className="
              rounded-xl
              bg-white
              p-3
              text-center
              text-xs
              font-black
              shadow-sm
            "
          >
            😴 22–05
            <br />
            ねる
          </div>
        </div>
      </div>


      <div
        className="
          mt-6
          grid
          grid-cols-1
          gap-5
          md:grid-cols-[1fr_auto_1fr]
          md:items-stretch
        "
      >
        <div
          className="
            rounded-[28px]
            border-2
            border-orange-200
            bg-orange-50
            p-6
            text-center
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
            🇷🇼 RWANDA · KIGALI
          </p>

          <p
            className="
              mt-5
              text-5xl
            "
          >
            ⏰
          </p>

          <p
            className="
              mt-3
              text-4xl
              font-black
              text-slate-950
            "
          >
            {round.kigaliTime}
          </p>

          <p
            className="
              mt-2
              text-sm
              font-bold
              text-slate-500
            "
          >
            同じ瞬間、
            日本では…？
          </p>
        </div>


        <div
          className="
            hidden
            items-center
            justify-center
            text-4xl
            md:flex
          "
        >
          🌍
        </div>


        <div
          data-life-drop-zone="true"
          onClick={() => {
            if (
              selectedCard &&
              result !== true
            ) {
              checkCard(
                selectedCard
              );
            }
          }}
          className={`
            flex
            min-h-[260px]
            flex-col
            items-center
            justify-center
            rounded-[28px]
            border-2
            border-dashed
            p-6
            text-center
            transition

            ${
              result === true
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-blue-300 bg-blue-50'
            }
          `}
        >
          {
            result ===
              true
              ? (
                  <>
                    <p
                      className="
                        text-6xl
                      "
                    >
                      {
                        ACTIVITIES.find(
                          (
                            item
                          ) =>
                            item.id ===
                            selectedCard
                        )?.icon
                      }
                    </p>

                    <p
                      className="
                        mt-3
                        text-xl
                        font-black
                        text-emerald-800
                      "
                    >
                      正解！
                    </p>

                    <p
                      className="
                        mt-2
                        text-3xl
                        font-black
                        text-slate-950
                      "
                    >
                      🇯🇵 {
                        japan.label
                      }
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        font-black
                        text-indigo-600
                      "
                    >
                      {
                        japan.nextDay
                          ? '📅 次の日'
                          : '同じ日'
                      }
                    </p>
                  </>
                )
              : (
                  <>
                    <p
                      className="
                        text-5xl
                      "
                    >
                      🇯🇵
                    </p>

                    <p
                      className="
                        mt-3
                        text-lg
                        font-black
                        text-blue-700
                      "
                    >
                      ここへ生活カードを
                      ドロップ！
                    </p>

                    <p
                      className="
                        mt-2
                        text-xs
                        font-bold
                        text-blue-500
                      "
                    >
                      カードを選んでから
                      この枠をタップしてもOK
                    </p>
                  </>
                )
          }
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
          ACTIVITIES.map(
            (
              activity
            ) => (
              <div
                key={
                  activity.id
                }
                className={`
                  relative
                  touch-none
                  select-none
                  rounded-[22px]
                  border-2
                  bg-white
                  p-4
                  text-center
                  shadow-sm
                  transition

                  ${
                    selectedCard ===
                    activity.id
                      ? 'border-blue-500 ring-4 ring-blue-100'
                      : 'border-slate-200'
                  }
                `}
                onPointerDown={
                  (
                    event
                  ) => {
                    playPick();

                    setSelectedCard(
                      activity.id
                    );

                    setDragging({
                      id:
                        activity.id,

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
                      dragging?.id ===
                      activity.id
                    ) {
                      setDragging({
                        id:
                          activity.id,

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

                    const drop =
                      element
                        ?.closest?.(
                          '[data-life-drop-zone="true"]'
                        );

                    setDragging(
                      null
                    );

                    if (
                      drop
                    ) {
                      checkCard(
                        activity.id
                      );
                    }
                  }
                }
              >
                <p
                  className="
                    text-4xl
                  "
                >
                  {activity.icon}
                </p>

                <p
                  className="
                    mt-2
                    text-sm
                    font-black
                    text-slate-900
                  "
                >
                  {activity.title}
                </p>

                <p
                  className="
                    mt-1
                    text-[11px]
                    font-bold
                    text-slate-400
                  "
                >
                  {activity.note}
                </p>
              </div>
            )
          )
        }
      </div>


      {
        dragging && (
          <div
            className="
              pointer-events-none
              fixed
              z-[23000]
              -translate-x-1/2
              -translate-y-1/2
              rounded-2xl
              bg-white
              px-5
              py-4
              text-center
              shadow-2xl
              ring-4
              ring-blue-200
            "
            style={{
              left:
                dragging.x,

              top:
                dragging.y,
            }}
          >
            <p
              className="
                text-4xl
              "
            >
              {
                ACTIVITIES.find(
                  (
                    item
                  ) =>
                    item.id ===
                    dragging.id
                )?.icon
              }
            </p>

            <p
              className="
                mt-1
                text-sm
                font-black
              "
            >
              {
                ACTIVITIES.find(
                  (
                    item
                  ) =>
                    item.id ===
                    dragging.id
                )?.title
              }
            </p>
          </div>
        )
      }


      <button
        type="button"
        onClick={() =>
          setHint(
            (
              value
            ) =>
              value >= 2
                ? 0
                : value + 1
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
          font-black
          text-amber-700
        "
      >
        <Lightbulb
          size={18}
        />

        {
          hint === 0
            ? 'ヒントを見る'
            : hint === 1
              ? 'もう1つヒント'
              : 'ヒントをかくす'
        }
      </button>


      {
        hint ===
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
            💡 日本はキガリより
            時刻が先に進んでいます。
          </div>
        )
      }


      {
        hint ===
          2 && (
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
            💡 日本はキガリより
            7時間進んでいるよ。
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
              border-rose-200
              bg-rose-50
              p-5
            "
          >
            <p
              className="
                font-black
                text-rose-700
              "
            >
              🕵️ そのカードではないみたい！
            </p>

            <p
              className="
                mt-1
                text-sm
                font-bold
                text-rose-600
              "
            >
              日本の時刻をもう一度考えて、
              別のカードを試してみよう。
            </p>
          </div>
        )
      }


      {
        result ===
          true && (
          <div
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
              CASE {
                roundIndex +
                1
              } SOLVED! ⭐
            </p>

            <p
              className="
                mt-2
                font-black
                text-emerald-700
              "
            >
              キガリ
              {' '}
              {round.kigaliTime}
              {' → '}
              日本
              {' '}
              {japan.label}
              {
                japan.nextDay
                  ? '（次の日）'
                  : ''
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
                    px-6
                    py-3
                    font-black
                    text-white
                    shadow-lg
                  "
                >
                  次のCASEへ

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