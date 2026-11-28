export function journeyDiceCount(game){return Math.min(4,(game.diceCount||1)+(game.teams[game.turn]?.extraDice||0));}
export function chooseJourneyGoal(stops,limit,teams,dice,random=Math.random){
 const max=Math.min(stops.length-1,Math.max(1,Math.floor(limit/teams)*Math.max(2,dice*3)));
 const min=Math.min(max,Math.max(1,Math.ceil(max*.45)));
 return min+Math.floor(random()*(max-min+1));
}
export function journeyRemaining(game,team){
 if(game.goalIndex==null)return null;
 if(team.arrivalRank)return 0;
 const n=game.journeyStops.length;return (game.goalIndex-team.position+n)%n;
}
export function journeyMoveSteps(game,die,extra=0){
 const remaining=journeyRemaining(game,game.teams[game.turn]);
 return remaining!=null&&remaining>0?Math.min(die+extra,remaining):die+extra;
}
export function journeyAnimationSteps(game,die,extra=0){
 const steps=journeyMoveSteps(game,die,extra),stops=game.journeyStops,team=game.teams[game.turn];
 if(!game.pool)return steps;
 for(let i=0;i<stops.length;i++)if(game.pool.some(q=>q.country===stops[(team.position+steps+i)%stops.length].country&&!game.used.includes(q.id)))return steps+i;
 return steps;
}
export const arrivalReward=rank=>Math.max(300,1500-(rank-1)*350);
export function journeyCard(random=Math.random){
 const p=random();
 if(p<.13)return {id:'express',label:'特急カード',icon:'🚄',description:'次のターンはサイコロが1個増える！',extraDice:1};
 if(p<.18)return {id:'rest',label:'休憩カード',icon:'☕',description:'次のターンは1回お休み。',skip:1};
 if(p<.25)return {id:'lucky',label:'ラッキーカード',icon:'🍀',description:'旅の資金 +200 TPM！',money:200};
 return null;
}
