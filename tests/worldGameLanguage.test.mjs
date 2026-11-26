import test from 'node:test';
import assert from 'node:assert/strict';
import {makeLocalGameBank} from '../src/utils/worldGameBank.js';
import {getGeography197CountryCodes,getGeography197Profile} from '../src/utils/geography197.js';
import {hasEnglishQuestion,localizeQuestion} from '../src/utils/worldGameLanguage.js';
import {balancedDeck,validQuestion} from '../src/utils/worldGameEngine.js';
test('all 197 country game banks have bilingual capital and three time questions',()=>{
 const countries=getGeography197CountryCodes().map(iso=>({iso,nameJa:getGeography197Profile(iso).nameJa}));
 assert.equal(countries.length,197);
 const bank=makeLocalGameBank(countries,[]);
 assert.equal(bank.length,788);
 for(const q of bank){
  assert.ok(hasEnglishQuestion(q),q.id);
  const en=localizeQuestion(q,'en'),ja=localizeQuestion(q,'ja');
  assert.ok(validQuestion(en),q.id);assert.equal(en.correctIndex,ja.correctIndex,q.id);
  const shuffled=balancedDeck([en],1,()=>0.2)[0];
  assert.equal(shuffled.choices[shuffled.correctIndex],en.choices[en.correctIndex],q.id);
  assert.equal(shuffled.language,'en');
 }
});
test('untranslated questions do not silently enter English mode',()=>{
 const q={id:'a',country:'jp',domain:'place',prompt:'問題',choices:['1','2','3','4'],correctIndex:0,explanation:'解説'};
 assert.equal(localizeQuestion(q,'en'),null);
 assert.equal(localizeQuestion(q,'ja').prompt,q.prompt);
});
