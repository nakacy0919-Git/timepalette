import {TRAVEL_MODES,SOUVENIRS,buildJourneyRoute,territoryChoices,regionalCollections,journeyAssets} from './worldGameStrategy.js';
// Pure rules shared by local play and a future authoritative room server.
export const GAME_MODES = ['shuffle','battle','territory','journey'];
export const TEAM_COLORS = ['#2563eb','#dc2626','#059669','#d97706','#7c3aed','#0891b2','#db2777','#475569'];
export function shuffled(values, random=Math.random){
 const a=[...values]; for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;
}
export function validQuestion(q){
 return !!q && typeof q.id==='string' && /^[a-z]{2}$/.test(q.country) && typeof q.prompt==='string' && !!q.prompt.trim() &&
 Array.isArray(q.choices) && q.choices.length===4 && q.choices.every(x=>typeof x==='string'&&x.trim()) &&
 new Set(q.choices).size===4 && Number.isInteger(q.correctIndex) && q.correctIndex>=0 && q.correctIndex<4 &&
 !q.requiresReading && !q.jicaDiarySourceUrl && !q.video;
}
export function questionPool(bank,countries,domains){
 const seen=new Set();
 return bank.filter(q=>validQuestion(q)&&countries.includes(q.country)&&domains.includes(q.domain)&&!seen.has(q.id)&&seen.add(q.id));
}
export function balancedDeck(pool,limit,random=Math.random){
 const buckets=new Map();
 for(const q of shuffled(pool,random)){if(!buckets.has(q.country))buckets.set(q.country,[]);buckets.get(q.country).push(q);}
 const deck=[];
 while(buckets.size&&deck.length<limit){
  for(const c of shuffled([...buckets.keys()],random)){
   const b=buckets.get(c);deck.push(b.pop());if(!b.length)buckets.delete(c);if(deck.length===limit)break;
  }
 }
 return deck.map(q=>shuffleOptions(q,random));
}
export function shuffleOptions(q,random=Math.random){
 const options=shuffled(q.choices.map((label,i)=>({label,i})),random);
 return {...q,choices:options.map(x=>x.label),correctIndex:options.findIndex(x=>x.i===q.correctIndex)};
}
// Turn-based games must give every team the same number of opportunities.
export function playableLimit(mode,requested,available,teams){
 const max=Math.max(0,Math.min(requested,available));
 return ['territory','journey'].includes(mode)?Math.floor(max/teams)*teams:max;
}
export function createGame({mode,pool,limit,teamCount=2,teamNames=[],geo={},strategy=false,travelEconomy=false,random=Math.random}){
 if(!GAME_MODES.includes(mode)||!Number.isInteger(limit)||limit<1||!pool.length)throw Error('出題可能な問題がありません。');
 const teamMode=mode!=='shuffle';
 const n=teamMode?Math.min(8,Math.max(2,Number(teamCount)||2)):1;
 const teams=Array.from({length:n},(_,i)=>({id:i,name:teamMode?(String(teamNames[i]||'').trim().slice(0,24)||'TEAM '+(i+1)):'PLAYER',color:TEAM_COLORS[i],score:0,money:0,position:0,correctCount:0,attempts:0,streak:0,bestStreak:0,visits:[],souvenirs:[],regionsEarned:[]}));
 const actualLimit=playableLimit(mode,limit,pool.length,n);
 if(actualLimit<1)throw Error('各チームが1回以上挑戦できる問題数を選んでください。');
 const ids=shuffled([...new Set(pool.map(q=>q.country))],random);
 const route=mode==='journey'&&travelEconomy?buildJourneyRoute(ids,geo,ids.includes('jp')?'jp':ids[0]):ids;
 const deck=balancedDeck(pool,actualLimit,random);
 return {mode,teams,route,deck,pool,geo,strategy,travelEconomy,travel:null,limit:actualLimit,round:0,turn:0,used:[],history:[],owners:{},answers:{},phase:['territory','journey'].includes(mode)?'select':'question',question:['territory','journey'].includes(mode)?null:deck[0],target:null,dice:null,last:null};
}
export function availableTerritories(game){
 return territoryChoices(game).countries;
}
function withAnswer(t,correct,journey=false){
 const streak=correct?t.streak+1:0;
 return {...t,score:t.score+(correct?100:0),money:t.money+(correct&&journey?300:0),attempts:t.attempts+1,correctCount:t.correctCount+Number(correct),streak,bestStreak:Math.max(t.bestStreak,streak)};
}
function nextQuestion(game,country,random){
 const available=game.pool.filter(q=>q.country===country&&!game.used.includes(q.id));
 return available.length?shuffleOptions(shuffled(available,random)[0],random):null;
}
export function selectTerritory(game,country,random=Math.random){
 if(game.mode!=='territory'||game.phase!=='select'||!availableTerritories(game).includes(country))return game;
 const question=nextQuestion(game,country,random);if(!question)return game;
 return {...game,question,target:country,phase:'question',last:null};
}
export function rollJourney(game,die,random=Math.random,travel='standard'){
 if(game.mode!=='journey'||game.phase!=='select'||!Number.isInteger(die)||die<1||die>6)return game;
 const team=game.teams[game.turn],ticket=TRAVEL_MODES[travel];
 if(!ticket||(!game.travelEconomy&&travel!=='standard')||team.money<ticket.cost)return game;
 let position=(team.position+die+ticket.extra)%game.route.length;
 // Skip exhausted stops, without repeating questions or charging extra moves.
 for(let i=0;i<game.route.length;i++,position=(position+1)%game.route.length){
  const target=game.route[position], question=nextQuestion(game,target,random);
  if(question)return {...game,teams:game.teams.map(t=>t.id===team.id?{...t,position,money:t.money-ticket.cost}:t),target,question,dice:die,travel,phase:'question',last:null};
 }
 return {...game,phase:'finished'};
}
export function answerGame(game,index){
 if(game.phase!=='question'||!game.question||!Number.isInteger(index)||index< -1||index>3)return game;
 const q=game.question, correct=index===q.correctIndex, id=game.turn;
 if(game.mode==='battle'){
  const answers={...game.answers,[id]:index};
  if(id+1<game.teams.length)return {...game,answers,turn:id+1};
  const teams=game.teams.map(t=>withAnswer(t,answers[t.id]===q.correctIndex));
  return {...game,answers,teams,turn:0,phase:'review',last:{correct:null}};
 }
 let teams=game.teams.map(t=>{if(t.id!==id)return t;const next=withAnswer(t,correct,game.mode==='journey');return game.mode==='journey'?{...next,visits:[...new Set([...t.visits,q.country])]}:next;});
 const owners=correct&&game.mode==='territory'?{...game.owners,[game.target]:id}:game.owners;
 const newRegions=correct&&game.mode==='territory'&&game.strategy?regionalCollections({...game,owners},id).filter(x=>!teams[id].regionsEarned.includes(x.region)):[];
 if(newRegions.length)teams=teams.map(t=>t.id===id?{...t,score:t.score+newRegions.length*200,regionsEarned:[...t.regionsEarned,...newRegions.map(x=>x.region)]}:t);
 return {...game,teams,owners,answers:{[id]:index},phase:'review',last:{correct,newRegions,transfer:correct&&game.mode==='territory'&&game.owners[game.target]!==undefined&&game.owners[game.target]!==id}};
}
export function advanceGame(game){
 if(game.phase!=='review')return game;
 const round=game.round+1,used=[...game.used,game.question.id];
 const history=[...game.history,{question:game.question,answers:{...game.answers},turn:game.turn,target:game.target,dice:game.dice}];
 if(round>=game.limit)return {...game,round,used,history,phase:'finished',question:null};
 const turn=['territory','journey'].includes(game.mode)?(game.turn+1)%game.teams.length:0;
 const selection=['territory','journey'].includes(game.mode);
 return {...game,round,used,history,turn,answers:{},phase:selection?'select':'question',question:selection?null:game.deck[round],target:null,dice:null,travel:null,last:null};
}
export function standings(game){
 return game.teams.map(t=>({...t,territories:Object.values(game.owners).filter(id=>id===t.id).length,assets:journeyAssets(t)})).sort((a,b)=>game.mode==='territory'?b.territories-a.territories||b.score-a.score:game.mode==='journey'?b.assets-a.assets||b.score-a.score:b.score-a.score);
}

// Review keeps original questions and correct indices, never only the displayed letters.
export function missedQuestions(game){
 return (game.history||[]).filter(row=>Object.values(row.answers).some(answer=>answer!==row.question.correctIndex)).map(row=>row.question);
}
export function teamRank(game,t){
 const rankValue=x=>game.mode==='territory'?[x.territories,x.score]:game.mode==='journey'?[x.assets,x.score]:[x.score,0];
 const a=rankValue(t);
 return 1+standings(game).filter(other=>{const b=rankValue(other);return b[0]>a[0]||(b[0]===a[0]&&b[1]>a[1]);}).length;
}

// Purchase is voluntary and only possible during the active team's review, once per item type per country.
export function buySouvenir(game,itemId){
 if(game.mode!=='journey'||!game.travelEconomy||game.phase!=='review'||!game.question)return game;
 const item=SOUVENIRS.find(x=>x.id===itemId),team=game.teams[game.turn],country=game.question.country;
 if(!item||team.money<item.cost||team.souvenirs.some(x=>x.id===itemId&&x.country===country))return game;
 return {...game,teams:game.teams.map(t=>t.id===team.id?{...t,money:t.money-item.cost,souvenirs:[...t.souvenirs,{id:item.id,country,value:item.value}]}:t)};
}
