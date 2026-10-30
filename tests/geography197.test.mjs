import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {geoArea,geoPath,geoContains} from 'd3-geo';
import {getGeography197CountryCodes,getGeography197Package,getGeography197Candidates,getPublishedPlaceMissions,evaluateGeography197,describePublishedPlaceMission,compass197} from '../src/utils/geography197.js';
import {countryFeatures197,geographyProjection197} from '../src/utils/geography197Map.js';
import {getCreatorCompletionCount,getPlaceReleaseSummary} from '../src/utils/creatorProductionProgress.js';
const codes=getGeography197CountryCodes();
test('197 canonical countries expose ten Rwanda activity types each, with unique stable IDs and Creator descriptions',()=>{
 const canonical=Object.assign({},...readdirSync('src/data').filter(n=>/^countries_[a-z]\.json$/.test(n)).map(n=>JSON.parse(readFileSync('src/data/'+n))));
 assert.deepEqual([...codes].sort(),Object.keys(canonical).sort());const ids=new Set();
 for(const code of codes){
  const p=getGeography197Package(code),published=getPublishedPlaceMissions(code);assert.equal(published.length,10,code);
  for(const [i,m]of published.entries()){
   assert.equal(m.id,`${code}-place-${String(i+1).padStart(2,'0')}`);assert.ok(!ids.has(m.id));ids.add(m.id);
   const description=describePublishedPlaceMission(code,m);assert.ok(description.prompt.length>12,m.id);assert.ok(description.answer.length>0,m.id);assert.ok(description.explanation.length>10,m.id);
  }
  assert.equal(new Set(p.cities.map(c=>c.id)).size,4,code);
  assert.equal(getGeography197Candidates(code).length,4,code);assert.equal(new Set(getGeography197Candidates(code).map(c=>c.countryCode)).size,4,code);
  assert.equal(getCreatorCompletionCount({builtIn:published.length,manual:7,approved:9}),10);
 }
 assert.equal(ids.size,1970);assert.deepEqual(getPlaceReleaseSummary(codes.map(iso=>({iso}))),{countries:197,missions:1970});
});
test('all 1970 live scoring gates accept complete correct identities and reject wrong/incomplete answers',()=>{
 for(const code of codes){
  const p=getGeography197Package(code);
  const correct=[code,p.neighbors.length?Object.fromEntries(p.neighbors.map(n=>[n.iso,n.iso])):{country:p.nearest.countryIso,direction:p.nearest.direction},code,p.capitalId,p.cities.map(c=>c.id),code,['caption','limited'],{countryPath:p.route.countryPath,port:p.route.port},'limited',{country:code,capital:p.capitalId,facts:['capital','coast','neighbor']}];
  correct.forEach((answer,i)=>{assert.equal(evaluateGeography197(code,i,answer),true,`${code} P${i+1}`);for(const wrong of [null,{},'wrong',[]])assert.equal(Boolean(evaluateGeography197(code,i,wrong)),false,`${code} P${i+1} rejects incomplete action`);});
  assert.equal(evaluateGeography197(code,3,p.cities.find(c=>c.id!==p.capitalId).id),false);
  assert.equal(evaluateGeography197(code,9,{country:code,capital:p.capitalId,facts:['capital','coast']}),false);
  assert.equal(evaluateGeography197(code,6,['caption','caption']),false);
 }
});
test('every country including microstates has a real outline, and all four location markers project to finite coordinates',()=>{
 for(const code of codes){const p=getGeography197Package(code),shapes=countryFeatures197(code);assert.equal(shapes.length,1,code);
  const area=geoArea(shapes[0]);assert.ok(area>0&&area<2*Math.PI,`${code} ring winding/area: ${area}`);
  const projection=geographyProjection197({codes:[code],places:p.cities,countryCenter:p.center});
  const path=geoPath(projection)(shapes[0]);assert.ok(path&&!/NaN|Infinity/.test(path),code);
  for(const c of p.cities){assert.ok(c.source.startsWith('https://'),code);const xy=projection(c.coordinates);assert.ok(xy.every(Number.isFinite),`${code} ${c.name}`);assert.ok(xy[0]>=10&&xy[0]<=710&&xy[1]>=10&&xy[1]<=450,`${code} ${c.name} in map viewport: ${xy}`);}
 }
});
test('small countries keep actual polygon identity rather than borrowing another country shape',()=>{
 for(const code of ['va','mc','nr','sg','mt','tv','mh','ki']){const p=getGeography197Package(code);const geometry=countryFeatures197(code)[0];assert.equal(geometry.id,code);assert.ok(geoArea(geometry)>0);assert.ok(p.cities.some(c=>c.id===p.capitalId));}
});
test('capital roles and recent changes use the correct named place and source coordinates',()=>{
 for(const [code,name,id]of [['au','Canberra','2172517'],['bi','Gitega','426272'],['bj','Porto-Novo','2392087'],['gq','Ciudad de la Paz','12226438'],['pw','Ngerulmud','8063361'],['lk','Sri Jayewardenepura Kotte','1238992'],['bo','Sucre','3903987'],['np','Kathmandu','1283240']]){
  const p=getGeography197Package(code),capital=p.cities.find(c=>c.id===p.capitalId);assert.equal(capital.name,name,code);assert.ok(capital.source.includes('/'+id+'/'),code);
 }
 assert.equal(getGeography197Package('gq').capitalId,'gq-gn-12226438');
 assert.match(getGeography197Package('nr').capitalNote,/正式な首都は定められていない/);
 assert.match(getGeography197Package('za').capitalNote,/ケープタウン/);
 assert.match(getGeography197Package('ps').capitalRoleJa,/主張/);
 assert.equal(getGeography197Package('eh').capitalRoleJa,'主要都市');
});
test('land-border lists include exclaves, overseas borders and the documented Denmark–Canada border',()=>{
 const has=(a,b)=>getGeography197Package(a).neighbors.some(n=>n.iso===b);
 for(const [a,b]of [['af','cn'],['az','tr'],['ao','cg'],['bw','zm'],['ca','dk'],['dk','ca'],['fr','br'],['fr','sr'],['fr','nl']])assert.ok(has(a,b),`${a}–${b}`);
 for(const c of ['ag','au','bb','jp','nr','nz','sg'])assert.equal(getGeography197Package(c).neighborKind,'sea-region',c);
 for(const c of codes)for(const n of getGeography197Package(c).neighbors)if(codes.includes(n.iso))assert.ok(has(n.iso,c),`${c}–${n.iso} is reciprocal`);
});
test('island directions are measured between the recorded nearest shore points, not between capitals',()=>{
 for(const code of codes){const p=getGeography197Package(code);if(p.neighbors.length)continue;
  assert.equal(p.nearest.direction,compass197(p.nearest.from,p.nearest.to),code);assert.ok(p.nearest.distanceKm>0&&Number.isFinite(p.nearest.distanceKm));assert.equal(new Set(p.nearest.candidates.map(c=>c.iso)).size,4);assert.ok(p.nearest.candidates.every(c=>c.iso!==code));
 }
 assert.equal(getGeography197Package('nr').nearest.countryIso,'ki');assert.equal(getGeography197Package('nr').nearest.direction,'東');
 assert.equal(getGeography197Package('au').nearest.countryIso,'pg');
 assert.equal(getGeography197Package('mu').nearest.countryIso,'fr');
 assert.equal(getGeography197Package('fr').continent,'Europe');
 assert.equal(getGeography197Package('nz').nearest.countryIso,'us');
 assert.equal(compass197([179,0],[-179,0]),'東');
});
test('every route names a sourced port and each land transition crosses a real declared border',()=>{
 for(const code of codes){const p=getGeography197Package(code),r=p.route;assert.equal(r.countryPath[0],code);assert.ok(r.portSourceId);assert.ok(r.portSourceUrl.startsWith('https://'));assert.ok(r.portCoordinates.every(Number.isFinite));
  for(let i=0;i<r.countryPath.length-1;i++)assert.ok(getGeography197Package(r.countryPath[i]).neighbors.some(n=>n.iso===r.countryPath[i+1]),`${code} ${r.countryPath.join(' → ')}`);
  assert.equal(getGeography197Package(r.countryPath.at(-1)).landlocked,false);
 }
});
test('all 394 country photographs are local, non-empty, licensed and match their pinned SHA-256',()=>{
 const seen=new Set();for(const code of codes){const p=getGeography197Package(code);assert.equal(p.photos.length,2,code);assert.equal(new Set(p.photos.map(p=>p.sourceUrl)).size,2,code);
  for(const photo of p.photos){assert.match(photo.deliveryUrl,/^\/geography\/photos/);const file='public'+photo.deliveryUrl;assert.ok(existsSync(file),file);const bytes=readFileSync(file);assert.ok(bytes.length>2000,file);assert.equal(createHash('sha256').update(bytes).digest('hex'),photo.sha256,file);assert.ok(/CC BY|CC0|Public domain/i.test(photo.license),file);assert.ok(photo.credit&&photo.sourceUrl&&photo.captionJa);seen.add(file);}
 }assert.equal(seen.size,394);
});

test('Vatican detail boundary contains all four sourced places, including its northern museums',()=>{
 const p=getGeography197Package('va'),boundary=countryFeatures197('va')[0];
 for(const c of p.cities)assert.ok(geoContains(boundary,c.coordinates),c.name);
 assert.ok(p.sources.some(s=>s.name.includes('geoBoundaries')));
});
