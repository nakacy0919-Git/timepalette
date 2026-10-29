import snapshot from '../data/world-adventure/time/time197.json' with { type: 'json' };

export const TIME_COUNTRIES = snapshot.countries;
export const TIME_DATA_VERSION = snapshot.version;
export const TIME_SOURCE = snapshot.source;
export const getTimeCountryCodes = () => Object.keys(TIME_COUNTRIES);
const MINUTE = 60000;
const DAY = 86400000;
export function offsetAt(zone, instant) {
  const seconds = Math.floor(Number(instant) / 1000);
  if (seconds < snapshot.validFrom || seconds >= snapshot.validUntil) throw new RangeError('時刻データの対応期間は2025〜2036年です。');
  const rows = snapshot.zones[zone];
  if (!rows) throw new RangeError(`Unknown timezone: ${zone}`);
  let lo = 0, hi = rows.length;
  while (lo + 1 < hi) { const mid = (lo + hi) >> 1; if (rows[mid][0] <= seconds) lo = mid; else hi = mid; }
  return rows[lo][1];
}
export function localParts(zone, instant) {
  const date = new Date(Number(instant) + offsetAt(zone, instant) * MINUTE);
  return { date: date.toISOString().slice(0,10), time: date.toISOString().slice(11,16), minutes: date.getUTCHours()*60+date.getUTCMinutes(), day: Math.floor(Number(date)/DAY) };
}
export function localInstant(zone, date, time) {
  const wall = Date.parse(`${date}T${time}:00Z`);
  const matches = [...new Set(snapshot.zones[zone].map(row => row[1]))]
    .map(offset => wall-offset*MINUTE)
    .filter(t => localParts(zone,t).date===date && localParts(zone,t).time===time);
  if (matches.length !== 1) throw new RangeError('存在しない時刻、または夏時間の切替で二通りある時刻です。');
  return matches[0];
}
export const formatStamp = (zone,t) => { const p=localParts(zone,t); return `${p.date} ${p.time}`; };
export const formatOffset = minutes => `UTC${minutes < 0 ? '−' : '+'}${String(Math.floor(Math.abs(minutes)/60)).padStart(2,'0')}:${String(Math.abs(minutes)%60).padStart(2,'0')}`;
export const durationText = minutes => `${Math.floor(Math.abs(minutes)/60)}時間${Math.abs(minutes)%60 ? `${Math.abs(minutes)%60}分` : ''}`;
const jp = {nameJa:'日本',cityJa:'東京',zone:'Asia/Tokyo',iso:'jp'};
const city = iso => ({...TIME_COUNTRIES[iso],iso});
const clock = (place,t,hidden=false) => ({label:`${place.nameJa}・${place.cityJa}`,zone:place.zone,instant:t,hidden});
function choices(correct, wrong, seed) {
  const values = [correct,...new Set(wrong.filter(v=>v!==correct))].slice(0,4);
  if (values.length!==4) throw new Error('Four distinct choices required');
  const rotate=seed%4;
  return [...values.slice(rotate),...values.slice(0,rotate)].map(label=>({label,correct:label===correct}));
}
const shiftedChoices = (zone,t,seed) => choices(formatStamp(zone,t), [t+60*MINUTE,t-60*MINUTE,t+DAY,t-DAY].map(x=>formatStamp(zone,x)),seed);
export function schoolWindows(zone, date='2026-07-15') {
  const result=[];
  for (let minutes=510; minutes<=930; minutes+=30) {
    const time=`${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
    const start=localInstant(jp.zone,date,time);
    const a=localParts(zone,start), b=localParts(zone,start+30*MINUTE);
    if(a.minutes>=510 && a.minutes<=930 && b.minutes<=960 && a.date===b.date) result.push(time);
  }
  return result;
}
const cache=new Map();
export function getTimePackage(code) {
  code=String(code).toLowerCase();
  if(cache.has(code))return cache.get(code);
  const country=TIME_COUNTRIES[code]; if(!country)return null;
  const place=city(code), seed=code.charCodeAt(0)+code.charCodeAt(1);
  const jan=localInstant(jp.zone,'2026-01-15','12:00');
  const jul=localInstant(place.zone,'2026-07-15','23:30');
  const gap=offsetAt(jp.zone,jan)-offsetAt(place.zone,jan);
  const gapText=n=>n===0?'東京と同じ時刻':`東京より${durationText(n)}${n>0?'遅い':'早い'}`;
  const all=getTimeCountryCodes().filter(c=>c!==code);
  const same=all.find(c=>offsetAt(TIME_COUNTRIES[c].zone,jan)===offsetAt(place.zone,jan));
  const different=all.filter(c=>offsetAt(TIME_COUNTRIES[c].zone,jan)!==offsetAt(place.zone,jan));
  const hunt=[...(same?[same]:[]),...different.slice(0,same?2:3)];
  const huntAnswer=same?`${TIME_COUNTRIES[same].nameJa}・${TIME_COUNTRIES[same].cityJa}`:'この3都市にはない';
  const huntOptions=hunt.map(c=>`${TIME_COUNTRIES[c].nameJa}・${TIME_COUNTRIES[c].cityJa}`);
  const janGap=offsetAt(place.zone,jan)-offsetAt(jp.zone,jan);
  const summer=localInstant(jp.zone,'2026-07-15','12:00');
  const julGap=offsetAt(place.zone,summer)-offsetAt(jp.zone,summer);
  const change=julGap-janGap;
  const changeText=change===0?'時差は同じ':`7月のほうが${durationText(change)}${change>0?'進む':'遅れる'}`;
  const orderPlaces=[place];
  for(const c of ['us','gb','ke','jp','nz','np']) {
    const candidate=city(c);
    if(!orderPlaces.some(p=>offsetAt(p.zone,jan)===offsetAt(candidate.zone,jan)))orderPlaces.push(candidate);
    if(orderPlaces.length===3)break;
  }
  const sorted=[...orderPlaces].sort((a,b)=>offsetAt(a.zone,jan)-offsetAt(b.zone,jan));
  const orderLabel=items=>items.map(p=>p.cityJa).join(' → ');
  const [a,b,c]=sorted;
  const windows=schoolWindows(place.zone);
  const times=[];
  for(let m=510;m<=930;m+=30)times.push(`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`);
  const no='授業時間が重ならないので録画で交流する';
  const schoolAnswer=windows.length?`東京 ${windows[0]} 開始`:no;
  const invalid=times.filter(t=>!windows.includes(t)).map(t=>`東京 ${t} 開始`);
  // If all starts work, distractors are deliberately outside the stated school hours.
  const schoolWrong=[...invalid,...['06:00','19:00','23:00'].map(t=>`東京 ${t} 開始`),no];
  const departure=localInstant(place.zone,'2026-01-15','22:30'), arrival=departure+12*60*MINUTE;
  const evening=localInstant(place.zone,'2026-07-15','18:30');
  const towerCity=code==='gb'?city('au'):city('gb');
  const destination=code==='jp'?city('rw'):jp;
  const targetMinutes=localParts(destination.zone,evening).minutes;
  const periods=['朝（06:00〜11:59）','昼（12:00〜17:59）','夕方（18:00〜20:59）','夜・未明（21:00〜05:59）'];
  const period=targetMinutes>=360&&targetMinutes<720?0:targetMinutes<1080&&targetMinutes>=720?1:targetMinutes>=1080&&targetMinutes<1260?2:3;
  const mission=(n,type,title,prompt,options,explanation,clocks,extra={})=>({id:`${code}-time-${String(n).padStart(2,'0')}`,domain:'time',cityJa:place.cityJa,zone:place.zone,type,title,prompt,points:10,universalTime:true,options,explanation,clocks,sourceIds:['iana-2026f'],...extra});
  const missions=[
    mission(1,'live-time-compare','同じ瞬間、二つの時計',`2026年1月15日、東京が12:00のとき、${place.cityJa}は東京よりどれだけ進む・遅れる？`,choices(gapText(gap),[gapText(gap+60),gapText(gap-60),gapText(gap+120)],seed),`${place.cityJa}は${formatOffset(offsetAt(place.zone,jan))}、東京はUTC+09:00。${gapText(gap)}です。日付も一緒に確かめよう。`,[clock(jp,jan),clock(place,jan)],{liveZones:[jp,place]}),
    mission(2,'clock-offset',`時計を動かそう：東京から${place.cityJa}`,`東京の2026年1月15日12:00を、${place.cityJa}の日付と時刻に直そう。練習用の時計も動かせます。`,shiftedChoices(place.zone,jan,seed+1),`${formatStamp(jp.zone,jan)}（東京）と${formatStamp(place.zone,jan)}（${place.cityJa}）は同じ瞬間です。`,[clock(jp,jan),clock(place,jan,true)],{dial:true}),
    mission(3,'time-travel-lap',`${place.cityJa}発！日本の時刻を作れ`,`${place.cityJa}の2026年7月15日23:30は、東京ではいつ？日付が変わるかにも注目しよう。`,shiftedChoices(jp.zone,jul,seed+2),`${place.cityJa}は${formatOffset(offsetAt(place.zone,jul))}。東京では${formatStamp(jp.zone,jul)}です。`,[clock(place,jul),clock(jp,jul,true)],{dial:true}),
    mission(4,'time-zone-express','SAME-TIME HUNT',`東京の2026年1月15日12:00と同じ瞬間。${place.cityJa}と同じ日付・時刻になる都市を探そう。候補：${huntOptions.join('／')}。`,choices(huntAnswer,[...huntOptions,'この3都市にはない'],seed+3),`${place.cityJa}のオフセットは${formatOffset(offsetAt(place.zone,jan))}。${same?`${huntAnswer}も同じオフセットです。`:'候補の3都市はいずれもオフセットが異なります。'}国全体ではなく、ここに書いた都市で比べています。`,[clock(place,jan)]),
    mission(5,'clock-tower-rescue','時計塔レスキュー',`${place.cityJa}の2026年7月15日18:30。${towerCity.cityJa}の時計塔を、正しい日付と時刻に直そう。`,shiftedChoices(towerCity.zone,evening,seed+4),`同じ瞬間の${towerCity.cityJa}は${formatStamp(towerCity.zone,evening)}。時計の数字だけでなく日付も直すと救出成功です。`,[clock(place,evening),clock(towerCity,evening,true)],{dial:true}),
    mission(6,'daypart-match','時間帯の探偵',`${place.cityJa}の2026年7月15日18:30。${destination.cityJa}の時計は、次のどの時間帯？ここでは選択肢の時刻で区分します。`,choices(periods[period],periods,seed+5),`${destination.cityJa}では${formatStamp(destination.zone,evening)}なので「${periods[period]}」。この区分は時計の時刻によるもので、実際の日照や生活習慣を決めつけるものではありません。`,[clock(place,evening),clock(destination,evening,true)]),
    mission(7,'season-time-shift','季節と時差の実験室',`2026年1月15日と7月15日、どちらも東京12:00で比較。${place.cityJa}の東京に対する時差はどう変わる？`,choices(changeText,[change===0?'7月のほうが1時間進む':'時差は同じ','7月のほうが1時間遅れる','7月のほうが2時間進む','7月のほうが2時間遅れる'],seed+6),`1月は${formatOffset(offsetAt(place.zone,jan))}、7月は${formatOffset(offsetAt(place.zone,summer))}。${changeText}です。季節による制度は国・年で変わるので、指定日で確認します。`,[clock(place,jan),clock(place,summer)]),
    mission(8,'time-order-race','世界の時計を並べよう',`同じ瞬間（東京2026年1月15日12:00）の3都市。現地の「日付と時刻」が早い順に並べよう。翌日・前日も含めて比べます。`,choices(orderLabel(sorted),[[c,b,a],[b,a,c],[a,c,b]].map(orderLabel),seed+7),`${sorted.map(p=>`${p.cityJa} ${formatStamp(p.zone,jan)}`).join(' → ')}。24時間表示の数字だけでなく、日付を先に比較します。`,orderPlaces.map(p=>clock(p,jan))),
    mission(9,'school-overlap-planner','学校交流の時間を調整しよう',`2026年7月15日の東京と${place.cityJa}。両校の授業時間をそれぞれ08:30〜16:00と仮定します。30分の交流が最初から最後まで授業時間内に収まる計画は？`,choices(schoolAnswer,schoolWrong,seed+8),windows.length?`東京${windows[0]}開始なら、${place.cityJa}は${formatStamp(place.zone,localInstant(jp.zone,'2026-07-15',windows[0]))}開始。どちらも30分間を授業時間内に収められます。これは練習用の時間割です。`:'この条件では30分の共通時間がありません。録画を送り、相手の授業時間に返事をもらう方法なら交流できます。実際の時間割は学校同士で相談しましょう。',[],{schoolWindows:windows}),
    mission(10,'time-traveler-final','旅の到着日時を解こう',`${place.cityJa}を現地2026年1月15日22:30に出発。移動時間を12時間としたとき、東京の到着日時は？練習用の架空の旅で、実際の便・所要時間ではありません。`,shiftedChoices(jp.zone,arrival,seed+9),`出発をUTCに直すと${formatStamp('UTC',departure)}。12時間を足し、東京のUTC+09:00に直すと${formatStamp(jp.zone,arrival)}です。`,[clock(place,departure),clock(jp,arrival,true)])
  ];
  const result={countryCode:code,countryNameJa:country.nameJa,countryNameEn:country.nameEn,cityJa:place.cityJa,zone:place.zone,domain:'time',schemaVersion:2,sources:[TIME_SOURCE],missions};
  cache.set(code,result);return result;
}
