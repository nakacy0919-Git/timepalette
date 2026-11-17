import test from 'node:test';
import assert from 'node:assert/strict';
import {UNICEF_VIDEO_MISSIONS, getUnicefVideoMissions} from '../src/data/unicefVideoMissions.js';
import {videoEmbedUrl} from '../src/utils/creatorVideo.js';

test('UNICEF video mission bank has only validated official embeds and four-choice questions', () => {
  const ids = new Set();
  assert.ok(UNICEF_VIDEO_MISSIONS.length >= 12);
  for (const mission of UNICEF_VIDEO_MISSIONS) {
    assert.ok(!ids.has(mission.id), 'duplicate mission id: ' + mission.id);
    ids.add(mission.id);
    assert.match(mission.countryIso, /^[a-z]{2}$/);
    assert.ok(['lifeCulture', 'japanConnection', 'thinkConnect'].includes(mission.domain));
    assert.ok(videoEmbedUrl(mission.video).startsWith('https://www.youtube-nocookie.com/embed/'));
    assert.match(mission.sourceUrl, /^https:\/\/(www\.unicef\.or\.jp|www\.unicef\.org)\//);
    assert.ok(mission.intro.length > 20);
    assert.ok(mission.questions.length >= 3);
    for (const q of mission.questions) {
      assert.equal(q.choices.length, 4);
      assert.equal(new Set(q.choices).size, 4);
      assert.ok(Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < 4);
      assert.ok(q.prompt && q.explanation);
    }
  }
});

test('video lessons are offered only for their own country and the existing three categories', () => {
  assert.ok(getUnicefVideoMissions('et', 'lifeCulture').some(m => m.video.youtubeId === 'PP0IvKmLfRY'));
  assert.ok(getUnicefVideoMissions('et', 'japanConnection').some(m => m.video.youtubeId === 'OrrZylV4-D4'));
  assert.ok(getUnicefVideoMissions('ug', 'japanConnection').length >= 2);
  assert.ok(getUnicefVideoMissions('ke', 'thinkConnect').length >= 1);
  assert.deepEqual(getUnicefVideoMissions('et', 'time'), []);
  assert.deepEqual(getUnicefVideoMissions('et', 'place'), []);
  assert.deepEqual(getUnicefVideoMissions('jp', 'lifeCulture'), []);
  assert.deepEqual(getUnicefVideoMissions('xx', 'thinkConnect'), []);
  assert.deepEqual(getUnicefVideoMissions('ET', 'lifeCulture'), getUnicefVideoMissions('et', 'lifeCulture'));
});
