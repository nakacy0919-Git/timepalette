import {
  Headphones,
  Mic,
  RotateCcw,
  Square,
} from 'lucide-react';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  playUiSound,
} from '../../../utils/uiSound';


const PASS_SCORE = 80;


const normalize =
  (
    value = ''
  ) =>
    String(
      value
    )
      .toLowerCase()
      .replace(
        /[’']/g,
        "'"
      )
      .replace(
        /[^a-z0-9'\s]/g,
        ' '
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();


const calculateAccuracy =
  (
    target,
    transcript
  ) => {
    const a =
      normalize(
        target
      )
        .split(
          ' '
        )
        .filter(
          Boolean
        );

    const b =
      normalize(
        transcript
      )
        .split(
          ' '
        )
        .filter(
          Boolean
        );


    if (
      a.length === 0 ||
      b.length === 0
    ) {
      return 0;
    }


    const matrix =
      Array.from(
        {
          length:
            a.length + 1,
        },
        () =>
          Array(
            b.length + 1
          ).fill(
            0
          )
      );


    for (
      let i = 0;
      i <= a.length;
      i += 1
    ) {
      matrix[i][0] =
        i;
    }


    for (
      let j = 0;
      j <= b.length;
      j += 1
    ) {
      matrix[0][j] =
        j;
    }


    for (
      let i = 1;
      i <= a.length;
      i += 1
    ) {
      for (
        let j = 1;
        j <= b.length;
        j += 1
      ) {
        const cost =
          a[i - 1] ===
          b[j - 1]
            ? 0
            : 1;


        matrix[i][j] =
          Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + cost
          );
      }
    }


    const distance =
      matrix[a.length][b.length];


    return Math.max(
      0,
      Math.round(
        (
          1 -
          distance /
            Math.max(
              a.length,
              b.length
            )
        ) *
          100
      )
    );
  };


/*
 * =========================================================
 * PERSONAL NAME PROTECTION
 *
 * Browser speech recognition often converts unfamiliar
 * personal names into familiar words:
 *
 *   KOHEI -> Cohen
 *   Aki   -> a key
 *
 * The learner typed their own name before practice, so the
 * name itself is not used as a pronunciation test.
 *
 * Only the personal-name slot is corrected.
 * The fixed English sentence is still scored normally.
 * =========================================================
 */

const protectPersonalNameInTranscript =
  (
    target,
    transcript,
    personalName
  ) => {
    const name =
      String(
        personalName ??
        ''
      ).trim();


    const raw =
      String(
        transcript ??
        ''
      ).trim();


    if (
      !name ||
      !raw
    ) {
      return raw;
    }


    const normalizedTarget =
      normalize(
        target
      );


    const normalizedName =
      normalize(
        name
      );


    if (
      !normalizedName ||
      !normalizedTarget.includes(
        `my name is ${normalizedName}`
      )
    ) {
      return raw;
    }


    /*
     * Examples:
     *
     * hi my name is Cohen
     *
     * hi my name is Cohen nice to meet you
     *
     * Everything recognized between
     * "my name is" and the next fixed phrase
     * is treated as the personal-name slot.
     */
    const namePattern =
      /\b(my\s+name\s+is)\s+(.+?)(?=\s+nice\s+to\s+meet\s+you\b|[.!?]*$)/i;


    if (
      !namePattern.test(
        raw
      )
    ) {
      return raw;
    }


    return raw.replace(
      namePattern,
      (
        _whole,
        lead
      ) =>
        `${lead} ${name}`
    );
  };


const speak =
  (
    text
  ) => {
    if (
      typeof window === 'undefined' ||
      !(
        'speechSynthesis' in
        window
      )
    ) {
      return;
    }


    window
      .speechSynthesis
      .cancel();


    const utterance =
      new SpeechSynthesisUtterance(
        text
      );


    utterance.lang =
      'en-US';

    utterance.rate =
      0.82;


    window
      .speechSynthesis
      .speak(
        utterance
      );
  };


const load =
  (
    key,
    fallback
  ) => {
    try {
      const raw =
        window
          .localStorage
          .getItem(
            key
          );

      return raw
        ? (
            JSON.parse(
              raw
            ) ??
            fallback
          )
        : fallback;
    } catch {
      return fallback;
    }
  };


const save =
  (
    key,
    value
  ) => {
    try {
      window
        .localStorage
        .setItem(
          key,
          JSON.stringify(
            value
          )
        );
    } catch {
      // optional
    }
  };


const fill =
  (
    template,
    values
  ) =>
    String(
      template ??
      ''
    ).replace(
      /\{\{(\w+)\}\}/g,
      (
        _,
        key
      ) =>
        String(
          values?.[key] ??
          ''
        ).trim()
    );


function emit(
  missionId,
  step,
  total,
  score,
  passed,
  note
) {
  window.dispatchEvent(
    new CustomEvent(
      'tp-language-speech-progress',
      {
        detail: {
          missionId,
          step,
          total,
          accuracy:
            score,
          passed,
          note,
        },
      }
    )
  );
}


let speechFeedbackAudioContext =
  null;


function playSpeechFeedbackSound(
  passed
) {
  if (
    typeof window ===
    'undefined'
  ) {
    return;
  }


  const AudioContextClass =
    window.AudioContext ||
    window.webkitAudioContext;


  if (
    !AudioContextClass
  ) {
    return;
  }


  try {
    if (
      !speechFeedbackAudioContext
    ) {
      speechFeedbackAudioContext =
        new AudioContextClass();
    }


    const context =
      speechFeedbackAudioContext;


    const run = () => {
      const now =
        context.currentTime +
        0.01;


      const notes =
        passed
          ? [
              [523.25, 0.00, 0.16],
              [659.25, 0.10, 0.18],
              [783.99, 0.22, 0.24],
              [1046.50, 0.36, 0.30],
            ]
          : [
              [311.13, 0.00, 0.18],
              [246.94, 0.17, 0.26],
            ];


      notes.forEach(
        (
          [
            frequency,
            offset,
            duration,
          ]
        ) => {
          const oscillator =
            context.createOscillator();

          const gain =
            context.createGain();

          const start =
            now +
            offset;


          oscillator.type =
            passed
              ? 'triangle'
              : 'sine';


          oscillator.frequency
            .setValueAtTime(
              frequency,
              start
            );


          gain.gain
            .setValueAtTime(
              0.0001,
              start
            );


          gain.gain
            .exponentialRampToValueAtTime(
              passed
                ? 0.12
                : 0.08,
              start +
              0.02
            );


          gain.gain
            .exponentialRampToValueAtTime(
              0.0001,
              start +
              duration
            );


          oscillator.connect(
            gain
          );

          gain.connect(
            context.destination
          );


          oscillator.start(
            start
          );

          oscillator.stop(
            start +
            duration +
            0.03
          );
        }
      );
    };


    if (
      context.state ===
      'suspended'
    ) {
      context
        .resume()
        .then(
          run
        )
        .catch(
          () => {}
        );
    } else {
      run();
    }


    if (
      'vibrate' in
      navigator
    ) {
      navigator.vibrate(
        passed
          ? [
              30,
              25,
              55,
            ]
          : [
              80,
            ]
      );
    }
  } catch {
    // Feedback sound is optional.
  }
}


const PHRASE_CONFETTI =
  Array.from(
    {
      length: 64,
    },
    (
      _,
      index
    ) => ({
      id:
        index,

      left:
        `${(
          index *
          37
        ) % 100}%`,

      delay:
        `${(
          index %
          10
        ) * 0.035}s`,

      duration:
        `${
          1.05 +
          (
            index %
            7
          ) *
            0.09
        }s`,

      drift:
        `${(
          (
            index *
            29
          ) %
            220
        ) -
          110}px`,

      spin:
        `${
          360 +
          (
            index %
            5
          ) *
            160
        }deg`,

      size:
        `${
          6 +
          (
            index %
            4
          ) *
            2
        }px`,

      color: [
        '#38bdf8',
        '#a78bfa',
        '#f472b6',
        '#fbbf24',
        '#34d399',
        '#fb7185',
        '#ffffff',
      ][
        index %
        7
      ],
    })
  );


function SpeechFeedbackFX({
  feedback,
}) {
  if (
    !feedback
  ) {
    return null;
  }


  const passed =
    feedback.passed;


  return (
    <div
      className="
        pointer-events-none
        fixed
        inset-0
        z-[100500]
        overflow-hidden
      "
      aria-hidden="true"
    >
      <style>
        {`
          @keyframes tp-language-phrase-confetti {
            0% {
              opacity: 0;
              transform:
                translate3d(
                  0,
                  -12vh,
                  0
                )
                rotate(0deg);
            }

            8% {
              opacity: 1;
            }

            100% {
              opacity: 0;
              transform:
                translate3d(
                  var(--tp-drift),
                  112vh,
                  0
                )
                rotate(
                  var(--tp-spin)
                );
            }
          }

          @keyframes tp-language-feedback-pop {
            0% {
              opacity: 0;
              transform:
                translate(
                  -50%,
                  -42%
                )
                scale(.72);
            }

            55% {
              opacity: 1;
              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(1.08);
            }

            100% {
              opacity: 1;
              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(1);
            }
          }

          @keyframes tp-language-error-flash {
            0%,
            100% {
              opacity: 0;
            }

            25% {
              opacity: .18;
            }

            55% {
              opacity: .08;
            }
          }
        `}
      </style>


      {
        passed
          ? (
            <>
              {
                PHRASE_CONFETTI.map(
                  (
                    piece
                  ) => (
                    <span
                      key={
                        piece.id
                      }
                      className="
                        absolute
                        top-[-10vh]
                        rounded-[2px]
                      "
                      style={{
                        left:
                          piece.left,

                        width:
                          piece.size,

                        height:
                          `${
                            Number.parseInt(
                              piece.size,
                              10
                            ) +
                            7
                          }px`,

                        backgroundColor:
                          piece.color,

                        '--tp-drift':
                          piece.drift,

                        '--tp-spin':
                          piece.spin,

                        animation:
                          `tp-language-phrase-confetti ${piece.duration} ease-in ${piece.delay} both`,
                      }}
                    />
                  )
                )
              }


              <div
                className="
                  absolute
                  left-1/2
                  top-1/2
                  rounded-[28px]
                  bg-emerald-500
                  px-8
                  py-5
                  text-center
                  text-white
                  shadow-[0_24px_70px_rgba(16,185,129,.38)]
                "
                style={{
                  animation:
                    'tp-language-feedback-pop 520ms cubic-bezier(.16,1,.3,1) both',
                }}
              >
                <p
                  className="
                    text-[10px]
                    font-black
                    tracking-[0.22em]
                    text-emerald-100
                  "
                >
                  PHRASE CLEAR!
                </p>

                <p
                  className="
                    mt-1
                    text-4xl
                    font-black
                  "
                >
                  {
                    feedback.score
                  }%
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-black
                  "
                >
                  Great! 次へ進もう
                </p>
              </div>
            </>
          )
          : (
            <>
              <div
                className="
                  absolute
                  inset-0
                  bg-rose-500
                "
                style={{
                  animation:
                    'tp-language-error-flash 720ms ease-out both',
                }}
              />


              <div
                className="
                  absolute
                  left-1/2
                  top-1/2
                  rounded-[28px]
                  border-2
                  border-rose-200
                  bg-white
                  px-8
                  py-5
                  text-center
                  text-rose-600
                  shadow-[0_24px_70px_rgba(244,63,94,.24)]
                "
                style={{
                  animation:
                    'tp-language-feedback-pop 420ms cubic-bezier(.16,1,.3,1) both',
                }}
              >
                <p
                  className="
                    text-[10px]
                    font-black
                    tracking-[0.22em]
                    text-rose-400
                  "
                >
                  TRY AGAIN
                </p>

                <p
                  className="
                    mt-1
                    text-4xl
                    font-black
                  "
                >
                  {
                    feedback.score
                  }%
                </p>

                <p
                  className="
                    mt-1
                    text-sm
                    font-black
                    text-slate-600
                  "
                >
                  80%まであと
                  {
                    Math.max(
                      0,
                      PASS_SCORE -
                      feedback.score
                    )
                  }%
                </p>
              </div>
            </>
          )
      }
    </div>
  );
}


function useSpeechRecognition() {
  const recognitionRef =
    useRef(
      null
    );

  const keepRecordingRef =
    useRef(
      false
    );

  const committedTextRef =
    useRef(
      ''
    );

  const restartTimerRef =
    useRef(
      null
    );


  const [
    transcript,
    setTranscript,
  ] = useState(
    ''
  );

  const [
    listening,
    setListening,
  ] = useState(
    false
  );

  const [
    error,
    setError,
  ] = useState(
    ''
  );


  const Recognition =
    typeof window !==
      'undefined'
      ? (
          window
            .SpeechRecognition ??
          window
            .webkitSpeechRecognition ??
          null
        )
      : null;


  const supported =
    Boolean(
      Recognition
    );


  useEffect(
    () => () => {
      keepRecordingRef.current =
        false;


      if (
        restartTimerRef.current
      ) {
        window.clearTimeout(
          restartTimerRef.current
        );
      }


      try {
        recognitionRef
          .current
          ?.abort();
      } catch {
        // optional
      }
    },
    []
  );


  const scheduleRestart =
    (
      delay = 160
    ) => {
      if (
        !keepRecordingRef.current
      ) {
        return;
      }


      if (
        restartTimerRef.current
      ) {
        window.clearTimeout(
          restartTimerRef.current
        );
      }


      restartTimerRef.current =
        window.setTimeout(
          () => {
            restartTimerRef.current =
              null;


            if (
              keepRecordingRef.current
            ) {
              startEngine();
            }
          },
          delay
        );
    };


  const startEngine =
    () => {
      if (
        !Recognition ||
        !keepRecordingRef.current
      ) {
        return;
      }


      const recognition =
        new Recognition();


      recognition.lang =
        'en-US';

      /*
       * Chrome's Web Speech implementation is more stable when one
       * utterance is recognized per session. We therefore use the
       * default single-utterance mode and restart automatically while
       * the user's recording switch remains ON.
       */
      recognition.continuous =
        false;

      recognition.interimResults =
        true;

      recognition.maxAlternatives =
        1;


      recognition.onstart =
        () => {
          setListening(
            true
          );

          setError(
            ''
          );
        };


      recognition.onaudiostart =
        () => {
          setError(
            ''
          );
        };


      recognition.onspeechstart =
        () => {
          setError(
            ''
          );
        };


      recognition.onresult =
        (
          event
        ) => {
          let finalChunk =
            '';

          let interimChunk =
            '';


          for (
            let index =
              event.resultIndex;
            index <
              event.results.length;
            index += 1
          ) {
            const result =
              event.results[index];

            const text =
              result?.[0]
                ?.transcript ??
              '';


            if (
              result.isFinal
            ) {
              finalChunk +=
                ` ${text}`;
            } else {
              interimChunk +=
                ` ${text}`;
            }
          }


          if (
            finalChunk.trim()
          ) {
            committedTextRef.current =
              [
                committedTextRef.current,
                finalChunk,
              ]
                .join(
                  ' '
                )
                .replace(
                  /\s+/g,
                  ' '
                )
                .trim();
          }


          setTranscript(
            [
              committedTextRef.current,
              interimChunk,
            ]
              .join(
                ' '
              )
              .replace(
                /\s+/g,
                ' '
              )
              .trim()
          );

          setError(
            ''
          );
        };


      recognition.onnomatch =
        () => {
          if (
            keepRecordingRef.current
          ) {
            setError(
              '音声は入りましたが、英語として認識できませんでした。もう一度はっきり話してください。'
            );
          }
        };


      recognition.onerror =
        (
          event
        ) => {
          const code =
            event?.error ??
            'unknown';


          if (
            code ===
            'aborted'
          ) {
            return;
          }


          if (
            code ===
              'not-allowed' ||
            code ===
              'service-not-allowed'
          ) {
            keepRecordingRef.current =
              false;

            setListening(
              false
            );

            setError(
              'マイクの使用が許可されていません。Chromeのアドレスバー左側からマイクを許可してください。'
            );

            return;
          }


          if (
            code ===
            'audio-capture'
          ) {
            keepRecordingRef.current =
              false;

            setListening(
              false
            );

            setError(
              'マイク入力を取得できません。WindowsとChromeの入力マイクを確認してください。'
            );

            return;
          }


          if (
            code ===
            'network'
          ) {
            keepRecordingRef.current =
              false;

            setListening(
              false
            );

            setError(
              'Chromeの音声認識サービスに接続できません。インターネット接続を確認して、もう一度「話す」を押してください。'
            );

            return;
          }


          if (
            code ===
            'language-not-supported'
          ) {
            keepRecordingRef.current =
              false;

            setListening(
              false
            );

            setError(
              'このブラウザーでは英語(en-US)の音声認識を開始できません。Chromeを最新版にしてください。'
            );

            return;
          }


          if (
            code ===
            'no-speech'
          ) {
            /*
             * Normal endpointing: Chrome can close a recognition
             * session when it hears silence. onend will restart it.
             */
            return;
          }


          setError(
            `音声認識エラー: ${code}`
          );
        };


      recognition.onend =
        () => {
          recognitionRef.current =
            null;


          if (
            keepRecordingRef.current
          ) {
            setListening(
              true
            );

            scheduleRestart(
              160
            );

            return;
          }


          setListening(
            false
          );
        };


      recognitionRef.current =
        recognition;


      try {
        recognition.start();
      } catch (
        caught
      ) {
        recognitionRef.current =
          null;


        if (
          keepRecordingRef.current
        ) {
          const name =
            caught?.name ??
            'start-error';

          setError(
            `音声認識を再起動しています… (${name})`
          );

          scheduleRestart(
            260
          );
        }
      }
    };


  const start =
    () => {
      if (
        !Recognition
      ) {
        setError(
          'このブラウザーではWeb Speech APIを使えません。Google Chromeで開いてください。'
        );

        return;
      }


      if (
        typeof window !==
          'undefined' &&
        !window.isSecureContext
      ) {
        setError(
          '音声認識には安全な接続が必要です。localhost または HTTPS で開いてください。'
        );

        return;
      }


      if (
        keepRecordingRef.current
      ) {
        return;
      }


      try {
        window
          .speechSynthesis
          ?.cancel();
      } catch {
        // optional
      }


      try {
        recognitionRef
          .current
          ?.abort();
      } catch {
        // optional
      }


      if (
        restartTimerRef.current
      ) {
        window.clearTimeout(
          restartTimerRef.current
        );

        restartTimerRef.current =
          null;
      }


      committedTextRef.current =
        '';

      setTranscript(
        ''
      );

      setError(
        ''
      );

      keepRecordingRef.current =
        true;

      setListening(
        true
      );

      startEngine();
    };


  const stop =
    () => {
      keepRecordingRef.current =
        false;


      if (
        restartTimerRef.current
      ) {
        window.clearTimeout(
          restartTimerRef.current
        );

        restartTimerRef.current =
          null;
      }


      try {
        /*
         * stop() asks Chrome to return the best final result collected
         * so far. listening becomes false only after onend so the
         * Accuracy calculation waits for that final result.
         */
        recognitionRef
          .current
          ?.stop();
      } catch {
        setListening(
          false
        );
      }
    };


  const reset =
    () => {
      keepRecordingRef.current =
        false;


      if (
        restartTimerRef.current
      ) {
        window.clearTimeout(
          restartTimerRef.current
        );

        restartTimerRef.current =
          null;
      }


      try {
        recognitionRef
          .current
          ?.abort();
      } catch {
        // optional
      }


      recognitionRef.current =
        null;

      committedTextRef.current =
        '';

      setTranscript(
        ''
      );

      setListening(
        false
      );

      setError(
        ''
      );
    };


  return {
    transcript,
    listening,
    error,
    supported,
    start,
    stop,
    reset,
  };
}

function AccuracyGauge({
  score,
}) {
  const value =
    score ===
      null
      ? 0
      : Math.max(
          0,
          Math.min(
            100,
            score
          )
        );


  const angle =
    -180 +
    value *
      1.8;


  const passed =
    score !==
      null &&
    score >=
      PASS_SCORE;


  return (
    <div
      className="
        flex
        h-full
        min-h-[170px]
        flex-col
        items-center
        justify-center
        rounded-2xl
        border-2
        border-slate-200
        bg-white
        px-3
        py-3
      "
    >
      <p
        className="
          text-[10px]
          font-black
          tracking-[0.14em]
          text-slate-400
        "
      >
        ACCURACY
      </p>


      <div
        className="
          relative
          mt-1
          h-[92px]
          w-[200px]
        "
      >
        <svg
          viewBox="0 0 200 112"
          className="
            h-full
            w-full
            overflow-visible
          "
          aria-hidden="true"
        >
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="15"
            strokeLinecap="round"
          />

          {
            score !==
            null && (
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={
                  passed
                    ? '#10b981'
                    : '#f59e0b'
                }
                strokeWidth="15"
                strokeLinecap="round"
                pathLength="100"
                strokeDasharray={`${value} 100`}
              />
            )
          }


          <line
            x1="100"
            y1="100"
            x2="163"
            y2="100"
            stroke={
              score ===
              null
                ? '#cbd5e1'
                : passed
                  ? '#047857'
                  : '#c2410c'
            }
            strokeWidth="5"
            strokeLinecap="round"
            transform={`rotate(${angle} 100 100)`}
            className="
              transition-transform
              duration-700
              ease-out
            "
          />

          <circle
            cx="100"
            cy="100"
            r="9"
            fill={
              score ===
              null
                ? '#94a3b8'
                : passed
                  ? '#047857'
                  : '#c2410c'
            }
          />
        </svg>
      </div>


      <p
        className={`
          -mt-2
          text-5xl
          font-black
          tracking-tight

          ${
            score ===
            null
              ? 'text-slate-300'
              : passed
                ? 'text-emerald-600'
                : 'text-orange-500'
          }
        `}
      >
        {
          score ===
          null
            ? '--'
            : score
        }
        <span
          className="
            ml-0.5
            text-xl
          "
        >
          %
        </span>
      </p>


      <p
        className={`
          mt-1
          text-[11px]
          font-black

          ${
            passed
              ? 'text-emerald-600'
              : score ===
                  null
                ? 'text-slate-400'
                : 'text-orange-600'
          }
        `}
      >
        {
          score ===
          null
            ? '80%以上でPASS'
            : passed
              ? 'PASS!'
              : 'もう一度挑戦'
        }
      </p>
    </div>
  );
}


function ProfileSetup({
  fields,
  values,
  onChange,
  onReady,
}) {
  const ready =
    fields.every(field => field.required === false || String(values[field.id] ?? '').trim());


  return (
    <div
      className="
        mx-auto
        flex
        h-full
        max-w-3xl
        flex-col
        justify-center
        overflow-y-auto
        px-2
        py-4
      "
    >
      <p
        className="
          text-[10px]
          font-black
          tracking-[0.16em]
          text-violet-500
        "
      >
        MAKE IT YOUR OWN
      </p>

      <h3
        className="
          mt-2
          text-3xl
          font-black
          text-slate-950
        "
      >
        自分の英語にしてから練習しよう
      </h3>


      <div
        className="
          mt-6
          grid
          gap-4
        "
      >
        {
          fields.map(
            (
              field
            ) => (
              <label
                key={
                  field.id
                }
                className="
                  block
                "
              >
                <span
                  className="
                    text-xs
                    font-black
                    text-slate-500
                  "
                >
                  {
                    field.label
                  }
                </span>

                <input
                  value={
                    values[field.id] ??
                    ''
                  }
                  onChange={(event) =>
                    onChange(
                      field.id,
                      event.target.value
                    )
                  }
                  placeholder={
                    field.placeholder
                  }
                  className="
                    mt-1.5
                    w-full
                    rounded-2xl
                    border-2
                    border-slate-200
                    bg-white
                    px-4
                    py-3.5
                    text-base
                    font-black
                    text-slate-900
                    outline-none
                    transition
                    focus:border-violet-500
                  "
                />
              </label>
            )
          )
        }
      </div>


      <button
        type="button"
        disabled={
          !ready
        }
        onClick={
          onReady
        }
        className="
          mt-6
          self-center
          rounded-2xl
          bg-violet-600
          px-8
          py-4
          text-base
          font-black
          text-white
          shadow-lg
          transition
          hover:bg-violet-500
          disabled:bg-slate-200
          disabled:text-slate-400
          disabled:shadow-none
        "
      >
        この内容で練習する
      </button>
    </div>
  );
}


function SpeechCard({
  phrase,
  translation,
  kana,
  partnerPhrase,
  partnerJa,
  onEditProfile,
  showKana,
  onToggleKana,
  index,
  total,
  transcript,
  nameAutoCorrected,
  listening,
  error,
  score,
  onListen,
  onStart,
  onStop,
  onRetry,
}) {
  return (
    <div
      className="
        mx-auto
        flex
        h-full
        max-w-6xl
        flex-col
        justify-center
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-[10px]
              font-black
              tracking-[0.15em]
              text-violet-500
            "
          >
            PHRASE {
              index + 1
            }
            /{
              total
            }
          </p>

          <p
            className="
              mt-1
              text-xs
              font-bold
              text-slate-400
            "
          >
            80%以上で次のフレーズへ
          </p>
        </div>


        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          {
            kana && (
              <button
                type="button"
                onClick={
                  onToggleKana
                }
                className={`
                  rounded-xl
                  px-3
                  py-2.5
                  text-[11px]
                  font-black
                  transition

                  ${
                    showKana
                      ? `
                        bg-violet-600
                        text-white
                      `
                      : `
                        bg-violet-50
                        text-violet-700
                      `
                  }
                `}
              >
                カタカナ
              </button>
            )
          }


          {onEditProfile && (
            <button type="button" onClick={onEditProfile} className="rounded-xl bg-slate-100 px-3 py-2.5 text-[11px] font-black text-slate-700">
              プロフィール編集
            </button>
          )}
          <button
            type="button"
            onClick={
              onListen
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-blue-50
              px-3
              py-2.5
              text-[11px]
              font-black
              text-blue-700
            "
          >
            <Headphones
              size={16}
            />

            お手本
          </button>
        </div>
      </div>


      {partnerPhrase && (
        <div className="mt-3 rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-blue-800">🌍 相手の声 / PARTNER</span>
            <button type="button" onClick={() => speak(partnerPhrase)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-blue-700">
              ▶ 相手の声を聞く
            </button>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-900">{partnerPhrase}</p>
          {partnerJa && <p className="mt-1 text-xs text-slate-600">{partnerJa}</p>}
        </div>
      )}
      <div
        className="
          mt-4
          rounded-[30px]
          bg-slate-950
          px-6
          py-6
          text-center
          text-white
          shadow-xl
        "
      >
        <p
          className="
            text-3xl
            font-black
            leading-[1.35]
            md:text-5xl
          "
        >
          {
            phrase
          }
        </p>


        {
          translation && (
            <p
              className="
                mt-3
                text-base
                font-bold
                text-white/65
                md:text-lg
              "
            >
              {
                translation
              }
            </p>
          )
        }


        {
          showKana &&
          kana && (
            <p
              className="
                mt-2
                rounded-xl
                bg-white/10
                px-3
                py-2
                text-sm
                font-black
                tracking-wide
                text-amber-200
              "
            >
              {
                kana
              }
            </p>
          )
        }
      </div>


      <div
        className="
          mt-4
          flex
          items-center
          justify-center
          gap-3
        "
      >
        <button
          type="button"
          onClick={
            listening
              ? onStop
              : onStart
          }
          className={`
            inline-flex
            min-w-[190px]
            items-center
            justify-center
            gap-2
            rounded-full
            px-7
            py-4
            text-base
            font-black
            text-white
            shadow-lg
            transition
            hover:-translate-y-0.5

            ${
              listening
                ? `
                  bg-red-500
                  hover:bg-red-600
                `
                : `
                  bg-violet-600
                  hover:bg-violet-500
                `
            }
          `}
        >
          {
            listening
              ? (
                <Square
                  size={18}
                />
              )
              : (
                <Mic
                  size={20}
                />
              )
          }

          {
            listening
              ? '録音ストップ'
              : '話す'
          }
        </button>


        <button
          type="button"
          onClick={
            onRetry
          }
          className="
            flex
            h-13
            w-13
            items-center
            justify-center
            rounded-full
            border-2
            border-slate-200
            bg-white
            p-4
            text-slate-500
            shadow-sm
            transition
            hover:border-violet-300
            hover:text-violet-600
          "
          aria-label="やり直す"
          title="やり直す"
        >
          <RotateCcw
            size={18}
          />
        </button>
      </div>


      {
        listening && (
          <div
            className="
              mt-3
              flex
              items-center
              justify-center
              gap-2
              text-xs
              font-black
              text-red-600
            "
          >
            <span
              className="
                h-2.5
                w-2.5
                animate-pulse
                rounded-full
                bg-red-500
              "
            />

            録音中
          </div>
        )
      }


      <div
        className="
          mt-4
          grid
          gap-4
          lg:grid-cols-[minmax(0,1fr)_250px]
        "
      >
        <div
          className="
            min-h-[170px]
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-5
          "
        >
          <p
            className="
              text-[10px]
              font-black
              tracking-[0.14em]
              text-slate-400
            "
          >
            SPEECH TO TEXT
          </p>

          <p
            className="
              mt-4
              text-2xl
              font-black
              leading-9
              text-slate-900
              md:text-3xl
            "
          >
            {
              transcript ||
              '話した英語がここに表示されます'
            }
          </p>


          {
            nameAutoCorrected && (
              <div
                className="
                  mt-3
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-emerald-50
                  px-3
                  py-1.5
                  text-[11px]
                  font-black
                  text-emerald-700
                  ring-1
                  ring-emerald-200
                "
              >
                <span>
                  ✓
                </span>

                <span>
                  NAME AUTO-CORRECTED
                </span>

                <span
                  className="
                    font-bold
                    text-emerald-600
                  "
                >
                  入力した名前で判定
                </span>
              </div>
            )
          }
        </div>


        <AccuracyGauge
          score={
            score
          }
        />
      </div>


      {
        error && (
          <p
            className="
              mt-3
              rounded-xl
              bg-red-50
              px-3
              py-2
              text-xs
              font-bold
              text-red-700
            "
          >
            {
              error
            }
          </p>
        )
      }
    </div>
  );
}


function MissionComplete({
  average,
  onFinish,
  final = false,
}) {
  return (
    <div
      className="
        flex
        h-full
        items-center
        justify-center
        p-6
      "
    >
      <div
        className="
          w-full
          max-w-xl
          rounded-[34px]
          bg-white
          p-8
          text-center
          shadow-2xl
        "
      >
        <div
          className="
            text-6xl
          "
        >
          {
            final
              ? '🌏'
              : '🎉'
          }
        </div>

        <p
          className="
            mt-4
            text-[10px]
            font-black
            tracking-[0.16em]
            text-violet-500
          "
        >
          {
            final
              ? 'ONLINE EXCHANGE READY'
              : 'MISSION COMPLETE'
          }
        </p>

        <h3
          className="
            mt-2
            text-3xl
            font-black
            text-slate-950
          "
        >
          Average Accuracy
        </h3>

        <p
          className="
            mt-3
            text-7xl
            font-black
            text-emerald-600
          "
        >
          {
            average
          }%
        </p>

        <button
          type="button"
          onClick={
            onFinish
          }
          className="
            mt-6
            rounded-2xl
            bg-violet-600
            px-8
            py-4
            text-base
            font-black
            text-white
          "
        >
          {
            final
              ? 'GLOBAL COMMUNICATION PASSPORT'
              : 'Mission Clear'
          }
        </button>
      </div>
    </div>
  );
}


export default function CommunicationStage({
  mission,
  countryCode = 'rw',
  onClear,
}) {
  const fields =
    mission?.speech?.fields ??
    [];


  const storedProfile =
    useMemo(
      () =>
        ({
          ...load(`timepalette_language_profile_${countryCode}`, {}),
          ...load('timepalette_language_global_profile', {}),
        }),
      [
        countryCode,
      ]
    );


  const [
    values,
    setValues,
  ] = useState(
    () => ({
      ...storedProfile,
    })
  );


  const profileIsReady = fields.every(field =>
    field.required === false || String(storedProfile[field.id] ?? '').trim()
  );
  const [
    setupDone,
    setSetupDone,
  ] = useState(profileIsReady);


  const [
    step,
    setStep,
  ] = useState(
    0
  );


  const [
    scores,
    setScores,
  ] = useState(
    []
  );


  const [
    score,
    setScore,
  ] = useState(
    null
  );


  const [
    finished,
    setFinished,
  ] = useState(
    false
  );


  const [
    showKana,
    setShowKana,
  ] = useState(
    false
  );


  const [
    autoCheckPending,
    setAutoCheckPending,
  ] = useState(
    false
  );


  const [
    feedbackFx,
    setFeedbackFx,
  ] = useState(
    null
  );


  const feedbackTimerRef =
    useRef(
      null
    );


  const autoMissionClearRef =
    useRef(
      null
    );


  const speech =
    useSpeechRecognition();


  useEffect(
    () => {
      setStep(
        0
      );

      setScores(
        []
      );

      setScore(
        null
      );

      setFinished(
        false
      );

      setAutoCheckPending(
        false
      );

      speech.reset();


      setSetupDone(profileIsReady);
    },
    [
      mission?.id,
    ]
  );


  /* AUTO CLEAR TO NEXT LANGUAGE MISSION */
  useEffect(
    () => {
      if (
        !finished ||
        mission?.type ===
          'online-exchange-final' ||
        mission?.finalGoal
      ) {
        return;
      }


      if (
        autoMissionClearRef.current
      ) {
        window.clearTimeout(
          autoMissionClearRef.current
        );
      }


      autoMissionClearRef.current =
        window.setTimeout(
          () => {
            autoMissionClearRef.current =
              null;

            onClear?.(
              mission
            );
          },
          650
        );


      return () => {
        if (
          autoMissionClearRef.current
        ) {
          window.clearTimeout(
            autoMissionClearRef.current
          );

          autoMissionClearRef.current =
            null;
        }
      };
    },
    [
      finished,
      mission?.id,
      mission?.type,
      onClear,
    ]
  );


  const savedSchool =
    useMemo(
      () =>
        load(
          `timepalette_language_school_${countryCode}`,
          {}
        ),
      [
        countryCode,
      ]
    );


  const savedQuestions =
    useMemo(
      () =>
        load(
          `timepalette_language_questions_${countryCode}`,
          []
        ),
      [
        countryCode,
      ]
    );


  const allValues = {
    ...savedSchool,
    ...storedProfile,
    ...values,
    nameKana: values.nameKana || storedProfile.nameKana || values.name || '',
  };


  const baseSteps =
    mission?.speech?.steps ??
    [];


  const finalSteps =
    mission?.type ===
      'online-exchange-final'
      ? [
          {
            label:
              'INTRO',

            phrase:
              `Hi! My name is ${allValues.name || 'Aki'}. Nice to meet you.`,

            translation:
              `こんにちは！私の名前は${allValues.name || 'Aki'}です。よろしくお願いします。`,

            kana:
              `ハイ！マイ ネーム イズ ${allValues.name || 'Aki'}。ナイス トゥ ミート ユー。`,
          },
          {
            label:
              'ABOUT ME',

            phrase:
              `I like ${allValues.interest || 'music'}. My favorite food is ${allValues.food || 'curry'}.`,

            translation:
              `私は${allValues.interest || '音楽'}が好きです。好きな食べ物は${allValues.food || 'カレー'}です。`,

            kana:
              `アイ ライク ${allValues.interest || 'music'}。マイ フェイバリット フード イズ ${allValues.food || 'curry'}。`,
          },
          {
            label:
              'ASK',

            phrase:
              savedQuestions[0] ??
              'What do you usually do after school?',

            translation:
              '放課後は普段何をしますか？',

            kana:
              'ワット ドゥ ユー ユージュアリー ドゥ アフター スクール？',
          },
          {
            label:
              'MY SCHOOL',

            phrase:
              allValues.schoolPhrase ??
              'At my school, we have club activities after school.',

            translation:
              '私の学校では、放課後に部活動があります。',

            kana:
              'アット マイ スクール、ウィー ハブ クラブ アクティビティーズ アフター スクール。',
          },
          {
            label:
              'GOODBYE',

            phrase:
              'Thank you! It was nice talking with you.',

            translation:
              'ありがとう！お話しできて楽しかったです。',

            kana:
              'サンキュー！イット ワズ ナイス トーキング ウィズ ユー。',
          },
        ]
      : null;


  const steps =
    finalSteps ??
    baseSteps;


  const current =
    steps[step] ??
    {};


  const phrase =
    fill(
      current.phrase,
      allValues
    );


  const translation =
    fill(
      current.translation,
      allValues
    );


  const kana =
    fill(
      current.kana,
      allValues
    );
  const partnerPhrase = fill(current.partnerPhrase, allValues);
  const partnerJa = fill(current.partnerJa, allValues);


  /*
   * The learner's entered personal name is trusted.
   *
   * Example:
   * target     : Hi! My name is KOHEI.
   * recognition: hi my name is Cohen
   * displayed  : hi my name is KOHEI
   *
   * The fixed English words are still scored normally.
   */
  const protectedTranscript =
    protectPersonalNameInTranscript(
      phrase,
      speech.transcript,
      allValues.name
    );


  const nameAutoCorrected =
    Boolean(
      speech.transcript
    ) &&
    normalize(
      protectedTranscript
    ) !==
      normalize(
        speech.transcript
      );


  useEffect(
    () => {
      emit(
        mission.id,
        step,
        steps.length,
        score,
        scores.length,
        finished
          ? 'Mission complete'
          : `Phrase ${Math.min(step + 1,steps.length)} / ${steps.length}`
      );
    },
    [
      mission.id,
      step,
      steps.length,
      score,
      scores.length,
      finished,
    ]
  );


  const updateValue =
    (
      id,
      value
    ) => {
      setValues(
        (
          currentValues
        ) => ({
          ...currentValues,
          [id]:
            value,
        })
      );
    };


  const startPractice =
    () => {
      save(
        `timepalette_language_profile_${countryCode}`,
        {
          ...storedProfile,
          ...values,
        }
      );

      save('timepalette_language_global_profile', {
        ...storedProfile, ...values,
      });
      setSetupDone(
        true
      );
    };


  const showSpeechFeedback =
    (
      nextScore
    ) => {
      const passed =
        nextScore >=
        PASS_SCORE;


      if (
        feedbackTimerRef.current
      ) {
        window.clearTimeout(
          feedbackTimerRef.current
        );
      }


      setFeedbackFx({
        id:
          Date.now(),

        passed,

        score:
          nextScore,
      });


      playSpeechFeedbackSound(
        passed
      );


      feedbackTimerRef.current =
        window.setTimeout(
          () => {
            setFeedbackFx(
              null
            );

            feedbackTimerRef.current =
              null;
          },

          passed
            ? 1250
            : 900
        );
    };


  const finishSuccessfulAttempt =
    (
      nextScore
    ) => {
      const nextScores = [
        ...scores,
        nextScore,
      ];


      setScores(
        nextScores
      );


      window.setTimeout(
        () => {
          if (
            step >=
            steps.length - 1
          ) {
            if (
              mission?.speech
                ?.saveAsQuestions
            ) {
              save(
                `timepalette_language_questions_${countryCode}`,
                steps.map(
                  (
                    item
                  ) =>
                    fill(
                      item.phrase,
                      allValues
                    )
                )
              );
            }


            if (
              mission?.speech
                ?.saveSchool
            ) {
              save(
                `timepalette_language_school_${countryCode}`,
                {
                  schoolPhrase:
                    fill(
                      steps[0]?.phrase,
                      allValues
                    ),
                }
              );
            }


            setFinished(
              true
            );

            return;
          }


          setStep(
            (
              currentStep
            ) =>
              currentStep + 1
          );

          setScore(
            null
          );

          speech.reset();
        },
        1150
      );
    };


  const calculateAndShow =
    () => {
      const next =
        calculateAccuracy(
          phrase,
          protectedTranscript
        );


      setScore(
        next
      );


      showSpeechFeedback(
        next
      );


      if (
        next >=
        PASS_SCORE
      ) {
        playUiSound(
          'success'
        );

        finishSuccessfulAttempt(
          next
        );

        return;
      }


      playUiSound(
        'error'
      );
    };


  /*
   * User presses STOP.
   *
   * Important:
   * Do NOT clear autoCheckPending before the timer fires.
   * Otherwise React runs the effect cleanup and cancels
   * the Accuracy timer before calculation.
   *
   * If a final transcript arrives during this short wait,
   * this effect runs again and uses the newest transcript.
   */
  useEffect(
    () => {
      if (
        !autoCheckPending ||
        speech.listening
      ) {
        return;
      }


      const timer =
        window.setTimeout(
          () => {
            setAutoCheckPending(
              false
            );

            calculateAndShow();
          },
          180
        );


      return () =>
        window.clearTimeout(
          timer
        );
    },
    [
      autoCheckPending,
      speech.listening,
      protectedTranscript,
      phrase,
    ]
  );


  const startRecording =
    () => {
      setScore(
        null
      );

      setAutoCheckPending(
        false
      );

      speech.start();
    };


  const stopRecording =
    () => {
      setAutoCheckPending(
        true
      );

      speech.stop();
    };


  const retry =
    () => {
      setScore(
        null
      );

      setAutoCheckPending(
        false
      );

      speech.reset();
    };


  const average =
    scores.length > 0
      ? Math.round(
          scores.reduce(
            (
              total,
              value
            ) =>
              total + value,
            0
          ) /
          scores.length
        )
      : 0;


  if (
    finished
  ) {
    return (
      <MissionComplete
        average={
          average
        }
        final={
          mission?.type === 'online-exchange-final' || Boolean(mission?.finalGoal)
        }
        onFinish={() =>
          onClear(
            mission
          )
        }
      />
    );
  }


  if (
    !setupDone &&
    fields.length > 0
  ) {
    return (
      <section
        className="
          h-full
          min-h-0
          overflow-hidden
          rounded-[30px]
          border
          border-violet-100
          bg-gradient-to-br
          from-violet-50
          via-white
          to-blue-50
          p-6
          shadow-xl
        "
      >
        <ProfileSetup
          fields={
            fields
          }
          values={
            values
          }
          onChange={
            updateValue
          }
          onReady={
            startPractice
          }
        />
      </section>
    );
  }


  return (
    <section
      className="
        h-full
        min-h-0
        overflow-hidden
        rounded-[30px]
        border
        border-violet-100
        bg-gradient-to-br
        from-violet-50
        via-white
        to-blue-50
        p-5
        shadow-xl
        md:p-7
      "
    >
      <SpeechFeedbackFX
        feedback={
          feedbackFx
        }
      />


      <SpeechCard
        phrase={
          phrase
        }
        partnerPhrase={partnerPhrase}
        partnerJa={partnerJa}
        onEditProfile={fields.length ? () => setSetupDone(false) : null}
        translation={
          translation
        }
        kana={
          kana
        }
        showKana={
          showKana
        }
        onToggleKana={() =>
          setShowKana(
            (
              currentValue
            ) =>
              !currentValue
          )
        }
        index={
          step
        }
        total={
          steps.length
        }
        transcript={
          protectedTranscript
        }
        nameAutoCorrected={
          nameAutoCorrected
        }
        listening={
          speech.listening
        }
        error={
          speech.error
        }
        score={
          score
        }
        onListen={() =>
          speak(
            phrase
          )
        }
        onStart={
          startRecording
        }
        onStop={
          stopRecording
        }
        onRetry={
          retry
        }
      />
    </section>
  );
}
