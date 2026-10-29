import test from 'node:test';
import assert from 'node:assert/strict';
import {getTimeCountryCodes,getTimePackage} from '../src/utils/time197.js';
import {getPublishedTimeMissions,getCreatorCompletionCount,getTimeReleaseSummary} from '../src/utils/creatorProductionProgress.js';
test('Creator release totals match all 197 production packages and 1970 missions',()=>{
 const countries=getTimeCountryCodes().map(iso=>({iso}));
 assert.deepEqual(getTimeReleaseSummary(countries),{countries:197,missions:1970});
 for(const {iso} of countries){
  assert.equal(getPublishedTimeMissions(iso),getTimePackage(iso).missions);
  assert.equal(getCreatorCompletionCount({builtIn:getPublishedTimeMissions(iso).length}),10,iso);
 }
 assert.equal(getPublishedTimeMissions('unknown').length,0);
});
test('manual/approved counts do not duplicate the same built-in release or invent submissions',()=>{
 assert.equal(getCreatorCompletionCount({manual:7,approved:3,builtIn:10}),10);
 assert.equal(getCreatorCompletionCount({manual:5,approved:7}),7);
 assert.equal(getCreatorCompletionCount({manual:20,approved:12,builtIn:10}),10);
 assert.equal(getCreatorCompletionCount({manual:'bad',approved:-3}),0);
 assert.deepEqual(getTimeReleaseSummary([{iso:'unknown'}]),{countries:0,missions:0});
});
