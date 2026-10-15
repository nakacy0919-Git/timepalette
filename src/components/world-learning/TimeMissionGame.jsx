import { ArrowDown, ArrowUp, CheckCircle2, Clock3, ExternalLink, Lightbulb, RotateCcw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { getLearningSources } from '../../utils/learningSourceRegistry';

import InteractiveClockMission
  from './time-v1/InteractiveClockMission';

import TimeTravelLapMission
  from './time-v1/TimeTravelLapMission';

import TimeZoneExpressMission
  from './time-v1/TimeZoneExpressMission';

import WorldLifeDetectiveMission
  from './time-v1/WorldLifeDetectiveMission';

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
    <div className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50 p-6 md:p-7">
      <div className="mb-3 flex items-center gap-3 text-emerald-700">
        <CheckCircle2 size={28} />
        <p className="text-2xl font-black">Mission Clear!</p>
      </div>

      <p className="text-base font-bold leading-8 text-slate-700 md:text-lg">
        {explanation}
      </p>

      <div className="mt-5 inline-flex rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-black text-white md:text-base">
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {zones.map((zone) => (
          <div key={zone} className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-center md:p-7">
            <p className="text-sm font-black text-slate-500">{getZoneLabel(
  mission.challenge,
  zone
)}</p>
            <p className="mt-2 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
  {formatTime(reference, zone)}
</p>
            <p className="mt-1 text-xs font-bold text-slate-400">{formatDate(reference, zone)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 text-base font-bold text-blue-800 md:text-lg">
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
                className={`min-h-[88px] rounded-[22px] border-2 px-5 py-5 text-lg font-black transition-all md:text-xl ${
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
          className="mt-6 w-full rounded-[24px] bg-slate-900 py-5 text-xl font-black text-white shadow-lg transition-colors hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400"
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

const formatMinuteOfDay = (minutes) => {
  const normalized = ((Number(minutes) % 1440) + 1440) % 1440;
  return `${pad2(Math.floor(normalized / 60))}:${pad2(normalized % 60)}`;
};

function ClockFace({ minutes, label }) {
  const hourAngle = ((minutes % 720) / 720) * 360 - 90;
  const minuteAngle = ((minutes % 60) / 60) * 360 - 90;
  const point = (angle, length) => {
    const radians = (angle * Math.PI) / 180;
    return {
      x: 100 + Math.cos(radians) * length,
      y: 100 + Math.sin(radians) * length,
    };
  };
  const hourEnd = point(hourAngle, 36);
  const minuteEnd = point(minuteAngle, 55);

  return (
    <div className="text-center">
      <svg viewBox="0 0 200 200" className="mx-auto h-44 w-44" role="img" aria-label={`${label}: ${formatMinuteOfDay(minutes)}`}>
        <circle cx="100" cy="100" r="91" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="4" />
        {Array.from({ length: 12 }, (_, index) => {
          const angle = ((index / 12) * 360 - 90) * Math.PI / 180;
          const outerX = 100 + Math.cos(angle) * 77;
          const outerY = 100 + Math.sin(angle) * 77;
          const innerX = 100 + Math.cos(angle) * 68;
          const innerY = 100 + Math.sin(angle) * 68;
          const textX = 100 + Math.cos(angle) * 57;
          const textY = 100 + Math.sin(angle) * 57 + 6;
          return (
            <g key={index}>
              <line x1={innerX} y1={innerY} x2={outerX} y2={outerY} stroke="#475569" strokeWidth="3" />
              <text x={textX} y={textY} textAnchor="middle" className="fill-slate-700 text-[12px] font-bold">{index === 0 ? 12 : index}</text>
            </g>
          );
        })}
        <line x1="100" y1="100" x2={hourEnd.x} y2={hourEnd.y} stroke="#0f172a" strokeWidth="7" strokeLinecap="round" />
        <line x1="100" y1="100" x2={minuteEnd.x} y2={minuteEnd.y} stroke="#2563eb" strokeWidth="4" strokeLinecap="round" />
        <circle cx="100" cy="100" r="5" fill="#f97316" />
      </svg>
      <p className="mt-2 text-3xl font-black tabular-nums text-slate-900">{formatMinuteOfDay(minutes)}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}

function TimeAdventureResult({ status, mission, alreadyCompleted }) {
  if (status === null) return null;
  if (!status) {
    return (
      <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-orange-800" role="status">
        <p className="font-black">ヒントを見直して、もう一度ためそう。</p>
        <p className="mt-1 text-sm font-bold">時差・日付・予定時間のどこを比べるか確認してみよう。</p>
      </div>
    );
  }
  return <ResultBox correct explanation={mission.explanation} points={mission.points} alreadyCompleted={alreadyCompleted} />;
}

function TimeAdventureGame({ mission, onClear, alreadyCompleted }) {
  const challenge = mission.challenge;
  const interaction = challenge.interaction;
  const [status, setStatus] = useState(null);
  const [selectedOffset, setSelectedOffset] = useState(0);
  const [clockMinutes, setClockMinutes] = useState(0);
  const [dateChoice, setDateChoice] = useState('');
  const [roundAnswers, setRoundAnswers] = useState({});
  const [routine, setRoutine] = useState(() =>
    interaction === 'routine-order'
      ? [...challenge.events].sort(() => Math.random() - 0.5).map((event) => event.id)
      : [],
  );
  const [evidence, setEvidence] = useState([]);
  const [stageIndex, setStageIndex] = useState(0);
  const [stageAnswer, setStageAnswer] = useState('');
  const [completedStages, setCompletedStages] = useState([]);
  const [showHint, setShowHint] = useState(false);

  const rounds = challenge.rounds ?? [];
  const stages = challenge.stages ?? [];
  const events = challenge.events ?? [];
  const statements = useMemo(() => challenge.statements ?? [], [challenge.statements]);
  const currentStage = stages[stageIndex];
  const selectedEvidenceIsCorrect = useMemo(() => {
    const supported = statements.filter((statement) => statement.supported).map((statement) => statement.id).sort();
    return [...evidence].sort().join('|') === supported.join('|');
  }, [evidence, statements]);

  const check = () => {
    let correct = false;

    if (interaction === 'offset-slider') {
      correct = selectedOffset === challenge.targetOffsetHours;
    } else if (interaction === 'time-rounds') {
      correct = rounds.length > 0 && rounds.every((_, index) => Number(roundAnswers[index]) === rounds[index].correctIndex);
    } else if (interaction === 'clock-slider') {
      correct = clockMinutes === challenge.targetMinutes;
    } else if (interaction === 'date-hop') {
      correct = dateChoice === challenge.correctId;
    } else if (interaction === 'routine-order') {
      correct = routine.join('|') === challenge.correctOrder.join('|');
    } else if (interaction === 'evidence-select') {
      correct = evidence.length === challenge.requiredCount && selectedEvidenceIsCorrect;
    }

    setStatus(correct);
    if (correct) onClear();
  };

  const moveEvent = (eventIndex, direction) => {
    setStatus(null);
    setRoutine((current) => {
      const nextIndex = eventIndex + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[eventIndex], next[nextIndex]] = [next[nextIndex], next[eventIndex]];
      return next;
    });
  };

  const toggleEvidence = (id) => {
    setStatus(null);
    setEvidence((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id]);
  };

  const checkStage = () => {
    const correct = Number(stageAnswer) === currentStage.correctIndex;
    setStatus(correct);
    if (!correct) return;

    const nextCompleted = [...completedStages, currentStage.id];
    setCompletedStages(nextCompleted);
    setStageAnswer('');
    if (stageIndex === stages.length - 1) {
      onClear();
      return;
    }
    setStageIndex((current) => current + 1);
    setStatus(null);
  };

  if (interaction === 'offset-slider') {
    const [utcHour, utcMinute] = challenge.utcTime.split(':').map(Number);
    const displayedTime = formatMinuteOfDay((utcHour * 60) + utcMinute + (selectedOffset * 60));
    return (
      <div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-100 p-5 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">UTC</p>
            <p className="mt-2 text-4xl font-black tabular-nums">{challenge.utcTime}</p>
          </div>
          <div className="rounded-3xl bg-blue-50 p-5 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-blue-600">{challenge.zoneLabel}</p>
            <p className="mt-2 text-4xl font-black tabular-nums text-blue-950">{displayedTime}</p>
            <p className="mt-1 text-sm font-bold text-blue-700">UTC {selectedOffset >= 0 ? '+' : ''}{selectedOffset}</p>
          </div>
        </div>
        <label className="mt-7 block font-black text-slate-800" htmlFor={`${mission.id}-offset`}>UTC offsetを動かす</label>
        <input id={`${mission.id}-offset`} aria-label="UTC offset" type="range" min="-12" max="14" step="1" value={selectedOffset} onChange={(event) => { setSelectedOffset(Number(event.target.value)); setStatus(null); }} className="mt-4 min-h-10 w-full accent-blue-600" />
        <div className="flex justify-between text-xs font-bold text-slate-400"><span>UTC−12</span><span>UTC±0</span><span>UTC+14</span></div>
        <button type="button" onClick={check} className="mt-5 w-full rounded-2xl bg-slate-950 py-4 font-black text-white">Kigaliの時刻に合わせる</button>
        <TimeAdventureResult status={status} mission={mission} alreadyCompleted={alreadyCompleted} />
      </div>
    );
  }

  if (interaction === 'time-rounds') {
    return (
      <div className="space-y-4">
        {rounds.map((round, index) => (
          <label key={round.sourceTime} className="block rounded-2xl border border-slate-200 bg-white p-4">
            <span className="block text-xs font-black uppercase tracking-wider text-slate-400">{challenge.fromLabel} · ROUND {index + 1}</span>
            <span className="mt-1 block text-2xl font-black tabular-nums text-slate-900">{round.sourceTime}</span>
            <span className="mt-3 block text-sm font-bold text-slate-600">{challenge.toLabel}の時刻・日付</span>
            <select aria-label={`${challenge.fromLabel} ${round.sourceTime}の${challenge.toLabel}時刻`} value={roundAnswers[index] ?? ''} onChange={(event) => { setRoundAnswers((current) => ({ ...current, [index]: event.target.value })); setStatus(null); }} className="mt-2 min-h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-3 font-bold">
              <option value="">答えを選ぶ</option>
              {round.choices.map((choice, choiceIndex) => <option key={choice} value={choiceIndex}>{choice}</option>)}
            </select>
          </label>
        ))}
        <button type="button" disabled={Object.keys(roundAnswers).length !== rounds.length} onClick={check} className="w-full rounded-2xl bg-slate-950 py-4 font-black text-white disabled:bg-slate-200 disabled:text-slate-400">3ラウンドを確認</button>
        <TimeAdventureResult status={status} mission={mission} alreadyCompleted={alreadyCompleted} />
      </div>
    );
  }

  if (interaction === 'clock-slider') {
    return (
      <div>
        <div className="grid items-center gap-4 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-100 p-4 text-center">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">{challenge.fromLabel}</p>
            <p className="mt-2 text-3xl font-black tabular-nums">{challenge.fromTime}</p>
          </div>
          <ClockFace minutes={clockMinutes} label={challenge.toLabel} />
        </div>
        <label className="mt-6 block font-black text-slate-800" htmlFor={`${mission.id}-clock`}>時計の針を動かす</label>
        <input id={`${mission.id}-clock`} aria-label={`${challenge.toLabel}の時計`} type="range" min="0" max="1435" step={challenge.stepMinutes ?? 5} value={clockMinutes} onChange={(event) => { setClockMinutes(Number(event.target.value)); setStatus(null); }} className="mt-4 min-h-10 w-full accent-blue-600" />
        <div className="flex justify-between text-xs font-bold text-slate-400"><span>00:00</span><span>12:00</span><span>23:55</span></div>
        <button type="button" onClick={check} className="mt-5 w-full rounded-2xl bg-slate-950 py-4 font-black text-white">同じ瞬間の時刻を確認</button>
        <TimeAdventureResult status={status} mission={mission} alreadyCompleted={alreadyCompleted} />
      </div>
    );
  }

  if (interaction === 'date-hop') {
    return (
      <div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-100 p-5 text-center"><p className="text-xs font-black text-slate-500">{challenge.fromLabel}</p><p className="mt-2 text-3xl font-black tabular-nums">{challenge.fromTime}</p></div>
          <div className="rounded-2xl bg-sky-50 p-5 text-center"><p className="text-xs font-black text-sky-600">{challenge.toLabel}</p><p className="mt-2 text-2xl font-black">時刻と日付を選ぼう</p></div>
        </div>
        <div className="mt-5 grid gap-3">
          {challenge.choices.map((choice) => (
            <button key={choice.id} type="button" aria-pressed={dateChoice === choice.id} onClick={() => { setDateChoice(choice.id); setStatus(null); }} className={`min-h-14 rounded-2xl border-2 p-4 text-left font-black ${dateChoice === choice.id ? 'border-blue-500 bg-blue-50 text-blue-800' : 'border-slate-200 bg-white text-slate-700'}`}>{choice.label}</button>
          ))}
        </div>
        <button type="button" disabled={!dateChoice} onClick={check} className="mt-5 w-full rounded-2xl bg-slate-950 py-4 font-black text-white disabled:bg-slate-200 disabled:text-slate-400">時刻と日付を確認</button>
        <TimeAdventureResult status={status} mission={mission} alreadyCompleted={alreadyCompleted} />
      </div>
    );
  }

  if (interaction === 'routine-order') {
    const eventById = new Map(events.map((event) => [event.id, event]));
    return (
      <div>
        <p className="mb-4 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">{challenge.scenarioNote}</p>
        <ol className="space-y-3" aria-label="Kigali local-time schedule">
          {routine.map((eventId, index) => {
            const event = eventById.get(eventId);
            return (
              <li key={eventId} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-50 font-black text-blue-800">{index + 1}</span>
                <span className="min-w-0 flex-1"><span className="block font-black text-slate-800">{event.label}</span><span className="text-sm font-bold tabular-nums text-slate-500">Kigali · {event.localTime}</span></span>
                <button type="button" aria-label={`${event.label}を上へ`} disabled={index === 0} onClick={() => moveEvent(index, -1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 disabled:opacity-35"><ArrowUp size={18} /></button>
                <button type="button" aria-label={`${event.label}を下へ`} disabled={index === routine.length - 1} onClick={() => moveEvent(index, 1)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 disabled:opacity-35"><ArrowDown size={18} /></button>
              </li>
            );
          })}
        </ol>
        <button type="button" onClick={check} className="mt-5 w-full rounded-2xl bg-slate-950 py-4 font-black text-white">この順で確認</button>
        <TimeAdventureResult status={status} mission={mission} alreadyCompleted={alreadyCompleted} />
      </div>
    );
  }

  if (interaction === 'evidence-select') {
    return (
      <div>
        <p className="mb-4 text-sm font-bold text-slate-600">支えられる文を{challenge.requiredCount}つ選んでください。</p>
        <div className="space-y-3">
          {statements.map((statement) => (
            <label key={statement.id} className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 ${evidence.includes(statement.id) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
              <input type="checkbox" checked={evidence.includes(statement.id)} onChange={() => toggleEvidence(statement.id)} className="mt-1 h-5 w-5 accent-blue-600" />
              <span className="font-bold leading-6 text-slate-800">{statement.label}</span>
            </label>
          ))}
        </div>
        <button type="button" onClick={() => setShowHint((current) => !current)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-50 py-3 font-black text-amber-800"><Lightbulb size={18} />{showHint ? 'ヒントを隠す' : '見るポイント'}</button>
        {showHint && <p className="mt-2 rounded-xl bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900">時差の数値は各都市の標準時の出典で確かめられます。学校についての一般化が出典に書かれているかも確認してください。</p>}
        <button type="button" disabled={evidence.length !== challenge.requiredCount} onClick={check} className="mt-4 w-full rounded-2xl bg-slate-950 py-4 font-black text-white disabled:bg-slate-200 disabled:text-slate-400">根拠を確認</button>
        <TimeAdventureResult status={status} mission={mission} alreadyCompleted={alreadyCompleted} />
      </div>
    );
  }

  if (interaction === 'final-stages') {
    return (
      <div>
        <div className="mb-5 flex items-center gap-2" aria-label={`Stage ${stageIndex + 1} of ${stages.length}`}>
          {stages.map((stage, index) => <span key={stage.id} className={`h-2 flex-1 rounded-full ${completedStages.includes(stage.id) ? 'bg-emerald-500' : index === stageIndex ? 'bg-blue-500' : 'bg-slate-200'}`} />)}
        </div>
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50 p-5">
          <p className="text-xs font-black uppercase tracking-widest text-indigo-600">STAGE {stageIndex + 1} · {currentStage.label}</p>
          <p className="mt-3 text-lg font-black leading-7 text-slate-900">{currentStage.prompt}</p>
        </div>
        <div className="mt-5 space-y-3">
          {currentStage.choices.map((choice, index) => (
            <button key={choice} type="button" aria-pressed={Number(stageAnswer) === index} onClick={() => { setStageAnswer(String(index)); setStatus(null); }} className={`min-h-14 w-full rounded-2xl border-2 p-4 text-left font-black ${Number(stageAnswer) === index ? 'border-indigo-500 bg-indigo-50 text-indigo-800' : 'border-slate-200 bg-white text-slate-700'}`}>{choice}</button>
          ))}
        </div>
        <button type="button" disabled={stageAnswer === ''} onClick={checkStage} className="mt-5 w-full rounded-2xl bg-slate-950 py-4 font-black text-white disabled:bg-slate-200 disabled:text-slate-400">{stageIndex === stages.length - 1 ? 'Finalをクリア' : '次のStageへ'}</button>
        <TimeAdventureResult status={status} mission={mission} alreadyCompleted={alreadyCompleted} />
      </div>
    );
  }

  return <div className="rounded-2xl bg-orange-50 p-5 font-bold text-orange-800">このTime操作にはchallenge.interactionの設定が必要です。</div>;
}

function TimeSources({ sourceIds = [] }) {
  const sources = getLearningSources(sourceIds);
  if (!sources.length) return null;

  return (
    <details className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer font-black text-slate-700">Sources &amp; Credits · 出典を確認</summary>
      <ul className="mt-3 space-y-3">
        {sources.map((source) => (
          <li key={source.id} className="text-sm">
            <p className="font-black text-slate-800">{source.titleJa || source.title}</p>
            <p className="mt-0.5 font-bold text-slate-500">{source.organization}</p>
            {source.sourceUrl && <a href={source.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-bold text-blue-700 underline">公式資料を開く <ExternalLink size={14} /></a>}
          </li>
        ))}
      </ul>
    </details>
  );
}

function TimeMissionContent({ mission, onClear, alreadyCompleted }) {
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
  if (mission.type === 'time-adventure') {
    return <TimeAdventureGame mission={mission} onClear={onClear} alreadyCompleted={alreadyCompleted} />;
  }
  return null;
}

export default function TimeMissionGame({ mission, onComplete, alreadyCompleted }) {
  if (
    mission.type ===
      'time-zone-express'
  ) {
    return (
      <TimeZoneExpressMission
        mission={mission}
        onComplete={onComplete}
        alreadyCompleted={alreadyCompleted}
      />
    );
  }

  if (
    mission.type ===
      'world-life-detective'
  ) {
    return (
      <WorldLifeDetectiveMission
        mission={mission}
        onComplete={onComplete}
        alreadyCompleted={alreadyCompleted}
      />
    );
  }

  if (
    mission.type ===
      'time-travel-lap'
  ) {
    return (
      <TimeTravelLapMission
        mission={
          mission
        }
        onComplete={
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
      'clock-offset'
  ) {
    return (
      <InteractiveClockMission
        mission={
          mission
        }
        onComplete={
          onComplete
        }
        alreadyCompleted={
          alreadyCompleted
        }
      />
    );
  }


  const onClear = () => onComplete(mission);
  return (
    <>
      <TimeMissionContent mission={mission} onClear={onClear} alreadyCompleted={alreadyCompleted} />
      <TimeSources sourceIds={mission.sourceIds} />
    </>
  );
}
