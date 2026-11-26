// Illustrative board stops, not actual roads or travel distances. Questions remain country-level.
const landmarks={
 jp:['東京','鎌倉','箱根','名古屋','京都','大阪'],
 kr:['ソウル','水原','全州','光州','慶州','釜山'],
 in:['ニューデリー','アグラ','ジャイプル','アフマダーバード','ムンバイ','ゴア'],
 fi:['ヘルシンキ','ポルヴォー','トゥルク','タンペレ','ユヴァスキュラ','ロヴァニエミ'],
 fr:['パリ','ルーアン','トゥール','ボルドー','リヨン','マルセイユ'],
 it:['ミラノ','ヴェネツィア','ボローニャ','フィレンツェ','ローマ','ナポリ'],
 au:['シドニー','キャンベラ','メルボルン','アデレード','パース','ダーウィン'],
 ca:['バンクーバー','カルガリー','ウィニペグ','トロント','オタワ','モントリオール'],
 us:['ニューヨーク','ワシントンD.C.','シカゴ','デンバー','ラスベガス','ロサンゼルス'],
 gb:['ロンドン','オックスフォード','バース','バーミンガム','ヨーク','エディンバラ'],
 az:['バクー','ゴブスタン','シェマハ','シェキ','ギャンジャ','ナフチヴァン'],
 uz:['タシケント','サマルカンド','ブハラ','ナヴォイ','ウルゲンチ','ヒヴァ'],
};
const generic=['到着ゲート','街の広場','文化探究','自然探究','交流スポット','出発ゲート'];
const icons=['🛬','🏘️','🏛️','🌳','📸','🚉'];
export function buildJourneyStops(route){
 return route.flatMap(country=>(landmarks[country]||generic).map((label,index)=>({id:country+'-'+index,country,label,icon:icons[index],named:!!landmarks[country],index})));
}
export function journeyStop(game,position){return game.journeyStops?.[position]||{country:game.route[position],label:'',index:0};}
