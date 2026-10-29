import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {getTimeCountryCodes,getTimePackage,offsetAt,localInstant,formatStamp,schoolWindows,TIME_COUNTRIES} from '../src/utils/time197.js';
const instant=s=>Date.parse(s);
test('canonical 197 countries each expose exactly ten complete, uniquely identified four-choice missions',()=>{
 const canonical=Object.assign({},...readdirSync('src/data').filter(f=>/^countries_[a-z]\.json$/.test(f)).map(f=>JSON.parse(readFileSync(`src/data/${f}`))));
 assert.deepEqual(getTimeCountryCodes().sort(),Object.keys(canonical).sort());
 const ids=new Set();
 for(const code of getTimeCountryCodes()){
  const p=getTimePackage(code); assert.equal(p.missions.length,10,code);
  assert.equal(new Set(p.missions.map(m=>m.prompt)).size,10,code);
  for(const m of p.missions){
   assert.ok(!ids.has(m.id),m.id);ids.add(m.id);
   assert.equal(m.options.length,4,m.id);
   assert.equal(new Set(m.options.map(o=>o.label)).size,4,m.id);
   assert.equal(m.options.filter(o=>o.correct).length,1,m.id);
   assert.ok(m.prompt.includes(p.cityJa)||m.type==='time-order-race',m.id);
   assert.equal(m.zone,TIME_COUNTRIES[code].zone);
   assert.ok(m.explanation.length>30,m.id);
   for(const c of m.clocks)assert.match(formatStamp(c.zone,c.instant),/^2026-\d{2}-\d{2} \d{2}:\d{2}$/);
  }
 }
 assert.equal(ids.size,1970);assert.equal(getTimePackage('no-such-country'),null);
});
test('fractional offsets and international date rollover are exact',()=>{
 const t=instant('2026-01-15T03:00:00Z');
 assert.equal(formatStamp('Asia/Kathmandu',t),'2026-01-15 08:45');
 assert.equal(formatStamp('Asia/Kabul',t),'2026-01-15 07:30');
 assert.equal(formatStamp('Asia/Yangon',t),'2026-01-15 09:30');
 assert.equal(formatStamp('America/New_York',t),'2026-01-14 22:00');
 assert.equal(formatStamp('Pacific/Auckland',instant('2026-01-15T15:30:00Z')),'2026-01-16 04:30');
 assert.equal(formatStamp('Asia/Tokyo',localInstant('Africa/Kigali','2026-01-15','22:30')+12*3600000),'2026-01-16 17:30');
});
test('DST changes at the exact UTC transition, with safe handling of gaps and repeats',()=>{
 assert.equal(offsetAt('Europe/Paris',instant('2026-03-29T00:59:59Z')),60);
 assert.equal(offsetAt('Europe/Paris',instant('2026-03-29T01:00:00Z')),120);
 assert.throws(()=>localInstant('Europe/Paris','2026-03-29','02:30'),RangeError);
 assert.throws(()=>localInstant('Europe/Paris','2026-10-25','02:30'),RangeError);
 assert.equal(offsetAt('Australia/Sydney',instant('2026-01-15T00:00:00Z')),660);
 assert.equal(offsetAt('Australia/Sydney',instant('2026-07-15T00:00:00Z')),600);
});
test('pinned 2026f rules do not depend on the browser timezone database',()=>{
 assert.equal(offsetAt('Africa/Casablanca',instant('2026-10-30T12:00:00Z')),0);
 assert.equal(offsetAt('America/Havana',instant('2026-11-02T12:00:00Z')),-240);
 assert.throws(()=>offsetAt('Asia/Tokyo',instant('2037-01-01T00:00:00Z')),RangeError);
});
test('school planner includes the full session and permits no simultaneous solution',()=>{
 assert.equal(schoolWindows('Asia/Tokyo').length,15);
 assert.equal(schoolWindows('America/New_York').length,0);
 assert.equal(schoolWindows('Africa/Kigali').length,1);
 assert.equal(schoolWindows('Africa/Kigali')[0],'15:30');
 for(const code of getTimeCountryCodes()){
  const m=getTimePackage(code).missions[8],correct=m.options.find(o=>o.correct).label;
  if(m.schoolWindows.length)assert.ok(correct.includes(m.schoolWindows[0]),code);
  else assert.match(correct,/録画/,code);
 }
});
test('Japan zero difference, Nepal 45-minute difference, and country-specific final trip',()=>{
 assert.equal(getTimePackage('jp').missions[0].options.find(o=>o.correct).label,'東京と同じ時刻');
 assert.equal(getTimePackage('np').missions[0].options.find(o=>o.correct).label,'東京より3時間15分遅い');
 assert.equal(getTimePackage('rw').missions[9].options.find(o=>o.correct).label,'2026-01-16 17:30');
});
