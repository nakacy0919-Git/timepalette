import {
  CheckCircle2,
  ChevronLeft,
  Eye,
  FileText,
  Image as ImageIcon,
  Lightbulb,
  PlayCircle,
  RotateCcw,
} from 'lucide-react';

import {
  useMemo,
  useState,
} from 'react';

import {
  getLearningSources,
} from '../../utils/learningSourceRegistry';

/* =========================================================
   HELPERS
========================================================= */

const getOptionLabel = (
  option
) => {
  if (
    typeof option ===
    'string'
  ) {
    return option;
  }

  return (
    option?.label ??
    option?.text ??
    ''
  );
};


const normalizeText = (
  value = ''
) =>
  String(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();


const countWords = (
  value = ''
) => {
  const normalized =
    String(value).trim();

  if (!normalized) {
    return 0;
  }

  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .length;
};


const countChars = (
  value = ''
) =>
  String(value)
    .replace(/\s/g, '')
    .length;


const validateWriting = (
  step,
  value
) => {
  const text =
    String(value ?? '');

  const wordCount =
    countWords(text);

  const charCount =
    countChars(text);

  const minWords =
    Number(
      step.minWords ?? 0
    );

  const maxWords =
    Number(
      step.maxWords ?? 0
    );

  const minChars =
    Number(
      step.minChars ?? 0
    );

  const maxChars =
    Number(
      step.maxChars ?? 0
    );

  const keywords =
    Array.isArray(
      step.requiredKeywords
    )
      ? step.requiredKeywords
      : [];

  const normalized =
    normalizeText(text);

  const matchedKeywords =
    keywords.filter(
      (keyword) =>
        normalized.includes(
          normalizeText(
            keyword
          )
        )
    );

  const requiredKeywordCount =
    Number(
      step.requiredKeywordCount ??
        (
          keywords.length > 0
            ? keywords.length
            : 0
        )
    );

  const wordReady =
    (
      !minWords ||
      wordCount >= minWords
    ) &&
    (
      !maxWords ||
      wordCount <= maxWords
    );

  const charReady =
    (
      !minChars ||
      charCount >= minChars
    ) &&
    (
      !maxChars ||
      charCount <= maxChars
    );

  const keywordReady =
    matchedKeywords.length >=
    requiredKeywordCount;

  return {
    ready:
      wordReady &&
      charReady &&
      keywordReady,

    wordCount,
    charCount,
    matchedKeywords,
    wordReady,
    charReady,
    keywordReady,
  };
};


/* =========================================================
   SOURCE VIEWER
========================================================= */

function SourceViewer({
  source,
}) {
  if (!source) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-orange-200 bg-orange-50 p-6 text-center">

        <p className="font-black text-orange-700">
          教材を読み込めませんでした。
        </p>

        <p className="mt-2 text-sm font-bold text-orange-600">
          sourceId と
          Source Libraryを確認してください。
        </p>

      </div>
    );
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
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
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
          className="h-[68vh] min-h-[520px] w-full"
        />

      </div>
    );
  }


  if (
    source.assetType ===
      'image' &&
    source.url
  ) {
    return (
      <figure className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">

        <img
          src={
            source.url
          }
          alt={
            source.alt ??
            source.title
          }
          className="h-auto w-full object-cover"
          loading="lazy"
        />

        {(
          source.credit ||
          source.license
        ) && (
          <figcaption className="border-t border-slate-100 px-4 py-3 text-xs font-bold text-slate-400">

            {source.credit}

            {source.credit &&
              source.license &&
              ' / '}

            {source.license}

          </figcaption>
        )}

      </figure>
    );
  }


  if (
    source.assetType ===
    'excerpt'
  ) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">

        <p className="text-xs font-black tracking-[0.14em] text-slate-400">
          READING
        </p>

        <p className="mt-4 whitespace-pre-line font-bold leading-8 text-slate-700">
          {
            source.excerpt ??
            ''
          }
        </p>

      </div>
    );
  }


  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">

      <p className="text-xs font-black tracking-[0.14em] text-slate-400">
        OFFICIAL SOURCE
      </p>

      <p className="mt-2 text-lg font-black text-slate-800">
        {
          source.titleJa ??
          source.title
        }
      </p>

      <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
        この資料はTimePalette内への
        直接埋め込みに対応していません。
      </p>

    </div>
  );
}


/* =========================================================
   SOURCE STEP
========================================================= */

function SourceStep({
  step,
  mission,
  onClear,
}) {
  const sourceIds =
    step.sourceIds ??
    (
      step.sourceId
        ? [step.sourceId]
        : mission.sourceIds ?? []
    );

  const sources =
    getLearningSources(
      sourceIds
    );

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const activeSource =
    sources[
      activeIndex
    ];


  return (
    <div>

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
                  setActiveIndex(
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
                    activeIndex ===
                    index
                      ? 'bg-slate-950 text-white'
                      : 'border border-slate-200 bg-white text-slate-500'
                  }
                `}
              >

                {source.assetType ===
                'youtube'
                  ? '▶ VIDEO'
                  : source.assetType ===
                      'pdf'
                    ? '📄 PDF'
                    : source.assetType ===
                        'image'
                      ? '🖼 IMAGE'
                      : '📚 SOURCE'}

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
        <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3">

          <p className="text-[9px] font-black tracking-[0.14em] text-slate-400">
            SOURCE
          </p>

          <p className="mt-1 text-sm font-black text-slate-700">
            {
              activeSource
                .organization ??
              'Official Source'
            }
          </p>

          <p className="mt-1 text-xs font-bold text-slate-400">
            {
              activeSource.titleJa ??
              activeSource.title
            }
          </p>

        </div>
      )}


      <button
        type="button"
        disabled={
          sources.length === 0
        }
        onClick={
          onClear
        }
        className="mt-6 w-full rounded-2xl bg-slate-950 py-4 font-black text-white transition hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
      >

        {step.completeLabel ??
          '見終わった・読み終わった'}

      </button>

    </div>
  );
}


/* =========================================================
   SINGLE CHOICE
========================================================= */

function SingleChoiceStep({
  step,
  onClear,
}) {
  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState(null);

  const [
    status,
    setStatus,
  ] = useState(null);


  const choices =
    step.choices ?? [];


  const check = () => {
    if (
      selectedIndex ===
      null
    ) {
      return;
    }

    const correct =
      selectedIndex ===
      step.correctIndex;

    setStatus(
      correct
    );

    if (correct) {
      onClear();
    }
  };


  return (
    <div>

      <div className="space-y-3">

        {choices.map(
          (
            choice,
            index
          ) => {
            const selected =
              selectedIndex ===
              index;

            const correct =
              status === true &&
              index ===
                step.correctIndex;

            const wrong =
              status === false &&
              selected;

            return (
              <button
                key={
                  `${index}-${getOptionLabel(
                    choice
                  )}`
                }
                type="button"
                disabled={
                  status ===
                  true
                }
                onClick={() => {
                  setSelectedIndex(
                    index
                  );

                  setStatus(
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
                          ? 'border-blue-500 bg-blue-50 text-blue-800'
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
                      'E',
                    ][index] ??
                    index + 1
                  }
                </span>

                {
                  getOptionLabel(
                    choice
                  )
                }

              </button>
            );
          }
        )}

      </div>


      {status !== true && (
        <button
          type="button"
          disabled={
            selectedIndex ===
            null
          }
          onClick={
            check
          }
          className="mt-6 w-full rounded-2xl bg-slate-950 py-4 font-black text-white disabled:bg-slate-200 disabled:text-slate-400"
        >
          ANSWER
        </button>
      )}


      {status === false && (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">

          <p className="font-black text-orange-700">
            もう一度考えてみよう。
          </p>

          <p className="mt-1 text-sm font-bold text-orange-600">
            {
              step.retryMessage ??
              '教材をもう一度確認してから再挑戦してみよう。'
            }
          </p>

        </div>
      )}

    </div>
  );
}


/* =========================================================
   MULTI SELECT / NOTICE
========================================================= */

function MultiSelectStep({
  step,
  onClear,
}) {
  const choices =
    step.choices ??
    step.options ??
    [];

  const [
    selected,
    setSelected,
  ] = useState([]);

  const [
    status,
    setStatus,
  ] = useState(null);


  const correctIndices =
    Array.isArray(
      step.correctIndices
    )
      ? step.correctIndices
      : null;


  const minSelections =
    Number(
      step.minSelections ??
        1
    );


  const toggle = (
    index
  ) => {
    setSelected(
      (current) =>
        current.includes(
          index
        )
          ? current.filter(
              (value) =>
                value !== index
            )
          : [
              ...current,
              index,
            ]
    );

    setStatus(
      null
    );
  };


  const check = () => {
  let correct;

  if (
    correctIndices
  ) {
      const sortedSelected =
        [
          ...selected,
        ].sort(
          (
            a,
            b
          ) => a - b
        );

      const sortedCorrect =
        [
          ...correctIndices,
        ].sort(
          (
            a,
            b
          ) => a - b
        );

      correct =
        JSON.stringify(
          sortedSelected
        ) ===
        JSON.stringify(
          sortedCorrect
        );
    } else {
      correct =
        selected.length >=
        minSelections;
    }

    setStatus(
      correct
    );

    if (correct) {
      onClear();
    }
  };


  return (
    <div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

        {choices.map(
          (
            choice,
            index
          ) => {
            const isSelected =
              selected.includes(
                index
              );

            return (
              <button
                key={
                  `${index}-${getOptionLabel(
                    choice
                  )}`
                }
                type="button"
                disabled={
                  status ===
                  true
                }
                onClick={() =>
                  toggle(
                    index
                  )
                }
                className={`
                  rounded-2xl
                  border-2
                  p-4
                  text-left
                  font-black
                  transition
                  ${
                    isSelected
                      ? 'border-violet-500 bg-violet-500 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-violet-300'
                  }
                `}
              >

                <span className="mr-2">
                  {isSelected
                    ? '✓'
                    : '○'}
                </span>

                {
                  getOptionLabel(
                    choice
                  )
                }

              </button>
            );
          }
        )}

      </div>


      <p className="mt-3 text-xs font-bold text-slate-400">
        {correctIndices
          ? '正しいものをすべて選んでください。'
          : `最低 ${minSelections} 個選んでください。`}
      </p>


      {status !== true && (
        <button
          type="button"
          disabled={
            selected.length <
            (
              correctIndices
                ? 1
                : minSelections
            )
          }
          onClick={
            check
          }
          className="mt-5 w-full rounded-2xl bg-slate-950 py-4 font-black text-white disabled:bg-slate-200 disabled:text-slate-400"
        >
          CHECK
        </button>
      )}


      {status === false && (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-700">
          選んだ項目をもう一度確認してみよう。
        </div>
      )}

    </div>
  );
}


/* =========================================================
   IMAGE CHOICE
========================================================= */

function ImageChoiceStep({
  step,
  onClear,
}) {
  const choices =
    step.choices ??
    [];

  const [
    selectedIndex,
    setSelectedIndex,
  ] = useState(null);

  const [
    status,
    setStatus,
  ] = useState(null);


  const check = () => {
    if (
      selectedIndex ===
      null
    ) {
      return;
    }

    const correct =
      selectedIndex ===
      step.correctIndex;

    setStatus(
      correct
    );

    if (correct) {
      onClear();
    }
  };


  return (
    <div>

      <div className="grid grid-cols-2 gap-3">

        {choices.map(
          (
            choice,
            index
          ) => {
            const selected =
              selectedIndex ===
              index;

            const correct =
              status === true &&
              index ===
                step.correctIndex;

            const wrong =
              status === false &&
              selected;

            return (
              <button
                key={
                  choice.id ??
                  `${index}-${choice.imageUrl}`
                }
                type="button"
                disabled={
                  status ===
                  true
                }
                onClick={() => {
                  setSelectedIndex(
                    index
                  );

                  setStatus(
                    null
                  );
                }}
                className={`
                  overflow-hidden
                  rounded-[22px]
                  border-2
                  bg-white
                  text-left
                  transition
                  ${
                    correct
                      ? 'border-emerald-500'
                      : wrong
                        ? 'border-orange-400'
                        : selected
                          ? 'border-blue-500'
                          : 'border-slate-200 hover:border-blue-300'
                  }
                `}
              >

                <div className="aspect-[4/3] overflow-hidden bg-slate-100">

                  <img
                    src={
                      choice.imageUrl
                    }
                    alt={
                      choice.alt ??
                      choice.label ??
                      'Mission option'
                    }
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />

                </div>

                <div className="p-3">

                  {choice.label && (
                    <p className="font-black text-slate-700">
                      {
                        choice.label
                      }
                    </p>
                  )}

                  {(
                    choice.credit ||
                    choice.license
                  ) && (
                    <p className="mt-1 text-[10px] font-bold leading-4 text-slate-400">

                      {choice.credit}

                      {choice.credit &&
                        choice.license &&
                        ' / '}

                      {choice.license}

                    </p>
                  )}

                </div>

              </button>
            );
          }
        )}

      </div>


      {status !== true && (
        <button
          type="button"
          disabled={
            selectedIndex ===
            null
          }
          onClick={
            check
          }
          className="mt-6 w-full rounded-2xl bg-slate-950 py-4 font-black text-white disabled:bg-slate-200 disabled:text-slate-400"
        >
          この画像で決定
        </button>
      )}


      {status === false && (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm font-bold text-orange-700">
          写真の細かい部分まで見て、もう一度選んでみよう。
        </div>
      )}

    </div>
  );
}


/* =========================================================
   WRITING
========================================================= */

function WritingStep({
  step,
  onClear,
}) {
  const [
    value,
    setValue,
  ] = useState('');

  const [
    status,
    setStatus,
  ] = useState(null);


  const validation =
    useMemo(
      () =>
        validateWriting(
          step,
          value
        ),
      [
        step,
        value,
      ]
    );


  const keywords =
    Array.isArray(
      step.requiredKeywords
    )
      ? step.requiredKeywords
      : [];


  const submit = () => {
    if (
      !validation.ready
    ) {
      setStatus(
        false
      );

      return;
    }

    setStatus(
      true
    );

    onClear();
  };


  return (
    <div>

      <textarea
        value={
          value
        }
        disabled={
          status === true
        }
        onChange={(
          event
        ) => {
          setValue(
            event.target.value
          );

          setStatus(
            null
          );
        }}
        rows={
          step.rows ?? 6
        }
        placeholder={
          step.placeholder ??
          'ここに自分の考えを書こう。'
        }
        className="w-full resize-none rounded-3xl border-2 border-slate-200 bg-white px-5 py-4 font-bold leading-7 text-slate-800 outline-none transition focus:border-blue-500"
      />


      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

        {(
          step.minWords ||
          step.maxWords
        ) && (
          <div
            className={`
              rounded-2xl
              border
              p-3
              text-sm
              font-black
              ${
                validation.wordReady
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }
            `}
          >

            WORDS:
            {' '}
            {
              validation.wordCount
            }

            {step.minWords &&
              ` / min ${step.minWords}`}

            {step.maxWords &&
              ` / max ${step.maxWords}`}

          </div>
        )}


        {(
          step.minChars ||
          step.maxChars
        ) && (
          <div
            className={`
              rounded-2xl
              border
              p-3
              text-sm
              font-black
              ${
                validation.charReady
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-slate-50 text-slate-500'
              }
            `}
          >

            CHARACTERS:
            {' '}
            {
              validation.charCount
            }

            {step.minChars &&
              ` / min ${step.minChars}`}

            {step.maxChars &&
              ` / max ${step.maxChars}`}

          </div>
        )}

      </div>


      {keywords.length > 0 && (
        <div className="mt-5 rounded-3xl border border-violet-100 bg-violet-50 p-4">

          <p className="text-xs font-black tracking-[0.12em] text-violet-600">
            KEYWORDS
          </p>

          <div className="mt-3 flex flex-wrap gap-2">

            {keywords.map(
              (
                keyword
              ) => {
                const matched =
                  validation
                    .matchedKeywords
                    .includes(
                      keyword
                    );

                return (
                  <span
                    key={
                      keyword
                    }
                    className={`
                      rounded-full
                      px-3
                      py-2
                      text-xs
                      font-black
                      ${
                        matched
                          ? 'bg-emerald-500 text-white'
                          : 'bg-white text-violet-700'
                      }
                    `}
                  >

                    {matched
                      ? '✓ '
                      : ''}

                    {
                      keyword
                    }

                  </span>
                );
              }
            )}

          </div>

          <p className="mt-3 text-xs font-bold text-violet-500">

            {
              validation
                .matchedKeywords
                .length
            }
            {' / '}
            {
              step.requiredKeywordCount ??
              keywords.length
            }
            {' '}
            keywords

          </p>

        </div>
      )}


      {status === false && (
        <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-4">

          <p className="font-black text-orange-700">
            もう少し書いてみよう。
          </p>

          <p className="mt-1 text-sm font-bold leading-6 text-orange-600">
            語数・文字数・キーワードの条件を確認してください。
          </p>

        </div>
      )}


      {status !== true && (
        <button
          type="button"
          onClick={
            submit
          }
          className="mt-6 w-full rounded-2xl bg-slate-950 py-4 font-black text-white transition hover:bg-blue-700"
        >
          WRITINGを完成する
        </button>
      )}

    </div>
  );
}


/* =========================================================
   STEP RENDERER
========================================================= */

function QuestStep({
  step,
  mission,
  onClear,
}) {
  const type =
    step?.type;


  if (
    [
      'watch',
      'read',
      'look',
      'source',
    ].includes(
      type
    )
  ) {
    return (
      <SourceStep
        step={step}
        mission={mission}
        onClear={onClear}
      />
    );
  }


  if (
    [
      'single-choice',
      'quiz',
    ].includes(
      type
    )
  ) {
    return (
      <SingleChoiceStep
        step={step}
        onClear={onClear}
      />
    );
  }


  if (
    [
      'multi-select',
      'notice',
    ].includes(
      type
    )
  ) {
    return (
      <MultiSelectStep
        step={step}
        onClear={onClear}
      />
    );
  }


  if (
    type ===
    'image-choice'
  ) {
    return (
      <ImageChoiceStep
        step={step}
        onClear={onClear}
      />
    );
  }


  if (
    [
      'keyword-writing',
      'reflection',
      'opinion-writing',
    ].includes(
      type
    )
  ) {
    return (
      <WritingStep
        step={step}
        onClear={onClear}
      />
    );
  }


  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">

      <p className="text-4xl">
        🚧
      </p>

      <p className="mt-3 font-black text-slate-700">
        STEP TYPE:
        {' '}
        {type}
      </p>

      <p className="mt-2 text-sm font-bold text-slate-400">
        このSTEPはこれから追加します。
      </p>

    </div>
  );
}


/* =========================================================
   MAIN
========================================================= */

export default function SourceQuestMissionGame({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  const profiles =
    mission
      ?.difficultyProfiles ??
    mission
      ?.challenge
      ?.difficultyProfiles ??
    {};


  /*
   * WorldMissionPanel側で
   * 学習レベルはすでに選択済み。
   *
   * defaultDifficulty があればそれを使用。
   * なければ受け取ったprofileの最初の1つを使用。
   */
  const profileKey =
    (
      mission?.defaultDifficulty &&
      profiles[
        mission.defaultDifficulty
      ]
    )
      ? mission.defaultDifficulty
      : Object.keys(
          profiles
        )[0] ??
        null;


  const profile =
    profileKey
      ? profiles[
          profileKey
        ] ??
        null
      : null;


  /*
   * 将来 variants 側から
   * steps を直接渡す形式にも対応。
   */
  const directSteps =
    mission?.steps ??
    mission
      ?.challenge
      ?.steps ??
    [];


  const steps =
    profile?.steps ??
    directSteps;


  const [
    stepIndex,
    setStepIndex,
  ] = useState(0);


  const [
    completedSteps,
    setCompletedSteps,
  ] = useState([]);


  const [
    missionComplete,
    setMissionComplete,
  ] = useState(false);


  const currentStep =
    steps[
      stepIndex
    ];


  /*
   * Missionをもう一度最初から行う。
   *
   * 学習レベル自体は
   * WorldMissionPanel側で管理するため
   * ここでは変更しない。
   */
  const resetQuest = () => {
    setStepIndex(
      0
    );

    setCompletedSteps(
      []
    );

    setMissionComplete(
      false
    );
  };


  const clearStep = () => {
    if (
      !currentStep
    ) {
      return;
    }


    setCompletedSteps(
      (current) =>
        current.includes(
          stepIndex
        )
          ? current
          : [
              ...current,
              stepIndex,
            ]
    );


    const isLast =
      stepIndex >=
      steps.length - 1;


    if (
      isLast
    ) {
      setMissionComplete(
        true
      );

      onComplete?.(
        mission
      );

      return;
    }


    setStepIndex(
      (current) =>
        current + 1
    );
  };


  const goBack = () => {
    setStepIndex(
      (current) =>
        Math.max(
          0,
          current - 1
        )
    );
  };


  /*
   * 選択された学校段階に対応する
   * Source Questが存在しない場合。
   */
  if (
    !profile &&
    directSteps.length === 0
  ) {
    return (
      <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6">

        <p className="font-black text-orange-700">
          この学習レベル用のSource Questがありません。
        </p>

        <p className="mt-2 text-sm font-bold leading-6 text-orange-600">
          Mission JSONに、
          選択された学習レベル用の
          Source Questを設定してください。
        </p>

      </div>
    );
  }


  if (
    steps.length === 0
  ) {
    return (
      <div className="rounded-3xl border border-orange-200 bg-orange-50 p-6">

        <p className="font-black text-orange-700">
          STEPSがありません。
        </p>

        <p className="mt-2 text-sm font-bold text-orange-600">
          このMissionのsteps設定を確認してください。
        </p>

      </div>
    );
  }


  const progressPercent =
    Math.round(
      (
        completedSteps.length /
        steps.length
      ) *
        100
    );


  return (
    <div>

      {/* =====================================================
          QUEST PROGRESS
      ====================================================== */}

      <div className="rounded-[28px] border border-blue-100 bg-gradient-to-r from-blue-50 to-violet-50 p-5">

        <div className="flex items-center justify-between gap-4">

          <div>

            <p className="text-[10px] font-black tracking-[0.16em] text-blue-500">
              SOURCE QUEST
            </p>

            <p className="mt-1 text-lg font-black text-slate-800">

              {mission.learningLevelLabel && (
                <>
                  {mission.learningLevelLabel}
                  {' · '}
                </>
              )}

              {mission.title}

            </p>

          </div>


          <div className="text-right">

            <p className="text-2xl font-black text-slate-900">

              {
                Math.min(
                  completedSteps.length,
                  steps.length
                )
              }

              /

              {
                steps.length
              }

            </p>

            <p className="text-[10px] font-black tracking-[0.12em] text-slate-400">
              STEPS
            </p>

          </div>

        </div>


        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">

          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{
              width:
                `${progressPercent}%`,
            }}
          />

        </div>

      </div>


      {/* =====================================================
          MISSION COMPLETE
      ====================================================== */}

      {missionComplete ? (

        <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 p-7 text-center">

          <CheckCircle2
            size={44}
            className="mx-auto text-emerald-600"
          />


          <h3 className="mt-3 text-2xl font-black text-emerald-800">
            Source Quest Complete!
          </h3>


          <p className="mt-2 font-bold leading-7 text-slate-600">
            動画・資料・クイズ・自分の考えをつなげて
            Missionを完成しました。
          </p>


          <div className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-2 font-black text-white">

            {alreadyCompleted
              ? 'REVIEW COMPLETE'
              : `+${mission.points} WP`}

          </div>


          <button
            type="button"
            onClick={
              resetQuest
            }
            className="mx-auto mt-5 flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-black text-emerald-700 hover:bg-emerald-100"
          >

            <RotateCcw
              size={17}
            />

            もう一度挑戦

          </button>

        </div>

      ) : (

        <>

          {/* =================================================
              STEP HEADER
          ================================================== */}

          <div className="mt-6">

            <div className="flex items-start gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">

                {currentStep.type ===
                'watch'
                  ? (
                    <PlayCircle
                      size={22}
                    />
                  )
                  : currentStep.type ===
                      'read'
                    ? (
                      <FileText
                        size={22}
                      />
                    )
                    : currentStep.type ===
                        'image-choice'
                      ? (
                        <ImageIcon
                          size={22}
                        />
                      )
                      : currentStep.type ===
                          'notice'
                        ? (
                          <Eye
                            size={22}
                          />
                        )
                        : (
                          <Lightbulb
                            size={22}
                          />
                        )}

              </div>


              <div>

                <p className="text-[10px] font-black tracking-[0.16em] text-slate-400">

                  STEP{' '}

                  {
                    stepIndex + 1
                  }

                  {' / '}

                  {
                    steps.length
                  }

                </p>


                <h3 className="mt-1 text-xl font-black text-slate-900">

                  {
                    currentStep.title ??
                    'Challenge'
                  }

                </h3>


                {currentStep.prompt && (

                  <p className="mt-2 font-bold leading-7 text-slate-600">

                    {
                      currentStep.prompt
                    }

                  </p>

                )}

              </div>

            </div>

          </div>


          {/* =================================================
              STEP
          ================================================== */}

          <div className="mt-5">

            <QuestStep
              key={`${profileKey ?? 'direct'}-${stepIndex}`}
              step={
                currentStep
              }
              mission={
                mission
              }
              onClear={
                clearStep
              }
            />

          </div>


          {/* =================================================
              BACK
          ================================================== */}

          {stepIndex > 0 && (

            <button
              type="button"
              onClick={
                goBack
              }
              className="mt-5 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-slate-500 hover:bg-slate-100"
            >

              <ChevronLeft
                size={17}
              />

              前のSTEPを見る

            </button>

          )}

        </>

      )}

    </div>
  );
}