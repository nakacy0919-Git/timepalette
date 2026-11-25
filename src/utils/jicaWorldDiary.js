// Identify only JICA's World Diary, not every JICA publication.
// A World Diary blog is an individual account, never an authoritative national fact.
const DIARY_HOST = 'world-diary.jica.go.jp';
const URL_PATTERN = /https?:\/\/[^\s<>"'「」『』]+/gi;

function validDiaryUrl(value, includeAssets = false) {
  try {
    const cleaned = String(value || '').trim().replace(/[、。，．;；!！?？）)\]}]+$/g, '');
    const url = new URL(cleaned);
    if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== DIARY_HOST) return null;
    if (url.username || url.password || url.pathname === '/') return null;
    // Old notes can include both the original article and its copied image URL.
    // Only article/page URLs belong in the reader, never a standalone asset.
    if (!includeAssets && (/\/(?:assets_c|assets|images|img|uploads|mt-static)\//i.test(url.pathname) || /\.(?:jpe?g|png|gif|webp|avif|svg|bmp|tiff?|pdf|mp4|zip)$/i.test(url.pathname))) return null;
    return url.href;
  } catch {
    return null;
  }
}

function fromValue(value, includeAssets = false) {
  if (Array.isArray(value)) return value.flatMap(item => fromValue(item, includeAssets));
  if (value && typeof value === 'object') {
    return [value.sourceUrl, value.sourceUrls, value.url, value.href, value.source, value.attribution, value.credit].flatMap(item => fromValue(item, includeAssets));
  }
  const raw = String(value || '').trim();
  if (!raw) return [];
  const matches = raw.match(URL_PATTERN) || [];
  return (matches.length ? matches : [raw]).map(url => validDiaryUrl(url, includeAssets)).filter(Boolean);
}

function diaryReferences(mission, includeAssets) {
  if (!mission) return [];
  const fields = [
    mission.sourceUrls,
    mission.sources,
    mission.sourceUrl,
    mission.jicaDiarySourceUrl,
    mission.notes,
    // Some older records put the original URL in the explanation instead.
    mission.explanation,
    mission.attribution,
    mission.credit,
    mission.materials,
    mission.media,
  ];
  return [...new Set(fields.flatMap(field => fromValue(field, includeAssets)))];
}

export function getJicaWorldDiaryUrls(mission) { return diaryReferences(mission, false); }

// Even if only a copied image URL survives, do not restore the copied photo.
export function hasJicaWorldDiaryReference(mission) {
  return mission?.jicaDiaryMissingSource === true || diaryReferences(mission, true).length > 0;
}

export function isJicaWorldDiaryAssetUrl(value) {
  return !!validDiaryUrl(value, true) && !validDiaryUrl(value);
}

export function removeJicaWorldDiaryAssetLinks(value) {
  return String(value || '').replace(URL_PATTERN, url => isJicaWorldDiaryAssetUrl(url) ? '' : url);
}

export function isJicaWorldDiaryChoice(mission) {
  return mission?.type === 'single-choice' && getJicaWorldDiaryUrls(mission).length > 0;
}

// Includes the sanitized, non-quiz public catalog format.
export function isJicaWorldDiaryStudy(mission) {
  return mission?.type === 'world-diary-reflection' || isJicaWorldDiaryChoice(mission);
}
