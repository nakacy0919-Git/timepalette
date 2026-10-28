import fs from 'node:fs';
import {normalizePublishedCatalog} from '../src/utils/publishedMissionCatalog.js';
const base=process.env.QA_PUBLIC_BASE_URL;
if(base!=='https://timepalette.pic-speak-story.com')throw Error('Specify the verified public production origin');
const countries=[...new Set(fs.readdirSync('src/data').filter(f=>/^countries_[a-z]\.json$/.test(f)).flatMap(f=>Object.keys(JSON.parse(fs.readFileSync('src/data/'+f)))))].sort();
const prior=process.argv.includes('--retry-errors')?JSON.parse(fs.readFileSync('docs/qa/creator-public-production.json')):null;
const scopes=prior?prior.rows.filter(r=>r.issues.length).map(({country,domain})=>({country,domain})):countries.flatMap(country=>['place','time','language','lifeCulture','japanConnection','thinkConnect'].map(domain=>({country,domain})));
const rows=prior?prior.rows.filter(r=>!r.issues.length):[];
let cursor=0;
async function worker(){while(cursor<scopes.length){const scope=scopes[cursor++];try{
 const u=new URL('/api/mission-public',base);u.search=new URLSearchParams({action:'catalog',country:scope.country,domain:scope.domain});
 const response=await fetch(u,{signal:AbortSignal.timeout(25000)});const payload=await response.json();
 if(!response.ok||!payload.ok||!Array.isArray(payload.questions))throw Error('Invalid catalog response: '+response.status);
 const q=payload.questions,issues=[];if(q.some(q=>q.countryIso!==scope.country||q.domain!==scope.domain))issues.push('scope mismatch');
 const normalized=normalizePublishedCatalog(q);if(normalized.length!==q.length)issues.push('unplayable published record');
 if(new Set(q.map(q=>q.id)).size!==q.length)issues.push('duplicate IDs');
 rows.push({...scope,published:q.length,playable:normalized.length,questionIds:q.map(q=>q.id),issues});
 }catch(e){rows.push({...scope,issues:[e.message]});}
 if(rows.length%100===0)console.log('Public scopes checked:',rows.length,'/',scopes.length);
}}
await Promise.all(Array.from({length:6},worker));rows.sort((a,b)=>a.country.localeCompare(b.country)||a.domain.localeCompare(b.domain));
const report={checkedAt:new Date().toISOString(),origin:base,scope:'Read-only published catalogs; not access to private drafts or a publication action',recheckedFailedScopes:prior?scopes.length:0,countries:countries.length,scopes:rows.length,published:rows.reduce((n,r)=>n+(r.published||0),0),playable:rows.reduce((n,r)=>n+(r.playable||0),0),errors:rows.filter(r=>r.issues.length).length,rows};
fs.writeFileSync('docs/qa/creator-public-production.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({countries:report.countries,scopes:report.scopes,published:report.published,playable:report.playable,errors:report.errors,domains:Object.fromEntries(['place','time','language','lifeCulture','japanConnection','thinkConnect'].map(d=>[d,rows.filter(r=>r.domain===d).reduce((n,r)=>n+(r.published||0),0)]))}));
if(report.errors)process.exitCode=1;
