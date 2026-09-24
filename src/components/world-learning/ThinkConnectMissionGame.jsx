import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

import { useMemo, useState } from 'react';

const COMPARE_CATEGORIES = [
  '地理・自然',
  '学校・教育',
  '食・生活',
  '文化・スポーツ',
  '都市・社会',
  '国際交流',
];

const QUESTION_DOMAINS = [
  '地理・自然',
  '学校・生活',
  'ことば',
  '文化',
  '日本とのつながり',
  '考え方・価値観',
];

const CAPSTONE_DOMAIN_LABELS = {
  place: '🌍 PLACE',
  time: '⏰ TIME',
  language: '🗣 LANGUAGE',
  lifeCulture: '🏠 LIFE & CULTURE',
  japanConnection: '🇯🇵 JAPAN CONNECTION',
};

function ResultBox({
  status,
  mission,
  alreadyCompleted,
  detail,
}) {
  if (status === null) return null;

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

function CompareBuilderMission({
  mission,
  onClear,
  alreadyCompleted,
}) {
  const isDifferenceMode =
    Boolean(
      mission?.challenge
        ?.minDifferences
    );

  const requiredItems =
    isDifferenceMode
      ? mission.challenge
          .minDifferences ?? 3
      : mission?.challenge
          ?.minItems ?? 3;

  const [
    entries,
    setEntries,
  ] = useState(() =>
    Array.from(
      {
        length:
          requiredItems,
      },
      () => ({
        category: '',
        text: '',
      })
    )
  );

  const [
    reason,
    setReason,
  ] = useState('');

  const [
    checkedPerspective,
    setCheckedPerspective,
  ] = useState(false);

  const [
    status,
    setStatus,
  ] = useState(null);

  const selectedCategories =
    entries
      .map(
        (entry) =>
          entry.category
      )
      .filter(Boolean);

  const uniqueCategoryCount =
    new Set(
      selectedCategories
    ).size;

  const requireDifferentCategories =
    mission?.challenge
      ?.requireDifferentCategories ??
    !isDifferenceMode;

  const entriesReady =
    entries.every(
      (entry) =>
        entry.category &&
        entry.text.trim()
          .length >= 8
    );

  const categoryReady =
    !requireDifferentCategories ||
    uniqueCategoryCount ===
      entries.length;

  const reasonReady =
    !isDifferenceMode ||
    reason.trim().length >=
      20;

  const ready =
    entriesReady &&
    categoryReady &&
    reasonReady &&
    checkedPerspective;

  const updateEntry = (
    index,
    key,
    value
  ) => {
    setEntries(
      (current) =>
        current.map(
          (
            entry,
            entryIndex
          ) =>
            entryIndex ===
            index
              ? {
                  ...entry,
                  [key]:
                    value,
                }
              : entry
        )
    );

    setStatus(null);
  };

  const submit = () => {
    if (!ready) {
      setStatus(false);
      return;
    }

    setStatus(true);
    onClear(mission);
  };

  const reset = () => {
    setEntries(
      Array.from(
        {
          length:
            requiredItems,
        },
        () => ({
          category: '',
          text: '',
        })
      )
    );

    setReason('');
    setCheckedPerspective(
      false
    );
    setStatus(null);
  };

  return (
    <div>
      <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5 md:p-6">
        <p className="text-xs font-black tracking-[0.12em] text-indigo-600">
          COMPARE & THINK
        </p>

        <p className="mt-2 font-bold leading-relaxed text-slate-700">
          {isDifferenceMode
            ? '違いを並べるだけでなく、その背景まで考えます。'
            : '同じ視点に偏らず、異なる角度から共通点を見つけます。'}
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {entries.map(
          (
            entry,
            index
          ) => (
            <div
              key={`${mission.id}-compare-${index}`}
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-black tracking-[0.12em] text-slate-400">
                {isDifferenceMode
                  ? 'DIFFERENCE'
                  : 'SIMILARITY'}{' '}
                {index + 1}
              </p>

              <select
                value={
                  entry.category
                }
                disabled={
                  status ===
                  true
                }
                onChange={(
                  event
                ) =>
                  updateEntry(
                    index,
                    'category',
                    event.target
                      .value
                  )
                }
                className="mt-3 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-700 outline-none focus:border-indigo-500"
              >
                <option value="">
                  カテゴリーを選ぶ
                </option>

                {COMPARE_CATEGORIES.map(
                  (
                    category
                  ) => (
                    <option
                      key={
                        category
                      }
                      value={
                        category
                      }
                    >
                      {category}
                    </option>
                  )
                )}
              </select>

              <textarea
                value={
                  entry.text
                }
                disabled={
                  status ===
                  true
                }
                onChange={(
                  event
                ) =>
                  updateEntry(
                    index,
                    'text',
                    event.target
                      .value
                  )
                }
                rows={2}
                placeholder={
                  isDifferenceMode
                    ? 'どんな違いがある？'
                    : 'どんな共通点がある？'
                }
                className="mt-3 w-full resize-none rounded-2xl border-2 border-slate-200 px-4 py-3 font-bold text-slate-800 outline-none focus:border-indigo-500"
              />
            </div>
          )
        )}
      </div>

      {isDifferenceMode && (
        <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <label
            htmlFor={`${mission.id}-reason`}
            className="text-sm font-black text-amber-800"
          >
            そのうち1つについて
            「なぜ違うのか」を説明
          </label>

          <textarea
            id={`${mission.id}-reason`}
            value={reason}
            disabled={
              status === true
            }
            onChange={(
              event
            ) => {
              setReason(
                event.target.value
              );

              setStatus(null);
            }}
            rows={4}
            placeholder="緯度、国土、歴史、人口分布、文化などを手がかりに考えよう。"
            className="mt-3 w-full resize-none rounded-2xl border-2 border-amber-200 bg-white px-4 py-3 font-bold text-slate-800 outline-none focus:border-amber-500"
          />

          <p
            className={`mt-2 text-xs font-black ${
              reasonReady
                ? 'text-emerald-600'
                : 'text-slate-400'
            }`}
          >
            {
              reason.trim()
                .length
            }{' '}
            / minimum 20
            characters
          </p>
        </div>
      )}

      {requireDifferentCategories &&
        selectedCategories.length ===
          entries.length &&
        !categoryReady && (
          <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-700">
            同じカテゴリーが重複しています。
            異なる視点を使ってください。
          </div>
        )}

      <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={
            checkedPerspective
          }
          disabled={
            status === true
          }
          onChange={(
            event
          ) => {
            setCheckedPerspective(
              event.target
                .checked
            );

            setStatus(null);
          }}
          className="mt-1 h-5 w-5"
        />

        <span className="text-sm font-bold leading-relaxed text-slate-600">
          1つのイメージだけで決めつけず、
          これまでのMissionで学んだ内容を使って考えました。
        </span>
      </label>

      {status !== true && (
        <button
          type="button"
          disabled={!ready}
          onClick={submit}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          比較を完成する
        </button>
      )}

      <ResultBox
        status={status}
        mission={mission}
        alreadyCompleted={
          alreadyCompleted
        }
        detail={
          status === true
            ? `${requiredItems}つの視点を使って比較できました。`
            : '必要な数・カテゴリー・説明をすべて満たしてください。'
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
          最初からやり直す
        </button>
      )}
    </div>
  );
}

function EvidenceCheckMission({
  mission,
  onClear,
  alreadyCompleted,
}) {
  const evidenceOptions =
    useMemo(
      () =>
        mission?.challenge
          ?.evidenceOptions ??
        [],
      [
        mission?.challenge
          ?.evidenceOptions,
      ]
    );

  const [
    judgement,
    setJudgement,
  ] = useState('');

  const [
    selectedEvidence,
    setSelectedEvidence,
  ] = useState([]);

  const [
    status,
    setStatus,
  ] = useState(null);

  const requiredEvidenceCount =
    mission?.challenge
      ?.requiredEvidenceCount ??
    2;

  const correctJudgement =
    mission?.challenge
      ?.correctJudgement;

  const toggleEvidence = (
    id
  ) => {
    setSelectedEvidence(
      (current) =>
        current.includes(id)
          ? current.filter(
              (item) =>
                item !== id
            )
          : [
              ...current,
              id,
            ]
    );

    setStatus(null);
  };

  const check = () => {
    const selected =
      evidenceOptions.filter(
        (item) =>
          selectedEvidence.includes(
            item.id
          )
      );

    const validSelected =
      selected.filter(
        (item) =>
          item.valid
      );

    const invalidSelected =
      selected.filter(
        (item) =>
          !item.valid
      );

    const correct =
      judgement ===
        correctJudgement &&
      validSelected.length >=
        requiredEvidenceCount &&
      invalidSelected.length ===
        0;

    setStatus(correct);

    if (correct) {
      onClear(mission);
    }
  };

  const ready =
    judgement &&
    selectedEvidence.length >=
      requiredEvidenceCount;

  return (
    <div>
      <div className="rounded-3xl border border-fuchsia-100 bg-fuchsia-50 p-5 md:p-6">
        <p className="text-xs font-black tracking-[0.12em] text-fuchsia-600">
          EVIDENCE CHECK
        </p>

        <p className="mt-3 text-lg font-black leading-relaxed text-slate-800">
          「
          {
            mission
              ?.challenge
              ?.claim
          }
          」
        </p>

        <p className="mt-2 font-bold text-slate-600">
          この説明を評価し、
          根拠を最低
          {
            requiredEvidenceCount
          }
          つ選んでください。
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          '正確',
          '一部正確',
          '不正確',
        ].map(
          (
            option
          ) => (
            <button
              key={option}
              type="button"
              disabled={
                status ===
                true
              }
              onClick={() => {
                setJudgement(
                  option
                );

                setStatus(
                  null
                );
              }}
              className={`rounded-2xl border-2 px-4 py-4 font-black transition-all ${
                judgement ===
                option
                  ? 'border-fuchsia-500 bg-fuchsia-500 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-fuchsia-300 hover:bg-fuchsia-50'
              }`}
            >
              {option}
            </button>
          )
        )}
      </div>

      <div className="mt-6 space-y-3">
        {evidenceOptions.map(
          (item) => {
            const selected =
              selectedEvidence.includes(
                item.id
              );

            return (
              <button
                key={
                  item.id
                }
                type="button"
                disabled={
                  status ===
                  true
                }
                onClick={() =>
                  toggleEvidence(
                    item.id
                  )
                }
                className={`w-full rounded-2xl border-2 p-4 text-left font-bold transition-all ${
                  selected
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                }`}
              >
                <span className="mr-3">
                  {selected
                    ? '✓'
                    : '○'}
                </span>

                {item.text}
              </button>
            );
          }
        )}
      </div>

      {evidenceOptions.length ===
        0 && (
          <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-700">
            evidenceOptions が
            missions_a.json
            にありません。
            下の手順で追加してください。
          </div>
        )}

      {status !== true && (
        <button
          type="button"
          disabled={
            !ready ||
            evidenceOptions.length ===
              0
          }
          onClick={check}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-fuchsia-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          判断と根拠をチェック
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
            ? '判断だけでなく、その判断を支える根拠の組み合わせも見直してみよう。'
            : '主張をそのまま受け取らず、複数の根拠で検証できました。'
        }
      />
    </div>
  );
}

function QuestionCreatorMission({
  mission,
  onClear,
  alreadyCompleted,
}) {
  const minQuestions =
    mission?.challenge
      ?.minQuestions ??
    3;

  const minDomains =
    mission?.challenge
      ?.minDomains ??
    2;

  const [
    questions,
    setQuestions,
  ] = useState(() =>
    Array.from(
      {
        length:
          minQuestions,
      },
      () => ({
        domain: '',
        text: '',
      })
    )
  );

  const [
    openQuestionChecked,
    setOpenQuestionChecked,
  ] = useState(false);

  const [
    respectChecked,
    setRespectChecked,
  ] = useState(false);

  const [
    status,
    setStatus,
  ] = useState(null);

  const updateQuestion = (
    index,
    key,
    value
  ) => {
    setQuestions(
      (current) =>
        current.map(
          (
            question,
            questionIndex
          ) =>
            questionIndex ===
            index
              ? {
                  ...question,
                  [key]:
                    value,
                }
              : question
        )
    );

    setStatus(null);
  };

  const usedDomains =
    new Set(
      questions
        .map(
          (question) =>
            question.domain
        )
        .filter(Boolean)
    );

  const questionsReady =
    questions.every(
      (question) =>
        question.domain &&
        question.text.trim()
          .length >= 10
    );

  const domainReady =
    usedDomains.size >=
    minDomains;

  const ready =
    questionsReady &&
    domainReady &&
    openQuestionChecked &&
    respectChecked;

  const submit = () => {
    if (!ready) return;

    setStatus(true);
    onClear(mission);
  };

  return (
    <div>
      <div className="rounded-3xl border border-teal-100 bg-teal-50 p-5 md:p-6">
        <p className="text-xs font-black tracking-[0.12em] text-teal-700">
          REAL EXCHANGE PREP
        </p>

        <p className="mt-2 font-bold leading-relaxed text-slate-700">
          実際に同年代の相手へ聞くことを想像し、
          相手が自分の経験や考えを話せる質問を作ります。
        </p>
      </div>

      <div className="mt-5 space-y-4">
        {questions.map(
          (
            question,
            index
          ) => (
            <div
              key={`${mission.id}-question-${index}`}
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >
              <p className="text-xs font-black tracking-[0.12em] text-slate-400">
                QUESTION{' '}
                {index + 1}
              </p>

              <select
                value={
                  question.domain
                }
                disabled={
                  status ===
                  true
                }
                onChange={(
                  event
                ) =>
                  updateQuestion(
                    index,
                    'domain',
                    event.target
                      .value
                  )
                }
                className="mt-3 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-black text-slate-700 outline-none focus:border-teal-500"
              >
                <option value="">
                  質問の分野
                </option>

                {QUESTION_DOMAINS.map(
                  (
                    domain
                  ) => (
                    <option
                      key={
                        domain
                      }
                      value={
                        domain
                      }
                    >
                      {domain}
                    </option>
                  )
                )}
              </select>

              <textarea
                value={
                  question.text
                }
                disabled={
                  status ===
                  true
                }
                onChange={(
                  event
                ) =>
                  updateQuestion(
                    index,
                    'text',
                    event.target
                      .value
                  )
                }
                rows={2}
                placeholder="相手に本当に聞いてみたい質問を書こう。"
                className="mt-3 w-full resize-none rounded-2xl border-2 border-slate-200 px-4 py-3 font-bold text-slate-800 outline-none focus:border-teal-500"
              />
            </div>
          )
        )}
      </div>

      {questionsReady &&
        !domainReady && (
          <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-700">
            少なくとも
            {minDomains}
            つの異なる分野から質問を作ってください。
          </div>
        )}

      <div className="mt-5 space-y-3">
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={
              openQuestionChecked
            }
            disabled={
              status === true
            }
            onChange={(
              event
            ) => {
              setOpenQuestionChecked(
                event.target
                  .checked
              );

              setStatus(null);
            }}
            className="mt-1 h-5 w-5"
          />

          <span className="text-sm font-bold leading-relaxed text-slate-600">
            Yes / No
            だけで終わらず、
            相手が説明しやすい質問を意識しました。
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={
              respectChecked
            }
            disabled={
              status === true
            }
            onChange={(
              event
            ) => {
              setRespectChecked(
                event.target
                  .checked
              );

              setStatus(null);
            }}
            className="mt-1 h-5 w-5"
          />

          <span className="text-sm font-bold leading-relaxed text-slate-600">
            「Australiaの人はみんな○○だ」
            と決めつける質問になっていないことを確認しました。
          </span>
        </label>
      </div>

      {status !== true && (
        <button
          type="button"
          disabled={!ready}
          onClick={submit}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          交流質問を完成
        </button>
      )}

      <ResultBox
        status={status}
        mission={mission}
        alreadyCompleted={
          alreadyCompleted
        }
        detail={`${minQuestions}つの質問を、${usedDomains.size}分野から作成しました。`}
      />
    </div>
  );
}

function CreatorCapstoneMission({
  mission,
  onClear,
  alreadyCompleted,
}) {
  const requiredDomains =
    mission?.challenge
      ?.requiredDomains ??
    [];

  const [
    items,
    setItems,
  ] = useState(() =>
    requiredDomains.map(
      (domain) => ({
        domain,
        question: '',
        answer: '',
        explanation: '',
      })
    )
  );

  const [
    factChecked,
    setFactChecked,
  ] = useState(false);

  const [
    learnerChecked,
    setLearnerChecked,
  ] = useState(false);

  const [
    status,
    setStatus,
  ] = useState(null);

  const updateItem = (
    index,
    key,
    value
  ) => {
    setItems(
      (current) =>
        current.map(
          (
            item,
            itemIndex
          ) =>
            itemIndex ===
            index
              ? {
                  ...item,
                  [key]:
                    value,
                }
              : item
        )
    );

    setStatus(null);
  };

  const uniqueQuestions =
    new Set(
      items
        .map(
          (item) =>
            item.question
              .trim()
              .toLowerCase()
        )
        .filter(Boolean)
    );

  const contentReady =
    items.every(
      (item) =>
        item.question.trim()
          .length >= 12 &&
        item.answer.trim()
          .length >= 2 &&
        item.explanation.trim()
          .length >= 20
    );

  const uniqueReady =
    uniqueQuestions.size ===
    items.length;

  const ready =
    contentReady &&
    uniqueReady &&
    factChecked &&
    learnerChecked;

  const submit = () => {
    if (!ready) return;

    setStatus(true);
    onClear(mission);
  };

  return (
    <div>
      <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 to-blue-50 p-5 md:p-6">
        <p className="text-xs font-black tracking-[0.12em] text-violet-600">
          AUSTRALIA MASTER
          CAPSTONE
        </p>

        <h3 className="mt-2 text-2xl font-black text-slate-900">
          学んだことを、
          今度は「教える側」に再構成しよう。
        </h3>

        <p className="mt-2 font-bold leading-relaxed text-slate-600">
          5つの分野それぞれから1問ずつ、
          答えと解説まで作ります。
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {items.map(
          (
            item,
            index
          ) => (
            <div
              key={`${mission.id}-${item.domain}`}
              className="rounded-3xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-lg font-black text-slate-800">
                  {CAPSTONE_DOMAIN_LABELS[
                    item.domain
                  ] ||
                    item.domain}
                </p>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                  Q{index + 1}
                </span>
              </div>

              <textarea
                value={
                  item.question
                }
                disabled={
                  status ===
                  true
                }
                onChange={(
                  event
                ) =>
                  updateItem(
                    index,
                    'question',
                    event.target
                      .value
                  )
                }
                rows={2}
                placeholder="問題を書く"
                className="mt-4 w-full resize-none rounded-2xl border-2 border-slate-200 px-4 py-3 font-bold text-slate-800 outline-none focus:border-violet-500"
              />

              <input
                value={
                  item.answer
                }
                disabled={
                  status ===
                  true
                }
                onChange={(
                  event
                ) =>
                  updateItem(
                    index,
                    'answer',
                    event.target
                      .value
                  )
                }
                placeholder="正解を書く"
                className="mt-3 w-full rounded-2xl border-2 border-emerald-200 px-4 py-3 font-bold text-slate-800 outline-none focus:border-emerald-500"
              />

              <textarea
                value={
                  item.explanation
                }
                disabled={
                  status ===
                  true
                }
                onChange={(
                  event
                ) =>
                  updateItem(
                    index,
                    'explanation',
                    event.target
                      .value
                  )
                }
                rows={3}
                placeholder="なぜその答えなのか、学習者に分かるように説明する"
                className="mt-3 w-full resize-none rounded-2xl border-2 border-blue-200 px-4 py-3 font-bold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          )
        )}
      </div>

      {!uniqueReady &&
        items.every(
          (item) =>
            item.question.trim()
        ) && (
          <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-700">
            同じ問題を繰り返さず、
            5分野それぞれで違う問題を作ってください。
          </div>
        )}

      <div className="mt-5 space-y-3">
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
            ) => {
              setFactChecked(
                event.target
                  .checked
              );

              setStatus(null);
            }}
            className="mt-1 h-5 w-5"
          />

          <span className="text-sm font-bold leading-relaxed text-slate-600">
            Country Missionで学習した内容や資料を確認し、
            答えを推測だけで作っていません。
          </span>
        </label>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input
            type="checkbox"
            checked={
              learnerChecked
            }
            disabled={
              status === true
            }
            onChange={(
              event
            ) => {
              setLearnerChecked(
                event.target
                  .checked
              );

              setStatus(null);
            }}
            className="mt-1 h-5 w-5"
          />

          <span className="text-sm font-bold leading-relaxed text-slate-600">
            まだAustraliaを学んでいない友達でも、
            解説を読めば学べる内容になっていることを確認しました。
          </span>
        </label>
      </div>

      {status !== true && (
        <button
          type="button"
          disabled={!ready}
          onClick={submit}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-violet-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          Australia Master Quizを完成
        </button>
      )}

      <ResultBox
        status={status}
        mission={mission}
        alreadyCompleted={
          alreadyCompleted
        }
        detail={`${items.length}分野の問題・正解・解説を完成しました。`}
      />

      <p className="mt-4 text-xs font-bold leading-relaxed text-slate-400">
        現段階では形式・分野・説明量などを自動確認します。
        内容そのもののAIレビューや教師承認は、
        次の拡張で「Verified Mission」として追加できます。
      </p>
    </div>
  );
}

export default function ThinkConnectMissionGame({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  if (
    mission.type ===
    'compare-builder'
  ) {
    return (
      <CompareBuilderMission
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
    'evidence-check'
  ) {
    return (
      <EvidenceCheckMission
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
    'question-creator'
  ) {
    return (
      <QuestionCreatorMission
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
    'creator-capstone'
  ) {
    return (
      <CreatorCapstoneMission
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
        🧠
      </div>

      <p className="font-black text-slate-700">
        Think & Connect Missionは準備中です。
      </p>
    </div>
  );
}