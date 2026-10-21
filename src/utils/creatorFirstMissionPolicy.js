/**
 * Author-led TimePalette domain policy.
 * Geography and Time retain built-in learning adventures.
 * The other four categories are supplied exclusively by published Mission
 * Creator questions; source JSON and prior progress remain archived in place.
 */
export const CREATOR_FIRST_DOMAINS = Object.freeze([
  'language',
  'lifeCulture',
  'japanConnection',
  'thinkConnect',
]);

const creatorFirstSet = new Set(CREATOR_FIRST_DOMAINS);
export function isCreatorFirstDomain(domain) {
  return creatorFirstSet.has(String(domain || ''));
}

export function combineDomainMissions(domain, builtInMissions = [], publishedMissions = []) {
  const published = Array.isArray(publishedMissions) ? publishedMissions : [];
  if (isCreatorFirstDomain(domain)) return [...published];
  const builtIn = Array.isArray(builtInMissions) ? builtInMissions : [];
  return [...builtIn, ...published];
}