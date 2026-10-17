import {
  ExternalLink,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';


const MIN_ZOOM = 0.75;
const MAX_ZOOM = 1.5;
const STEP = 0.1;


export default function SourceStudyReader({
  source,
  className = '',
}) {
  const [
    zoom,
    setZoom,
  ] = useState(
    1
  );


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


          <a
            href={
              source.url
            }
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-xl
              bg-violet-500
              px-3
              py-2
              text-[10px]
              font-black
              text-white
              transition
              hover:bg-violet-400
            "
          >
            原文
            <ExternalLink
              size={13}
            />
          </a>
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
