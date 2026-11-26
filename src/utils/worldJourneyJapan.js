// Original game itinerary, not a real rail timetable or geographically exact route.
// All 47 prefectures; two or more named municipalities/urban stops each.
export const JAPAN_REGIONS=[
 ['北海道','hokkaido',[['北海道','札幌','函館','旭川','釧路']]],
 ['東北','tohoku',[['青森県','青森','弘前'],['岩手県','盛岡','花巻'],['秋田県','秋田','横手'],['山形県','山形','米沢'],['宮城県','仙台','石巻'],['福島県','福島','会津若松']]],
 ['関東','kanto',[['茨城県','水戸','つくば'],['栃木県','宇都宮','日光'],['群馬県','前橋','高崎'],['埼玉県','さいたま','川越'],['千葉県','千葉','成田'],['東京都','東京','八王子'],['神奈川県','横浜','鎌倉']]],
 ['中部','chubu',[['新潟県','新潟','長岡'],['富山県','富山','高岡'],['石川県','金沢','小松'],['福井県','福井','敦賀'],['長野県','長野','松本'],['山梨県','甲府','富士吉田'],['静岡県','静岡','浜松'],['岐阜県','岐阜','高山'],['愛知県','名古屋','豊田','岡崎','安城']]],
 ['近畿','kinki',[['三重県','津','伊勢'],['滋賀県','大津','彦根'],['京都府','京都','宇治'],['奈良県','奈良','橿原'],['大阪府','大阪','堺'],['和歌山県','和歌山','田辺'],['兵庫県','神戸','姫路']]],
 ['中国','chugoku',[['鳥取県','鳥取','米子'],['島根県','松江','出雲','浜田'],['岡山県','岡山','倉敷'],['広島県','福山','広島'],['山口県','山口','下関']]],
 ['四国','shikoku',[['香川県','高松','丸亀'],['徳島県','徳島','鳴門'],['高知県','高知','四万十'],['愛媛県','松山','今治']]],
 ['九州・沖縄','kyushu',[['福岡県','福岡','北九州'],['佐賀県','佐賀','唐津'],['長崎県','長崎','佐世保'],['大分県','大分','別府'],['熊本県','熊本','阿蘇'],['宮崎県','宮崎','都城'],['鹿児島県','鹿児島','霧島'],['沖縄県','那覇','名護']]],
];
export const JAPAN_STATIONS=JAPAN_REGIONS.flatMap(([region,regionId,prefs])=>prefs.flatMap(([prefecture,...cities])=>cities.map((label,i)=>({label,prefecture,region,regionId,icon:i===0?'🏙️':'🚉',named:true}))));
export function journeyPages(stops){
 const pages=[];
 for(let i=0;i<stops.length;){
  const first=stops[i],key=first.country+':'+(first.regionId||'default');
  let end=i+1;
  while(end<stops.length&&end-i<8&&stops[end].country+':'+(stops[end].regionId||'default')===key)end++;
  pages.push({start:i,end,country:first.country,region:first.region||'',regionId:first.regionId||'',stops:stops.slice(i,end)});
  i=end;
 }
 return pages;
}
