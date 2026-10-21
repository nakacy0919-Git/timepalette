// TimePalette Mission Factory v1: pure, browser- and Node-compatible validation.
// No data is uploaded or published by this module.
export const FACTORY_VERSION = 'timepalette-mission-factory/v1';
export const FACTORY_MAX_QUESTIONS = 5;
export const FACTORY_MAX_ZIP_BYTES = 40 * 1024 * 1024;
export const FACTORY_MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const FACTORY_MAX_UNPACKED_BYTES = 85 * 1024 * 1024;

const DOMAINS = new Set(['place','time','language','lifeCulture','japanConnection','thinkConnect']);
const TYPES = new Set(['text4','photoText4','photo4']);
const LEVELS = new Set(['elementary','juniorHigh','highSchoolStandard','highSchoolAdvanced']);
const DEFAULT_LEVELS = ['elementary','juniorHigh','highSchoolStandard'];
const IMAGE_FILE = /^images\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,95}\.(?:png|jpe?g|webp)$/i;

function stringField(value,name,max,{required=false}={}) {
  if(typeof value!=='string')throw new Error(`${name} は文字列で入力してください。`);
  const v=value.trim();
  if((required&&!v)||v.length>max)throw new Error(`${name} の文字数・内容を確認してください（最大${max}文字）。`);
  return v;
}
function stringArray(value,name,length,max,{required=true}={}) {
  if(!Array.isArray(value)||value.length>length||(required&&value.length!==length))
    throw new Error(`${name} は${length}件${required?'ちょうど':'以内'}で指定してください。`);
  return value.map((x,i)=>stringField(x,`${name}[${i}]`,max,{required}));
}
export function normalizedFactoryPrompt(q) {
  return [String(q.countryIso||'').trim().toLowerCase(),String(q.domain||'').trim(),
    String(q.prompt||'').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase()].join('|');
}
function normalizedImages(raw,type,label){
  const required=type==='photo4'?4:type==='photoText4'?1:0;
  if(required===0){
    if(raw && Object.keys(raw).length)throw new Error(`${label}: 文章4択に画像を指定できません。`);
    return [];
  }
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${label}: images オブジェクトが必要です。`);
  const slots=Object.keys(raw).sort();
  const expected=Array.from({length:required},(_,i)=>String(i+1));
  if(JSON.stringify(slots)!==JSON.stringify(expected))
    throw new Error(`${label}: 画像スロット ${expected.join(', ')} を指定してください。`);
  return expected.map(s=>{
    const path=raw[s];
    if(typeof path!=='string'||!IMAGE_FILE.test(path))throw new Error(`${label}: 安全な画像パス images/filename.png を使ってください。`);
    return {slot:Number(s),path};
  });
}
export function validateFactoryManifest(manifest,existingQuestions=[]) {
  if(!manifest||typeof manifest!=='object'||Array.isArray(manifest)||manifest.version!==FACTORY_VERSION)
    throw new Error(`questions.json の version は ${FACTORY_VERSION} にしてください。`);
  if(!Array.isArray(manifest.questions)||manifest.questions.length<1||manifest.questions.length>FACTORY_MAX_QUESTIONS)
    throw new Error(`一括登録は1〜${FACTORY_MAX_QUESTIONS}問までです。`);
  const existing=new Set((Array.isArray(existingQuestions)?existingQuestions:[])
    .filter(q=>q?.status!=='deleted').map(normalizedFactoryPrompt));
  const seen=new Set();
  const items=manifest.questions.map((raw,i)=>{
    const label=`問題${i+1}`;
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error(`${label}: 問題データが不正です。`);
    const countryIso=stringField(raw.countryIso,`${label} countryIso`,2,{required:true}).toLowerCase();
    if(!/^[a-z]{2}$/.test(countryIso))throw new Error(`${label}: 国コードは2文字のISOコードにしてください。`);
    const domain=stringField(raw.domain,`${label} domain`,30,{required:true});
    if(!DOMAINS.has(domain))throw new Error(`${label}: カテゴリーが不正です。`);
    const type=stringField(raw.type,`${label} type`,20,{required:true});
    if(!TYPES.has(type))throw new Error(`${label}: 対応形式は text4 / photoText4 / photo4 です。`);
    const prompt=stringField(raw.prompt,`${label} prompt`,2000,{required:true});
    const answer=stringField(raw.answer,`${label} answer`,1500,{required:true});
    const choices=type==='photo4'?['','','']:stringArray(raw.choices,`${label} choices`,3,600);
    if(type!=='photo4'&&(new Set([answer,...choices]).size!==4))
      throw new Error(`${label}: 正答と誤答3つは、重複のない別々の文章にしてください。`);
    if(type==='photo4'&&!/^写真スロット\s*[1-4]$/.test(answer))
      throw new Error(`${label}: 写真4択のanswerは「写真スロット 1」などとしてください。`);
    const notes=stringField(raw.notes||'',`${label} notes`,5000);
    const sources=stringArray(raw.sources||[],`${label} sources`,2,1500,{required:false});
    if(sources.some(s=>!/^https?:\/\//i.test(s)))throw new Error(`${label}: sourcesにはhttp(s)のURLのみ指定できます。`);
    const levels=raw.learning?.levels===undefined?[...DEFAULT_LEVELS]:raw.learning.levels;
    if(!Array.isArray(levels)||!levels.length||levels.length>4||levels.some(l=>!LEVELS.has(l))||new Set(levels).size!==levels.length)
      throw new Error(`${label}: 対象レベルを重複なしで1〜4つ指定してください。`);
    const c=raw.learning?.challenge||{};
    const challenge={promptEn:String(c.promptEn||'').trim(),answerEn:String(c.answerEn||'').trim(),
      choicesEn:Array.isArray(c.choicesEn)?c.choicesEn.map(x=>String(x||'').trim()):[],
      explanationEn:String(c.explanationEn||'').trim()};
    if(challenge.promptEn.length>2000||challenge.answerEn.length>1500||
      challenge.explanationEn.length>3500||challenge.choicesEn.length>3||challenge.choicesEn.some(x=>x.length>600))
      throw new Error(`${label}: Challenge英語版の文字数を確認してください。`);
    if(levels.includes('highSchoolAdvanced')){
      if(!challenge.promptEn)throw new Error(`${label}: Challengeには英語問題文が必要です。`);
      if(type!=='photo4'&&
        (challenge.choicesEn.length!==3||![challenge.answerEn,...challenge.choicesEn].every(Boolean)||
          new Set([challenge.answerEn,...challenge.choicesEn]).size!==4))
        throw new Error(`${label}: Challengeには英語の正答と誤答3つが必要です。`);
    }
    const images=normalizedImages(raw.images,type,label);
    const question={countryIso,domain,type,prompt,answer,choices,
      notes,sources,learning:{levels:[...levels],challenge},
      authorProfile:{name:'',school:'',region:'',bio:'',consent:false}};
    const key=normalizedFactoryPrompt(question);
    if(seen.has(key))throw new Error(`${label}: ZIP内で問題文が重複しています。`);
    seen.add(key);
    return {label,question,images,duplicate:existing.has(key)};
  });
  return items;
}
