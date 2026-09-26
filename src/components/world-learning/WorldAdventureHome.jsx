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
        min-h-[650px]
        overflow-hidden
        bg-slate-950
        text-white
      "
    >

      {/* =====================================================
          BACKGROUND
      ====================================================== */}

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
          scale-[1.02]
          object-cover
          object-center
        "
      />


      {/* DARK LEFT GRADIENT */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-r
          from-[#020817]/95
          via-[#071426]/72
          to-[#071426]/20
        "
      />


      {/* BOTTOM GRADIENT */}

      <div
        className="
          absolute
          inset-0
          bg-gradient-to-t
          from-[#020817]/95
          via-transparent
          to-[#020817]/30
        "
      />


      {/* BLUE LIGHT */}

      <div
        className="
          pointer-events-none
          absolute
          -left-40
          top-[32%]
          h-[560px]
          w-[560px]
          rounded-full
          bg-blue-500/18
          blur-[140px]
        "
      />


      {/* CYAN LIGHT */}

      <div
        className="
          pointer-events-none
          absolute
          left-[28%]
          top-[45%]
          h-[380px]
          w-[380px]
          rounded-full
          bg-cyan-400/10
          blur-[130px]
        "
      />


      {/* VIOLET LIGHT */}

      <div
        className="
          pointer-events-none
          absolute
          right-[5%]
          top-[20%]
          h-[500px]
          w-[500px]
          rounded-full
          bg-violet-500/10
          blur-[150px]
        "
      />


      {/* =====================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          relative
          z-10
          mx-auto
          flex
          h-full
          w-full
          max-w-[1600px]
          flex-col
          px-5
          pb-7
          pt-4
          sm:px-7
          md:px-10
          lg:px-14
          xl:px-16
        "
      >

        {/* ===================================================
            TOP
        ==================================================== */}

        <div
          className="
            flex
            shrink-0
            items-start
            justify-between
          "
        >

          {/* BIG LOGO */}

          <img
            src={
              timePaletteLogo
            }
            alt="TimePalette World Adventure"
            className="
              w-[280px]
              select-none
              drop-shadow-[0_18px_38px_rgba(0,0,0,0.50)]
              sm:w-[340px]
              md:w-[400px]
              lg:w-[455px]
              xl:w-[500px]
            "
          />


          {/* SOUND */}

          <button
            type="button"
            onClick={
              toggleSound
            }
            className="
              mt-2
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              border
              border-white/20
              bg-black/25
              text-white/80
              shadow-lg
              backdrop-blur-xl
              transition-all
              duration-300
              hover:scale-105
              hover:bg-white/15
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


        {/* ===================================================
            MAIN
        ==================================================== */}

        <div
          className="
            grid
            min-h-0
            flex-1
            grid-cols-1
            items-center
            gap-8
            lg:grid-cols-[1.15fr_0.85fr]
            lg:gap-12
            xl:gap-20
          "
        >

          {/* =================================================
              LEFT
          ================================================== */}

          <div
            className="
              flex
              h-full
              max-w-[820px]
              flex-col
              justify-center
              pb-4
              lg:pb-8
            "
          >

            {/* SMALL LABEL */}

            <div
              className="
                inline-flex
                w-fit
                items-center
                gap-2.5
                rounded-full
                border
                border-cyan-300/25
                bg-cyan-300/10
                px-4
                py-2
                shadow-[0_8px_30px_rgba(34,211,238,0.10)]
                backdrop-blur-xl
              "
            >

              <Globe2
                size={15}
                className="
                  text-cyan-300
                "
              />

              <span
                className="
                  text-[10px]
                  font-black
                  tracking-[0.22em]
                  text-cyan-100
                "
              >
                EXPLORE · LEARN · CONNECT
              </span>

            </div>


            {/* HERO TITLE */}

            <h1
              className="
                mt-5
                max-w-[760px]
                text-[40px]
                font-black
                leading-[1.04]
                tracking-[-0.05em]
                text-white
                drop-shadow-[0_8px_28px_rgba(0,0,0,0.45)]
                sm:text-[48px]
                md:text-[58px]
                lg:text-[66px]
                xl:text-[76px]
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


            {/* DESCRIPTION */}

            <p
              className="
                mt-5
                max-w-[620px]
                text-sm
                font-semibold
                leading-7
                text-white/68
                sm:text-base
                md:leading-8
              "
            >
              世界の国を訪れ、
              地図・時間・ことば・文化から
              新しい発見をしよう。
            </p>


            {/* =================================================
                BLUE MAIN CTA
            ================================================== */}

            <div
              className="
                relative
                mt-8
                w-fit
                sm:mt-9
              "
            >

              {/* OUTER GLOW */}

              <div
                className="
                  pointer-events-none
                  absolute
                  -inset-3
                  rounded-[30px]
                  bg-gradient-to-r
                  from-blue-600/60
                  via-cyan-400/45
                  to-blue-500/45
                  opacity-80
                  blur-2xl
                "
              />


              {/* SECOND GLOW */}

              <div
                className="
                  pointer-events-none
                  absolute
                  inset-2
                  rounded-[24px]
                  bg-cyan-300/25
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
                  flex
                  min-w-[310px]
                  items-center
                  overflow-hidden
                  rounded-[24px]
                  border
                  border-cyan-200/55
                  bg-gradient-to-r
                  from-[#0759d9]
                  via-[#0878ec]
                  to-[#19b8f0]
                  px-4
                  py-4
                  text-left
                  shadow-[0_20px_55px_rgba(0,122,255,0.42),inset_0_1px_0_rgba(255,255,255,0.30)]
                  transition-all
                  duration-300
                  hover:-translate-y-1.5
                  hover:scale-[1.025]
                  hover:border-white/75
                  hover:shadow-[0_28px_75px_rgba(0,153,255,0.55),inset_0_1px_0_rgba(255,255,255,0.40)]
                  sm:min-w-[370px]
                  sm:px-5
                  sm:py-5
                  md:min-w-[410px]
                "
              >

                {/* SHINE */}

                <div
                  className="
                    pointer-events-none
                    absolute
                    -left-[30%]
                    -top-[130%]
                    h-[320%]
                    w-[35%]
                    rotate-[22deg]
                    bg-gradient-to-r
                    from-transparent
                    via-white/20
                    to-transparent
                    transition-all
                    duration-700
                    group-hover:left-[115%]
                  "
                />


                {/* ICON */}

                <div
                  className="
                    relative
                    z-10
                    flex
                    h-14
                    w-14
                    shrink-0
                    items-center
                    justify-center
                    rounded-[18px]
                    border
                    border-white/35
                    bg-white/16
                    text-white
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]
                    backdrop-blur
                    transition-all
                    duration-300
                    group-hover:scale-110
                    group-hover:bg-white/24
                    sm:h-16
                    sm:w-16
                  "
                >

                  <Compass
                    size={28}
                    strokeWidth={2}
                  />

                </div>


                {/* TEXT */}

                <div
                  className="
                    relative
                    z-10
                    ml-4
                    min-w-0
                    flex-1
                  "
                >

                  <p
                    className="
                      text-[9px]
                      font-black
                      tracking-[0.25em]
                      text-cyan-100/85
                      sm:text-[10px]
                    "
                  >
                    START YOUR JOURNEY
                  </p>


                  <p
                    className="
                      mt-0.5
                      whitespace-nowrap
                      text-xl
                      font-black
                      tracking-[-0.03em]
                      text-white
                      drop-shadow-sm
                      sm:text-2xl
                      md:text-[27px]
                    "
                  >
                    冒険を始める
                  </p>

                </div>


                {/* ARROW */}

                <div
                  className="
                    relative
                    z-10
                    ml-4
                    flex
                    h-11
                    w-11
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-white/45
                    bg-white
                    text-blue-600
                    shadow-[0_8px_22px_rgba(0,70,180,0.25)]
                    transition-all
                    duration-300
                    group-hover:translate-x-1.5
                    group-hover:scale-110
                    sm:h-12
                    sm:w-12
                  "
                >

                  <ArrowRight
                    size={21}
                    strokeWidth={2.5}
                  />

                </div>

              </button>

            </div>

          </div>


          {/* =================================================
              RIGHT / JOURNEY
          ================================================== */}

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
                rounded-[30px]
                border
                border-white/15
                bg-[#06101f]/52
                p-6
                shadow-[0_30px_85px_rgba(0,0,0,0.34)]
                backdrop-blur-2xl
                xl:w-[380px]
              "
            >

              {/* HEADER */}

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
                      tracking-[0.20em]
                      text-cyan-300
                    "
                  >
                    YOUR JOURNEY
                  </p>


                  <h2
                    className="
                      mt-2
                      text-xl
                      font-black
                      tracking-tight
                      text-white
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
                    border
                    border-white/10
                    bg-white/10
                    text-3xl
                    shadow-inner
                  "
                >
                  🌍
                </div>

              </div>


              {/* STATS */}

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
                    bg-white/[0.06]
                    p-4
                  "
                >

                  <p
                    className="
                      text-2xl
                      font-black
                      text-white
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
                      tracking-[0.14em]
                      text-white/40
                    "
                  >
                    COUNTRIES
                  </p>

                </div>


                <div
                  className="
                    rounded-2xl
                    border
                    border-cyan-300/15
                    bg-cyan-300/[0.07]
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
                      tracking-[0.14em]
                      text-white/40
                    "
                  >
                    MISSIONS
                  </p>

                </div>

              </div>


              {/* PROGRESS */}

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
                      text-white
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
                      from-blue-500
                      via-cyan-300
                      to-emerald-300
                      shadow-[0_0_18px_rgba(34,211,238,0.65)]
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