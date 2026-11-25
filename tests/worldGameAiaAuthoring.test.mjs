import test from 'node:test';
import assert from 'node:assert/strict';
import {aiaQuestionIssues,buildAiaProductionPlan} from '../src/utils/worldGameAiaAuthoring.js';
import {approvedStandaloneQuestions} from '../src/utils/worldGameBank.js';
import {localizeQuestion} from '../src/utils/worldGameLanguage.js';
import {balancedDeck} from '../src/utils/worldGameEngine.js';
import seed from '../docs/aia-refresh/verified-statistics-seed.json' with {type:'json'};
const q={id:'aia-test-uz-001',country:'uz',domain:'lifeCulture',subcategory:'食文化',prompt:'問題文',choices:['答え','選択肢二','選択肢三','選択肢四'],correctIndex:0,explanation:'解説',translations:{en:{prompt:'Which answer is correct?',choices:['Answer','Choice two','Choice three','Choice four'],explanation:'The first option is correct.',subcategory:'Food culture'}},origin:'AIA',sources:['https://www2.aia.pref.aichi.jp/koryu/j/kyouzai/PDF/H20/uzbekistan.pdf'],sourcePages:[12],verifiedOn:'2026-11-25',translationReviewStatus:'approved',reviewStatus:'approved',rightsConfirmed:true,gameEligible:true,requiresReading:false};
test('118 source countries, 40 bilingual questions per country, 4,720 target',()=>{
 const plan=buildAiaProductionPlan(seed.scope);
 assert.equal(plan.countries.length,118);assert.equal(plan.perCountry,40);assert.equal(plan.targetQuestions,4720);assert.deepEqual(plan.languages,['ja','en']);
});
test('bilingual content must be present and reviewed before either language enters games',()=>{
 assert.deepEqual(aiaQuestionIssues(q,{publish:true}),[]);
 for(const bad of [{...q,translations:undefined},{...q,translationReviewStatus:'draft'},{...q,sourcePages:[]},{...q,rightsConfirmed:false},{...q,verifiedOn:'2026-02-30'},{...q,dataYear:2027},{...q,translations:{en:{...q.translations.en,choices:['A','A','C','D']}}}]){
  assert.ok(aiaQuestionIssues(bad,{publish:true}).length);assert.equal(approvedStandaloneQuestions([bad]).length,0);
 }
 assert.equal(approvedStandaloneQuestions([q]).length,1);
 const en=localizeQuestion(q,'en'),ja=localizeQuestion(q,'ja');
 assert.equal(en.correctIndex,ja.correctIndex);
 for(const localized of [en,ja]){
  const shuffled=balancedDeck([localized],1,()=>0.1)[0];assert.equal(shuffled.choices[shuffled.correctIndex],localized.choices[localized.correctIndex]);
 }
});
test('unreviewed drafts may pass structure checks but cannot be published',()=>{
 const draft={...q,reviewStatus:'draft',rightsConfirmed:false,gameEligible:false,translationReviewStatus:'draft',sourcePages:[]};
 assert.deepEqual(aiaQuestionIssues(draft),[]);assert.ok(aiaQuestionIssues(draft,{publish:true}).length);assert.equal(approvedStandaloneQuestions([draft]).length,0);
});
