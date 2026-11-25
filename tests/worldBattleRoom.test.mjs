import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattleRoom,applyBattleAction,battleRoomView} from '../src/utils/worldBattleRoom.js';
const q=id=>({id,country:'jp',domain:'place',prompt:'Prompt '+id,choices:['A','B','C','D'],correctIndex:0,explanation:'A'});
function setup(){
 let r=createBattleRoom({hostId:'host',questions:[q('a'),q('b')],limit:2,teamNames:['Red','Blue'],seconds:15,random:()=>0.5});
 const host=(type,more={})=>{r=applyBattleAction(r,'host',{type,revision:r.revision,...more},1000);};
 host('assign',{teamId:0,actorId:'red'});host('assign',{teamId:1,actorId:'blue'});host('start');return r;
}
test('room view hides answer keys and identities before reveal',()=>{
 const r=setup(),view=battleRoomView(r,'red');
 assert.equal(view.phase,'question');assert.equal(view.question.correctIndex,undefined);assert.equal(view.question.explanation,undefined);
 assert.equal(view.deck,undefined);assert.equal(view.teams[0].actorId,undefined);assert.equal(battleRoomView(r,'stranger'),null);
});
test('concurrent answers both count, repeated or unauthorized actions do not',()=>{
 let r=setup(),questionId=r.deck[r.round].id;
 const answer={type:'answer',round:1,questionId,index:r.deck[r.round].correctIndex,revision:r.revision};
 r=applyBattleAction(r,'red',answer,2000);
 const after=r;
 assert.equal(applyBattleAction(r,'red',answer,2001),after);
 assert.equal(applyBattleAction(r,'stranger',answer,2001),after);
 r=applyBattleAction(r,'blue',answer,2002);
 assert.equal(Object.keys(r.answers).length,2);
 assert.equal(battleRoomView(r,'red').answers,undefined);
 assert.equal(applyBattleAction(r,'red',{type:'reveal',revision:r.revision},2100),r);
 r=applyBattleAction(r,'host',{type:'reveal',revision:r.revision},2100);
 assert.equal(r.teams[0].score,100);assert.equal(r.teams[1].score,100);
 assert.equal(battleRoomView(r,'blue').question.correctIndex,answer.index);
 assert.equal(applyBattleAction(r,'host',{type:'reveal',revision:r.revision},2101),r);
 r=applyBattleAction(r,'host',{type:'next',revision:r.revision},2200);
 assert.equal(applyBattleAction(r,'red',answer,2300),r);
});
test('deadline is server enforced and missing answers are counted only once',()=>{
 let r=setup();const q=r.deck[0];
 assert.equal(applyBattleAction(r,'blue',{type:'answer',round:1,questionId:q.id,index:0},16000),r);
 r=applyBattleAction(r,'host',{type:'reveal',revision:r.revision},16000);
 assert.equal(r.teams[0].attempts,1);assert.equal(r.teams[0].score,0);
});
