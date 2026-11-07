import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLearnerJourney } from '../src/utils/learnerJourneyProgress.js';

const country = iso => ({
  iso, nameJa: iso === 'jp' ? '日本' : 'ルワンダ', nameEn: iso,
  missionData: { missions: [
    { id: iso + '-place-01', domain: 'place' },
    { id: iso + '-time-01', domain: 'time' },
    { id: iso + '-mc-abc', domain: 'lifeCulture' },
  ] },
});
const empty = iso => ({ completedMissionIds: [], updatedAt: null });

test('progress summary starts empty without fabricated completions', () => {
  const result = buildLearnerJourney([country('jp'), country('rw')], {
    world: { countries: {} }, adventure: { countries: {} }, placeForCode: empty,
  });
  assert.equal(result.totalCountries, 2);
  assert.equal(result.exploredCountries, 0);
  assert.equal(result.completedMissions, 0);
  assert.equal(result.activeDomains, 0);
  assert.equal(result.countries[0].domains.find(d => d.id === 'language').available, 10);
});

test('same mission across all storage systems is counted only once', () => {
  const result = buildLearnerJourney([country('jp'), country('rw')], {
    world: { countries: { jp: { completedMissionIds: ['jp-place-01', 'jp-time-01', 'jp-mc-abc'], updatedAt: '2026-11-01T12:00:00Z' } } },
    adventure: { countries: { jp: { domains: {
      time: { updatedAt: '2026-11-03T12:00:00Z', missions: { 'jp-time-01': { completed: true } } },
      language: { missions: { 'jp-language-shared-01': { completed: true, points: 10 } } },
    } } } },
    placeForCode: iso => iso === 'jp' ? { completedMissionIds: ['jp-place-01'], updatedAt: '2026-11-02T12:00:00Z' } : empty(iso),
  });
  assert.equal(result.completedMissions, 4);
  assert.equal(result.exploredCountries, 1);
  assert.equal(result.activeDomains, 4);
  assert.equal(result.lastCountry.iso, 'jp');
  const jp = result.countries[0];
  assert.equal(jp.completedIds.length, 4);
  assert.equal(jp.domains.find(d => d.id === 'place').completed, 1);
  assert.equal(jp.domains.find(d => d.id === 'time').completed, 1);
  assert.equal(jp.domains.find(d => d.id === 'language').completed, 1);
  assert.equal(jp.domains.find(d => d.id === 'lifeCulture').completed, 1);
});

test('old delisted creator missions are retained but not falsely assigned a domain', () => {
  const result = buildLearnerJourney([country('rw')], {
    world: { countries: { rw: { completedMissionIds: ['rw-mc-archived', 'jp-place-01'] } } },
    adventure: { countries: {} }, placeForCode: empty,
  });
  const rw = result.countries[0];
  assert.equal(rw.completedCount, 1);
  assert.equal(rw.unclassified, 1);
  assert.equal(result.exploredCountries, 1);
  assert.ok(rw.availableCount >= rw.completedCount);
});

test('spanish language countries include both language tracks', () => {
  const result = buildLearnerJourney([country('es'), country('jp')], {
    world: { countries: {} }, adventure: { countries: {} }, placeForCode: empty,
  });
  assert.equal(result.countries[0].domains.find(d => d.id === 'language').available, 20);
  assert.equal(result.countries[1].domains.find(d => d.id === 'language').available, 10);
});
