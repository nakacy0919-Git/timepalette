import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {toggleBoundedSelection,selectedAnswersCorrect,routeAnswersCorrect,RWANDA_ANSWER_CONTRACT} from '../src/utils/rwandaAnswerContract.js';
import {getRwandaFormat} from '../src/utils/geographyRwandaFormat.js';
import {geographyCountries,getGeographyPackage} from '../src/utils/geographyRegistry.js';
const reference=JSON.parse(fs.readFileSync(new URL('../src/data/place_r.json',import.meta.url)));
test('Rwanda reference selection and departure rules remain valid',()=>{
 for(const [index,count,key] of [[6,2,'choices'],[9,3,'facts']]){
  const choices=reference.missions[index][key],correct=choices.filter(c=>c.correct).map(c=>c.id);
  assert.equal(selectedAnswersCorrect(correct,choices,count),true);
  assert.equal(selectedAnswersCorrect([...correct.slice(1),choices.find(c=>!c.correct).id],choices,count),false);
  assert.equal(selectedAnswersCorrect(correct.slice(1),choices,count),false);
  assert.deepEqual(toggleBoundedSelection(correct,'extra',count),correct);
  assert.equal(selectedAnswersCorrect(Array(count).fill(correct[0]),choices,count),false);
 }
 const route=reference.missions[7].route;
 assert.equal(routeAnswersCorrect(route.countryChoices.find(c=>c.correct).id,route.portChoices.find(c=>c.correct).id,route),true);
 assert.equal(routeAnswersCorrect(route.countryChoices.find(c=>!c.correct).id,route.portChoices.find(c=>c.correct).id,route),false);
});
test('all A packages supply the full Rwanda interaction contract without duplicate choices',()=>{
 const a=geographyCountries.filter(p=>p.group==='A');assert.equal(a.length,11);
 for(const country of a){const p=getGeographyPackage(country.countryCode),f=getRwandaFormat(p);
  assert.ok(f.regionChoices.some(r=>r[0]===f.region),p.countryCode+' region');
  assert.equal(f.lifeChoices.length,4);assert.equal(f.lifeChoices.filter(c=>c.correct).length,2);
  assert.equal(f.facts.length,RWANDA_ANSWER_CONTRACT.finalFactCount);assert.equal(f.facts.filter(c=>c.correct).length,3);
  assert.equal(new Set(f.facts.map(c=>c.id)).size,5);assert.equal(f.facts.find(c=>c.id==='wrong-capital').label,'首都は'+f.cityLabels[p.cities.findIndex(c=>c.id!==p.capitalId)]);assert.equal(f.cityLabels.length,p.cities.length);
  assert.ok(f.culturePhoto.sourceUrl.startsWith('https://commons.wikimedia.org/wiki/File:'));
  assert.ok(fs.existsSync('public'+f.culturePhoto.deliveryUrl));
  assert.ok(f.lifeChoices.every(c=>c.label&&!c.label.includes('undefined')));
 }
});
