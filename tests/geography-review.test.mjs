import test from 'node:test';
import assert from 'node:assert/strict';
import reviews from '../src/data/geography/capital-review.json' with {type:'json'};
import {getGeographyPackage} from '../src/utils/geographyRegistry.js';
import {auditCapitalReview,auditGeographicCorrections} from '../src/utils/geographyReview.js';
import corrections from '../src/data/geography/geographic-corrections.json' with {type:'json'};

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
test('four supplemental A-group city points match the reviewed source records',()=>{
  let total=0;
  for(const [code,review] of Object.entries(corrections)){
    const result=auditGeographicCorrections(getGeographyPackage(code),review);
    assert.deepEqual(result.issues,[],code);total+=result.reviewedCityPoints;
  }
  assert.equal(total,4);
});
test('swapped city latitude and longitude invalidates the coordinate review',()=>{
  const country=structuredClone(getGeographyPackage('ag'));
  country.cities.find(c=>c.id==='ag-town-2').coordinates.reverse();
  assert.ok(auditGeographicCorrections(country,corrections.ag).issues.length>0);
});
