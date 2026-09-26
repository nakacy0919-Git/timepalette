import {
  Compass,
  Menu,
  Route,
  Trophy,
  Wrench,
  X,
} from 'lucide-react';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import ToolsMenu
  from './ToolsMenu';

import {
  playUiSound,
} from '../../utils/uiSound';

const navItems = [
  {
    id: 'adventure',
    label: 'Adventure',
    icon: Compass,
  },
  {
    id: 'explore',
    label: 'Explore',
    icon: Route,
  },
  {
    id: 'journey',
    label: 'My Journey',
    icon: Trophy,
  },
];

export default function MainHeader({
  activeTab,
  onAdventure,
  onExplore,
  onJourney,
  onSelectTool,
}) {
  const [
    toolsOpen,
    setToolsOpen,
  ] = useState(false);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const toolsRef =
    useRef(null);

  useEffect(() => {
    const handleClickOutside =
      (event) => {
        if (
          toolsRef.current &&
          !toolsRef.current.contains(
            event.target
          )
        ) {
          setToolsOpen(
            false
          );
        }
      };

    const handleEscape =
      (event) => {
        if (
          event.key ===
          'Escape'
        ) {
          setToolsOpen(
            false
          );

          setMobileOpen(
            false
          );
        }
      };

    document.addEventListener(
      'mousedown',
      handleClickOutside
    );

    document.addEventListener(
      'keydown',
      handleEscape
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );

      document.removeEventListener(
        'keydown',
        handleEscape
      );
    };
  }, []);

  const handleNav =
    (id) => {
      playUiSound(
        'tap'
      );

      setMobileOpen(
        false
      );

      if (
        id === 'adventure'
      ) {
        onAdventure?.();
        return;
      }

      if (
        id === 'explore'
      ) {
        onExplore?.();
        return;
      }

      if (
        id === 'journey'
      ) {
        onJourney?.();
      }
    };

  return (
    <header
      className="
        sticky
        top-0
        z-[1000]
        w-full
        border-b
        border-slate-200/80
        bg-white/95
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto
          flex
          h-[68px]
          w-full
          max-w-[1500px]
          items-center
          justify-between
          px-5
          md:px-8
        "
      >
        {/* Brand */}
        <button
          type="button"
          onClick={() =>
            handleNav(
              'adventure'
            )
          }
          className="
            group
            flex
            shrink-0
            items-center
            gap-3
            text-left
          "
        >
          <div
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              bg-slate-950
              text-white
              transition
              group-hover:bg-blue-600
            "
          >
            <Compass
              size={19}
              strokeWidth={
                1.8
              }
            />
          </div>

          <div>
            <div className="text-[17px] font-bold tracking-tight text-slate-950">
              TimePalette
            </div>

            <div className="mt-[-1px] text-[9px] font-semibold tracking-[0.18em] text-slate-400">
              EXPLORE · LEARN · CONNECT
            </div>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden h-full items-center md:flex">

          {navItems.map(
            (item) => {
              const Icon =
                item.icon;

              const selected =
  (
    item.id ===
      'adventure' &&
    activeTab ===
      'home'
  ) ||
  (
    item.id ===
      'explore' &&
    activeTab ===
      'explore'
  );

              return (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  onClick={() =>
                    handleNav(
                      item.id
                    )
                  }
                  className={`
                    relative
                    flex
                    h-full
                    items-center
                    gap-2
                    px-5
                    text-[13px]
                    font-semibold
                    transition
                    ${
                      selected
                        ? 'text-slate-950'
                        : 'text-slate-500 hover:text-slate-950'
                    }
                  `}
                >
                  <Icon
                    size={16}
                    strokeWidth={
                      1.8
                    }
                  />

                  {
                    item.label
                  }

                  {selected && (
                    <span
                      className="
                        absolute
                        bottom-0
                        left-5
                        right-5
                        h-[2px]
                        bg-blue-600
                      "
                    />
                  )}
                </button>
              );
            }
          )}

          <div
            ref={
              toolsRef
            }
            className="relative h-full"
          >
            <button
              type="button"
              onClick={() => {
                playUiSound(
                  'tap'
                );

                setToolsOpen(
                  (current) =>
                    !current
                );
              }}
              className="
                flex
                h-full
                items-center
                gap-2
                px-5
                text-[13px]
                font-semibold
                text-slate-500
                transition
                hover:text-slate-950
              "
            >
              <Wrench
                size={16}
                strokeWidth={
                  1.8
                }
              />

              Tools
            </button>

            {toolsOpen && (
              <ToolsMenu
                onSelectTool={
                  onSelectTool
                }
                onClose={() =>
                  setToolsOpen(
                    false
                  )
                }
              />
            )}
          </div>

        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => {
            playUiSound(
              'tap'
            );

            setMobileOpen(
              (current) =>
                !current
            );
          }}
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            border
            border-slate-200
            text-slate-700
            md:hidden
          "
          aria-label="メニュー"
        >
          {mobileOpen ? (
            <X
              size={20}
            />
          ) : (
            <Menu
              size={20}
            />
          )}
        </button>

      </div>

      {/* Mobile */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-5 pb-5 pt-3 md:hidden">

          {navItems.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  onClick={() =>
                    handleNav(
                      item.id
                    )
                  }
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    border-b
                    border-slate-100
                    py-4
                    text-left
                    text-sm
                    font-semibold
                    text-slate-700
                  "
                >
                  <Icon
                    size={18}
                    strokeWidth={
                      1.7
                    }
                  />

                  {
                    item.label
                  }
                </button>
              );
            }
          )}

          <div className="pt-5">

            <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-slate-400">
              TOOLS
            </p>

            <div className="grid grid-cols-2 gap-2">

              {[
                [
                  'timer',
                  'Timer',
                ],
                [
                  'stopwatch',
                  'Stopwatch',
                ],
                [
                  'mapClock',
                  'World Clock',
                ],
                [
                  'timeDiff',
                  'Meeting Planner',
                ],
              ].map(
                ([
                  id,
                  label,
                ]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      playUiSound(
                        'tap'
                      );

                      setMobileOpen(
                        false
                      );

                      onSelectTool?.(
                        id
                      );
                    }}
                    className="
                      border
                      border-slate-200
                      px-3
                      py-3
                      text-left
                      text-xs
                      font-semibold
                      text-slate-700
                      transition
                      hover:bg-slate-50
                    "
                  >
                    {
                      label
                    }
                  </button>
                )
              )}

            </div>

          </div>

        </div>
      )}

    </header>
  );
}