import {test} from 'node:test';
import assert from 'node:assert/strict';
import {forCreatorLearningLevel,DEFAULT_CREATOR_LEVELS} from '../src/utils/creatorMissionLevels.js';
const base={id:'rw-mc-test',creatorQuestionId:'test',type:'single-choice',prompt:'日本語の質問',title:'日本語',explanation:'日本語解説',
  challenge:{choices:['答え','誤答1','誤答2','誤答3'],correctIndex:0}};
test('legacy published question stays on ordinary school levels only',()=>{
 for(const level of DEFAULT_CREATOR_LEVELS)assert.equal(forCreatorLearningLevel(base,level),base);
 assert.equal(forCreatorLearningLevel(base,'highSchoolAdvanced'),null);
});
test('one question can cover elementary and junior high',()=>{
 const q={...base,learning:{levels:['elementary','juniorHigh']}};
 assert.ok(forCreatorLearningLevel(q,'elementary'));
 assert.ok(forCreatorLearningLevel(q,'juniorHigh'));
 assert.equal(forCreatorLearningLevel(q,'highSchoolStandard'),null);
});
test('Challenge uses the English prompt, options and explanation',()=>{
 const q={...base,learning:{levels:['highSchoolAdvanced'],challenge:{promptEn:'Choose the correct answer.',answerEn:'Correct',choicesEn:['A','B','C'],explanationEn:'Because it is correct.'}}};
 const v=forCreatorLearningLevel(q,'highSchoolAdvanced');
 assert.equal(v.prompt,'Choose the correct answer.');
 assert.deepEqual(v.challenge.choices,['Correct','A','B','C']);
 assert.equal(v.explanation,'Because it is correct.');
 assert.equal(q.prompt,'日本語の質問');
});
test('Challenge without English text cannot be shown',()=>{
 assert.equal(forCreatorLearningLevel({...base,learning:{levels:['highSchoolAdvanced']}},'highSchoolAdvanced'),null);
});
test('photo-only Challenge keeps image choices',()=>{
 const q={...base,challenge:{choices:[{id:'1'},{id:'2'},{id:'3'},{id:'4'}],correctIndex:0},learning:{levels:['highSchoolAdvanced'],challenge:{promptEn:'Which picture shows a school?'}}};
 assert.equal(forCreatorLearningLevel(q,'highSchoolAdvanced').challenge.choices[0].id,'1');
});
