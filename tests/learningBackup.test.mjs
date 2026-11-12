import test from 'node:test';
import assert from 'node:assert/strict';
import {parseProgressBackup,restoreProgressBackup,progressBackup} from '../src/utils/learningBackup.js';
import {learningStorage,setLearningScope,clearLearningData} from '../src/utils/classroomSession.js';
import {getCountryProgress} from '../src/utils/worldProgressStorage.js';
import {getWorldAdventureDomainProgress} from '../src/utils/worldAdventureProgress.js';
import {getPlaceProgress} from '../src/utils/placeProgressStorage.js';

global.window={};
const backup={format:'timepalette-progress-backup/v1',countries:[{iso:'jp',missions:[
  {id:'jp-time-01',domain:'time'},{id:'jp-place-01',domain:'place'},
  {id:'jp-language-shared-01',domain:'language'}]}]};
test('restore merges actual progress stores and does not award extra points',()=>{
  setLearningScope('shared');clearLearningData();
  assert.equal(restoreProgressBackup(backup),3);
  assert.equal(restoreProgressBackup(backup),0);
  assert.equal(getCountryProgress('jp').completedMissionIds.length,3);
  assert.deepEqual(getPlaceProgress('jp').completedMissionIds,['jp-place-01']);
  assert.equal(getWorldAdventureDomainProgress('jp','time').completedMissionIds.length,1);
  assert.equal(getWorldAdventureDomainProgress('jp','time').firstClearPoints,0);
  restoreProgressBackup({format:backup.format,countries:[{iso:'be',missions:[{id:'be-time-01',domain:'time'}]}]});
  assert.equal(getCountryProgress('jp').completedMissionIds.length,3);
  assert.equal(getCountryProgress('be').completedMissionIds.length,1);
});
test('backup excludes profiles and arbitrary imported properties',()=>{
  const parsed=parseProgressBackup(JSON.stringify({...backup,session:'secret',name:'private'}));
  assert.ok(!JSON.stringify(parsed).includes('secret'));
  const result=progressBackup({countries:[{iso:'jp',profile:'private',completedRecords:[{id:'jp-time-01',domain:'time',answer:'secret'}]}]});
  assert.ok(!JSON.stringify(result).includes('private'));assert.ok(!JSON.stringify(result).includes('secret'));
});
test('malformed, oversized, cross-country and prototype keys are rejected before writes',()=>{
  setLearningScope('shared');const before=learningStorage().getItem('timepalette_world_learning_v1');
  for(const text of ['{',' '.repeat(1_000_001),JSON.stringify({...backup,format:'other'}),
    JSON.stringify({format:backup.format,countries:[{iso:'__proto__',missions:[]}]}),
    JSON.stringify({format:backup.format,countries:[{iso:'jp',missions:[{id:'be-time-01',domain:'time'}]}]})])
    assert.throws(()=>restoreProgressBackup(parseProgressBackup(text)));
  assert.equal(learningStorage().getItem('timepalette_world_learning_v1'),before);
  assert.equal({}.polluted,undefined);
});
test('partial storage failure restores already written keys',()=>{
  const data=new Map([['timepalette_world_learning_v1','{"version":1,"countries":{}}']]);let failed=false;
  window.localStorage={getItem:k=>data.get(k)??null,removeItem:k=>data.delete(k),setItem:(k,v)=>{
    if(k==='timepalette_world_adventure_v1'&&!failed){failed=true;throw new Error('quota');}data.set(k,v);
  }};
  setLearningScope('personal');const before=[...data];
  assert.throws(()=>restoreProgressBackup(backup),/保存できません/);
  assert.deepEqual([...data],before);
});
test('retained memory storage adapters do not change scope after mode switches',()=>{
  setLearningScope('demo');const demo=learningStorage();
  setLearningScope('shared');demo.setItem('scope-check','demo-only');
  assert.equal(learningStorage().getItem('scope-check'),null);
  setLearningScope('demo');assert.equal(learningStorage().getItem('scope-check'),'demo-only');
});
