import {
  Check,
  Save,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import {
  playUiSound,
} from '../../../utils/uiSound';


function WrongHint({
  text,
}) {
  return (
    <div
      className="
        mt-3
        rounded-xl
        border
        border-orange-200
        bg-orange-50
        px-3
        py-2.5
        text-xs
        font-bold
        leading-5
        text-orange-700
      "
    >
      💡 {
        text
      }
    </div>
  );
}


function SingleChoiceFlow({
  mission,
  interaction,
  onClear,
}) {
  const questions =
    interaction
      ?.questions ??
    mission
      ?.challenge
      ?.questions ??
    [];

  const [
    index,
    setIndex,
  ] = useState(
    0
  );

  const [
    wrong,
    setWrong,
  ] = useState(
    false
  );


  const question =
    questions[
      index
    ];


  if (
    !question
  ) {
    return null;
  }


  const choose =
    (
      choice
    ) => {
      if (
        !choice.correct
      ) {
        setWrong(
          true
        );

        playUiSound(
          'error'
        );

        return;
      }


      setWrong(
        false
      );

      playUiSound(
        'success'
      );


      if (
        index >=
        questions.length -
        1
      ) {
        window.setTimeout(
          () =>
            onClear(
              mission
            ),
          220
        );

        return;
      }


      window.setTimeout(
        () =>
          setIndex(
            (
              current
            ) =>
              current +
              1
          ),
        180
      );
    };


  return (
    <div
      className="
        flex
        h-full
        min-h-0
        flex-col
      "
    >
      <div
        className="
          flex
          items-center
          justify-between
          gap-3
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
          QUESTION {
            index +
            1
          }
        </p>

        <span
          className="
            rounded-full
            bg-violet-100
            px-2.5
            py-1
            text-[10px]
            font-black
            text-violet-700
          "
        >
          {
            index +
            1
          }
          /{
            questions.length
          }
        </span>
      </div>


      <p
        className="
          mt-3
          text-[17px]
          font-black
          leading-7
          text-slate-900
        "
      >
        {
          question.prompt
        }
      </p>


      <div
        className="
          mt-4
          grid
          gap-2.5
        "
      >
        {
          question
            .choices
            .map(
              (
                choice,
                choiceIndex
              ) => (
                <button
                  key={
                    `${question.id}-${choice.label}`
                  }
                  type="button"
                  onClick={() =>
                    choose(
                      choice
                    )
                  }
                  className="
                    flex
                    min-h-[54px]
                    w-full
                    items-center
                    gap-3
                    rounded-2xl
                    border-2
                    border-slate-200
                    bg-white
                    px-3.5
                    py-2.5
                    text-left
                    transition
                    hover:border-violet-400
                    hover:bg-violet-50
                  "
                >
                  <span
                    className="
                      flex
                      h-7
                      w-7
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-slate-100
                      text-[10px]
                      font-black
                      text-slate-500
                    "
                  >
                    {
                      [
                        'A',
                        'B',
                        'C',
                        'D',
                      ][
                        choiceIndex
                      ]
                    }
                  </span>

                  <span
                    className="
                      text-[13px]
                      font-black
                      leading-5
                      text-slate-700
                    "
                  >
                    {
                      choice.label
                    }
                  </span>
                </button>
              )
            )
        }
      </div>


      {
        wrong && (
          <WrongHint
            text={
              question
                .retry ??
              question
                .hint ??
              '右の記事から、答えの根拠を探してみよう。'
            }
          />
        )
      }
    </div>
  );
}


function FactSort({
  mission,
  interaction,
  onClear,
}) {
  const statements =
    interaction
      ?.statements ??
    [];

  const [
    answers,
    setAnswers,
  ] = useState(
    {}
  );

  const [
    wrong,
    setWrong,
  ] = useState(
    false
  );


  const normalizeChoice =
    (
      value
    ) => {
      const text =
        String(
          value ??
          ''
        )
          .trim()
          .toLowerCase();


      if (
        [
          'fact',
          '記事に書いてある',
          '書いてある',
          'written',
          'true',
        ].includes(
          text
        )
      ) {
        return 'fact';
      }


      if (
        [
          'assumption',
          '記事だけではわからない',
          'わからない',
          'not sure',
          'unknown',
          'false',
        ].includes(
          text
        )
      ) {
        return 'assumption';
      }


      return text;
    };


  const allAnswered =
    statements.every(
      (
        item
      ) =>
        Boolean(
          answers[
            item.id
          ]
        )
    );


  const check =
    () => {
      const correct =
        statements.every(
          (
            item
          ) =>
            normalizeChoice(
              answers[
                item.id
              ]
            ) ===
            normalizeChoice(
              item.answer
            )
        );


      playUiSound(
        correct
          ? 'success'
          : 'error'
      );


      if (
        correct
      ) {
        setWrong(
          false
        );

        onClear(
          mission
        );

        return;
      }


      setWrong(
        true
      );
    };


  return (
    <div
      className="
        flex
        h-full
        min-h-0
        flex-col
      "
    >
      <div
        className="
          grid
          grid-cols-2
          gap-3
        "
      >
        {
          statements.map(
            (
              item,
              index
            ) => (
              <div
                key={
                  item.id
                }
                className="
                  rounded-2xl
                  border
                  border-slate-200
                  bg-white
                  p-3.5
                "
              >
                <p
                  className="
                    min-h-[78px]
                    text-[15px]
                    font-black
                    leading-6
                    text-slate-900
                  "
                >
                  {
                    index +
                    1
                  }
                  .{' '}
                  {
                    item.text
                  }
                </p>


                <div
                  className="
                    mt-3
                    grid
                    grid-cols-2
                    gap-2
                  "
                >
                  {
                    [
                      [
                        'fact',
                        '書いてある',
                        '📖',
                      ],
                      [
                        'assumption',
                        'わからない',
                        '🤔',
                      ],
                    ].map(
                      (
                        [
                          value,
                          label,
                          icon,
                        ]
                      ) => {
                        const active =
                          normalizeChoice(
                            answers[
                              item.id
                            ]
                          ) ===
                          value;


                        return (
                          <button
                            key={
                              value
                            }
                            type="button"
                            onClick={() => {
                              setWrong(
                                false
                              );

                              setAnswers(
                                (
                                  current
                                ) => ({
                                  ...current,

                                  [
                                    item.id
                                  ]:
                                    value,
                                })
                              );
                            }}
                            className={`
                              flex
                              min-h-[48px]
                              items-center
                              justify-center
                              gap-1.5
                              rounded-xl
                              border-2
                              px-2
                              py-2.5
                              text-[13px]
                              font-black
                              leading-none
                              transition

                              ${
                                active
                                  ? value ===
                                    'fact'
                                    ? `
                                      border-emerald-500
                                      bg-emerald-50
                                      text-emerald-800
                                    `
                                    : `
                                      border-amber-500
                                      bg-amber-50
                                      text-amber-800
                                    `
                                  : `
                                    border-slate-200
                                    bg-slate-50
                                    text-slate-600
                                  `
                              }
                            `}
                          >
                            <span
                              aria-hidden="true"
                            >
                              {
                                icon
                              }
                            </span>

                            <span
                              className="
                                whitespace-nowrap
                              "
                            >
                              {
                                label
                              }
                            </span>
                          </button>
                        );
                      }
                    )
                  }
                </div>
              </div>
            )
          )
        }
      </div>


      <button
        type="button"
        disabled={
          !allAnswered
        }
        onClick={
          check
        }
        className="
          mt-4
          w-full
          rounded-xl
          bg-amber-500
          px-4
          py-3.5
          text-[15px]
          font-black
          text-white
          shadow-sm
          transition
          hover:bg-amber-600
          disabled:bg-slate-200
          disabled:text-slate-400
          disabled:shadow-none
        "
      >
        答え合わせ
      </button>


      {
        wrong && (
          <WrongHint
            text="もう一度、右の記事を見てみよう。「記事に書いてあるか」だけで考えると分かりやすいよ。"
          />
        )
      }
    </div>
  );
}


function MultiEvidence({
  mission,
  interaction,
  onClear,
}) {
  const options =
    interaction
      ?.options ??
    [];

  const correctIds =
    useMemo(
      () =>
        new Set(
          options
            .filter(
              (
                item
              ) =>
                item.correct
            )
            .map(
              (
                item
              ) =>
                item.id
            )
        ),
      [
        options,
      ]
    );

  const required =
    interaction
      ?.required ??
    correctIds.size;


  const [
    selected,
    setSelected,
  ] = useState(
    []
  );

  const [
    wrong,
    setWrong,
  ] = useState(
    false
  );


  const toggle =
    (
      id
    ) => {
      setWrong(
        false
      );

      setSelected(
        (
          current
        ) =>
          current.includes(
            id
          )
            ? current.filter(
                (
                  item
                ) =>
                  item !==
                  id
              )
            : [
                ...current,
                id,
              ]
      );
    };


  const check =
    () => {
      const correct =
        selected.length ===
          correctIds.size &&
        selected.every(
          (
            id
          ) =>
            correctIds.has(
              id
            )
        );


      playUiSound(
        correct
          ? 'success'
          : 'error'
      );


      if (
        correct
      ) {
        onClear(
          mission
        );

        return;
      }


      setWrong(
        true
      );
    };


  return (
    <div
      className="
        flex
        h-full
        min-h-0
        flex-col
      "
    >
      <div
        className="
          flex
          items-center
          justify-end
        "
      >
        <span
          className="
            rounded-full
            bg-cyan-50
            px-2.5
            py-1
            text-[10px]
            font-black
            text-cyan-700
          "
        >
          {
            selected.length
          }
          /{
            required
          }
          {' '}
          選択
        </span>
      </div>


      <div
        className="
          mt-2
          grid
          grid-cols-2
          gap-2.5
        "
      >
        {
          options.map(
            (
              item
            ) => {
              const active =
                selected.includes(
                  item.id
                );

              return (
                <button
                  key={
                    item.id
                  }
                  type="button"
                  onClick={() =>
                    toggle(
                      item.id
                    )
                  }
                  className={`
                    flex
                    min-h-[78px]
                    items-start
                    gap-2
                    rounded-2xl
                    border-2
                    p-3
                    text-left
                    transition

                    ${
                      active
                        ? `
                          border-cyan-500
                          bg-cyan-50
                        `
                        : `
                          border-slate-200
                          bg-white
                        `
                    }
                  `}
                >
                  <span
                    className={`
                      mt-0.5
                      flex
                      h-5
                      w-5
                      shrink-0
                      items-center
                      justify-center
                      rounded-md
                      border-2

                      ${
                        active
                          ? `
                            border-cyan-500
                            bg-cyan-500
                            text-white
                          `
                          : `
                            border-slate-300
                            bg-white
                          `
                      }
                    `}
                  >
                    {
                      active && (
                        <Check
                          size={12}
                          strokeWidth={3}
                        />
                      )
                    }
                  </span>

                  <span
                    className="
                      text-[11px]
                      font-black
                      leading-[1.5]
                      text-slate-700
                    "
                  >
                    {
                      item.label
                    }
                  </span>
                </button>
              );
            }
          )
        }
      </div>


      <button
        type="button"
        disabled={
          selected.length <
          required
        }
        onClick={
          check
        }
        className="
          mt-3
          w-full
          rounded-xl
          bg-cyan-600
          px-4
          py-3
          text-sm
          font-black
          text-white
          disabled:bg-slate-200
          disabled:text-slate-400
        "
      >
        答え合わせ
      </button>


      {
        wrong && (
          <WrongHint
            text="記事で実際に起きたことだけを選ぼう。"
          />
        )
      }
    </div>
  );
}


function QuestionSeeds({
  mission,
  interaction,
  countryCode,
  onClear,
}) {
  const seeds =
    interaction
      ?.seeds ??
    [];

  const required =
    interaction
      ?.required ??
    3;


  const [
    selected,
    setSelected,
  ] = useState(
    []
  );


  const toggle =
    (
      id
    ) => {
      setSelected(
        (
          current
        ) => {
          if (
            current.includes(
              id
            )
          ) {
            return current.filter(
              (
                item
              ) =>
                item !==
                id
            );
          }

          if (
            current.length >=
            required
          ) {
            return current;
          }

          return [
            ...current,
            id,
          ];
        }
      );
    };


  const save =
    () => {
      const chosen =
        seeds.filter(
          (
            item
          ) =>
            selected.includes(
              item.id
            )
        );


      try {
        window
          .localStorage
          .setItem(
            `timepalette_language_question_seeds_${countryCode}`,
            JSON.stringify(
              chosen
            )
          );
      } catch {
        // optional
      }


      playUiSound(
        'success'
      );


      onClear(
        mission
      );
    };


  return (
    <div
      className="
        flex
        h-full
        min-h-0
        flex-col
      "
    >
      <div
        className="
          flex
          items-center
          justify-end
        "
      >
        <span
          className="
            rounded-full
            bg-fuchsia-50
            px-2.5
            py-1
            text-[10px]
            font-black
            text-fuchsia-700
          "
        >
          {
            selected.length
          }
          /{
            required
          }
          {' '}
          選択
        </span>
      </div>


      <div
        className="
          mt-2
          grid
          grid-cols-2
          gap-2.5
        "
      >
        {
          seeds.map(
            (
              seed
            ) => {
              const active =
                selected.includes(
                  seed.id
                );

              return (
                <button
                  key={
                    seed.id
                  }
                  type="button"
                  onClick={() =>
                    toggle(
                      seed.id
                    )
                  }
                  className={`
                    min-h-[88px]
                    rounded-2xl
                    border-2
                    p-3
                    text-left
                    transition

                    ${
                      active
                        ? `
                          border-fuchsia-500
                          bg-fuchsia-50
                        `
                        : `
                          border-slate-200
                          bg-white
                        `
                    }
                  `}
                >
                  <div
                    className="
                      flex
                      items-start
                      gap-2.5
                    "
                  >
                    <span
                      className="
                        text-xl
                      "
                    >
                      {
                        seed.emoji
                      }
                    </span>

                    <div
                      className="
                        min-w-0
                      "
                    >
                      <p
                        className="
                          text-[11px]
                          font-black
                          leading-[1.45]
                          text-slate-800
                        "
                      >
                        {
                          seed.labelJa
                        }
                      </p>

                      <p
                        className="
                          mt-1
                          text-[9px]
                          font-bold
                          leading-4
                          text-slate-400
                        "
                      >
                        {
                          seed.previewEn
                        }
                      </p>
                    </div>
                  </div>
                </button>
              );
            }
          )
        }
      </div>


      <button
        type="button"
        disabled={
          selected.length !==
          required
        }
        onClick={
          save
        }
        className="
          mt-3
          inline-flex
          w-full
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-fuchsia-500
          px-4
          py-3
          text-sm
          font-black
          text-white
          disabled:bg-slate-200
          disabled:text-slate-400
        "
      >
        <Save
          size={15}
        />

        3つを保存
      </button>
    </div>
  );
}


export default function SourceReadingMission({
  mission,
  countryCode = 'rw',
  onClear,
}) {
  const interaction =
    mission
      ?.interaction ??
    {
      type:
        'single-choice-flow',

      questions:
        mission
          ?.challenge
          ?.questions ??
        [],
    };


  switch (
    interaction.type
  ) {
    case 'fact-sort':
      return (
        <FactSort
          mission={
            mission
          }
          interaction={
            interaction
          }
          onClear={
            onClear
          }
        />
      );


    case 'multi-evidence':
      return (
        <MultiEvidence
          mission={
            mission
          }
          interaction={
            interaction
          }
          onClear={
            onClear
          }
        />
      );


    case 'question-seeds':
      return (
        <QuestionSeeds
          mission={
            mission
          }
          interaction={
            interaction
          }
          countryCode={
            countryCode
          }
          onClear={
            onClear
          }
        />
      );


    case 'single-choice-flow':
    default:
      return (
        <SingleChoiceFlow
          mission={
            mission
          }
          interaction={
            interaction
          }
          onClear={
            onClear
          }
        />
      );
  }
}
