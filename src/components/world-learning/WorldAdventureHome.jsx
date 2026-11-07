import { lazy, Suspense, useState } from 'react';
import { buildLearnerJourney } from '../../utils/learnerJourneyProgress.js';
import JourneySummaryCard from './JourneySummaryCard.jsx';
const MyWorldJourney = lazy(() => import('./MyWorldJourney.jsx'));
import HomeToolsButton from '../navigation/HomeToolsButton';
import {
  ArrowRight,
  Compass,
  Globe2,
} from 'lucide-react';


import timePaletteLogo
  from '../../assets/branding/timepalette_global_adventure_logo.png';

import openingBackground
  from '../../assets/opening/timepalette_opening_background.png';

import {
  getLiveWorldLearningCountries,
} from '../../utils/worldLearningRegistry';

import {
  playUiSound,
} from '../../utils/uiSound';


export default function WorldAdventureHome({
  onExploreWorld,
  onOpenTool,
}) {
  
  const liveCountries =
    getLiveWorldLearningCountries();


  const [showJourney, setShowJourney] = useState(false);
  const journey = buildLearnerJourney(liveCountries);

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
        h-[100dvh]
        min-h-[650px]
        overflow-hidden
        bg-slate-950
        text-white
      "
    >

      <HomeToolsButton onSelectTool={onOpenTool}/>
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


          {/* Personal progress: the opening, BGM and adventure CTA stay unchanged. */}
          <div id="journey" className="hidden lg:block lg:justify-self-end">
            <JourneySummaryCard summary={journey} onOpen={() => setShowJourney(true)} />
          </div>


        </div>

      </div>

      {/* On smaller iPads and phones, keep a compact progress entry without taking a row. */}
      <button type="button" onClick={() => setShowJourney(true)}
        className="absolute bottom-5 right-4 z-20 inline-flex items-center gap-2 rounded-2xl border border-cyan-100/35 bg-[#07172c]/85 px-4 py-3 text-xs font-black text-white shadow-[0_14px_40px_rgba(0,0,0,0.4)] backdrop-blur-xl lg:hidden">
        <span className="text-base">🌍</span>
        世界探究 <span className="text-cyan-200">{journey.exploredCountries}/{journey.totalCountries}</span>
        <ArrowRight size={16}/>
      </button>
      {showJourney && (
        <Suspense fallback={<div role="status" className="fixed inset-0 z-[100] flex items-center justify-center bg-[#061123] text-cyan-100">進捗を読み込み中…</div>}>
          <MyWorldJourney summary={journey}
            onClose={() => setShowJourney(false)}
            onExplore={() => { setShowJourney(false); startAdventure(); }} />
        </Suspense>
      )}
    </div>
  );
}
