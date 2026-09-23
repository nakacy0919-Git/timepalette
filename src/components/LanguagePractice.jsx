import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Mic,
  Volume2,
  Info,
  Languages,
  Play,
  Square,
  RefreshCw,
  Award,
  XCircle,
  SplitSquareHorizontal,
} from 'lucide-react';

const calculateAccuracy = (
  target,
  transcript,
  isPartialMode
) => {
  const cleanStr = (str) =>
    String(str ?? '')
      .replace(/[^\p{L}\p{N}]/gu, '')
      .toLowerCase();

  const s1 = cleanStr(target);
  const s2 = cleanStr(transcript);

  if (s1.length === 0) return 100;
  if (s2.length === 0) return 0;

  if (
    isPartialMode &&
    (s2.includes(s1) || s1.includes(s2))
  ) {
    return 100;
  }

  const matrix = Array.from(
    { length: s2.length + 1 },
    () => Array(s1.length + 1).fill(0)
  );

  for (
    let i = 0;
    i <= s1.length;
    i += 1
  ) {
    matrix[0][i] = i;
  }

  for (
    let j = 0;
    j <= s2.length;
    j += 1
  ) {
    matrix[j][0] = j;
  }

  for (
    let j = 1;
    j <= s2.length;
    j += 1
  ) {
    for (
      let i = 1;
      i <= s1.length;
      i += 1
    ) {
      const indicator =
        s1[i - 1] === s2[j - 1]
          ? 0
          : 1;

      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] +
          indicator
      );
    }
  }

  const distance =
    matrix[s2.length][s1.length];

  const maxLength = Math.max(
    s1.length,
    s2.length
  );

  let accuracy =
    ((maxLength - distance) /
      maxLength) *
    100;

  if (isPartialMode) {
    accuracy += 30;
  }

  return Math.min(
    100,
    Math.max(
      0,
      Math.round(accuracy)
    )
  );
};

const LANG_FALLBACK_MAP = {
  'prs-AF': 'fa-AF',
};

const optimizeLangCodeForSpeech = (
  code
) => {
  return (
    LANG_FALLBACK_MAP[code] ||
    code ||
    'en-US'
  );
};

const getSpeechRecognitionConfig = (
  language
) => ({
  mode:
    language?.speechRecognition
      ?.mode ||
    'standard',

  requestLangCode:
    language?.speechRecognition
      ?.requestLangCode ||
    language?.langCode ||
    'en-US',

  expectedScript:
    language?.speechRecognition
      ?.expectedScript ||
    language?.script ||
    'latin',

  scoringPolicy:
    language?.speechRecognition
      ?.scoringPolicy ||
    'normal',
});

const containsExpectedScript = (
  text,
  script
) => {
  if (!text) return false;

  switch (script) {
    case 'arabic':
      return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/u.test(
        text
      );

    case 'cyrillic':
      return /[\u0400-\u04FF]/u.test(
        text
      );

    case 'bengali':
      return /[\u0980-\u09FF]/u.test(
        text
      );

    case 'tibetan':
      return /[\u0F00-\u0FFF]/u.test(
        text
      );

    case 'khmer':
      return /[\u1780-\u17FF]/u.test(
        text
      );

    case 'thai':
      return /[\u0E00-\u0E7F]/u.test(
        text
      );

    case 'lao':
      return /[\u0E80-\u0EFF]/u.test(
        text
      );

    case 'myanmar':
      return /[\u1000-\u109F\uAA60-\uAA7F]/u.test(
        text
      );

    case 'hebrew':
      return /[\u0590-\u05FF]/u.test(
        text
      );

    case 'greek':
      return /[\u0370-\u03FF\u1F00-\u1FFF]/u.test(
        text
      );

    case 'georgian':
      return /[\u10A0-\u10FF\u2D00-\u2D2F]/u.test(
        text
      );

    case 'armenian':
      return /[\u0530-\u058F]/u.test(
        text
      );

    case 'devanagari':
      return /[\u0900-\u097F]/u.test(
        text
      );

    case 'gurmukhi':
      return /[\u0A00-\u0A7F]/u.test(
        text
      );

    case 'gujarati':
      return /[\u0A80-\u0AFF]/u.test(
        text
      );

    case 'odia':
      return /[\u0B00-\u0B7F]/u.test(
        text
      );

    case 'tamil':
      return /[\u0B80-\u0BFF]/u.test(
        text
      );

    case 'telugu':
      return /[\u0C00-\u0C7F]/u.test(
        text
      );

    case 'kannada':
      return /[\u0C80-\u0CFF]/u.test(
        text
      );

    case 'malayalam':
      return /[\u0D00-\u0D7F]/u.test(
        text
      );

    case 'sinhala':
      return /[\u0D80-\u0DFF]/u.test(
        text
      );

    case 'ethiopic':
      return /[\u1200-\u137F]/u.test(
        text
      );

    case 'hangul':
      return /[\u1100-\u11FF\u3130-\u318F\uAC00-\uD7AF]/u.test(
        text
      );

    case 'han':
      return /[\u3400-\u4DBF\u4E00-\u9FFF]/u.test(
        text
      );

    case 'japanese':
      return /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF]/u.test(
        text
      );

    case 'latin':
      return /[A-Za-zÀ-ÖØ-öø-ÿĀ-ž]/u.test(
        text
      );

    default:
      return true;
  }
};

const getLanguageStatus = (
  language
) => {
  const contentStatus =
    language?.contentStatus;

  const speechMode =
    language?.speechRecognition
      ?.mode;

  const challengeCount =
    language?.challenges?.length ||
    0;

  if (
    contentStatus ===
      'needs-native-review' ||
    challengeCount === 0
  ) {
    return {
      type: 'review',
      label: 'Coming Soon',
      icon: '🚧',
    };
  }

  if (
    contentStatus ===
      'experimental' ||
    speechMode === 'experimental'
  ) {
    return {
      type: 'experimental',
      label: 'Experimental',
      icon: '🧪',
    };
  }

  return {
    type: 'ready',
    label: 'Practice Ready',
    icon: '✅',
  };
};

const CircularProgress = ({
  value,
}) => {
  const radius = 60;

  const circumference =
    2 *
    Math.PI *
    radius;

  const strokeDashoffset =
    circumference -
    (value / 100) *
      circumference;

  const color =
    value >= 80
      ? 'text-green-500'
      : value >= 50
        ? 'text-orange-500'
        : 'text-red-500';

  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <svg className="transform -rotate-90 w-40 h-40">
        <circle
          cx="80"
          cy="80"
          r={radius}
          className="stroke-current text-slate-200"
          strokeWidth="12"
          fill="transparent"
        />

        <circle
          cx="80"
          cy="80"
          r={radius}
          className={`stroke-current ${color} transition-all duration-1000 ease-out`}
          strokeWidth="12"
          fill="transparent"
          strokeDasharray={
            circumference
          }
          strokeDashoffset={
            strokeDashoffset
          }
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute flex flex-col items-center justify-center animate-in zoom-in duration-500 delay-300">
        <span
          className={`text-4xl font-black ${color}`}
        >
          {value}%
        </span>

        <span className="text-xs font-bold text-slate-400">
          Accuracy
        </span>
      </div>
    </div>
  );
};

export default function LanguagePractice({
  countryCode = 'au',
  languageData,
}) {
  const [
    activeLangKey,
    setActiveLangKey,
  ] = useState(null);

  const [
    activeCategory,
    setActiveCategory,
  ] = useState(null);

  const [
    activeChallenge,
    setActiveChallenge,
  ] = useState(null);

  const [
    practiceMode,
    setPracticeMode,
  ] = useState('full');

  const [
    selectedChunkIndex,
    setSelectedChunkIndex,
  ] = useState(0);

  const [
    recordingState,
    setRecordingState,
  ] = useState('idle');

  const [
    transcript,
    setTranscript,
  ] = useState('');

  const [
    accuracy,
    setAccuracy,
  ] = useState(0);

  const [
    recognitionWarning,
    setRecognitionWarning,
  ] = useState('');

  const recognitionRef =
    useRef(null);

  const isRecordingRef =
    useRef(false);

  const transcriptRef =
    useRef('');

  const countryLangs =
    languageData?.[
      countryCode
    ];

  const langKeys =
    countryLangs
      ? Object.keys(
          countryLangs
        )
      : [];

  const effectiveLangKey =
    activeLangKey &&
    countryLangs?.[
      activeLangKey
    ]
      ? activeLangKey
      : langKeys[0] || null;

  const currentLanguage =
    effectiveLangKey
      ? countryLangs?.[
          effectiveLangKey
        ]
      : null;

  if (
    !countryLangs ||
    !currentLanguage
  ) {
    return null;
  }

  const languageStatus =
    getLanguageStatus(
      currentLanguage
    );

  const challenges =
    currentLanguage
      .challenges || [];

  const hasChallenges =
    challenges.length > 0;

  const categories = [
    ...new Set(
      challenges.map(
        (challenge) =>
          challenge.category
      )
    ),
  ];

  const effectiveCategory =
    categories.includes(
      activeCategory
    )
      ? activeCategory
      : categories[0] ||
        null;

  const activeChallenges =
    challenges.filter(
      (challenge) =>
        challenge.category ===
        effectiveCategory
    );

  const recognitionConfig =
    getSpeechRecognitionConfig(
      currentLanguage
    );

  const recognitionMode =
    recognitionConfig.mode;

  const canUseSpeechRecognition =
    recognitionMode !==
    'listen-only';

  const isExperimentalRecognition =
    recognitionMode ===
    'experimental';

  const playSound = (
    type
  ) => {
    const audio =
      new Audio();

    if (
      type === 'start'
    ) {
      audio.src =
        'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';
    }

    if (
      type === 'success'
    ) {
      audio.src =
        'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3';
    }

    if (
      type === 'fail'
    ) {
      audio.src =
        'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3';
    }

    audio.volume = 0.5;

    audio
      .play()
      .catch(
        (error) => {
          console.log(
            'Audio play failed:',
            error
          );
        }
      );
  };

  const resetAttempt =
    () => {
      setRecordingState(
        'idle'
      );

      setTranscript('');

      setAccuracy(0);

      setRecognitionWarning(
        ''
      );

      transcriptRef.current =
        '';

      isRecordingRef.current =
        false;
    };

  const handleListen = (
    phrase,
    challengeLangCode
  ) => {
    if (
      !(
        'speechSynthesis' in
        window
      )
    ) {
      setRecognitionWarning(
        'このブラウザでは音声読み上げ機能を利用できません。'
      );

      return;
    }

    const synthesisCode =
      currentLanguage
        ?.speechSynthesis
        ?.requestLangCode ||
      optimizeLangCodeForSpeech(
        challengeLangCode ||
          currentLanguage
            ?.langCode
      );

    const voices =
      window.speechSynthesis.getVoices();

    const shortCode =
      synthesisCode.split(
        '-'
      )[0];

    const hasVoice =
      voices.some(
        (voice) =>
          voice.lang
            .toLowerCase()
            .startsWith(
              shortCode.toLowerCase()
            )
      );

    if (
      !hasVoice &&
      voices.length > 0
    ) {
      setRecognitionWarning(
        `現在お使いの端末には「${currentLanguage.languageName}」に対応する自動音声が見つかりません。ルビを参考に発音してみましょう。`
      );

      return;
    }

    setRecognitionWarning(
      ''
    );

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        phrase
      );

    utterance.lang =
      synthesisCode;

    utterance.rate =
      0.85;

    window.speechSynthesis.speak(
      utterance
    );
  };

  const openChallenge = (
    challenge
  ) => {
    setActiveChallenge(
      challenge
    );

    setPracticeMode(
      'full'
    );

    setSelectedChunkIndex(
      0
    );

    resetAttempt();
  };

  const closeChallenge =
    () => {
      if (
        isRecordingRef.current &&
        recognitionRef.current
      ) {
        isRecordingRef.current =
          false;

        recognitionRef.current.stop();
      }

      recognitionRef.current =
        null;

      transcriptRef.current =
        '';

      setRecognitionWarning(
        ''
      );

      setActiveChallenge(
        null
      );
    };

  const getTargetText =
    () => {
      if (
        !activeChallenge
      ) {
        return {
          phrase: '',
          yomi: '',
        };
      }

      if (
        practiceMode ===
        'full'
      ) {
        return {
          phrase:
            activeChallenge.phrase,

          yomi:
            activeChallenge.yomi,
        };
      }

      const chunks =
        activeChallenge.phrase
          .split(' ')
          .filter(Boolean);

      const yomiChunks =
        activeChallenge.yomi
          .split(
            /[ \u3000]+/
          )
          .filter(Boolean);

      return {
        phrase:
          chunks[
            selectedChunkIndex
          ] || '',

        yomi:
          yomiChunks[
            selectedChunkIndex
          ] || '',
      };
    };

  const processResult = (
    finalTranscript
  ) => {
    const targetText =
      getTargetText();

    const safeTranscript =
      String(
        finalTranscript ||
          ''
      ).trim();

    if (
      !targetText.phrase
    ) {
      return;
    }

    const {
      expectedScript,
      scoringPolicy,
    } =
      recognitionConfig;

    if (
      recognitionMode ===
      'listen-only'
    ) {
      setAccuracy(0);

      setRecognitionWarning(
        'この言語では現在、自動音声認識による採点を行っていません。お手本音声を聞いて発音練習をしてください。'
      );

      setRecordingState(
        'result'
      );

      return;
    }

    if (
      !safeTranscript
    ) {
      setAccuracy(0);

      setRecognitionWarning(
        '音声を認識できませんでした。マイク設定を確認し、もう一度ゆっくり話してみてください。'
      );

      setRecordingState(
        'result'
      );

      return;
    }

    if (
      scoringPolicy ===
        'script-match-only' &&
      !containsExpectedScript(
        safeTranscript,
        expectedScript
      )
    ) {
      setAccuracy(0);

      setRecognitionWarning(
        `音声は認識されましたが、ブラウザが「${currentLanguage.languageName}」の文字として結果を返さなかったため、正確に採点できませんでした。`
      );

      setRecordingState(
        'result'
      );

      return;
    }

    setRecognitionWarning(
      ''
    );

    const resultAccuracy =
      calculateAccuracy(
        targetText.phrase,
        safeTranscript,
        practiceMode ===
          'partial'
      );

    setAccuracy(
      resultAccuracy
    );

    setRecordingState(
      'result'
    );

    if (
      resultAccuracy >= 80
    ) {
      playSound(
        'success'
      );
    } else {
      playSound(
        'fail'
      );
    }
  };

  const startRecording =
    () => {
      if (
        !canUseSpeechRecognition
      ) {
        setRecognitionWarning(
          'この言語では現在、自動音声認識による採点を行っていません。お手本音声を聞いて練習してください。'
        );

        return;
      }

      const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

      if (
        !SpeechRecognition
      ) {
        setRecognitionWarning(
          'このブラウザでは音声認識機能を利用できません。お手本音声を聞いて発音練習をしてください。'
        );

        setRecordingState(
          'idle'
        );

        isRecordingRef.current =
          false;

        return;
      }

      setRecognitionWarning(
        ''
      );

      setAccuracy(0);

      setTranscript('');

      transcriptRef.current =
        '';

      isRecordingRef.current =
        true;

      setRecordingState(
        'recording'
      );

      playSound(
        'start'
      );

      try {
        const recognition =
          new SpeechRecognition();

        recognitionRef.current =
          recognition;

        recognition.lang =
          recognitionConfig.requestLangCode;

        recognition.continuous =
          true;

        recognition.interimResults =
          true;

        recognition.onresult =
          (event) => {
            const currentTranscript =
              Array.from(
                event.results
              )
                .map(
                  (
                    result
                  ) =>
                    result[0].transcript.trim()
                )
                .filter(
                  Boolean
                )
                .join(
                  ' '
                );

            setTranscript(
              currentTranscript
            );

            transcriptRef.current =
              currentTranscript;
          };

        recognition.onerror =
          (event) => {
            console.error(
              'Speech error:',
              event.error
            );

            isRecordingRef.current =
              false;

            if (
              event.error ===
              'language-not-supported'
            ) {
              setRecognitionWarning(
                `このブラウザまたは端末では「${currentLanguage.languageName}」の音声認識を利用できません。お手本音声を聞いて練習してください。`
              );

              setRecordingState(
                'result'
              );

              return;
            }

            if (
              event.error ===
                'not-allowed' ||
              event.error ===
                'service-not-allowed'
            ) {
              setRecognitionWarning(
                'マイクの使用が許可されていません。ブラウザのマイク権限を確認してください。'
              );

              setRecordingState(
                'idle'
              );

              return;
            }

            if (
              event.error ===
              'audio-capture'
            ) {
              setRecognitionWarning(
                'マイクを利用できませんでした。端末のマイク設定を確認してください。'
              );

              setRecordingState(
                'idle'
              );

              return;
            }

            if (
              event.error ===
              'no-speech'
            ) {
              setRecognitionWarning(
                '音声を認識できませんでした。マイクに近づいて、もう一度ゆっくり話してみてください。'
              );

              setRecordingState(
                'idle'
              );

              return;
            }

            if (
              event.error ===
              'aborted'
            ) {
              setRecordingState(
                'idle'
              );

              return;
            }

            setRecognitionWarning(
              '音声認識でエラーが発生しました。少し待ってから、もう一度試してください。'
            );

            setRecordingState(
              'idle'
            );
          };

        recognition.onend =
          () => {
            if (
              isRecordingRef.current
            ) {
              isRecordingRef.current =
                false;

              setRecordingState(
                'processing'
              );

              setTimeout(
                () => {
                  processResult(
                    transcriptRef.current
                  );
                },
                500
              );
            }
          };

        recognition.start();
      } catch (error) {
        console.error(
          'Speech recognition start failed:',
          error
        );

        isRecordingRef.current =
          false;

        setRecordingState(
          'idle'
        );

        setRecognitionWarning(
          '音声認識を開始できませんでした。ブラウザまたはマイク設定を確認してください。'
        );
      }
    };

  const stopRecording =
    () => {
      if (
        !recognitionRef.current ||
        !isRecordingRef.current
      ) {
        return;
      }

      isRecordingRef.current =
        false;

      recognitionRef.current.stop();

      setRecordingState(
        'processing'
      );

      setTimeout(
        () => {
          processResult(
            transcriptRef.current
          );
        },
        500
      );
    };

  const changePracticeMode = (
    mode
  ) => {
    setPracticeMode(
      mode
    );

    setSelectedChunkIndex(
      0
    );

    resetAttempt();
  };

  const changeStep = (
    index
  ) => {
    setSelectedChunkIndex(
      index
    );

    resetAttempt();
  };

  return (
    <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mt-8">
      <div className="bg-slate-50 p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Languages className="text-blue-500" />
            言語・音読トレーニング
          </h2>

          {langKeys.length >
            0 && (
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
              <span className="text-sm font-bold text-slate-500 pl-3 pr-1">
                公用語 (
                {
                  langKeys.length
                }
                つ):
              </span>

              <div className="flex flex-wrap gap-1">
                {langKeys.map(
                  (
                    key
                  ) => {
                    const language =
                      countryLangs[
                        key
                      ];

                    const status =
                      getLanguageStatus(
                        language
                      );

                    const selected =
                      effectiveLangKey ===
                      key;

                    return (
                      <button
                        key={
                          key
                        }
                        onClick={() => {
                          setActiveLangKey(
                            key
                          );

                          setActiveCategory(
                            null
                          );
                        }}
                        className={`px-4 py-2.5 rounded-xl transition-all text-left ${
                          selected
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm">
                            {
                              language.languageName
                            }
                          </span>

                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              selected
                                ? 'bg-white/20 text-white'
                                : status.type ===
                                    'ready'
                                  ? 'bg-green-50 text-green-600'
                                  : status.type ===
                                      'experimental'
                                    ? 'bg-amber-50 text-amber-600'
                                    : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {
                              status.icon
                            }{' '}
                            {
                              status.label
                            }
                          </span>
                        </div>

                        {language.nativeName && (
                          <div
                            className={`text-xs mt-0.5 ${
                              selected
                                ? 'text-blue-100'
                                : 'text-slate-400'
                            }`}
                            dir={
                              language.direction ||
                              'ltr'
                            }
                          >
                            {
                              language.nativeName
                            }
                          </div>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        {categories.length >
          0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
            {categories.map(
              (
                category
              ) => (
                <button
                  key={
                    category
                  }
                  onClick={() =>
                    setActiveCategory(
                      category
                    )
                  }
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    effectiveCategory ===
                    category
                      ? 'bg-slate-800 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {
                    category
                  }
                </button>
              )
            )}
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-100/50 max-h-[500px] overflow-y-auto">
        {!hasChallenges ? (
          <div className="min-h-[260px] flex items-center justify-center">
            <div className="max-w-lg w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-sm">
              <div className="text-5xl mb-4">
                {languageStatus.icon ||
                  '🌍'}
              </div>

              <h3 className="text-2xl font-black text-slate-800 mb-2">
                {
                  currentLanguage.languageName
                }
              </h3>

              {currentLanguage.nativeName && (
                <p
                  className="text-xl font-bold text-slate-500 mb-4"
                  dir={
                    currentLanguage.direction ||
                    'ltr'
                  }
                >
                  {
                    currentLanguage.nativeName
                  }
                </p>
              )}

              <div className="inline-flex items-center px-4 py-2 rounded-full bg-amber-50 text-amber-700 font-black text-sm mb-4">
                🚧 Coming Soon
              </div>

              <p className="text-slate-600 font-medium leading-relaxed">
                この言語の練習教材は現在、ネイティブチェックを行っています。
              </p>

              <p className="text-sm text-slate-400 mt-2">
                正確で安心して使える教材として確認後、Listen
                & Speak
                練習を公開します。
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeChallenges.map(
              (
                challenge
              ) => {
                const isPartner =
                  challenge.speaker ===
                  'partner';

                const isRtl =
                  currentLanguage.direction ===
                  'rtl';

                return (
                  <div
                    key={
                      challenge.id
                    }
                    onClick={() =>
                      openChallenge(
                        challenge
                      )
                    }
                    className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 hover:-translate-y-1 transition-all cursor-pointer flex flex-col justify-between h-full"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span
                          className={`text-xs font-black px-3 py-1 rounded-full ${
                            isPartner
                              ? 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                              : 'bg-orange-50 text-orange-600 border border-orange-100'
                          }`}
                        >
                          {isPartner
                            ? '👂 相手のフレーズ'
                            : '🗣️ 自分のフレーズ'}
                        </span>

                        <div className="bg-slate-100 p-2 rounded-full text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          <Mic
                            size={
                              16
                            }
                          />
                        </div>
                      </div>

                      <p className="font-bold text-slate-600 text-sm mb-2">
                        {
                          challenge.meaning
                        }
                      </p>

                      <p
                        className="text-xl font-black text-slate-800 mb-2 leading-snug"
                        dir={
                          isRtl
                            ? 'rtl'
                            : 'ltr'
                        }
                      >
                        {
                          challenge.phrase
                        }
                      </p>
                    </div>

                    <p className="text-xs font-bold text-blue-500/80 bg-blue-50 px-2 py-1 rounded w-fit mt-2">
                      {
                        challenge.yomi
                      }
                    </p>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>

      {activeChallenge &&
        createPortal(
          <div className="fixed inset-0 z-[99999] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-200">
              <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2 font-bold">
                  <Mic className="text-blue-400" />
                  スピーキング・ミッション
                </div>

                <button
                  onClick={
                    closeChallenge
                  }
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <XCircle
                    size={
                      24
                    }
                  />
                </button>
              </div>

              <div className="p-6 text-center border-b border-gray-100">
                <div className="flex justify-center mb-6">
                  <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                    <button
                      onClick={() =>
                        changePracticeMode(
                          'full'
                        )
                      }
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                        practiceMode ===
                        'full'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      フルセンテンス
                    </button>

                    <button
                      onClick={() =>
                        changePracticeMode(
                          'partial'
                        )
                      }
                      className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                        practiceMode ===
                        'partial'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <SplitSquareHorizontal
                        size={
                          16
                        }
                      />
                      ステップ練習
                    </button>
                  </div>
                </div>

                {practiceMode ===
                'full' ? (
                  <>
                    <p className="text-sm font-bold text-blue-500 mb-2">
                      TARGET
                      PHRASE
                    </p>

                    <h3
                      className="text-3xl md:text-4xl font-black text-slate-800 mb-3"
                      dir={
                        currentLanguage.direction ||
                        'ltr'
                      }
                    >
                      {
                        activeChallenge.phrase
                      }
                    </h3>

                    <p className="text-lg font-bold text-slate-400 mb-1">
                      {
                        activeChallenge.yomi
                      }
                    </p>

                    <p className="text-base font-medium text-slate-600">
                      {
                        activeChallenge.meaning
                      }
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <p className="text-sm font-bold text-blue-500 mb-2">
                      STEP
                      PHRASE
                    </p>

                    <div
                      className="flex flex-wrap justify-center gap-2 mb-4"
                      dir={
                        currentLanguage.direction ||
                        'ltr'
                      }
                    >
                      {activeChallenge.phrase
                        .split(
                          ' '
                        )
                        .filter(
                          Boolean
                        )
                        .map(
                          (
                            word,
                            index
                          ) => (
                            <button
                              key={`${word}-${index}`}
                              onClick={() =>
                                changeStep(
                                  index
                                )
                              }
                              className={`px-4 py-3 rounded-2xl text-2xl font-black transition-all ${
                                selectedChunkIndex ===
                                index
                                  ? 'bg-blue-100 text-blue-600 border-2 border-blue-400 shadow-inner scale-110'
                                  : 'bg-slate-50 text-slate-600 border-2 border-transparent hover:bg-slate-100'
                              }`}
                            >
                              {
                                word
                              }
                            </button>
                          )
                        )}
                    </div>

                    <p className="text-xl font-bold text-slate-800 mb-1">
                      {activeChallenge.yomi
                        .split(
                          /[ \u3000]+/
                        )
                        .filter(
                          Boolean
                        )[
                        selectedChunkIndex
                      ] ||
                        '-'}
                    </p>

                    <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-lg mt-3 text-sm font-medium text-amber-700">
                      💡
                      1語だけの聞き取りはAIにとっても難しいため、点数だけでなく発音練習として活用しましょう。
                    </div>
                  </div>
                )}

                <button
                  onClick={() =>
                    handleListen(
                      getTargetText()
                        .phrase,
                      activeChallenge.langCode
                    )
                  }
                  className="mt-6 inline-flex items-center gap-2 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-bold text-sm transition-colors"
                >
                  <Volume2
                    size={
                      18
                    }
                  />
                  お手本を再生する
                </button>
              </div>

              <div className="p-8 bg-slate-50 flex flex-col items-center justify-center min-h-[250px]">
                {isExperimentalRecognition && (
                  <div className="w-full max-w-lg mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-sm font-bold text-center">
                    🧪
                    この言語の音声認識は、ブラウザや端末によって動作が異なる場合があります。
                  </div>
                )}

                {recognitionWarning && (
                  <div className="w-full max-w-lg mb-5 px-5 py-4 bg-orange-50 border border-orange-200 rounded-2xl text-orange-800 text-sm font-bold leading-relaxed text-center">
                    ⚠️{' '}
                    {
                      recognitionWarning
                    }
                  </div>
                )}

                {recordingState ===
                  'idle' && (
                  <div className="flex flex-col items-center animate-in fade-in">
                    <p className="text-slate-500 font-bold mb-6">
                      準備ができたら開始ボタンを押してください
                    </p>

                    <button
                      onClick={
                        startRecording
                      }
                      className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-black text-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
                    >
                      <Play
                        size={
                          24
                        }
                        fill="currentColor"
                      />
                      録音スタート
                    </button>
                  </div>
                )}

                {recordingState ===
                  'recording' && (
                  <div className="flex flex-col items-center w-full animate-in fade-in">
                    <div className="flex items-center gap-2 text-red-500 font-bold animate-pulse mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      録音中...
                      はっきりと発音してください
                    </div>

                    <div
                      className="w-full max-w-md bg-white p-4 rounded-xl border-2 border-blue-200 min-h-[60px] text-center text-lg font-bold text-slate-700 mb-6 shadow-inner"
                      dir={
                        currentLanguage.direction ||
                        'ltr'
                      }
                    >
                      {transcript ||
                        '...'}
                    </div>

                    <button
                      onClick={
                        stopRecording
                      }
                      className="flex items-center gap-3 px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-full font-black text-xl shadow-lg transition-all hover:scale-105 active:scale-95"
                    >
                      <Square
                        size={
                          24
                        }
                        fill="currentColor"
                      />
                      録音ストップ
                    </button>
                  </div>
                )}

                {recordingState ===
                  'processing' && (
                  <div className="flex flex-col items-center animate-in fade-in">
                    <RefreshCw
                      size={
                        40
                      }
                      className="text-blue-500 animate-spin mb-4"
                    />

                    <p className="font-bold text-slate-600 text-lg">
                      AIが発音を分析中...
                    </p>
                  </div>
                )}

                {recordingState ===
                  'result' && (
                  <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-4 duration-500">
                    {!recognitionWarning && (
                      <CircularProgress
                        value={
                          accuracy
                        }
                      />
                    )}

                    <div className="mt-6 text-center">
                      {!recognitionWarning && (
                        <>
                          {accuracy >=
                          80 ? (
                            <p className="text-2xl font-black text-green-500 flex items-center justify-center gap-2 mb-2">
                              <Award
                                size={
                                  28
                                }
                              />
                              Excellent!!
                            </p>
                          ) : accuracy >=
                            50 ? (
                            <p className="text-2xl font-black text-orange-500 mb-2">
                              Good
                              try!
                            </p>
                          ) : (
                            <p className="text-2xl font-black text-red-500 mb-2">
                              Let's
                              try
                              again!
                            </p>
                          )}
                        </>
                      )}

                      <div className="bg-white p-4 rounded-xl border border-gray-200 mt-4 max-w-md w-full mx-auto">
                        <p className="text-xs font-bold text-slate-400 text-left">
                          あなたの発音:
                        </p>

                        <p
                          className="text-lg font-bold text-slate-700"
                          dir={
                            currentLanguage.direction ||
                            'ltr'
                          }
                        >
                          {transcript ||
                            '(聞き取れませんでした)'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={
                        resetAttempt
                      }
                      className="mt-6 px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full font-bold transition-colors"
                    >
                      もう一度挑戦する
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 p-4 border-t border-amber-100 flex items-start gap-3 text-amber-800 text-sm font-medium">
                <Info
                  size={
                    20
                  }
                  className="shrink-0 text-amber-500"
                />

                <p>
                  {
                    activeChallenge.culturalNote
                  }
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}