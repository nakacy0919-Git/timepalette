import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

// Execute only the pure curriculum generator with the same country data Vite loads.
// Replace import.meta.glob with an explicit in-memory map for the Node test runner.
const dataDir = new URL('../src/data/', import.meta.url);
const files = readdirSync(dataDir).filter(name => /^countries_[a-z]\.json$/.test(name));
const countryModules = Object.fromEntries(files.map(name => [
  name, { default: JSON.parse(readFileSync(new URL(name,dataDir), 'utf8')) },
]));
const source = readFileSync(new URL('../src/utils/sharedLanguageExchange.js',import.meta.url),'utf8');
const globStatement = "const countryModules = import.meta.glob('../data/countries_*.json', { eager: true });";
assert.ok(source.includes(globStatement), 'Unexpected glob declaration: update test adapter');
const executable = source.replace(globStatement, 'const countryModules = providedModules;')
  .replace(/\bexport\s+(?=const|function)/g, '');
const { getSharedExchangeCountryCodes, getSharedLanguagePackage, SHARED_EXCHANGE_MISSION_COUNT } =
  new Function('providedModules', executable + '\nreturn {getSharedExchangeCountryCodes,getSharedLanguagePackage,SHARED_EXCHANGE_MISSION_COUNT};')(countryModules);

test('all 197 source countries have exactly 10 playable, unique language missions', () => {
  const codes = getSharedExchangeCountryCodes();
  assert.equal(codes.length, 197);
  assert.equal(new Set(codes).size, 197);
  assert.equal(SHARED_EXCHANGE_MISSION_COUNT, 10);
  const allIds = new Set();
  for (const iso of codes) {
    const pkg = getSharedLanguagePackage(iso);
    assert.equal(pkg.countryCode, iso);
    assert.equal(pkg.domain, 'language');
    assert.equal(pkg.missions.length, 10, iso);
    for (const [index,mission] of pkg.missions.entries()) {
      assert.equal(mission.buildStatus, 'ready', iso);
      assert.equal(mission.domain, 'language', iso);
      assert.equal(mission.speech.steps.length,index+1,iso);
      assert.ok(mission.speech.steps.every(t => t.phrase && t.translation && t.kana && t.partnerPhrase),iso);
      assert.ok(!allIds.has(mission.id), mission.id);
      allIds.add(mission.id);
    }
    assert.equal(pkg.missions[9].finalGoal, true);
  }
  assert.equal(allIds.size, 1970);
});

test('profile personalization and country-specific partners are available', () => {
  const al = getSharedLanguagePackage('al');
  const fields = new Set(al.missions[1].speech.fields.map(x => x.id));
  for (const field of ['name','homeCountry','city','school','hobby','food','nameKana']) {
    assert.ok(fields.has(field),field);
  }
  assert.match(al.missions[3].speech.steps[3].partnerPhrase,/Albania/);
  assert.match(getSharedLanguagePackage('rw').missions[3].speech.steps[3].partnerPhrase,/Rwanda/);
  assert.ok(al.missions.every(m => !JSON.stringify(m).includes('Can you hear me?')));
});
