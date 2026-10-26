import test from 'node:test';
import assert from 'node:assert/strict';
import { BULK_LIMIT, eligibleForBulk, createBulkPlan, executeBulkPlan } from '../src/mission-creator/bulkActions.js';

const draft = (id) => ({id, status:'draft', countryIso:'rw', domain:'lifeCulture', type:'text4', prompt:'問題 '+id});
const approved = (id) => ({...draft(id), status:'approved'});
const published = (id) => ({...draft(id), status:'published'});

test('admin can plan draft-only approvals; non-admin and unsupported states are rejected', () => {
  assert.equal(eligibleForBulk(draft('a'),'approve'),true);
  assert.equal(eligibleForBulk(approved('a'),'approve'),false);
  assert.deepEqual(createBulkPlan('approve',['a'],[draft('a')],'admin').items.map(x=>x.id),['a']);
  assert.throws(()=>createBulkPlan('approve',['a'],[draft('a')],'teacher'),/管理者/);
  assert.throws(()=>createBulkPlan('approve',['a'],[approved('a')],'admin'),/状態/);
  assert.throws(()=>createBulkPlan('approve',['a','a'],[draft('a')],'admin'),/重複/);
});

test('published scope is inferred from each question, without a ten-question publication ceiling', () => {
  assert.equal(eligibleForBulk(approved('a'),'publish'),true);
  assert.equal(eligibleForBulk({...approved('a'),countryIso:'jp',domain:'language'},'publish'),true);
  assert.equal(eligibleForBulk({...approved('a'),type:'free'},'publish'),false);
  assert.throws(()=>createBulkPlan('publish',['a'],[draft('a')],'admin'),/状態/);
  assert.equal(createBulkPlan('publish',['a'],[approved('a'),...Array.from({length:10},(_,i)=>published('p'+i))],'admin').items.length,1);
  const jp={...approved('j'),countryIso:'jp',domain:'language'};
  const questions=[approved('a'),jp,...Array.from({length:9},(_,i)=>published('p'+i))];
  assert.deepEqual(createBulkPlan('publish',['a','j'],questions,'admin').items.map(x=>x.id),['a','j']);
  assert.equal(createBulkPlan('publish',['a'],[...questions,published('t')],'admin').items.length,1);
});

test('selection is bounded to protect sequential API usage',()=>{
  const qs=Array.from({length:BULK_LIMIT+1},(_,i)=>draft(String(i)));
  assert.throws(()=>createBulkPlan('approve',qs.map(q=>q.id),qs,'admin'),/選択/);
});

test('approval only calls the review endpoint and records per-item failures', async()=>{
  const calls=[];const progresses=[];
  const plan=createBulkPlan('approve',['a','b'],[draft('a'),draft('b')],'admin');
  const result=await executeBulkPlan(plan,async(action,payload)=>{
    calls.push({action,payload});
    if(payload.questionId==='b')throw Error('画像が不足しています');
  },p=>progresses.push(p));
  assert.deepEqual(calls.map(x=>x.action),['reviewQuestion','reviewQuestion']);
  assert.deepEqual(calls.map(x=>x.payload.status),['approved','approved']);
  assert.deepEqual(result.done.map(x=>x.id),['a']);
  assert.match(result.failed[0].reason,/画像/);
  assert.deepEqual(progresses.map(x=>x.stage),['running','finished','running','finished']);
});

test('publication only calls existing publication endpoint with rights confirmation',async()=>{
  const calls=[];
  const plan=createBulkPlan('publish',['a'],[approved('a')],'admin');
  const result=await executeBulkPlan(plan,async(action,payload)=>calls.push({action,payload}));
  assert.equal(result.done.length,1);
  assert.deepEqual(calls,[{action:'setPublication',payload:{questionId:'a',mode:'publish',rightsConfirmed:true,countryIso:'rw',domain:'lifeCulture'}}]);
});

test('unknown or empty plans do not call backend',async()=>{
  let called=false;
  await assert.rejects(executeBulkPlan({mode:'approve',items:[]},async()=>{called=true;}),/不正/);
  assert.equal(called,false);
});

test('a failed first operation does not block later items or silently retry', async()=>{
  const calls=[];
  const plan=createBulkPlan('approve',['a','b'],[draft('a'),draft('b')],'admin');
  const result=await executeBulkPlan(plan,async(_action,payload)=>{
    calls.push(payload.questionId);
    if(payload.questionId==='a')throw Error('通信タイムアウト');
  });
  assert.deepEqual(calls,['a','b']);
  assert.deepEqual(result.failed.map(x=>x.id),['a']);
  assert.deepEqual(result.done.map(x=>x.id),['b']);
});
