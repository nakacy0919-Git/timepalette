import {
  AlertCircle,
  CheckCircle2,
  Mic,
  RefreshCw,
  Square,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const normalizeSpeechText = (value = '') =>
  value
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const countWords = (value = '') => {
  const normalized = normalizeSpeechText(value);
  return normalized ? normalized.split(' ').length : 0;
};

const levenshteinDistance = (sourceWords, targetWords) => {
  const rows = sourceWords.length + 1;
  const cols = targetWords.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let col = 0; col < cols; col += 1) matrix[0][col] = col;

  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = sourceWords[row - 1] === targetWords[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }

  return matrix[rows - 1][cols - 1];
};

const calculateAccuracy = (target, transcript) => {
  const targetWords = normalizeSpeechText(target).split(' ').filter(Boolean);
  const spokenWords = normalizeSpeechText(transcript).split(' ').filter(Boolean);

  if (targetWords.length === 0 || spokenWords.length === 0) return 0;

  const distance = levenshteinDistance(targetWords, spokenWords);
  const denominator = Math.max(targetWords.length, spokenWords.length);
  return Math.max(0, Math.round((1 - distance / denominator) * 100));
};

const speakText = (text, langCode = 'en-US') => {
  if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langCode;
  utterance.rate = 0.88;
  window.speechSynthesis.speak(utterance);
};

function useSpeechRecognition(langCode = 'en-US') {
  const recognitionRef = useRef(null);
  const mountedRef = useRef(true);
  const [transcript, setTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      try {
        recognitionRef.current?.abort();
      } catch {
        // Ignore cleanup errors from browser speech recognition.
      }
      recognitionRef.current = null;
    };
  }, []);

  const getRecognitionConstructor = () => {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
  };

  const supported = Boolean(getRecognitionConstructor());

  const start = () => {
    const Recognition = getRecognitionConstructor();

    if (!Recognition) {
      setError('このブラウザでは音声認識を利用できません。Chrome / Edge / Safari の対応環境で試してください。');
      return;
    }

    try {
      recognitionRef.current?.abort();
    } catch {
      // Ignore stale recognition instance errors.
    }

    const recognition = new Recognition();
    recognition.lang = langCode;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      if (!mountedRef.current) return;
      setListening(true);
      setTranscript('');
      setError('');
    };

    recognition.onresult = (event) => {
      if (!mountedRef.current) return;

      const nextTranscript = Array.from(event.results)
        .map((result) => result?.[0]?.transcript || '')
        .join(' ')
        .trim();

      setTranscript(nextTranscript);
    };

    recognition.onerror = (event) => {
      if (!mountedRef.current) return;

      setListening(false);

      if (event.error === 'aborted') return;

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setError('マイクの使用が許可されていません。ブラウザのマイク権限を確認してください。');
        return;
      }

      if (event.error === 'no-speech') {
        setError('音声を聞き取れませんでした。もう一度、少し大きな声で話してみましょう。');
        return;
      }

      setError(`音声認識を完了できませんでした（${event.error}）。もう一度試してください。`);
    };

    recognition.onend = () => {
      if (!mountedRef.current) return;
      setListening(false);
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      setListening(false);
      setError('音声認識を開始できませんでした。数秒待ってからもう一度試してください。');
    }
  };

  const stop = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      setListening(false);
    }
  };

  const reset = () => {
    try {
      recognitionRef.current?.abort();
    } catch {
      // Ignore reset errors.
    }

    recognitionRef.current = null;
    setTranscript('');
    setListening(false);
    setError('');
  };

  return {
    transcript,
    listening,
    error,
    supported,
    start,
    stop,
    reset,
  };
}

function ResultBox({
  status,
  explanation,
  points,
  alreadyCompleted,
  detail,
}) {
  if (status === null) return null;

  if (status === false) {
    return (
      <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-700">
        <div className="flex items-start gap-3">
          <AlertCircle size={22} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-black">もう一度挑戦してみよう！</p>
            {detail && <p className="mt-1 text-sm font-bold opacity-80">{detail}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
      <div className="mb-3 flex items-center gap-3 text-emerald-700">
        <CheckCircle2 size={26} />
        <p className="text-xl font-black">Mission Clear!</p>
      </div>
      <p className="font-bold leading-relaxed text-slate-700">{explanation}</p>
      {detail && <p className="mt-2 text-sm font-bold text-emerald-700">{detail}</p>}
      <div className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 font-black text-white">
        {alreadyCompleted ? 'REVIEW COMPLETE' : `+${points} WP`}
      </div>
    </div>
  );
}

function MatchingMission({ mission, onClear, alreadyCompleted }) {
 const pairs = useMemo(
  () => mission.challenge.pairs ?? [],
  [mission.challenge.pairs]
);

  const phraseChoices = useMemo(() => {
    const phrases = pairs.map((pair) => pair.phrase);
    if (phrases.length <= 1) return phrases;
    const shift = Math.max(1, Math.floor(phrases.length / 2));
    return [...phrases.slice(shift), ...phrases.slice(0, shift)];
  }, [pairs]);

  const [answers, setAnswers] = useState({});
  const [status, setStatus] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);

  const allAnswered = pairs.every((_, index) => Boolean(answers[index]));

  const check = () => {
    const nextCorrectCount = pairs.reduce(
      (total, pair, index) => total + (answers[index] === pair.phrase ? 1 : 0),
      0
    );

    setCorrectCount(nextCorrectCount);
    const correct = nextCorrectCount === pairs.length;
    setStatus(correct);

    if (correct) onClear(mission);
  };

  const reset = () => {
    setAnswers({});
    setStatus(null);
    setCorrectCount(0);
  };

  return (
    <div>
      <div className="space-y-4">
        {pairs.map((pair, index) => (
          <div key={`${mission.id}-${pair.situation}`} className="rounded-3xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-black tracking-[0.12em] text-slate-400">SITUATION {index + 1}</p>
            <p className="mt-2 text-lg font-black text-slate-800">{pair.situation}</p>
            <select
              value={answers[index] || ''}
              disabled={status === true}
              onChange={(event) => {
                setAnswers((current) => ({ ...current, [index]: event.target.value }));
                setStatus(null);
              }}
              className="mt-4 w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white"
            >
              <option value="">英語表現を選ぶ</option>
              {phraseChoices.map((phrase) => (
                <option key={phrase} value={phrase}>{phrase}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {status !== true && (
        <button
          disabled={!allAnswered}
          onClick={check}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          4つの組み合わせをチェック
        </button>
      )}

      <ResultBox
        status={status}
        explanation={mission.explanation}
        points={mission.points}
        alreadyCompleted={alreadyCompleted}
        detail={status === false ? `${correctCount} / ${pairs.length} 組が合っています。間違っている場面だけ見直してみよう。` : `${pairs.length} / ${pairs.length} 組すべて正しく使い分けられました。`}
      />

      {status === false && (
        <button
          onClick={reset}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-black text-slate-500 hover:bg-slate-100"
        >
          <RefreshCw size={18} />
          もう一度やり直す
        </button>
      )}
    </div>
  );
}

function SpeakingMission({ mission, onClear, alreadyCompleted }) {
  const isTemplate = mission.type === 'speaking-template';
  const [name, setName] = useState('');
  const [status, setStatus] = useState(null);
  const [accuracy, setAccuracy] = useState(null);

  const targetPhrase = isTemplate
    ? (mission.challenge.template || '').replace('{name}', name.trim() || 'your name')
    : mission.challenge.phrase || '';

  const minAccuracy = mission.challenge.minAccuracy ?? 70;
  const speech = useSpeechRecognition(mission.challenge.langCode || 'en-US');
  const canStart = !isTemplate || name.trim().length > 0;

  const check = () => {
    const nextAccuracy = calculateAccuracy(targetPhrase, speech.transcript);
    setAccuracy(nextAccuracy);
    const correct = nextAccuracy >= minAccuracy;
    setStatus(correct);
    if (correct) onClear(mission);
  };

  const retry = () => {
    speech.reset();
    setAccuracy(null);
    setStatus(null);
  };

  return (
    <div>
      {isTemplate && (
        <div className="mb-5 rounded-3xl border border-blue-100 bg-blue-50 p-5">
          <label className="text-sm font-black text-blue-700" htmlFor={`${mission.id}-name`}>
            あなたの名前を入れてください
          </label>
          <input
            id={`${mission.id}-name`}
            value={name}
            disabled={status === true}
            onChange={(event) => {
              setName(event.target.value);
              retry();
            }}
            placeholder="例: Aki"
            className="mt-3 w-full rounded-2xl border-2 border-blue-200 bg-white px-4 py-3 text-lg font-black text-slate-800 outline-none focus:border-blue-500"
          />
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 md:p-6">
        <p className="text-xs font-black tracking-[0.12em] text-slate-400">TARGET PHRASE</p>
        <p className="mt-2 text-2xl font-black leading-relaxed text-slate-900">{targetPhrase}</p>
        {mission.challenge.meaning && (
          <p className="mt-2 font-bold text-slate-500">{mission.challenge.meaning}</p>
        )}
        <button
          disabled={!canStart}
          onClick={() => speakText(targetPhrase, mission.challenge.langCode || 'en-US')}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-black text-blue-600 shadow-sm transition hover:bg-blue-50 disabled:opacity-40"
        >
          <Volume2 size={18} />
          お手本を聞く
        </button>
      </div>

      {!speech.supported && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          この端末・ブラウザでは自動音声認識を利用できません。このMissionでは、正しく判定できない状態でWPを付与しない設計にしています。
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          disabled={!canStart || !speech.supported || status === true}
          onClick={speech.listening ? speech.stop : () => {
            setStatus(null);
            setAccuracy(null);
            speech.start();
          }}
          className={`flex items-center justify-center gap-2 rounded-2xl py-4 font-black text-white transition disabled:bg-slate-200 disabled:text-slate-400 ${
            speech.listening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {speech.listening ? <Square size={20} /> : <Mic size={20} />}
          {speech.listening ? '終了する' : 'マイクで話す'}
        </button>

        <button
          disabled={!speech.transcript || speech.listening || status === true}
          onClick={check}
          className="rounded-2xl bg-slate-900 py-4 font-black text-white transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
        >
          発音をチェック
        </button>
      </div>

      {speech.transcript && (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-black tracking-[0.12em] text-slate-400">HEARD</p>
          <p className="mt-2 text-lg font-black text-slate-800">“{speech.transcript}”</p>
          {accuracy !== null && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm font-black">
                <span className="text-slate-500">WORD MATCH</span>
                <span className={accuracy >= minAccuracy ? 'text-emerald-600' : 'text-orange-600'}>{accuracy}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${accuracy >= minAccuracy ? 'bg-emerald-500' : 'bg-orange-400'}`}
                  style={{ width: `${accuracy}%` }}
                />
              </div>
              <p className="mt-2 text-xs font-bold text-slate-400">クリア基準: {minAccuracy}%以上</p>
            </div>
          )}
        </div>
      )}

      {speech.error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {speech.error}
        </div>
      )}

      <ResultBox
        status={status}
        explanation={mission.explanation}
        points={mission.points}
        alreadyCompleted={alreadyCompleted}
        detail={
          status === false && accuracy !== null
            ? `${accuracy}%でした。お手本をもう一度聞き、語の抜けや言い換わりを確認して再挑戦しよう。`
            : status === true && accuracy !== null
              ? `${accuracy}%でクリアしました。`
              : ''
        }
      />

      {status === false && (
        <button
          onClick={retry}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-black text-slate-500 hover:bg-slate-100"
        >
          <RefreshCw size={18} />
          もう一度話す
        </button>
      )}
    </div>
  );
}

function SpeakingCreatorMission({ mission, onClear, alreadyCompleted }) {
  const minWords = mission.challenge.minWords ?? 5;
  const [questionText, setQuestionText] = useState('');
  const [status, setStatus] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const speech = useSpeechRecognition(mission.challenge.langCode || 'en-US');

  const wordCount = countWords(questionText);
  const textReady = wordCount >= minWords;

  const check = () => {
    const nextAccuracy = calculateAccuracy(questionText, speech.transcript);
    setAccuracy(nextAccuracy);

    const correct = textReady && nextAccuracy >= 70;
    setStatus(correct);
    if (correct) onClear(mission);
  };

  const retrySpeech = () => {
    speech.reset();
    setAccuracy(null);
    setStatus(null);
  };

  return (
    <div>
      <div className="rounded-3xl border border-violet-200 bg-violet-50 p-5 md:p-6">
        <p className="text-xs font-black tracking-[0.12em] text-violet-500">CREATE YOUR QUESTION</p>
        <p className="mt-2 font-bold leading-relaxed text-slate-700">
          この国の同年代の生徒に、本当に聞いてみたいことを英語で書いてください。
        </p>
        <textarea
          value={questionText}
          disabled={status === true}
          onChange={(event) => {
            setQuestionText(event.target.value);
            retrySpeech();
          }}
          rows={3}
          placeholder="例: What do you usually do after school?"
          className="mt-4 w-full resize-none rounded-2xl border-2 border-violet-200 bg-white px-4 py-3 text-lg font-bold text-slate-800 outline-none focus:border-violet-500"
        />
        <div className="mt-3 flex items-center justify-between gap-3 text-sm font-black">
          <span className={textReady ? 'text-emerald-600' : 'text-slate-400'}>
            {wordCount} words / minimum {minWords}
          </span>
          {questionText.trim() && (
            <button
              onClick={() => speakText(questionText, mission.challenge.langCode || 'en-US')}
              className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-violet-600 shadow-sm hover:bg-violet-100"
            >
              <Volume2 size={16} />
              読み上げ
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold text-blue-800">
        文章を作るだけではクリアになりません。自分で作った質問をマイクに向かって話し、文字との一致度70%以上を目指します。
      </div>

      {!speech.supported && (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          この端末・ブラウザでは自動音声認識を利用できません。判定できない状態ではWPを付与しません。
        </div>
      )}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          disabled={!textReady || !speech.supported || status === true}
          onClick={speech.listening ? speech.stop : () => {
            setStatus(null);
            setAccuracy(null);
            speech.start();
          }}
          className={`flex items-center justify-center gap-2 rounded-2xl py-4 font-black text-white transition disabled:bg-slate-200 disabled:text-slate-400 ${
            speech.listening ? 'bg-red-500 hover:bg-red-600' : 'bg-violet-600 hover:bg-violet-700'
          }`}
        >
          {speech.listening ? <Square size={20} /> : <Mic size={20} />}
          {speech.listening ? '終了する' : '質問を話す'}
        </button>

        <button
          disabled={!speech.transcript || speech.listening || status === true}
          onClick={check}
          className="rounded-2xl bg-slate-900 py-4 font-black text-white transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400"
        >
          質問をチェック
        </button>
      </div>

      {speech.transcript && (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5">
          <p className="text-xs font-black tracking-[0.12em] text-slate-400">HEARD</p>
          <p className="mt-2 text-lg font-black text-slate-800">“{speech.transcript}”</p>
          {accuracy !== null && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm font-black">
                <span className="text-slate-500">YOUR TEXT ↔ YOUR SPEECH</span>
                <span className={accuracy >= 70 ? 'text-emerald-600' : 'text-orange-600'}>{accuracy}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${accuracy >= 70 ? 'bg-emerald-500' : 'bg-orange-400'}`}
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {speech.error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {speech.error}
        </div>
      )}

      <p className="mt-4 text-xs font-bold leading-relaxed text-slate-400">
        この実装ではTimePalette側に音声ファイルを保存しません。ブラウザの音声認識結果を、その場のMission判定に使用します。
      </p>

      <ResultBox
        status={status}
        explanation={mission.explanation}
        points={mission.points}
        alreadyCompleted={alreadyCompleted}
        detail={
          status === false && accuracy !== null
            ? `${accuracy}%でした。自分で書いた質問と、実際に話した内容を比べてみよう。`
            : status === true && accuracy !== null
              ? `${wordCount}語のオリジナル質問を、${accuracy}%の一致度で話せました。`
              : ''
        }
      />

      {status === false && (
        <button
          onClick={retrySpeech}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-black text-slate-500 hover:bg-slate-100"
        >
          <RefreshCw size={18} />
          もう一度話す
        </button>
      )}
    </div>
  );
}

export default function LanguageMissionGame({
  mission,
  onComplete,
  alreadyCompleted,
}) {
  if (mission.type === 'matching') {
    return (
      <MatchingMission
        mission={mission}
        onClear={onComplete}
        alreadyCompleted={alreadyCompleted}
      />
    );
  }

  if (mission.type === 'speaking' || mission.type === 'speaking-template') {
    return (
      <SpeakingMission
        mission={mission}
        onClear={onComplete}
        alreadyCompleted={alreadyCompleted}
      />
    );
  }

  if (mission.type === 'speaking-creator') {
    return (
      <SpeakingCreatorMission
        mission={mission}
        onClear={onComplete}
        alreadyCompleted={alreadyCompleted}
      />
    );
  }

  return (
    <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <div className="mb-3 text-4xl">🗣️</div>
      <p className="font-black text-slate-700">Language Missionは準備中です。</p>
    </div>
  );
}
