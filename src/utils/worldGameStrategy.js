// Platform-neutral educational geography and game economy rules.
export const TRAVEL_MODES=Object.freeze({
 standard:{label:'普通旅行',icon:'🎒',cost:0,extra:0},
 rail:{label:'特急パス',icon:'🚆',cost:100,extra:1},
 air:{label:'フライトパス',icon:'✈️',cost:200,extra:3},
});
export const SOUVENIRS=Object.freeze([
 {id:'postcard',label:'旅のポストカード',icon:'💌',cost:100,value:100},
 {id:'atlas',label:'世界地図コレクション',icon:'🗺️',cost:300,value:300},
 {id:'globe',label:'記念地球儀',icon:'🌐',cost:500,value:500},
]);
export function geographicDistance(a,b){
 if(!Array.isArray(a)||!Array.isArray(b)||a.length!==2||b.length!==2||![...a,...b].every(Number.isFinite))return Infinity;
 const rad=Math.PI/180,dlat=(b[1]-a[1])*rad,dlon=(b[0]-a[0])*rad;
 const h=Math.sin(dlat/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin(dlon/2)**2;
 return 6371*2*Math.asin(Math.sqrt(Math.max(0,Math.min(1,h))));
}
// A virtual itinerary, not actual direct flights or border-crossing advice.
export function buildJourneyRoute(ids,geo,start){
 const rest=[...new Set(ids)],route=[];
 if(!rest.length)return route;
 let current=rest.includes(start)?start:rest[0];
 while(rest.length){
  route.push(current);rest.splice(rest.indexOf(current),1);
  if(!rest.length)break;
  const from=geo[current]?.center;
  current=rest.reduce((best,c)=>geographicDistance(from,geo[c]?.center)<geographicDistance(from,geo[best]?.center)?c:best,rest[0]);
 }
 return route;
}
export function territoryChoices(game){
 const used=new Set(game.used),available=game.route.filter(c=>game.pool.some(q=>q.country===c&&!used.has(q.id)));
 if(!game.strategy)return {countries:available,kind:'free'};
 const own=game.route.filter(c=>game.owners[c]===game.turn);
 if(!own.length)return {countries:available,kind:'start'};
 const adjacent=available.filter(c=>game.owners[c]!==game.turn&&own.some(a=>(game.geo[a]?.neighbors||[]).includes(c)||(game.geo[c]?.neighbors||[]).includes(a)));
 // Island states and disconnected selections remain playable. Never fabricate a border.
 if(adjacent.length)return {countries:adjacent,kind:'neighbor'};
 const other=available.filter(c=>game.owners[c]!==game.turn);
 return {countries:other.length?other:available,kind:'expedition'};
}
export function regionalCollections(game,teamId){
 const groups=new Map();
 for(const iso of game.route){const region=game.geo?.[iso]?.region;if(!region)continue;if(!groups.has(region))groups.set(region,[]);groups.get(region).push(iso);}
 return [...groups].filter(([,ids])=>ids.length>=2&&ids.every(c=>game.owners[c]===teamId)).map(([region,ids])=>({region,count:ids.length}));
}
export const journeyAssets=team=>team.money+(team.souvenirs||[]).reduce((sum,item)=>sum+item.value,0);
