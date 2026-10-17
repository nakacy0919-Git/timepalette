import {
  Check,
  ChevronLeft,
  RotateCcw,
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
        rounded-2xl
        border
        border-orange-200
        bg-orange-50
        px-3.5
        py-3
        text-xs
        font-bold
        leading-5
        text-orange-800
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
    interaction?.questions ??
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
    questions[index];


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
          280
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
        220
      );
    };


  return (
    <div>
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
            tracking-[0.15em]
            text-orange-500
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
            bg-orange-100
            px-2.5
            py-1
            text-[10px]
            font-black
            text-orange-700
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
          text-slate-950
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
                    `${question.id}-${choiceIndex}`
                  }
                  type="button"
                  onClick={() =>
                    choose(
                      choice
                    )
                  }
                  className="
                    flex
                    min-h-[58px]
                    w-full
                    items-center
                    gap-3
                    rounded-2xl
                    border-2
                    border-slate-200
                    bg-white
                    px-4
                    py-3
                    text-left
                    transition
                    hover:border-orange-400
                    hover:bg-orange-50
                  "
                >
                  <span
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-orange-100
                      text-[11px]
                      font-black
                      text-orange-700
                    "
                  >
                    {
                      [
                        'A',
                        'B',
                        'C',
                        'D',
                      ][choiceIndex]
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
              question.retry ??
              '右の資料から根拠をもう一度探してみよう。'
            }
          />
        )
      }
    </div>
  );
}


function TimelineOrder({
  mission,
  interaction,
  onClear,
}) {
  const items =
    interaction?.items ??
    [];

  const [
    chosen,
    setChosen,
  ] = useState(
    []
  );

  const [
    wrong,
    setWrong,
  ] = useState(
    false
  );


  const available =
    items.filter(
      (
        item
      ) =>
        !chosen.includes(
          item.id
        )
    );


  const pick =
    (
      id
    ) => {
      setWrong(
        false
      );

      setChosen(
        (
          current
        ) => [
          ...current,
          id,
        ]
      );

      playUiSound(
        'tap'
      );
    };


  const undo =
    () => {
      setWrong(
        false
      );

      setChosen(
        (
          current
        ) =>
          current.slice(
            0,
            -1
          )
      );
    };


  const reset =
    () => {
      setWrong(
        false
      );

      setChosen(
        []
      );
    };


  const check =
    () => {
      const expected =
        [
          ...items,
        ]
          .sort(
            (
              a,
              b
            ) =>
              a.order -
              b.order
          )
          .map(
            (
              item
            ) =>
              item.id
          );


      const correct =
        expected.every(
          (
            id,
            index
          ) =>
            chosen[index] ===
            id
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
    <div>
      <div
        className="
          rounded-2xl
          border
          border-orange-200
          bg-orange-50/70
          p-3
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-2
          "
        >
          <p
            className="
              text-[10px]
              font-black
              tracking-[0.16em]
              text-orange-600
            "
          >
            YOUR ORDER
          </p>

          <div
            className="
              flex
              items-center
              gap-1
            "
          >
            <button
              type="button"
              disabled={
                chosen.length ===
                0
              }
              onClick={
                undo
              }
              className="
                rounded-lg
                border
                border-orange-200
                bg-white
                p-2
                text-orange-600
                disabled:opacity-30
              "
              aria-label="1つ戻す"
            >
              <ChevronLeft
                size={14}
              />
            </button>

            <button
              type="button"
              onClick={
                reset
              }
              className="
                rounded-lg
                border
                border-orange-200
                bg-white
                p-2
                text-orange-600
              "
              aria-label="リセット"
            >
              <RotateCcw
                size={14}
              />
            </button>
          </div>
        </div>


        <div
          className="
            mt-3
            grid
            grid-cols-2
            gap-2
          "
        >
          {
            chosen.map(
              (
                id,
                index
              ) => {
                const item =
                  items.find(
                    (
                      candidate
                    ) =>
                      candidate.id ===
                      id
                  );


                return (
                  <div
                    key={
                      `${id}-${index}`
                    }
                    className="
                      rounded-xl
                      border
                      border-orange-200
                      bg-white
                      p-2.5
                    "
                  >
                    <p
                      className="
                        text-[9px]
                        font-black
                        text-orange-500
                      "
                    >
                      STEP {
                        index +
                        1
                      }
                    </p>

                    <p
                      className="
                        mt-1
                        text-[12px]
                        font-black
                        leading-5
                        text-slate-800
                      "
                    >
                      {
                        item?.label
                      }
                    </p>

                    <p
                      className="
                        text-[10px]
                        font-bold
                        text-slate-400
                      "
                    >
                      {
                        item?.detail
                      }
                    </p>
                  </div>
                );
              }
            )
          }


          {
            Array.from({
              length:
                Math.max(
                  0,
                  items.length -
                  chosen.length
                ),
            }).map(
              (
                _,
                index
              ) => (
                <div
                  key={
                    `empty-${index}`
                  }
                  className="
                    min-h-[76px]
                    rounded-xl
                    border
                    border-dashed
                    border-orange-200
                    bg-white/40
                  "
                />
              )
            )
          }
        </div>
      </div>


      <p
        className="
          mt-4
          text-[10px]
          font-black
          tracking-[0.16em]
          text-slate-400
        "
      >
        TAP TO ADD
      </p>


      <div
        className="
          mt-2
          grid
          grid-cols-2
          gap-2
        "
      >
        {
          available.map(
            (
              item
            ) => (
              <button
                key={
                  item.id
                }
                type="button"
                onClick={() =>
                  pick(
                    item.id
                  )
                }
                className="
                  min-h-[72px]
                  rounded-2xl
                  border-2
                  border-slate-200
                  bg-white
                  p-3
                  text-left
                  transition
                  hover:border-orange-400
                  hover:bg-orange-50
                "
              >
                <p
                  className="
                    text-[12px]
                    font-black
                    leading-5
                    text-slate-800
                  "
                >
                  {
                    item.label
                  }
                </p>

                <p
                  className="
                    mt-1
                    text-[10px]
                    font-bold
                    text-slate-400
                  "
                >
                  {
                    item.detail
                  }
                </p>
              </button>
            )
          )
        }
      </div>


      <button
        type="button"
        disabled={
          chosen.length !==
          items.length
        }
        onClick={
          check
        }
        className="
          mt-4
          w-full
          rounded-xl
          bg-orange-500
          px-4
          py-3
          text-sm
          font-black
          text-white
          shadow-sm
          transition
          hover:bg-orange-600
          disabled:bg-slate-200
          disabled:text-slate-400
          disabled:shadow-none
        "
      >
        この順番で決定
      </button>


      {
        wrong && (
          <WrongHint
            text="順番が少し違うようです。右の資料から時刻や流れを探してみよう。"
          />
        )
      }
    </div>
  );
}


function CardMatch({
  mission,
  interaction,
  onClear,
}) {
  const pairs =
    interaction?.pairs ??
    [];

  const rightItems =
    useMemo(
      () =>
        pairs
          .map(
            (
              item
            ) => ({
              id:
                item.id,

              text:
                item.right,
            })
          )
          .reverse(),
      [
        pairs,
      ]
    );

  const [
    leftSelected,
    setLeftSelected,
  ] = useState(
    null
  );

  const [
    rightSelected,
    setRightSelected,
  ] = useState(
    null
  );

  const [
    matched,
    setMatched,
  ] = useState(
    []
  );

  const [
    wrong,
    setWrong,
  ] = useState(
    false
  );


  const resolvePair =
    (
      leftId,
      rightId
    ) => {
      if (
        !leftId ||
        !rightId
      ) {
        return;
      }


      if (
        leftId ===
        rightId
      ) {
        const nextMatched =
          [
            ...matched,
            leftId,
          ];


        setMatched(
          nextMatched
        );

        setLeftSelected(
          null
        );

        setRightSelected(
          null
        );

        setWrong(
          false
        );

        playUiSound(
          'success'
        );


        if (
          nextMatched.length >=
          pairs.length
        ) {
          window.setTimeout(
            () =>
              onClear(
                mission
              ),
            350
          );
        }

        return;
      }


      setWrong(
        true
      );

      playUiSound(
        'error'
      );


      window.setTimeout(
        () => {
          setLeftSelected(
            null
          );

          setRightSelected(
            null
          );

          setWrong(
            false
          );
        },
        650
      );
    };


  const chooseLeft =
    (
      id
    ) => {
      if (
        matched.includes(
          id
        )
      ) {
        return;
      }


      setLeftSelected(
        id
      );

      setWrong(
        false
      );

      playUiSound(
        'tap'
      );


      if (
        rightSelected
      ) {
        resolvePair(
          id,
          rightSelected
        );
      }
    };


  const chooseRight =
    (
      id
    ) => {
      if (
        matched.includes(
          id
        )
      ) {
        return;
      }


      setRightSelected(
        id
      );

      setWrong(
        false
      );

      playUiSound(
        'tap'
      );


      if (
        leftSelected
      ) {
        resolvePair(
          leftSelected,
          id
        );
      }
    };


  return (
    <div>
      <div
        className="
          flex
          items-center
          justify-between
        "
      >
        <p
          className="
            text-[10px]
            font-black
            tracking-[0.15em]
            text-orange-500
          "
        >
          CARD MATCH
        </p>

        <span
          className="
            rounded-full
            bg-emerald-50
            px-2.5
            py-1
            text-[10px]
            font-black
            text-emerald-700
          "
        >
          {
            matched.length
          }
          /{
            pairs.length
          }
          {' '}
          MATCH
        </span>
      </div>


      <div
        className="
          mt-3
          grid
          grid-cols-2
          gap-3
        "
      >
        <div
          className="
            space-y-2
          "
        >
          {
            pairs.map(
              (
                item
              ) => {
                const done =
                  matched.includes(
                    item.id
                  );

                const active =
                  leftSelected ===
                  item.id;


                return (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    disabled={
                      done
                    }
                    onClick={() =>
                      chooseLeft(
                        item.id
                      )
                    }
                    className={`
                      min-h-[64px]
                      w-full
                      rounded-2xl
                      border-2
                      px-3
                      py-2.5
                      text-left
                      text-[12px]
                      font-black
                      leading-5
                      transition

                      ${
                        done
                          ? `
                            border-emerald-300
                            bg-emerald-50
                            text-emerald-700
                            opacity-55
                          `
                          : active
                            ? `
                              border-orange-500
                              bg-orange-50
                              text-orange-800
                            `
                            : `
                              border-slate-200
                              bg-white
                              text-slate-800
                              hover:border-orange-300
                            `
                      }
                    `}
                  >
                    {
                      done
                        ? '✓ '
                        : ''
                    }
                    {
                      item.left
                    }
                  </button>
                );
              }
            )
          }
        </div>


        <div
          className="
            space-y-2
          "
        >
          {
            rightItems.map(
              (
                item
              ) => {
                const done =
                  matched.includes(
                    item.id
                  );

                const active =
                  rightSelected ===
                  item.id;


                return (
                  <button
                    key={
                      item.id
                    }
                    type="button"
                    disabled={
                      done
                    }
                    onClick={() =>
                      chooseRight(
                        item.id
                      )
                    }
                    className={`
                      min-h-[64px]
                      w-full
                      rounded-2xl
                      border-2
                      px-3
                      py-2.5
                      text-left
                      text-[11px]
                      font-black
                      leading-5
                      transition

                      ${
                        done
                          ? `
                            border-emerald-300
                            bg-emerald-50
                            text-emerald-700
                            opacity-55
                          `
                          : active
                            ? `
                              border-orange-500
                              bg-orange-50
                              text-orange-800
                            `
                            : `
                              border-slate-200
                              bg-white
                              text-slate-700
                              hover:border-orange-300
                            `
                      }
                    `}
                  >
                    {
                      done
                        ? '✓ '
                        : ''
                    }
                    {
                      item.text
                    }
                  </button>
                );
              }
            )
          }
        </div>
      </div>


      {
        wrong && (
          <WrongHint
            text="その組み合わせではありません。資料の言葉をもう一度確かめよう。"
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
    interaction?.options ??
    [];

  const required =
    interaction?.required ??
    options.filter(
      (
        item
      ) =>
        item.correct
    ).length;

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
    <div>
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
            bg-orange-100
            px-2.5
            py-1
            text-[10px]
            font-black
            text-orange-700
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
                    min-h-[82px]
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
                          border-orange-500
                          bg-orange-50
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
                            border-orange-500
                            bg-orange-500
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
          bg-orange-500
          px-4
          py-3
          text-sm
          font-black
          text-white
          disabled:bg-slate-200
          disabled:text-slate-400
        "
      >
        根拠をチェック
      </button>


      {
        wrong && (
          <WrongHint
            text="「ありそう」ではなく、右の記事に実際に書かれているものだけを選ぼう。"
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
    interaction?.statements ??
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


  const allAnswered =
    statements.every(
      (
        item
      ) =>
        Boolean(
          answers[item.id]
        )
    );


  const check =
    () => {
      const correct =
        statements.every(
          (
            item
          ) =>
            answers[item.id] ===
            item.answer
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
    <div>
      <div
        className="
          grid
          grid-cols-2
          gap-2.5
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
                  p-3
                "
              >
                <p
                  className="
                    min-h-[76px]
                    text-[12px]
                    font-black
                    leading-5
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
                    mt-2
                    grid
                    gap-1.5
                  "
                >
                  {
                    [
                      [
                        'fact',
                        '📖 書いてある',
                      ],
                      [
                        'assumption',
                        '🤔 記事だけではわからない',
                      ],
                    ].map(
                      (
                        [
                          value,
                          label,
                        ]
                      ) => (
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
                            rounded-xl
                            border-2
                            px-2
                            py-2
                            text-[10px]
                            font-black
                            transition

                            ${
                              answers[item.id] ===
                              value
                                ? `
                                  border-orange-500
                                  bg-orange-50
                                  text-orange-800
                                `
                                : `
                                  border-slate-200
                                  bg-slate-50
                                  text-slate-600
                                `
                            }
                          `}
                        >
                          {
                            label
                          }
                        </button>
                      )
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
          bg-orange-500
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
            text="記事に書いてあることだけを「書いてある」にしよう。"
          />
        )
      }
    </div>
  );
}


export default function LifeCultureMission({
  mission,
  onClear,
}) {
  const interaction =
    mission?.interaction ??
    {};


  switch (
    interaction.type
  ) {
    case 'timeline-order':
      return (
        <TimelineOrder
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


    case 'card-match':
      return (
        <CardMatch
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
