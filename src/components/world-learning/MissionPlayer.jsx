import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Volume2,
  X,
} from 'lucide-react';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import TimeMissionGame from './TimeMissionGame';
import PlaceMissionGame from './PlaceMissionGame';
import LanguageMissionGame from './LanguageMissionGame';
import LifeCultureMissionGame from './LifeCultureMissionGame';
import JapanConnectionMissionGame from './JapanConnectionMissionGame';
import ThinkConnectMissionGame from './ThinkConnectMissionGame';

const TIME_MISSION_TYPES =
  new Set([
    'live-time-compare',
    'time-dial',
    'daypart-match',
    'schedule-builder',
  ]);

const PLACE_MISSION_TYPES =
  new Set([
    'map-tap',
    'city-map',
  ]);

const LANGUAGE_MISSION_TYPES =
  new Set([
    'matching',
    'speaking',
    'speaking-template',
    'speaking-creator',
  ]);

const LIFE_CULTURE_MISSION_TYPES =
  new Set([
    'region-sort',
  ]);

const JAPAN_CONNECTION_MISSION_TYPES =
  new Set([
    'sorting',
    'connection-chain',
    'daily-life-hunt',
    'quiz-creator',
  ]);

const THINK_CONNECT_MISSION_TYPES =
  new Set([
    'compare-builder',
    'evidence-check',
    'question-creator',
    'creator-capstone',
  ]);

const hasChoiceChallenge = (
  mission
) =>
  Array.isArray(
    mission?.challenge?.choices
  ) &&
  typeof mission?.challenge
    ?.correctIndex ===
    'number';

const isTimeMission = (
  mission
) =>
  TIME_MISSION_TYPES.has(
    mission?.type
  );

const isPlaceMission = (
  mission
) =>
  PLACE_MISSION_TYPES.has(
    mission?.type
  );

const isLanguageMission = (
  mission
) =>
  LANGUAGE_MISSION_TYPES.has(
    mission?.type
  );

const isLifeCultureMission = (
  mission
) =>
  LIFE_CULTURE_MISSION_TYPES.has(
    mission?.type
  );

const isJapanConnectionMission = (
  mission
) =>
  JAPAN_CONNECTION_MISSION_TYPES.has(
    mission?.type
  );

const isThinkConnectMission = (
  mission
) =>
  THINK_CONNECT_MISSION_TYPES.has(
    mission?.type
  );

export default function MissionPlayer({
  mission,
  domain,
  alreadyCompleted,
  onClose,
  onComplete,
}) {

  const scrollContainerRef =
    useRef(null);

  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState(null);

  const [
    result,
    setResult,
  ] = useState(null);

  const choicePlayable =
    hasChoiceChallenge(
      mission
    );

  const timePlayable =
    isTimeMission(
      mission
    );

  const placePlayable =
    isPlaceMission(
      mission
    );

  const languagePlayable =
    isLanguageMission(
      mission
    );

  const lifeCulturePlayable =
    isLifeCultureMission(
      mission
    );

  const japanConnectionPlayable =
  isJapanConnectionMission(
    mission
  );

  const thinkConnectPlayable =
  isThinkConnectMission(
    mission
  );

  useEffect(() => {
    const container =
      scrollContainerRef.current;

    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [mission.id]);

  const modalWidthClass =
    placePlayable
      ? 'max-w-5xl'
      : 'max-w-2xl';

  const isListening =
    mission.type ===
    'listen-choice';

  const playAudio = () => {
    const text =
      mission?.challenge
        ?.audioText;

    if (
      !text ||
      !(
        'speechSynthesis' in
        window
      )
    ) {
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );

    utterance.lang =
      mission?.challenge
        ?.langCode ||
      'en-AU';

    utterance.rate =
      0.85;

    window.speechSynthesis.speak(
      utterance
    );
  };

  const checkAnswer = () => {
    if (
      selectedIndex === null
    ) {
      return;
    }

    const correct =
      selectedIndex ===
      mission.challenge
        .correctIndex;

    if (correct) {
      setResult(
        'correct'
      );

      onComplete(
        mission
      );

      return;
    }

    setResult(
      'wrong'
    );
  };

  const retry = () => {
    setSelectedIndex(
      null
    );

    setResult(
      null
    );
  };

  const levelLabel =
    mission.level >= 4
      ? 'WORLD MASTER'
      : mission.level === 3
        ? 'CHALLENGER'
        : mission.level === 2
          ? 'DISCOVERY'
          : 'EXPLORER';

  return (
    <div className="fixed inset-0 z-[100000] flex items-start justify-center overflow-hidden bg-slate-950/85 p-2 backdrop-blur-sm md:items-center md:p-4">

  <div
    ref={scrollContainerRef}
    className={`max-h-[96dvh] w-full ${modalWidthClass} overflow-y-auto bg-white shadow-2xl md:max-h-[92vh] md:rounded-[28px]`}
  >

        <div className="relative bg-slate-900 px-6 py-6 text-white md:px-8">
          <button
            onClick={
              onClose
            }
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
            aria-label="Close mission"
          >
            <X size={22} />
          </button>

          <div className="pr-12">
            <div className="mb-3 flex flex-wrap items-center gap-2">

              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">
                {domain?.icon}{' '}
                {
                  domain?.labelJa
                }
              </span>

              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-xs font-black text-blue-200">
                LEVEL{' '}
                {
                  mission.level
                }
              </span>

              <span className="rounded-full bg-amber-400/20 px-3 py-1 text-xs font-black text-amber-200">
                {
                  mission.points
                }{' '}
                WP
              </span>

            </div>

            <p className="mb-2 text-xs font-black tracking-[0.18em] text-blue-300">
              {
                levelLabel
              }
            </p>

            <h2 className="text-2xl font-black leading-tight md:text-3xl">
              {
                mission.title
              }
            </h2>
          </div>
        </div>

        <div className="p-6 md:p-8">

          {alreadyCompleted && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">

              <CheckCircle2
                size={22}
                className="shrink-0"
              />

              <div>
                <p className="font-black">
                  Mission Clear!
                </p>

                <p className="text-sm font-bold opacity-80">
                  復習は何度でもできます。WPは初回クリア時だけ加算されます。
                </p>
              </div>
            </div>
          )}

          <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">

            <p className="mb-2 text-xs font-black tracking-[0.15em] text-slate-400">
              MISSION
            </p>

            <p className="text-lg font-black leading-relaxed text-slate-800 md:text-xl">
              {
                mission.prompt
              }
            </p>

          </div>

          {timePlayable ? (
            <TimeMissionGame
              mission={
                mission
              }
              onComplete={
                onComplete
              }
              alreadyCompleted={
                alreadyCompleted
              }
            />
          ) : placePlayable ? (
            <PlaceMissionGame
              mission={
                mission
              }
              onComplete={
                onComplete
              }
              alreadyCompleted={
                alreadyCompleted
              }
            />
          ) : languagePlayable ? (
            <LanguageMissionGame
              mission={
                mission
              }
              onComplete={
                onComplete
              }
              alreadyCompleted={
                alreadyCompleted
              }
            />
          ) : lifeCulturePlayable ? (
  <LifeCultureMissionGame
    mission={mission}
    onComplete={onComplete}
    alreadyCompleted={alreadyCompleted}
  />
) : japanConnectionPlayable ? (
  <JapanConnectionMissionGame
    mission={mission}
    onComplete={onComplete}
    alreadyCompleted={alreadyCompleted}
  />
) : thinkConnectPlayable ? (
  <ThinkConnectMissionGame
    mission={mission}
    onComplete={onComplete}
    alreadyCompleted={alreadyCompleted}
  />
) : !choicePlayable ? (
            <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">

              <div className="mb-4 text-5xl">
                🚧
              </div>

              <h3 className="mb-2 text-xl font-black text-slate-700">
                Interactive Mission
              </h3>

              <p className="font-bold leading-relaxed text-slate-500">
                このMissionは
                「
                {
                  mission.type
                }
                」
                専用の操作画面を使います。
              </p>

              <p className="mt-3 text-sm text-slate-400">
                ボタンを押しただけではクリアにはしません。
                実際に課題を達成できる画面を順番に実装します。
              </p>

              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-200 px-4 py-2 text-sm font-black text-slate-600">
                COMING NEXT
              </div>
            </div>
          ) : (
            <>
              {isListening && (
                <div className="mb-6 flex justify-center">

                  <button
                    onClick={
                      playAudio
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 font-black text-white shadow-md transition-all hover:scale-105 hover:bg-blue-700"
                  >
                    <Volume2
                      size={20}
                    />
                    音声を聞く
                  </button>

                </div>
              )}

              <div className="space-y-3">

                {mission.challenge.choices.map(
                  (
                    choice,
                    index
                  ) => {
                    const selected =
                      selectedIndex ===
                      index;

                    const isCorrectChoice =
                      result ===
                        'correct' &&
                      index ===
                        mission.challenge
                          .correctIndex;

                    const isWrongChoice =
                      result ===
                        'wrong' &&
                      selected;

                    let choiceClass =
                      'border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50';

                    if (
                      selected
                    ) {
                      choiceClass =
                        'border-blue-500 bg-blue-50';
                    }

                    if (
                      isCorrectChoice
                    ) {
                      choiceClass =
                        'border-emerald-500 bg-emerald-50';
                    }

                    if (
                      isWrongChoice
                    ) {
                      choiceClass =
                        'border-red-400 bg-red-50';
                    }

                    return (
                      <button
                        key={`${mission.id}-${index}`}
                        disabled={
                          result ===
                          'correct'
                        }
                        onClick={() => {
                          setSelectedIndex(
                            index
                          );

                          if (
                            result ===
                            'wrong'
                          ) {
                            setResult(
                              null
                            );
                          }
                        }}
                        className={`w-full rounded-2xl border-2 p-4 text-left transition-all md:p-5 ${choiceClass}`}
                      >
                        <div className="flex items-center gap-4">

                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-black text-slate-500">
                            {[
                              'A',
                              'B',
                              'C',
                              'D',
                            ][
                              index
                            ] ||
                              index +
                                1}
                          </span>

                          <span className="font-black text-slate-700">
                            {
                              choice
                            }
                          </span>

                        </div>
                      </button>
                    );
                  }
                )}

              </div>

              {result ===
                'wrong' && (
                <div className="mt-5 flex items-start gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-700">

                  <AlertCircle
                    size={22}
                    className="mt-0.5 shrink-0"
                  />

                  <div>
                    <p className="font-black">
                      もう一度考えてみよう！
                    </p>

                    <p className="mt-1 text-sm font-bold opacity-80">
                      答えはまだ表示しません。
                      別の選択肢を試してみましょう。
                    </p>
                  </div>

                </div>
              )}

              {result ===
                'correct' && (
                <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">

                  <div className="mb-3 flex items-center gap-3 text-emerald-700">

                    <CheckCircle2
                      size={26}
                    />

                    <p className="text-xl font-black">
                      Mission Clear!
                    </p>

                  </div>
                                  <div className="mb-4 border-l-4 border-emerald-500 bg-white px-4 py-3">

                    <p className="text-[10px] font-black tracking-[0.16em] text-emerald-600">
                      CORRECT ANSWER
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-900">
                      {
                        mission.challenge
                          .choices[
                          mission.challenge
                            .correctIndex
                        ]
                      }
                    </p>

                  </div>
                  <p className="font-bold leading-relaxed text-slate-700">
                    {
                      mission.explanation
                    }
                  </p>

                  <div className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 font-black text-white">
                    {alreadyCompleted
                      ? 'REVIEW COMPLETE'
                      : `+${mission.points} WP`}
                  </div>

                </div>
              )}

              {result !==
                'correct' && (
                <button
                  disabled={
                    selectedIndex ===
                    null
                  }
                  onClick={
                    checkAnswer
                  }
                  className="mt-7 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
                >
                  答えをチェック
                </button>
              )}

              {result ===
                'wrong' && (
                <button
                  onClick={
                    retry
                  }
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-black text-slate-500 hover:bg-slate-100"
                >
                  <RotateCcw
                    size={18}
                  />
                  最初からやり直す
                </button>
              )}
            </>
          )}
                  {alreadyCompleted && (
            <div className="mt-7 border-t border-slate-200 pt-6">

              <p className="text-[10px] font-black tracking-[0.18em] text-slate-400">
                REMEMBER THIS
              </p>

              <div className="mt-3 border-l-4 border-blue-500 bg-blue-50 px-5 py-4">

                <p className="font-bold leading-7 text-slate-700">
                  {
                    mission.explanation
                  }
                </p>

              </div>

            </div>
          )}
          <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-5">

            <span className="text-xs font-bold text-slate-400">
              Mission ID:{' '}
              {
                mission.id
              }
            </span>

            <button
              onClick={
                onClose
              }
              className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-200"
            >
              Mission一覧へ
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}