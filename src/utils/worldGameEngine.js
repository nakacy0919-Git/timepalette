import {TRAVEL_MODES,souvenirsForCountry,buildJourneyRoute,territoryChoices,regionalCollections,journeyAssets} from './worldGameStrategy.js';
import {buildJourneyStops} from './worldJourneyStops.js';
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
export function createGame({mode,pool,limit,teamCount=2,teamNames=[],geo={},strategy=false,travelEconomy=false,diceCount=1,random=Math.random}){
 if(!GAME_MODES.includes(mode)||!Number.isInteger(limit)||limit<1||!pool.length)throw Error('出題可能な問題がありません。');
 const teamMode=mode!=='shuffle';
 const n=teamMode?Math.min(8,Math.max(2,Number(teamCount)||2)):1;
 const teams=Array.from({length:n},(_,i)=>({id:i,name:teamMode?(String(teamNames[i]||'').trim().slice(0,24)||'TEAM '+(i+1)):'PLAYER',color:TEAM_COLORS[i],score:0,money:0,position:0,correctCount:0,attempts:0,streak:0,bestStreak:0,visits:[],souvenirs:[],regionsEarned:[]}));
 const actualLimit=playableLimit(mode,limit,pool.length,n);
 if(actualLimit<1)throw Error('各チームが1回以上挑戦できる問題数を選んでください。');
 const ids=shuffled([...new Set(pool.map(q=>q.country))],random);
 const route=mode==='journey'?buildJourneyRoute(ids,geo,ids.includes('jp')?'jp':ids[0]):ids;
 const deck=balancedDeck(pool,actualLimit,random);
 return {mode,teams,route,diceCount:[1,2,3].includes(diceCount)?diceCount:1,journeyStops:mode==='journey'?buildJourneyStops(route):null,deck,pool,geo,strategy,travelEconomy,travel:null,limit:actualLimit,round:0,turn:0,used:[],history:[],owners:{},answers:{},phase:['territory','journey'].includes(mode)?'select':'question',question:['territory','journey'].includes(mode)?null:deck[0],target:null,dice:null,last:null};
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
 const dice=Array.isArray(die)?die:[die];
 if(game.mode!=='journey'||game.phase!=='select'||dice.length!==(game.diceCount||1)||dice.some(n=>!Number.isInteger(n)||n<1||n>6))return game;
 die=dice.reduce((a,b)=>a+b,0);
 if(!Object.hasOwn(TRAVEL_MODES,travel))return game;
 const team=game.teams[game.turn],ticket=TRAVEL_MODES[travel];
 if(!ticket||(!game.travelEconomy&&travel!=='standard')||team.money<ticket.cost)return game;
 const stops=game.journeyStops||buildJourneyStops(game.route);
 let position=(team.position+die+ticket.extra)%stops.length;
 // Skip exhausted stops, without repeating questions or charging extra moves.
 for(let i=0;i<stops.length;i++,position=(position+1)%stops.length){
  const target=stops[position].country, question=nextQuestion(game,target,random);
  if(question)return {...game,teams:game.teams.map(t=>t.id===team.id?{...t,position,money:t.money-ticket.cost}:t),target,question,dice:die,diceFaces:dice,travel,journeySkipped:i,phase:'question',last:null};
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
 return {...game,round,used,history,turn,answers:{},phase:selection?'select':'question',question:selection?null:game.deck[round],target:null,dice:null,diceFaces:null,travel:null,journeySkipped:0,last:null};
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
 const country=game.question.country,team=game.teams[game.turn],item=souvenirsForCountry(country).find(x=>x.id===itemId);
 if(!item||team.money<item.cost||team.souvenirs.some(x=>x.id===itemId&&x.country===country))return game;
 return {...game,teams:game.teams.map(t=>t.id===team.id?{...t,money:t.money-item.cost,souvenirs:[...t.souvenirs,{id:item.id,country,value:item.value}]}:t)};
}


// A report counts actual answer opportunities: all teams in battle, only the
// answering team in territory/journey, and one player in shuffle.
export function classroomReport(game){
 const teams=(game.teams||[]).map(t=>({id:t.id,name:t.name,attempts:0,correct:0,incorrect:0,unanswered:0}));
 const questions=[],domains=new Map();
 const count=(s,value,correct)=>{s.attempts++;if(value===correct)s.correct++;else if(value===-1||value===undefined||value===null)s.unanswered++;else s.incorrect++;};
 const rate=s=>s.attempts?Math.round(100*s.correct/s.attempts):null;
 for(const [i,row] of (game.history||[]).entries()){
  const q=row.question;
  const item={round:i+1,id:q.id,country:q.country,domain:q.domain,language:q.language||'ja',prompt:q.prompt,correctAnswer:q.choices[q.correctIndex],explanation:q.explanation,attempts:0,correct:0,incorrect:0,unanswered:0,responses:[]};
  if(!domains.has(q.domain))domains.set(q.domain,{domain:q.domain,attempts:0,correct:0,incorrect:0,unanswered:0});
  const domain=domains.get(q.domain);
  for(const team of teams){
   if(game.mode!=='battle'&&!Object.hasOwn(row.answers,team.id))continue;
   const value=row.answers[team.id];count(team,value,q.correctIndex);count(item,value,q.correctIndex);count(domain,value,q.correctIndex);
   item.responses.push({teamId:team.id,teamName:team.name,answer:Number.isInteger(value)&&value>=0?q.choices[value]||'':'',status:value===q.correctIndex?'correct':value===-1||value===undefined||value===null?'unanswered':'incorrect'});
  }
  questions.push({...item,rate:rate(item)});
 }
 const total=teams.reduce((s,t)=>{for(const k of ['attempts','correct','incorrect','unanswered'])s[k]+=t[k];return s;},{attempts:0,correct:0,incorrect:0,unanswered:0});
 return {total:{...total,rate:rate(total)},teams:teams.map(t=>({...t,rate:rate(t)})),domains:[...domains.values()].map(d=>({...d,rate:rate(d)})),questions,review:[...questions].filter(q=>q.rate!==null&&q.rate<100).sort((a,b)=>a.rate-b.rate||a.round-b.round)};
}
// Neutralize spreadsheet formula injection (including leading whitespace) and
// preserve commas, quotes and line breaks. UTF-8 BOM supports Japanese Excel.
export function classroomReportCsv(report){
 const cell=v=>{let s=String(v??'');if(/^[\s\uFEFF]*[=+\-@]|^[\t\r\n]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const rows=[['Round','Question ID','Country','Category','Language','Question','Team','Response','Status','Correct answer','Explanation']];
 for(const q of report.questions)for(const r of q.responses)rows.push([q.round,q.id,q.country,q.domain,q.language,q.prompt,r.teamName,r.answer,r.status,q.correctAnswer,q.explanation]);
 return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';
}
