import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../src/data/world-games/approvedQuestions.json' with {type:'json'};
import {approvedStandaloneQuestions,makeLocalGameBank} from '../src/utils/worldGameBank.js';
import {hasCompleteReadings} from '../src/utils/schoolQuestionBank.js';
import {hasEnglishQuestion,localizeQuestion} from '../src/utils/worldGameLanguage.js';
import {validQuestion,shuffleOptions} from '../src/utils/worldGameEngine.js';
const items=catalog.questions.filter(q=>q.id.startsWith('tp-editorial-v1-'));
test('editorial wave one: approved original bilingual four-choice questions',()=>{
 assert.equal(items.length,28);assert.equal(new Set(items.map(q=>q.id)).size,items.length);
 assert.equal(approvedStandaloneQuestions(items).length,items.length);
 for(const q of items){assert.ok(validQuestion(q),q.id);assert.ok(hasEnglishQuestion(q),q.id);assert.ok(q.sources.every(s=>s.startsWith('https://')),q.id);if(q.gradeBand==='elementary')assert.ok(hasCompleteReadings(q),q.id);for(const lang of ['ja','en']){const localized=localizeQuestion(q,lang),shuffled=shuffleOptions(localized,()=>0.31);assert.equal(shuffled.choices[shuffled.correctIndex],localized.choices[q.correctIndex]);}}
});
test('editorial questions respect selected countries',()=>{const bank=makeLocalGameBank([{iso:'mn',nameJa:'モンゴル'}]);assert.ok(bank.some(q=>q.id==='tp-editorial-v1-mn-ger'));assert.ok(bank.every(q=>q.country==='mn'));});
