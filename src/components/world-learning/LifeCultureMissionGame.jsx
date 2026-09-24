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
  correctCount,
  totalCount,
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

            <p className="mt-1 text-sm font-bold opacity-80">
              {correctCount} / {totalCount} 個が正しい分類です。
              地域と気候の特徴をもう一度比べてみましょう。
            </p>
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

      <div className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 font-black text-white">
        {alreadyCompleted
          ? 'REVIEW COMPLETE'
          : `+${mission.points} WP`}
      </div>
    </div>
  );
}

function RegionSortMission({
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
    setStatus(null);
    setCorrectCount(0);
  };

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <div className="mb-3 text-4xl">
          🏠
        </div>

        <p className="font-black text-slate-700">
          このMissionの分類データが見つかりません。
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 rounded-3xl border border-sky-100 bg-sky-50 p-5">
        <p className="text-xs font-black tracking-[0.12em] text-sky-600">
          CLIMATE & REGION SORT
        </p>

        <p className="mt-2 font-bold leading-relaxed text-slate-700">
          同じ国の中でも、場所が変わると気候や暮らしの条件は変わります。
          3つの都市を最も合う地域に分類してください。
        </p>
      </div>

      <div className="space-y-5">
        {items.map(
          (
            item,
            index
          ) => {
            const selected =
              answers[index];

            const selectedIsWrong =
              status === false &&
              selected &&
              selected !==
                item.target;

            return (
              <div
                key={`${mission.id}-${item.name}`}
                className={`rounded-3xl border-2 p-5 transition-all ${
                  selectedIsWrong
                    ? 'border-orange-300 bg-orange-50'
                    : selected
                      ? 'border-blue-300 bg-blue-50/40'
                      : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black tracking-[0.12em] text-slate-400">
                      PLACE {index + 1}
                    </p>

                    <h3 className="mt-1 text-2xl font-black text-slate-900">
                      {item.name}
                    </h3>
                  </div>

                  <div
                    className="text-3xl"
                    aria-hidden="true"
                  >
                    {index === 0
                      ? '🌴'
                      : index === 1
                        ? '🏜️'
                        : '🌤️'}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {categories.map(
                    (
                      category
                    ) => {
                      const isSelected =
                        selected ===
                        category;

                      return (
                        <button
                          key={`${item.name}-${category}`}
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
                          className={`rounded-2xl border-2 px-3 py-3 text-sm font-black transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {category}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            );
          }
        )}
      </div>

      {status !== true && (
        <button
          type="button"
          disabled={
            !allAnswered
          }
          onClick={check}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          3つの地域をチェック
        </button>
      )}

      <ResultBox
        status={status}
        mission={mission}
        alreadyCompleted={
          alreadyCompleted
        }
        correctCount={
          correctCount
        }
        totalCount={
          items.length
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

export default function LifeCultureMissionGame({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  if (
    mission.type ===
    'region-sort'
  ) {
    return (
      <RegionSortMission
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
        🏠
      </div>

      <p className="font-black text-slate-700">
        Life & Culture Missionは準備中です。
      </p>
    </div>
  );
}