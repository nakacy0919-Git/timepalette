import {learningStorage, LESSON_DOMAINS} from './classroomSession.js';

const FORMAT = 'timepalette-progress-backup/v1';
export const MAX_BACKUP_BYTES = 1_000_000;
const WORLD = 'timepalette_world_learning_v1';
const ADVENTURE = 'timepalette_world_adventure_v1';
const object = value => value && typeof value === 'object' && !Array.isArray(value);

// Export only mission identifiers and categories. Profiles and free text never travel.
export function progressBackup(journey) {
  return validateProgressBackup({format:FORMAT,countries:journey.countries
    .filter(c=>c.completedRecords.length)
    .map(c=>({iso:c.iso,missions:c.completedRecords.map(m=>({id:m.id,domain:m.domain}))}))});
}

export function validateProgressBackup(value) {
  if (!object(value) || value.format !== FORMAT || !Array.isArray(value.countries) || value.countries.length > 250)
    throw new Error('TimePaletteの学習バックアップを選んでください。');
  let count = 0;
  const seen = new Set();
  const countries = value.countries.map(c=>{
    if (!object(c) || !/^[a-z]{2}$/.test(c.iso) || seen.has(c.iso) || !Array.isArray(c.missions))
      throw new Error('国の記録が不正です。');
    seen.add(c.iso);
    const ids = new Set();
    const missions = c.missions.map(m=>{
      if (++count > 20000 || !object(m) || typeof m.id !== 'string' || m.id.length > 160 ||
          !m.id.startsWith(c.iso+'-') || !/^[a-zA-Z0-9_-]+$/.test(m.id) ||
          !(m.domain === '' || LESSON_DOMAINS.includes(m.domain)))
        throw new Error('ミッションの記録が不正、または多すぎます。');
      if (ids.has(m.id)) throw new Error('重複したミッションがあります。');
      ids.add(m.id);
      return {id:m.id,domain:m.domain};
    });
    return {iso:c.iso,missions};
  });
  return {format:FORMAT,countries};
}

export function parseProgressBackup(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > MAX_BACKUP_BYTES)
    throw new Error('バックアップは1MB以内で選んでください。');
  let value;
  try { value = JSON.parse(text); } catch { throw new Error('JSONファイルを読み込めません。'); }
  return validateProgressBackup(value);
}

// Prepare all writes before touching storage. Merge instead of deleting newer progress.
export function restoreProgressBackup(value) {
  const backup = validateProgressBackup(value);
  const storage = learningStorage();
  if (!storage) throw new Error('保存領域を利用できません。');
  const read = key => {
    try {const value=JSON.parse(storage.getItem(key));return object(value)?value:{};}
    catch {return {};}
  };
  const world = read(WORLD), adventure = read(ADVENTURE);
  world.countries = object(world.countries)?world.countries:{};
  adventure.countries = object(adventure.countries)?adventure.countries:{};
  world.version = adventure.version = 1;
  const writes = new Map(), now = new Date().toISOString();
  let count = 0;
  for (const {iso,missions} of backup.countries) {
    const country = object(world.countries[iso])?world.countries[iso]:{};
    const ids = new Set(Array.isArray(country.completedMissionIds)?country.completedMissionIds:[]);
    for (const m of missions) {if(!ids.has(m.id))count++;ids.add(m.id);}
    world.countries[iso] = {...country,completedMissionIds:[...ids],updatedAt:now};
    const ac = object(adventure.countries[iso])?adventure.countries[iso]:{};
    ac.domains = object(ac.domains)?ac.domains:{};
    for (const domain of ['time','language']) {
      const selected = missions.filter(m=>m.domain===domain);
      if (!selected.length) continue;
      const d = object(ac.domains[domain])?ac.domains[domain]:{};
      d.missions = object(d.missions)?d.missions:{};
      for (const m of selected) if(!d.missions[m.id]?.completed)
        d.missions[m.id] = {completed:true,points:0,firstClearAt:now};
      d.updatedAt = now;ac.domains[domain] = d;
    }
    adventure.countries[iso] = ac;
    const places = missions.filter(m=>m.domain==='place').map(m=>m.id);
    if (places.length) {
      const key = 'timepalette-place-progress-v1:'+iso, old = read(key);
      writes.set(key,JSON.stringify({countryCode:iso,completedMissionIds:[...new Set([
        ...(Array.isArray(old.completedMissionIds)?old.completedMissionIds:[]),...places])],updatedAt:now}));
    }
  }
  writes.set(WORLD,JSON.stringify(world));writes.set(ADVENTURE,JSON.stringify(adventure));
  const previous = new Map([...writes.keys()].map(key=>[key,storage.getItem(key)]));
  try {for(const [key,data] of writes)storage.setItem(key,data);}
  catch {
    for(const [key,data] of previous)try{if(data===null)storage.removeItem(key);else storage.setItem(key,data);}catch{/* Storage may have been disabled. */}
    throw new Error('保存できませんでした。空き容量とブラウザーの設定を確認してください。');
  }
  return count;
}
