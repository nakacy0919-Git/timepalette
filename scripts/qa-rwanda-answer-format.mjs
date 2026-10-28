import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {geographyCountries,getGeographyPackage} from '../src/utils/geographyRegistry.js';
import {getRwandaFormat} from '../src/utils/geographyRwandaFormat.js';
const rows=[];
for(const country of geographyCountries.filter(p=>p.group==='A')) {
 const p=getGeographyPackage(country.countryCode),f=getRwandaFormat(p),issues=[];
 if(!f.regionChoices.some(r=>r[0]===f.region))issues.push('missing regional answer');
 if(f.cityLabels.length!==p.cities.length)issues.push('city labels');
 if(f.lifeChoices.filter(c=>c.correct).length!==2||f.lifeChoices.length!==4)issues.push('life 2/4 choices');
 if(f.facts.filter(c=>c.correct).length!==3||f.facts.length!==5)issues.push('final 3/5 choices');
 const photo=f.culturePhoto;
 if(!photo?.sourceUrl||!photo?.license||!photo?.credit)issues.push('photo attribution missing');
 const path='public'+photo?.deliveryUrl;
 if(!fs.existsSync(path)||createHash('sha256').update(fs.readFileSync(path)).digest('hex')!==photo.sha256)issues.push('photo asset missing/changed');
 rows.push({country:p.countryCode,missions:10,status:issues.length?'FAIL':'PASS',issues,region:f.regionName,photoSource:photo?.sourceUrl,photoSha256:photo?.sha256});
}
const report={generatedAt:new Date().toISOString(),scope:'Rwanda answer-format data and new culture-photo asset integrity; browser proof separate',errors:rows.flatMap(r=>r.issues).length,rows};
fs.writeFileSync('docs/qa/rwanda-answer-format-data.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({countries:rows.length,errors:report.errors}));
if(report.errors)process.exitCode=1;
