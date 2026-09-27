import {
  ArrowRight,
  CheckCircle2,
  List,
  Sparkles,
} from 'lucide-react';


const CONFETTI_COLORS = [
  '#38bdf8',
  '#a78bfa',
  '#f472b6',
  '#fbbf24',
  '#34d399',
  '#fb7185',
  '#ffffff',
];


const CONFETTI_PIECES =
  Array.from(
    {
      length: 52,
    },
    (
      _,
      index
    ) => ({
      id: index,
      left:
        `${(index * 37) % 100}%`,
      delay:
        `${(index % 9) * 0.045}s`,
      duration:
        `${
          1.7 +
          (index % 6) *
            0.16
        }s`,
      width:
        `${
          6 +
          (index % 4) * 2
        }px`,
      height:
        `${
          10 +
          (index % 3) * 4
        }px`,
      color:
        CONFETTI_COLORS[
          index %
          CONFETTI_COLORS.length
        ],
      drift:
        `${
          (
            (index * 29) %
            180
          ) -
          90
        }px`,
      spin:
        `${
          360 +
          (index % 5) *
            180
        }deg`,
    })
  );


export default function MissionSuccessCelebration({
  celebration,
  nextMission = null,
  onNext,
  onBackToList,
  onDismiss,
}) {
  if (!celebration) {
    return null;
  }

  const {
    firstClear,
    points,
    title,
  } = celebration;


  return (
    <div
      className="
        fixed
        inset-0
        z-[100020]
        flex
        items-center
        justify-center
        overflow-hidden
        bg-slate-950/45
        p-4
        backdrop-blur-sm
      "
      role="dialog"
      aria-modal="true"
      aria-label="Mission clear"
    >
      <style>
        {`
          @keyframes tp-confetti-fall {
            0% {
              transform:
                translate3d(0, -14vh, 0)
                rotate(0deg);
              opacity: 0;
            }

            8% {
              opacity: 1;
            }

            100% {
              transform:
                translate3d(
                  var(--tp-drift),
                  115vh,
                  0
                )
                rotate(
                  var(--tp-spin)
                );
              opacity: 0;
            }
          }

          @keyframes tp-success-pop {
            0% {
              transform:
                scale(0.72)
                translateY(22px);
              opacity: 0;
            }

            55% {
              transform:
                scale(1.035)
                translateY(-3px);
              opacity: 1;
            }

            100% {
              transform:
                scale(1)
                translateY(0);
              opacity: 1;
            }
          }

          @keyframes tp-success-ring {
            0% {
              transform: scale(0.7);
              opacity: 0;
            }

            55% {
              opacity: 0.55;
            }

            100% {
              transform: scale(1.75);
              opacity: 0;
            }
          }

          @keyframes tp-points-rise {
            0% {
              transform:
                translateY(18px)
                scale(0.85);
              opacity: 0;
            }

            65% {
              transform:
                translateY(-3px)
                scale(1.06);
              opacity: 1;
            }

            100% {
              transform:
                translateY(0)
                scale(1);
              opacity: 1;
            }
          }

          @media (
            prefers-reduced-motion:
            reduce
          ) {
            .tp-success-card,
            .tp-success-points,
            .tp-success-ring,
            .tp-confetti {
              animation:
                none !important;
            }

            .tp-confetti {
              display: none;
            }
          }
        `}
      </style>


      <div
        className="
          pointer-events-none
          absolute
          inset-0
          overflow-hidden
        "
        aria-hidden="true"
      >
        {CONFETTI_PIECES.map(
          (piece) => (
            <span
              key={piece.id}
              className="
                tp-confetti
                absolute
                top-[-10vh]
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
                '--tp-drift':
                  piece.drift,
                '--tp-spin':
                  piece.spin,
                animation:
                  `tp-confetti-fall ${piece.duration} ease-in ${piece.delay} forwards`,
              }}
            />
          )
        )}
      </div>


      <div
        className="
          tp-success-card
          relative
          w-full
          max-w-[520px]
          overflow-hidden
          rounded-[34px]
          border
          border-white/60
          bg-white
          px-6
          py-7
          text-center
          shadow-[0_35px_100px_rgba(15,23,42,0.38)]
          md:px-10
          md:py-9
        "
        style={{
          animation:
            'tp-success-pop 620ms cubic-bezier(0.22, 1.2, 0.32, 1) both',
        }}
      >
        <div className="
          pointer-events-none
          absolute
          inset-x-0
          top-0
          h-32
          bg-gradient-to-b
          from-emerald-50
          to-transparent
        " />


        <div className="
          relative
          mx-auto
          flex
          h-24
          w-24
          items-center
          justify-center
        ">
          <div
            className="
              tp-success-ring
              absolute
              h-20
              w-20
              rounded-full
              bg-emerald-300
            "
            style={{
              animation:
                'tp-success-ring 1100ms ease-out both',
            }}
          />

          <div className="
            relative
            z-10
            flex
            h-20
            w-20
            items-center
            justify-center
            rounded-full
            bg-gradient-to-br
            from-emerald-400
            to-emerald-600
            text-white
            shadow-[0_12px_30px_rgba(16,185,129,0.35)]
          ">
            <CheckCircle2
              size={43}
              strokeWidth={2.6}
            />
          </div>
        </div>


        <div className="
          mt-4
          flex
          items-center
          justify-center
          gap-2
          text-emerald-600
        ">
          <Sparkles size={16} />

          <p className="
            text-[10px]
            font-black
            tracking-[0.22em]
          ">
            MISSION CLEAR
          </p>

          <Sparkles size={16} />
        </div>


        <h2 className="
          mt-3
          text-3xl
          font-black
          tracking-[-0.04em]
          text-slate-950
          md:text-4xl
        ">
          Great Job!
        </h2>

        <p className="
          mx-auto
          mt-2
          max-w-[380px]
          text-sm
          font-bold
          leading-6
          text-slate-500
        ">
          {title}
        </p>


        {firstClear ? (
          <div
            className="
              tp-success-points
              mt-5
            "
            style={{
              animation:
                'tp-points-rise 720ms 180ms cubic-bezier(0.22, 1.2, 0.32, 1) both',
            }}
          >
            <p className="
              text-[10px]
              font-black
              tracking-[0.18em]
              text-amber-500
            ">
              WORLD POINTS GET!
            </p>

            <div className="
              mt-1
              bg-gradient-to-r
              from-amber-400
              via-orange-500
              to-rose-500
              bg-clip-text
              text-6xl
              font-black
              tracking-[-0.05em]
              text-transparent
            ">
              +{points}
            </div>

            <p className="
              mt-[-4px]
              text-lg
              font-black
              text-slate-400
            ">
              WP
            </p>
          </div>
        ) : (
          <div className="
            mt-5
            rounded-2xl
            bg-blue-50
            px-5
            py-4
          ">
            <p className="
              text-xs
              font-black
              tracking-[0.12em]
              text-blue-500
            ">
              REVIEW COMPLETE
            </p>

            <p className="
              mt-1
              text-sm
              font-bold
              text-slate-600
            ">
              復習完了！
              WPは初回クリア時のみ
              加算されます。
            </p>
          </div>
        )}


        {nextMission && (
          <div className="
            mt-5
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-3
            text-left
          ">
            <p className="
              text-[9px]
              font-black
              tracking-[0.15em]
              text-slate-400
            ">
              NEXT MISSION
            </p>

            <p className="
              mt-1
              truncate
              text-sm
              font-black
              text-slate-800
            ">
              {nextMission.title}
            </p>
          </div>
        )}


        <div className="
          mt-6
          grid
          grid-cols-1
          gap-3
          sm:grid-cols-[1fr_1.45fr]
        ">
          <button
            type="button"
            onClick={
              onBackToList ??
              onDismiss
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
            <List size={19} />
            Mission一覧
          </button>

          <button
            type="button"
            onClick={
              nextMission
                ? onNext
                : (
                  onBackToList ??
                  onDismiss
                )
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-2xl
              bg-gradient-to-r
              from-blue-600
              to-violet-600
              px-5
              py-4
              text-base
              font-black
              text-white
              shadow-[0_14px_30px_rgba(37,99,235,0.30)]
              transition
              hover:-translate-y-0.5
              hover:shadow-[0_18px_36px_rgba(37,99,235,0.36)]
            "
          >
            {nextMission
              ? '次のMissionへ'
              : 'Adventureへ戻る'}

            <ArrowRight
              size={21}
            />
          </button>
        </div>


        <button
          type="button"
          onClick={onDismiss}
          className="
            mt-4
            text-xs
            font-bold
            text-slate-300
            underline-offset-4
            transition
            hover:text-slate-500
            hover:underline
          "
        >
          この画面を閉じる
        </button>
      </div>
    </div>
  );
}
