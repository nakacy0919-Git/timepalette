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
test('all 42 A-group city points match the reviewed source records',()=>{
  let total=0;
  for(const [code,review] of Object.entries(corrections)){
    const result=auditGeographicCorrections(getGeographyPackage(code),review);
    assert.deepEqual(result.issues,[],code);total+=result.reviewedCityPoints;
  }
  assert.equal(total,42);
});
test('swapped city latitude and longitude invalidates the coordinate review',()=>{
  const country=structuredClone(getGeographyPackage('ag'));
  country.cities.find(c=>c.id==='ag-town-2').coordinates.reverse();
  assert.ok(auditGeographicCorrections(country,corrections.ag).issues.length>0);
});

test('terrain and route evidence detects a changed transit country',async()=>{
  const {default:content}=await import('../src/data/geography/content-review.json',{with:{type:'json'}});
  const {auditContentReview}=await import('../src/utils/geographyReview.js');
  for(const [code,review] of Object.entries(content))assert.equal(auditContentReview(getGeographyPackage(code),review).status,'verified',code);
  const changed=structuredClone(getGeographyPackage('am'));changed.route.via='Turkey';
  assert.equal(auditContentReview(changed,content.am).status,'stale');
});

test('the live directory exposes the 197-country curriculum and retains the older review archive',async()=>{
 const {geographyCountries,getReleasedGeographyPackage}=await import('../src/utils/geographyRegistry.js');
 for(const p of geographyCountries)assert.equal(Boolean(getReleasedGeographyPackage(p.countryCode)),true);
 assert.equal(getReleasedGeographyPackage('jp').missions.length,10);
 assert.ok(getGeographyPackage('br'));
});
