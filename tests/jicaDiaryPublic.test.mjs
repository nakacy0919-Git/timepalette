import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeWorldDiaryCatalog } from '../lib/jicaDiaryPublic.js';
import { toPublishedMission } from '../src/utils/publishedMissionCatalog.js';

const blog = 'https://world-diary.jica.go.jp/teachername/activity/post.php';
const id = '11111111-2222-4333-8444-555555555555';
const base = {
  id, countryIso: 'np', domain: 'lifeCulture', type: 'photoText4',
  prompt: 'OLD UNREUSABLE QUIZ TEXT', answer: 'A',
  choices: ['B','C','D'], explanation: 'OLD UNREUSABLE EXPLANATION',
  sources: [blog], media: [{slot:1}], learning:{levels:['juniorHigh'],challenge:{promptEn:'old question',answerEn:'old answer'}},
};

test('public JICA catalog never returns original diary-derived question, answers, photos or notes', () => {
  const [item] = sanitizeWorldDiaryCatalog([base]);
  const serialized = JSON.stringify(item);
  assert.equal(item.type, 'diaryReflection');
  assert.deepEqual(item.sources, [blog]);
  for (const secret of ['OLD UNREUSABLE', '"slot":1', '"answerEn":"old answer"']) {
    assert.equal(serialized.includes(secret), false, secret);
  }
  assert.deepEqual(item.learning.levels,['juniorHigh']);
});

test('non-JICA public catalog retains original four-choice questions', () => {
  const other = {...base,sources:['https://www.unicef.org/education']};
  assert.deepEqual(sanitizeWorldDiaryCatalog([other]), [other]);
  const mission = toPublishedMission(other);
  assert.equal(mission?.type,'single-choice');
  assert.equal(mission?.challenge?.choices?.length,4);
});

test('published JICA mission is a reading activity without any challenge or copied photo', () => {
  const [clean] = sanitizeWorldDiaryCatalog([base]);
  const mission = toPublishedMission(clean);
  assert.equal(mission.type,'world-diary-reflection');
  assert.equal(mission.prompt,'世界日記を読んで、感じたことを書こう');
  assert.equal('challenge' in mission,false);
  assert.deepEqual(mission.materials,[]);
  assert.equal(mission.sourceUrls[0],blog);
  assert.equal(JSON.stringify(mission).includes('OLD UNREUSABLE'),false);
});
