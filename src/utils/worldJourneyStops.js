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
// Approximate city-center coordinates for featured stops not present in the catalog.
const featuredCoordinates={
 Fukuoka:[130.40,33.59],Jeju:[126.53,33.50],Agra:[78.01,27.18],Turku:[22.27,60.45],Rovaniemi:[25.73,66.50],Manchester:[-2.24,53.48],Edinburgh:[-3.19,55.95],Florence:[11.25,43.77],Venice:[12.32,45.44],Perth:[115.86,-31.95],Vancouver:[-123.12,49.28],'Washington D.C.':[-77.04,38.90],'Los Angeles':[-118.24,34.05],Luxor:[32.64,25.69],'Rio de Janeiro':[-43.17,-22.91],'São Paulo':[-46.63,-23.55],'Xi’an':[108.94,34.34],Brasília:[-47.88,-15.79],Ottawa:[-75.70,45.42],Toronto:[-79.38,43.65],Sydney:[151.21,-33.87],Melbourne:[144.96,-37.81],Alexandria:[29.92,31.20],Rome:[12.50,41.90],Cairo:[31.24,30.04],London:[-0.13,51.51],Paris:[2.35,48.86],Lyon:[4.84,45.76],Marseille:[5.37,43.30],Beijing:[116.40,39.91],Shanghai:[121.47,31.23],Helsinki:[24.94,60.17],Tokyo:[139.69,35.69],Osaka:[135.50,34.69],Seoul:[126.98,37.57],Busan:[129.03,35.10],'New Delhi':[77.21,28.61],Mumbai:[72.88,19.08],'New York':[-74.01,40.71]
};
export function buildJourneyStops(route){
 return route.flatMap(country=>{
  const p=getGeography197Profile(country);
  const places=featured[country]||p?.cities?.slice(0,3).map(c=>[c.labelJa||c.name,c.name])||[['到着ゲート','Arrival'],['文化探究','Discovery'],['出発ゲート','Departure']];
  return places.map(([label,labelEn],index)=>({id:country+'-'+index,country,label,labelEn,coordinates:p?.cities?.find(c=>c.name===labelEn)?.coordinates||featuredCoordinates[labelEn]||p?.center||null,index,named:!!p,continent:p?.continent||'',landlocked:!!p?.landlocked,icon:['🏙️','🚉','📍'][index]}));
 });
}
export function journeyStop(game,position){return game.journeyStops?.[position]||{country:game.route[position],label:'',index:0};}
export function journeyPage(game,cursor,compact=false){
 const groups=compact?1:3,chapter=Math.floor(cursor/3),start=Math.floor(chapter/groups)*groups*3;
 return {start,chapter,stops:game.journeyStops.slice(start,start+groups*3),next:game.journeyStops[((chapter+1)*3)%game.journeyStops.length]};
}
