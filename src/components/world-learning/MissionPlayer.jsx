import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  List,
  RotateCcw,
  Volume2,
  X,
} from 'lucide-react';

import {
  createPortal,
} from 'react-dom';

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
import MissionSuccessCelebration from './MissionSuccessCelebration';
import GlobalChallengeMissionGame from './GlobalChallengeMissionGame';
import SourceQuestMissionGame from './SourceQuestMissionGame';


const TIME_MISSION_TYPES = new Set([
  'live-time-compare',
  'time-dial',
  'daypart-match',
  'schedule-builder',
]);

const PLACE_MISSION_TYPES = new Set([
  'map-tap',
  'city-map',
]);

const LANGUAGE_MISSION_TYPES = new Set([
  'matching',
  'speaking',
  'speaking-template',
  'speaking-creator',
]);

const LIFE_CULTURE_MISSION_TYPES = new Set([
  'region-sort',
]);

const JAPAN_CONNECTION_MISSION_TYPES = new Set([
  'sorting',
  'connection-chain',
  'daily-life-hunt',
  'quiz-creator',
]);

const THINK_CONNECT_MISSION_TYPES = new Set([
  'compare-builder',
  'evidence-check',
  'question-creator',
  'creator-capstone',
]);


const hasChoiceChallenge = (mission) =>
  Array.isArray(
    mission?.challenge?.choices
  ) &&
  typeof mission?.challenge?.correctIndex ===
    'number';


const getMissionNumber = (missionId) => {
  const match = String(
    missionId ?? ''
  ).match(/-m(\d+)$/i);

  if (!match) {
    return 'MISSION';
  }

  return `M${String(
    match[1]
  ).padStart(2, '0')}`;
};


const normalizeChoice = (
  choice,
  index
) => {
  if (
    choice &&
    typeof choice === 'object' &&
    !Array.isArray(choice)
  ) {
    return {
      id:
        choice.id ??
        `choice-${index}`,
      label:
        choice.label ??
        choice.text ??
        choice.caption ??
        '',
      caption:
        choice.caption ??
        '',
      image:
        choice.image ??
        choice.imageUrl ??
        null,
      emoji:
        choice.emoji ??
        null,
      alt:
        choice.alt ??
        choice.label ??
        choice.text ??
        `Choice ${index + 1}`,
    };
  }

  return {
    id: `choice-${index}`,
    label: String(
      choice ?? ''
    ),
    caption: '',
    image: null,
    emoji: null,
    alt: String(
      choice ?? `Choice ${index + 1}`
    ),
  };
};


export default function MissionPlayer({
  mission,
  domain,
  alreadyCompleted,
  onClose,
  onComplete,

  // UI v2: optional navigation props.
  // Existing callers continue to work even if these are omitted.
  nextMission = null,
  previousMission = null,
  missionPosition = null,
  totalMissions = null,
  onNextMission = null,
  onPreviousMission = null,
  onBackToList = null,
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

  const [
    celebration,
    setCelebration,
  ] = useState(null);

  const completedThisSessionRef =
    useRef(alreadyCompleted);


  const choicePlayable =
    hasChoiceChallenge(mission);

  const timePlayable =
    TIME_MISSION_TYPES.has(
      mission?.type
    );

  const placePlayable =
    PLACE_MISSION_TYPES.has(
      mission?.type
    );

  const languagePlayable =
    LANGUAGE_MISSION_TYPES.has(
      mission?.type
    );

  const lifeCulturePlayable =
    LIFE_CULTURE_MISSION_TYPES.has(
      mission?.type
    );

  const japanConnectionPlayable =
    JAPAN_CONNECTION_MISSION_TYPES.has(
      mission?.type
    );

  const thinkConnectPlayable =
    THINK_CONNECT_MISSION_TYPES.has(
      mission?.type
    );

  const globalChallengePlayable =
    mission?.type ===
    'global-challenge';

  const sourceQuestPlayable =
    mission?.type ===
    'source-quest';

  const specializedPlayable =
    sourceQuestPlayable ||
    globalChallengePlayable ||
    timePlayable ||
    placePlayable ||
    languagePlayable ||
    lifeCulturePlayable ||
    japanConnectionPlayable ||
    thinkConnectPlayable;


  useEffect(() => {
    setSelectedIndex(null);
    setResult(null);
    setCelebration(null);

    completedThisSessionRef.current =
      alreadyCompleted;

    const container =
      scrollContainerRef.current;

    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'auto',
      });
    }
  }, [
    mission.id,
    alreadyCompleted,
  ]);


  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      'hidden';

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, []);


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
      'en-US';

    utterance.rate =
      0.85;

    window.speechSynthesis.speak(
      utterance
    );
  };


  const handleMissionComplete = (
    completedMission
  ) => {
    const firstClear =
      !completedThisSessionRef
        .current;

    completedThisSessionRef
      .current = true;

    setCelebration({
      firstClear,

      points:
        Number(
          completedMission
            ?.points ??
          mission.points ??
          0
        ),

      title:
        completedMission
          ?.title ??
        mission.title,
    });

    onComplete(
      completedMission
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

      handleMissionComplete(
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


  const goBackToList = () => {
    setCelebration(
      null
    );

    if (onBackToList) {
      onBackToList();
      return;
    }

    onClose();
  };


  const goNext = () => {
    setCelebration(
      null
    );

    if (
      nextMission &&
      onNextMission
    ) {
      onNextMission(
        nextMission
      );
      return;
    }

    goBackToList();
  };


  const goPrevious = () => {
    if (
      previousMission &&
      onPreviousMission
    ) {
      onPreviousMission(
        previousMission
      );
    }
  };


  const levelLabel =
    mission.learningLevelLabel ??
    (
      mission.level >= 4
        ? 'WORLD MASTER'
        : mission.level === 3
          ? 'CHALLENGER'
          : mission.level === 2
            ? 'DISCOVERY'
            : 'EXPLORER'
    );


  const progressLabel =
    missionPosition &&
    totalMissions
      ? `${missionPosition} / ${totalMissions}`
      : getMissionNumber(
          mission.id
        );


  const renderGame = () => {
    if (
      sourceQuestPlayable
    ) {
      return (
        <SourceQuestMissionGame
          mission={mission}
          onComplete={
            handleMissionComplete
          }
          alreadyCompleted={
            alreadyCompleted
          }
        />
      );
    }

    if (
      globalChallengePlayable
    ) {
      return (
        <GlobalChallengeMissionGame
          mission={mission}
          onComplete={
            handleMissionComplete
          }
          alreadyCompleted={
            alreadyCompleted
          }
        />
      );
    }

    if (timePlayable) {
      return (
        <TimeMissionGame
          mission={mission}
          onComplete={
            handleMissionComplete
          }
          alreadyCompleted={
            alreadyCompleted
          }
        />
      );
    }

    if (placePlayable) {
      return (
        <PlaceMissionGame
          mission={mission}
          onComplete={
            handleMissionComplete
          }
          alreadyCompleted={
            alreadyCompleted
          }
        />
      );
    }

    if (
      languagePlayable
    ) {
      return (
        <LanguageMissionGame
          mission={mission}
          onComplete={
            handleMissionComplete
          }
          alreadyCompleted={
            alreadyCompleted
          }
        />
      );
    }

    if (
      lifeCulturePlayable
    ) {
      return (
        <LifeCultureMissionGame
          mission={mission}
          onComplete={
            handleMissionComplete
          }
          alreadyCompleted={
            alreadyCompleted
          }
        />
      );
    }

    if (
      japanConnectionPlayable
    ) {
      return (
        <JapanConnectionMissionGame
          mission={mission}
          onComplete={
            handleMissionComplete
          }
          alreadyCompleted={
            alreadyCompleted
          }
        />
      );
    }

    if (
      thinkConnectPlayable
    ) {
      return (
        <ThinkConnectMissionGame
          mission={mission}
          onComplete={
            handleMissionComplete
          }
          alreadyCompleted={
            alreadyCompleted
          }
        />
      );
    }

    if (!choicePlayable) {
      return (
        <div className="
          flex
          min-h-[340px]
          items-center
          justify-center
          rounded-[28px]
          border-2
          border-dashed
          border-slate-300
          bg-slate-50
          p-8
          text-center
        ">
          <div>
            <div className="text-6xl">
              🚧
            </div>

            <h3 className="
              mt-5
              text-xl
              font-black
              text-slate-800
            ">
              Interactive Mission
            </h3>

            <p className="
              mx-auto
              mt-2
              max-w-lg
              font-bold
              leading-7
              text-slate-500
            ">
              「{mission.type}」
              専用の操作画面を使うMissionです。
            </p>
          </div>
        </div>
      );
    }


    const choices =
      mission.challenge
        .choices
        .map(
          normalizeChoice
        );

    const hasVisualChoice =
      choices.some(
        (choice) =>
          choice.image ||
          choice.emoji
      );

    return (
      <div>
        {isListening && (
          <div className="
            mb-5
            flex
            justify-center
          ">
            <button
              type="button"
              onClick={playAudio}
              className="
                inline-flex
                items-center
                gap-2
                rounded-full
                bg-blue-600
                px-6
                py-3
                font-black
                text-white
                shadow-md
                transition
                hover:-translate-y-0.5
                hover:bg-blue-700
              "
            >
              <Volume2
                size={20}
              />
              音声を聞く
            </button>
          </div>
        )}


        <div
          className={
            hasVisualChoice
              ? 'grid grid-cols-2 gap-3 md:gap-4'
              : 'grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4'
          }
        >
          {choices.map(
            (
              choice,
              index
            ) => {
              const selected =
                selectedIndex ===
                index;

              const correct =
                result ===
                  'correct' &&
                index ===
                  mission.challenge
                    .correctIndex;

              const wrong =
                result ===
                  'wrong' &&
                selected;

              let choiceClass =
                'border-slate-200 bg-white hover:-translate-y-1 hover:border-blue-400 hover:shadow-lg';

              if (selected) {
                choiceClass =
                  'border-blue-500 bg-blue-50 shadow-md ring-4 ring-blue-100';
              }

              if (correct) {
                choiceClass =
                  'border-emerald-500 bg-emerald-50 shadow-md ring-4 ring-emerald-100';
              }

              if (wrong) {
                choiceClass =
                  'border-red-400 bg-red-50 ring-4 ring-red-100';
              }

              return (
                <button
                  key={
                    choice.id
                  }
                  type="button"
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
                  className={`
                    group
                    relative
                    min-h-[112px]
                    overflow-hidden
                    rounded-[24px]
                    border-2
                    p-4
                    text-left
                    transition-all
                    duration-200
                    md:min-h-[138px]
                    md:p-5
                    ${choiceClass}
                  `}
                >
                  <div className="
                    flex
                    h-full
                    gap-4
                  ">
                    <span className="
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-slate-100
                      text-sm
                      font-black
                      text-slate-500
                    ">
                      {[
                        'A',
                        'B',
                        'C',
                        'D',
                      ][index] ??
                        index + 1}
                    </span>

                    <div className="
                      flex
                      min-w-0
                      flex-1
                      flex-col
                    ">
                      {choice.image && (
                        <div className="
                          mb-3
                          aspect-[16/9]
                          w-full
                          overflow-hidden
                          rounded-2xl
                          bg-slate-100
                        ">
                          <img
                            src={
                              choice.image
                            }
                            alt={
                              choice.alt
                            }
                            className="
                              h-full
                              w-full
                              object-cover
                            "
                          />
                        </div>
                      )}

                      {choice.emoji && (
                        <div
                          className="
                            mb-2
                            text-center
                            text-5xl
                            leading-none
                            md:text-6xl
                          "
                          aria-hidden="true"
                        >
                          {
                            choice.emoji
                          }
                        </div>
                      )}

                      <span className="
                        text-sm
                        font-black
                        leading-6
                        text-slate-800
                        md:text-base
                      ">
                        {
                          choice.label
                        }
                      </span>

                      {choice.caption && (
                        <span className="
                          mt-1
                          text-xs
                          font-bold
                          leading-5
                          text-slate-400
                        ">
                          {
                            choice.caption
                          }
                        </span>
                      )}
                    </div>
                  </div>

                  {correct && (
                    <CheckCircle2
                      size={25}
                      className="
                        absolute
                        right-4
                        top-4
                        text-emerald-500
                      "
                    />
                  )}
                </button>
              );
            }
          )}
        </div>


        {result ===
          'wrong' && (
          <div className="
            mt-5
            flex
            items-start
            gap-3
            rounded-2xl
            border
            border-orange-200
            bg-orange-50
            p-4
            text-orange-700
          ">
            <AlertCircle
              size={22}
              className="shrink-0"
            />

            <div>
              <p className="font-black">
                もう一度考えてみよう
              </p>

              <p className="
                mt-1
                text-sm
                font-bold
                leading-6
                opacity-80
              ">
                ヒントや選択肢を見直して、
                別の答えを選んでみよう。
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };


  return createPortal(
    (
      <div className="
        fixed
        inset-0
        z-[100000]
        flex
        items-center
        justify-center
        overflow-hidden
        bg-slate-950/85
        p-0
        backdrop-blur-sm
        md:p-4
      ">
        <MissionSuccessCelebration
          celebration={
            celebration
          }
          nextMission={
            nextMission
          }
          onNext={
            goNext
          }
          onBackToList={
            goBackToList
          }
          onDismiss={() =>
            setCelebration(
              null
            )
          }
        />


        <div
          className="
            flex
            h-[100dvh]
            w-full
            max-w-[1480px]
            flex-col
            overflow-hidden
            bg-white
            shadow-2xl
            md:h-[94vh]
            md:rounded-[30px]
          "
        >
          {/* HEADER */}
          <div className="
            relative
            shrink-0
            bg-gradient-to-r
            from-slate-950
            via-slate-900
            to-blue-950
            px-4
            py-4
            text-white
            md:px-7
            md:py-5
          ">
            <button
              type="button"
              onClick={onClose}
              className="
                absolute
                right-4
                top-4
                rounded-full
                bg-white/10
                p-2.5
                transition
                hover:bg-white/20
              "
              aria-label="Close mission"
            >
              <X size={22} />
            </button>

            <div className="
              flex
              items-center
              gap-3
              pr-14
            ">
              <div className="
                hidden
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-white/10
                text-2xl
                md:flex
              ">
                {domain?.icon ??
                  '🌍'}
              </div>

              <div className="min-w-0">
                <div className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                ">
                  <span className="
                    rounded-full
                    bg-white/10
                    px-3
                    py-1
                    text-[10px]
                    font-black
                    tracking-[0.12em]
                  ">
                    {
                      getMissionNumber(
                        mission.id
                      )
                    }
                  </span>

                  <span className="
                    rounded-full
                    bg-cyan-400/15
                    px-3
                    py-1
                    text-[10px]
                    font-black
                    text-cyan-200
                  ">
                    {levelLabel}
                  </span>

                  <span className="
                    rounded-full
                    bg-amber-400/15
                    px-3
                    py-1
                    text-[10px]
                    font-black
                    text-amber-200
                  ">
                    {mission.points} WP
                  </span>
                </div>

                <h2 className="
                  mt-2
                  truncate
                  text-xl
                  font-black
                  tracking-tight
                  md:text-2xl
                ">
                  {mission.title}
                </h2>
              </div>
            </div>
          </div>


          {/* MAIN */}
          <div
            ref={
              scrollContainerRef
            }
            className="
              min-h-0
              flex-1
              overflow-y-auto
              bg-slate-50
            "
          >
            <div className="
              mx-auto
              grid
              w-full
              max-w-[1380px]
              gap-5
              p-4
              md:p-6
              lg:grid-cols-[330px_minmax(0,1fr)]
              xl:grid-cols-[370px_minmax(0,1fr)]
            ">
              {/* LEFT: mission brief */}
              <aside className="
                self-start
                lg:sticky
                lg:top-0
              ">
                <div className="
                  rounded-[26px]
                  border
                  border-slate-200
                  bg-white
                  p-5
                  shadow-sm
                  md:p-6
                ">
                  <p className="
                    text-[10px]
                    font-black
                    tracking-[0.18em]
                    text-blue-500
                  ">
                    YOUR MISSION
                  </p>

                  <p className="
                    mt-3
                    text-lg
                    font-black
                    leading-8
                    text-slate-900
                    md:text-xl
                  ">
                    {mission.prompt}
                  </p>

                  {mission.explanation && (
                    <div className="
                      mt-5
                      rounded-2xl
                      bg-blue-50
                      p-4
                    ">
                      <p className="
                        text-[10px]
                        font-black
                        tracking-[0.14em]
                        text-blue-500
                      ">
                        DISCOVERY NOTE
                      </p>

                      <p className="
                        mt-2
                        text-sm
                        font-bold
                        leading-6
                        text-slate-600
                      ">
                        {
                          mission.explanation
                        }
                      </p>
                    </div>
                  )}

                  {alreadyCompleted && (
                    <div className="
                      mt-5
                      flex
                      items-start
                      gap-3
                      rounded-2xl
                      bg-emerald-50
                      p-4
                      text-emerald-700
                    ">
                      <CheckCircle2
                        size={20}
                        className="mt-0.5 shrink-0"
                      />
                      <div>
                        <p className="font-black">
                          Mission Clear!
                        </p>
                        <p className="
                          mt-1
                          text-xs
                          font-bold
                          leading-5
                          opacity-80
                        ">
                          復習は何度でもできます。
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </aside>


              {/* RIGHT: interactive area */}
              <main className="
                min-w-0
                rounded-[28px]
                border
                border-slate-200
                bg-white
                p-4
                shadow-sm
                md:p-6
                xl:p-7
              ">
                {renderGame()}
              </main>
            </div>
          </div>


          {/* STICKY ACTION BAR */}
          <div className="
            shrink-0
            border-t
            border-slate-200
            bg-white/95
            px-3
            py-3
            backdrop-blur
            md:px-6
          ">
            <div className="
              mx-auto
              flex
              max-w-[1380px]
              items-center
              justify-between
              gap-3
            ">
              <div className="
                flex
                items-center
                gap-2
              ">
                <button
                  type="button"
                  onClick={
                    goBackToList
                  }
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-xl
                    border
                    border-slate-200
                    bg-white
                    px-3
                    py-3
                    text-xs
                    font-black
                    text-slate-600
                    transition
                    hover:bg-slate-50
                    md:px-4
                  "
                >
                  <List size={18} />
                  <span className="
                    hidden
                    sm:inline
                  ">
                    Mission一覧
                  </span>
                </button>

                {previousMission &&
                  onPreviousMission && (
                  <button
                    type="button"
                    onClick={
                      goPrevious
                    }
                    className="
                      hidden
                      items-center
                      gap-1
                      rounded-xl
                      px-3
                      py-3
                      text-xs
                      font-black
                      text-slate-500
                      transition
                      hover:bg-slate-100
                      md:inline-flex
                    "
                  >
                    <ArrowLeft
                      size={17}
                    />
                    前へ
                  </button>
                )}
              </div>


              <div className="
                hidden
                text-center
                sm:block
              ">
                <p className="
                  text-xs
                  font-black
                  text-slate-800
                ">
                  {progressLabel}
                </p>

                <p className="
                  text-[9px]
                  font-black
                  tracking-[0.12em]
                  text-slate-300
                ">
                  WORLD ADVENTURE
                </p>
              </div>


              <div>
                {choicePlayable &&
                !specializedPlayable ? (
                  result ===
                  'wrong' ? (
                    <button
                      type="button"
                      onClick={retry}
                      className="
                        inline-flex
                        min-w-[150px]
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-orange-500
                        px-5
                        py-3
                        text-sm
                        font-black
                        text-white
                        shadow-lg
                        transition
                        hover:bg-orange-600
                      "
                    >
                      <RotateCcw
                        size={18}
                      />
                      もう一度
                    </button>
                  ) : result ===
                    'correct' ? (
                    <button
                      type="button"
                      onClick={
                        goNext
                      }
                      className="
                        inline-flex
                        min-w-[170px]
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-emerald-500
                        px-5
                        py-3
                        text-sm
                        font-black
                        text-white
                        shadow-lg
                        transition
                        hover:bg-emerald-600
                      "
                    >
                      {nextMission
                        ? '次のMissionへ'
                        : 'Mission一覧へ'}
                      <ArrowRight
                        size={19}
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        selectedIndex ===
                        null
                      }
                      onClick={
                        checkAnswer
                      }
                      className="
                        inline-flex
                        min-w-[170px]
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-blue-600
                        px-5
                        py-3
                        text-sm
                        font-black
                        text-white
                        shadow-lg
                        transition
                        hover:bg-blue-700
                        disabled:cursor-not-allowed
                        disabled:bg-slate-200
                        disabled:text-slate-400
                        disabled:shadow-none
                      "
                    >
                      答えを確認
                      <ArrowRight
                        size={19}
                      />
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={
                      goBackToList
                    }
                    className="
                      inline-flex
                      min-w-[150px]
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-slate-950
                      px-5
                      py-3
                      text-sm
                      font-black
                      text-white
                      transition
                      hover:bg-slate-800
                    "
                  >
                    Mission一覧
                    <ArrowRight
                      size={18}
                    />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    document.body
  );
}
