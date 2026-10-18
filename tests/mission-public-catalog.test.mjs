import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePublishedCatalog} from '../src/utils/publishedMissionCatalog.js';
const id='12345678-1234-1234-1234-123456789abc';
test('photo + text multiple choice becomes playable and does not leak private media',()=>{
  const [m]=normalizePublishedCatalog([{id,type:'photoText4',countryIso:'rw',domain:'lifeCulture',prompt:'What is it?',answer:'B',choices:['A','C','D'],media:[{slot:1}],explanation:'Explanation'}]);
  assert.equal(m.challenge.correctIndex,0);
  assert.equal(m.challenge.choices.length,4);
  assert.equal(m.materials.length,1);
  assert.equal(m.materials[0].url.includes('questionId='+id),true);
  assert.equal(m.creatorQuestionId,id);
});
test('photo four-choice respects authored correct slot',()=>{
  const [m]=normalizePublishedCatalog([{id,type:'photo4',countryIso:'rw',domain:'lifeCulture',prompt:'Choose image',answer:'写真スロット3',media:[{slot:1},{slot:2},{slot:3},{slot:4}]}]);
  assert.equal(m.challenge.correctIndex,2);
  assert.equal(m.challenge.choices.every(c=>c.image.startsWith('/api/mission-public?')),true);
});
test('invalid source questions are excluded',()=>{
  assert.deepEqual(normalizePublishedCatalog([{id,type:'free',prompt:'Test'}]),[]);
  assert.deepEqual(normalizePublishedCatalog([{id,type:'photoText4',prompt:'Test',answer:'A',choices:['B','C','D'],media:[]}]),[]);
});
