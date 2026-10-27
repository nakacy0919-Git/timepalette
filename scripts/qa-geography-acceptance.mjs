import fs from 'node:fs';
import assert from 'node:assert/strict';
import {geographyCountries} from '../src/utils/geographyRegistry.js';
const countries=geographyCountries.filter(p=>p.group==='A');
const reports=['geography-A-release-browser.json','geography-A-touch-browser.json'].map(f=>JSON.parse(fs.readFileSync('docs/qa/'+f)));
const rows=[];
for(const country of countries)for(let mission=1;mission<=10;mission++){
 const checks=reports.flatMap(r=>r.rows.filter(x=>x.country===country.countryCode&&x.mission===mission));
 const issues=[];
 if(checks.length!==4)issues.push('missing mouse/touch or viewport case');
 for(const c of checks)if(c.interaction!=='PASS'||c.firstCompletionLabel!=='PASS'||c.layout!=='PASS'||!c.progressSaved||!c.replayDoesNotDuplicate||c.browserErrors.length||![6,7,9].includes(mission)&&c.images!=='NONE'||[6,7,9].includes(mission)&&c.images!=='LOADED')issues.push('failed browser case: '+c.viewport);
 if(!country.qa.releaseReady)issues.push('content acceptance pending');
 rows.push({country:country.countryCode,mission,checks:checks.length,result:issues.length?'FAIL':'PASS',issues});
}
const result={generatedAt:new Date().toISOString(),scope:'A 110 mission content/source and local browser acceptance. Two viewport sizes, mouse/keyboard plus touch emulation. No claim of physical iPad Safari, production deployment or Creator publication.',countries:countries.length,missions:rows.length,checks:rows.reduce((n,r)=>n+r.checks,0),errors:rows.filter(r=>r.result!=='PASS').length,rows};
fs.writeFileSync('docs/qa/geography-A-acceptance.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({missions:result.missions,checks:result.checks,errors:result.errors}));
assert.equal(result.missions,110);assert.equal(result.errors,0);
