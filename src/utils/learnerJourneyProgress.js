import { getWorldProgress } from './worldProgressStorage.js';
import { getWorldAdventureProgress } from './worldAdventureProgress.js';
import { getPlaceProgress } from './placeProgressStorage.js';

// Display-only aggregation. Never rewrite existing learner records.
export const JOURNEY_DOMAINS = [
  { id: 'place', label: '場所・地理', icon: '🌍', color: '#67d3f3' },
  { id: 'time', label: '時間・時差', icon: '⏰', color: '#b4a5ff' },
  { id: 'language', label: 'ことば・交流', icon: '🗣️', color: '#ffbad2' },
  { id: 'lifeCulture', label: '生活・文化', icon: '🏠', color: '#8de5bd' },
  { id: 'japanConnection', label: '日本とのつながり', icon: '🇯🇵', color: '#ffd18c' },
  { id: 'thinkConnect', label: '比較・思考・交流', icon: '🧠', color: '#a6c8ff' },
];

const SPANISH_COUNTRIES = new Set([
  'ar', 'bo', 'cl', 'co', 'cr', 'cu', 'do', 'ec', 'es', 'gq',
  'gt', 'hn', 'mx', 'ni', 'pa', 'pe', 'py', 'sv', 'uy', 've',
]);

const COUNTRY_CODE = /^[a-z]{2}$/;
const safeArray = value => Array.isArray(value) ? value : [];
const validTime = value => {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? time : 0;
};
const domainFromId = (iso, id, lookup) => {
  if (lookup.has(id)) return lookup.get(id);
  if (!id.startsWith(iso + '-')) return '';
  const tail = id.slice(iso.length + 1);
  if (tail.startsWith('place-')) return 'place';
  if (tail.startsWith('time-')) return 'time';
  if (tail.startsWith('language-')) return 'language';
  // Creator UUIDs do not encode a domain; do not misclassify them.
  return '';
};
const addMission = (lookup, id, domain) => {
  if (typeof id === 'string' && id && JOURNEY_DOMAINS.some(d => d.id === domain)) lookup.set(id, domain);
};

export function buildLearnerJourney(countries, {
  world = getWorldProgress(),
  adventure = getWorldAdventureProgress(),
  placeForCode = getPlaceProgress,
} = {}) {
  const entries = safeArray(countries).filter(c => COUNTRY_CODE.test(c?.iso || '')).map(country => {
    const iso = country.iso;
    const known = new Map();
    const titles = new Map();
    for (const mission of safeArray(country.missionData?.missions)) {
      addMission(known, mission?.id, mission?.domain);
      const title = typeof mission?.title === 'string' ? mission.title :
        (mission?.title?.ja || mission?.titleJa || mission?.prompt || '');
      if (mission?.id && title) titles.set(mission.id, String(title).slice(0, 120));
    }
    const sharedTitles = ['世界にあいさつ', '自分の名前を伝えよう', '相手の名前を聞こう',
      '出身国と住む場所', '学校について話そう', '好きなことを聞こう',
      '食文化を聞こう', '文化をもっと知ろう', '学校生活を比べよう', '世界とつながろう'];
    // Shared 10-step English exchange journeys are available for every country.
    for (let i = 1; i <= 10; i += 1) {
      const index = String(i).padStart(2, '0');
      const englishId = iso + '-language-shared-' + index;
      addMission(known, englishId, 'language');
      titles.set(englishId, sharedTitles[i - 1]);
      if (SPANISH_COUNTRIES.has(iso)) {
        const spanishId = iso + '-language-es-' + index;
        addMission(known, spanishId, 'language');
        titles.set(spanishId, 'スペイン語コミュニケーション ' + i);
      }
    }

    const saved = world?.countries?.[iso] || {};
    const adventureDomains = adventure?.countries?.[iso]?.domains || {};
    const place = placeForCode(iso) || {};
    const completed = new Set([
      ...safeArray(saved.completedMissionIds),
      ...safeArray(place.completedMissionIds),
    ]);
    let latest = Math.max(validTime(saved.updatedAt), validTime(place.updatedAt));
    for (const domain of Object.values(adventureDomains)) {
      latest = Math.max(latest, validTime(domain?.updatedAt));
      for (const [id, record] of Object.entries(domain?.missions || {})) {
        if (record?.completed === true) {
          completed.add(id);
          latest = Math.max(latest, validTime(record.firstClearAt));
        }
      }
    }
    const perDomain = Object.fromEntries(
      JOURNEY_DOMAINS.map(d => [d.id, { ...d, completed: 0, available: 0, ids: [] }]),
    );
    for (const domain of known.values()) perDomain[domain].available += 1;
    const completedIds = [...completed].filter(id => typeof id === 'string' && id.startsWith(iso + '-'));
    let unclassified = 0;
    for (const id of completedIds) {
      const domain = domainFromId(iso, id, known);
      if (!domain) {
        unclassified += 1;
        continue;
      }
      perDomain[domain].completed += 1;
      perDomain[domain].ids.push(id);
      // Previously completed missions remain in the record even if the
      // cached publication listing is changed or has not been loaded.
      if (!known.has(id)) perDomain[domain].available += 1;
    }
    const domains = JOURNEY_DOMAINS.map(d => perDomain[d.id]);
    const completedCount = completedIds.length;
    const availableCount = domains.reduce((sum, d) => sum + d.available, 0) + unclassified;
    return {
      iso, nameJa: country.nameJa, nameEn: country.nameEn,
      atlasName: country.atlasName, atlasId: country.atlasId,
      flagEmoji: country.flagEmoji, flagUrl: country.flagUrl, region: country.region,
      completedIds, completedCount, availableCount,
      explored: completedCount > 0, lastAt: latest || null,
      domains, unclassified,
      completedRecords: completedIds.map(id => ({
        id, domain: domainFromId(iso, id, known),
        title: titles.get(id) || (id.includes('-mc-') ? '投稿ミッション' : 'ミッション ' + (id.match(/-(\d{2})$/)?.[1] || '')),
      })),
    };
  });
  const explored = entries.filter(c => c.explored);
  const latest = [...explored].sort((a, b) => (b.lastAt || 0) - (a.lastAt || 0))[0] || null;
  return {
    countries: entries,
    totalCountries: entries.length,
    exploredCountries: explored.length,
    completedMissions: entries.reduce((sum, c) => sum + c.completedCount, 0),
    availableMissions: entries.reduce((sum, c) => sum + c.availableCount, 0),
    activeDomains: JOURNEY_DOMAINS.filter(d =>
      entries.some(c => c.domains.some(x => x.id === d.id && x.completed > 0)),
    ).length,
    lastCountry: latest,
  };
}
