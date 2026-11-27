import {geoBounds,geoContains,geoDistance,geoInterpolate} from 'd3-geo';
import {feature} from 'topojson-client';
import land from 'world-atlas/land-110m.json' with {type:'json'};
import detailedLand from 'world-atlas/land-50m.json' with {type:'json'};

function polygonsFor(atlas){const geometry=feature(atlas,atlas.objects.land);return (geometry.features||[geometry]).flatMap(f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates).map(coordinates=>{const polygon={type:'Polygon',coordinates};return {polygon,bounds:geoBounds(polygon)};});}
const polygons=polygonsFor(land),coastalPolygons=polygonsFor(detailedLand);
function inRing(ring,x,y){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [ax,ay]=ring[i],[bx,by]=ring[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}
function onLand([lon,lat],detailed){
 return (detailed?coastalPolygons:polygons).some(({polygon,bounds:[[west,south],[east,north]]})=>{
  if(lat<south||lat>north||!(west<=east?lon>=west&&lon<=east:lon>=west||lon<=east))return false;
  // Use spherical containment for dateline/polar polygons, fast ray casting elsewhere.
  if(west>east||east-west>180||Math.abs(lat)>75)return geoContains(polygon,[lon,lat]);
  return inRing(polygon.coordinates[0],lon,lat)&&!polygon.coordinates.slice(1).some(r=>inRing(r,lon,lat));
 });
}
export const VEHICLES=[['car','🚗','スポーツカー'],['van','🚐','キャンピングカー'],['bike','🚴','自転車'],['runner','🏃','ランナー'],['motorbike','🏍️','バイク']];
const memo=new Map();
// The route is a geographic illustration, not a road-navigation service.
export function crossesSea(a,b){
 if(!a?.coordinates||!b?.coordinates)return false;
 const key=a.coordinates.join(',')+'|'+b.coordinates.join(',');
 if(memo.has(key))return memo.get(key);
 const rad=geoDistance(a.coordinates,b.coordinates),km=rad*6371;
 if(km<12)return false;
 const detailed=km<350,n=Math.min(32,Math.max(8,Math.ceil(km/(detailed?10:35)))),interpolate=geoInterpolate(a.coordinates,b.coordinates);
 let run=0,max=0;
 for(let i=1;i<n;i++){
  if(!onLand(interpolate(i/n),detailed)){run++;max=Math.max(max,run);}else run=0;
 }
 const result=max*km/n>=Math.min(detailed?15:38,km*.32);
 memo.set(key,result);return result;
}
export function journeyEdges(stops){
 return stops.map((a,i)=>{const b=stops[(i+1)%stops.length];return {a,b,i,sea:crossesSea(a,b)};}).filter(e=>e.a.coordinates&&e.b.coordinates&&e.a!==e.b);
}

// Public travel videos selected by actual video ID, not search-result embeds.
export const cityVideos={
 '札幌':['pQetA6y72YQ','冬の札幌を旅するVlog','雪景色や食文化、街歩き'],
 '青森':['JamNXc1kGBI','青森の旅','弘前城、鉄道、地域の食文化'],
 '仙台':['_IO6P2KBn9k','仙台旅行Vlog','仙台の街歩き'],
 '新潟':['heFXNuNBcVY','新潟の旅','新潟の街を巡る'],
 '金沢':['7KTHZrUXLpM','金沢2日間の旅','街並みと文化'],
 '長野':['aTqB3s4rPIw','冬の長野旅行','温泉と街歩き'],
 '名古屋':['-ov8rajJzI0','名古屋旅行Vlog','観光スポットと郷土料理'],
 '広島':['v8IkhPGcIU4','広島・宮島の旅','厳島神社や地域の文化'],
 '福岡':['CPOjTvK_Bmw','福岡旅行Vlog','神社と食文化'],
 '東京':['ET5GnPUIKM0','東京4日間の旅','東京タワー、上野、街の食文化'],
 '大阪':['fu3IGoJ_mFk','大阪の街を探検','道頓堀や大阪城など'],
 'ソウル':['dP-VMQjwFdI','ソウル旅行Vlog','市街地の暮らしと食文化'],
 '釜山':['AZdDrQcsNns','釜山4日間の旅','港町の街歩き'],
 '北京':['87IEZnPuSCY','北京旅行Vlog','紫禁城や北京の食文化'],
 '上海':['Dm92K-iD9Ak','上海旅行Vlog','上海の街並み'],
 '台北':['kW7nT6nctVo','台北4日間の旅','夜市、博物館、鉄道'],
 '新北市':['kW7nT6nctVo','台北・新北市の旅','九份、淡水、鉄道'],
 '台中':['M2QQNQx6_PU','台中旅行Vlog','街歩きと食文化'],
 'バンコク':['afehAI0dyNw','バンコク旅行Vlog','寺院、街の食文化'],
 'シンガポール':['zgYMBduEY34','シンガポールの街歩き','マリーナ湾、庭園、多文化の街'],
 'ハノイ':['u-XuvT9OBOQ','ハノイ旅行Vlog','街の食文化や周辺の風景'],
 'ホーチミン':['mL5cePxs1SE','ホーチミン4日間の旅','街の風景と食文化'],
 'シェムリアップ':['S_McjB1_AkI','シェムリアップの旅','アンコール・ワットと周辺の街'],
 'マニラ':['USjWa28eM2g','マニラの街を旅する','街並みや暮らしの様子'],
 'ダバオ':['pG5jDC2M5bg','ダバオ旅行Vlog','街の風景'],
 'クアラルンプール':['EJAFXbYRdGo','クアラルンプールの旅','ツインタワーや市場'],
 'パリ':['8x6vXibEVKE','パリ旅行Vlog','街の風景や観光スポット'],
 'ロンドン':['R-6gnoD1Ork','ロンドン旅行Vlog','街並み、店や食文化']
};
export const extraLandmarks=[
 ['jp','厳島神社','いつくしまじんじゃ','heritage',[132.319,34.296],'海辺の大鳥居で知られる広島県の神社。'],
 ['jp','白川郷','しらかわごう','heritage',[136.906,36.257],'合掌造りの家屋が残る山間の集落。'],
 ['jp','原爆ドーム','げんばくドーム','heritage',[132.453,34.395],'戦争の記憶を伝え、平和を考える広島の建物。'],
 ['jp','法隆寺','ほうりゅうじ','heritage',[135.734,34.614],'奈良県にある歴史的な木造寺院。'],
 ['jp','日光東照宮','にっこうとうしょうぐう','heritage',[139.599,36.758],'栃木県の日光にある装飾豊かな神社。'],
 ['kr','景福宮','キョンボックン','heritage',[126.977,37.579],'朝鮮王朝の王宮。'],
 ['kr','仏国寺','プルグクサ','heritage',[129.332,35.79],'慶州の歴史的な仏教寺院。'],
 ['cn','兵馬俑','へいばよう','heritage',[109.278,34.385],'秦の始皇帝の墓の近くに並ぶ陶製の兵士像。'],
 ['cn','紫禁城','しきんじょう','heritage',[116.397,39.916],'北京にある歴代皇帝の宮殿。'],
 ['cn','莫高窟','ばっこうくつ','heritage',[94.805,40.037],'敦煌に残る仏教の石窟と壁画。'],
 ['tw','龍山寺','りゅうざんじ','heritage',[121.50,25.037],'台北の歴史ある寺院。'],
 ['vn','ホイアン旧市街','ホイアンきゅうしがい','heritage',[108.328,15.877],'歴史ある港町の街並み。'],
 ['vn','ミーソン聖域','ミーソンせいいき','heritage',[108.108,15.77],'チャンパ王国の寺院遺跡。'],
 ['la','ルアンパバーン','','heritage',[102.137,19.89],'メコン川沿いの歴史的な街。'],
 ['mm','バガン','','heritage',[94.858,21.171],'多くの仏教寺院が残る古都。'],
 ['th','スコータイ','','heritage',[99.703,17.017],'タイの歴史的な王国の都の遺跡。'],
 ['id','プランバナン','','heritage',[110.491,-7.752],'ジャワ島にあるヒンドゥー教寺院群。'],
 ['my','マラッカ','','heritage',[102.249,2.195],'交易で栄えた歴史的な港町。'],
 ['ph','ビガン','','heritage',[120.387,17.574],'歴史的な街並みが残る都市。'],
 ['lk','シーギリヤ','','heritage',[80.76,7.957],'巨大な岩山の上に残る古代の宮殿遺跡。'],
 ['in','アジャンター石窟群','アジャンターせっくつぐん','heritage',[75.703,20.552],'仏教の壁画や彫刻が残る石窟群。'],
 ['jo','ペトラ','','heritage',[35.444,30.329],'岩を削って造られた古代都市。'],
 ['uz','サマルカンド','','heritage',[66.975,39.655],'シルクロードの交易で栄えた都市。'],
 ['gr','アクロポリス','','heritage',[23.726,37.972],'アテネの丘に残る古代ギリシャの神殿。'],
 ['it','ポンペイ','','heritage',[14.486,40.751],'火山噴火で埋もれた古代ローマの都市遺跡。'],
 ['es','アルハンブラ宮殿','アルハンブラきゅうでん','heritage',[-3.588,37.177],'グラナダの歴史的な宮殿。'],
 ['fr','モン・サン・ミシェル','','heritage',[-1.511,48.636],'潮の満ち引きで景色が変わる島の修道院。'],
 ['gb','ロンドン塔','ロンドンとう','heritage',[-0.076,51.508],'テムズ川沿いの歴史的な城塞。'],
 ['de','ケルン大聖堂','ケルンだいせいどう','heritage',[6.958,50.941],'高い二つの塔が特徴の大聖堂。'],
 ['eg','アブ・シンベル神殿','アブ・シンベルしんでん','heritage',[31.626,22.337],'巨大な像が並ぶ古代エジプトの神殿。'],
 ['et','ラリベラ岩窟教会群','ラリベラがんくつきょうかいぐん','heritage',[39.041,12.031],'岩を掘って造られた教会群。'],
 ['zw','グレート・ジンバブエ','','heritage',[30.935,-20.267],'石の壁が残る歴史的な都市遺跡。'],
 ['mx','テオティワカン','','heritage',[-98.843,19.692],'巨大なピラミッドが残る古代都市。'],
 ['gt','ティカル','','heritage',[-89.623,17.222],'熱帯林に残るマヤ文明の都市遺跡。'],
 ['cl','ラパ・ヌイ','','heritage',[-109.35,-27.12],'モアイ像で知られる太平洋の島。'],
 ['pe','ナスカの地上絵','ナスカのちじょうえ','heritage',[-75.13,-14.69],'砂漠に描かれた巨大な図形。'],
 ['au','シドニー・オペラハウス','','heritage',[151.215,-33.857],'港に面した帆を思わせる建築。']
];
