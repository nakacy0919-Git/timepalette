// Lesson URLs contain public curriculum settings only, never learner information.
export const LESSON_LEVELS = ['elementary','juniorHigh','highSchoolStandard','highSchoolAdvanced'];
export const LESSON_DOMAINS = ['place','time','language','lifeCulture','japanConnection','thinkConnect'];
export function readLesson(search = '') {
  const p = new URLSearchParams(search);
  if (p.get('lesson') !== '1') return null;
  return {country: /^[a-z]{2}$/.test(p.get('country') || '') ? p.get('country') : 'jp',
    level: LESSON_LEVELS.includes(p.get('level')) ? p.get('level') : 'elementary',
    domain: LESSON_DOMAINS.includes(p.get('domain')) ? p.get('domain') : 'time'};
}
export function lessonUrl(base, lesson) {
  const u = new URL(base); u.search = ''; u.hash = '';
  const valid = readLesson(new URLSearchParams({lesson:'1',...lesson}).toString());
  u.search = new URLSearchParams({lesson:'1', ...valid}).toString();
  return u.href;
}
let scope = 'personal';
const memory = new Map();
export function setLearningScope(value) { scope = ['personal','shared','demo'].includes(value) ? value : 'personal'; }
export function getLearningScope() { return scope; }
// Demo and shared-device sessions are deliberately memory-only and disappear on reload.
export function learningStorage() {
  if (scope !== 'personal') return {
    getItem: key => memory.get(scope + ':' + key) ?? null,
    setItem: (key,value) => memory.set(scope + ':' + key,String(value)),
    removeItem: key => memory.delete(scope + ':' + key),
  };
  try { return typeof window !== 'undefined' ? window.localStorage : null; } catch { return null; }
}
const isLearnerKey = key => /^timepalette_(world_learning_v1|world_adventure_v1|language_)/.test(key) || key.startsWith('timepalette-place-progress-v1:');
export function clearLearningData() {
  if (scope !== 'personal') { for (const key of memory.keys()) if (key.startsWith(scope + ':')) memory.delete(key); return; }
  const storage = learningStorage(); if (!storage) throw new Error('保存領域を利用できません。');
  const keys = Array.from({length: storage.length}, (_,i) => storage.key(i)).filter(k => k && isLearnerKey(k));
  keys.forEach(key => storage.removeItem(key));
}
export function completionReport(journey) {
  return {format:'timepalette-learning-summary/v1',createdAt:new Date().toISOString(),
    storage:getLearningScope(),completedMissions:journey.completedMissions,
    countries:journey.countries.filter(c=>c.completedCount>0).map(c=>({country:c.iso,name:c.nameJa,
      completed:c.completedCount,domains:c.domains.map(d=>({category:d.label,completed:d.completed}))}))};
}
