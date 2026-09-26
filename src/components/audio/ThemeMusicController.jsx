import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';

import {
  Volume2,
  VolumeX,
} from 'lucide-react';

import themeMusic
  from '../../assets/audio/timepalette_theme.mp3';

const DEFAULT_VOLUME = 0.52;

const ThemeMusicController =
  forwardRef(
    function ThemeMusicController(
      {
        visible = true,
      },
      ref
    ) {
      const audioRef =
        useRef(null);

      const fadeTimerRef =
        useRef(null);

      const [
        playing,
        setPlaying,
      ] = useState(false);

      const [
        autoplayBlocked,
        setAutoplayBlocked,
      ] = useState(false);

      const clearFade =
        useCallback(() => {
          if (
            fadeTimerRef.current
          ) {
            window.clearInterval(
              fadeTimerRef.current
            );

            fadeTimerRef.current =
              null;
          }
        }, []);

      const start =
        useCallback(
          async ({
            restart = false,
          } = {}) => {
            const audio =
              audioRef.current;

            if (!audio) {
              return false;
            }

            clearFade();

            if (restart) {
              audio.currentTime =
                0;
            }

            audio.volume =
              DEFAULT_VOLUME;

            try {
              await audio.play();

              setPlaying(true);

              setAutoplayBlocked(
                false
              );

              return true;
            } catch {
              setPlaying(false);

              setAutoplayBlocked(
                true
              );

              return false;
            }
          },
          [clearFade]
        );

      const pause =
        useCallback(() => {
          const audio =
            audioRef.current;

          if (!audio) {
            return;
          }

          clearFade();

          audio.pause();

          setPlaying(false);
        }, [clearFade]);

      const fadeOut =
        useCallback(
          ({
            duration = 800,
            reset = true,
          } = {}) => {
            const audio =
              audioRef.current;

            if (
              !audio ||
              audio.paused
            ) {
              return;
            }

            clearFade();

            const initialVolume =
              Math.max(
                audio.volume,
                0.001
              );

            const steps = 20;

            const interval =
              Math.max(
                16,
                Math.round(
                  duration /
                    steps
                )
              );

            let currentStep = 0;

            fadeTimerRef.current =
              window.setInterval(
                () => {
                  currentStep += 1;

                  const progress =
                    currentStep /
                    steps;

                  audio.volume =
                    Math.max(
                      0,
                      initialVolume *
                        (1 -
                          progress)
                    );

                  if (
                    currentStep >=
                    steps
                  ) {
                    clearFade();

                    audio.pause();

                    if (reset) {
                      audio.currentTime =
                        0;
                    }

                    audio.volume =
                      DEFAULT_VOLUME;

                    setPlaying(
                      false
                    );
                  }
                },
                interval
              );
          },
          [clearFade]
        );

      const toggle =
        useCallback(
          async () => {
            const audio =
              audioRef.current;

            if (!audio) {
              return;
            }

            if (
              audio.paused
            ) {
              await start();
            } else {
              pause();
            }
          },
          [
            pause,
            start,
          ]
        );

      useImperativeHandle(
        ref,
        () => ({
          start,
          pause,
          toggle,
          fadeOut,
        }),
        [
          start,
          pause,
          toggle,
          fadeOut,
        ]
      );

      useEffect(() => {
        const audio =
          new Audio(
            themeMusic
          );

        audio.preload =
          'auto';

        audio.volume =
          DEFAULT_VOLUME;

        audio.loop = false;

        audioRef.current =
          audio;

        const handleEnded =
          () => {
            setPlaying(
              false
            );
          };

        audio.addEventListener(
          'ended',
          handleEnded
        );

        const autoplayTimer =
          window.setTimeout(
            () => {
              start();
            },
            180
          );

        return () => {
          window.clearTimeout(
            autoplayTimer
          );

          clearFade();

          audio.pause();

          audio.removeEventListener(
            'ended',
            handleEnded
          );

          audioRef.current =
            null;
        };
      }, [
        clearFade,
        start,
      ]);

      if (!visible) {
        return null;
      }

      return (
        <button
          type="button"
          onClick={
            toggle
          }
          className="
            fixed
            bottom-5
            right-5
            z-[1000000]
            flex
            items-center
            gap-2
            border
            border-white/20
            bg-slate-950/55
            px-3.5
            py-2.5
            text-[10px]
            font-semibold
            tracking-[0.16em]
            text-white/80
            shadow-lg
            backdrop-blur-xl
            transition
            hover:border-white/35
            hover:bg-slate-950/70
            hover:text-white
          "
          aria-label={
            playing
              ? '主題歌を停止'
              : '主題歌を再生'
          }
        >
          {playing ? (
            <Volume2
              size={15}
              strokeWidth={
                1.8
              }
            />
          ) : (
            <VolumeX
              size={15}
              strokeWidth={
                1.8
              }
            />
          )}

          <span>
            {autoplayBlocked
              ? 'PLAY THEME'
              : playing
                ? 'THEME ON'
                : 'THEME'}
          </span>
        </button>
      );
    }
  );

export default ThemeMusicController;