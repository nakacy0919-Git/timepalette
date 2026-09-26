import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';


/* =========================================================
   COMMON RESULT
========================================================= */

function ResultBox({
  status,
  mission,
  alreadyCompleted,
  detail,
}) {
  if (status === null) {
    return null;
  }

  if (status === false) {
    return (
      <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-700">

        <div className="flex items-start gap-3">

          <AlertCircle
            size={22}
            className="mt-0.5 shrink-0"
          />

          <div>

            <p className="font-black">
              もう一度考えてみよう！
            </p>

            {detail && (
              <p className="mt-1 text-sm font-bold opacity-80">
                {detail}
              </p>
            )}

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">

      <div className="mb-3 flex items-center gap-3 text-emerald-700">

        <CheckCircle2
          size={26}
        />

        <p className="text-xl font-black">
          Mission Clear!
        </p>

      </div>

      <p className="font-bold leading-relaxed text-slate-700">
        {mission.explanation}
      </p>

      {detail && (
        <p className="mt-2 text-sm font-bold text-emerald-700">
          {detail}
        </p>
      )}

      <div className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 font-black text-white">

        {alreadyCompleted
          ? 'REVIEW COMPLETE'
          : `+${mission.points} WP`}

      </div>

    </div>
  );
}


/* =========================================================
   SORTING
========================================================= */

function SortingMission({
  mission,
  onClear,
  alreadyCompleted,
}) {
  const items =
    mission
      ?.challenge
      ?.items ??
    [];

  const categories =
    useMemo(
      () => [
        ...new Set(
          items
            .map(
              (item) =>
                item.target
            )
            .filter(Boolean)
        ),
      ],
      [items]
    );

  const [
    answers,
    setAnswers,
  ] = useState({});

  const [
    status,
    setStatus,
  ] = useState(null);

  const [
    correctCount,
    setCorrectCount,
  ] = useState(0);


  const allAnswered =
    items.length > 0 &&
    items.every(
      (
        _,
        index
      ) =>
        Boolean(
          answers[
            index
          ]
        )
    );


  const check =
    () => {
      const nextCorrectCount =
        items.reduce(
          (
            total,
            item,
            index
          ) =>
            total +
            (
              answers[
                index
              ] ===
              item.target
                ? 1
                : 0
            ),
          0
        );

      setCorrectCount(
        nextCorrectCount
      );

      const correct =
        nextCorrectCount ===
        items.length;

      setStatus(
        correct
      );

      if (correct) {
        onClear(
          mission
        );
      }
    };


  const reset =
    () => {
      setAnswers(
        {}
      );

      setCorrectCount(
        0
      );

      setStatus(
        null
      );
    };


  if (
    items.length === 0
  ) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">

        <div className="mb-3 text-4xl">
          🇯🇵
        </div>

        <p className="font-black text-slate-700">
          分類データがありません。
        </p>

      </div>
    );
  }


  return (
    <div>

      <div className="mb-5 rounded-3xl border border-rose-100 bg-rose-50 p-5">

        <p className="text-xs font-black tracking-[0.12em] text-rose-600">
          THIS COUNTRY → JAPAN
        </p>

        <p className="mt-2 font-bold leading-relaxed text-slate-700">
          この国と日本のつながりについて、
          学習した内容を使って分類してください。
        </p>

      </div>


      <div className="space-y-4">

        {items.map(
          (
            item,
            index
          ) => (
            <div
              key={
                `${mission.id}-${item.label}-${index}`
              }
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >

              <p className="text-xs font-black tracking-[0.12em] text-slate-400">
                ITEM {index + 1}
              </p>

              <p className="mt-1 text-xl font-black text-slate-900">
                {
                  item.label
                }
              </p>


              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">

                {categories.map(
                  (
                    category
                  ) => {
                    const selected =
                      answers[
                        index
                      ] ===
                      category;

                    return (
                      <button
                        key={
                          `${item.label}-${category}`
                        }
                        type="button"
                        disabled={
                          status ===
                          true
                        }
                        onClick={() => {
                          setAnswers(
                            (
                              current
                            ) => ({
                              ...current,

                              [index]:
                                category,
                            })
                          );

                          setStatus(
                            null
                          );
                        }}
                        className={`
                          rounded-2xl
                          border-2
                          px-4
                          py-3
                          font-black
                          transition-all
                          ${
                            selected
                              ? 'border-rose-500 bg-rose-500 text-white'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-rose-300 hover:bg-rose-50'
                          }
                        `}
                      >
                        {
                          category
                        }
                      </button>
                    );
                  }
                )}

              </div>

            </div>
          )
        )}

      </div>


      {status !== true && (
        <button
          type="button"
          disabled={
            !allAnswered
          }
          onClick={
            check
          }
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          分類をチェック
        </button>
      )}


      <ResultBox
        status={
          status
        }
        mission={
          mission
        }
        alreadyCompleted={
          alreadyCompleted
        }
        detail={
          status === false
            ? `${correctCount} / ${items.length} 個が合っています。まだ正解は表示しません。もう一度考えてみましょう。`
            : `${items.length} / ${items.length} 個すべて正しく分類できました。`
        }
      />


      {status === false && (
        <button
          type="button"
          onClick={
            reset
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-black text-slate-500 hover:bg-slate-100"
        >

          <RefreshCw
            size={18}
          />

          もう一度分類する

        </button>
      )}

    </div>
  );
}


/* =========================================================
   CONNECTION CHAIN
========================================================= */

function ConnectionChainMission({
  mission,
  onClear,
  alreadyCompleted,
}) {
  const chains =
    mission
      ?.challenge
      ?.chains ??
    [];


  const middleOptions =
    useMemo(
      () => {
        const values = [
          ...new Set(
            chains
              .map(
                (chain) =>
                  chain.middle
              )
              .filter(Boolean)
          ),
        ];

        if (
          values.length <= 1
        ) {
          return values;
        }

        return [
          ...values.slice(
            1
          ),
          values[0],
        ];
      },
      [chains]
    );


  const endOptions =
    useMemo(
      () => {
        const values = [
          ...new Set(
            chains
              .map(
                (chain) =>
                  chain.end
              )
              .filter(Boolean)
          ),
        ];

        if (
          values.length <= 1
        ) {
          return values;
        }

        return [
          values[
            values.length -
            1
          ],

          ...values.slice(
            0,
            -1
          ),
        ];
      },
      [chains]
    );


  const [
    answers,
    setAnswers,
  ] = useState({});

  const [
    status,
    setStatus,
  ] = useState(null);

  const [
    correctCount,
    setCorrectCount,
  ] = useState(0);


  const allAnswered =
    chains.length > 0 &&
    chains.every(
      (
        _,
        index
      ) =>
        Boolean(
          answers[
            index
          ]?.middle
        ) &&
        Boolean(
          answers[
            index
          ]?.end
        )
    );


  const updateAnswer =
    (
      index,
      key,
      value
    ) => {
      setAnswers(
        (
          current
        ) => ({
          ...current,

          [index]: {
            ...(
              current[
                index
              ] ??
              {}
            ),

            [key]:
              value,
          },
        })
      );

      setStatus(
        null
      );
    };


  const check =
    () => {
      const nextCorrectCount =
        chains.reduce(
          (
            total,
            chain,
            index
          ) => {
            const answer =
              answers[
                index
              ];

            const correct =
              answer
                ?.middle ===
                chain.middle &&
              answer
                ?.end ===
                chain.end;

            return (
              total +
              (
                correct
                  ? 1
                  : 0
              )
            );
          },
          0
        );

      setCorrectCount(
        nextCorrectCount
      );

      const correct =
        nextCorrectCount ===
        chains.length;

      setStatus(
        correct
      );

      if (correct) {
        onClear(
          mission
        );
      }
    };


  const reset =
    () => {
      setAnswers(
        {}
      );

      setCorrectCount(
        0
      );

      setStatus(
        null
      );
    };


  if (
    chains.length === 0
  ) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">

        <p className="font-black text-slate-700">
          Connection Chainデータがありません。
        </p>

      </div>
    );
  }


  return (
    <div>

      <div className="mb-6 rounded-3xl border border-amber-100 bg-amber-50 p-5">

        <p className="text-xs font-black tracking-[0.12em] text-amber-700">
          CONNECTION CHAIN
        </p>

        <p className="mt-2 font-bold leading-relaxed text-slate-700">
          この国と日本がどのようにつながっているのか、
          モノ・産業・暮らしなどの流れを考えます。
        </p>

      </div>


      <div className="space-y-5">

        {chains.map(
          (
            chain,
            index
          ) => (
            <div
              key={
                `${mission.id}-${chain.start}-${index}`
              }
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >

              <p className="text-xs font-black tracking-[0.12em] text-slate-400">
                CHAIN {index + 1}
              </p>


              <div className="mt-4 grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">

                <div className="rounded-2xl bg-rose-50 p-4 text-center">

                  <p className="text-xs font-black text-rose-400">
                    THIS COUNTRY
                  </p>

                  <p className="mt-1 text-lg font-black text-rose-700">
                    {
                      chain.start
                    }
                  </p>

                </div>


                <div className="text-center text-2xl font-black text-slate-300">
                  →
                </div>


                <select
                  value={
                    answers[
                      index
                    ]?.middle ??
                    ''
                  }
                  disabled={
                    status ===
                    true
                  }
                  onChange={(
                    event
                  ) =>
                    updateAnswer(
                      index,
                      'middle',
                      event
                        .target
                        .value
                    )
                  }
                  className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 py-4 font-black text-slate-700 outline-none focus:border-blue-500"
                >

                  <option value="">
                    途中のつながり
                  </option>

                  {middleOptions.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option
                        }
                        value={
                          option
                        }
                      >
                        {
                          option
                        }
                      </option>
                    )
                  )}

                </select>


                <div className="text-center text-2xl font-black text-slate-300">
                  →
                </div>


                <select
                  value={
                    answers[
                      index
                    ]?.end ??
                    ''
                  }
                  disabled={
                    status ===
                    true
                  }
                  onChange={(
                    event
                  ) =>
                    updateAnswer(
                      index,
                      'end',
                      event
                        .target
                        .value
                    )
                  }
                  className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 py-4 font-black text-slate-700 outline-none focus:border-blue-500"
                >

                  <option value="">
                    日本とのつながり
                  </option>

                  {endOptions.map(
                    (
                      option
                    ) => (
                      <option
                        key={
                          option
                        }
                        value={
                          option
                        }
                      >
                        {
                          option
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

            </div>
          )
        )}

      </div>


      {status !== true && (
        <button
          type="button"
          disabled={
            !allAnswered
          }
          onClick={
            check
          }
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          つながりをチェック
        </button>
      )}


      <ResultBox
        status={
          status
        }
        mission={
          mission
        }
        alreadyCompleted={
          alreadyCompleted
        }
        detail={
          status === false
            ? `${correctCount} / ${chains.length} 本のConnection Chainが正しいです。`
            : `${chains.length} 本すべてのつながりを完成できました。`
        }
      />


      {status === false && (
        <button
          type="button"
          onClick={
            reset
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-black text-slate-500 hover:bg-slate-100"
        >

          <RefreshCw
            size={18}
          />

          もう一度組み立てる

        </button>
      )}

    </div>
  );
}


/* =========================================================
   DAILY LIFE HUNT
========================================================= */

function DailyLifeHuntMission({
  mission,
  onClear,
  alreadyCompleted,
}) {
  const minChars =
    mission
      ?.challenge
      ?.minChars ??
    20;

  const evidencePrompt =
    mission
      ?.challenge
      ?.evidencePrompt ??
    '見つけた根拠を書いてください。';


  const [
    connectionText,
    setConnectionText,
  ] = useState('');

  const [
    evidenceText,
    setEvidenceText,
  ] = useState('');

  const [
    checked,
    setChecked,
  ] = useState(false);

  const [
    status,
    setStatus,
  ] = useState(null);


  const ready =
    connectionText
      .trim()
      .length >=
      minChars &&
    evidenceText
      .trim()
      .length >=
      minChars &&
    checked;


  const submit =
    () => {
      if (!ready) {
        setStatus(
          false
        );

        return;
      }

      setStatus(
        true
      );

      onClear(
        mission
      );
    };


  const reset =
    () => {
      setConnectionText(
        ''
      );

      setEvidenceText(
        ''
      );

      setChecked(
        false
      );

      setStatus(
        null
      );
    };


  return (
    <div>

      <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">

        <p className="text-xs font-black tracking-[0.12em] text-blue-600">
          DAILY LIFE HUNT
        </p>

        <p className="mt-2 font-bold leading-relaxed text-slate-700">
          日本の日常生活と、この国とのつながりを探してみよう。
        </p>

      </div>


      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">

        <label
          htmlFor={
            `${mission.id}-connection`
          }
          className="text-sm font-black text-slate-700"
        >
          どんなつながりを見つけた？
        </label>

        <textarea
          id={
            `${mission.id}-connection`
          }
          value={
            connectionText
          }
          disabled={
            status ===
            true
          }
          onChange={(
            event
          ) => {
            setConnectionText(
              event
                .target
                .value
            );

            setStatus(
              null
            );
          }}
          rows={4}
          placeholder="商品、食べ物、資源、文化、技術、人の交流などから探してみよう。"
          className="mt-3 w-full resize-none rounded-2xl border-2 border-slate-200 px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500"
        />

        <p className="mt-2 text-xs font-black text-slate-400">
          {
            connectionText
              .trim()
              .length
          }
          {' / '}
          minimum {minChars}
        </p>

      </div>


      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5">

        <label
          htmlFor={
            `${mission.id}-evidence`
          }
          className="text-sm font-black text-slate-700"
        >
          {
            evidencePrompt
          }
        </label>

        <textarea
          id={
            `${mission.id}-evidence`
          }
          value={
            evidenceText
          }
          disabled={
            status ===
            true
          }
          onChange={(
            event
          ) => {
            setEvidenceText(
              event
                .target
                .value
            );

            setStatus(
              null
            );
          }}
          rows={4}
          placeholder="Missionで学んだ内容や、実際に見つけた情報を書こう。"
          className="mt-3 w-full resize-none rounded-2xl border-2 border-slate-200 px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500"
        />

        <p className="mt-2 text-xs font-black text-slate-400">
          {
            evidenceText
              .trim()
              .length
          }
          {' / '}
          minimum {minChars}
        </p>

      </div>


      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

        <input
          type="checkbox"
          checked={
            checked
          }
          disabled={
            status ===
            true
          }
          onChange={(
            event
          ) => {
            setChecked(
              event
                .target
                .checked
            );

            setStatus(
              null
            );
          }}
          className="mt-1 h-5 w-5"
        />

        <span className="text-sm font-bold leading-relaxed text-slate-600">
          思いつきだけでなく、
          Missionで学んだ内容や根拠を使って書きました。
        </span>

      </label>


      {status !== true && (
        <button
          type="button"
          disabled={
            !ready
          }
          onClick={
            submit
          }
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          発見を記録する
        </button>
      )}


      <ResultBox
        status={
          status
        }
        mission={
          mission
        }
        alreadyCompleted={
          alreadyCompleted
        }
        detail={
          status === true
            ? '日本の日常とこの国とのつながりを、根拠と一緒に説明できました。'
            : '文章量・根拠・確認項目をすべて満たしてください。'
        }
      />


      {status === false && (
        <button
          type="button"
          onClick={
            reset
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-black text-slate-500 hover:bg-slate-100"
        >

          <RefreshCw
            size={18}
          />

          最初からやり直す

        </button>
      )}

    </div>
  );
}


/* =========================================================
   QUIZ CREATOR
========================================================= */

function QuizCreatorMission({
  mission,
  onClear,
  alreadyCompleted,
}) {
  const requiredWrongAnswers =
    mission
      ?.challenge
      ?.requiredWrongAnswers ??
    3;


  const [
    question,
    setQuestion,
  ] = useState('');

  const [
    correctAnswer,
    setCorrectAnswer,
  ] = useState('');

  const [
    wrongAnswers,
    setWrongAnswers,
  ] = useState(
    () =>
      Array.from(
        {
          length:
            requiredWrongAnswers,
        },
        () => ''
      )
  );

  const [
    explanation,
    setExplanation,
  ] = useState('');

  const [
    checkedFact,
    setCheckedFact,
  ] = useState(false);

  const [
    checkedConnection,
    setCheckedConnection,
  ] = useState(false);

  const [
    status,
    setStatus,
  ] = useState(null);


  const normalizedAnswers = [
    correctAnswer,
    ...wrongAnswers,
  ]
    .map(
      (value) =>
        value
          .trim()
          .toLowerCase()
    )
    .filter(Boolean);


  const uniqueAnswers =
    new Set(
      normalizedAnswers
    );


  const ready =
    question
      .trim()
      .length >=
      10 &&
    correctAnswer
      .trim()
      .length >=
      2 &&
    wrongAnswers.every(
      (answer) =>
        answer
          .trim()
          .length >=
          2
    ) &&
    uniqueAnswers.size ===
      1 +
      requiredWrongAnswers &&
    explanation
      .trim()
      .length >=
      15 &&
    checkedFact &&
    checkedConnection;


  const updateWrongAnswer =
    (
      index,
      value
    ) => {
      setWrongAnswers(
        (
          current
        ) =>
          current.map(
            (
              answer,
              answerIndex
            ) =>
              answerIndex ===
              index
                ? value
                : answer
          )
      );

      setStatus(
        null
      );
    };


  const submit =
    () => {
      if (!ready) {
        setStatus(
          false
        );

        return;
      }

      setStatus(
        true
      );

      onClear(
        mission
      );
    };


  const reset =
    () => {
      setQuestion(
        ''
      );

      setCorrectAnswer(
        ''
      );

      setWrongAnswers(
        Array.from(
          {
            length:
              requiredWrongAnswers,
          },
          () => ''
        )
      );

      setExplanation(
        ''
      );

      setCheckedFact(
        false
      );

      setCheckedConnection(
        false
      );

      setStatus(
        null
      );
    };


  return (
    <div>

      <div className="rounded-3xl border border-violet-100 bg-violet-50 p-5">

        <p className="text-xs font-black tracking-[0.12em] text-violet-600">
          QUIZ CREATOR
        </p>

        <p className="mt-2 font-bold leading-relaxed text-slate-700">
          この国と日本のつながりについて、
          自分で4択クイズを作ってみよう。
        </p>

      </div>


      <div className="mt-5 space-y-4">

        <div className="rounded-3xl border border-slate-200 bg-white p-5">

          <label className="text-sm font-black text-slate-700">
            QUESTION
          </label>

          <textarea
            value={
              question
            }
            disabled={
              status ===
              true
            }
            onChange={(
              event
            ) => {
              setQuestion(
                event
                  .target
                  .value
              );

              setStatus(
                null
              );
            }}
            rows={3}
            placeholder="日本とこの国のつながりを問う問題を書こう。"
            className="mt-3 w-full resize-none rounded-2xl border-2 border-slate-200 px-4 py-3 font-bold text-slate-800 outline-none focus:border-violet-500"
          />

        </div>


        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">

          <label className="text-sm font-black text-emerald-700">
            CORRECT ANSWER
          </label>

          <input
            value={
              correctAnswer
            }
            disabled={
              status ===
              true
            }
            onChange={(
              event
            ) => {
              setCorrectAnswer(
                event
                  .target
                  .value
              );

              setStatus(
                null
              );
            }}
            className="mt-3 w-full rounded-2xl border-2 border-emerald-200 bg-white px-4 py-3 font-bold text-slate-800 outline-none focus:border-emerald-500"
          />

        </div>


        {wrongAnswers.map(
          (
            answer,
            index
          ) => (
            <div
              key={
                `${mission.id}-wrong-${index}`
              }
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >

              <label className="text-sm font-black text-slate-600">
                WRONG ANSWER {index + 1}
              </label>

              <input
                value={
                  answer
                }
                disabled={
                  status ===
                  true
                }
                onChange={(
                  event
                ) =>
                  updateWrongAnswer(
                    index,
                    event
                      .target
                      .value
                  )
                }
                className="mt-3 w-full rounded-2xl border-2 border-slate-200 px-4 py-3 font-bold text-slate-800 outline-none focus:border-violet-500"
              />

            </div>
          )
        )}


        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">

          <label className="text-sm font-black text-amber-800">
            EXPLANATION
          </label>

          <textarea
            value={
              explanation
            }
            disabled={
              status ===
              true
            }
            onChange={(
              event
            ) => {
              setExplanation(
                event
                  .target
                  .value
              );

              setStatus(
                null
              );
            }}
            rows={4}
            placeholder="なぜその答えになるのか説明しよう。"
            className="mt-3 w-full resize-none rounded-2xl border-2 border-amber-200 bg-white px-4 py-3 font-bold text-slate-800 outline-none focus:border-amber-500"
          />

        </div>

      </div>


      {uniqueAnswers.size <
        normalizedAnswers.length &&
        normalizedAnswers.length >
          1 && (
          <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-700">
            同じ選択肢が重複しています。
            4つすべて異なる答えにしてください。
          </div>
        )}


      <div className="mt-5 space-y-3">

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

          <input
            type="checkbox"
            checked={
              checkedFact
            }
            disabled={
              status ===
              true
            }
            onChange={(
              event
            ) => {
              setCheckedFact(
                event
                  .target
                  .checked
              );

              setStatus(
                null
              );
            }}
            className="mt-1 h-5 w-5"
          />

          <span className="text-sm font-bold leading-relaxed text-slate-600">
            Missionで学んだ内容に基づいて問題を作りました。
          </span>

        </label>


        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

          <input
            type="checkbox"
            checked={
              checkedConnection
            }
            disabled={
              status ===
              true
            }
            onChange={(
              event
            ) => {
              setCheckedConnection(
                event
                  .target
                  .checked
              );

              setStatus(
                null
              );
            }}
            className="mt-1 h-5 w-5"
          />

          <span className="text-sm font-bold leading-relaxed text-slate-600">
            「この国と日本のつながり」が分かる問題になっています。
          </span>

        </label>

      </div>


      {status !== true && (
        <button
          type="button"
          disabled={
            !ready
          }
          onClick={
            submit
          }
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          QUIZを完成する
        </button>
      )}


      <ResultBox
        status={
          status
        }
        mission={
          mission
        }
        alreadyCompleted={
          alreadyCompleted
        }
        detail={
          status === true
            ? '日本とのつながりを使った4択クイズを完成できました。'
            : '問題・4つの選択肢・解説・確認項目をすべて完成してください。'
        }
      />


      {status === false && (
        <button
          type="button"
          onClick={
            reset
          }
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-black text-slate-500 hover:bg-slate-100"
        >

          <RefreshCw
            size={18}
          />

          最初から作り直す

        </button>
      )}

    </div>
  );
}


/* =========================================================
   ROUTER
========================================================= */

export default function JapanConnectionMissionGame({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  if (
    mission.type ===
    'sorting'
  ) {
    return (
      <SortingMission
        mission={
          mission
        }
        onClear={
          onComplete
        }
        alreadyCompleted={
          alreadyCompleted
        }
      />
    );
  }


  if (
    mission.type ===
    'connection-chain'
  ) {
    return (
      <ConnectionChainMission
        mission={
          mission
        }
        onClear={
          onComplete
        }
        alreadyCompleted={
          alreadyCompleted
        }
      />
    );
  }


  if (
    mission.type ===
    'daily-life-hunt'
  ) {
    return (
      <DailyLifeHuntMission
        mission={
          mission
        }
        onClear={
          onComplete
        }
        alreadyCompleted={
          alreadyCompleted
        }
      />
    );
  }


  if (
    mission.type ===
    'quiz-creator'
  ) {
    return (
      <QuizCreatorMission
        mission={
          mission
        }
        onClear={
          onComplete
        }
        alreadyCompleted={
          alreadyCompleted
        }
      />
    );
  }


  return null;
}