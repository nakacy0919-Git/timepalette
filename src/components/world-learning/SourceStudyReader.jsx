import {
  ExternalLink,
  Maximize2,
  X,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';


const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.5;
const STEP = 0.1;


export default function SourceStudyReader({
  source,
  className = '',
  allowFullscreen = false,
  defaultZoom = 1,
  onFullscreenChange,
}) {
  const [
    zoom,
    setZoom,
  ] = useState(
    defaultZoom
  );
  const [fullscreen, setFullscreen] = useState(false);
  const readerRef = useRef(null);
  const expandButtonRef = useRef(null);
  const closeButtonRef = useRef(null);


  // Expand the existing iframe instead of remounting it: its scroll position
  // and the learner's place in the article are preserved on return.
  useEffect(() => {
    onFullscreenChange?.(fullscreen);
  }, [fullscreen, onFullscreenChange]);

  useEffect(() => {
    if (!fullscreen) return undefined;
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setFullscreen(false);
      }
      if (event.key !== 'Tab' || !readerRef.current) return;
      const items = [...readerRef.current.querySelectorAll('button:not([disabled]), a[href]')];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, [fullscreen]);

  const percent =
    Math.round(
      zoom *
      100
    );


  const iframeStyle =
    useMemo(
      () => ({
        width:
          `${100 / zoom}%`,

        height:
          `${100 / zoom}%`,

        transform:
          `scale(${zoom})`,

        transformOrigin:
          'top left',
      }),
      [
        zoom,
      ]
    );


  if (
    !source
  ) {
    return (
      <div
        className={`
          flex
          min-h-[520px]
          items-center
          justify-center
          rounded-[30px]
          border
          border-dashed
          border-slate-300
          bg-white
          p-8
          text-center
          ${className}
        `}
      >
        <div>
          <p className="text-5xl">
            📚
          </p>

          <p
            className="
              mt-4
              text-xl
              font-black
              text-slate-700
            "
          >
            資料はありません
          </p>
        </div>
      </div>
    );
  }


  return (
    <section
      ref={readerRef}
      role={fullscreen ? 'dialog' : undefined}
      aria-modal={fullscreen ? 'true' : undefined}
      aria-label={fullscreen ? '世界日記を全画面で読む' : undefined}
      className={`
        flex
        min-h-0
        flex-col
        overflow-hidden
        rounded-[30px]
        border
        border-slate-200
        bg-white
        shadow-[0_18px_50px_rgba(15,23,42,0.10)]
        ${fullscreen ? 'tp-source-study-fullscreen' : ''}
        ${className}
      `}
    >
      <div
        className="
          flex
          flex-wrap
          items-center
          justify-between
          gap-3
          border-b
          border-slate-200
          bg-slate-950
          px-4
          py-3
          text-white
        "
      >
        <div
          className="
            min-w-0
            flex-1
          "
        >
          <p
            className="
              truncate
              text-sm
              font-black
              md:text-base
            "
          >
            {source.title}
          </p>

          <p
            className="
              mt-0.5
              truncate
              text-[10px]
              font-bold
              text-white/55
            "
          >
            {source.organization}
            {
              source.author
                ? ` · ${source.author}`
                : ''
            }
          </p>
        </div>


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
              items-center
              gap-1
              rounded-xl
              bg-white/10
              p-1
            "
          >
            <button
              type="button"
              disabled={
                zoom <=
                MIN_ZOOM
              }
              onClick={() =>
                setZoom(
                  (
                    current
                  ) =>
                    Math.max(
                      MIN_ZOOM,
                      Number(
                        (
                          current -
                          STEP
                        ).toFixed(
                          2
                        )
                      )
                    )
                )
              }
              className="
                rounded-lg
                p-2
                text-white
                transition
                hover:bg-white/10
                disabled:opacity-30
              "
              aria-label="縮小"
            >
              <Minus
                size={15}
              />
            </button>

            <span
              className="
                min-w-[46px]
                text-center
                text-[10px]
                font-black
              "
            >
              {percent}%
            </span>

            <button
              type="button"
              disabled={
                zoom >=
                MAX_ZOOM
              }
              onClick={() =>
                setZoom(
                  (
                    current
                  ) =>
                    Math.min(
                      MAX_ZOOM,
                      Number(
                        (
                          current +
                          STEP
                        ).toFixed(
                          2
                        )
                      )
                    )
                )
              }
              className="
                rounded-lg
                p-2
                text-white
                transition
                hover:bg-white/10
                disabled:opacity-30
              "
              aria-label="拡大"
            >
              <Plus
                size={15}
              />
            </button>

            <button
              type="button"
              onClick={() =>
                setZoom(
                  1
                )
              }
              className="
                rounded-lg
                p-2
                text-white
                transition
                hover:bg-white/10
              "
              aria-label="100%に戻す"
            >
              <RotateCcw
                size={14}
              />
            </button>
          </div>


          {allowFullscreen && !fullscreen ? (
            <button
              ref={expandButtonRef}
              type="button"
              onClick={() => setFullscreen(true)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-violet-500 px-3 py-2 text-xs font-black text-white transition hover:bg-violet-400"
              aria-label="世界日記を全画面で表示"
              aria-haspopup="dialog"
            >
              <Maximize2 size={16} />
              全画面
            </button>
          ) : (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-violet-500 px-3 py-2 text-xs font-black text-white transition hover:bg-violet-400"
            >
              {fullscreen ? '元記事' : '原文'}
              <ExternalLink size={14} />
            </a>
          )}
          {fullscreen && (
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => setFullscreen(false)}
              aria-label="全画面を閉じて4択に戻る"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/30 bg-white/15 px-3 py-2 text-xs font-black text-white hover:bg-white/25"
            >
              <X size={18} />
              閉じる
            </button>
          )}
        </div>
      </div>


      <div
        className="
          relative
          min-h-0
          flex-1
          overflow-hidden
          bg-white
        "
      >
        <iframe
          title={
            source.title
          }
          src={
            source.url
          }
          style={
            iframeStyle
          }
          className="
            absolute
            inset-0
            border-0
            bg-white
          "
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </section>
  );
}
