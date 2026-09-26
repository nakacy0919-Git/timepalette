import {
  ArrowRight,
  Compass,
  Globe2,
  Volume2,
  VolumeX,
} from 'lucide-react';

import {
  useState,
} from 'react';

import timePaletteLogo
  from '../../assets/branding/timepalette_global_adventure_logo.png';

import openingBackground
  from '../../assets/opening/timepalette_opening_background.png';

import {
  getCountryProgress,
} from '../../utils/worldProgressStorage';

import {
  getLiveWorldLearningCountries,
} from '../../utils/worldLearningRegistry';

import {
  getUiSoundEnabled,
  playUiSound,
  setUiSoundEnabled,
} from '../../utils/uiSound';


export default function WorldAdventureHome({
  onExploreWorld,
}) {
  const [
    soundEnabled,
    setSoundEnabledState,
  ] = useState(
    () =>
      getUiSoundEnabled()
  );


  const liveCountries =
    getLiveWorldLearningCountries();


  const journeyTotals =
    liveCountries.reduce(
      (
        totals,
        country
      ) => {
        const countryProgress =
          getCountryProgress(
            country.iso
          );

        const completed =
          countryProgress
            ?.completedMissionIds
            ?.length ??
          0;

        return {
          completed:
            totals.completed +
            completed,

          total:
            totals.total +
            Number(
              country.totalMissions ??
                0
            ),
        };
      },
      {
        completed: 0,
        total: 0,
      }
    );


  const completedCount =
    journeyTotals.completed;


  const totalMissionCount =
    journeyTotals.total;


  const journeyPercent =
    totalMissionCount > 0
      ? Math.round(
          (
            completedCount /
            totalMissionCount
          ) *
            100
        )
      : 0;


  const toggleSound =
    () => {
      const next =
        !soundEnabled;

      setUiSoundEnabled(
        next
      );

      setSoundEnabledState(
        next
      );

      if (next) {
        window.setTimeout(
          () => {
            playUiSound(
              'tap'
            );
          },
          20
        );
      }
    };


  const startAdventure =
    () => {
      playUiSound(
        'open'
      );

      onExploreWorld?.();
    };


  return (
    <div
      className="
        relative
        h-[calc(100dvh-68px)]
        min-h-[620px]
        overflow-hidden
        bg-slate-950
        text-white
      "
    >

      {/* BACKGROUND */}

      <img
        src={
          openingBackground
        }
        alt=""
        aria-hidden="true"
        className="
          absolute
          inset-0
          h-full
          w-full
          object-cover
          object-center
        "
      />


      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-slate-950/95
          via-slate-950/72
          to-slate-950/35
        "
      />


      <div
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-slate-950/95
          via-transparent
          to-slate-950/30
        "
      />


      <div
        className="
          pointer-events-none
          absolute
          -left-32
          top-[25%]
          h-[420px]
          w-[420px]
          rounded-full
          bg-blue-500/15
          blur-[110px]
        "
      />


      <div
        className="
          pointer-events-none
          absolute
          right-[4%]
          top-[18%]
          h-[420px]
          w-[420px]
          rounded-full
          bg-violet-500/10
          blur-[120px]
        "
      />


      {/* CONTENT */}

      <div
        className="
          relative
          z-10
          mx-auto
          flex
          h-full
          w-full
          max-w-[1500px]
          flex-col
          px-5
          pb-6
          pt-5
          md:px-8
          lg:px-10
        "
      >

        {/* TOP */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
          "
        >

          <img
            src={
              timePaletteLogo
            }
            alt="TimePalette"
            className="
              w-[180px]
              drop-shadow-xl
              sm:w-[220px]
              md:w-[250px]
            "
          />


          <button
            type="button"
            onClick={
              toggleSound
            }
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              border
              border-white/15
              bg-black/25
              text-white/75
              backdrop-blur-xl
              transition
              hover:bg-white/10
              hover:text-white
            "
            aria-label={
              soundEnabled
                ? 'ボタン音をオフ'
                : 'ボタン音をオン'
            }
          >

            {soundEnabled ? (
              <Volume2
                size={18}
              />
            ) : (
              <VolumeX
                size={18}
              />
            )}

          </button>

        </div>


        {/* MAIN */}

        <div
          className="
            grid
            min-h-0
            flex-1
            grid-cols-1
            items-center
            gap-10
            lg:grid-cols-[1.12fr_0.88fr]
            lg:gap-16
          "
        >

          {/* LEFT */}

          <div
            className="
              max-w-3xl
            "
          >

            <div
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                border
                border-sky-300/20
                bg-sky-300/10
                px-4
                py-2
                backdrop-blur-xl
              "
            >

              <Globe2
                size={15}
                className="text-sky-300"
              />

              <span
                className="
                  text-[10px]
                  font-black
                  tracking-[0.20em]
                  text-sky-200
                "
              >
                EXPLORE · LEARN · CONNECT
              </span>

            </div>


            <h1
              className="
                mt-6
                max-w-3xl
                text-[38px]
                font-black
                leading-[1.08]
                tracking-[-0.045em]
                text-white
                sm:text-[46px]
                md:text-[56px]
                lg:text-[64px]
                xl:text-[70px]
              "
            >
              世界を、
              <br />

              <span
                className="
                  bg-gradient-to-r
                  from-white
                  via-sky-100
                  to-cyan-300
                  bg-clip-text
                  text-transparent
                "
              >
                冒険しながら学ぶ。
              </span>
            </h1>


            <p
              className="
                mt-5
                max-w-2xl
                text-sm
                font-semibold
                leading-7
                text-white/62
                md:text-base
                md:leading-8
              "
            >
              世界の国を訪れ、
              地図・時間・ことば・文化から
              新しい発見をしよう。
            </p>


            {/* MAIN CTA */}

            <div
              className="
                relative
                mt-9
                inline-block
              "
            >

              <div
                className="
                  pointer-events-none
                  absolute
                  -inset-2
                  rounded-[26px]
                  bg-gradient-to-r
                  from-blue-500/35
                  via-cyan-400/35
                  to-violet-500/30
                  blur-xl
                "
              />


              <button
                type="button"
                onClick={
                  startAdventure
                }
                className="
                  group
                  relative
                  inline-flex
                  items-center
                  gap-5
                  overflow-hidden
                  rounded-[22px]
                  bg-white
                  px-7
                  py-5
                  text-slate-950
                  shadow-[0_20px_60px_rgba(14,165,233,0.28)]
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:scale-[1.015]
                  hover:shadow-[0_28px_75px_rgba(14,165,233,0.42)]
                "
              >

                <div
                  className="
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                    bg-slate-950
                    text-white
                    transition
                    duration-300
                    group-hover:bg-blue-600
                  "
                >

                  <Compass
                    size={23}
                  />

                </div>


                <span
                  className="
                    text-xl
                    font-black
                    tracking-tight
                    sm:text-2xl
                  "
                >
                  冒険を始める
                </span>


                <div
                  className="
                    ml-1
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    bg-blue-50
                    text-blue-600
                    transition
                    duration-300
                    group-hover:translate-x-1
                    group-hover:bg-blue-600
                    group-hover:text-white
                  "
                >

                  <ArrowRight
                    size={20}
                  />

                </div>

              </button>

            </div>

          </div>


          {/* RIGHT / JOURNEY */}

          <div
            id="journey"
            className="
              hidden
              lg:block
              lg:justify-self-end
            "
          >

            <div
              className="
                w-[350px]
                rounded-[28px]
                border
                border-white/15
                bg-slate-950/50
                p-6
                shadow-[0_30px_80px_rgba(0,0,0,0.28)]
                backdrop-blur-2xl
              "
            >

              <div
                className="
                  flex
                  items-start
                  justify-between
                "
              >

                <div>

                  <p
                    className="
                      text-[9px]
                      font-black
                      tracking-[0.18em]
                      text-sky-300
                    "
                  >
                    YOUR JOURNEY
                  </p>


                  <h2
                    className="
                      mt-2
                      text-xl
                      font-black
                    "
                  >
                    World Explorer
                  </h2>

                </div>


                <div
                  className="
                    flex
                    h-14
                    w-14
                    items-center
                    justify-center
                    rounded-2xl
                    bg-white/10
                    text-3xl
                  "
                >
                  🌍
                </div>

              </div>


              <div
                className="
                  mt-6
                  grid
                  grid-cols-2
                  gap-3
                "
              >

                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/5
                    p-4
                  "
                >

                  <p
                    className="
                      text-2xl
                      font-black
                    "
                  >
                    {
                      liveCountries.length
                    }
                  </p>


                  <p
                    className="
                      mt-1
                      text-[9px]
                      font-black
                      tracking-[0.12em]
                      text-white/35
                    "
                  >
                    COUNTRIES
                  </p>

                </div>


                <div
                  className="
                    rounded-2xl
                    border
                    border-white/10
                    bg-white/5
                    p-4
                  "
                >

                  <p
                    className="
                      text-2xl
                      font-black
                      text-cyan-300
                    "
                  >
                    {
                      completedCount
                    }
                  </p>


                  <p
                    className="
                      mt-1
                      text-[9px]
                      font-black
                      tracking-[0.12em]
                      text-white/35
                    "
                  >
                    MISSIONS
                  </p>

                </div>

              </div>


              <div
                className="
                  mt-6
                "
              >

                <div
                  className="
                    flex
                    items-end
                    justify-between
                  "
                >

                  <p
                    className="
                      text-xs
                      font-black
                      text-white/50
                    "
                  >
                    {
                      completedCount
                    }
                    {' / '}
                    {
                      totalMissionCount
                    }
                  </p>


                  <p
                    className="
                      text-xl
                      font-black
                    "
                  >
                    {
                      journeyPercent
                    }%
                  </p>

                </div>


                <div
                  className="
                    mt-3
                    h-2
                    overflow-hidden
                    rounded-full
                    bg-white/10
                  "
                >

                  <div
                    className="
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      from-blue-400
                      via-cyan-300
                      to-emerald-300
                      transition-all
                      duration-700
                    "
                    style={{
                      width:
                        `${journeyPercent}%`,
                    }}
                  />

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}