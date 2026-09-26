import {
  ArrowRight,
  X,
} from 'lucide-react';

import {
  useEffect,
} from 'react';

import {
  playUiSound,
} from '../../utils/uiSound';

export default function ModeGuideModal({
  mode,
  onClose,
  onExplore,
}) {
  useEffect(() => {
    if (!mode) {
      return undefined;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    const handleKeyDown =
      (event) => {
        if (
          event.key ===
          'Escape'
        ) {
          playUiSound(
            'back'
          );

          onClose?.();
        }
      };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [
    mode,
    onClose,
  ]);

  if (!mode) {
    return null;
  }

  const closeModal =
    () => {
      playUiSound(
        'back'
      );

      onClose?.();
    };

  const startMode =
    () => {
      playUiSound(
        'open'
      );

      onClose?.();
      onExplore?.();
    };

  return (
    <div
      className="
        fixed
        inset-0
        z-[3000]
        flex
        items-center
        justify-center
        bg-slate-950/80
        p-3
        backdrop-blur-sm
        md:p-8
      "
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          closeModal();
        }
      }}
    >
      <div
        className="
          relative
          max-h-[94dvh]
          w-full
          max-w-6xl
          overflow-y-auto
          bg-white
          shadow-[0_30px_100px_rgba(0,0,0,0.35)]
        "
      >
        <button
          type="button"
          onClick={
            closeModal
          }
          className="
            absolute
            right-4
            top-4
            z-20
            flex
            h-11
            w-11
            items-center
            justify-center
            bg-slate-950/85
            text-white
            backdrop-blur
            transition
            hover:bg-slate-950
          "
          aria-label="閉じる"
        >
          <X
            size={20}
          />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr]">

          {/* GUIDE IMAGE */}
          <div className="bg-slate-100">

            <img
              src={
                mode.guideImage
              }
              alt={`${mode.title}の遊び方`}
              className="
                h-full
                min-h-[360px]
                w-full
                object-cover
                object-center
                lg:min-h-[680px]
              "
            />

          </div>

          {/* INFORMATION */}
          <div className="flex flex-col justify-between p-7 md:p-10">

            <div>

              <p className="text-[10px] font-bold tracking-[0.22em] text-slate-400">
                HOW TO PLAY
              </p>

              <div className="mt-7 flex items-center justify-between">

                <span className="text-xs font-semibold tracking-[0.18em] text-slate-300">
                  {
                    mode.number
                  }
                </span>

                <mode.icon
                  size={26}
                  strokeWidth={
                    1.6
                  }
                  className="text-slate-500"
                />

              </div>

              <h2 className="mt-7 text-3xl font-semibold tracking-tight text-slate-950">
                {
                  mode.title
                }
              </h2>

              <p className="mt-3 text-xl font-medium text-slate-700">
                {
                  mode.subtitle
                }
              </p>

              <div className="mt-7 h-px bg-slate-200" />

              <p className="mt-7 text-sm leading-7 text-slate-600">
                {
                  mode.description
                }
              </p>

              <div className="mt-8 border-l-2 border-blue-500 pl-5">

                <p className="text-[10px] font-bold tracking-[0.18em] text-slate-400">
                  YOUR MISSION
                </p>

                <p className="mt-2 text-sm font-medium leading-7 text-slate-700">
                  見るだけではなく、
                  実際に選ぶ・動かす・話す・考える活動を通して、
                  世界についての理解を深めます。
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={
                startMode
              }
              className="
                group
                mt-10
                flex
                w-full
                items-center
                justify-between
                bg-slate-950
                px-5
                py-4
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-blue-700
              "
            >
              Australiaで体験する

              <ArrowRight
                size={18}
                className="
                  transition-transform
                  group-hover:translate-x-1
                "
              />
            </button>

          </div>

        </div>
      </div>
    </div>
  );
}