import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import openingBackground
  from '../../assets/opening/timepalette_opening_background.png';

import timePaletteLogo
  from '../../assets/branding/timepalette_global_adventure_logo.png';

const OPENING_DURATION = 6500;

const cityPoints = [
  {
    city: 'TOKYO',
    top: '35%',
    left: '79%',
    delay: '1.4s',
  },
  {
    city: 'SYDNEY',
    top: '70%',
    left: '82%',
    delay: '1.8s',
  },
  {
    city: 'PARIS',
    top: '30%',
    left: '48%',
    delay: '2.1s',
  },
  {
    city: 'NAIROBI',
    top: '56%',
    left: '54%',
    delay: '2.4s',
  },
  {
    city: 'NEW YORK',
    top: '39%',
    left: '25%',
    delay: '2.7s',
  },
];

export default function OpeningSplash({
  onComplete,
}) {
  const timerRef =
    useRef(null);

  const finishedRef =
    useRef(false);

  const [
    exiting,
    setExiting,
  ] = useState(false);

  const finishOpening = useCallback(() => {
  if (
    finishedRef.current
  ) {
    return;
  }

  finishedRef.current =
    true;

  if (timerRef.current) {
    window.clearTimeout(
      timerRef.current
    );
  }

  setExiting(true);

  window.setTimeout(
    () => {
      onComplete?.();
    },
    700
  );
}, [onComplete]);

  useEffect(() => {
    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      'hidden';

    const reducedMotion =
      window.matchMedia?.(
        '(prefers-reduced-motion: reduce)'
      )?.matches;

    timerRef.current =
      window.setTimeout(
        finishOpening,
        reducedMotion
          ? 1200
          : OPENING_DURATION
      );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      if (
        timerRef.current
      ) {
        window.clearTimeout(
          timerRef.current
        );
      }
    };
  }, [finishOpening]);

  return (
    <div
      className={`tp-opening ${
        exiting
          ? 'tp-opening--exit'
          : ''
      }`}
      role="presentation"
    >
      {/* Background */}
      <div
        className="tp-opening__background"
        style={{
          backgroundImage:
            `url(${openingBackground})`,
        }}
      />

      {/* Dark cinematic overlays */}
      <div className="tp-opening__shade" />
      <div className="tp-opening__vignette" />

      {/* Stars */}
      <div className="tp-opening__stars">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* World route */}
      <svg
        className="tp-opening__routes"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="
            M 270 380
            C 480 230,
              650 260,
              790 330
            S 1110 500,
              1310 315
          "
        />

        <path
          d="
            M 450 600
            C 650 430,
              900 430,
              1190 620
          "
        />

        <path
          d="
            M 790 330
            C 900 190,
              1120 200,
              1290 350
          "
        />
      </svg>

      {/* City lights */}
      <div className="tp-opening__cities">
        {cityPoints.map(
          (point) => (
            <div
              key={
                point.city
              }
              className="tp-opening__city"
              style={{
                top:
                  point.top,
                left:
                  point.left,
                animationDelay:
                  point.delay,
              }}
            >
              <span className="tp-opening__city-ring" />
              <span className="tp-opening__city-dot" />

              <span className="tp-opening__city-name">
                {
                  point.city
                }
              </span>
            </div>
          )
        )}
      </div>

      {/* Center glow */}
      <div className="tp-opening__central-glow" />

      {/* Logo */}
      <div className="tp-opening__content">
        <div className="tp-opening__logo-wrap">
          <div className="tp-opening__logo-glow" />

          <img
            src={
              timePaletteLogo
            }
            alt="TimePalette"
            className="tp-opening__logo"
          />

          <div className="tp-opening__orbit tp-opening__orbit--one" />
          <div className="tp-opening__orbit tp-opening__orbit--two" />
        </div>

        <div className="tp-opening__brand-copy">
          <p className="tp-opening__jp">
            世界の冒険学習
          </p>

          <div className="tp-opening__divider" />

          <p className="tp-opening__keywords">
            <span>
              EXPLORE
            </span>

            <i>·</i>

            <span>
              LEARN
            </span>

            <i>·</i>

            <span>
              CONNECT
            </span>
          </p>
        </div>
      </div>

      {/* Start message */}
      <div className="tp-opening__start">
        <span className="tp-opening__start-line" />

        <span>
          WORLD ADVENTURE
          START
        </span>

        <span className="tp-opening__start-line" />
      </div>

      <button
        type="button"
        onClick={
          finishOpening
        }
        className="tp-opening__skip"
      >
        SKIP
        <span>→</span>
      </button>

      <style>{`
        .tp-opening {
          position: fixed;
          inset: 0;
          z-index: 999999;
          overflow: hidden;
          background: #020817;
          opacity: 1;
          transition:
            opacity 0.7s ease,
            visibility 0.7s ease;
        }

        .tp-opening--exit {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .tp-opening__background {
          position: absolute;
          inset: -5%;
          background-position: center;
          background-repeat: no-repeat;
          background-size: cover;

          transform:
            scale(1.14);

          filter:
            brightness(0.2)
            saturate(0.85)
            blur(5px);

          animation:
            tpBackgroundReveal
            6.3s
            cubic-bezier(
              0.22,
              1,
              0.36,
              1
            )
            forwards;
        }

        .tp-opening__shade {
          position: absolute;
          inset: 0;

          background:
            linear-gradient(
              180deg,
              rgba(
                2,
                8,
                23,
                0.78
              )
                0%,
              rgba(
                3,
                20,
                48,
                0.28
              )
                48%,
              rgba(
                2,
                8,
                23,
                0.7
              )
                100%
            );

          animation:
            tpShadeReveal
            6s ease
            forwards;
        }

        .tp-opening__vignette {
          position: absolute;
          inset: 0;

          background:
            radial-gradient(
              circle at center,
              transparent 20%,
              rgba(
                1,
                7,
                20,
                0.18
              )
                55%,
              rgba(
                0,
                3,
                12,
                0.8
              )
                100%
            );
        }

        .tp-opening__central-glow {
          position: absolute;
          left: 50%;
          top: 47%;

          width: min(
            55vw,
            850px
          );

          aspect-ratio: 1;

          transform:
            translate(
              -50%,
              -50%
            );

          border-radius:
            9999px;

          background:
            radial-gradient(
              circle,
              rgba(
                56,
                189,
                248,
                0.22
              )
                0%,
              rgba(
                59,
                130,
                246,
                0.1
              )
                35%,
              transparent
                68%
            );

          opacity: 0;

          animation:
            tpGlow
            2.5s
            1s ease
            forwards;
        }

        .tp-opening__content {
          position: absolute;
          inset: 0;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          padding:
            6vh 6vw
            11vh;

          text-align: center;
        }

        .tp-opening__logo-wrap {
          position: relative;

          width: min(
            760px,
            72vw
          );

          opacity: 0;

          transform:
            scale(0.64)
            translateY(
              20px
            );

          filter:
            blur(15px);

          animation:
            tpLogoReveal
            1.65s
            2.35s
            cubic-bezier(
              0.16,
              1,
              0.3,
              1
            )
            forwards;
        }

        .tp-opening__logo {
          position: relative;
          z-index: 3;

          width: 100%;
          height: auto;

          display: block;

          filter:
            drop-shadow(
              0 12px 35px
              rgba(
                0,
                0,
                0,
                0.45
              )
            );
        }

        .tp-opening__logo-glow {
          position: absolute;
          z-index: 1;

          left: 50%;
          top: 45%;

          width: 92%;
          height: 75%;

          transform:
            translate(
              -50%,
              -50%
            );

          border-radius:
            999px;

          background:
            radial-gradient(
              ellipse,
              rgba(
                96,
                165,
                250,
                0.34
              ),
              rgba(
                14,
                165,
                233,
                0.12
              )
                42%,
              transparent
                72%
            );

          filter:
            blur(20px);
        }

        .tp-opening__orbit {
          position: absolute;
          z-index: 2;

          left: 50%;
          top: 42%;

          width: 73%;
          height: 40%;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.38
            );

          border-radius:
            50%;

          pointer-events:
            none;

          opacity: 0;
        }

        .tp-opening__orbit--one {
          transform:
            translate(
              -50%,
              -50%
            )
            rotate(-9deg);

          animation:
            tpOrbitOne
            2.4s
            3.2s ease
            forwards;
        }

        .tp-opening__orbit--two {
          width: 63%;
          height: 34%;

          transform:
            translate(
              -50%,
              -50%
            )
            rotate(14deg);

          animation:
            tpOrbitTwo
            2.3s
            3.45s ease
            forwards;
        }

        .tp-opening__brand-copy {
          margin-top:
            clamp(
              4px,
              0.5vh,
              10px
            );

          color: white;
        }

        .tp-opening__jp {
          margin: 0;

          opacity: 0;

          font-size:
            clamp(
              15px,
              1.75vw,
              25px
            );

          font-weight: 900;

          letter-spacing:
            0.24em;

          text-shadow:
            0 3px 15px
            rgba(
              0,
              0,
              0,
              0.55
            );

          animation:
            tpCopyUp
            0.9s
            3.65s ease
            forwards;
        }

        .tp-opening__divider {
          width: 0;
          height: 2px;

          margin:
            14px auto
            12px;

          border-radius:
            999px;

          background:
            linear-gradient(
              90deg,
              transparent,
              #38bdf8,
              #fde047,
              #f472b6,
              transparent
            );

          animation:
            tpDivider
            1s
            4s ease
            forwards;
        }

        .tp-opening__keywords {
          display: flex;
          align-items: center;
          justify-content: center;
          gap:
            clamp(
              10px,
              2vw,
              28px
            );

          margin: 0;

          color:
            rgba(
              255,
              255,
              255,
              0.92
            );

          font-size:
            clamp(
              12px,
              1.45vw,
              20px
            );

          font-weight: 800;

          letter-spacing:
            0.2em;
        }

        .tp-opening__keywords span,
        .tp-opening__keywords i {
          opacity: 0;
          transform:
            translateY(
              8px
            );
        }

        .tp-opening__keywords span:nth-child(1) {
          animation:
            tpWordReveal
            0.55s
            4.25s ease
            forwards;
        }

        .tp-opening__keywords i:nth-child(2) {
          animation:
            tpWordReveal
            0.4s
            4.45s ease
            forwards;
        }

        .tp-opening__keywords span:nth-child(3) {
          animation:
            tpWordReveal
            0.55s
            4.6s ease
            forwards;
        }

        .tp-opening__keywords i:nth-child(4) {
          animation:
            tpWordReveal
            0.4s
            4.8s ease
            forwards;
        }

        .tp-opening__keywords span:nth-child(5) {
          animation:
            tpWordReveal
            0.55s
            4.95s ease
            forwards;
        }

        .tp-opening__keywords i {
          font-style: normal;
          color: #facc15;
        }

        .tp-opening__routes {
          position: absolute;
          inset: 0;

          width: 100%;
          height: 100%;

          pointer-events:
            none;

          opacity: 0.75;
        }

        .tp-opening__routes path {
          fill: none;

          stroke:
            rgba(
              125,
              211,
              252,
              0.72
            );

          stroke-width: 2;

          stroke-linecap:
            round;

          stroke-dasharray:
            8 13;

          stroke-dashoffset:
            260;

          filter:
            drop-shadow(
              0 0 8px
              rgba(
                56,
                189,
                248,
                0.65
              )
            );

          animation:
            tpRouteMove
            4.4s
            1.05s ease-out
            forwards;
        }

        .tp-opening__cities {
          position: absolute;
          inset: 0;
        }

        .tp-opening__city {
          position: absolute;

          width: 10px;
          height: 10px;

          opacity: 0;

          animation:
            tpCityReveal
            0.8s ease
            forwards;
        }

        .tp-opening__city-dot {
          position: absolute;
          inset: 2px;

          z-index: 3;

          border-radius:
            50%;

          background: #ffffff;

          box-shadow:
            0 0 8px
              #fff,
            0 0 18px
              #38bdf8,
            0 0 32px
              rgba(
                56,
                189,
                248,
                0.85
              );
        }

        .tp-opening__city-ring {
          position: absolute;
          inset: -8px;

          border:
            1px solid
            rgba(
              125,
              211,
              252,
              0.9
            );

          border-radius:
            50%;

          animation:
            tpPulse
            1.8s ease-out
            infinite;
        }

        .tp-opening__city-name {
          position: absolute;
          top: 16px;
          left: 50%;

          transform:
            translateX(
              -50%
            );

          white-space:
            nowrap;

          color:
            rgba(
              255,
              255,
              255,
              0.78
            );

          font-size:
            9px;

          font-weight: 900;

          letter-spacing:
            0.14em;

          text-shadow:
            0 2px 7px
              rgba(
                0,
                0,
                0,
                0.9
              );
        }

        .tp-opening__stars span {
          position: absolute;

          width: 3px;
          height: 3px;

          border-radius:
            50%;

          background: white;

          box-shadow:
            0 0 12px
              white;

          opacity: 0;

          animation:
            tpStarTwinkle
            2s ease-in-out
            infinite;
        }

        .tp-opening__stars span:nth-child(1) {
          left: 12%;
          top: 16%;
          animation-delay:
            0.4s;
        }

        .tp-opening__stars span:nth-child(2) {
          left: 28%;
          top: 28%;
          animation-delay:
            1.1s;
        }

        .tp-opening__stars span:nth-child(3) {
          left: 48%;
          top: 12%;
          animation-delay:
            0.8s;
        }

        .tp-opening__stars span:nth-child(4) {
          left: 67%;
          top: 23%;
          animation-delay:
            1.6s;
        }

        .tp-opening__stars span:nth-child(5) {
          left: 86%;
          top: 17%;
          animation-delay:
            0.65s;
        }

        .tp-opening__stars span:nth-child(6) {
          left: 76%;
          top: 66%;
          animation-delay:
            1.3s;
        }

        .tp-opening__start {
          position: absolute;
          left: 50%;
          bottom:
            clamp(
              32px,
              5vh,
              62px
            );

          display: flex;
          align-items: center;
          gap: 14px;

          transform:
            translateX(
              -50%
            );

          color:
            rgba(
              255,
              255,
              255,
              0.7
            );

          font-size:
            clamp(
              9px,
              0.85vw,
              12px
            );

          font-weight: 900;

          letter-spacing:
            0.24em;

          white-space:
            nowrap;

          opacity: 0;

          animation:
            tpCopyUp
            0.8s
            5.25s ease
            forwards;
        }

        .tp-opening__start-line {
          width: 36px;
          height: 1px;

          background:
            rgba(
              255,
              255,
              255,
              0.4
            );
        }

        .tp-opening__skip {
          position: absolute;
          z-index: 20;

          right:
            clamp(
              18px,
              3vw,
              44px
            );

          top:
            clamp(
              18px,
              3vh,
              34px
            );

          display: flex;
          align-items: center;
          gap: 8px;

          border:
            1px solid
            rgba(
              255,
              255,
              255,
              0.25
            );

          border-radius:
            999px;

          background:
            rgba(
              2,
              8,
              23,
              0.28
            );

          padding:
            8px 14px;

          color:
            rgba(
              255,
              255,
              255,
              0.72
            );

          font-size: 11px;
          font-weight: 900;
          letter-spacing:
            0.14em;

          backdrop-filter:
            blur(10px);

          cursor: pointer;

          transition:
            background 0.2s ease,
            color 0.2s ease,
            border-color
              0.2s ease;
        }

        .tp-opening__skip:hover {
          background:
            rgba(
              255,
              255,
              255,
              0.14
            );

          border-color:
            rgba(
              255,
              255,
              255,
              0.55
            );

          color: white;
        }

        @keyframes tpBackgroundReveal {
          0% {
            transform:
              scale(1.14);

            filter:
              brightness(0.18)
              saturate(0.7)
              blur(6px);
          }

          45% {
            filter:
              brightness(0.48)
              saturate(0.95)
              blur(2px);
          }

          100% {
            transform:
              scale(1);

            filter:
              brightness(0.75)
              saturate(1.05)
              blur(0);
          }
        }

        @keyframes tpShadeReveal {
          0% {
            opacity: 1;
          }

          100% {
            opacity: 0.7;
          }
        }

        @keyframes tpGlow {
          from {
            opacity: 0;
            transform:
              translate(
                -50%,
                -50%
              )
              scale(0.6);
          }

          to {
            opacity: 1;
            transform:
              translate(
                -50%,
                -50%
              )
              scale(1);
          }
        }

        @keyframes tpLogoReveal {
          0% {
            opacity: 0;

            transform:
              scale(0.64)
              translateY(
                20px
              );

            filter:
              blur(15px);
          }

          72% {
            opacity: 1;

            transform:
              scale(1.055)
              translateY(0);

            filter:
              blur(0);
          }

          100% {
            opacity: 1;

            transform:
              scale(1)
              translateY(0);

            filter:
              blur(0);
          }
        }

        @keyframes tpCopyUp {
          from {
            opacity: 0;

            transform:
              translateY(
                10px
              );
          }

          to {
            opacity: 1;

            transform:
              translateY(0);
          }
        }

        @keyframes tpDivider {
          from {
            width: 0;
          }

          to {
            width:
              min(
                320px,
                55vw
              );
          }
        }

        @keyframes tpWordReveal {
          from {
            opacity: 0;

            transform:
              translateY(
                8px
              );
          }

          to {
            opacity: 1;

            transform:
              translateY(0);
          }
        }

        @keyframes tpRouteMove {
          0% {
            stroke-dashoffset:
              260;

            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          100% {
            stroke-dashoffset:
              0;

            opacity: 0.8;
          }
        }

        @keyframes tpCityReveal {
          from {
            opacity: 0;

            transform:
              scale(0.2);
          }

          to {
            opacity: 1;

            transform:
              scale(1);
          }
        }

        @keyframes tpPulse {
          0% {
            opacity: 0.9;

            transform:
              scale(0.45);
          }

          100% {
            opacity: 0;

            transform:
              scale(1.75);
          }
        }

        @keyframes tpStarTwinkle {
          0%,
          100% {
            opacity: 0.15;

            transform:
              scale(0.7);
          }

          50% {
            opacity: 1;

            transform:
              scale(1.5);
          }
        }

        @keyframes tpOrbitOne {
          from {
            opacity: 0;

            transform:
              translate(
                -50%,
                -50%
              )
              rotate(-24deg)
              scale(0.7);
          }

          to {
            opacity: 0.48;

            transform:
              translate(
                -50%,
                -50%
              )
              rotate(-9deg)
              scale(1);
          }
        }

        @keyframes tpOrbitTwo {
          from {
            opacity: 0;

            transform:
              translate(
                -50%,
                -50%
              )
              rotate(30deg)
              scale(0.7);
          }

          to {
            opacity: 0.26;

            transform:
              translate(
                -50%,
                -50%
              )
              rotate(14deg)
              scale(1);
          }
        }

        @media (
          max-width:
          640px
        ) {
          .tp-opening__background {
            background-position:
              center center;
          }

          .tp-opening__logo-wrap {
            width: 92vw;
          }

          .tp-opening__content {
            padding-left:
              4vw;
            padding-right:
              4vw;
          }

          .tp-opening__city:nth-child(2),
          .tp-opening__city:nth-child(4) {
            display: none;
          }

          .tp-opening__routes {
            opacity: 0.48;
          }

          .tp-opening__keywords {
            letter-spacing:
              0.11em;
          }

          .tp-opening__jp {
            letter-spacing:
              0.14em;
          }
        }

        @media (
          prefers-reduced-motion:
          reduce
        ) {
          .tp-opening *,
          .tp-opening *::before,
          .tp-opening *::after {
            animation-duration:
              0.01ms !important;

            animation-delay:
              0ms !important;

            transition-duration:
              0.01ms !important;
          }

          .tp-opening__background {
            filter:
              brightness(0.65);
          }

          .tp-opening__logo-wrap,
          .tp-opening__jp,
          .tp-opening__keywords span,
          .tp-opening__keywords i,
          .tp-opening__start {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}