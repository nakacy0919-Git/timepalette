import React, { useEffect, useMemo, useRef, useState } from 'react';

const MINUTES_PER_DAY = 24 * 60;

const CITY_DATA = [
  {
    id: 'tokyo',
    name: 'Tokyo',
    labelJa: '日本・東京',
    countryJa: '日本',
    flag: '🇯🇵',
    relativeHoursFromKigali: 7,
    photoUrl: 'https://picsum.photos/seed/tokyo-city/1200/800',
  },
  {
    id: 'paris',
    name: 'Paris',
    labelJa: 'フランス・パリ',
    countryJa: 'フランス',
    flag: '🇫🇷',
    relativeHoursFromKigali: 1,
    photoUrl: 'https://picsum.photos/seed/paris-city/1200/800',
  },
  {
    id: 'nairobi',
    name: 'Nairobi',
    labelJa: 'ケニア・ナイロビ',
    countryJa: 'ケニア',
    flag: '🇰🇪',
    relativeHoursFromKigali: 1,
    photoUrl: 'https://picsum.photos/seed/nairobi-city/1200/800',
  },
  {
    id: 'newyork',
    name: 'New York',
    labelJa: 'アメリカ・ニューヨーク',
    countryJa: 'アメリカ',
    flag: '🇺🇸',
    relativeHoursFromKigali: -6,
    photoUrl: 'https://picsum.photos/seed/newyork-city/1200/800',
  },
];

const ROUND_PRESETS = [
  { id: 'r1', kigaliHour: 18, kigaliMinute: 30 },
  { id: 'r2', kigaliHour: 7, kigaliMinute: 0 },
  { id: 'r3', kigaliHour: 22, kigaliMinute: 15 },
];

const mod = (n, m) => ((n % m) + m) % m;

const shuffle = (items) => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const toMinutes = (hour, minute) => hour * 60 + minute;

const formatTime = (totalMinutes) => {
  const mins = mod(totalMinutes, MINUTES_PER_DAY);
  const hour = Math.floor(mins / 60);
  const minute = mins % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
};

const addHoursWithDayShift = (baseMinutes, hourDelta) => {
  const shifted = baseMinutes + hourDelta * 60;
  const wrapped = mod(shifted, MINUTES_PER_DAY);
  const dayShift = Math.floor(shifted / MINUTES_PER_DAY);
  return { minutes: wrapped, dayShift };
};

const getDayLabel = (dayShift) => {
  if (dayShift > 0) return '次の日';
  if (dayShift < 0) return '前の日';
  return '同じ日';
};

const getTimeBand = (totalMinutes) => {
  const hour = Math.floor(mod(totalMinutes, MINUTES_PER_DAY) / 60);

  if (hour >= 5 && hour <= 10) return 'morning';
  if (hour >= 11 && hour <= 15) return 'daytime';
  if (hour >= 16 && hour <= 19) return 'evening';
  return 'night';
};

const getTimeBandLabel = (band) => {
  switch (band) {
    case 'morning':
      return '朝';
    case 'daytime':
      return '昼';
    case 'evening':
      return '夕方';
    default:
      return '夜';
  }
};

const buildRound = (preset) => {
  const kigaliMinutes = toMinutes(preset.kigaliHour, preset.kigaliMinute);

  const cities = CITY_DATA.map((city) => {
    const { minutes, dayShift } = addHoursWithDayShift(
      kigaliMinutes,
      city.relativeHoursFromKigali,
    );

    return {
      ...city,
      localMinutes: minutes,
      localTimeText: formatTime(minutes),
      dayShift,
      dayLabel: getDayLabel(dayShift),
      timeBand: getTimeBand(minutes),
    };
  });

  const cards = shuffle(
    cities.map((city) => ({
      id: `${preset.id}-${city.id}`,
      cityId: city.id,
      timeText: city.localTimeText,
      dayLabel: city.dayLabel,
      timeBand: city.timeBand,
    })),
  );

  return {
    id: preset.id,
    kigaliTimeText: formatTime(kigaliMinutes),
    cities,
    cards,
  };
};

const useTinyAudio = () => {
  const ctxRef = useRef(null);

  const ensureCtx = () => {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctxRef.current) {
      ctxRef.current = new AudioCtx();
    }
    return ctxRef.current;
  };

  const tone = (freq = 440, duration = 0.12, type = 'sine', gainValue = 0.03, delay = 0) => {
    const ctx = ensureCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    gain.gain.value = 0.0001;

    osc.connect(gain);
    gain.connect(ctx.destination);

    const start = ctx.currentTime + delay;
    const end = start + duration;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);

    osc.start(start);
    osc.stop(end + 0.02);
  };

  return {
    playPick() {
      tone(540, 0.06, 'triangle', 0.02);
    },
    playSuccess() {
      tone(660, 0.08, 'triangle', 0.03, 0);
      tone(880, 0.10, 'triangle', 0.03, 0.08);
      tone(1040, 0.12, 'triangle', 0.035, 0.16);
    },
    playError() {
      tone(220, 0.12, 'sawtooth', 0.03, 0);
      tone(160, 0.14, 'sawtooth', 0.03, 0.10);
    },
    playFanfare() {
      tone(523, 0.10, 'triangle', 0.035, 0);
      tone(659, 0.10, 'triangle', 0.035, 0.10);
      tone(784, 0.12, 'triangle', 0.04, 0.20);
      tone(1047, 0.22, 'triangle', 0.045, 0.32);
    },
  };
};

export default function WorldLifeDetectiveMission({
  mission = {},
  onComplete,
  onMissionClear,
  onBack,
}) {
  const points = Number(mission?.points ?? 10);
  const audio = useTinyAudio();
  const completeRef = useRef(false);

  const [roundIndex, setRoundIndex] = useState(0);
  const [placements, setPlacements] = useState({});
  const [selectedCardId, setSelectedCardId] = useState('');
  const [feedback, setFeedback] = useState('下のTIME CARDを、正しい都市の時計台へ入れよう。');
  const [wrongCityId, setWrongCityId] = useState('');
  const [burstSeed, setBurstSeed] = useState(0);
  const [roundCleared, setRoundCleared] = useState(false);
  const [missionCleared, setMissionCleared] = useState(false);

  const round = useMemo(
    () => buildRound(ROUND_PRESETS[roundIndex]),
    [roundIndex],
  );

  useEffect(() => {
    setPlacements({});
    setSelectedCardId('');
    setFeedback('下のTIME CARDを、正しい都市の時計台へ入れよう。');
    setWrongCityId('');
    setRoundCleared(false);
  }, [roundIndex]);

  const remainingCards = useMemo(() => {
    const usedIds = new Set(
      Object.values(placements)
        .filter(Boolean)
        .map((card) => card.id),
    );

    return round.cards.filter((card) => !usedIds.has(card.id));
  }, [round.cards, placements]);

  const triggerMissionComplete = () => {
    if (completeRef.current) return;
    completeRef.current = true;

    const payload = {
      missionId: mission?.id ?? 'time-m5',
      points,
      completed: true,
    };

    if (typeof onComplete === 'function') {
      onComplete(payload);
    }

    if (typeof onMissionClear === 'function') {
      onMissionClear(payload);
    }
  };

  const checkRoundClear = (nextPlacements) => {
    const isClear = round.cities.every((city) => Boolean(nextPlacements[city.id]));
    if (!isClear) return;

    setRoundCleared(true);
    setBurstSeed((prev) => prev + 1);
    audio.playFanfare();

    if (roundIndex === ROUND_PRESETS.length - 1) {
      setMissionCleared(true);
      setFeedback('MISSION CLEAR! 世界の時間をつなげたね。');
      triggerMissionComplete();
    } else {
      setFeedback(`ROUND ${roundIndex + 1} CLEAR! 次のラウンドへ進もう。`);
    }
  };

  const resolveDrop = (cityId, cardId) => {
    const card = remainingCards.find((item) => item.id === cardId);
    if (!card) return;

    const city = round.cities.find((item) => item.id === cityId);
    if (!city) return;

    if (card.cityId === cityId) {
      const nextPlacements = {
        ...placements,
        [cityId]: card,
      };

      setPlacements(nextPlacements);
      setSelectedCardId('');
      setWrongCityId('');
      setFeedback(`${city.flag} ${city.name} は ${card.timeText}（${card.dayLabel}）！`);
      audio.playSuccess();
      setBurstSeed((prev) => prev + 1);
      checkRoundClear(nextPlacements);
    } else {
      setWrongCityId(cityId);
      setFeedback('おっと、ちがうみたい。もう一度考えてみよう。');
      audio.playError();
      window.clearTimeout(resolveDrop.wrongTimer);
      resolveDrop.wrongTimer = window.setTimeout(() => setWrongCityId(''), 500);
    }
  };

  const handleCardClick = (cardId) => {
    setSelectedCardId((prev) => (prev === cardId ? '' : cardId));
    audio.playPick();
  };

  const handleTowerClick = (cityId) => {
    if (!selectedCardId) return;
    resolveDrop(cityId, selectedCardId);
  };

  const handleDragStart = (event, cardId) => {
    event.dataTransfer.setData('text/plain', cardId);
    event.dataTransfer.effectAllowed = 'move';
    setSelectedCardId(cardId);
    audio.playPick();
  };

  const handleDrop = (event, cityId) => {
    event.preventDefault();
    const cardId = event.dataTransfer.getData('text/plain');
    resolveDrop(cityId, cardId);
  };

  const goNext = () => {
    if (roundIndex < ROUND_PRESETS.length - 1) {
      setRoundIndex((prev) => prev + 1);
      return;
    }

    if (typeof onBack === 'function') {
      onBack();
    }
  };

  const progressText = `${roundIndex + 1} / ${ROUND_PRESETS.length}`;

  return (
    <div className="m5-wrap">
      <style>{`
        .m5-wrap {
          position: relative;
          padding: 24px;
          color: #10203a;
        }

        .m5-header {
          border-radius: 28px;
          padding: 26px 28px;
          background: linear-gradient(135deg, #220629 0%, #642000 50%, #8b2a00 100%);
          color: #fff;
          box-shadow: 0 16px 40px rgba(26, 34, 89, 0.18);
        }

        .m5-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 9px 16px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          color: #ffd65a;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .m5-title-line {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          margin-top: 20px;
        }

        .m5-icon {
          width: 66px;
          height: 66px;
          border-radius: 22px;
          display: grid;
          place-items: center;
          font-size: 34px;
          background: rgba(255,255,255,0.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);
        }

        .m5-header-main {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .m5-header h1 {
          margin: 0;
          font-size: 48px;
          line-height: 1.08;
        }

        .m5-header p {
          margin: 8px 0 0;
          font-size: 19px;
          line-height: 1.6;
          color: rgba(255,255,255,0.92);
        }

        .m5-points {
          min-width: 110px;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          border-radius: 999px;
          padding: 12px 18px;
          background: #ffcc2f;
          color: #442000;
          font-weight: 900;
          font-size: 22px;
          box-shadow: 0 12px 24px rgba(0,0,0,0.16);
        }

        .m5-panel {
          margin-top: 22px;
          border-radius: 26px;
          background: #ffffff;
          box-shadow: 0 14px 30px rgba(15, 32, 72, 0.08);
          padding: 24px;
          border: 1px solid #eaf0ff;
        }

        .m5-intro {
          display: grid;
          grid-template-columns: 1.3fr 160px;
          gap: 18px;
          padding: 22px 24px;
          border-radius: 24px;
          background: linear-gradient(180deg, #eef7ff 0%, #f7fbff 100%);
          border: 1px solid #d5e6ff;
        }

        .m5-intro-kicker {
          margin: 0 0 10px;
          font-size: 12px;
          color: #3d6ce3;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .m5-intro h2 {
          margin: 0;
          font-size: 30px;
          line-height: 1.2;
        }

        .m5-intro p {
          margin: 10px 0 0;
          font-size: 20px;
          line-height: 1.6;
          color: #274064;
        }

        .m5-round-badge {
          border-radius: 22px;
          background: #fff;
          border: 1px solid #e5eefc;
          display: grid;
          place-items: center;
          text-align: center;
          color: #3068ea;
          font-weight: 900;
          font-size: 26px;
        }

        .m5-round-badge span {
          display: block;
          font-size: 12px;
          color: #8ca2c8;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .m5-master-clock {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 18px;
          align-items: center;
          margin-top: 18px;
          padding: 18px 22px;
          border-radius: 22px;
          background: linear-gradient(90deg, #fffaf0 0%, #fff4dd 100%);
          border: 2px solid #f2c77d;
        }

        .m5-master-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .m5-master-flag {
          font-size: 42px;
          line-height: 1;
        }

        .m5-master-title {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #e27619;
        }

        .m5-master-city {
          font-size: 36px;
          font-weight: 900;
          margin-top: 4px;
        }

        .m5-master-time {
          font-size: 68px;
          font-weight: 900;
          color: #0d1d40;
        }

        .m5-card-section {
          margin-top: 18px;
        }

        .m5-card-title {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #8da0c0;
          margin-bottom: 12px;
        }

        .m5-card-row {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }

        .m5-time-card {
          user-select: none;
          cursor: grab;
          border-radius: 24px;
          border: 2px solid #d7e7ff;
          background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          padding: 18px 16px;
          min-height: 152px;
          box-shadow: 0 10px 22px rgba(48, 98, 227, 0.08);
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .m5-time-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(48, 98, 227, 0.16);
        }

        .m5-time-card.is-selected {
          border-color: #19b9ff;
          box-shadow: 0 0 0 5px rgba(25, 185, 255, 0.14), 0 16px 30px rgba(25, 185, 255, 0.14);
        }

        .m5-time-card-head {
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #93a4c0;
        }

        .m5-time-card-time {
          font-size: 48px;
          font-weight: 900;
          margin-top: 10px;
          color: #09182e;
          line-height: 1;
        }

        .m5-time-card-day {
          margin-top: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 12px;
          border-radius: 999px;
          background: #eef5ff;
          color: #3860ca;
          font-size: 14px;
          font-weight: 800;
        }

        .m5-time-card-band {
          margin-top: 10px;
          font-size: 14px;
          font-weight: 800;
          color: #ff7b23;
        }

        .m5-helper {
          margin-top: 10px;
          font-size: 15px;
          color: #647aa0;
        }

        .m5-grid {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .m5-tower {
          position: relative;
          border-radius: 28px;
          overflow: hidden;
          border: 2px dashed #95d8ff;
          background: #f9feff;
          box-shadow: 0 14px 28px rgba(16, 32, 58, 0.08);
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }

        .m5-tower:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 34px rgba(16, 32, 58, 0.12);
        }

        .m5-tower.is-wrong {
          animation: shakeTower 0.36s ease;
          border-color: #ff8181;
          box-shadow: 0 0 0 5px rgba(255, 90, 90, 0.14);
        }

        .m5-tower.is-filled {
          border-style: solid;
          border-color: #44d4a6;
          box-shadow: 0 0 0 6px rgba(68, 212, 166, 0.16), 0 18px 34px rgba(27, 150, 103, 0.16);
        }

        .m5-tower-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 18px 12px;
          position: relative;
          z-index: 2;
        }

        .m5-tower-left {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .m5-flag-badge {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.92);
          font-size: 28px;
          box-shadow: 0 10px 22px rgba(10, 22, 44, 0.14);
        }

        .m5-city-name {
          font-size: 36px;
          font-weight: 900;
          color: #0f1f36;
          line-height: 1;
        }

        .m5-city-sub {
          margin-top: 6px;
          color: #5a6f91;
          font-size: 15px;
          font-weight: 700;
        }

        .m5-clock-tower-chip {
          padding: 10px 14px;
          border-radius: 999px;
          background: rgba(255,255,255,0.92);
          font-size: 14px;
          font-weight: 900;
          color: #495f88;
          box-shadow: 0 8px 18px rgba(10, 22, 44, 0.10);
        }

        .m5-photo {
          position: relative;
          margin: 0 18px;
          height: 240px;
          border-radius: 24px;
          overflow: hidden;
          background: #e9f1ff;
          border: 1px solid #d6e4ff;
        }

        .m5-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(1.05);
          transform: scale(1.03);
        }

        .m5-photo-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .m5-band-morning .m5-photo-overlay {
          background: linear-gradient(180deg, rgba(255,244,203,0.25) 0%, rgba(255,255,255,0.10) 60%, rgba(255,255,255,0.05) 100%);
        }

        .m5-band-daytime .m5-photo-overlay {
          background: linear-gradient(180deg, rgba(185,226,255,0.15) 0%, rgba(255,255,255,0.02) 100%);
        }

        .m5-band-evening .m5-photo-overlay {
          background: linear-gradient(180deg, rgba(255,186,94,0.24) 0%, rgba(138,52,0,0.16) 100%);
        }

        .m5-band-night .m5-photo-overlay {
          background: linear-gradient(180deg, rgba(8,22,84,0.38) 0%, rgba(5,10,38,0.48) 100%);
        }

        .m5-photo-badge {
          position: absolute;
          left: 14px;
          top: 14px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.94);
          color: #26385d;
          font-size: 14px;
          font-weight: 900;
          z-index: 2;
          box-shadow: 0 8px 18px rgba(12, 24, 52, 0.18);
        }

        .m5-photo-bottom {
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: 14px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 12px;
          z-index: 2;
        }

        .m5-photo-bottom small {
          display: block;
          color: rgba(255,255,255,0.88);
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
          text-transform: uppercase;
        }

        .m5-photo-bottom strong {
          font-size: 42px;
          line-height: 1;
          font-weight: 900;
          color: #fff;
          text-shadow: 0 3px 16px rgba(0,0,0,0.28);
        }

        .m5-photo-bottom span {
          display: inline-flex;
          margin-top: 8px;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(255,255,255,0.16);
          border: 1px solid rgba(255,255,255,0.20);
          color: #fff;
          font-size: 13px;
          font-weight: 800;
          backdrop-filter: blur(6px);
        }

        .m5-clock-emblem {
          position: absolute;
          right: 14px;
          bottom: 14px;
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.90);
          box-shadow: 0 10px 22px rgba(10,22,44,0.20);
          font-size: 34px;
          z-index: 2;
        }

        .m5-slot {
          margin: 16px 18px 18px;
          border-radius: 20px;
          border: 2px dashed #9ecffb;
          min-height: 84px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          background: #fff;
          cursor: pointer;
          transition: background 0.18s ease, border-color 0.18s ease;
        }

        .m5-slot:hover {
          background: #f4fbff;
          border-color: #48cfff;
        }

        .m5-slot-empty {
          text-align: center;
          color: #7b8fb3;
          font-weight: 800;
          font-size: 16px;
          line-height: 1.5;
        }

        .m5-slot-card {
          width: 100%;
          border-radius: 16px;
          background: linear-gradient(180deg, #effaf7 0%, #ffffff 100%);
          border: 2px solid #54d7a9;
          padding: 10px 14px;
          box-shadow: 0 8px 18px rgba(40, 171, 122, 0.16);
        }

        .m5-slot-card-time {
          font-size: 30px;
          font-weight: 900;
          color: #0f1f36;
          line-height: 1;
        }

        .m5-slot-card-sub {
          margin-top: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .m5-slot-card-sub span {
          font-size: 13px;
          font-weight: 800;
          color: #3860ca;
        }

        .m5-feedback {
          margin-top: 20px;
          border-radius: 24px;
          background: linear-gradient(180deg, #f5f9ff 0%, #ffffff 100%);
          border: 1px solid #dce9ff;
          padding: 22px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .m5-feedback-label {
          font-size: 12px;
          color: #9aaaca;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .m5-feedback-text {
          margin-top: 8px;
          font-size: 32px;
          font-weight: 900;
          line-height: 1.2;
          color: #10203a;
        }

        .m5-feedback-caption {
          margin-top: 8px;
          font-size: 17px;
          color: #56709a;
          line-height: 1.5;
        }

        .m5-next-btn {
          border: none;
          border-radius: 18px;
          padding: 16px 24px;
          background: linear-gradient(135deg, #16a867 0%, #0f8f5a 100%);
          color: #fff;
          font-size: 22px;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 14px 26px rgba(15, 143, 90, 0.28);
        }

        .m5-next-btn:hover {
          transform: translateY(-1px);
        }

        .m5-footer-note {
          margin-top: 14px;
          color: #6d83a9;
          font-size: 15px;
          line-height: 1.6;
        }

        .m5-confetti {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 8;
        }

        .m5-confetti span {
          position: absolute;
          top: -20px;
          width: 12px;
          height: 20px;
          border-radius: 4px;
          animation: confettiDrop 1.35s ease forwards;
        }

        .m5-final {
          margin-top: 20px;
          border-radius: 24px;
          background: linear-gradient(135deg, #eefcf7 0%, #ffffff 100%);
          border: 2px solid #6ae0b6;
          padding: 24px;
        }

        .m5-final h3 {
          margin: 0;
          font-size: 34px;
          line-height: 1.2;
          color: #10714d;
        }

        .m5-final p {
          margin: 10px 0 0;
          font-size: 19px;
          color: #2f5f53;
          line-height: 1.6;
        }

        @keyframes shakeTower {
          0% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          100% { transform: translateX(0); }
        }

        @keyframes confettiDrop {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(520px) rotate(600deg);
            opacity: 0;
          }
        }

        @media (max-width: 1100px) {
          .m5-card-row,
          .m5-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .m5-wrap {
            padding: 14px;
          }

          .m5-title-line,
          .m5-header-main,
          .m5-master-clock,
          .m5-intro {
            grid-template-columns: 1fr;
            display: block;
          }

          .m5-header h1 {
            font-size: 34px;
            margin-top: 8px;
          }

          .m5-points {
            margin-top: 16px;
            display: inline-flex;
          }

          .m5-master-time {
            font-size: 42px;
            margin-top: 12px;
          }

          .m5-card-row,
          .m5-grid {
            grid-template-columns: 1fr;
          }

          .m5-city-name {
            font-size: 28px;
          }

          .m5-photo {
            height: 210px;
          }

          .m5-feedback-text {
            font-size: 24px;
          }
        }
      `}</style>

      <header className="m5-header">
        <div className="m5-chip">MISSION 05 · GLOBAL TIME RESCUE</div>

        <div className="m5-title-line">
          <div className="m5-header-main">
            <div className="m5-icon">🗼</div>
            <div>
              <div style={{ color: '#ffd466', fontWeight: 900, letterSpacing: '0.16em', fontSize: 12 }}>
                RWANDA TIME ADVENTURE
              </div>
              <h1>時計台レスキュー！</h1>
              <p>
                キガリの時こくをもとに、世界の都市の時計台へ
                <br />
                正しいTIME CARDを入れて、同じしゅんかんをつなごう！
              </p>
            </div>
          </div>

          <div className="m5-points">+{points} WP</div>
        </div>
      </header>

      <section className="m5-panel">
        <div className="m5-intro">
          <div>
            <div className="m5-intro-kicker">Stage · Restore the time links</div>
            <h2>こわれた世界時計を復活させよう！</h2>
            <p>
              まずはキガリの時こくを見よう。
              <br />
              下のTIME CARDを、正しい国の時計台へドラッグ、またはタップで入れてね。
            </p>
          </div>

          <div className="m5-round-badge">
            <div>
              <span>Round</span>
              {progressText}
            </div>
          </div>
        </div>

        <div className="m5-master-clock">
          <div className="m5-master-left">
            <div className="m5-master-flag">🇷🇼</div>
            <div>
              <div className="m5-master-title">Master Clock</div>
              <div className="m5-master-city">Kigali · Rwanda</div>
            </div>
          </div>
          <div className="m5-master-time">{round.kigaliTimeText}</div>
        </div>

        <div className="m5-card-section">
          <div className="m5-card-title">Time Cards</div>
          <div className="m5-card-row">
            {remainingCards.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`m5-time-card ${selectedCardId === card.id ? 'is-selected' : ''}`}
                draggable
                onDragStart={(event) => handleDragStart(event, card.id)}
                onClick={() => handleCardClick(card.id)}
              >
                <div className="m5-time-card-head">Time Card</div>
                <div className="m5-time-card-time">{card.timeText}</div>
                <div className="m5-time-card-day">{card.dayLabel}</div>
                <div className="m5-time-card-band">{getTimeBandLabel(card.timeBand)}のまち</div>
              </button>
            ))}
          </div>

          <div className="m5-helper">
            ヒント：タップでも遊べます。TIME CARDを選んでから、下の時計台をタップしてもOKです。
          </div>
        </div>

        <div className="m5-grid">
          {round.cities.map((city) => {
            const placedCard = placements[city.id];
            const band = placedCard?.timeBand ?? city.timeBand;
            const bandLabel = getTimeBandLabel(band);

            return (
              <div
                key={city.id}
                className={`m5-tower ${wrongCityId === city.id ? 'is-wrong' : ''} ${placedCard ? 'is-filled' : ''}`}
                onClick={() => handleTowerClick(city.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, city.id)}
              >
                <div className="m5-tower-top">
                  <div className="m5-tower-left">
                    <div className="m5-flag-badge">{city.flag}</div>
                    <div>
                      <div className="m5-city-name">{city.name}</div>
                      <div className="m5-city-sub">{city.labelJa}</div>
                    </div>
                  </div>

                  <div className="m5-clock-tower-chip">
                    {placedCard ? `${bandLabel}の時計台` : '時計台スロット'}
                  </div>
                </div>

                <div className={`m5-photo m5-band-${band}`}>
                  <img src={city.photoUrl} alt={`${city.name} photo`} />
                  <div className="m5-photo-overlay" />
                  <div className="m5-photo-badge">
                    {city.flag} {bandLabel}
                  </div>

                  <div className="m5-photo-bottom">
                    <div>
                      <small>{placedCard ? 'Local Time' : 'Drop Zone'}</small>
                      <strong>{placedCard ? placedCard.timeText : '??:??'}</strong>
                      <span>{placedCard ? placedCard.dayLabel : 'TIME CARD をここへ'}</span>
                    </div>
                  </div>

                  <div className="m5-clock-emblem">
                    {placedCard ? '✅' : '🕰️'}
                  </div>
                </div>

                <div className="m5-slot">
                  {placedCard ? (
                    <div className="m5-slot-card">
                      <div className="m5-slot-card-time">{placedCard.timeText}</div>
                      <div className="m5-slot-card-sub">
                        <span>{placedCard.dayLabel}</span>
                        <span>{bandLabel}のまち</span>
                      </div>
                    </div>
                  ) : (
                    <div className="m5-slot-empty">
                      TIME CARD をここへ
                      <br />
                      つまんで動かす / タップで選ぶ
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="m5-feedback">
          <div>
            <div className="m5-feedback-label">Mission Feedback</div>
            <div className="m5-feedback-text">{feedback}</div>
            <div className="m5-feedback-caption">
              正しい時計台に入ると、写真つきでその都市の時間帯が見えるよ。
            </div>
          </div>

          {roundCleared ? (
            <button type="button" className="m5-next-btn" onClick={goNext}>
              {missionCleared ? 'Mission をとじる' : '次の ROUND へ'}
            </button>
          ) : null}
        </div>

        {!missionCleared ? (
          <div className="m5-footer-note">
            ねらい：時差だけでなく、「朝・昼・夕方・夜」の生活のちがいも感じ取ろう。
          </div>
        ) : null}

        {missionCleared ? (
          <div className="m5-final">
            <h3>MISSION CLEAR!</h3>
            <p>
              キガリと世界の都市の「同じしゅんかん」をつなげられました。
              <br />
              これで Mission 5 完了です。
            </p>
          </div>
        ) : null}
      </section>

      <div key={burstSeed} className="m5-confetti" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => {
          const left = 4 + index * 5;
          const delay = (index % 6) * 0.05;
          const colors = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#d65dff'];
          const background = colors[index % colors.length];

          return (
            <span
              key={index}
              style={{
                left: `${left}%`,
                background,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
