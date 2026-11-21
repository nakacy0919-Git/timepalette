// Identify only JICA's World Diary, not every JICA publication.
// A World Diary blog is an individual account, never an authoritative national fact.
const DIARY_HOST = 'world-diary.jica.go.jp';
const URL_PATTERN = /https?:\/\/[^\s<>"'「」『』]+/gi;

function validDiaryUrl(value) {
  try {
    const cleaned = String(value || '').trim().replace(/[、。，．;；!！?？）)\]}]+$/g, '');
    const url = new URL(cleaned);
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== DIARY_HOST) return null;
    if (url.username || url.password || url.pathname === '/') return null;
    return url.href;
  } catch {
    return null;
  }
}

function fromValue(value) {
  if (value && typeof value === 'object') {
    return fromValue(value.sourceUrl || value.url || '');
  }
  const raw = String(value || '').trim();
  if (!raw) return [];
  const matches = raw.match(URL_PATTERN) || [];
  return (matches.length ? matches : [raw]).map(validDiaryUrl).filter(Boolean);
}

export function getJicaWorldDiaryUrls(mission) {
  if (!mission) return [];
  const fields = [
    ...(Array.isArray(mission.sourceUrls) ? mission.sourceUrls : []),
    ...(Array.isArray(mission.sources) ? mission.sources : []),
    mission.sourceUrl,
    // Some older records put the original URL in the explanation instead.
    mission.explanation,
    ...(Array.isArray(mission.materials) ? mission.materials.map(item => item?.sourceUrl) : []),
  ];
  return [...new Set(fields.flatMap(fromValue))];
}

export function isJicaWorldDiaryChoice(mission) {
  return mission?.type === 'single-choice' && getJicaWorldDiaryUrls(mission).length > 0;
}
