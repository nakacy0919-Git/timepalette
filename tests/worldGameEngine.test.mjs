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

test('AIA records require a real official PDF URL, reference page, review date and explicit rights',()=>{
 const item={...q('aia-test'),origin:'AIA',subcategory:'地理',translations:{en:{prompt:'Which location is correct?',choices:['A','B','C','D'],explanation:'A is correct.',subcategory:'Geography'}},translationReviewStatus:'approved',requiresReading:false,gameEligible:true,rightsConfirmed:true,reviewStatus:'approved',sources:['https://www2.aia.pref.aichi.jp/koryu/j/kyouzai/PDF/H20/uzbekistan.pdf'],sourcePages:[12],verifiedOn:'2026-11-25'};
 assert.deepEqual(approvedStandaloneQuestions([item,item,{...item,id:'aia-missing',sourcePages:[]},{...item,id:'aia-fake',sources:['https://www2.aia.pref.aichi.jp.example.com/fake.pdf']},{...item,id:'aia-draft',reviewStatus:'draft'}]),[item]);
});


import {classroomReport,classroomReportCsv} from '../src/utils/worldGameEngine.js';
test('classroom analytics distinguish correct, incorrect, unanswered and unassigned turns',()=>{
 let g=start('battle',{teamNames:['=1+1','Red']});
 g=answerGame(g,g.question.correctIndex);g=answerGame(g,-1);g=advanceGame(g);
 g=answerGame(g,(g.question.correctIndex+1)%4);g=answerGame(g,g.question.correctIndex);g=advanceGame(g);
 const report=classroomReport(g);
 assert.deepEqual(report.total,{attempts:4,correct:2,incorrect:1,unanswered:1,rate:50});
 assert.deepEqual(report.teams.map(t=>[t.correct,t.incorrect,t.unanswered]),[[1,1,0],[1,0,1]]);
 assert.equal(report.domains[0].rate,50);assert.equal(report.review.length,2);
 const csv=classroomReportCsv(report);
 assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'=1+1"'));assert.ok(csv.includes('"unanswered"'));
 let t=start('territory');t=selectTerritory(t,'az',random);t=answerGame(t,-1);t=advanceGame(t);
 const tr=classroomReport(t);
 assert.equal(tr.total.attempts,1);assert.equal(tr.total.unanswered,1);assert.equal(tr.teams[1].attempts,0);assert.equal(tr.teams[1].rate,null);
 assert.equal(classroomReport(start('shuffle')).total.rate,null);
});
test('classroom CSV preserves displayed option text and escapes unsafe spreadsheet values',()=>{
 const report={questions:[{round:1,id:'q',country:'az',domain:'place',language:'en',prompt:'A "quote", here',correctAnswer:'A',explanation:'Line 1\nLine 2',responses:[{teamName:'  @SUM(1)',answer:'A',status:'correct'}]}]};
 const csv=classroomReportCsv(report);
 assert.ok(csv.includes('"A ""quote"", here"'));assert.ok(csv.includes('"\'  @SUM(1)"'));assert.ok(csv.includes('"Line 1\nLine 2"'));
});

import {getGeography197CountryCodes} from '../src/utils/geography197.js';
import {buildJourneyStops,journeyStop,journeyPage} from '../src/utils/worldJourneyStops.js';
test('journey moves through domestic city stops before crossing country boundary',()=>{
 const stops=buildJourneyStops(['jp','kr','in','fi','nz']);
 assert.equal(stops.length,15);
 assert.deepEqual(stops.slice(0,3).map(s=>s.country),Array(3).fill('jp'));
 assert.equal(stops[3].label,'ソウル');assert.equal(stops[6].label,'ニューデリー');assert.equal(stops[9].label,'ヘルシンキ');
 assert.equal(stops[12].named,true);
 assert.deepEqual(stops.slice(0,3).map(s=>s.label),['東京','大阪','福岡']);
 let g=createGame({mode:'journey',pool:[q('a','jp'),q('b','jp'),q('c','kr'),q('d','kr')],limit:4,teamCount:2,travelEconomy:true,random});
 g=rollJourney(g,2,random);
 assert.equal(g.teams[0].position,2);assert.equal(journeyStop(g,2).country,'jp');assert.equal(g.question.country,'jp');
 assert.equal(g.dice,2);
});

test('world atlas covers all 197 profiles with three distinct named places and pages safely',()=>{
 const route=getGeography197CountryCodes(),stops=buildJourneyStops(route);
 assert.equal(route.length,197);assert.equal(stops.length,591);assert.equal(new Set(stops.map(s=>s.id)).size,591);
 assert.ok(stops.every(s=>s.named&&s.label&&s.labelEn));
 for(let i=0;i<stops.length;i++)for(const compact of [true,false]){const page=journeyPage({journeyStops:stops},i,compact);assert.ok(page.stops.includes(stops[i]));assert.ok(page.stops.length<= (compact?3:9));assert.ok(page.next);}
});

test('geographic city coordinates and multi-dice rolls stay consistent',()=>{
 const stops=buildJourneyStops(getGeography197CountryCodes());assert.ok(stops.every(s=>s.coordinates?.length===2&&s.coordinates.every(Number.isFinite)));
 const [tokyo,osaka,fukuoka]=buildJourneyStops(['jp']);assert.ok(tokyo.coordinates[0]>osaka.coordinates[0]&&osaka.coordinates[0]>fukuoka.coordinates[0]);
 let g=createGame({mode:'journey',pool:[q('a','jp'),q('b','jp'),q('c','kr'),q('d','kr')],limit:4,teamCount:2,travelEconomy:true,diceCount:2,random});
 assert.equal(rollJourney(g,[1,7],random),g);assert.equal(rollJourney(g,3,random),g);
 g=rollJourney(g,[1,2],random);assert.equal(g.dice,3);assert.deepEqual(g.diceFaces,[1,2]);assert.equal(g.teams[0].position,3);assert.equal(g.question.country,'kr');
});
