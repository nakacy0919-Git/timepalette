import test from 'node:test';import assert from 'node:assert/strict';
import {geographyCountries,getGeographyPackage} from '../src/utils/geographyRegistry.js';
import {auditLandNeighbors,sharedBorderPoint,neighborDirection,compassDirection} from '../src/utils/geographyTopology.js';
test('all declared land neighbors match atlas topology or documented short-border evidence',()=>{
  for(const p of geographyCountries)assert.deepEqual(auditLandNeighbors(p).issues,[],p.countryCode);
});
test('missing and invented Afghanistan neighbors are detected',()=>{
  const p=structuredClone(getGeographyPackage('af'));
  p.neighbors=p.neighbors.filter(n=>n.iso!=='cn');
  assert.ok(auditLandNeighbors(p).issues.some(e=>e.includes('China')));
  p.neighbors.push({...getGeographyPackage('au'),name:'Australia'});
  assert.ok(auditLandNeighbors(p).issues.some(e=>e.includes('Australia')));
});
test('Afghanistan-China direction follows the Wakhan border, not eastern China',()=>{
  const p=getGeographyPackage('af'),n=p.neighbors.find(n=>n.iso==='cn'),point=sharedBorderPoint(p,n);
  assert.ok(point[0]>73&&point[0]<76&&point[1]>36&&point[1]<39);
  assert.equal(neighborDirection(p,n),'北東');
});
test('Kazungula exception retains Zambia and never fabricates an atlas boundary',()=>{
  const p=structuredClone(getGeographyPackage('bw')),n=p.neighbors.find(n=>n.iso==='zm');
  assert.equal(sharedBorderPoint(p,n),null);
  assert.equal(neighborDirection(p,n),null);
  assert.equal(auditLandNeighbors(p).exceptions.length,1);
  p.neighbors=p.neighbors.filter(n=>n.iso!=='zm');
  assert.ok(auditLandNeighbors(p).issues.some(e=>e.includes('short-border')));
});
test('compass handles the date line and coincident points',()=>{
  assert.equal(compassDirection([179,0],[-179,0]),'東');
  assert.equal(compassDirection([1,1],[1,1]),null);
});
