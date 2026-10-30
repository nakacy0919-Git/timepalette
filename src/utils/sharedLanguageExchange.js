// Shared, cumulative English exchange missions for every TimePalette country.
// Generated from the canonical country registry; no separate 1,970-row question bank.
// Country-specific statements are limited to verified metadata in countries_*.json.
const countryModules = import.meta.glob('../data/countries_*.json', { eager: true });
const countryIndex = Object.fromEntries(
  Object.values(countryModules).flatMap(module =>
    Object.entries(module.default ?? module ?? {}).map(([iso, data]) => [iso.toLowerCase(), data])
  )
);
const cache = new Map();
export const SHARED_EXCHANGE_MISSION_COUNT = 10;
export const getSharedExchangeCountryCodes = () => Object.keys(countryIndex).sort();

const PROFILE_FIELDS = [
  { id: 'name', label: '名前（英語）', placeholder: 'Sara' },
  { id: 'nameKana', label: '名前の読み（任意・カタカナ）', placeholder: 'サラ', required: false },
  { id: 'homeCountry', label: '出身の国（英語）', placeholder: 'Japan' },
  { id: 'city', label: '住んでいる場所（英語）', placeholder: 'Anjo, Aichi' },
  { id: 'school', label: '学校名（英語）', placeholder: 'Riverside High School' },
  { id: 'hobby', label: '趣味（英語）', placeholder: 'playing soccer' },
  { id: 'food', label: '好きな食べ物（英語）', placeholder: 'sushi' },
];

function makeTurns(country) {
  const countryName = country.nameEn || country.iso?.toUpperCase() || 'your country';
  const food = country.culture?.find(item => item.titleEn)?.titleEn;
  const partnerFood = food
    ? `In ${countryName}, people enjoy ${food}.`
    : `Our country has many different local dishes.`;
  return [
    { label:'HELLO', partnerPhrase:'Hello!', partnerJa:'こんにちは！',
      phrase:'Hello! Nice to meet you.', translation:'こんにちは！はじめまして。',
      kana:'ハロー！ナイス トゥ ミート ユー。' },
    { label:'MY NAME', partnerPhrase:"What's your name?", partnerJa:'お名前は何ですか？',
      phrase:'My name is {{name}}.', translation:'私の名前は{{name}}です。',
      kana:'マイ ネーム イズ {{nameKana}}。' },
    { label:'ASK A NAME', partnerPhrase:'Nice to meet you, too!', partnerJa:'こちらこそ！',
      phrase:"What's your name?", translation:'あなたのお名前は何ですか？',
      kana:'ワッツ ユア ネーム？' },
    { label:'COUNTRY & HOME', partnerPhrase:`I'm Alex. I'm from ${countryName}. Where are you from?`,
      partnerJa:`私はアレックス。${country.nameJa || countryName}から来ました。あなたは？`,
      phrase:"I'm from {{homeCountry}}. I live in {{city}}.", translation:'私は{{homeCountry}}出身で、{{city}}に住んでいます。',
      kana:'アイム フロム {{homeCountry}}。アイ リヴ イン {{city}}。' },
    { label:'MY SCHOOL', partnerPhrase:'What school do you go to?', partnerJa:'どこの学校に通っていますか？',
      phrase:'I go to {{school}}. What is your school like?', translation:'私は{{school}}に通っています。あなたの学校はどんなところ？',
      kana:'アイ ゴウ トゥ {{school}}。ワット イズ ユア スクール ライク？' },
    { label:'HOBBIES', partnerPhrase:'What do you like to do?', partnerJa:'何をするのが好きですか？',
      phrase:'I like {{hobby}}. What do you like?', translation:'私は{{hobby}}が好きです。あなたは？',
      kana:'アイ ライク {{hobby}}。ワット ドゥ ユー ライク？' },
    { label:'FOOD QUESTION', partnerPhrase:'What food do you like?', partnerJa:'どんな食べ物が好きですか？',
      phrase:'I like {{food}}. What food is popular in your country?', translation:'私は{{food}}が好き。あなたの国ではどんな食べ物が人気ですか？',
      kana:'アイ ライク {{food}}。ワット フード イズ ポピュラー イン ユア カントリー？' },
    { label:'CULTURE & REACTION', partnerPhrase:partnerFood, partnerJa:'相手が自分の国の料理を紹介しました。',
      phrase:'That sounds delicious! Tell me more about your country.', translation:'おいしそう！あなたの国のことをもっと教えて。',
      kana:'ザット サウンズ デリシャス！テル ミー モア アバウト ユア カントリー。' },
    { label:'SCHOOL CULTURE', partnerPhrase:"What's school life like in your country?", partnerJa:'あなたの国の学校生活はどんな感じ？',
      phrase:'At my school, we learn many things. What about your school?', translation:'私の学校ではたくさんのことを学びます。あなたの学校は？',
      kana:'アット マイ スクール、ウィー ラーン メニー シングズ。ワット アバウト ユア スクール？' },
    { label:'GOODBYE', partnerPhrase:'Thank you for sharing your story!', partnerJa:'話してくれてありがとう！',
      phrase:'Thank you! It was nice talking with you. See you again!', translation:'ありがとう！お話しできて楽しかったです。また会いましょう！',
      kana:'サンキュー！イット ワズ ナイス トーキング ウィズ ユー。シー ユー アゲイン！' },
  ];
}
const TITLES = [
  ['世界にあいさつ','Say Hello'],
  ['自分の名前を伝えよう','Introduce Yourself'],
  ['相手の名前を聞こう','Ask a Name'],
  ['出身国と住む場所','Where Are You From?'],
  ['学校について話そう','Talk About School'],
  ['好きなことを聞こう','Talk About Hobbies'],
  ['食文化を聞こう','Ask About Food'],
  ['文化をもっと知ろう','Learn About Culture'],
  ['学校生活を比べよう','Compare School Life'],
  ['世界とつながろう','World Communicator'],
];
export function getSharedLanguagePackage(iso) {
  const code = String(iso || '').toLowerCase();
  const country = countryIndex[code];
  if (!country) return null;
  if (cache.has(code)) return cache.get(code);
  const turns = makeTurns(country);
  const missions = TITLES.map(([ja,en],index) => ({
    id: `${code}-language-shared-${String(index+1).padStart(2,'0')}`,
    domain: 'language', type: 'conversation-practice', buildStatus: 'ready',
    icon: index===9 ? '🏆' : '🗣️', points: 10, finalGoal: index===9,
    title: { ja, en }, action: '相手の英語を聞いて、マイクで答えよう。前のミッションの表現も使います。',
    speech: {
      goal: `STEP ${index+1}/10：${ja}（${index+1}フレーズ）`,
      // Profile is shared with all countries and can be revised at any time.
      languageCode: 'en-US',
      fields: index===0 ? [] : PROFILE_FIELDS,
      steps: turns.slice(0,index+1),
    },
  }));
  const result = {
    schemaVersion:'TimePalette Shared Language Exchange v1',
    countryCode:code, domain:'language',
    country:{nameJa:country.nameJa || code,nameEn:country.nameEn || code,flag:country.flagEmoji || '🌍'},
    featuredLanguage:{name:'English',nativeName:'English',
      noteJa:'197か国で共通の英語交流。相手の文化を尊重しながら、前のミッションの表現を繰り返して使います。'},
    missions,
  };
  cache.set(code,result);
  return result;
}


// Spanish is available as an additional choice in these 20 sovereign countries.
export const SPANISH_EXCHANGE_COUNTRY_CODES = Object.freeze([
 'ar','bo','cl','co','cr','cu','do','ec','es','gq',
 'gt','hn','mx','ni','pa','pe','py','sv','uy','ve',
]);
const spanishCountrySet = new Set(SPANISH_EXCHANGE_COUNTRY_CODES);
export const isSpanishExchangeCountry = iso => spanishCountrySet.has(String(iso || '').trim().toLowerCase());
const spanishNames = {
 ar:'Argentina',bo:'Bolivia',cl:'Chile',co:'Colombia',cr:'Costa Rica',
 cu:'Cuba',do:'República Dominicana',ec:'Ecuador',es:'España',gq:'Guinea Ecuatorial',
 gt:'Guatemala',hn:'Honduras',mx:'México',ni:'Nicaragua',pa:'Panamá',
 pe:'Perú',py:'Paraguay',sv:'El Salvador',uy:'Uruguay',ve:'Venezuela',
};
const spanishProfileFields = [
 {id:'name',label:'名前（アルファベット）',placeholder:'Sara'},
 {id:'nameKana',label:'名前の読み（任意・カタカナ）',placeholder:'サラ',required:false},
 {id:'homeCountry',label:'出身国（スペイン語）',placeholder:'Japón'},
 {id:'city',label:'住んでいる街（アルファベット）',placeholder:'Anjo'},
 {id:'school',label:'学校名（アルファベット）',placeholder:'Riverside High School'},
 {id:'hobby',label:'趣味（スペイン語の動詞の原形）',placeholder:'jugar al fútbol'},
 {id:'food',label:'好きな食べ物（スペイン語）',placeholder:'sushi'},
];
const spanishTitles=[
 ['スペイン語であいさつ','Saluda en español'],
 ['自分の名前を伝える','Preséntate'],
 ['相手の名前を聞く','Pregunta el nombre'],
 ['出身地と住む街を話す','Tu país y ciudad'],
 ['自分の学校を紹介する','Tu escuela'],
 ['趣味について話す','Tus aficiones'],
 ['好きな食べ物を話す','Tu comida favorita'],
 ['相手の文化に関心を示す','Conoce su cultura'],
 ['学校生活について交流する','La vida escolar'],
 ['お礼を伝えて別れる','¡Hasta pronto!'],
];
function makeSpanishTurns(code){
 const name=spanishNames[code];
 const nameJa=countryIndex[code].nameJa || name;
 return [
  {label:'¡HOLA!',partnerPhrase:'¡Hola!',partnerJa:'こんにちは！',
    phrase:'¡Hola! Mucho gusto.',translation:'こんにちは！はじめまして。',kana:'オラ！ムーチョ グスト。'},
  {label:'MI NOMBRE',partnerPhrase:'¿Cómo te llamas?',partnerJa:'名前は何ですか？',
    phrase:'Me llamo {{name}}.',translation:'私は{{name}}です。',kana:'メ ジャモ {{nameKana}}。'},
  {label:'TU NOMBRE',partnerPhrase:'¡Mucho gusto!',partnerJa:'はじめまして！',
    phrase:'¿Cómo te llamas?',translation:'あなたの名前は何ですか？',kana:'コモ テ ジャマス？'},
  {label:'MI PAÍS',partnerPhrase:'Me llamo Alex. Soy de '+name+'. ¿De dónde eres?',
    partnerJa:'私はアレックス。出身は'+nameJa+'です。あなたはどこから？',
    phrase:'Soy de {{homeCountry}}. Vivo en {{city}}.',
    translation:'私は{{homeCountry}}出身で、{{city}}に住んでいます。',
    kana:'ソイ デ {{homeCountry}}。ビボ エン {{city}}。'},
  {label:'MI ESCUELA',partnerPhrase:'¿A qué escuela vas?',partnerJa:'どこの学校に通っていますか？',
    phrase:'Estudio en {{school}}. ¿Y tú?',translation:'私は{{school}}で勉強しています。あなたは？',
    kana:'エストゥディオ エン {{school}}。イ トゥ？'},
  {label:'MIS AFICIONES',partnerPhrase:'¿Qué te gusta hacer?',partnerJa:'何をするのが好きですか？',
    phrase:'Me gusta {{hobby}}. ¿Y a ti?',translation:'私は{{hobby}}が好きです。あなたは？',
    kana:'メ グスタ {{hobby}}。イ ア ティ？'},
  {label:'MI COMIDA',partnerPhrase:'¿Cuál es tu comida favorita?',partnerJa:'好きな食べ物は何ですか？',
    phrase:'Me gusta comer {{food}}. ¿Y a ti?',translation:'私は{{food}}を食べるのが好きです。あなたは？',
    kana:'メ グスタ コメール {{food}}。イ ア ティ？'},
  {label:'TU CULTURA',partnerPhrase:'En mi país tenemos muchas tradiciones.',partnerJa:'私の国にはいろいろな伝統があります。',
    phrase:'¡Qué interesante! Cuéntame más sobre tu país.',
    translation:'おもしろそう！あなたの国についてもっと教えてください。',
    kana:'ケ インテレサンテ！クエンタメ マス ソブレ トゥ パイス。'},
  {label:'LA ESCUELA',partnerPhrase:'¿Cómo es la vida escolar en tu país?',partnerJa:'あなたの国の学校生活はどんな感じですか？',
    phrase:'En mi escuela aprendemos muchas cosas. ¿Y en la tuya?',
    translation:'私の学校では多くのことを学びます。あなたの学校は？',
    kana:'エン ミ エスクエラ アプレンデモス ムーチャス コサス。イ エン ラ トゥジャ？'},
  {label:'¡ADIÓS!',partnerPhrase:'¡Gracias por compartir tu historia!',partnerJa:'いろいろ教えてくれてありがとう！',
    phrase:'¡Gracias por hablar conmigo! ¡Hasta pronto!',
    translation:'お話ししてくれてありがとう！また会いましょう！',
    kana:'グラシアス ポル アブラール コンミゴ！アスタ プロント！'},
 ];
}
const spanishPackageCache = new Map();
export function getSpanishLanguagePackage(iso){
 const code=String(iso || '').trim().toLowerCase();
 if(!isSpanishExchangeCountry(code)||!countryIndex[code])return null;
 if(spanishPackageCache.has(code))return spanishPackageCache.get(code);
 const country=countryIndex[code], turns=makeSpanishTurns(code);
 const locale=code==='es'||code==='gq'?'es-ES':'es-MX';
 const missions=spanishTitles.map(([ja,en],index)=>({
   id:code+'-language-es-'+String(index+1).padStart(2,'0'),
   domain:'language',type:'conversation-practice',buildStatus:'ready',
   icon:index===9?'🏆':'🗣️',points:10,finalGoal:index===9,
   title:{ja,en},action:'スペイン語を聞いてマイクで答えよう。前のフレーズも繰り返して使います。',
   speech:{languageCode:locale,
     goal:'PASO '+(index+1)+'/10：'+ja+'（'+(index+1)+'フレーズ）',
     fields:index===0?[]:spanishProfileFields,
     steps:turns.slice(0,index+1)},
 }));
 const result={schemaVersion:'TimePalette Shared Spanish Exchange v1',
  countryCode:code,domain:'language',
  country:{nameJa:country.nameJa||code,nameEn:country.nameEn||code,flag:country.flagEmoji||'🌍'},
  featuredLanguage:{name:'Spanish',nativeName:'Español',noteJa:'スペイン語圏20か国で段階的にあいさつから文化交流まで練習します。'},
  missions};
 spanishPackageCache.set(code,result);
 return result;
}
