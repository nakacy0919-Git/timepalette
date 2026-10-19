import test from 'node:test';
import assert from 'node:assert/strict';
import {PUBLIC_DOMAINS,reconcilePublishedOrder,movePublishedOrder,identicalOrder} from '../src/mission-creator/publicationOrder.js';
const p=id=>({id,status:'published'}),a=id=>({id,status:'approved'});
test('publication categories remain the same six',()=>{
 assert.deepEqual(PUBLIC_DOMAINS.map(([k])=>k),['place','time','language','lifeCulture','japanConnection','thinkConnect']);
});
test('order merges newly published questions at end',()=>{
 assert.deepEqual(reconcilePublishedOrder(['2','1'],[p('1'),p('2'),p('3')]),['2','1','3']);
});
test('unpublished and duplicate entries are excluded safely',()=>{
 assert.deepEqual(reconcilePublishedOrder(['2','2','retired','1'],[p('1'),p('2'),a('retired')]),['2','1']);
});
test('moving first/last stops at boundary without mutating',()=>{
 const ids=['a','b','c'];assert.deepEqual(movePublishedOrder(ids,'a',-1),ids);
 assert.deepEqual(movePublishedOrder(ids,'b',1),['a','c','b']);
 assert.deepEqual(movePublishedOrder(ids,'unknown',1),ids);
 assert.deepEqual(ids,['a','b','c']);
});
test('a changed order is detected',()=>{
 assert.equal(identicalOrder(['1','2'],['1','2']),true);
 assert.equal(identicalOrder(['2','1'],['1','2']),false);
});
