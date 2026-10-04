import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  List,
  Sparkles,
  Trophy,
} from 'lucide-react';

import {
  createPortal,
} from 'react-dom';


const CONFETTI_COLORS = [
  '#38bdf8',
  '#818cf8',
  '#a855f7',
  '#ec4899',
  '#f43f5e',
  '#f59e0b',
  '#facc15',
  '#10b981',
  '#ffffff',
];


const CONFETTI =
  Array.from(
    {
      length: 86,
    },
    (
      _,
      index
    ) => ({
      id:
        index,

      left:
        `${
          (
            index *
            31
          ) %
          100
        }%`,

      delay:
        `${
          (
            index %
            13
          ) *
          0.035
        }s`,

      duration:
        `${
          1.8 +
          (
            index %
            7
          ) *
          0.15
        }s`,

      width:
        `${
          5 +
          (
            index %
            4
          ) *
          2
        }px`,

      height:
        `${
          9 +
          (
            index %
            5
          ) *
          2
        }px`,

      drift:
        `${
          (
            (
              index *
              47
            ) %
            260
          ) -
          130
        }px`,

      spin:
        `${
          360 +
          (
            index %
            6
          ) *
          180
        }deg`,

      color:
        CONFETTI_COLORS[
          index %
          CONFETTI_COLORS.length
        ],
    })
  );


export default function PlaceMissionSuccessModal({
  celebration,
  nextMission,
  onNext,
  onBackToList,
  onReview,
}) {
  if (
    !celebration
  ) {
    return null;
  }


  const {
    firstClear,
    points,
    title,
    headline,
    discovery,
    isFinal,
  } =
    celebration;


  const content = (
    <div
      className="
        fixed
        inset-0
        z-[100500]
        flex
        items-center
        justify-center
        overflow-hidden
        bg-slate-950/55
        p-4
        backdrop-blur-md
      "
      role="dialog"
      aria-modal="true"
    >
      <style>
        {`
          @keyframes tp-place-confetti {
            0% {
              transform:
                translate3d(
                  0,
                  -15vh,
                  0
                )
                rotate(0deg);

              opacity: 0;
            }

            8% {
              opacity: 1;
            }

            100% {
              transform:
                translate3d(
                  var(--drift),
                  115vh,
                  0
                )
                rotate(
                  var(--spin)
                );

              opacity: 0;
            }
          }


          @keyframes tp-place-pop {
            0% {
              transform:
                translateY(40px)
                scale(0.72);

              opacity: 0;
            }

            48% {
              transform:
                translateY(-7px)
                scale(1.055);

              opacity: 1;
            }

            72% {
              transform:
                translateY(2px)
                scale(0.985);
            }

            100% {
              transform:
                translateY(0)
                scale(1);

              opacity: 1;
            }
          }


          @keyframes tp-place-ring {
            0% {
              transform:
                scale(0.45);

              opacity: 0.8;
            }

            100% {
              transform:
                scale(2.1);

              opacity: 0;
            }
          }


          @keyframes tp-place-glow {
            0%,
            100% {
              transform:
                scale(1);

              opacity: 0.45;
            }

            50% {
              transform:
                scale(1.14);

              opacity: 0.85;
            }
          }


          @keyframes tp-place-points {
            0% {
              transform:
                translateY(22px)
                scale(0.7);

              opacity: 0;
            }

            65% {
              transform:
                translateY(-3px)
                scale(1.08);

              opacity: 1;
            }

            100% {
              transform:
                translateY(0)
                scale(1);

              opacity: 1;
            }
          }


          @keyframes tp-place-note {
            0% {
              transform:
                translateY(18px);

              opacity: 0;
            }

            100% {
              transform:
                translateY(0);

              opacity: 1;
            }
          }


          @media (
            prefers-reduced-motion:
            reduce
          ) {
            .tp-place-confetti {
              display: none;
            }

            .tp-place-card,
            .tp-place-ring,
            .tp-place-glow,
            .tp-place-points,
            .tp-place-note {
              animation:
                none !important;
            }
          }
        `}
      </style>


      {/* CONFETTI */}

      <div
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
        "
      >
        {
          CONFETTI.map(
            (
              piece
            ) => (
              <span
                key={
                  piece.id
                }
                className="
                  tp-place-confetti
                  absolute
                  top-[-12vh]
                  rounded-[2px]
                "
                style={{
                  left:
                    piece.left,

                  width:
                    piece.width,

                  height:
                    piece.height,

                  backgroundColor:
                    piece.color,

                  '--drift':
                    piece.drift,

                  '--spin':
                    piece.spin,

                  animation:
                    `tp-place-confetti ${piece.duration} ease-in ${piece.delay} forwards`,
                }}
              />
            )
          )
        }
      </div>


      {/* GLOW */}

      <div
        className="
          tp-place-glow
          pointer-events-none
          absolute
          h-[520px]
          w-[520px]
          rounded-full
          bg-gradient-to-br
          from-blue-400/30
          via-violet-400/30
          to-pink-400/30
          blur-[90px]
        "
        style={{
          animation:
            'tp-place-glow 2.4s ease-in-out infinite',
        }}
      />


      {/* CARD */}

      <div
        className="
          tp-place-card
          relative
          max-h-[94vh]
          w-full
          max-w-[620px]
          overflow-y-auto
          rounded-[38px]
          border
          border-white/70
          bg-white
          px-6
          py-7
          text-center
          shadow-[0_45px_130px_rgba(15,23,42,0.48)]
          md:px-10
          md:py-9
        "
        style={{
          animation:
            'tp-place-pop 650ms cubic-bezier(0.22,1.25,0.32,1) both',
        }}
      >
        <div
          className="
            pointer-events-none
            absolute
            inset-x-0
            top-0
            h-44
            bg-gradient-to-b
            from-blue-50
            via-violet-50/70
            to-transparent
          "
        />


        {/* ICON */}

        <div
          className="
            relative
            mx-auto
            flex
            h-28
            w-28
            items-center
            justify-center
          "
        >
          <div
            className="
              tp-place-ring
              absolute
              h-24
              w-24
              rounded-full
              bg-violet-400
            "
            style={{
              animation:
                'tp-place-ring 1.1s ease-out both',
            }}
          />


          <div
            className={`
              relative
              z-10
              flex
              h-24
              w-24
              items-center
              justify-center
              rounded-[30px]
              text-white
              shadow-[0_18px_45px_rgba(79,70,229,0.38)]

              ${
                isFinal
                  ? `
                    bg-gradient-to-br
                    from-amber-400
                    via-orange-500
                    to-pink-500
                  `
                  : `
                    bg-gradient-to-br
                    from-blue-500
                    via-violet-500
                    to-fuchsia-500
                  `
              }
            `}
          >
            {
              isFinal
                ? (
                  <Trophy
                    size={49}
                    strokeWidth={2.3}
                  />
                )
                : (
                  <CheckCircle2
                    size={50}
                    strokeWidth={2.5}
                  />
                )
            }
          </div>
        </div>


        {/* LABEL */}

        <div
          className="
            relative
            mt-3
            flex
            items-center
            justify-center
            gap-2
            text-violet-600
          "
        >
          <Sparkles
            size={17}
          />

          <p
            className="
              text-[10px]
              font-black
              tracking-[0.25em]
            "
          >
            {
              isFinal
                ? 'GEOGRAPHY MASTER'
                : firstClear
                  ? 'MISSION CLEAR!'
                  : 'REVIEW COMPLETE!'
            }
          </p>

          <Sparkles
            size={17}
          />
        </div>


        <h2
          className="
            relative
            mt-3
            text-3xl
            font-black
            tracking-[-0.05em]
            text-slate-950
            md:text-4xl
          "
        >
          {
            headline
          }
        </h2>


        <p
          className="
            relative
            mx-auto
            mt-2
            max-w-[450px]
            text-sm
            font-black
            text-slate-400
          "
        >
          {
            title
          }
        </p>


        {/* POINTS */}

        {
          firstClear
            ? (
              <div
                className="
                  tp-place-points
                  mt-5
                "
                style={{
                  animation:
                    'tp-place-points 760ms 180ms cubic-bezier(0.22,1.2,0.32,1) both',
                }}
              >
                <p
                  className="
                    text-[10px]
                    font-black
                    tracking-[0.2em]
                    text-amber-500
                  "
                >
                  WORLD POINTS GET!
                </p>

                <p
                  className="
                    mt-[-2px]
                    bg-gradient-to-r
                    from-amber-400
                    via-orange-500
                    to-pink-500
                    bg-clip-text
                    text-6xl
                    font-black
                    tracking-[-0.06em]
                    text-transparent
                  "
                >
                  +{
                    points
                  }
                </p>

                <p
                  className="
                    mt-[-7px]
                    text-lg
                    font-black
                    text-slate-400
                  "
                >
                  WP
                </p>
              </div>
            )
            : (
              <div
                className="
                  mt-5
                  rounded-2xl
                  bg-blue-50
                  px-5
                  py-4
                "
              >
                <p
                  className="
                    text-xs
                    font-black
                    tracking-[0.14em]
                    text-blue-500
                  "
                >
                  REVIEW MODE
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-bold
                    text-slate-600
                  "
                >
                  復習クリア！
                  WPは初回クリア時のみ加算されます。
                </p>
              </div>
            )
        }


        {/* DISCOVERY NOTE */}

        <div
          className="
            tp-place-note
            relative
            mt-6
            overflow-hidden
            rounded-[26px]
            border
            border-cyan-100
            bg-gradient-to-br
            from-blue-50
            via-cyan-50
            to-emerald-50
            p-5
            text-left
            md:p-6
          "
          style={{
            animation:
              'tp-place-note 600ms 380ms ease-out both',
          }}
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-white
                text-blue-600
                shadow-sm
              "
            >
              <BookOpen
                size={20}
              />
            </div>

            <div>
              <p
                className="
                  text-[9px]
                  font-black
                  tracking-[0.2em]
                  text-blue-500
                "
              >
                DISCOVERY NOTE
              </p>

              <p
                className="
                  text-sm
                  font-black
                  text-slate-800
                "
              >
                今日の発見
              </p>
            </div>
          </div>


          <p
            className="
              mt-4
              text-sm
              font-bold
              leading-7
              text-slate-700
              md:text-base
            "
          >
            {
              discovery
            }
          </p>
        </div>


        {/* NEXT */}

        {
          nextMission && (
            <div
              className="
                mt-5
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                px-4
                py-3
                text-left
              "
            >
              <p
                className="
                  text-[9px]
                  font-black
                  tracking-[0.16em]
                  text-slate-400
                "
              >
                NEXT MISSION
              </p>

              <p
                className="
                  mt-1
                  truncate
                  text-sm
                  font-black
                  text-slate-800
                "
              >
                {
                  nextMission
                }
              </p>
            </div>
          )
        }


        {/* BUTTONS */}

        <div
          className="
            mt-6
            grid
            grid-cols-1
            gap-3
            sm:grid-cols-[1fr_1.5fr]
          "
        >
          <button
            type="button"
            onClick={
              onBackToList
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-5
              py-4
              text-sm
              font-black
              text-slate-600
              transition
              hover:bg-slate-50
            "
          >
            <List
              size={19}
            />

            Mission一覧
          </button>


          <button
            type="button"
            onClick={
              onNext
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-2xl
              bg-gradient-to-r
              from-blue-600
              via-violet-600
              to-fuchsia-600
              px-5
              py-4
              text-base
              font-black
              text-white
              shadow-[0_16px_35px_rgba(79,70,229,0.34)]
              transition
              hover:-translate-y-1
              hover:shadow-[0_22px_45px_rgba(79,70,229,0.42)]
            "
          >
            {
              isFinal
                ? '10 Missionを振り返る'
                : '次のMissionへ'
            }

            <ArrowRight
              size={21}
            />
          </button>
        </div>


        <button
          type="button"
          onClick={
            onReview
          }
          className="
            mt-4
            text-xs
            font-bold
            text-slate-400
            transition
            hover:text-slate-600
            hover:underline
          "
        >
          このMissionをもう一度見る
        </button>
      </div>
    </div>
  );


  return createPortal(
    content,
    document.body
  );
}