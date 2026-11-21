import test from 'node:test';
import assert from 'node:assert/strict';
import { getJicaWorldDiaryUrls, isJicaWorldDiaryChoice } from '../src/utils/jicaWorldDiary.js';

test('World Diary sourced published four-choice missions become reflection activities', () => {
  const mission = { type: 'single-choice', sourceUrls: ['https://world-diary.jica.go.jp/sampleauthor/activity/post.php'], materials: [{ type: 'image', url: 'https://example.org/old-photo.jpg' }] };
  assert.equal(isJicaWorldDiaryChoice(mission), true);
  assert.deepEqual(getJicaWorldDiaryUrls(mission), ['https://world-diary.jica.go.jp/sampleauthor/activity/post.php']);
});

test('Unrelated four-choice questions remain unchanged', () => {
  assert.equal(isJicaWorldDiaryChoice({ type:'single-choice', sourceUrls:['https://www.unicef.org/education'] }), false);
  assert.equal(isJicaWorldDiaryChoice({ type:'single-choice', sourceUrls:['https://www.jica.go.jp/overseas/rwanda/index.html'] }), false);
  assert.equal(isJicaWorldDiaryChoice({ type:'single-choice', sourceUrls:['https://world-diary.jica.go.jp.evil.example/post.php'] }), false);
});

test('Legacy explanation URLs are detected, duplicate URLs are removed', () => {
  const url = 'https://world-diary.jica.go.jp/sampleauthor/person/post.php';
  const mission = { type:'single-choice', sourceUrls:[url], explanation:'出典はこちら：' + url + '。' };
  assert.deepEqual(getJicaWorldDiaryUrls(mission), [url]);
});

test('Only source-backed choice missions are rerouted', () => {
  const sourceUrls = ['https://world-diary.jica.go.jp/sampleauthor/activity/post.php'];
  assert.equal(isJicaWorldDiaryChoice({type:'creator-video-reflection',sourceUrls}), false);
  assert.equal(isJicaWorldDiaryChoice({type:'single-choice',sourceUrls:['https://world-diary.jica.go.jp/']}), false);
  assert.equal(isJicaWorldDiaryChoice({type:'single-choice',sourceUrls:['http://world-diary.jica.go.jp/sampleauthor/post.php']}), false);
});
