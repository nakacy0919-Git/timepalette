import test from 'node:test';import assert from 'node:assert/strict';
import {getPlaceProgress,completePlaceMission} from '../src/utils/placeProgressStorage.js';
import {getGeographyPackage,evaluateGeography} from '../src/utils/geographyRegistry.js';
test('country progress survives reads, isolates countries and never duplicates a replay',()=>{
 const values=new Map();globalThis.window={localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)}};
 try{assert.equal(completePlaceMission('au','au-place-10').isNewCompletion,true);assert.equal(completePlaceMission('au','au-place-10').isNewCompletion,false);assert.deepEqual(getPlaceProgress('au').completedMissionIds,['au-place-10']);assert.deepEqual(getPlaceProgress('at').completedMissionIds,[]);}finally{delete globalThis.window;}
});
test('Australia final capital gate uses Canberra ID and requires all three keys',()=>{
 const p=getGeographyPackage('au');const other=p.cities.find(c=>c.id!==p.capitalId).id;
 assert.equal(p.cities.find(c=>c.id===p.capitalId).name,'Canberra');
 assert.equal(evaluateGeography(p,9,{map:'au',capital:other,fact:'fact'}),false);
 assert.equal(evaluateGeography(p,9,{map:'au',capital:p.capitalId}),false);
 assert.equal(evaluateGeography(p,9,{map:'au',capital:p.capitalId,fact:'fact'}),true);
});
test('Burundi capital identity is Gitega, not a renamed Bujumbura point',()=>{
 const p=getGeographyPackage('bi'),c=p.cities.find(c=>c.id===p.capitalId);assert.equal(c.name,'Gitega');assert.deepEqual(c.coordinates,[29.93218,-3.42733]);
});
