import test from 'node:test';
import assert from 'node:assert/strict';
import {crossesSea,journeyEdges,cityVideos,extraLandmarks,VEHICLES} from '../src/utils/journeyMapFeatures.js';
import {buildJourneyStops} from '../src/utils/worldJourneyStops.js';
import {getGeography197CountryCodes} from '../src/utils/geography197.js';
test('ocean crossings distinguish land travel including Japanese islands',()=>{
 const point=(lon,lat)=>({coordinates:[lon,lat]});
 assert.equal(crossesSea(point(130.4,33.59),point(129.08,35.18)),true);
 assert.equal(crossesSea(point(139.69,35.68),point(136.90,35.18)),false);
 assert.equal(crossesSea(point(141.35,43.06),point(140.74,40.82)),true);
});
test('all stops connect, including the closing sea route; video IDs and landmarks are usable',()=>{
 const stops=buildJourneyStops(getGeography197CountryCodes()),edges=journeyEdges(stops);
 assert.equal(edges.length,stops.length);
 assert.equal(edges.at(-1).b,stops[0]);
 assert.ok(edges.some(e=>e.sea)&&edges.some(e=>!e.sea));
 for(const [name,[id]] of Object.entries(cityVideos)){assert.match(id,/^[A-Za-z0-9_-]{11}$/);assert.ok(stops.some(s=>s.label===name));}
 assert.equal(new Set(extraLandmarks.map(x=>x[1])).size,extraLandmarks.length);
 assert.equal(VEHICLES.length,5);
});
