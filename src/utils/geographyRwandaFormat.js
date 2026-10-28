import countryNames from '../data/geography/rwanda-format-names.json' with {type:'json'};
import culturePhotos from '../data/geography/rwanda-format-photos.json' with {type:'json'};
import {shuffleChoices} from './rwandaAnswerContract.js';
export const countryLabel=(name,iso)=>countryNames.iso[iso]||countryNames.names[name]||name;
export const portLabel=name=>({Karachi:'カラチ',Durres:'ドゥラス',Algiers:'アルジェ',Barcelona:'バルセロナ',Luanda:'ルアンダ',"Saint John's":'セントジョンズ','Buenos Aires':'ブエノスアイレス',Poti:'ポティ',Sydney:'シドニー',Koper:'コペル'}[name]||name);
export const seaLabel=name=>({'Arabian Sea':'アラビア海','Adriatic Sea':'アドリア海','Mediterranean Sea':'地中海','Atlantic Ocean':'大西洋','Caribbean Sea':'カリブ海','Black Sea':'黒海','Pacific Ocean':'太平洋'}[name]||name);
// UN M49 regional labels, except South America uses approximate north/central/south position.
// Points are label anchors, not political boundaries; the South America answer refers to the country center.
export const REGION_GROUPS = {
 asia:[['southern','南アジア',[73,23]],['western','西アジア',[43,31]],['central','中央アジア',[67,45]],['eastern','東アジア',[111,38]],['southeastern','東南アジア',[108,10]]],
 europe:[['southern','南ヨーロッパ',[18,40]],['western','西ヨーロッパ',[5,49]],['northern','北ヨーロッパ',[14,63]],['eastern','東ヨーロッパ',[36,52]]],
 africa:[['northern','北アフリカ',[17,27]],['middle','中部アフリカ',[18,-4]],['eastern','東アフリカ',[37,-2]],['western','西アフリカ',[-4,10]],['southern','南部アフリカ',[24,-27]]],
 northAmerica:[['caribbean','カリブ海地域',[-68,19]],['central','中央アメリカ',[-92,12]],['northern','北アメリカ北部',[-108,48]]],
 southAmerica:[['north','北部',[-62,5]],['central','中部',[-60,-13]],['south','南部',[-65,-38]]],
 oceania:[['australia','オーストラリア・ニュージーランド',[139,-27]],['melanesia','メラネシア',[160,-9]],['micronesia','ミクロネシア',[150,11]],['polynesia','ポリネシア',[-150,-14]]],
};
const regions={af:'southern',al:'southern',dz:'northern',ad:'southern',ao:'middle',ag:'caribbean',ar:'south',am:'western',au:'australia',at:'western',az:'western'};
const observations={af:'写真B：模様のある皿に料理が盛り付けられている',al:'写真B：切り分けた焼き料理の中に具が見える',dz:'写真B：皿の上に野菜などが盛り付けられている',ad:'写真B：器の中に汁と具が見える',ao:'写真B：一つの皿に複数の食べ物が盛られている',ag:'写真B：葉の間にパイナップルの実が見える',ar:'写真B：火の近くで肉が焼かれている',am:'写真B：かごの中に薄いパンが重ねられている',au:'写真B：赤・黄・黒などを使った模様が見える',at:'写真B：皿にケーキと白い添え物が見える',az:'写真B：皿の上に米などが盛り付けられている'};
const cities={af:['カブール','カンダハール','ジャララバード','ヘラート'],al:['ティラナ','エルバサン','シュコドラ','ドゥラス'],dz:['アルジェ','オラン','コンスタンティーヌ','ブリダ'],ad:['アンドラ・ラ・ベリャ','アンカム','サン・ジュリア・デ・ロリア'],ao:['ルアンダ','ウアンボ','ロビト','ベンゲラ'],ag:['セントジョンズ','オールセインツ','コドリントン'],ar:['ブエノスアイレス','コルドバ','ロサリオ','メンドーサ'],am:['エレバン','ギュムリ','ヴァナゾル','ガヴァル'],au:['キャンベラ','シドニー','メルボルン','ブリスベン'],at:['ウィーン','リンツ','グラーツ','ザルツブルク'],az:['バクー','ギャンジャ','スムガイト','ナヒチェヴァン']};
export function getRwandaFormat(p) {
 const continent=Object.keys(REGION_GROUPS).find(k=>k.toLowerCase()===p.continent.replaceAll(' ','').toLowerCase());
 const regionChoices=REGION_GROUPS[continent];
 const region=regions[p.countryCode];
 const capital=p.cities.find(c=>c.id===p.capitalId);
 return {
  continent,region,regionChoices,
  regionName:regionChoices?.find(r=>r[0]===region)?.[1],
  culturePhoto:culturePhotos[p.countryCode],
  cityLabels:cities[p.countryCode],
  lifeChoices:shuffleChoices([{id:'visible',label:'写真A：'+p.visibleClaimJa,correct:true},{id:'culture',label:observations[p.countryCode],correct:true},{id:'same',label:'この国の人は全員、写真Bと同じ生活をしている',correct:false},{id:'whole',label:'この国のすべての場所が写真Aと同じ景色である',correct:false}]),
  facts:shuffleChoices([{id:'terrain',label:p.factJa,correct:true},{id:'capital',label:'首都は'+(cities[p.countryCode]?.[p.cities.indexOf(capital)]||capital.name),correct:true},{id:'route',label:p.route.domestic?`${portLabel(p.route.port)}港から${seaLabel(p.route.sea)}につながる`:`${countryLabel(p.route.via)}の${portLabel(p.route.port)}港を経て${seaLabel(p.route.sea)}につながる模式ルートがある`,correct:true},{id:'wrong-capital',label:'首都は'+(cities[p.countryCode]?.[p.cities.findIndex(c=>c.id!==p.capitalId)]||p.cities.find(c=>c.id!==p.capitalId).name),correct:false},{id:'wrong-coast',label:p.landlocked?'国境を越えずに外洋に面する自国の海港へ運べる':'海岸がなく、外国を通らなければ海港に行けない',correct:false}]),
 };
}
