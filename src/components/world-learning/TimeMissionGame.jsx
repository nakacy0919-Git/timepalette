import { CheckCircle2, Clock3, Lightbulb, RotateCcw } from 'lucide-react';
import { useState } from 'react';

const getFallbackZoneLabel = (
  timeZone
) => {
  if (!timeZone) {
    return '';
  }

  const parts =
    timeZone.split('/');

  return (
    parts[
      parts.length - 1
    ] || timeZone
  ).replaceAll(
    '_',
    ' '
  );
};

const getZoneLabel = (
  challenge,
  timeZone
) =>
  challenge
    ?.zoneLabels
    ?.[timeZone] ||
  getFallbackZoneLabel(
    timeZone
  );

const DAYPARTS = [
  { id: 'morning', label: '朝', range: '05:00–11:59' },
  { id: 'day', label: '昼', range: '12:00–16:59' },
  { id: 'evening', label: '夕方', range: '17:00–20:59' },
  { id: 'night', label: '夜', range: '21:00–04:59' },
];

const pad2 = (value) => String(value).padStart(2, '0');

const getZonedParts = (date, timeZone) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
};

const formatTime = (date, timeZone) => {
  const parts = getZonedParts(date, timeZone);
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
};

const formatDate = (date, timeZone) =>
  new Intl.DateTimeFormat('ja-JP', {
    timeZone,
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(date);

const getOffsetMinutes = (timeZone, date) => {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );

  return Math.round((asUtc - date.getTime()) / 60000);
};

const getDaypart = (hour) => {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'day';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

const parseClock = (value) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};

const zonedLocalToUtc = ({ year, month, day, hour, minute }, timeZone) => {
  const desiredWallTime = Date.UTC(year, month - 1, day, hour, minute, 0);
  let guess = desiredWallTime;

  for (let index = 0; index < 3; index += 1) {
    const offset = getOffsetMinutes(timeZone, new Date(guess));
    guess = desiredWallTime - offset * 60_000;
  }

  return new Date(guess);
};

const roundToFiveMinutes = (date) => {
  const rounded = new Date(date);
  rounded.setSeconds(0, 0);
  rounded.setMinutes(Math.floor(rounded.getMinutes() / 5) * 5);
  return rounded;
};

const makeDifferenceChoices = (differenceMinutes) => {
  const values = new Set([
    differenceMinutes,
    Math.max(0, differenceMinutes - 60),
    differenceMinutes + 60,
    differenceMinutes + 120,
  ]);

  let candidate = 30;
  while (values.size < 4) {
    values.add(candidate);
    candidate += 30;
  }

  return Array.from(values)
    .slice(0, 4)
    .sort((a, b) => a - b);
};

const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) return `${remainder}分`;
  if (remainder === 0) return `${hours}時間`;
  return `${hours}時間${remainder}分`;
};

function ResultBox({ correct, explanation, points, alreadyCompleted }) {
  if (correct === null) return null;

  if (!correct) {
    return (
      <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-700">
        <p className="font-black">もう一度考えてみよう！</p>
        <p className="mt-1 text-sm font-bold opacity-80">
          時刻・時差・学校時間をもう一度確認してみましょう。
        </p>
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
      <div className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 font-black text-white">
        {alreadyCompleted ? 'REVIEW COMPLETE' : `+${points} WP`}
      </div>
    </div>
  );
}

function LiveTimeCompare({ mission, onClear, alreadyCompleted }) {
  const [reference] = useState(() => new Date());
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);

  const zones = mission.challenge.zones;
  const mode = mission.challenge.questionMode;

  const cityA =
  getZoneLabel(
    mission.challenge,
    zones[0]
  );

const cityB =
  getZoneLabel(
    mission.challenge,
    zones[1]
  );
  const offsetA = getOffsetMinutes(zones[0], reference);
  const offsetB = getOffsetMinutes(zones[1], reference);
  const difference = Math.abs(offsetA - offsetB);

 const check = () => {
  let correct;

  if (mode === 'which-is-ahead') {
    const correctZone =
      offsetA > offsetB
        ? zones[0]
        : zones[1];

    correct =
      selected === correctZone;
  } else {
    correct =
      selected === difference;
  }

  setResult(correct);

  if (correct) {
    onClear();
  }
};

  const differenceChoices = makeDifferenceChoices(difference);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {zones.map((zone) => (
          <div key={zone} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
            <p className="text-sm font-black text-slate-500">{getZoneLabel(
  mission.challenge,
  zone
)}</p>
            <p className="mt-2 text-3xl font-black text-slate-900">{formatTime(reference, zone)}</p>
            <p className="mt-1 text-xs font-bold text-slate-400">{formatDate(reference, zone)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm font-bold text-blue-800">
        <Clock3 className="mr-2 inline" size={18} />
        {mode === 'which-is-ahead'
          ? 'どちらの都市の時計が、同じ瞬間により先の時刻を示していますか？'
          : `${cityA} と ${cityB} の時差は何時間ですか？`}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {mode === 'which-is-ahead'
          ? zones.map((zone) => (
              <button
                key={zone}
                onClick={() => {
                  setSelected(zone);
                  setResult(null);
                }}
                className={`rounded-2xl border-2 p-4 font-black transition-all ${
                  selected === zone
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                }`}
              >
                {getZoneLabel(
  mission.challenge,
  zone
)}
              </button>
            ))
          : differenceChoices.map((minutes) => (
              <button
                key={minutes}
                onClick={() => {
                  setSelected(minutes);
                  setResult(null);
                }}
                className={`rounded-2xl border-2 p-4 font-black transition-all ${
                  selected === minutes
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                }`}
              >
                {formatDuration(minutes)}
              </button>
            ))}
      </div>

      {result !== true && (
        <button
          disabled={selected === null}
          onClick={check}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          答えをチェック
        </button>
      )}

      <ResultBox
        correct={result}
        explanation={mission.explanation}
        points={mission.points}
        alreadyCompleted={alreadyCompleted}
      />
    </div>
  );
}

function TimeDial({ mission, onClear, alreadyCompleted }) {
  const [reference] = useState(() => roundToFiveMinutes(new Date()));
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [result, setResult] = useState(null);

  const { fromZone, toZone } = mission.challenge;
  const sourceParts = getZonedParts(reference, fromZone);
  const targetParts = getZonedParts(reference, toZone);

  const check = () => {
    const correct = Number(hour) === targetParts.hour && Number(minute) === targetParts.minute;
    setResult(correct);
    if (correct) onClear();
  };

  return (
    <div>
      <div className="rounded-3xl border border-blue-200 bg-blue-50 p-6 text-center">
        <p className="text-sm font-black text-blue-500">
  {getZoneLabel(
    mission.challenge,
    fromZone
  )}
</p>
        <p className="mt-2 text-5xl font-black tracking-tight text-slate-900">
          {pad2(sourceParts.hour)}:{pad2(sourceParts.minute)}
        </p>
        <p className="mt-2 text-sm font-bold text-slate-500">同じ瞬間の{' '}
{getZoneLabel(
  mission.challenge,
  toZone
)}
は？</p>
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <select
          value={hour}
          onChange={(event) => {
            setHour(event.target.value);
            setResult(null);
          }}
          className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-2xl font-black text-slate-800"
        >
          <option value="">時</option>
          {Array.from({ length: 24 }, (_, index) => (
            <option key={index} value={index}>{pad2(index)}</option>
          ))}
        </select>

        <span className="text-3xl font-black text-slate-400">:</span>

        <select
          value={minute}
          onChange={(event) => {
            setMinute(event.target.value);
            setResult(null);
          }}
          className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 text-2xl font-black text-slate-800"
        >
          <option value="">分</option>
          {Array.from({ length: 12 }, (_, index) => index * 5).map((value) => (
            <option key={value} value={value}>{pad2(value)}</option>
          ))}
        </select>
      </div>

      {result !== true && (
        <button
          disabled={hour === '' || minute === ''}
          onClick={check}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          時計を合わせる
        </button>
      )}

      <ResultBox
        correct={result}
        explanation={mission.explanation}
        points={mission.points}
        alreadyCompleted={alreadyCompleted}
      />
    </div>
  );
}

function DaypartMatch({ mission, onClear, alreadyCompleted }) {
  const [reference] = useState(() => new Date());
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const baseZone = mission.challenge.baseZone;
  const targetZones = mission.challenge.targetZones;

  const check = () => {
    const correct = targetZones.every((zone) => {
      const hour = getZonedParts(reference, zone).hour;
      return answers[zone] === getDaypart(hour);
    });

    setResult(correct);
    if (correct) onClear();
  };

  return (
    <div>
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
        <p className="text-sm font-black text-slate-500">
  基準：
  {getZoneLabel(
    mission.challenge,
    baseZone
  )}
</p>
        <p className="mt-1 text-4xl font-black text-slate-900">{formatTime(reference, baseZone)}</p>
      </div>

      <div className="mt-6 space-y-5">
        {targetZones.map((zone) => (
          <div key={zone} className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-lg font-black text-slate-800">{getZoneLabel(
  mission.challenge,
  zone
)}</p>
              {result === true && (
                <span className="text-sm font-black text-emerald-600">{formatTime(reference, zone)}</span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DAYPARTS.map((part) => (
                <button
                  key={part.id}
                  onClick={() => {
                    setAnswers((current) => ({ ...current, [zone]: part.id }));
                    setResult(null);
                  }}
                  className={`rounded-2xl border-2 p-3 text-sm font-black transition-all ${
                    answers[zone] === part.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
                  }`}
                  title={part.range}
                >
                  {part.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-2 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
        <Lightbulb className="mt-0.5 shrink-0" size={18} />
        朝＝5〜11時、昼＝12〜16時、夕方＝17〜20時、それ以外を夜として判定します。
      </div>

      {result !== true && (
        <button
          disabled={targetZones.some((zone) => !answers[zone])}
          onClick={check}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          3都市をチェック
        </button>
      )}

      <ResultBox
        correct={result}
        explanation={mission.explanation}
        points={mission.points}
        alreadyCompleted={alreadyCompleted}
      />
    </div>
  );
}

function ScheduleBuilder({ mission, onClear, alreadyCompleted }) {
  const [reference] = useState(() => new Date());
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [showHint, setShowHint] = useState(false);

  const {
  zoneA,
  zoneB,
  windowA,
  windowB,
  minOverlapMinutes,
} = mission.challenge;

const zoneALabel =
  getZoneLabel(
    mission.challenge,
    zoneA
  );

const zoneBLabel =
  getZoneLabel(
    mission.challenge,
    zoneB
  );
  const baseDate = getZonedParts(reference, zoneA);
  const startA = parseClock(windowA[0]);
  const endA = parseClock(windowA[1]);
  const startB = parseClock(windowB[0]);
  const endB = parseClock(windowB[1]);

  const candidateMinutes = [];
  for (let value = startA; value + minOverlapMinutes <= endA; value += 30) {
    candidateMinutes.push(value);
  }

  const candidates = candidateMinutes.map((minutes) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    const instant = zonedLocalToUtc(
      {
        year: baseDate.year,
        month: baseDate.month,
        day: baseDate.day,
        hour,
        minute,
      },
      zoneA
    );

    const target = getZonedParts(instant, zoneB);
    const targetStart = target.hour * 60 + target.minute;
    const valid = targetStart >= startB && targetStart + minOverlapMinutes <= endB;

    return {
      id: `${pad2(hour)}:${pad2(minute)}`,
      sourceLabel: `${pad2(hour)}:${pad2(minute)}`,
      targetLabel: `${pad2(target.hour)}:${pad2(target.minute)}`,
      valid,
    };
  });

  const check = () => {
    const candidate = candidates.find((item) => item.id === selected);
    const correct = Boolean(candidate?.valid);
    setResult(correct);
    if (correct) onClear();
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-sm font-black text-slate-500">
  {zoneALabel} school
</p>
          <p className="mt-1 text-xl font-black text-slate-900">{windowA[0]}–{windowA[1]}</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-center">
          <p className="text-sm font-black text-slate-500">
  {zoneBLabel} school
</p>
          <p className="mt-1 text-xl font-black text-slate-900">{windowB[0]}–{windowB[1]}</p>
        </div>
      </div>

      <p className="mt-5 text-center text-sm font-bold text-slate-500">
        {minOverlapMinutes}
分間のオンライン交流を始められる
{zoneALabel}
時刻を1つ選ぼう。
      </p>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {candidates.map((candidate) => (
          <button
            key={candidate.id}
            onClick={() => {
              setSelected(candidate.id);
              setResult(null);
            }}
            className={`rounded-2xl border-2 p-3 font-black transition-all ${
              selected === candidate.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300'
            }`}
          >
            {candidate.sourceLabel}
          </button>
        ))}
      </div>

      <button
        onClick={() => setShowHint((value) => !value)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-50 py-3 text-sm font-black text-amber-700 hover:bg-amber-100"
      >
        <Lightbulb size={18} />
        {showHint
  ? `${zoneBLabel}時刻を隠す`
  : `ヒント：${zoneBLabel}時刻を見る`}
      </button>

      {showHint && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-500 sm:grid-cols-4">
          {candidates.map((candidate) => (
            <div key={candidate.id} className="rounded-xl bg-slate-100 px-2 py-2">
              {candidate.sourceLabel} → {candidate.targetLabel}
            </div>
          ))}
        </div>
      )}

      {result !== true && (
        <button
          disabled={selected === null}
          onClick={check}
          className="mt-6 w-full rounded-2xl bg-slate-900 py-4 text-lg font-black text-white transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
        >
          この時間で交流できる？
        </button>
      )}

      {result === false && (
        <button
          onClick={() => {
            setSelected(null);
            setResult(null);
          }}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-black text-slate-500 hover:bg-slate-100"
        >
          <RotateCcw size={18} />
          別の時間を探す
        </button>
      )}

      <ResultBox
        correct={result}
        explanation={mission.explanation}
        points={mission.points}
        alreadyCompleted={alreadyCompleted}
      />
    </div>
  );
}

export default function TimeMissionGame({ mission, onComplete, alreadyCompleted }) {
  const onClear = () => onComplete(mission);

  if (mission.type === 'live-time-compare') {
    return <LiveTimeCompare mission={mission} onClear={onClear} alreadyCompleted={alreadyCompleted} />;
  }

  if (mission.type === 'time-dial') {
    return <TimeDial mission={mission} onClear={onClear} alreadyCompleted={alreadyCompleted} />;
  }

  if (mission.type === 'daypart-match') {
    return <DaypartMatch mission={mission} onClear={onClear} alreadyCompleted={alreadyCompleted} />;
  }

  if (mission.type === 'schedule-builder') {
    return <ScheduleBuilder mission={mission} onClear={onClear} alreadyCompleted={alreadyCompleted} />;
  }

  return null;
}
