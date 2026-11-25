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
export function createGame({mode,pool,limit,teamCount=2,random=Math.random}){
 if(!GAME_MODES.includes(mode)||!Number.isInteger(limit)||limit<1||!pool.length)throw Error('出題可能な問題がありません。');
 const teamMode=mode!=='shuffle';
 const n=teamMode?Math.min(8,Math.max(2,Number(teamCount)||2)):1;
 const teams=Array.from({length:n},(_,i)=>({id:i,name:teamMode?'TEAM '+(i+1):'PLAYER',color:TEAM_COLORS[i],score:0,money:0,position:0}));
 const route=shuffled([...new Set(pool.map(q=>q.country))],random);
 const deck=balancedDeck(pool,limit,random);
 return {mode,teams,route,deck,pool,limit:Math.min(limit,pool.length),round:0,turn:0,used:[],owners:{},answers:{},phase:['territory','journey'].includes(mode)?'select':'question',question:['territory','journey'].includes(mode)?null:deck[0],target:null,dice:null,last:null};
}
function nextQuestion(game,country,random){
 const available=game.pool.filter(q=>q.country===country&&!game.used.includes(q.id));
 return available.length?shuffleOptions(shuffled(available,random)[0],random):null;
}
export function selectTerritory(game,country,random=Math.random){
 if(game.mode!=='territory'||game.phase!=='select'||!game.route.includes(country))return game;
 const question=nextQuestion(game,country,random);if(!question)return game;
 return {...game,question,target:country,phase:'question',last:null};
}
export function rollJourney(game,die,random=Math.random){
 if(game.mode!=='journey'||game.phase!=='select'||!Number.isInteger(die)||die<1||die>6)return game;
 const team=game.teams[game.turn];let position=(team.position+die)%game.route.length;
 // Skip exhausted stops, without repeating questions or charging extra moves.
 for(let i=0;i<game.route.length;i++,position=(position+1)%game.route.length){
  const target=game.route[position], question=nextQuestion(game,target,random);
  if(question)return {...game,teams:game.teams.map(t=>t.id===team.id?{...t,position}:t),target,question,dice:die,phase:'question',last:null};
 }
 return {...game,phase:'finished'};
}
export function answerGame(game,index){
 if(game.phase!=='question'||!game.question||!Number.isInteger(index)||index<0||index>3)return game;
 const q=game.question, correct=index===q.correctIndex, id=game.turn;
 if(game.mode==='battle'){
  const answers={...game.answers,[id]:index};
  if(id+1<game.teams.length)return {...game,answers,turn:id+1};
  const teams=game.teams.map(t=>({...t,score:t.score+(answers[t.id]===q.correctIndex?100:0)}));
  return {...game,answers,teams,turn:0,phase:'review',last:{correct:null}};
 }
 const teams=game.teams.map(t=>t.id!==id?t:{...t,score:t.score+(correct?100:0),money:t.money+(correct&&game.mode==='journey'?300:0)});
 const owners=correct&&game.mode==='territory'?{...game.owners,[game.target]:id}:game.owners;
 return {...game,teams,owners,answers:{[id]:index},phase:'review',last:{correct}};
}
export function advanceGame(game){
 if(game.phase!=='review')return game;
 const round=game.round+1,used=[...game.used,game.question.id];
 if(round>=game.limit)return {...game,round,used,phase:'finished',question:null};
 const turn=['territory','journey'].includes(game.mode)?(game.turn+1)%game.teams.length:0;
 const selection=['territory','journey'].includes(game.mode);
 return {...game,round,used,turn,answers:{},phase:selection?'select':'question',question:selection?null:game.deck[round],target:null,dice:null,last:null};
}
export function standings(game){
 return game.teams.map(t=>({...t,territories:Object.values(game.owners).filter(id=>id===t.id).length})).sort((a,b)=>game.mode==='territory'?b.territories-a.territories||b.score-a.score:game.mode==='journey'?b.money-a.money||b.score-a.score:b.score-a.score);
}
