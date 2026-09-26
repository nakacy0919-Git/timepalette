import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Lightbulb,
  Link2,
  PlayCircle,
} from 'lucide-react';

import {
  useState,
} from 'react';

import {
  getLearningSources,
} from '../../utils/learningSourceRegistry';


const THEME_META = {
  waterSanitation: {
    icon: '💧',
    label: 'WATER',
    title: 'Water & Sanitation',
  },

  agriculture: {
    icon: '🌾',
    label: 'AGRICULTURE',
    title: 'Agriculture & Food',
  },

  education: {
    icon: '🎓',
    label: 'EDUCATION',
    title: 'Education',
  },

  digital: {
    icon: '💻',
    label: 'DIGITAL',
    title: 'ICT & Innovation',
  },

  health: {
    icon: '🏥',
    label: 'HEALTH',
    title: 'Health & Nutrition',
  },

  infrastructure: {
    icon: '🚍',
    label: 'INFRASTRUCTURE',
    title: 'Economic Infrastructure',
  },
};


function SourceViewer({
  source,
}) {
  if (!source) {
    return null;
  }


  if (
    source.assetType ===
      'youtube' &&
    source.youtubeId
  ) {
    return (
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-black shadow-sm">

        <div className="aspect-video">

          <iframe
            title={
              source.title
            }
            src={`https://www.youtube.com/embed/${source.youtubeId}?rel=0&playsinline=1`}
            className="h-full w-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />

        </div>

      </div>
    );
  }


  if (
    source.assetType ===
    'pdf'
  ) {
    return (
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

        <iframe
          title={
            source.title
          }
          src={`${source.url}#view=FitH`}
          className="h-[70vh] min-h-[520px] w-full"
        />

      </div>
    );
  }


  if (
    source.assetType ===
      'image'
  ) {
    return (
      <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">

        <img
          src={
            source.url
          }
          alt={
            source.title
          }
          className="h-auto w-full"
        />

      </div>
    );
  }


  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">

      <p className="font-black text-slate-700">
        {
          source.titleJa ??
          source.title
        }
      </p>

    </div>
  );
}


export default function GlobalChallengeMissionGame({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const challenge =
    mission?.challenge ??
    {};

  const sources =
    getLearningSources(
      challenge.sourceIds ??
        mission.sourceIds ??
        []
    );


  const [
    activeSourceIndex,
    setActiveSourceIndex,
  ] = useState(0);

  const [
    noticed,
    setNoticed,
  ] = useState([]);

  const [
    selectedAnswer,
    setSelectedAnswer,
  ] = useState(null);

  const [
    quizStatus,
    setQuizStatus,
  ] = useState(null);

  const [
    reflection,
    setReflection,
  ] = useState('');

  const [
    completed,
    setCompleted,
  ] = useState(false);


  const theme =
    THEME_META[
      mission
        ?.globalChallenge
        ?.theme
    ] ?? {
      icon: '🌍',
      label:
        'GLOBAL CHALLENGE',
      title:
        'Global Challenge',
    };


  const activeSource =
    sources[
      activeSourceIndex
    ];


  const noticeOptions =
    challenge
      ?.notice
      ?.options ??
    [];


  const quiz =
    challenge.quiz;


  const minConnectChars =
    Number(
      challenge
        ?.connect
        ?.minChars ??
        20
    );


  const toggleNotice =
    (
      option
    ) => {
      setNoticed(
        (
          current
        ) =>
          current.includes(
            option
          )
            ? current.filter(
                (
                  item
                ) =>
                  item !==
                  option
              )
            : [
                ...current,
                option,
              ]
      );
    };


  const checkQuiz =
    () => {
      if (
        selectedAnswer ===
        null
      ) {
        return;
      }

      const correct =
        selectedAnswer ===
        quiz.correctIndex;

      setQuizStatus(
        correct
      );
    };


  const completeMission =
    () => {
      if (
        quizStatus !== true ||
        reflection
          .trim()
          .length <
          minConnectChars
      ) {
        return;
      }

      setCompleted(
        true
      );

      onComplete(
        mission
      );
    };


  return (
    <div>

      {/* GLOBAL CHALLENGE HEADER */}

      <div
        className="
          overflow-hidden
          rounded-[28px]
          border
          border-cyan-100
          bg-gradient-to-br
          from-cyan-50
          via-white
          to-blue-50
          p-5
          md:p-6
        "
      >

        <div className="flex items-start justify-between gap-4">

          <div>

            <p className="text-[10px] font-black tracking-[0.18em] text-cyan-600">
              GLOBAL CHALLENGE
            </p>

            <h3 className="mt-2 text-2xl font-black text-slate-900">
              {
                theme.icon
              }{' '}
              {
                theme.title
              }
            </h3>

            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              JICAの公式教材を見て、
              世界の課題と取り組みを考えます。
            </p>

          </div>


          <span className="rounded-full bg-cyan-600 px-4 py-2 text-[10px] font-black tracking-[0.12em] text-white">

            {
              theme.label
            }

          </span>

        </div>

      </div>


      {/* ===============================
          WATCH / READ
      ================================ */}

      <section className="mt-7">

        <div className="mb-4 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">

            <PlayCircle
              size={22}
            />

          </div>

          <div>

            <p className="text-[10px] font-black tracking-[0.16em] text-red-500">
              STEP 1
            </p>

            <h4 className="text-xl font-black text-slate-900">
              WATCH / READ
            </h4>

          </div>

        </div>


        {sources.length > 1 && (

          <div className="mb-4 flex flex-wrap gap-2">

            {sources.map(
              (
                source,
                index
              ) => (

                <button
                  key={
                    source.id
                  }
                  type="button"
                  onClick={() =>
                    setActiveSourceIndex(
                      index
                    )
                  }
                  className={`
                    rounded-full
                    px-4
                    py-2
                    text-xs
                    font-black
                    transition
                    ${
                      index ===
                      activeSourceIndex
                        ? 'bg-slate-950 text-white'
                        : 'border border-slate-200 bg-white text-slate-500'
                    }
                  `}
                >

                  {source.assetType ===
                  'youtube'
                    ? '▶ VIDEO'
                    : '📄 PROJECT BRIEF'}

                </button>

              )
            )}

          </div>

        )}


        <SourceViewer
          source={
            activeSource
          }
        />


        {activeSource && (

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">

            <div>

              <p className="text-[9px] font-black tracking-[0.13em] text-slate-400">
                OFFICIAL SOURCE
              </p>

              <p className="mt-1 text-sm font-black text-slate-700">
                JICA
              </p>

            </div>

            <p className="max-w-md text-right text-xs font-bold text-slate-400">
              {
                activeSource.titleJa ??
                activeSource.title
              }
            </p>

          </div>

        )}

      </section>


      {/* ===============================
          NOTICE
      ================================ */}

      <section className="mt-8 rounded-[28px] border border-violet-100 bg-violet-50 p-5 md:p-6">

        <div className="flex items-center gap-3">

          <Eye
            size={23}
            className="text-violet-600"
          />

          <div>

            <p className="text-[10px] font-black tracking-[0.16em] text-violet-500">
              STEP 2
            </p>

            <h4 className="text-xl font-black text-slate-900">
              NOTICE
            </h4>

          </div>

        </div>


        <p className="mt-4 font-black leading-7 text-slate-700">
          {
            challenge
              ?.notice
              ?.prompt
          }
        </p>


        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">

          {noticeOptions.map(
            (
              option
            ) => {
              const selected =
                noticed.includes(
                  option
                );

              return (
                <button
                  key={
                    option
                  }
                  type="button"
                  onClick={() =>
                    toggleNotice(
                      option
                    )
                  }
                  className={`
                    rounded-2xl
                    border-2
                    px-4
                    py-3
                    text-sm
                    font-black
                    transition
                    ${
                      selected
                        ? 'border-violet-500 bg-violet-500 text-white'
                        : 'border-violet-100 bg-white text-slate-600 hover:border-violet-300'
                    }
                  `}
                >

                  {
                    option
                  }

                </button>
              );
            }
          )}

        </div>

      </section>


      {/* ===============================
          THINK / QUIZ
      ================================ */}

      <section className="mt-8">

        <div className="mb-4 flex items-center gap-3">

          <Lightbulb
            size={23}
            className="text-amber-500"
          />

          <div>

            <p className="text-[10px] font-black tracking-[0.16em] text-amber-500">
              STEP 3
            </p>

            <h4 className="text-xl font-black text-slate-900">
              THINK
            </h4>

          </div>

        </div>


        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-6">

          <p className="text-lg font-black leading-7 text-slate-900">
            {
              quiz.question
            }
          </p>


          <div className="mt-5 space-y-3">

            {quiz.choices.map(
              (
                choice,
                index
              ) => {

                const selected =
                  selectedAnswer ===
                  index;

                const correct =
                  quizStatus ===
                    true &&
                  index ===
                    quiz.correctIndex;

                const wrong =
                  quizStatus ===
                    false &&
                  selected;


                return (
                  <button
                    key={
                      `${mission.id}-${index}`
                    }
                    type="button"
                    disabled={
                      quizStatus ===
                      true
                    }
                    onClick={() => {
                      setSelectedAnswer(
                        index
                      );

                      setQuizStatus(
                        null
                      );
                    }}
                    className={`
                      w-full
                      rounded-2xl
                      border-2
                      p-4
                      text-left
                      font-black
                      transition
                      ${
                        correct
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                          : wrong
                            ? 'border-orange-400 bg-orange-50 text-orange-800'
                            : selected
                              ? 'border-blue-500 bg-blue-50 text-slate-800'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                      }
                    `}
                  >

                    <span className="mr-3 text-slate-400">
                      {
                        [
                          'A',
                          'B',
                          'C',
                          'D',
                        ][
                          index
                        ]
                      }
                    </span>

                    {
                      choice
                    }

                  </button>
                );
              }
            )}

          </div>


          {quizStatus !==
            true && (

            <button
              type="button"
              disabled={
                selectedAnswer ===
                null
              }
              onClick={
                checkQuiz
              }
              className="mt-5 w-full rounded-2xl bg-slate-950 py-4 font-black text-white disabled:bg-slate-200 disabled:text-slate-400"
            >
              ANSWER
            </button>

          )}


          {quizStatus ===
            false && (

            <div className="mt-4 flex gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-700">

              <AlertCircle
                size={21}
                className="shrink-0"
              />

              <p className="text-sm font-bold">
                もう一度、
                動画や資料の内容を確認してみよう。
              </p>

            </div>

          )}


          {quizStatus ===
            true && (

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">

              <div className="flex items-center gap-2 font-black text-emerald-700">

                <CheckCircle2
                  size={21}
                />

                正解！

              </div>

              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                {
                  quiz.explanation
                }
              </p>

            </div>

          )}

        </div>

      </section>


      {/* ===============================
          CONNECT
      ================================ */}

      {quizStatus ===
        true && (

        <section className="mt-8 rounded-[28px] border border-blue-100 bg-blue-50 p-5 md:p-6">

          <div className="flex items-center gap-3">

            <Link2
              size={22}
              className="text-blue-600"
            />

            <div>

              <p className="text-[10px] font-black tracking-[0.16em] text-blue-500">
                STEP 4
              </p>

              <h4 className="text-xl font-black text-slate-900">
                CONNECT TO JAPAN
              </h4>

            </div>

          </div>


          <p className="mt-4 font-black leading-7 text-slate-700">
            {
              challenge
                ?.connect
                ?.prompt
            }
          </p>


          <textarea
            value={
              reflection
            }
            onChange={(
              event
            ) =>
              setReflection(
                event
                  .target
                  .value
              )
            }
            rows={4}
            placeholder="自分の生活と比べて考えてみよう。"
            className="mt-4 w-full resize-none rounded-2xl border-2 border-blue-100 bg-white px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500"
          />


          <div className="mt-2 text-right text-xs font-black text-slate-400">

            {
              reflection
                .trim()
                .length
            }
            {' / '}
            {
              minConnectChars
            }

          </div>


          {!completed && (

            <button
              type="button"
              disabled={
                reflection
                  .trim()
                  .length <
                minConnectChars
              }
              onClick={
                completeMission
              }
              className="mt-4 w-full rounded-2xl bg-blue-600 py-4 text-lg font-black text-white transition hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
            >

              COMPLETE MISSION

            </button>

          )}


          {completed && (

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-100 p-4 text-emerald-800">

              <CheckCircle2
                size={24}
              />

              <div>

                <p className="font-black">
                  Mission Complete!
                </p>

                <p className="text-sm font-bold">
                  {alreadyCompleted
                    ? 'REVIEW COMPLETE'
                    : `+${mission.points} WP`}
                </p>

              </div>

            </div>

          )}

        </section>

      )}

    </div>
  );
}