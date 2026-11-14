import test from 'node:test';
import assert from 'node:assert/strict';
import {toPublishedMission} from '../src/utils/publishedMissionCatalog.js';
import {forCreatorLearningLevel} from '../src/utils/creatorMissionLevels.js';
import {reflectionReady} from '../src/utils/creatorReflection.js';
const q={id:'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',countryIso:'be',domain:'thinkConnect',type:'free',prompt:'何に気づきましたか？',answer:'見方の一例',explanation:'根拠を確認しよう',sources:['https://example.org']};
test('free and photo reflection retain the prompt, reference answer and sources without fake choices',()=>{
  const free=toPublishedMission(q);assert.equal(free.type,'creator-reflection');
  assert.equal(free.referenceAnswer,q.answer);assert.equal(free.explanation,q.explanation);
  assert.deepEqual(free.sourceUrls,q.sources);assert.equal(free.challenge,undefined);
  assert.deepEqual(free.materials,[]);
  assert.equal(toPublishedMission({...q,type:'photo1'}),null);
  const photo=toPublishedMission({...q,type:'photo1',media:[{slot:1}]});
  assert.equal(photo.materials.length,1);assert.match(photo.materials[0].url,/questionId=aaaaaaaa/);
  assert.equal(toPublishedMission({...q,type:'web'}),null);
});
test('reflection completion requires intentional self-check and loaded evidence, not an answer match',()=>{
  assert.equal(reflectionReady('          ',true),false);
  assert.equal(reflectionReady('short',true),false);
  assert.equal(reflectionReady('自分の考えと理由をここに書きました。',false),false);
  assert.equal(reflectionReady('自分の考えと理由をここに書きました。',true,false),false);
  assert.equal(reflectionReady('参考回答と異なる考えですが根拠を示します。',true),true);
  assert.equal(reflectionReady('a'.repeat(3001),true),false);
});
test('Challenge uses the teacher English reference rather than leaking the Japanese answer',()=>{
  const mission=toPublishedMission({...q,learning:{levels:['highSchoolAdvanced'],challenge:{promptEn:'What do you notice?',answerEn:'A possible interpretation',explanationEn:'Discuss the evidence.'}}});
  const english=forCreatorLearningLevel(mission,'highSchoolAdvanced');
  assert.equal(english.referenceAnswer,'A possible interpretation');assert.equal(english.prompt,'What do you notice?');
});
