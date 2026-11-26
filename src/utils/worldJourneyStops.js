import {getGeography197Profile} from './geography197.js';
// A game itinerary, not a real rail timetable. Three named places per country/region.
// Small states use real districts/landmarks from the existing geography catalog.
const featured={
 jp:[['東京','Tokyo'],['大阪','Osaka'],['福岡','Fukuoka']],
 kr:[['ソウル','Seoul'],['釜山','Busan'],['済州','Jeju']],
 in:[['ニューデリー','New Delhi'],['ムンバイ','Mumbai'],['アグラ','Agra']],
 fi:[['ヘルシンキ','Helsinki'],['トゥルク','Turku'],['ロヴァニエミ','Rovaniemi']],
 fr:[['パリ','Paris'],['リヨン','Lyon'],['マルセイユ','Marseille']],
 gb:[['ロンドン','London'],['マンチェスター','Manchester'],['エディンバラ','Edinburgh']],
 it:[['ローマ','Rome'],['フィレンツェ','Florence'],['ヴェネツィア','Venice']],
 au:[['シドニー','Sydney'],['メルボルン','Melbourne'],['パース','Perth']],
 ca:[['オタワ','Ottawa'],['トロント','Toronto'],['バンクーバー','Vancouver']],
 us:[['ワシントンD.C.','Washington D.C.'],['ニューヨーク','New York'],['ロサンゼルス','Los Angeles']],
 eg:[['カイロ','Cairo'],['アレクサンドリア','Alexandria'],['ルクソール','Luxor']],
 br:[['ブラジリア','Brasília'],['リオデジャネイロ','Rio de Janeiro'],['サンパウロ','São Paulo']],
 cn:[['北京','Beijing'],['上海','Shanghai'],['西安','Xi’an']],
};
export function buildJourneyStops(route){
 return route.flatMap(country=>{
  const p=getGeography197Profile(country);
  const places=featured[country]||p?.cities?.slice(0,3).map(c=>[c.labelJa||c.name,c.name])||[['到着ゲート','Arrival'],['文化探究','Discovery'],['出発ゲート','Departure']];
  return places.map(([label,labelEn],index)=>({id:country+'-'+index,country,label,labelEn,index,named:!!p,continent:p?.continent||'',landlocked:!!p?.landlocked,icon:['🏙️','🚉','📍'][index]}));
 });
}
export function journeyStop(game,position){return game.journeyStops?.[position]||{country:game.route[position],label:'',index:0};}
export function journeyPage(game,cursor,compact=false){
 const groups=compact?1:3,chapter=Math.floor(cursor/3),start=Math.floor(chapter/groups)*groups*3;
 return {start,chapter,stops:game.journeyStops.slice(start,start+groups*3),next:game.journeyStops[((chapter+1)*3)%game.journeyStops.length]};
}
