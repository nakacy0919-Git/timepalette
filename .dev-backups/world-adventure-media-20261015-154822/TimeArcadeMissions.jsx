import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';


let sharedAudioContext = null;


function audioContext() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    if (!sharedAudioContext) {
      sharedAudioContext =
        new AudioContextClass();
    }

    if (
      sharedAudioContext.state ===
      'suspended'
    ) {
      sharedAudioContext.resume();
    }

    return sharedAudioContext;
  }
  catch {
    return null;
  }
}


function tone({
  frequency,
  duration = 0.08,
  delay = 0,
  volume = 0.05,
  type = 'triangle',
}) {
  const context =
    audioContext();

  if (!context) {
    return;
  }

  const oscillator =
    context.createOscillator();

  const gain =
    context.createGain();

  const start =
    context.currentTime +
    delay;

  oscillator.type =
    type;

  oscillator.frequency.setValueAtTime(
    frequency,
    start
  );

  gain.gain.setValueAtTime(
    0.0001,
    start
  );

  gain.gain.exponentialRampToValueAtTime(
    volume,
    start + 0.01
  );

  gain.gain.exponentialRampToValueAtTime(
    0.001,
    start + duration
  );

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.start(start);
  oscillator.stop(
    start +
    duration +
    0.04
  );
}


function sound(kind) {
  if (kind === 'correct') {
    tone({ frequency: 720, duration: 0.09, volume: 0.06 });
    tone({ frequency: 980, duration: 0.16, volume: 0.07, delay: 0.08 });
    return;
  }

  if (kind === 'wrong') {
    tone({ frequency: 175, duration: 0.18, volume: 0.055, type: 'sawtooth' });
    tone({ frequency: 120, duration: 0.16, volume: 0.045, delay: 0.10, type: 'sawtooth' });
    return;
  }

  if (kind === 'tick') {
    tone({ frequency: 590, duration: 0.035, volume: 0.025 });
    return;
  }

  if (kind === 'clear') {
    [
      [523, 0.00, 0.14],
      [659, 0.10, 0.14],
      [784, 0.20, 0.16],
      [1047, 0.31, 0.24],
      [1319, 0.46, 0.45],
    ].forEach(([frequency, delay, duration]) => {
      tone({ frequency, delay, duration, volume: 0.085 });
    });
  }
}


function playSceneSound(kind) {
  if (kind === 'morning') {
    [980, 1260, 1080, 1420].forEach((frequency, index) => {
      tone({
        frequency,
        delay: index * 0.10,
        duration: 0.07,
        volume: 0.04,
        type: 'sine',
      });
    });
    return;
  }

  if (kind === 'day') {
    [660, 660, 880].forEach((frequency, index) => {
      tone({
        frequency,
        delay: index * 0.17,
        duration: 0.12,
        volume: 0.05,
        type: 'triangle',
      });
    });
    return;
  }

  if (kind === 'evening') {
    [330, 392, 440, 392].forEach((frequency, index) => {
      tone({
        frequency,
        delay: index * 0.11,
        duration: 0.11,
        volume: 0.04,
        type: 'sine',
      });
    });
    return;
  }

  [2100, 2300, 2050, 2450, 2200].forEach((frequency, index) => {
    tone({
      frequency,
      delay: index * 0.13,
      duration: 0.025,
      volume: 0.025,
      type: 'square',
    });
  });
}


function parseTime(value) {
  const [hour, minute] =
    String(value ?? '00:00')
      .split(':')
      .map(Number);

  return {
    hour: Number.isFinite(hour) ? hour : 0,
    minute: Number.isFinite(minute) ? minute : 0,
  };
}


function toMinutes(value) {
  const parsed =
    parseTime(value);

  return (
    parsed.hour * 60 +
    parsed.minute
  );
}


function formatMinutes(total) {
  const normalized =
    ((total % 1440) + 1440) % 1440;

  const hour =
    Math.floor(normalized / 60);

  const minute =
    normalized % 60;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}


function zoneParts(date, timeZone) {
  const formatter =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      }
    );

  const parts =
    Object.fromEntries(
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
}


function offsetMinutes(date, timeZone) {
  const parts =
    zoneParts(date, timeZone);

  const representedAsUtc =
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );

  return Math.round(
    (representedAsUtc - date.getTime()) /
    60000
  );
}


function instantFromBase(
  referenceDate,
  baseZone,
  baseTime
) {
  const base =
    zoneParts(referenceDate, baseZone);

  const parsed =
    parseTime(baseTime);

  const localAsUtc =
    Date.UTC(
      base.year,
      base.month - 1,
      base.day,
      parsed.hour,
      parsed.minute,
      0
    );

  const probe =
    new Date(localAsUtc);

  const offset =
    offsetMinutes(probe, baseZone);

  return new Date(
    localAsUtc -
    offset * 60000
  );
}


function zoneTime(date, timeZone) {
  const parts =
    zoneParts(date, timeZone);

  return `${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}


function daySerial(parts) {
  return Math.round(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day
    ) /
    86400000
  );
}


function dayShift(date, baseZone, targetZone) {
  return (
    daySerial(zoneParts(date, targetZone)) -
    daySerial(zoneParts(date, baseZone))
  );
}


function shiftLabel(shift) {
  if (shift > 0) {
    return 'NEXT DAY';
  }

  if (shift < 0) {
    return 'PREVIOUS DAY';
  }

  return 'SAME DAY';
}


function isWithinWindow(minutes, window) {
  const start =
    toMinutes(window?.[0] ?? '00:00');

  const end =
    toMinutes(window?.[1] ?? '23:59');

  if (start <= end) {
    return (
      minutes >= start &&
      minutes <= end
    );
  }

  return (
    minutes >= start ||
    minutes <= end
  );
}


function periodFor(minutes) {
  const hour =
    Math.floor(minutes / 60);

  if (hour >= 5 && hour < 10) {
    return 'morning';
  }

  if (hour >= 10 && hour < 17) {
    return 'day';
  }

  if (hour >= 17 && hour < 21) {
    return 'evening';
  }

  return 'night';
}


const PERIOD_META = {
  morning: {
    icon: '🌅',
    label: '朝',
    gradient: 'from-orange-100 via-amber-50 to-sky-200',
    dark: false,
  },

  day: {
    icon: '☀️',
    label: '昼',
    gradient: 'from-sky-100 via-blue-50 to-cyan-100',
    dark: false,
  },

  evening: {
    icon: '🌇',
    label: '夕方',
    gradient: 'from-orange-200 via-pink-200 to-violet-300',
    dark: false,
  },

  night: {
    icon: '🌙',
    label: '夜',
    gradient: 'from-slate-900 via-indigo-950 to-violet-950',
    dark: true,
  },
};


function Flag({ code, large = false }) {
  const width = large ? 58 : 44;
  const height = large ? 38 : 29;
  const common = {
    width,
    height,
    viewBox: '0 0 58 38',
    className: 'shrink-0 overflow-hidden rounded-md shadow-sm ring-1 ring-black/10',
  };

  if (code === 'jp') {
    return (
      <svg {...common}>
        <rect width="58" height="38" fill="#fff" />
        <circle cx="29" cy="19" r="9.5" fill="#BC002D" />
      </svg>
    );
  }

  if (code === 'fr') {
    return (
      <svg {...common}>
        <rect width="19.34" height="38" fill="#0055A4" />
        <rect x="19.33" width="19.34" height="38" fill="#fff" />
        <rect x="38.66" width="19.34" height="38" fill="#EF4135" />
      </svg>
    );
  }

  if (code === 'us') {
    return (
      <svg {...common}>
        <rect width="58" height="38" fill="#fff" />
        {Array.from({ length: 7 }, (_, index) => (
          <rect
            key={index}
            y={index * 38 / 7}
            width="58"
            height={38 / 14}
            fill="#B22234"
          />
        ))}
        <rect width="25" height="20" fill="#3C3B6E" />
        {[4,9,14,19].flatMap((x, row) =>
          [4,9,14].map((y, col) => (
            <circle key={`${row}-${col}`} cx={x} cy={y} r="1" fill="#fff" />
          ))
        )}
      </svg>
    );
  }

  if (code === 'ke') {
    return (
      <svg {...common}>
        <rect width="58" height="12" fill="#000" />
        <rect y="12" width="58" height="2" fill="#fff" />
        <rect y="14" width="58" height="10" fill="#BB0000" />
        <rect y="24" width="58" height="2" fill="#fff" />
        <rect y="26" width="58" height="12" fill="#006600" />
        <ellipse cx="29" cy="19" rx="5" ry="12" fill="#BB0000" stroke="#fff" strokeWidth="1" />
      </svg>
    );
  }

  if (code === 'gb') {
    return (
      <svg {...common}>
        <rect width="58" height="38" fill="#012169" />
        <path d="M0 0 L58 38 M58 0 L0 38" stroke="#fff" strokeWidth="8" />
        <path d="M0 0 L58 38 M58 0 L0 38" stroke="#C8102E" strokeWidth="4" />
        <rect x="24" width="10" height="38" fill="#fff" />
        <rect y="14" width="58" height="10" fill="#fff" />
        <rect x="26" width="6" height="38" fill="#C8102E" />
        <rect y="16" width="58" height="6" fill="#C8102E" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect width="58" height="19" fill="#00A1DE" />
      <rect y="19" width="58" height="9.5" fill="#FAD201" />
      <rect y="28.5" width="58" height="9.5" fill="#20603D" />
      <circle cx="47" cy="8" r="4.2" fill="#E5BE01" />
    </svg>
  );
}


function AnalogClock({ time, size = 92, accent = '#2563eb' }) {
  const parsed =
    parseTime(time);

  const hourAngle =
    ((parsed.hour % 12) + parsed.minute / 60) * 30;

  const minuteAngle =
    parsed.minute * 6;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-label={`時計 ${time}`}
    >
      <circle cx="50" cy="50" r="46" fill="#fff" stroke={accent} strokeWidth="4" />

      {Array.from({ length: 12 }, (_, index) => {
        const angle = index * Math.PI / 6;
        const x1 = 50 + Math.sin(angle) * 36;
        const y1 = 50 - Math.cos(angle) * 36;
        const x2 = 50 + Math.sin(angle) * 42;
        const y2 = 50 - Math.cos(angle) * 42;
        return (
          <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#64748b" strokeWidth="2" />
        );
      })}

      <line
        x1="50"
        y1="50"
        x2="50"
        y2="28"
        stroke="#0f172a"
        strokeWidth="6"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 50 50)`}
      />

      <line
        x1="50"
        y1="50"
        x2="50"
        y2="16"
        stroke={accent}
        strokeWidth="4"
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} 50 50)`}
      />

      <circle cx="50" cy="50" r="5" fill={accent} />
    </svg>
  );
}


function Confetti({ amount = 70 }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[25000] overflow-hidden">
      <style>
        {`
          @keyframes tp-confetti {
            0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
            100% { transform: translate3d(var(--x),110vh,0) rotate(940deg); opacity: 0; }
          }
          @keyframes tp-shake {
            0%,100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
          }
          @keyframes tp-glow {
            0%,100% { box-shadow: 0 0 0 rgba(34,211,238,0); }
            50% { box-shadow: 0 0 42px rgba(34,211,238,.75); }
          }
          @keyframes tp-float {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
          @keyframes tp-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      {Array.from({ length: amount }, (_, index) => (
        <span
          key={index}
          className="absolute -top-5 h-3 w-2 rounded-sm"
          style={{
            left: `${(index * 41) % 100}%`,
            background: ['#f97316','#facc15','#22c55e','#3b82f6','#ec4899','#8b5cf6'][index % 6],
            '--x': `${(index % 2 ? 1 : -1) * (25 + (index % 8) * 9)}px`,
            animation: `tp-confetti ${1.6 + (index % 8) * 0.12}s linear ${(index % 11) * 0.04}s forwards`,
          }}
        />
      ))}
    </div>
  );
}


const SCENES = {
  morning: {
    icon: '🌅',
    title: '朝のまち',
    subtitle: 'Breakfast & morning',
    gradient: 'from-orange-200 via-amber-100 to-sky-200',
    foreground: '🏠  🥣  🚲',
  },
  day: {
    icon: '☀️',
    title: '昼のまち',
    subtitle: 'School & daytime',
    gradient: 'from-cyan-100 via-sky-200 to-blue-300',
    foreground: '🏫  🚌  🌳',
  },
  evening: {
    icon: '🌇',
    title: '夕方のまち',
    subtitle: 'Dinner & evening',
    gradient: 'from-orange-300 via-pink-300 to-violet-400',
    foreground: '🏘️  🍛  🚶',
  },
  night: {
    icon: '🌙',
    title: '夜のまち',
    subtitle: 'Night & sleep',
    gradient: 'from-slate-900 via-indigo-950 to-violet-950',
    foreground: '🏙️  🌙  ✨',
  },
};


const COMMONS_FILE_ROOT =
  [
    'https:',
    '',
    'commons.wikimedia.org',
    'wiki',
    'Special:FilePath',
  ].join('/');

const COMMONS_PAGE_ROOT =
  [
    'https:',
    '',
    'commons.wikimedia.org',
    'wiki',
    'File:',
  ].join('/');


function commonsImage(
  fileName
) {
  return (
    COMMONS_FILE_ROOT +
    '/' +
    encodeURIComponent(
      fileName
    ) +
    '?width=1000'
  );
}


function commonsPage(
  fileName
) {
  return (
    COMMONS_PAGE_ROOT +
    encodeURIComponent(
      fileName
    ).replace(
      /%20/g,
      '_'
    )
  );
}


function realPhoto(
  fileName,
  credit,
  license
) {
  return {
    fileName,
    url:
      commonsImage(
        fileName
      ),

    source:
      commonsPage(
        fileName
      ),

    credit,
    license,
  };
}


const REAL_PHOTO_BANK = {
  Tokyo: {
    morning:
      realPhoto(
        'A sunrise and skyscrapers as seen from Shiodome, Tokyo.jpg',
        'Alexandar Vujadinovic',
        'CC BY-SA 4.0'
      ),

    day:
      realPhoto(
        'Tokyo city.jpg',
        'Nikhil$051994',
        'CC BY-SA 4.0'
      ),

    evening:
      realPhoto(
        'Tokyo - Sunset Skyline.jpg',
        'Fred Cherrygarden',
        'CC BY-SA 4.0'
      ),

    night:
      realPhoto(
        'Tokyo Night.jpg',
        'Danny15',
        'CC BY-SA 3.0'
      ),
  },


  Paris: {
    morning:
      realPhoto(
        'Sunrise at Paris.JPG',
        'Sveter',
        'CC BY-SA 2.5'
      ),

    day:
      realPhoto(
        'Skyline of Paris with the Eiffel Tower.jpg',
        'DiscoA340',
        'CC BY-SA 4.0'
      ),

    evening:
      realPhoto(
        'Paris Skyline at Sunset.jpg',
        'DiscoA340',
        'CC BY-SA 4.0'
      ),

    night:
      realPhoto(
        'Paris by night.jpg',
        'Alexandre Buisse (Nattfodd)',
        'Creative Commons'
      ),
  },


  Kigali: {
    morning:
      realPhoto(
        'Kigali in morning.jpg',
        'Lkabilah',
        'CC BY-SA 4.0'
      ),

    day:
      realPhoto(
        'Kigali city view.jpg',
        'Baraka29',
        'Creative Commons'
      ),

    evening:
      realPhoto(
        'Dusk Image of Kigali Rwanda.jpg',
        'Ssamahan',
        'CC BY-SA 4.0'
      ),

    night:
      realPhoto(
        'Kigali (Rwanda) by night.jpg',
        'Ilf_',
        'CC BY-SA 2.0'
      ),
  },
};


function SceneCard({ sceneId, imageUrl, photoCredit, active, wrong, onClick, reveal = false }) {
  const scene =
    SCENES[sceneId];

  return (
    <button
      type="button"
      onClick={onClick}
      style={wrong ? { animation: 'tp-shake .28s ease' } : undefined}
      className={`
        group overflow-hidden rounded-[26px] border-2 text-left transition-all
        ${active ? 'border-emerald-400 ring-4 ring-emerald-100' : wrong ? 'border-rose-400' : 'border-white/70 hover:-translate-y-1 hover:shadow-xl'}
      `}
    >
      <div
        className={`relative h-40 bg-gradient-to-br ${scene.gradient}`}
        style={imageUrl ? {
          backgroundImage: `linear-gradient(rgba(15,23,42,.10),rgba(15,23,42,.28)),url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {!imageUrl && (
          <>
            <div className="absolute left-4 top-4 text-4xl">{scene.icon}</div>
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-4xl drop-shadow">{scene.foreground}</div>
          </>
        )}
        {active && (
          <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 text-6xl">✓</div>
        )}

        {imageUrl && photoCredit && (
          <div className="absolute bottom-2 right-2 max-w-[92%] rounded-full bg-black/65 px-2.5 py-1 text-[9px] font-bold text-white shadow backdrop-blur">
            Photo: {photoCredit} · Wikimedia Commons
          </div>
        )}
      </div>
      <div className="bg-white p-4">
        <p className="font-black text-slate-900">{scene.title}</p>
        <p className="mt-1 text-xs font-bold text-slate-400">{scene.subtitle}</p>
        {reveal && <p className="mt-2 text-xs font-black text-violet-600">{scene.icon} {PERIOD_META[sceneId].label}</p>}
      </div>
    </button>
  );
}


function CityIdentity({ city }) {
  return (
    <div className="flex items-center gap-3">
      <Flag code={city.flagCode} large />
      <div>
        <p className="font-black text-slate-950">{city.city}</p>
        <p className="text-xs font-bold text-slate-500">{city.country}</p>
      </div>
    </div>
  );
}


function Tower({ city, time, solved, wrong, onClick }) {
  const period =
    PERIOD_META[
      periodFor(toMinutes(time ?? '12:00'))
    ];

  return (
    <button
      type="button"
      data-clock-tower={city.id}
      onClick={onClick}
      style={wrong ? { animation: 'tp-shake .28s ease' } : solved ? { animation: 'tp-glow 1.1s ease-in-out 2' } : undefined}
      className={`relative overflow-hidden rounded-[28px] border-2 p-5 transition-all ${solved ? 'border-emerald-400 bg-emerald-50' : wrong ? 'border-rose-400 bg-rose-50' : 'border-dashed border-cyan-300 bg-cyan-50/60 hover:bg-cyan-50'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <CityIdentity city={city} />
        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${solved ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
          {solved ? 'TIME RESTORED' : 'BROKEN CLOCK'}
        </span>
      </div>

      <div className="relative mx-auto mt-5 w-[170px]">
        <div className={`mx-auto h-12 w-28 rounded-t-[34px] bg-gradient-to-b ${solved ? 'from-emerald-400 to-emerald-600' : 'from-slate-400 to-slate-600'}`} />
        <div className={`mx-auto flex h-40 w-36 flex-col items-center rounded-t-xl border-x-[10px] border-slate-700 bg-gradient-to-b ${period.gradient} pt-4 shadow-xl`}>
          <div className={`flex h-24 w-24 items-center justify-center rounded-full border-[6px] ${solved ? 'border-emerald-400 bg-white' : 'border-slate-400 bg-white/75'}`}>
            {solved ? (
              <AnalogClock time={time} size={82} accent="#10b981" />
            ) : (
              <span className="text-4xl font-black text-slate-300">?</span>
            )}
          </div>
          <p className={`mt-2 text-lg font-black ${period.dark && !solved ? 'text-white' : 'text-slate-900'}`}>
            {solved ? time : '??:??'}
          </p>
        </div>
        <div className="mx-auto h-5 w-44 rounded-sm bg-slate-800" />
        {solved && (
          <div className="pointer-events-none absolute -right-2 top-10 text-3xl">✨</div>
        )}
      </div>

      <p className="mt-3 text-center text-xs font-black text-cyan-700">
        {solved ? '時計台が動き出した！' : 'ここへ時計をはめよう'}
      </p>
    </button>
  );
}


export function ClockTowerRescueMission({ mission, onComplete, alreadyCompleted }) {
  const challenge = mission?.challenge ?? {};
  const baseZone = challenge.baseZone ?? 'Africa/Kigali';
  const baseTime = challenge.baseTime ?? '18:00';
  const cities = challenge.targets ?? [
    { id: 'tokyo', city: 'Tokyo', country: '日本', flagCode: 'jp', zone: 'Asia/Tokyo' },
    { id: 'paris', city: 'Paris', country: 'フランス', flagCode: 'fr', zone: 'Europe/Paris' },
    { id: 'nairobi', city: 'Nairobi', country: 'ケニア', flagCode: 'ke', zone: 'Africa/Nairobi' },
    { id: 'new-york', city: 'New York', country: 'アメリカ', flagCode: 'us', zone: 'America/New_York' },
  ];

  const now = useMemo(() => new Date(), []);
  const instant = useMemo(() => instantFromBase(now, baseZone, baseTime), [now, baseZone, baseTime]);

  const answers = useMemo(() => cities.map((city) => ({
    ...city,
    time: zoneTime(instant, city.zone),
    shift: dayShift(instant, baseZone, city.zone),
  })), [cities, instant, baseZone]);

  const cards = useMemo(() => {
    const order = [2, 0, 3, 1];
    return order.map((index) => answers[index]).filter(Boolean);
  }, [answers]);

  const [selectedId, setSelectedId] = useState(null);
  const [drag, setDrag] = useState(null);
  const [placed, setPlaced] = useState({});
  const [wrongTower, setWrongTower] = useState(null);
  const [cleared, setCleared] = useState(false);

  const tryPlace = (cardId, towerId) => {
    if (!cardId || placed[cardId] || cleared) return;

    if (cardId !== towerId) {
      sound('wrong');
      setWrongTower(towerId);
      window.setTimeout(() => setWrongTower((current) => current === towerId ? null : current), 650);
      return;
    }

    sound('correct');
    const next = { ...placed, [cardId]: true };
    setPlaced(next);
    setSelectedId(null);

    if (Object.keys(next).length === answers.length) {
      window.setTimeout(() => {
        sound('clear');
        setCleared(true);
        onComplete?.(mission);
      }, 450);
    }
  };

  return (
    <div>
      {cleared && <Confetti amount={80} />}

      <div className="rounded-[30px] border border-cyan-200 bg-gradient-to-r from-cyan-50 via-blue-50 to-violet-50 p-6">
        <p className="text-xs font-black tracking-[.18em] text-cyan-700">MISSION 05 · CLOCK TOWER RESCUE</p>
        <h3 className="mt-2 text-3xl font-black text-slate-950">🏰 こわれた世界の時計台をなおせ！</h3>
        <p className="mt-2 font-bold leading-7 text-slate-600">
          キガリが <strong>{baseTime}</strong> の同じ瞬間。下の時計を正しい国の時計台にはめよう。
        </p>
      </div>

      <div className="mt-5 flex items-center gap-4 rounded-[24px] border-2 border-orange-200 bg-orange-50 p-5">
        <Flag code="rw" large />
        <div>
          <p className="text-[10px] font-black tracking-[.14em] text-orange-600">MASTER CLOCK</p>
          <p className="font-black text-slate-950">Kigali · Rwanda</p>
        </div>
        <p className="ml-auto text-4xl font-black text-slate-950">{baseTime}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((card) => {
          const done = placed[card.id];
          const selected = selectedId === card.id;
          return (
            <div
              key={card.id}
              className={`touch-none select-none rounded-[24px] border-2 bg-white p-4 text-center shadow-sm transition-all ${selected ? 'border-cyan-500 ring-4 ring-cyan-100' : 'border-slate-200'} ${done ? 'opacity-45' : 'hover:-translate-y-1 hover:shadow-lg'}`}
              onClick={() => !done && setSelectedId(card.id)}
              onPointerDown={(event) => {
                if (done) return;
                setSelectedId(card.id);
                setDrag({ id: card.id, x: event.clientX, y: event.clientY });
                event.currentTarget.setPointerCapture?.(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (drag?.id === card.id) setDrag({ id: card.id, x: event.clientX, y: event.clientY });
              }}
              onPointerUp={(event) => {
                const element = document.elementFromPoint(event.clientX, event.clientY);
                const tower = element?.closest?.('[data-clock-tower]');
                const towerId = tower?.getAttribute('data-clock-tower');
                setDrag(null);
                if (towerId) tryPlace(card.id, towerId);
              }}
              onPointerCancel={() => setDrag(null)}
            >
              <AnalogClock time={card.time} size={92} accent={selected ? '#06b6d4' : '#2563eb'} />
              <p className="mt-2 text-2xl font-black text-slate-950">{card.time}</p>
              <p className="mt-1 text-[10px] font-black text-violet-500">{shiftLabel(card.shift)}</p>
              <p className="mt-2 text-[10px] font-bold text-slate-400">都市名はヒミツ</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {answers.map((city) => (
          <Tower
            key={city.id}
            city={city}
            time={city.time}
            solved={Boolean(placed[city.id])}
            wrong={wrongTower === city.id}
            onClick={() => selectedId && tryPlace(selectedId, city.id)}
          />
        ))}
      </div>

      {cleared && (
        <div className="mt-6 rounded-[30px] border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-cyan-50 p-7 text-center">
          <p className="text-4xl">🏰✨🌍✨🏰</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">WORLD CLOCK NETWORK RESTORED!</p>
          <p className="mt-2 font-bold text-slate-600">4つの都市の時計台が同じ瞬間を別々の現地時刻で動き始めました。</p>
          {alreadyCompleted && <p className="mt-2 text-xs font-bold text-slate-400">このMissionはクリア済みです。</p>}
        </div>
      )}

      {drag && (
        <div
          className="pointer-events-none fixed z-[26000] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow-2xl ring-4 ring-cyan-200"
          style={{ left: drag.x, top: drag.y }}
        >
          <AnalogClock time={cards.find((card) => card.id === drag.id)?.time ?? '00:00'} size={86} accent="#06b6d4" />
        </div>
      )}
    </div>
  );
}


export function PhotoTimeDetectiveMission({ mission, onComplete, alreadyCompleted }) {
  const challenge = mission?.challenge ?? {};
  const baseZone = challenge.baseZone ?? 'Africa/Kigali';
  const rounds = challenge.rounds ?? [
    { baseTime: '00:30', targetCity: 'Tokyo', targetZone: 'Asia/Tokyo', flagCode: 'jp' },
    { baseTime: '10:00', targetCity: 'Tokyo', targetZone: 'Asia/Tokyo', flagCode: 'jp' },
    { baseTime: '18:30', targetCity: 'Paris', targetZone: 'Europe/Paris', flagCode: 'fr' },
  ];

  const now = useMemo(() => new Date(), []);
  const [index, setIndex] = useState(0);
  const [wrong, setWrong] = useState(null);
  const [correct, setCorrect] = useState(null);
  const [finished, setFinished] = useState(false);
  const round = rounds[index];

  const roundBaseZone =
    round.baseZone ??
    baseZone;

  const baseLabel =
    round.baseLabel ??
    'RW KIGALI';

  const instant =
    instantFromBase(
      now,
      roundBaseZone,
      round.baseTime
    );

  const targetTime =
    zoneTime(
      instant,
      round.targetZone
    );

  const photoSet =
    REAL_PHOTO_BANK[
      round.targetCity
    ] ??
    REAL_PHOTO_BANK.Tokyo;
  const targetMinutes = toMinutes(targetTime);
  const answer = periodFor(targetMinutes);

  const choose = (sceneId) => {
    if (finished || correct) return;
    if (sceneId !== answer) {
      sound('wrong');
      setWrong(sceneId);
      window.setTimeout(() => setWrong(null), 600);
      return;
    }

    sound('correct');
    setCorrect(sceneId);

    if (index === rounds.length - 1) {
      window.setTimeout(() => {
        sound('clear');
        setFinished(true);
        onComplete?.(mission);
      }, 700);
    }
    else {
      window.setTimeout(() => {
        setIndex((value) => value + 1);
        setCorrect(null);
        setWrong(null);
      }, 900);
    }
  };

  return (
    <div>
      {finished && <Confetti />}

      <div className="rounded-[30px] border border-fuchsia-200 bg-gradient-to-r from-pink-50 via-orange-50 to-sky-50 p-6">
        <p className="text-xs font-black tracking-[.18em] text-fuchsia-600">MISSION 06 · PHOTO TIME DETECTIVE</p>
        <h3 className="mt-2 text-3xl font-black text-slate-950">📸 写真の時間帯を見ぬけ！</h3>
        <p className="mt-2 font-bold text-slate-600">キガリの時刻から、同じ瞬間の {round.targetCity} の町の様子を選ぼう。</p>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-[28px] bg-slate-950 p-5 text-white">
        <div className="text-center">
          <p className="text-xs font-black text-orange-300">{baseLabel}</p>
          <p className="mt-1 text-4xl font-black">{round.baseTime}</p>
        </div>
        <div className="text-4xl">→</div>
        <div className="text-center">
          <p className="text-xs font-black text-cyan-300">{round.targetCity}</p>
          <p className="mt-1 text-4xl font-black">??:??</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.keys(SCENES).map((sceneId) => {
          const photo =
            photoSet?.[
              sceneId
            ];

          return (
            <SceneCard
              key={sceneId}
              sceneId={sceneId}
              imageUrl={
                photo?.url
              }
              photoCredit={
                photo?.credit
              }
              wrong={
                wrong ===
                sceneId
              }
              active={
                correct ===
                sceneId
              }
              onClick={() =>
                choose(
                  sceneId
                )
              }
            />
          );
        })}
      </div>

      {/* M6 PHOTO SOURCES */}
      <details className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <summary className="cursor-pointer text-xs font-black text-slate-600">
          📷 Sources & Credits · 実写真の出典
        </summary>

        <div className="mt-3 grid gap-2 text-[11px] font-bold text-slate-500 md:grid-cols-2">
          {Object.entries(photoSet).map(
            ([sceneId, photo]) => (
              <a
                key={sceneId}
                href={photo.source}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl bg-white px-3 py-2 hover:text-violet-700 hover:underline"
              >
                {PERIOD_META[sceneId]?.icon}
                {' '}
                {PERIOD_META[sceneId]?.label}
                {' · '}
                {photo.credit}
                {' · '}
                {photo.license}
              </a>
            )
          )}
        </div>
      </details>


      {correct && (
        <div className="mt-5 rounded-[24px] border-2 border-emerald-300 bg-emerald-50 p-5 text-center">
          <p className="text-2xl font-black text-emerald-800">ピンポン♪ {round.targetCity} は {targetTime}！</p>
          <p className="mt-1 font-bold text-slate-600">{PERIOD_META[answer].icon} {PERIOD_META[answer].label}の時間帯です。</p>
        </div>
      )}

      <div className="mt-5 text-center text-xs font-black text-slate-400">CASE {index + 1} / {rounds.length}</div>

      {finished && (
        <div className="mt-6 rounded-[30px] bg-gradient-to-r from-fuchsia-500 to-violet-600 p-7 text-center text-white shadow-xl">
          <p className="text-4xl">📸✨</p>
          <p className="mt-2 text-3xl font-black">PHOTO TIME MASTER!</p>
          <p className="mt-2 font-bold text-violet-100">時計の数字だけでなく、世界の生活の時間帯もイメージできました。</p>
          {alreadyCompleted && <p className="mt-2 text-xs text-white/60">クリア済みMissionです。</p>}
        </div>
      )}
    </div>
  );
}


export function SoundTimeDetectiveMission({ mission, onComplete, alreadyCompleted }) {
  const challenge = mission?.challenge ?? {};
  const baseZone = challenge.baseZone ?? 'Africa/Kigali';
  const rounds = challenge.rounds ?? [
    { baseTime: '22:00', targetCity: 'Tokyo', targetZone: 'Asia/Tokyo' },
    { baseTime: '06:00', targetCity: 'Tokyo', targetZone: 'Asia/Tokyo' },
    { baseTime: '15:00', targetCity: 'New York', targetZone: 'America/New_York' },
  ];

  const now = useMemo(() => new Date(), []);
  const [index, setIndex] = useState(0);
  const [heard, setHeard] = useState(null);
  const [wrong, setWrong] = useState(null);
  const [correct, setCorrect] = useState(null);
  const [finished, setFinished] = useState(false);
  const round = rounds[index];
  const instant = instantFromBase(now, baseZone, round.baseTime);
  const targetTime = zoneTime(instant, round.targetZone);
  const answer = periodFor(toMinutes(targetTime));

  const choose = (kind) => {
    if (finished || correct) return;
    if (kind !== answer) {
      sound('wrong');
      setWrong(kind);
      window.setTimeout(() => setWrong(null), 600);
      return;
    }

    sound('correct');
    setCorrect(kind);

    if (index === rounds.length - 1) {
      window.setTimeout(() => {
        sound('clear');
        setFinished(true);
        onComplete?.(mission);
      }, 750);
    }
    else {
      window.setTimeout(() => {
        setIndex((value) => value + 1);
        setHeard(null);
        setWrong(null);
        setCorrect(null);
      }, 950);
    }
  };

  return (
    <div>
      {finished && <Confetti amount={75} />}

      <div className="rounded-[30px] border border-violet-200 bg-gradient-to-r from-indigo-950 via-violet-950 to-fuchsia-950 p-6 text-white">
        <p className="text-xs font-black tracking-[.18em] text-cyan-300">MISSION 07 · SOUND TIME DETECTIVE</p>
        <h3 className="mt-2 text-3xl font-black">🎧 音で時間帯を当てろ！</h3>
        <p className="mt-2 font-bold text-violet-200">Kigali {round.baseTime} と同じ瞬間。{round.targetCity} で聞こえそうな時間帯のサウンドはどれ？</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.keys(SCENES).map((kind) => {
          const meta = PERIOD_META[kind];
          const isWrong = wrong === kind;
          const isCorrect = correct === kind;
          return (
            <div
              key={kind}
              style={isWrong ? { animation: 'tp-shake .28s ease' } : undefined}
              className={`overflow-hidden rounded-[26px] border-2 bg-gradient-to-br ${meta.gradient} p-5 text-center transition-all ${isCorrect ? 'border-emerald-400 ring-4 ring-emerald-100' : isWrong ? 'border-rose-400' : 'border-white/70 shadow-lg'}`}
            >
              <p className="text-5xl">{meta.icon}</p>
              <p className={`mt-2 font-black ${meta.dark ? 'text-white' : 'text-slate-900'}`}>{meta.label}の音</p>

              <button
                type="button"
                onClick={() => {
                  setHeard(kind);
                  playSceneSound(kind);
                }}
                className={`mt-4 w-full rounded-2xl px-4 py-3 text-sm font-black ${meta.dark ? 'bg-white/15 text-white' : 'bg-white/80 text-slate-800'}`}
              >
                🔊 音を聞く
              </button>

              <div className="mt-3 flex h-10 items-end justify-center gap-1">
                {Array.from({ length: 7 }, (_, bar) => (
                  <span
                    key={bar}
                    className={`w-2 rounded-full ${heard === kind ? 'bg-cyan-400' : meta.dark ? 'bg-white/25' : 'bg-slate-300'}`}
                    style={{
                      height: heard === kind ? `${14 + ((bar * 11) % 26)}px` : `${8 + ((bar * 7) % 12)}px`,
                      transition: 'height 200ms ease',
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => choose(kind)}
                className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
              >
                これだ！
              </button>
            </div>
          );
        })}
      </div>

      {correct && (
        <div className="mt-5 rounded-[24px] border-2 border-emerald-300 bg-emerald-50 p-5 text-center">
          <p className="text-2xl font-black text-emerald-800">正解！ {round.targetCity} は {targetTime}</p>
          <p className="mt-1 font-bold text-slate-600">{PERIOD_META[answer].label}の時間帯です。</p>
        </div>
      )}

      <div className="mt-5 text-center text-xs font-black text-slate-400">SOUND CASE {index + 1} / {rounds.length}</div>

      {finished && (
        <div className="mt-6 rounded-[30px] bg-gradient-to-r from-indigo-600 to-fuchsia-600 p-7 text-center text-white shadow-xl">
          <p className="text-4xl">🎧🌍✨</p>
          <p className="mt-2 text-3xl font-black">WORLD SOUND DETECTIVE!</p>
          <p className="mt-2 font-bold text-indigo-100">世界の時刻を「音のある生活」と結びつけられました。</p>
          {alreadyCompleted && <p className="mt-2 text-xs text-white/60">クリア済みMissionです。</p>}
        </div>
      )}
    </div>
  );
}


export function TimeOrderRaceMission({ mission, onComplete, alreadyCompleted }) {
  const challenge = mission?.challenge ?? {};
  const baseZone = challenge.baseZone ?? 'Africa/Kigali';
  const baseTime = challenge.baseTime ?? '12:00';
  const cities = challenge.cities ?? [
    { id: 'new-york', city: 'New York', country: 'アメリカ', flagCode: 'us', zone: 'America/New_York' },
    { id: 'london', city: 'London', country: 'イギリス', flagCode: 'gb', zone: 'Europe/London' },
    { id: 'kigali', city: 'Kigali', country: 'ルワンダ', flagCode: 'rw', zone: 'Africa/Kigali' },
    { id: 'nairobi', city: 'Nairobi', country: 'ケニア', flagCode: 'ke', zone: 'Africa/Nairobi' },
    { id: 'tokyo', city: 'Tokyo', country: '日本', flagCode: 'jp', zone: 'Asia/Tokyo' },
  ];

  const now = useMemo(() => new Date(), []);
  const instant = useMemo(() => instantFromBase(now, baseZone, baseTime), [now, baseZone, baseTime]);
  const cityData = useMemo(() => cities.map((city) => ({
    ...city,
    offset: offsetMinutes(instant, city.zone),
    time: zoneTime(instant, city.zone),
  })), [cities, instant]);

  const correctOrder = useMemo(() => [...cityData].sort((a, b) => a.offset - b.offset).map((city) => city.id), [cityData]);
  const [picked, setPicked] = useState([]);
  const [wrongId, setWrongId] = useState(null);
  const [finished, setFinished] = useState(false);

  const choose = (city) => {
    if (finished || picked.includes(city.id)) return;
    const expected = correctOrder[picked.length];
    if (city.id !== expected) {
      sound('wrong');
      setWrongId(city.id);
      window.setTimeout(() => setWrongId(null), 600);
      return;
    }

    sound('correct');
    const next = [...picked, city.id];
    setPicked(next);
    if (next.length === correctOrder.length) {
      window.setTimeout(() => {
        sound('clear');
        setFinished(true);
        onComplete?.(mission);
      }, 600);
    }
  };

  return (
    <div>
      {finished && <Confetti />}

      <div className="rounded-[30px] border border-orange-200 bg-gradient-to-r from-orange-50 via-amber-50 to-cyan-50 p-6">
        <p className="text-xs font-black tracking-[.18em] text-orange-600">MISSION 08 · TIME ORDER RACE</p>
        <h3 className="mt-2 text-3xl font-black text-slate-950">✈️ 世界の時計レース！</h3>
        <p className="mt-2 font-bold text-slate-600">同じ瞬間の5都市を、時計がいちばん遅い地域 → いちばん進んでいる地域の順にタップしよう。</p>
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] bg-slate-950 p-5 text-white">
        <div className="relative h-24">
          <div className="absolute left-4 right-4 top-12 h-2 rounded-full bg-white/20" />
          <div className="absolute left-4 top-7 text-3xl">🌎</div>
          <div
            className="absolute top-6 text-4xl transition-all duration-500"
            style={{ left: `${8 + (picked.length / correctOrder.length) * 80}%` }}
          >
            ✈️
          </div>
          <div className="absolute right-4 top-7 text-3xl">🌏</div>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {correctOrder.map((id, index) => {
            const city = cityData.find((item) => item.id === id);
            const revealed = picked.includes(id);
            return (
              <div key={id} className={`rounded-xl p-2 text-center ${revealed ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
                <p className="text-[10px] font-black text-white/50">{index + 1}</p>
                <p className="mt-1 text-xs font-black">{revealed ? city.city : '???'}</p>
                {revealed && <p className="mt-1 text-xs text-cyan-300">{city.time}</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {cityData.map((city) => {
          const done = picked.includes(city.id);
          const wrong = wrongId === city.id;
          return (
            <button
              key={city.id}
              type="button"
              disabled={done || finished}
              onClick={() => choose(city)}
              style={wrong ? { animation: 'tp-shake .28s ease' } : undefined}
              className={`rounded-[22px] border-2 p-4 text-center transition-all ${done ? 'border-emerald-300 bg-emerald-50 opacity-50' : wrong ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white hover:-translate-y-1 hover:shadow-lg'}`}
            >
              <div className="flex justify-center"><Flag code={city.flagCode} /></div>
              <p className="mt-2 text-sm font-black text-slate-950">{city.city}</p>
              <p className="mt-1 text-[10px] font-bold text-slate-400">{city.country}</p>
              {done && <p className="mt-2 text-xs font-black text-emerald-600">✓ {city.time}</p>}
            </button>
          );
        })}
      </div>

      <p className="mt-5 text-center text-xs font-black text-slate-400">{picked.length} / {correctOrder.length} CITIES</p>

      {finished && (
        <div className="mt-6 rounded-[30px] bg-gradient-to-r from-orange-500 to-violet-600 p-7 text-center text-white shadow-xl">
          <p className="text-4xl">✈️🌍🏁</p>
          <p className="mt-2 text-3xl font-black">TIME ORDER RACE CLEAR!</p>
          <p className="mt-2 font-bold text-white/80">時差の「西から東へ進む感覚」を5都市でつかみました。</p>
          {alreadyCompleted && <p className="mt-2 text-xs text-white/60">クリア済みMissionです。</p>}
        </div>
      )}
    </div>
  );
}


function MeetingCityCard({ status }) {
  const meta = PERIOD_META[status.period];
  return (
    <div className={`rounded-[24px] border-2 bg-gradient-to-br ${meta.gradient} p-4 transition-all ${status.available ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-rose-200'}`}>
      <div className="flex items-center gap-3">
        <Flag code={status.flagCode} />
        <div>
          <p className={`font-black ${meta.dark && !status.available ? 'text-white' : 'text-slate-950'}`}>{status.city}</p>
          <p className={`text-xs font-bold ${meta.dark && !status.available ? 'text-indigo-200' : 'text-slate-500'}`}>{status.country}</p>
        </div>
        <div className="ml-auto text-right">
          <p className={`text-2xl font-black ${status.available ? 'text-emerald-700' : meta.dark ? 'text-white' : 'text-slate-900'}`}>{status.localTime}</p>
          <p className="text-[10px] font-black text-violet-500">{shiftLabel(status.shift)}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1 text-[10px] font-black ${status.available ? 'bg-emerald-600 text-white' : 'bg-rose-500 text-white'}`}>
          {status.available ? '● ONLINE' : '● NOT AVAILABLE'}
        </span>
        <span className={`text-xs font-black ${meta.dark && !status.available ? 'text-indigo-100' : 'text-slate-500'}`}>{meta.icon} {meta.label}</span>
      </div>
      <p className={`mt-2 text-[10px] font-bold ${meta.dark && !status.available ? 'text-indigo-200' : 'text-slate-400'}`}>参加可能 {status.availability[0]}–{status.availability[1]}</p>
    </div>
  );
}


function useMeetingStatuses({ cities, baseZone, minutes, now }) {
  const baseTime = formatMinutes(minutes);
  const instant = useMemo(() => instantFromBase(now, baseZone, baseTime), [now, baseZone, baseTime]);
  return useMemo(() => cities.map((city) => {
    const localTime = zoneTime(instant, city.zone);
    const localMinutes = toMinutes(localTime);
    return {
      ...city,
      localTime,
      localMinutes,
      shift: dayShift(instant, baseZone, city.zone),
      period: periodFor(localMinutes),
      available: isWithinWindow(localMinutes, city.availability),
    };
  }), [cities, instant, baseZone]);
}


export function GlobalMeetingPlannerMission({ mission, onComplete, alreadyCompleted }) {
  const challenge = mission?.challenge ?? {};
  const baseZone = challenge.baseZone ?? 'Africa/Kigali';
  const cities = challenge.cities ?? [
    { id: 'kigali', city: 'Kigali', country: 'ルワンダ', flagCode: 'rw', zone: 'Africa/Kigali', availability: ['13:00','18:00'] },
    { id: 'tokyo', city: 'Tokyo', country: '日本', flagCode: 'jp', zone: 'Asia/Tokyo', availability: ['20:00','23:00'] },
    { id: 'paris', city: 'Paris', country: 'フランス', flagCode: 'fr', zone: 'Europe/Paris', availability: ['12:00','18:00'] },
    { id: 'new-york', city: 'New York', country: 'アメリカ', flagCode: 'us', zone: 'America/New_York', availability: ['07:00','12:00'] },
  ];

  const now = useMemo(() => new Date(), []);
  const [minutes, setMinutes] = useState(toMinutes(challenge.initialTime ?? '23:00'));
  const [dragging, setDragging] = useState(false);
  const [hint, setHint] = useState(0);
  const [finished, setFinished] = useState(false);
  const trackRef = useRef(null);
  const statuses = useMeetingStatuses({ cities, baseZone, minutes, now });
  const onlineCount = statuses.filter((city) => city.available).length;
  const allOnline = onlineCount === statuses.length;

  useEffect(() => {
    if (!allOnline || finished) return undefined;
    const timer = window.setTimeout(() => {
      sound('clear');
      setFinished(true);
      onComplete?.(mission);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [allOnline, finished, mission, onComplete]);

  const updateFromPointer = (event) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || finished) return;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const next = (Math.round((ratio * 1440) / 30) * 30) % 1440;
    setMinutes((current) => {
      if (current !== next) sound('tick');
      return next;
    });
  };

  return (
    <div>
      {finished && <Confetti amount={80} />}

      <div className="rounded-[30px] bg-gradient-to-r from-slate-950 via-indigo-950 to-cyan-950 p-6 text-white shadow-xl">
        <p className="text-xs font-black tracking-[.18em] text-cyan-300">MISSION 09 · GLOBAL MEETING PLANNER</p>
        <h3 className="mt-2 text-3xl font-black">🤝 世界4都市を同時につなげ！</h3>
        <p className="mt-2 font-bold text-indigo-200">衛星を動かして、全員が参加できる30分を見つけよう。</p>
      </div>

      <div className="mt-6 rounded-[30px] border border-indigo-200 bg-white p-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[.16em] text-indigo-600">KIGALI MASTER TIMELINE</p>
            <p className="mt-1 text-4xl font-black text-slate-950">{formatMinutes(minutes)}</p>
          </div>
          <div className={`rounded-full px-5 py-3 text-sm font-black ${allOnline ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {onlineCount} / {statuses.length} ONLINE
          </div>
        </div>

        <div
          ref={trackRef}
          className="relative mt-7 h-28 touch-none select-none"
          onPointerDown={(event) => {
            setDragging(true);
            event.currentTarget.setPointerCapture?.(event.pointerId);
            updateFromPointer(event);
          }}
          onPointerMove={(event) => dragging && updateFromPointer(event)}
          onPointerUp={() => setDragging(false)}
          onPointerCancel={() => setDragging(false)}
        >
          <div className="absolute left-0 right-0 top-12 h-3 rounded-full bg-gradient-to-r from-indigo-300 via-cyan-300 to-violet-300" />
          {['00','06','12','18','24'].map((label, index) => (
            <div key={label} className="absolute top-16 -translate-x-1/2 text-[10px] font-black text-slate-400" style={{ left: `${index * 25}%` }}>{label}:00</div>
          ))}
          <div
            className="absolute top-0 -translate-x-1/2 text-center transition-[left] duration-100"
            style={{ left: `${(minutes / 1440) * 100}%` }}
          >
            <div className="rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 p-3 text-3xl shadow-xl ring-4 ring-white">🛰️</div>
            <p className="mt-1 rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{formatMinutes(minutes)}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        {statuses.map((status) => <MeetingCityCard key={status.id} status={status} />)}
      </div>

      {!finished && (
        <button
          type="button"
          onClick={() => setHint((value) => value >= 2 ? 0 : value + 1)}
          className="mt-5 w-full rounded-2xl bg-amber-50 py-3 font-black text-amber-700"
        >
          💡 {hint === 0 ? 'ヒントを見る' : hint === 1 ? 'もう1つヒント' : 'ヒントをかくす'}
        </button>
      )}

      {hint === 1 && <div className="mt-3 rounded-2xl bg-amber-50 p-4 text-center font-black text-amber-800">Tokyoが夜遅くなりすぎず、New Yorkが朝早すぎないところを探そう。</div>}
      {hint === 2 && <div className="mt-3 rounded-2xl bg-amber-50 p-4 text-center font-black text-amber-900">Kigaliの午後の時間帯をゆっくり探してみよう。</div>}

      {finished && (
        <div className="mt-6 rounded-[30px] bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 p-7 text-center text-white shadow-xl">
          <p className="text-5xl">🌍〰️🛰️〰️🌏</p>
          <p className="mt-2 text-3xl font-black">GLOBAL CLASSROOM CONNECTED!</p>
          <p className="mt-2 font-bold text-white/85">相手の生活時間まで考えて、世界をつなぐ時刻を見つけました。</p>
          {alreadyCompleted && <p className="mt-2 text-xs text-white/60">クリア済みMissionです。</p>}
        </div>
      )}
    </div>
  );
}


function BossHeader({ stage }) {
  return (
    <div className="overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-950 via-violet-950 to-fuchsia-950 p-6 text-white shadow-2xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black tracking-[.20em] text-amber-300">MISSION 10 · FINAL BOSS</p>
          <h3 className="mt-2 text-3xl font-black md:text-4xl">🪐 TIME PALETTE CONTROL ROOM</h3>
          <p className="mt-2 font-bold text-violet-200">時差・日付・生活時間を全部使って世界時間システムを起動せよ。</p>
        </div>
        <div className="flex gap-2">
          {[1,2,3].map((number) => (
            <div key={number} className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${stage > number ? 'bg-emerald-500' : stage === number ? 'bg-amber-400 text-slate-950' : 'bg-white/10 text-white/40'}`}>
              {stage > number ? '✓' : number}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


function OrbitGlobe({ stage }) {
  return (
    <div className="relative mx-auto mt-6 h-48 w-48">
      <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-800 shadow-[0_0_60px_rgba(34,211,238,.45)]">
        <div className="absolute inset-[18%] rounded-full border border-white/25" />
        <div className="absolute left-1/2 top-0 h-full w-px bg-white/20" />
        <div className="absolute left-0 top-1/2 h-px w-full bg-white/20" />
        <div className="absolute inset-0 flex items-center justify-center text-5xl">🌍</div>
      </div>
      <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-300/40" style={{ animation: 'tp-spin 9s linear infinite' }}>
        <div className="absolute left-1/2 top-[-12px] -translate-x-1/2">🇯🇵</div>
        <div className="absolute bottom-[-12px] left-1/2 -translate-x-1/2">🇷🇼</div>
        <div className="absolute left-[-12px] top-1/2 -translate-y-1/2">🇺🇸</div>
        <div className="absolute right-[-12px] top-1/2 -translate-y-1/2">🇫🇷</div>
      </div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-1 text-xs font-black text-cyan-300">CORE {stage}/3</div>
    </div>
  );
}


export function TimeMasterFinalMission({ mission, onComplete, alreadyCompleted }) {
  const challenge = mission?.challenge ?? {};
  const now = useMemo(() => new Date(), []);
  const [stage, setStage] = useState(1);
  const [wrong, setWrong] = useState(null);
  const [finished, setFinished] = useState(false);

  const gateBaseTime = challenge.gateBaseTime ?? '23:00';
  const gateInstant = instantFromBase(now, 'Africa/Kigali', gateBaseTime);
  const tokyoTime = zoneTime(gateInstant, 'Asia/Tokyo');
  const gateChoices = [tokyoTime, formatMinutes(toMinutes(tokyoTime) - 7 * 60), formatMinutes(toMinutes(tokyoTime) + 5 * 60)];

  const senseBaseTime = challenge.senseBaseTime ?? '07:00';
  const senseInstant = instantFromBase(now, 'Africa/Kigali', senseBaseTime);
  const senseTokyo = zoneTime(senseInstant, 'Asia/Tokyo');
  const senseAnswer = periodFor(toMinutes(senseTokyo));

  const bossCities = challenge.cities ?? [
    { id: 'kigali', city: 'Kigali', country: 'ルワンダ', flagCode: 'rw', zone: 'Africa/Kigali', availability: ['13:00','18:00'] },
    { id: 'tokyo', city: 'Tokyo', country: '日本', flagCode: 'jp', zone: 'Asia/Tokyo', availability: ['20:00','23:00'] },
    { id: 'new-york', city: 'New York', country: 'アメリカ', flagCode: 'us', zone: 'America/New_York', availability: ['07:00','12:00'] },
  ];
  const [meetingMinutes, setMeetingMinutes] = useState(toMinutes('23:00'));
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef(null);
  const bossStatuses = useMeetingStatuses({ cities: bossCities, baseZone: 'Africa/Kigali', minutes: meetingMinutes, now });
  const bossAllOnline = bossStatuses.every((city) => city.available);

  useEffect(() => {
    if (stage !== 3 || !bossAllOnline || finished) return undefined;
    const timer = window.setTimeout(() => {
      sound('clear');
      setFinished(true);
      onComplete?.(mission);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [stage, bossAllOnline, finished, mission, onComplete]);

  const bossPointer = (event) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || finished) return;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const next = (Math.round((ratio * 1440) / 30) * 30) % 1440;
    setMeetingMinutes((current) => {
      if (current !== next) sound('tick');
      return next;
    });
  };

  return (
    <div>
      {finished && <Confetti amount={110} />}
      <BossHeader stage={finished ? 4 : stage} />
      <OrbitGlobe stage={Math.min(stage, 3)} />

      {stage === 1 && !finished && (
        <div className="mt-6 rounded-[30px] border-2 border-cyan-200 bg-cyan-50 p-6">
          <p className="text-xs font-black tracking-[.18em] text-cyan-700">GATE 1 · DATE JUMP</p>
          <h4 className="mt-2 text-2xl font-black text-slate-950">🕛 Kigali {gateBaseTime} → Tokyo は？</h4>
          <p className="mt-2 font-bold text-slate-600">日付をまたぐことに注意して、正しい時計コアを選ぼう。</p>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {gateChoices.map((time, index) => (
              <button
                key={`${time}-${index}`}
                type="button"
                onClick={() => {
                  if (time !== tokyoTime) {
                    sound('wrong');
                    setWrong(`gate-${index}`);
                    window.setTimeout(() => setWrong(null), 600);
                    return;
                  }
                  sound('correct');
                  window.setTimeout(() => setStage(2), 650);
                }}
                style={wrong === `gate-${index}` ? { animation: 'tp-shake .28s ease' } : undefined}
                className="rounded-[24px] border-2 border-white bg-white p-4 shadow-lg hover:-translate-y-1"
              >
                <AnalogClock time={time} size={92} />
                <p className="mt-2 text-xl font-black text-slate-950">{time}</p>
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-xs font-black text-violet-600">正解は NEXT DAY の時刻になるよ。</p>
        </div>
      )}

      {stage === 2 && !finished && (
        <div className="mt-6 rounded-[30px] border-2 border-fuchsia-200 bg-fuchsia-50 p-6">
          <p className="text-xs font-black tracking-[.18em] text-fuchsia-700">GATE 2 · LIFE SIGNAL</p>
          <h4 className="mt-2 text-2xl font-black text-slate-950">📸 Kigali {senseBaseTime} と同じ瞬間の Tokyo を見ぬけ！</h4>
          <p className="mt-2 font-bold text-slate-600">正しい生活シーンを選んでTIME SIGNALを復旧しよう。</p>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {Object.keys(SCENES).map((sceneId) => (
              <SceneCard
                key={sceneId}
                sceneId={sceneId}
                wrong={wrong === `scene-${sceneId}`}
                onClick={() => {
                  if (sceneId !== senseAnswer) {
                    sound('wrong');
                    setWrong(`scene-${sceneId}`);
                    window.setTimeout(() => setWrong(null), 600);
                    return;
                  }
                  sound('correct');
                  window.setTimeout(() => setStage(3), 700);
                }}
              />
            ))}
          </div>
          <p className="mt-4 text-center text-xs font-black text-violet-600">正しいTokyo時刻はクリア後にCONTROL ROOMで確認できます。</p>
        </div>
      )}

      {stage === 3 && !finished && (
        <div className="mt-6 rounded-[30px] border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-cyan-50 p-6">
          <p className="text-xs font-black tracking-[.18em] text-amber-700">FINAL GATE · GLOBAL CONNECTION</p>
          <h4 className="mt-2 text-2xl font-black text-slate-950">🛰️ 3都市を同時にONLINEにせよ！</h4>
          <p className="mt-2 font-bold text-slate-600">最後は数字だけでなく、相手の参加できる生活時間まで考えよう。</p>

          <div
            ref={trackRef}
            className="relative mt-7 h-28 touch-none select-none rounded-[24px] bg-slate-950 p-4"
            onPointerDown={(event) => {
              setDragging(true);
              event.currentTarget.setPointerCapture?.(event.pointerId);
              bossPointer(event);
            }}
            onPointerMove={(event) => dragging && bossPointer(event)}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
          >
            <div className="absolute left-6 right-6 top-12 h-2 rounded-full bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-400" />
            <div
              className="absolute top-3 -translate-x-1/2 text-center transition-[left] duration-100"
              style={{ left: `${(meetingMinutes / 1440) * 100}%` }}
            >
              <div className="text-4xl">🛰️</div>
              <p className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-950">{formatMinutes(meetingMinutes)}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {bossStatuses.map((status) => <MeetingCityCard key={status.id} status={status} />)}
          </div>
        </div>
      )}

      {finished && (
        <div className="mt-7 overflow-hidden rounded-[36px] bg-gradient-to-br from-amber-300 via-fuchsia-500 to-indigo-700 p-[3px] shadow-2xl">
          <div className="rounded-[33px] bg-slate-950 p-8 text-center text-white">
            <p className="text-6xl">🌍✨🛰️✨🏆</p>
            <p className="mt-4 text-xs font-black tracking-[.24em] text-amber-300">ALL TIME SYSTEMS ONLINE</p>
            <h4 className="mt-2 text-4xl font-black md:text-5xl">TIME MASTER!</h4>
            <p className="mx-auto mt-4 max-w-3xl font-bold leading-8 text-indigo-100">
              時差・日付変更・朝昼夜・世界の生活時間を組み合わせて、世界時間システムを完成させました。
            </p>
            <div className="mx-auto mt-6 grid max-w-3xl grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['⏰','時差'],
                ['📅','日付'],
                ['🌅','生活時間'],
                ['🤝','国際交流'],
              ].map(([icon, label]) => (
                <div key={label} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-3xl">{icon}</p>
                  <p className="mt-1 text-sm font-black">{label}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-lg font-black text-emerald-300">Rwanda TIME ADVENTURE COMPLETE!</p>
            {alreadyCompleted && <p className="mt-2 text-xs text-white/50">このFinal Missionはクリア済みです。</p>}
          </div>
        </div>
      )}
    </div>
  );
}