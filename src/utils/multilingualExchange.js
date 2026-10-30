
// TimePalette Language & Communication: multilingual pilot wave.
// Language eligibility lists include sovereign countries only; do not infer a
// country's everyday home language from its official-language designation.
// Browser speech-recognition and speech-synthesis support require device checks.
import {getSharedLanguagePackage, getSharedExchangeCountryCodes, getSpanishLanguagePackage, isSpanishExchangeCountry} from './sharedLanguageExchange.js';

const COMMON_TITLES=[
 ['あいさつしよう','Greetings'],['自分の名前を言おう','Introduce yourself'],
 ['相手の名前を聞こう','Ask a name'],['出身地と住む街','Country and city'],
 ['自分の学校','My school'],['趣味を伝えよう','My hobbies'],
 ['好きな食べ物','Favorite food'],['文化に関心を示そう','Culture'],
 ['学校生活を話そう','School life'],['お礼と別れのあいさつ','Goodbye'],
];
const COMMON_TRANSLATIONS=[
 'こんにちは！はじめまして。','私の名前は{{name}}です。','あなたのお名前は何ですか？',
 '私の出身国は{{homeCountry}}です。{{city}}に住んでいます。',
 '私の学校は{{school}}です。あなたは？',
 '私は{{hobby}}が好きです。あなたは？',
 '私は{{food}}を食べるのが好きです。あなたは？',
 '面白そうですね！あなたの国についてもっと教えてください。',
 '私の学校ではたくさん学びます。あなたの学校はどうですか？',
 'お話ししてくれてありがとう！また会いましょう！',
];
const PARTNER_TRANSLATIONS=[
 'こんにちは！','お名前は？','こちらこそ、はじめまして！',
 '私はこの国に住んでいます。あなたはどこから来ましたか？',
 'どこの学校に通っていますか？','何をするのが好きですか？',
 '好きな食べ物は何ですか？','私の国にはさまざまな伝統があります。',
 'あなたの国の学校生活はどんな感じですか？','お話ししてくれてありがとう！',
];
// Spoken words are native examples; locale tags may be adjusted by the user agent.
export const FIRST_WAVE_LANGUAGES = Object.freeze([
 {
  id:'fr',name:'French',nativeName:'Français',nameJa:'フランス語',locale:'fr-FR',
  localeOverrides:{ca:'fr-CA'},
  countries:['be','bj','bi','cm','ca','cf','td','km','cg','cd','ci','dj','gq','fr','ga','gn','ht','lu','mg','mc','rw','sn','sc','ch','tg','vu'],
  profile:{homeCountry:'Japon',hobby:'jouer au football',food:'des sushis'},
  phrases:['Bonjour ! Enchanté !',"Je m'appelle {{name}}.","Comment tu t'appelles ?",
   "Mon pays, c'est {{homeCountry}}. J'habite à {{city}}.",
   "Mon école s'appelle {{school}}. Et toi ?",
   "J'aime {{hobby}}. Et toi ?","J'aime manger {{food}}. Et toi ?",
   "C'est intéressant ! Parle-moi de ton pays.",
   "Dans mon école, nous apprenons beaucoup. Et chez toi ?",
   "Merci pour cette conversation ! À bientôt !"],
  partners:['Bonjour !',"Comment tu t'appelles ?",'Enchanté !',
   "Je vis ici. Et toi, d'où viens-tu ?","Comment s'appelle ton école ?",
   "Qu'est-ce que tu aimes faire ?","Quel est ton plat préféré ?",
   "Il y a beaucoup de traditions dans mon pays.",
   "Comment est la vie scolaire dans ton pays ?",'Merci de m’avoir parlé !'],
 },
 {
  id:'pt',name:'Portuguese',nativeName:'Português',nameJa:'ポルトガル語',locale:'pt-PT',
  localeOverrides:{br:'pt-BR'},
  countries:['br','pt','ao','mz','cv','gw','st','gq','tl'],
  profile:{homeCountry:'Japão',hobby:'jogar futebol',food:'sushi'},
  phrases:['Olá! Muito prazer!','Meu nome é {{name}}.','Qual é o seu nome?',
   'Meu país é {{homeCountry}}. Moro em {{city}}.',
   'Minha escola se chama {{school}}. E a sua?',
   'Gosto de {{hobby}}. E você?','Gosto de comer {{food}}. E você?',
   'Que interessante! Conte-me mais sobre seu país.',
   'Na minha escola, aprendemos muitas coisas. E na sua?',
   'Foi bom conversar com você! Até logo!'],
  partners:['Olá!','Qual é o seu nome?','Muito prazer!',
   'Eu moro neste país. De onde você é?','Como se chama a sua escola?',
   'O que você gosta de fazer?','Qual é a sua comida favorita?',
   'No meu país temos muitas tradições.','Como é a vida escolar no seu país?',
   'Obrigado por conversar comigo!'],
 },
 {
  id:'de',name:'German',nativeName:'Deutsch',nameJa:'ドイツ語',locale:'de-DE',
  localeOverrides:{at:'de-AT',ch:'de-CH'},
  countries:['de','at','ch','be','lu','li'],
  profile:{homeCountry:'Japan',hobby:'Fußball spielen',food:'Sushi'},
  phrases:['Hallo! Schön, dich kennenzulernen!','Ich heiße {{name}}.','Wie heißt du?',
   'Mein Heimatland ist {{homeCountry}}. Ich wohne in {{city}}.',
   'Meine Schule heißt {{school}}. Und deine?',
   'Ich mag {{hobby}}. Und du?','Ich esse gern {{food}}. Und du?',
   'Das klingt interessant! Erzähl mir mehr über dein Land.',
   'In meiner Schule lernen wir viel. Wie ist es bei dir?',
   'Danke für das Gespräch! Bis bald!'],
  partners:['Hallo!','Wie heißt du?','Freut mich!',
   'Ich wohne hier. Woher kommst du?','Wie heißt deine Schule?',
   'Was machst du gern?','Was isst du gern?',
   'In meinem Land gibt es viele Traditionen.',
   'Wie ist das Schulleben in deinem Land?','Danke für unser Gespräch!'],
 },
 {
  id:'it',name:'Italian',nativeName:'Italiano',nameJa:'イタリア語',locale:'it-IT',
  localeOverrides:{ch:'it-CH'},
  countries:['it','sm','ch'],
  profile:{homeCountry:'Giappone',hobby:'giocare a calcio',food:'sushi'},
  phrases:['Ciao! Piacere di conoscerti!','Mi chiamo {{name}}.','Come ti chiami?',
   'Il mio paese è {{homeCountry}}. Vivo a {{city}}.',
   'La mia scuola si chiama {{school}}. E la tua?',
   'Mi piace {{hobby}}. E a te?','Mi piace mangiare {{food}}. E a te?',
   'Che interessante! Raccontami del tuo paese.',
   'A scuola impariamo tante cose. E da te?',
   'Grazie per aver parlato con me! A presto!'],
  partners:['Ciao!','Come ti chiami?','Piacere!',
   'Vivo qui. Tu da dove vieni?','Come si chiama la tua scuola?',
   'Cosa ti piace fare?','Qual è il tuo cibo preferito?',
   'Nel mio paese abbiamo molte tradizioni.',
   'Com’è la vita scolastica nel tuo paese?','Grazie per la conversazione!'],
 },
 {
  id:'nl',name:'Dutch',nativeName:'Nederlands',nameJa:'オランダ語',locale:'nl-NL',
  localeOverrides:{be:'nl-BE'},
  countries:['nl','be','sr'],
  profile:{homeCountry:'Japan',hobby:'voetballen',food:'sushi'},
  phrases:['Hallo! Leuk je te ontmoeten!','Ik heet {{name}}.','Hoe heet jij?',
   'Mijn land is {{homeCountry}}. Ik woon in {{city}}.',
   'Mijn school heet {{school}}. En die van jou?',
   'Ik hou van {{hobby}}. En jij?','Ik eet graag {{food}}. En jij?',
   'Wat interessant! Vertel me meer over jouw land.',
   'Op school leren we veel. Hoe is dat bij jou?',
   'Bedankt voor het gesprek! Tot ziens!'],
  partners:['Hallo!','Hoe heet jij?','Leuk je te ontmoeten!',
   'Ik woon hier. Waar kom jij vandaan?','Hoe heet jouw school?',
   'Wat doe je graag?','Wat eet je graag?',
   'In mijn land hebben we veel tradities.',
   'Hoe is het schoolleven in jouw land?','Bedankt voor ons gesprek!'],
 },
 {
  id:'ms',name:'Malay',nativeName:'Bahasa Melayu',nameJa:'マレー語',locale:'ms-MY',
  countries:['my','bn','sg'],
  profile:{homeCountry:'Jepun',hobby:'bermain bola sepak',food:'sushi'},
  phrases:['Helo! Gembira berkenalan!','Nama saya {{name}}.','Siapa nama awak?',
   'Negara saya ialah {{homeCountry}}. Saya tinggal di {{city}}.',
   'Sekolah saya bernama {{school}}. Awak pula?',
   'Saya suka {{hobby}}. Awak pula?','Saya suka makan {{food}}. Awak pula?',
   'Menariknya! Ceritakan lagi tentang negara awak.',
   'Di sekolah saya, kami belajar banyak perkara. Bagaimana dengan sekolah awak?',
   'Terima kasih kerana berbual dengan saya! Jumpa lagi!'],
  partners:['Helo!','Siapa nama awak?','Gembira berkenalan!',
   'Saya tinggal di sini. Awak berasal dari mana?','Apa nama sekolah awak?',
   'Apa yang awak suka buat?','Apa makanan kegemaran awak?',
   'Negara saya mempunyai banyak tradisi.',
   'Bagaimana kehidupan sekolah di negara awak?','Terima kasih kerana berbual!'],
 },
 {
  id:'sv',name:'Swedish',nativeName:'Svenska',nameJa:'スウェーデン語',locale:'sv-SE',
  localeOverrides:{fi:'sv-FI'},
  countries:['se','fi'],
  profile:{homeCountry:'Japan',hobby:'spela fotboll',food:'sushi'},
  phrases:['Hej! Trevligt att träffas!','Jag heter {{name}}.','Vad heter du?',
   'Mitt hemland är {{homeCountry}}. Jag bor i {{city}}.',
   'Min skola heter {{school}}. Och din?',
   'Jag gillar att {{hobby}}. Och du?','Jag gillar att äta {{food}}. Och du?',
   'Vad intressant! Berätta mer om ditt land.',
   'I min skola lär vi oss mycket. Hur är det hos dig?',
   'Tack för samtalet! Vi ses snart!'],
  partners:['Hej!','Vad heter du?','Trevligt att träffas!',
   'Jag bor här. Var kommer du ifrån?','Vad heter din skola?',
   'Vad gillar du att göra?','Vilken mat gillar du?',
   'I mitt land har vi många traditioner.',
   'Hur är skollivet i ditt land?','Tack för samtalet!'],
 },
 {
  id:'ro',name:'Romanian',nativeName:'Română',nameJa:'ルーマニア語',locale:'ro-RO',
  countries:['ro','md'],
  profile:{homeCountry:'Japonia',hobby:'joc fotbal',food:'sushi'},
  phrases:['Bună! Îmi pare bine să te cunosc!','Mă numesc {{name}}.','Cum te cheamă?',
   'Țara mea este {{homeCountry}}. Locuiesc în {{city}}.',
   'Școala mea se numește {{school}}. Dar a ta?',
   'Îmi place să {{hobby}}. Dar ție?','Îmi place să mănânc {{food}}. Dar ție?',
   'Ce interesant! Spune-mi mai multe despre țara ta.',
   'La școala mea învățăm multe lucruri. Cum este la tine?',
   'Mulțumesc pentru conversație! Pe curând!'],
  partners:['Bună!','Cum te cheamă?','Îmi pare bine!',
   'Locuiesc aici. Tu de unde ești?','Cum se numește școala ta?',
   'Ce îți place să faci?','Care este mâncarea ta preferată?',
   'În țara mea avem multe tradiții.',
   'Cum este viața școlară în țara ta?','Mulțumesc că am vorbit!'],
 },
]);
const latinCountryCodes=new Set(getSharedExchangeCountryCodes());
const multilingualCache=new Map();

export function getAvailableExchangeLanguages(countryCode){
 const code=String(countryCode||'').trim().toLowerCase();
 if(!latinCountryCodes.has(code))return [];
 const english={id:'en',name:'English',nativeName:'English',nameJa:'英語',locale:'en-US',status:'published'};
 const spanish={id:'es',name:'Spanish',nativeName:'Español',nameJa:'スペイン語',locale:code==='es'||code==='gq'?'es-ES':'es-MX',status:'published'};
 const extra=FIRST_WAVE_LANGUAGES.filter(l=>l.countries.includes(code))
   .map(l=>({id:l.id,name:l.name,nativeName:l.nativeName,nameJa:l.nameJa,locale:l.localeOverrides?.[code]||l.locale,status:'pilot'}));
 return [english,...(isSpanishExchangeCountry(code)?[spanish]:[]),...extra];
}
export function getExchangeLanguagePackage(countryCode,languageId){
 const iso=String(countryCode||'').trim().toLowerCase();
 const lang=String(languageId||'').trim().toLowerCase();
 if(lang==='en')return getSharedLanguagePackage(iso);
 if(lang==='es')return getSpanishLanguagePackage(iso);
 const info=FIRST_WAVE_LANGUAGES.find(l=>l.id===lang&&l.countries.includes(iso));
 const country=getSharedLanguagePackage(iso)?.country;
 if(!info||!country)return null;
 const key=iso+':'+lang;
 if(multilingualCache.has(key))return multilingualCache.get(key);
 const locale=info.localeOverrides?.[iso]||info.locale;
 const fields=[
  {id:'name',label:'名前（アルファベット）',placeholder:'Sara'},
  {id:'nameKana',label:'名前の読み（任意・カタカナ）',placeholder:'サラ',required:false},
  {id:'homeCountry',label:'出身国（'+info.nameJa+'）',placeholder:info.profile.homeCountry},
  {id:'city',label:'住んでいる街（アルファベット）',placeholder:'Anjo'},
  {id:'school',label:'学校名（アルファベット）',placeholder:'Riverside High School'},
  {id:'hobby',label:'趣味（'+info.nameJa+'）',placeholder:info.profile.hobby},
  {id:'food',label:'好きな食べ物（'+info.nameJa+'）',placeholder:info.profile.food},
 ];
 const steps=info.phrases.map((phrase,i)=>({
  label:COMMON_TITLES[i][1].toUpperCase(),
  phrase,translation:COMMON_TRANSLATIONS[i],
  partnerPhrase:info.partners[i],
  partnerJa:i===3?'私は'+country.nameJa+'に住んでいます。あなたはどこから？':PARTNER_TRANSLATIONS[i],
  // Do not generate unreliable katakana phonetics automatically.
  kana:'',
 }));
 const missions=COMMON_TITLES.map(([ja,en],i)=>({
  id:iso+'-language-'+lang+'-'+String(i+1).padStart(2,'0'),
  domain:'language',type:'conversation-practice',buildStatus:'ready',
  icon:i===9?'🏆':'🗣️',points:10,finalGoal:i===9,
  title:{ja,en},action:info.nameJa+'で相手と交流しよう。前のミッションも繰り返して使います。',
  speech:{languageCode:locale,fields:i===0?[]:fields,
   goal:info.nativeName+' · '+(i+1)+'/10 · '+ja,steps:steps.slice(0,i+1)},
 }));
 const pack={
  schemaVersion:'TimePalette Multilingual Exchange Pilot v1',
  countryCode:iso,domain:'language',country,
  featuredLanguage:{name:info.name,nativeName:info.nativeName,noteJa:info.nameJa+'の音声認識・音声読み上げは端末によって利用状況が異なります。試験公開版です。'},
  missions,
 };
 multilingualCache.set(key,pack);
 return pack;
}
export const getExchangeLanguageMissionCount = iso => getAvailableExchangeLanguages(iso).length*10;
