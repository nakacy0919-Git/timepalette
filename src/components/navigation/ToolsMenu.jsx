import {
  CalendarClock,
  Clock3,
  ExternalLink,
  Hourglass,
  Languages,
  Map,
  MapPin,
  Timer,
} from 'lucide-react';

import {
  playUiSound,
} from '../../utils/uiSound';

const tools = [
  {
    id: 'timer',
    label: 'Timer',
    description:
      '授業・活動時間をシンプルに管理',
    icon: Timer,
  },
  {
    id: 'stopwatch',
    label: 'Stopwatch',
    description:
      'スピーチや活動時間を計測',
    icon: Hourglass,
  },
  {
    id: 'mapClock',
    label: 'World Clock',
    description:
      '世界の場所と現在時刻を確認',
    icon: Map,
  },
  {
    id: 'timeDiff',
    label: 'Meeting Planner',
    description:
      '国際交流の時間を調整',
    icon: CalendarClock,
  },
  {
    id: 'myClock',
    label: 'My Clock',
    description:
      'よく使う時刻をまとめて管理',
    icon: Clock3,
  },
  {
    id: 'language',
    label: 'Language Lab',
    description:
      'ことばの練習機能を開く',
    icon: Languages,
  },
];

export default function ToolsMenu({
  onSelectTool,
  onClose,
}) {
  const selectTool =
    (toolId) => {
      playUiSound('tap');

      onSelectTool?.(
        toolId
      );

      onClose?.();
    };

  return (
    <div
      className="
        absolute
        right-0
        top-[calc(100%+12px)]
        z-50
        w-[380px]
        overflow-hidden
        border
        border-slate-200
        bg-white
        shadow-[0_24px_70px_rgba(15,23,42,0.16)]
      "
    >
      <div className="border-b border-slate-100 px-5 py-4">

        <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400">
          TIMEPALETTE TOOLS
        </p>

        <p className="mt-1 text-sm text-slate-500">
          学びと国際交流を支えるツール
        </p>

      </div>

      <div className="grid grid-cols-2">

        {tools.map(
          (tool) => {
            const Icon =
              tool.icon;

            return (
              <button
                key={
                  tool.id
                }
                type="button"
                onClick={() =>
                  selectTool(
                    tool.id
                  )
                }
                className="
                  group
                  min-h-[126px]
                  border-b
                  border-r
                  border-slate-100
                  p-5
                  text-left
                  transition
                  hover:bg-slate-50
                "
              >
                <Icon
                  size={20}
                  strokeWidth={
                    1.7
                  }
                  className="text-slate-500 transition group-hover:text-slate-900"
                />

                <p className="mt-4 text-sm font-semibold text-slate-900">
                  {
                    tool.label
                  }
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {
                    tool.description
                  }
                </p>
              </button>
            );
          }
        )}

      </div>

      <a
        href="https://pacemark.pic-speak-story.com/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={() =>
          playUiSound(
            'open'
          )
        }
        className="
          flex
          items-center
          justify-between
          gap-4
          border-t
          border-slate-100
          px-5
          py-4
          transition
          hover:bg-slate-50
        "
      >
        <div className="flex items-center gap-3">

          <MapPin
            size={19}
            strokeWidth={
              1.7
            }
            className="text-slate-500"
          />

          <div>
            <p className="text-sm font-semibold text-slate-900">
              PaceMark
            </p>

            <p className="text-xs text-slate-500">
              外部アプリで開く
            </p>
          </div>

        </div>

        <ExternalLink
          size={16}
          className="text-slate-400"
        />
      </a>
    </div>
  );
}