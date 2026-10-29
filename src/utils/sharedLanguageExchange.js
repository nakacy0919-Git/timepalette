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
  { id: 'school', label: '学校名（英語）', placeholder: 'ABC Elementary School' },
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
