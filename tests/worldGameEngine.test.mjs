import test from 'node:test';
import assert from 'node:assert/strict';
import {validQuestion,questionPool,balancedDeck,createGame,selectTerritory,rollJourney,answerGame,advanceGame,standings,missedQuestions,teamRank,playableLimit,availableTerritories,buySouvenir} from '../src/utils/worldGameEngine.js';
import {makeLocalGameBank,approvedStandaloneQuestions} from '../src/utils/worldGameBank.js';
const random=()=>0.4;
const q=(id,country='az')=>({id,country,domain:'place',prompt:'Question '+id,choices:['A','B','C','D'],correctIndex:0,explanation:'A'});
const pool=[q('a'),q('b'),q('c','uz'),q('d','uz')];
const start=(mode,extra={})=>createGame({mode,pool,limit:4,teamCount:2,random,...extra});
test('scope, no duplicates, source-dependent exclusion, balanced deck and remapped correct index',()=>{
 const p=questionPool([...pool,pool[0],{...q('diary'),jicaDiarySourceUrl:'https://world-diary.jica.go.jp/post'},{...q('reading'),requiresReading:true}],['az'],['place']);
 assert.equal(p.length,2);const d=balancedDeck(pool,4,random);
 assert.equal(new Set(d.map(x=>x.id)).size,4);assert.notEqual(d[0].country,d[1].country);
 assert.ok(d.every(x=>x.choices[x.correctIndex]==='A'));
 assert.equal(validQuestion({...q('bad'),choices:['A','A','B','C']}),false);
});
test('shuffle scores once, limits to available count, and finishes',()=>{
 let g=start('shuffle',{limit:10});assert.equal(g.limit,4);
 for(let i=0;i<4;i++){g=answerGame(g,g.question.correctIndex);assert.equal(answerGame(g,g.question.correctIndex),g);g=advanceGame(g);}
 assert.equal(g.phase,'finished');assert.equal(g.teams[0].score,400);assert.equal(g.used.length,4);
});
test('battle waits for all teams, gives equal opportunity and scores once',()=>{
 let g=start('battle');const correct=g.question.correctIndex;g=answerGame(g,correct);
 assert.equal(g.phase,'question');assert.equal(g.turn,1);assert.equal(g.teams[0].score,0);
 g=answerGame(g,(correct+1)%4);assert.equal(g.phase,'review');assert.equal(g.teams[0].score,100);assert.equal(g.teams[1].score,0);
 g=advanceGame(g);assert.equal(g.turn,0);assert.equal(g.round,1);
});
test('territory claims and transfers only on correct answers, rotates turns',()=>{
 let g=start('territory');g=selectTerritory(g,'az',random);g=answerGame(g,g.question.correctIndex);
 assert.equal(g.owners.az,0);g=advanceGame(g);assert.equal(g.turn,1);
 g=selectTerritory(g,'az',random);g=answerGame(g,g.question.correctIndex);assert.equal(g.owners.az,1);
 g=advanceGame(g);assert.equal(selectTerritory(g,'az',random),g);assert.equal(standings(g)[0].id,1);
});
test('journey rolls within rules, awards TPM once and finishes without repeating',()=>{
 let g=start('journey');assert.equal(rollJourney(g,7,random),g);
 g=rollJourney(g,6,random);assert.equal(g.dice,6);assert.ok(g.question);assert.equal(rollJourney(g,1,random),g);
 g=answerGame(g,g.question.correctIndex);assert.equal(g.teams[0].money,300);assert.equal(answerGame(g,0),g);
 g=advanceGame(g);assert.equal(g.turn,1);
 for(let i=1;i<4;i++){g=rollJourney(g,1,random);assert.ok(g.question);g=answerGame(g,g.question.correctIndex);g=advanceGame(g);}
 assert.equal(g.phase,'finished');assert.equal(new Set(g.used).size,4);assert.equal(g.teams.reduce((n,t)=>n+t.money,0),1200);
});
test('real AZ and UZ bank only has self-contained four-choice geography/time questions',()=>{
 const bank=makeLocalGameBank([{iso:'az',nameJa:'アゼルバイジャン'},{iso:'uz',nameJa:'ウズベキスタン'}]);
 assert.equal(bank.length,8);assert.ok(bank.every(validQuestion));assert.equal(bank.filter(x=>x.domain==='time').length,6);
 assert.ok(bank.every(x=>x.explanation));
});
test('AIA/other contributed records require rights, review, source and explicit standalone eligibility',()=>{
 const item={...q('aia'),gameEligible:true,rightsConfirmed:true,reviewStatus:'approved',sources:['https://example.org/']};
 assert.equal(approvedStandaloneQuestions([item,{...item,id:'bad',rightsConfirmed:false},{...item,id:'diary',requiresReading:true}]).length,1);
});

test('custom team names, ties, fair turns and insufficient question guard',()=>{
 assert.equal(playableLimit('territory',5,20,3),3);
 assert.equal(playableLimit('journey',5,2,3),0);
 assert.throws(()=>start('journey',{teamCount:5}),/各チーム/);
 const g=start('battle',{teamNames:[' Blue ','Red']});
 assert.equal(g.teams[0].name,'Blue');
 assert.ok(standings(g).every(t=>teamRank(g,t)===1));
});
test('skip counts as an attempt, history retains answers, replay includes mistakes only',()=>{
 let g=start('shuffle');
 g=answerGame(g,-1);assert.equal(g.teams[0].attempts,1);assert.equal(g.teams[0].score,0);
 g=advanceGame(g);const missed=g.history[0].question.id;
 g=answerGame(g,g.question.correctIndex);g=advanceGame(g);
 assert.deepEqual(missedQuestions(g).map(q=>q.id),[missed]);assert.equal(g.teams[0].streak,1);
 g=answerGame(g,g.question.correctIndex);g=advanceGame(g);
 assert.equal(g.teams[0].bestStreak,2);
});
test('journey passport records distinct visited countries even if an answer is wrong',()=>{
 let g=start('journey');g=rollJourney(g,1,random);const iso=g.question.country;
 g=answerGame(g,-1);assert.deepEqual(g.teams[0].visits,[iso]);assert.equal(g.teams[0].money,0);
 g=advanceGame(g);assert.equal(g.history.length,1);
 assert.ok(availableTerritories(g).length>0);
});

import {buildJourneyRoute,territoryChoices,journeyAssets} from '../src/utils/worldGameStrategy.js';

const geo={az:{center:[48,40],region:'Asia',neighbors:['ge']},ge:{center:[44,42],region:'Asia',neighbors:['az']},uz:{center:[64,41],region:'Asia',neighbors:[]}};
test('strategic territory limits expansion to eligible neighbors, then permits expeditions',()=>{
 const bank=[q('a','az'),q('b','ge'),q('c','uz'),q('d','uz'),q('e','az'),q('f','ge')];
 let g=createGame({mode:'territory',pool:bank,limit:6,geo,strategy:true,random});
 g=selectTerritory(g,'az',random);g=answerGame(g,g.question.correctIndex);g=advanceGame(g);
 g=selectTerritory(g,'uz',random);g=answerGame(g,g.question.correctIndex);g=advanceGame(g);
 assert.equal(territoryChoices(g).kind,'neighbor');assert.deepEqual(availableTerritories(g),['ge']);
 assert.equal(selectTerritory(g,'uz',random),g);
 g=selectTerritory(g,'ge',random);g=answerGame(g,g.question.correctIndex);g=advanceGame(g);
 g=selectTerritory(g,'az',random);g=answerGame(g,-1);g=advanceGame(g);
 assert.equal(territoryChoices(g).kind,'expedition');
});
test('region badge is awarded once when the selected region is completed',()=>{
 let g=createGame({mode:'territory',pool:[q('a','az'),q('b','ge'),q('c','az'),q('d','ge')],limit:4,geo,strategy:true,random});
 g=selectTerritory(g,'az',random);g=answerGame(g,g.question.correctIndex);g=advanceGame(g);
 g=selectTerritory(g,'az',random);g=answerGame(g,-1);g=advanceGame(g);
 g=selectTerritory(g,'ge',random);g=answerGame(g,g.question.correctIndex);
 assert.equal(g.teams[0].score,400);assert.deepEqual(g.teams[0].regionsEarned,['Asia']);assert.equal(g.last.newRegions.length,1);
});
test('travel route, paid passes, souvenir purchase and total asset accounting',()=>{
 assert.deepEqual(buildJourneyRoute(['uz','ge','az'],geo,'az'),['az','ge','uz']);
 let g=createGame({mode:'journey',pool:[q('a','az'),q('b','ge'),q('c','uz'),q('d','uz'),q('e','az'),q('f','ge')],limit:6,geo,travelEconomy:true,random});
 assert.equal(rollJourney(g,1,random,'air'),g);
 g=rollJourney(g,1,random);g=answerGame(g,g.question.correctIndex);
 assert.equal(g.teams[0].money,300);
 g=buySouvenir(g,'postcard');assert.equal(g.teams[0].money,200);assert.equal(journeyAssets(g.teams[0]),300);
 assert.equal(buySouvenir(g,'postcard'),g);
 g=advanceGame(g);g=rollJourney(g,1,random);g=answerGame(g,-1);g=advanceGame(g);
 g=rollJourney(g,1,random,'rail');assert.equal(g.teams[0].money,100);assert.equal(g.travel,'rail');assert.equal(g.phase,'question');
});
