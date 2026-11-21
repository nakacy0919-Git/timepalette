import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeWorldDiaryCatalog } from '../lib/jicaDiaryPublic.js';
import { toPublishedMission } from '../src/utils/publishedMissionCatalog.js';

const blog = 'https://world-diary.jica.go.jp/teachername/activity/post.php';
const id = '11111111-2222-4333-8444-555555555555';
const base = {
  id, countryIso: 'np', domain: 'lifeCulture', type: 'photoText4',
  prompt: 'この記事に書かれた活動はどれ？', answer: '地域の清掃活動',
  choices: ['文化祭','スポーツ大会','地域の会議'],
  explanation: '記事中の活動についての説明',
  sources: [blog], media: [{slot:1}], learning:{levels:['juniorHigh']},
};

test('JICA World Diary text quiz is retained but copied photo data is excluded', () => {
  const [item] = sanitizeWorldDiaryCatalog([base]);
  assert.equal(item.type,'photoText4');
  assert.equal(item.prompt,base.prompt);
  assert.equal(item.answer,base.answer);
  assert.deepEqual(item.choices,base.choices);
  assert.deepEqual(item.media,[]);
  assert.deepEqual(item.sourceUrls,[blog]);
  const mission = toPublishedMission(item);
  assert.equal(mission.type,'single-choice');
  assert.deepEqual(mission.challenge.choices,[base.answer,...base.choices]);
  assert.equal(mission.challenge.correctIndex,0);
  assert.deepEqual(mission.materials,[]);
  assert.equal(mission.jicaDiarySourceUrl,blog);
  assert.equal(mission.explanation,base.explanation);
});

test('non-JICA questions remain unchanged including their own licensed photos', () => {
  const other={...base,sources:['https://www.unicef.org/education']};
  assert.deepEqual(sanitizeWorldDiaryCatalog([other]),[other]);
  const mission=toPublishedMission(other);
  assert.equal(mission?.type,'single-choice');
  assert.equal(mission?.challenge?.choices?.length,4);
  assert.equal(mission?.materials?.length,1);
  assert.equal(mission.jicaDiarySourceUrl,undefined);
});

test('photo-only diary question stays reading-only until replacement media is licensed', () => {
  const photoOnly={...base,type:'photo4',answer:'写真スロット 1',
    choices:[],media:[{slot:1},{slot:2},{slot:3},{slot:4}]};
  const [clean]=sanitizeWorldDiaryCatalog([photoOnly]);
  const mission=toPublishedMission(clean);
  assert.equal(mission?.type,'world-diary-reflection');
  assert.equal('challenge' in mission,false);
  assert.deepEqual(mission.materials,[]);
  assert.deepEqual(mission.sourceUrls,[blog]);
});

test('A JICA organization URL is not an individual World Diary and remains a normal question', () => {
  const jicaReport={...base,sources:['https://www.jica.go.jp/overseas/nepal/index.html']};
  assert.deepEqual(sanitizeWorldDiaryCatalog([jicaReport]),[jicaReport]);
  assert.equal(toPublishedMission(jicaReport)?.type,'single-choice');
});
