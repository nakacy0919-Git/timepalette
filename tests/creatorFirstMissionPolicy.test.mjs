import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isCreatorFirstDomain, combineDomainMissions } from '../src/utils/creatorFirstMissionPolicy.js';

const builtIn = [{id:'old-1'}, {id:'old-2'}];
const published = [{id:'mc-2'}, {id:'mc-1'}];
for (const domain of ['language','lifeCulture','japanConnection','thinkConnect']) {
  test(`${domain}: no legacy missions, preserve published order`, () => {
    assert.equal(isCreatorFirstDomain(domain), true);
    assert.deepEqual(combineDomainMissions(domain,builtIn,published), published);
    assert.equal(builtIn.length, 2);
  });
}
for (const domain of ['place','time']) {
  test(`${domain}: preserve built-in and append published missions`, () => {
    assert.equal(isCreatorFirstDomain(domain), false);
    assert.deepEqual(combineDomainMissions(domain,builtIn,published), [...builtIn,...published]);
  });
}
test('country-specific creator-first routing precedes Rwanda legacy routing', () => {
  const panel = readFileSync('src/components/world-learning/WorldMissionPanel.jsx','utf8');
  const start = panel.indexOf('const selectDomain =');
  assert.ok(start >= 0);
  const intercept = panel.indexOf('if (isCreatorFirstDomain(domainId))',start);
  const oldRwanda = panel.indexOf('RWANDA PLACE ADVENTURE v1',start);
  assert.ok(intercept > start && oldRwanda > intercept);
});