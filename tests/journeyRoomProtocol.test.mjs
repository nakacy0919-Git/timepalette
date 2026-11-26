import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,rollJourney} from '../src/utils/worldGameEngine.js';
import {roomCode,publicGame,restoreGame,acceptsJourneyAction,applyJourneyAction} from '../src/utils/journeyRoomProtocol.js';
const pool=Array.from({length:8},(_,i)=>({id:'q'+i,country:'jp',domain:'place',prompt:'Question '+i,choices:['A','B','C','D'],correctIndex:0,explanation:'A'}));
const game=()=>createGame({mode:'journey',pool,limit:4,teamCount:2,travelEconomy:true,random:()=>.4});
test('room code is exactly six digits',()=>{for(let i=0;i<100;i++)assert.match(roomCode(),/^\d{6}$/);});
test('public snapshot strips question bank and reconstructs identical route',()=>{
 const g=game(),snapshot=publicGame(g);
 assert.ok(!('pool' in snapshot));assert.ok(!('deck' in snapshot));
 assert.deepEqual(restoreGame(JSON.parse(JSON.stringify(snapshot))).journeyStops,g.journeyStops);
});
test('host accepts only current team, round and phase; duplicate answer cannot score',()=>{
 let g=rollJourney(game(),1,()=>.4),action={type:'answer',round:0,phase:'question',index:g.question.correctIndex};
 assert.equal(acceptsJourneyAction(g,action,1),false);
 assert.equal(applyJourneyAction(g,action,1),g);
 g=applyJourneyAction(g,action,0);assert.equal(g.teams[0].money,300);
 assert.equal(applyJourneyAction(g,action,0),g);
 g=applyJourneyAction(g,{type:'next',round:0,phase:'review'},0);
 assert.equal(g.turn,1);assert.equal(g.round,1);
 assert.equal(applyJourneyAction(g,action,0),g);
});
