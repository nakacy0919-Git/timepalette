// Bilingual question content. Both languages share one immutable answer index.
export function hasEnglishQuestion(q){
 const en=q?.translations?.en;
 return !!en&&typeof en.prompt==='string'&&!!en.prompt.trim()&&typeof en.explanation==='string'&&!!en.explanation.trim()&&Array.isArray(en.choices)&&en.choices.length===q.choices?.length&&en.choices.every(x=>typeof x==='string'&&x.trim())&&new Set(en.choices).size===en.choices.length&&!/[\u3040-\u30ff\u3400-\u9fff]/.test([en.prompt,en.explanation,...en.choices].join(' '));
}
// Project a single language before shuffling choices. A missing translation never silently falls back to Japanese in English mode.
export function localizeQuestion(q,language='ja'){
 if(language==='en'&&!hasEnglishQuestion(q))return null;
 const {translations,...base}=q;
 return language==='en'?{...base,...translations.en,correctIndex:q.correctIndex,id:q.id,country:q.country,domain:q.domain,language:'en'}:{...base,language:'ja'};
}
export const capitalRolesEn={'首都':'capital','政府所在地':'seat of government','主要都市':'major city','主張される首都':'claimed capital','行政の首都':'administrative capital'};
const notes={
 bi:'Gitega is the political capital, distinct from Bujumbura.',
 bj:'Porto-Novo is the capital, distinct from Cotonou.',
 bo:'Sucre is the constitutional capital; La Paz is the seat of government.',
 ch:'Bern is the federal city and seat of the federal government.',
 eh:'The status of Western Sahara is disputed. This question identifies a major city, not a universally recognized capital.',
 gq:'Ciudad de la Paz was declared the capital in January 2026; some capital functions remain in Malabo.',
 id:'This lesson uses Jakarta as the current capital, distinct from the planned relocation to Nusantara.',
 il:'Israel considers Jerusalem its capital. Its international status is disputed.',
 lk:'This lesson uses Sri Jayewardenepura Kotte, distinct from Colombo.',
 my:'Kuala Lumpur is the capital; Putrajaya is the administrative center.',
 nl:'Amsterdam is the capital; The Hague is the seat of government and parliament.',
 nr:'Nauru has no officially designated capital; government offices are in Yaren district.',
 ps:'Palestine claims East Jerusalem as its capital; Ramallah is its administrative center. International status is disputed.',
 pw:'Ngerulmud is in Melekeok State, distinct from the former capital Koror.',
 ye:'Sanaa is the constitutional capital; Aden is the temporary seat of government.',
 za:'Pretoria is the administrative capital; Cape Town is the legislative center and Bloemfontein the judicial center.'
};
export function englishCapital(profile,choices,byJapanese){
 const role=capitalRolesEn[profile.capitalRoleJa],country=profile.nameEn;
 const options=choices.map(x=>byJapanese.get(x));
 if(!role||!country||options.some(x=>!x)||new Set(options).size!==4)return null;
 const prompt=profile.countryCode==='eh'?'Which of these cities is a major city in Western Sahara?':`Which city is the ${role} of ${country}?`;
 return {prompt,choices:options,explanation:`${options[0]} is the answer. ${notes[profile.countryCode]||`${options[0]} is the ${role} of ${country}.`}`};
}
function gapLabel(label){
 if(label==='東京と同じ時刻')return 'The same local time as Tokyo';
 const m=/^東京より(\d+)時間(?:(\d+)分)?(遅い|早い)$/.exec(label);
 if(!m)return null;
 const h=Number(m[1]),min=Number(m[2]||0);
 const parts=[h?h+' hour'+(h===1?'':'s'):'',min?min+' minute'+(min===1?'':'s'):''].filter(Boolean).join(' ');
 return parts+' '+(m[3]==='遅い'?'behind':'ahead of')+(m[3]==='遅い'?' Tokyo':' Tokyo');
}
export function englishTime(m,place){
 if(!place?.cityEn)return null;
 const city=place.cityEn;
 const options=m.options.map(o=>m.type==='live-time-compare'?gapLabel(o.label):o.label);
 if(options.some(x=>!x))return null;
 const correct=options[m.options.findIndex(o=>o.correct)];
 if(m.type==='live-time-compare')return {prompt:`On January 15, 2026, when it is 12:00 in Tokyo, how far ahead of or behind Tokyo is ${city}?`,choices:options,explanation:`The local time in ${city} is ${correct.toLowerCase()}. Compare both cities at the same instant, using their time-zone offsets on this date.`};
 if(m.type==='clock-offset')return {prompt:`When it is 12:00 in Tokyo on January 15, 2026, what are the local date and time in ${city}?`,choices:options,explanation:`The local date and time in ${city} are ${correct}. This represents the same instant as January 15, 2026, 12:00 in Tokyo.`};
 if(m.type==='time-travel-lap')return {prompt:`When it is 23:30 in ${city} on July 15, 2026, what are the local date and time in Tokyo?`,choices:options,explanation:`At that same instant, it is ${correct} in Tokyo. Remember that the local date may also change.`};
 return null;
}
