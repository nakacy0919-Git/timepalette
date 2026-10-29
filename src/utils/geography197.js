import countries from '../data/geography/countries197.json' with {type:'json'};
import photos from '../data/geography/photos197.json' with {type:'json'};
import rwanda from '../data/place_r.json' with {type:'json'};

export const PLACE197_TYPES=['world-locator','neighbor-puzzle','shape-choice','capital-hunt','city-challenge','landscape-detective','life-photo-evidence','route-challenge','photo-evidence','geo-master'];
const icons=['🌍','🧩','🗺️','📍','🏙️','📸','👨‍🌾','🚚','🔎','🏆'];
const cache=new Map();
export const getGeography197CountryCodes=()=>Object.keys(countries);
export const getGeography197Profile=code=>countries[String(code||'').trim().toLowerCase()]??null;
export const getGeography197Photos=code=>photos[code]??[];
export const compass197=(from,to)=>{
 const rad=Math.PI/180,lat1=from[1]*rad,lat2=to[1]*rad,delta=(to[0]-from[0])*rad;
 const bearing=(Math.atan2(Math.sin(delta)*Math.cos(lat2),Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(delta))/rad+360)%360;
 return ['北','北東','東','南東','南','南西','西','北西'][Math.floor((bearing+22.5)/45)%8];
};
export function getGeography197Candidates(code){
 const p=countries[code];if(!p)return[];
 const rest=Object.values(countries).filter(c=>c.countryCode!==code&&c.capitalId!==p.capitalId);
 const seed=code.charCodeAt(0)+code.charCodeAt(1);
 const nearby=rest.filter(c=>c.continent===p.continent);
 const pool=nearby.length>=3?nearby:rest;
 const choices=[p,...[0,Math.floor(pool.length/3),Math.floor(pool.length*2/3)].map(n=>pool[(seed+n)%pool.length])];
 const rotate=seed%4;return[...choices.slice(rotate),...choices.slice(0,rotate)];
}
const words=(ja,en)=>({ja,en});
export function getGeography197Package(code){
 code=String(code||'').trim().toLowerCase();if(cache.has(code))return cache.get(code);
 const p=countries[code];if(!p)return null;
 const capital=p.cities.find(c=>c.id===p.capitalId), name=p.nameJa, photo=photos[code]?.[0];
 const titles=[`${name}をさがせ！`,p.neighborKind==='land-border'?'となりの国パズル':'いちばん近い国と方角を探せ！','国の形を見ぬけ！',`${p.capitalRoleJa}${p.capitalNameJa}を見つけよう`,'4つの地点を攻略せよ！','景色のたんてい',`${name}の景観を読み取ろう`,'海まで荷物を運べ！','写真たんてい',`${name}地理マスター`];
 const titlesEn=[`Find ${p.nameEn}!`,'Neighbor and Direction Puzzle','Country Shape Challenge',`Find ${capital.name}!`,'Four Places Challenge','Landscape Detective','Read Two Photographs','Route to the Sea','Photo Evidence Detective',`${p.nameEn} Geography Master`];
 const prompts=[
  `${name}の首都・主な国土がある大陸を選び、地域→周辺の地図の順に${name}を見つけよう。小さい国は丸いマーカーも使えます。`,
  p.neighborKind==='land-border'?`${name}と陸で国境を接する国・地域のカードを、地図の色と位置関係を手がかりに配置しよう。4枚ずつ進めます。`:`${name}の国土に最も近い国を選び、いちばん近い海岸から見た方角を答えよう。首都間の距離ではありません。`,
  `4つのシルエットを見くらべて、${name}を選ぼう。島々や海外領土を含み、各図の縮尺は異なります。`,
  `${name}の${p.capitalRoleJa}「${p.capitalNameJa}」の場所を、拡大地図の点から選ぼう。${p.capitalNote}`,
  '名前と位置を確認してから、4つの地点を順に選ぼう。都市国家では実在する地区・建物・広場も使います。',
  `資料の写真「${photo?.captionJa??name+'の景観'}」を観察しよう。参照写真を閉じて、4枚から同じ場所の景観を見つけよう。`,
  `${name}の2枚の写真とキャプションを見比べよう。資料から確かめられることと、資料の限界について正しい説明を2つ選ぼう。`,
  `${name}から海へ。${!p.route.domestic?'通過する国を順につなぎ、':'国内の'}海港までの模式ルートを完成させよう。`,
  '写真とキャプションをよく見て、この資料だけで本当に言える範囲を選ぼう。',
  `${name}の位置・${p.capitalRoleJa}・地理情報の3つの鍵を集めよう。`,
 ];
 const promptsEn=[`Choose the continent containing ${p.nameEn}'s capital/main territory, then locate the country on the regional and surrounding maps. Small countries have round markers.`,p.neighborKind==='land-border'?`Place the cards of countries/regions sharing a land border with ${p.nameEn}. Work in batches of four.`:`Find the nearest country by coastline-to-coastline distance, then choose the direction from the closest shore of ${p.nameEn}. This is not a capital-to-capital comparison.`,`Identify ${p.nameEn} from four silhouettes. Islands and overseas territories are included; scales differ.`,`Find ${capital.name} on the enlarged map. Read the note about the capital's role.`, 'Learn four actual locations and select them in order. City-states may use districts, buildings or squares.',`Study the reference photograph (${photo?.captionEn??p.nameEn}), close it, and identify the same scene among four photographs.`,`Compare two photographs and their captions. Select two statements about the evidence and its limits.`,`Connect ${p.nameEn} to a seaport using the schematic route.`, 'Choose the claim that this photograph and caption can actually support.',`Collect the location, capital and geography keys for ${p.nameEn}.`];
 const discoveries=[`${name}の位置を、大陸→地域→周辺の順に確認できました。`,p.neighborKind==='land-border'?`${name}と陸で接する相手：${p.neighbors.map(n=>n.nameJa).join('、')}。${p.neighborNote}`:`地図上で最も近い対象国は${p.nearest.countryNameJa}、近い海岸から見た方角は${p.nearest.direction}。距離は約${Math.round(p.nearest.distanceKm)}kmです。${p.nearest.definitionJa}`,'国土の形と国土面積は別の情報です。輪郭図の縮尺が違うため、絵の大きさだけで面積は比較できません。',`${name}の${p.capitalRoleJa}は${p.capitalNameJa}。${p.capitalNote}地図の番号と地名を照合して、国内の位置を確認できました。`,`実在する4地点：${p.cities.map(c=>c.labelJa||c.name).join('、')}。番号の丸は押しやすく配置し、線の先が実際の位置です。`,`「${photo?.captionJa??name+'の景観'}」という場所の景観を見つけました。1か所の写真を国全体に一般化しないことも大切です。`,'写真は特定の場所・場面の資料です。キャプションで場所や被写体を確認できますが、2枚だけで国全体の暮らし・人口・年間の気候は分かりません。',`${p.route.countries.map(c=>c.nameJa).join(' → ')} → ${p.route.port}港 → 海。${p.route.noteJa}`,'資料が示す場所・場面の一例と、国全体についての主張は区別します。',`${name}の${p.capitalRoleJa}は${p.capitalNameJa}。${p.factJa}${p.capitalNote}`];
 const answers=[name,p.neighbors.length?p.neighbors.map(n=>`${n.nameJa}（${n.borderPoint?compass197(p.center,n.borderPoint):'国境'}）`).join('、'):`${p.nearest.countryNameJa}・${p.nearest.direction}・約${Math.round(p.nearest.distanceKm)}km`,name,`${p.capitalRoleJa}：${p.capitalNameJa}`,p.cities.map(c=>c.labelJa||c.name).join('、'),photo?.captionJa??name,'キャプションは場所・被写体の情報。2枚だけでは国全体の暮らしや年間の気候は分からない。',`${p.route.countries.map(c=>c.nameJa).join(' → ')} → ${p.route.port}港 → 海`,'特定の場所・場面の一例。国全体への一般化には別の資料が必要。',`${p.capitalRoleJa}：${p.capitalNameJa}。${p.factJa}${p.neighbors.length?`${p.neighbors[0].nameJa}と陸で国境を接する。`:'陸上の国境で接する国・地域はない。'}`];
 const missions=PLACE197_TYPES.map((type,i)=>({id:`${code}-place-${String(i+1).padStart(2,'0')}`,countryCode:code,type,domain:'place',points:100,icon:icons[i],universalGeography:true,index:i,answerJa:answers[i],title:words(titles[i],titlesEn[i]),instruction:Object.fromEntries(['elementary','juniorHigh','highSchoolStandard','highSchoolAdvanced'].map(level=>[level,words(prompts[i],promptsEn[i])])),success:{headline:words(i===9?'GEOGRAPHY MASTER アンロック！':'ミッションクリア！',i===9?'GEOGRAPHY MASTER UNLOCKED!':'Mission Clear!'),discovery:words(discoveries[i],`${p.nameEn}: ${capital.name}. ${i===1&&!p.neighbors.length?`Nearest mapped coast: ${p.nearest.countryNameJa}, about ${Math.round(p.nearest.distanceKm)} km.`:'Compare map evidence, named locations and the limits of each source.'}`)}}));
 const result={...p,countryNameJa:name,countryNameEn:p.nameEn,defaultLanguage:'ja',defaultLevel:'elementary',domain:'place',schemaVersion:197,missions,photos:photos[code]??[]};cache.set(code,result);return result;
}
export const getPlaceAdventurePackage=code=>String(code).toLowerCase()==='rw'?rwanda:getGeography197Package(code);
// Same stable mission IDs are used by the actual Rwanda prototype.
export const getPublishedPlaceMissions=code=>getPlaceAdventurePackage(code)?.missions??[];

export function describePublishedPlaceMission(code,mission){
 if(code!=='rw')return {prompt:mission.instruction?.elementary?.ja||'',answer:mission.answerJa||'',explanation:mission.success?.discovery?.ja||''};
 const correct=values=>(values??[]).filter(v=>v.correct).map(v=>v.ja||v.label?.ja||v.atlasName||v.id).join('、');
 const index=rwanda.missions.findIndex(m=>m.id===mission.id);
 const answers=['ルワンダ（アフリカ東部）','北：ウガンダ／東：タンザニア／南：ブルンジ／西：コンゴ民主共和国','ルワンダ','キガリ',rwanda.country.cities.map(c=>c.labelJa||c.name).join('、'),correct(mission.landscapeChoices),correct(mission.choices),index===7?correct(mission.route.countryChoices)+' → '+correct(mission.route.portChoices)+' → インド洋':'',correct(mission.choices),correct(mission.facts)];
 return {prompt:mission.instruction?.elementary?.ja||'',answer:answers[index]||'',explanation:mission.success?.discovery?.ja||''};
}

// Identity-based scoring used by the live game; labels and marker positions
// never determine a correct capital, neighboring country or route.
export function evaluateGeography197(code,index,answer){
 const p=getGeography197Package(code);if(!p)return false;
 const exactly=(actual,expected)=>Array.isArray(actual)&&actual.length===expected.length&&new Set(actual).size===expected.length&&expected.every(id=>actual.includes(id));
 switch(index){
  case 0:case 2:case 5:return answer===p.countryCode;
  case 1:return p.neighbors.length?answer&&typeof answer==='object'&&!Array.isArray(answer)&&Object.keys(answer).length===p.neighbors.length&&p.neighbors.every(n=>answer[n.iso]===n.iso):answer?.country===p.nearest.countryIso&&answer?.direction===p.nearest.direction;
  case 3:return answer===p.capitalId;
  case 4:return exactly(answer,p.cities.map(c=>c.id));
  case 6:return exactly(answer,['caption','limited']);
  case 7:return Array.isArray(answer?.countryPath)&&JSON.stringify(answer.countryPath)===JSON.stringify(p.route.countryPath)&&answer.port===p.route.port;
  case 8:return answer==='limited';
  case 9:return answer?.country===p.countryCode&&answer?.capital===p.capitalId&&exactly(answer?.facts,['capital','coast','neighbor']);
  default:return false;
 }
}
