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
test('country panel has no embedded mission-bank import or legacy Creator adventure launchers', () => {
  const panel = readFileSync('src/components/world-learning/WorldMissionPanel.jsx','utf8');
  assert.equal(/missions_.*json|LanguageAdventureLauncher|LifeCultureAdventureLauncher|ThinkConnectAdventureLauncher/.test(panel),false);
  assert.ok(panel.includes('fetchPublishedCountry'));
  assert.ok(panel.includes('forCreatorLearningLevel'));
});
