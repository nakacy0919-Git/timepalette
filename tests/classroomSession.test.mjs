import test from 'node:test';
import assert from 'node:assert/strict';
import {readLesson,lessonUrl,setLearningScope,learningStorage,clearLearningData,completionReport} from '../src/utils/classroomSession.js';
import {safeSourceUrl} from '../src/utils/safeSourceUrl.js';
import {completeWorldMission,getCountryProgress} from '../src/utils/worldProgressStorage.js';
import {completeWorldAdventureMission,getWorldAdventureDomainProgress} from '../src/utils/worldAdventureProgress.js';
const data=new Map();
global.window={localStorage:{get length(){return data.size;},key:i=>[...data.keys()][i],getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)}};
test('lesson URLs share only validated curriculum settings',()=>{
 assert.equal(readLesson('?country=jp'),null);
 assert.deepEqual(readLesson('?lesson=1&country=<script>&level=admin&domain=evil'),{country:'jp',level:'elementary',domain:'time'});
 const url=lessonUrl('https://example.com/?name=private#secret',{country:'be',domain:'place',level:'juniorHigh',name:'secret'});
 assert.equal(url,'https://example.com/?lesson=1&country=be&level=juniorHigh&domain=place');
});
test('demo and shared learning are separated from personal records and each other',()=>{
 setLearningScope('personal');completeWorldMission('jp','jp-time-01');
 setLearningScope('demo');assert.equal(getCountryProgress('jp').completedMissionIds.length,0);
 completeWorldMission('jp','jp-time-02');
 setLearningScope('shared');assert.equal(getCountryProgress('jp').completedMissionIds.length,0);
 completeWorldAdventureMission({countryCode:'jp',domainId:'time',missionId:'jp-time-03',points:10});
 assert.equal(getWorldAdventureDomainProgress('jp','time').completedMissionIds.length,1);
 clearLearningData();assert.equal(getWorldAdventureDomainProgress('jp','time').completedMissionIds.length,0);
 setLearningScope('personal');assert.deepEqual(getCountryProgress('jp').completedMissionIds,['jp-time-01']);
});
test('reset deletes learning inputs and progress but preserves creator login and settings',()=>{
 setLearningScope('personal');learningStorage().setItem('timepalette_language_global_profile','private');
 learningStorage().setItem('mission_creator_session','untouched');learningStorage().setItem('timepalette_ui_sound_v1','off');
 clearLearningData();assert.equal(learningStorage().getItem('timepalette_language_global_profile'),null);
 assert.equal(learningStorage().getItem('mission_creator_session'),'untouched');assert.equal(learningStorage().getItem('timepalette_ui_sound_v1'),'off');
});
test('summary explicitly selects completion counts rather than profile or raw responses',()=>{
 const report=completionReport({completedMissions:1,name:'private',countries:[{iso:'jp',nameJa:'日本',completedCount:1,profile:'secret',domains:[{label:'時間',completed:1,answer:'secret'}]}]});
 assert.ok(!JSON.stringify(report).includes('private'));assert.ok(!JSON.stringify(report).includes('secret'));
});
test('source viewer rejects active schemes, credentials and local network addresses',()=>{
 for(const url of ['javascript:alert(1)','data:text/html,hi','http://example.org','https://user:password@example.org','https://127.0.0.1','https://2130706433','https://[::1]','https://10.0.0.1','https://school.local','https://school.internal','https://localhost','https://example.org:444'])assert.equal(safeSourceUrl(url),null,url);
 assert.equal(safeSourceUrl('https://www.unesco.org/en'),'https://www.unesco.org/en');
});
