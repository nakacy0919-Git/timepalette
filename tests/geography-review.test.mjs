import test from 'node:test';
import assert from 'node:assert/strict';
import reviews from '../src/data/geography/capital-review.json' with {type:'json'};
import {getGeographyPackage} from '../src/utils/geographyRegistry.js';
import {auditCapitalReview} from '../src/utils/geographyReview.js';

test('reviewed capitals match the independent official-source ledger',()=>{
  assert.equal(Object.keys(reviews).length,11);
  for(const [code,review] of Object.entries(reviews))
    assert.equal(auditCapitalReview(getGeographyPackage(code),review).status,'verified',code);
});
test('Canberra evidence becomes stale if the correct-capital ID changes to Sydney',()=>{
  const country=structuredClone(getGeographyPackage('au'));
  country.capitalId=country.cities.find(c=>c.name==='Sydney').id;
  assert.equal(auditCapitalReview(country,reviews.au).status,'stale');
});
test('missing evidence remains pending, and a missing source cannot certify a capital',()=>{
  const country=getGeographyPackage('au');
  assert.equal(auditCapitalReview(country).status,'pending');
  assert.equal(auditCapitalReview(country,{...reviews.au,sourceUrl:''}).status,'stale');
});
