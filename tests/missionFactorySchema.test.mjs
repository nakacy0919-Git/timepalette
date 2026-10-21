import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateFactoryManifest,FACTORY_VERSION,normalizedFactoryPrompt} from '../src/mission-creator/missionFactorySchema.js';
const sample=(n=5)=>({version:FACTORY_VERSION,questions:Array.from({length:n},(_,i)=>({
  countryIso:'rw',domain:'lifeCulture',type:'photoText4',prompt:`${i+1}番の写真を見てください。`,
  answer:'学校',choices:['病院','市場','公園'],notes:'テスト用の例題です。',sources:[],
  learning:{levels:['elementary','juniorHigh']},images:{1:`images/${i+1}.png`}
}))});
test('five photo quizzes import with distinct, bounded media slots',()=>{
  const r=validateFactoryManifest(sample());
  assert.equal(r.length,5);assert.equal(r[4].images[0].path,'images/5.png');
  assert.deepEqual(r[0].question.learning.levels,['elementary','juniorHigh']);
});
test('more than five questions rejected before upload',()=>{
  assert.throws(()=>validateFactoryManifest(sample(6)),/1〜5問/);
});
test('no path traversal or absolute image locations',()=>{
  for(const path of ['../secret.png','images/../../test.png','https://elsewhere.test/a.png','images/evil\\name.png','/images/test.png']){
    const a=sample(1);a.questions[0].images={'1':path};
    assert.throws(()=>validateFactoryManifest(a),/安全な画像パス/);
  }
});
test('photo quiz with missing image rejected',()=>{
  const a=sample(1);a.questions[0].images={};
  assert.throws(()=>validateFactoryManifest(a),/画像スロット/);
});
test('existing exact prompt is safely skipped',()=>{
  const a=sample(1);
  assert.equal(validateFactoryManifest(a,[{countryIso:'rw',domain:'lifeCulture',prompt:'１番の写真を見てください。',status:'draft'}])[0].duplicate,true);
});
test('challenge requires English prompt and distinct English options',()=>{
  const a=sample(1);a.questions[0].learning.levels=['highSchoolAdvanced'];
  assert.throws(()=>validateFactoryManifest(a),/Challengeには英語問題文/);
  a.questions[0].learning.challenge={promptEn:'Which building is shown?',answerEn:'School',choicesEn:['Hospital','Market','Park'],explanationEn:'A school.'};
  assert.equal(validateFactoryManifest(a)[0].question.learning.challenge.answerEn,'School');
  a.questions[0].learning.challenge.choicesEn[2]='School';
  assert.throws(()=>validateFactoryManifest(a),/Challengeには英語の正答/);
});
test('duplicate prompts within ZIP rejected',()=>{
  const a=sample(2);a.questions[1].prompt=a.questions[0].prompt;
  assert.throws(()=>validateFactoryManifest(a),/ZIP内で問題文が重複/);
});
test('no uploaded fields such as status, id or role can be supplied to backend',()=>{
  const a=sample(1);a.questions[0].id='dangerous';a.questions[0].status='published';a.questions[0].role='admin';
  const {question}=validateFactoryManifest(a)[0];
  assert.equal(question.status,undefined);assert.equal(question.id,undefined);assert.equal(question.role,undefined);
  assert.equal(normalizedFactoryPrompt(question).startsWith('rw|lifeCulture|'),true);
});
