import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

import { useState } from 'react';

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
        <CheckCircle2 size={26} />

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

function SortingMission({
  mission,
  onClear,
  alreadyCompleted,
}) {
  const items =
    mission?.challenge?.items ?? [];

  const categories = [
    ...new Set(
      items.map(
        (item) => item.target
      )
    ),
  ];

  const [answers, setAnswers] =
    useState({});

  const [status, setStatus] =
    useState(null);

  const [
    correctCount,
    setCorrectCount,
  ] = useState(0);

  const allAnswered =
    items.length > 0 &&
    items.every(
      (_, index) =>
        Boolean(
          answers[index]
        )
    );

  const check = () => {
    const nextCorrectCount =
      items.reduce(
        (
          total,
          item,
          index
        ) =>
          total +
          (answers[index] ===
          item.target
            ? 1
            : 0),
        0
      );

    setCorrectCount(
      nextCorrectCount
    );

    const correct =
      nextCorrectCount ===
      items.length;

    setStatus(correct);

    if (correct) {
      onClear(mission);
    }
  };

  const reset = () => {
    setAnswers({});
    setCorrectCount(0);
    setStatus(null);
  };

  if (items.length === 0) {
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
          AUSTRALIA → JAPAN
        </p>

        <p className="mt-2 font-bold leading-relaxed text-slate-700">
          オーストラリアから日本へ届くものについて、
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
              key={`${mission.id}-${item.label}`}
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-black tracking-[0.12em] text-slate-400">
                ITEM {index + 1}
              </p>

              <p className="mt-1 text-xl font-black text-slate-900">
                {item.label}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {categories.map(
                  (
                    category
                  ) => {
                    const selected =
                      answers[index] ===
                      category;

                    return (
                      <button
                        key={`${item.label}-${category}`}
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
                        className={`rounded-2xl border-2 px-4 py-3 font-black transition-all ${
                          selected
                            ? 'border-rose-500 bg-rose-500 text-white'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-rose-300 hover:bg-rose-50'
                        }`}
                      >
                        {category}
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
          onClick={check}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          分類をチェック
        </button>
      )}

      <ResultBox
        status={status}
        mission={mission}
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
          onClick={reset}
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

function ConnectionChainMission({
  mission,
  onClear,
  alreadyCompleted,
}) {
  const chains =
    mission?.challenge?.chains ?? [];

  const uniqueMiddleOptions = [
    ...new Set(
      chains.map(
        (chain) =>
          chain.middle
      )
    ),
  ];

  const uniqueEndOptions = [
    ...new Set(
      chains.map(
        (chain) =>
          chain.end
      )
    ),
  ];

  const middleOptions =
    uniqueMiddleOptions.length > 1
      ? [
          ...uniqueMiddleOptions.slice(
            1
          ),
          uniqueMiddleOptions[0],
        ]
      : uniqueMiddleOptions;

  const endOptions =
    uniqueEndOptions.length > 1
      ? [
          uniqueEndOptions[
            uniqueEndOptions.length -
              1
          ],
          ...uniqueEndOptions.slice(
            0,
            -1
          ),
        ]
      : uniqueEndOptions;

  const [answers, setAnswers] =
    useState({});

  const [status, setStatus] =
    useState(null);

  const [
    correctCount,
    setCorrectCount,
  ] = useState(0);

  const allAnswered =
    chains.length > 0 &&
    chains.every(
      (_, index) =>
        Boolean(
          answers[index]
            ?.middle
        ) &&
        Boolean(
          answers[index]
            ?.end
        )
    );

  const updateAnswer = (
    index,
    key,
    value
  ) => {
    setAnswers(
      (current) => ({
        ...current,

        [index]: {
          ...(current[
            index
          ] || {}),

          [key]: value,
        },
      })
    );

    setStatus(null);
  };

  const check = () => {
    const nextCorrectCount =
      chains.reduce(
        (
          total,
          chain,
          index
        ) => {
          const answer =
            answers[index];

          const correct =
            answer?.middle ===
              chain.middle &&
            answer?.end ===
              chain.end;

          return (
            total +
            (correct ? 1 : 0)
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

    setStatus(correct);

    if (correct) {
      onClear(mission);
    }
  };

  const reset = () => {
    setAnswers({});
    setCorrectCount(0);
    setStatus(null);
  };

  return (
    <div>
      <div className="mb-6 rounded-3xl border border-amber-100 bg-amber-50 p-5">
        <p className="text-xs font-black tracking-[0.12em] text-amber-700">
          CONNECTION CHAIN
        </p>

        <p className="mt-2 font-bold leading-relaxed text-slate-700">
          「輸入品の名前を覚える」だけではありません。
          その資源が、日本の産業や私たちの生活へどうつながるのかを考えます。
        </p>
      </div>

      <div className="space-y-5">
        {chains.map(
          (
            chain,
            index
          ) => (
            <div
              key={`${mission.id}-${chain.start}`}
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-black tracking-[0.12em] text-slate-400">
                CHAIN {index + 1}
              </p>

              <div className="mt-4 grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">

                <div className="rounded-2xl bg-rose-50 p-4 text-center">
                  <p className="text-xs font-black text-rose-400">
                    AUSTRALIA
                  </p>

                  <p className="mt-1 text-lg font-black text-rose-700">
                    {chain.start}
                  </p>
                </div>

                <div className="text-center text-2xl font-black text-slate-300">
                  →
                </div>

                <select
                  value={
                    answers[index]
                      ?.middle ||
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
                      event.target
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
                        {option}
                      </option>
                    )
                  )}
                </select>

                <div className="text-center text-2xl font-black text-slate-300">
                  →
                </div>

                <select
                  value={
                    answers[index]
                      ?.end ||
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
                      event.target
                        .value
                    )
                  }
                  className="rounded-2xl border-2 border-slate-200 bg-slate-50 px-3 py-4 font-black text-slate-700 outline-none focus:border-blue-500"
                >
                  <option value="">
                    日本の生活・産業
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
                        {option}
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
          onClick={check}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          つながりをチェック
        </button>
      )}

      <ResultBox
        status={status}
        mission={mission}
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
          onClick={reset}
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

function DailyLifeHuntMission({
  mission,
  onClear,
  alreadyCompleted,
}) {
  const minChars =
    mission?.challenge
      ?.minChars ?? 20;

  const evidencePrompt =
    mission?.challenge
      ?.evidencePrompt ||
    '見つけた根拠を書いてください。';

  const [
    connectionText,
    setConnectionText,
  ] = useState('');

  const [
    evidenceText,
    setEvidenceText,
  ] = useState('');

  const [confirmed, setConfirmed] =
    useState(false);

  const [status, setStatus] =
    useState(null);

  const connectionReady =
    connectionText.trim()
      .length >= minChars;

  const evidenceReady =
    evidenceText.trim()
      .length >= 8;

  const ready =
    connectionReady &&
    evidenceReady &&
    confirmed;

  const submit = () => {
    if (!ready) {
      return;
    }

    setStatus(true);
    onClear(mission);
  };

  return (
    <div>
      <div className="rounded-3xl border border-cyan-100 bg-cyan-50 p-5 md:p-6">
        <p className="text-xs font-black tracking-[0.12em] text-cyan-700">
          FIND AUSTRALIA AROUND YOU
        </p>

        <p className="mt-2 font-bold leading-relaxed text-slate-700">
          家、学校、給食、スーパー、街などから、
          オーストラリアとのつながりを1つ探してください。
        </p>

        <p className="mt-2 text-sm font-bold text-cyan-700">
          商品名だけではなく、
          「なぜAustraliaとつながっていると考えたのか」まで書きます。
        </p>
      </div>

      <div className="mt-5">
        <label
          htmlFor={`${mission.id}-connection`}
          className="text-sm font-black text-slate-700"
        >
          ① 見つけたもの・つながり
        </label>

        <textarea
          id={`${mission.id}-connection`}
          value={
            connectionText
          }
          disabled={
            status === true
          }
          onChange={(
            event
          ) =>
            setConnectionText(
              event.target.value
            )
          }
          rows={4}
          placeholder="例：スーパーでオーストラリア産と書かれた商品を見つけた。..."
          className="mt-2 w-full resize-none rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-bold text-slate-800 outline-none focus:border-cyan-500"
        />

        <p
          className={`mt-2 text-xs font-black ${
            connectionReady
              ? 'text-emerald-600'
              : 'text-slate-400'
          }`}
        >
          {
            connectionText.trim()
              .length
          }{' '}
          / minimum{' '}
          {minChars} characters
        </p>
      </div>

      <div className="mt-5">
        <label
          htmlFor={`${mission.id}-evidence`}
          className="text-sm font-black text-slate-700"
        >
          ② 根拠
        </label>

        <p className="mt-1 text-sm font-bold text-slate-500">
          {evidencePrompt}
        </p>

        <textarea
          id={`${mission.id}-evidence`}
          value={
            evidenceText
          }
          disabled={
            status === true
          }
          onChange={(
            event
          ) =>
            setEvidenceText(
              event.target.value
            )
          }
          rows={3}
          placeholder="例：原産国表示にAustraliaと書かれていた。"
          className="mt-2 w-full resize-none rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-bold text-slate-800 outline-none focus:border-cyan-500"
        />
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={
            status === true
          }
          onChange={(
            event
          ) =>
            setConfirmed(
              event.target.checked
            )
          }
          className="mt-1 h-5 w-5"
        />

        <span className="text-sm font-bold leading-relaxed text-slate-600">
          商品表示・原産国・原料・資料などを実際に確認してから書きました。
        </span>
      </label>

      {status !== true && (
        <button
          type="button"
          disabled={!ready}
          onClick={submit}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-cyan-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          Observation Missionを完了
        </button>
      )}

      <ResultBox
        status={status}
        mission={mission}
        alreadyCompleted={
          alreadyCompleted
        }
        detail="身近な場所から世界とのつながりを、自分の根拠を使って記録しました。"
      />

      <p className="mt-4 text-xs font-bold leading-relaxed text-slate-400">
        このMissionは正解を選ぶ問題ではなく、
        実際の表示や資料を観察して根拠を記録する学習です。
      </p>
    </div>
  );
}

function QuizCreatorMission({
  mission,
  onClear,
  alreadyCompleted,
}) {
  const minExplanationChars =
    mission?.challenge
      ?.minExplanationChars ??
    30;

  const [question, setQuestion] =
    useState('');

  const [
    correctAnswer,
    setCorrectAnswer,
  ] = useState('');

  const [
    wrongAnswer1,
    setWrongAnswer1,
  ] = useState('');

  const [
    wrongAnswer2,
    setWrongAnswer2,
  ] = useState('');

  const [
    wrongAnswer3,
    setWrongAnswer3,
  ] = useState('');

  const [
    explanation,
    setExplanation,
  ] = useState('');

  const [
    factChecked,
    setFactChecked,
  ] = useState(false);

  const [
    choicesChecked,
    setChoicesChecked,
  ] = useState(false);

  const [status, setStatus] =
    useState(null);

  const allAnswers = [
    correctAnswer,
    wrongAnswer1,
    wrongAnswer2,
    wrongAnswer3,
  ];

  const normalizedAnswers =
    allAnswers
      .map(
        (answer) =>
          answer
            .trim()
            .toLowerCase()
      )
      .filter(Boolean);

  const uniqueAnswerCount =
    new Set(
      normalizedAnswers
    ).size;

  const questionReady =
    question.trim().length >=
    12;

  const answersReady =
    normalizedAnswers.length ===
      4 &&
    uniqueAnswerCount === 4;

  const explanationReady =
    explanation.trim().length >=
    minExplanationChars;

  const ready =
    questionReady &&
    answersReady &&
    explanationReady &&
    factChecked &&
    choicesChecked;

  const submit = () => {
    if (!ready) {
      return;
    }

    setStatus(true);
    onClear(mission);
  };

  return (
    <div>
      <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5 md:p-6">
        <p className="text-xs font-black tracking-[0.12em] text-violet-600">
          CREATE A JAPAN CONNECTION QUIZ
        </p>

        <p className="mt-2 font-bold leading-relaxed text-slate-700">
          学習したAustraliaと日本のつながりを使って、
          他の人に出せる4択問題を自分で作ります。
        </p>

        <p className="mt-2 text-sm font-bold text-violet-700">
          問題だけでなく、
          正解・誤答3つ・解説まで必要です。
        </p>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <label
            htmlFor={`${mission.id}-question`}
            className="text-sm font-black text-slate-700"
          >
            QUESTION
          </label>

          <textarea
            id={`${mission.id}-question`}
            value={question}
            disabled={
              status === true
            }
            onChange={(
              event
            ) =>
              setQuestion(
                event.target.value
              )
            }
            rows={2}
            placeholder="例：Australiaと日本のつながりについて..."
            className="mt-2 w-full resize-none rounded-2xl border-2 border-slate-200 px-4 py-3 font-bold outline-none focus:border-violet-500"
          />
        </div>

        <div>
          <label
            htmlFor={`${mission.id}-correct`}
            className="text-sm font-black text-emerald-700"
          >
            CORRECT ANSWER
          </label>

          <input
            id={`${mission.id}-correct`}
            value={
              correctAnswer
            }
            disabled={
              status === true
            }
            onChange={(
              event
            ) =>
              setCorrectAnswer(
                event.target.value
              )
            }
            className="mt-2 w-full rounded-2xl border-2 border-emerald-200 px-4 py-3 font-bold outline-none focus:border-emerald-500"
          />
        </div>

        {[
          {
            value:
              wrongAnswer1,
            setter:
              setWrongAnswer1,
            number: 1,
          },
          {
            value:
              wrongAnswer2,
            setter:
              setWrongAnswer2,
            number: 2,
          },
          {
            value:
              wrongAnswer3,
            setter:
              setWrongAnswer3,
            number: 3,
          },
        ].map(
          (item) => (
            <div
              key={
                item.number
              }
            >
              <label
                htmlFor={`${mission.id}-wrong-${item.number}`}
                className="text-sm font-black text-orange-700"
              >
                WRONG ANSWER{' '}
                {item.number}
              </label>

              <input
                id={`${mission.id}-wrong-${item.number}`}
                value={
                  item.value
                }
                disabled={
                  status ===
                  true
                }
                onChange={(
                  event
                ) =>
                  item.setter(
                    event.target
                      .value
                  )
                }
                className="mt-2 w-full rounded-2xl border-2 border-orange-200 px-4 py-3 font-bold outline-none focus:border-orange-500"
              />
            </div>
          )
        )}

        <div>
          <label
            htmlFor={`${mission.id}-explanation`}
            className="text-sm font-black text-blue-700"
          >
            EXPLANATION
          </label>

          <textarea
            id={`${mission.id}-explanation`}
            value={
              explanation
            }
            disabled={
              status === true
            }
            onChange={(
              event
            ) =>
              setExplanation(
                event.target.value
              )
            }
            rows={4}
            placeholder="なぜその答えが正しいのか説明してください。"
            className="mt-2 w-full resize-none rounded-2xl border-2 border-blue-200 px-4 py-3 font-bold outline-none focus:border-blue-500"
          />

          <p
            className={`mt-2 text-xs font-black ${
              explanationReady
                ? 'text-emerald-600'
                : 'text-slate-400'
            }`}
          >
            {
              explanation.trim()
                .length
            }{' '}
            / minimum{' '}
            {
              minExplanationChars
            }{' '}
            characters
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={
              factChecked
            }
            disabled={
              status === true
            }
            onChange={(
              event
            ) =>
              setFactChecked(
                event.target.checked
              )
            }
            className="mt-1 h-5 w-5"
          />

          <span className="text-sm font-bold leading-relaxed text-slate-600">
            Country Missionで学習した内容や資料を確認してから問題を作りました。
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={
              choicesChecked
            }
            disabled={
              status === true
            }
            onChange={(
              event
            ) =>
              setChoicesChecked(
                event.target.checked
              )
            }
            className="mt-1 h-5 w-5"
          />

          <span className="text-sm font-bold leading-relaxed text-slate-600">
            正解1つと誤答3つが重複していないことを確認しました。
          </span>
        </label>
      </div>

      {normalizedAnswers.length ===
        4 &&
        uniqueAnswerCount <
          4 && (
          <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-700">
            選択肢に同じ内容があります。
            4つすべて違う答えにしてください。
          </div>
        )}

      {status !== true && (
        <button
          type="button"
          disabled={!ready}
          onClick={submit}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          My Quizを完成
        </button>
      )}

      <ResultBox
        status={status}
        mission={mission}
        alreadyCompleted={
          alreadyCompleted
        }
        detail="自分で問題・選択肢・解説まで作成しました。"
      />

      <p className="mt-4 text-xs font-bold leading-relaxed text-slate-400">
        現在のCreator Missionでは、
        入力内容・選択肢の重複・解説量などを自動確認します。
        問題内容そのもののAIによる事実確認は、今後のReview機能で追加できます。
      </p>
    </div>
  );
}

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
        mission={mission}
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
        mission={mission}
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
        mission={mission}
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
        mission={mission}
        onClear={
          onComplete
        }
        alreadyCompleted={
          alreadyCompleted
        }
      />
    );
  }

  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="mb-3 text-4xl">
        🇯🇵
      </div>

      <p className="font-black text-slate-700">
        Japan Connection Missionは準備中です。
      </p>
    </div>
  );
}