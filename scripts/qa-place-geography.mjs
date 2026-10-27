import fs from 'node:fs';
import {feature} from 'topojson-client';
import {geoMercator,geoPath} from 'd3-geo';
import atlas from 'world-atlas/countries-50m.json' with {type:'json'};
import {geographyCountries,getGeographyPackage,sameCountry,evaluateGeography,geographyCandidates} from '../src/utils/geographyRegistry.js';
import capitalReviews from '../src/data/geography/capital-review.json' with {type:'json'};
import {auditCapitalReview,auditGeographicCorrections,auditContentReview} from '../src/utils/geographyReview.js';
import corrections from '../src/data/geography/geographic-corrections.json' with {type:'json'};
import {auditLandNeighbors} from '../src/utils/geographyTopology.js';
import contentReviews from '../src/data/geography/content-review.json' with {type:'json'};
const group=process.argv.find(a=>a.startsWith('--group='))?.split('=')[1];
const features=feature(atlas,atlas.objects.countries).features;
const rows=[];
for(const country of geographyCountries.filter(c=>!group||c.group===group)){
  const p=getGeographyPackage(country.countryCode),issues=[];
  const capitalName=auditCapitalReview(p,capitalReviews[p.countryCode]);
  issues.push(...capitalName.issues);
  const contentReview=auditContentReview(p,contentReviews[p.countryCode]);
  issues.push(...contentReview.issues);
  if(p.qa.releaseReady&&(capitalName.status!=='verified'||contentReview.status!=='verified'||!p.photo.contentVerified))issues.push('release readiness lacks independent field evidence');
  const landBorders=auditLandNeighbors(p);
  issues.push(...landBorders.issues);
  const correctedGeography=auditGeographicCorrections(p,corrections[p.countryCode]);
  issues.push(...correctedGeography.issues);
  if(p.missions.length!==10||new Set(p.missions.map(m=>m.id)).size!==10)issues.push('mission count/IDs');
  const shape=features.find(f=>sameCountry(f,p));
  if(!shape)issues.push('missing country shape');
  for(const n of p.neighbors)if(!features.some(f=>sameCountry(f,n)))issues.push('missing neighbor: '+n.name);
  if(p.cities.length<2||!p.cities.some(c=>c.id===p.capitalId))issues.push('missing city/capital');
  if(shape){const projection=geoMercator().fitExtent([[40,30],[680,320]],shape);const path=geoPath(projection)(shape);if(!path||/NaN|Infinity/.test(path))issues.push('invalid projected outline');}
  for(const c of p.cities)if(!c.coordinates.every(Number.isFinite)||Math.abs(c.coordinates[0])>180||Math.abs(c.coordinates[1])>90)issues.push('invalid coordinates '+c.name);
  if(new Set(geographyCandidates(p).map(c=>c.countryCode)).size!==4)issues.push('duplicate shape options');
  const good=[p.countryCode,Object.fromEntries(p.neighbors.map(n=>[n.iso,n.iso])),p.countryCode,p.capitalId,Object.fromEntries(p.cities.map(c=>[c.id,c.id])),p.countryCode,['visible','limited'],{via:p.route.via,port:p.route.port},'limited',{map:p.countryCode,capital:p.capitalId,fact:'fact'}];
  good.forEach((answer,i)=>{if(!evaluateGeography(p,i,answer))issues.push('correct action rejected P'+(i+1));if(evaluateGeography(p,i,'incorrect'))issues.push('incorrect action accepted P'+(i+1));});
  rows.push({country:p.countryCode,missions:10,structural:issues.length?'FAIL':'PASS',issues,capitalName,landBorders,correctedGeography,contentReview,content:p.qa});
}
const report={generatedAt:new Date().toISOString(),scope:'Structural, scoring, border and field-specific source evidence audit; browser evidence is separate',warnings:0,countries:rows.length,missions:rows.length*10,errors:rows.flatMap(r=>r.issues).length,capitalNamesVerified:rows.filter(r=>r.capitalName.status==='verified').length,contentPending:rows.filter(r=>!r.content.releaseReady).length,rows};
fs.mkdirSync('docs/qa',{recursive:true});fs.writeFileSync(`docs/qa/geography-structure${group?'-'+group:''}.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({countries:report.countries,missions:report.missions,errors:report.errors,capitalNamesVerified:report.capitalNamesVerified,contentPending:report.contentPending}));
if(report.errors)process.exitCode=1;
if(process.argv.includes('--release')&&report.contentPending){console.error('RELEASE BLOCKED: content review pending');process.exitCode=1;}
