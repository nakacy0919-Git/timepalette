import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {normalizeSpeechText} from '../src/utils/multilingualSpeechText.js';
import {FUTURE_LANGUAGE_CANDIDATES} from '../src/utils/languageRolloutCandidates.js';

const dataDir=new URL('../src/data/',import.meta.url);
const files=readdirSync(dataDir).filter(name=>/^countries_[a-z]\.json$/.test(name));
const modules=Object.fromEntries(files.map(name=>[name,{default:JSON.parse(readFileSync(new URL(name,dataDir),'utf8'))}]));
const sharedSource=readFileSync(new URL('../src/utils/sharedLanguageExchange.js',import.meta.url),'utf8');
const glob="const countryModules = import.meta.glob('../data/countries_*.json', { eager: true });";
assert.ok(sharedSource.includes(glob));
const sharedBody=sharedSource.replace(glob,"const countryModules = providedModules;").replace(/\bexport\s+(?=const|function)/g,'');
const shared=new Function('providedModules',sharedBody+'\nreturn {getSharedLanguagePackage,getSharedExchangeCountryCodes,getSpanishLanguagePackage,isSpanishExchangeCountry};')(modules);
const multiSource=readFileSync(new URL('../src/utils/multilingualExchange.js',import.meta.url),'utf8');
const importLine="import {getSharedLanguagePackage, getSharedExchangeCountryCodes, getSpanishLanguagePackage, isSpanishExchangeCountry} from './sharedLanguageExchange.js';";
assert.ok(multiSource.includes(importLine));
const multiBody=multiSource.replace(importLine,'').replace(/\bexport\s+(?=const|function)/g,'');
const m=new Function('getSharedLanguagePackage','getSharedExchangeCountryCodes','getSpanishLanguagePackage','isSpanishExchangeCountry',
 multiBody+'\nreturn {FIRST_WAVE_LANGUAGES,getAvailableExchangeLanguages,getExchangeLanguagePackage,getExchangeLanguageMissionCount};')(
 shared.getSharedLanguagePackage,shared.getSharedExchangeCountryCodes,shared.getSpanishLanguagePackage,shared.isSpanishExchangeCountry);

test('first wave registers eight verified-locale candidates and eligible countries',()=>{
 assert.equal(m.FIRST_WAVE_LANGUAGES.length,8);
 const expected={fr:26,pt:9,de:6,it:3,nl:3,ms:3,sv:2,ro:2};
 const universe=new Set(shared.getSharedExchangeCountryCodes());
 assert.equal(universe.size,197);
 for(const lang of m.FIRST_WAVE_LANGUAGES){
   assert.equal(lang.countries.length,expected[lang.id],lang.id);
   assert.equal(new Set(lang.countries).size,lang.countries.length,lang.id);
   assert.ok(lang.countries.every(code=>universe.has(code)),'unknown country in '+lang.id);
   assert.match(lang.locale,/^[a-z]{2}-[A-Z]{2}$/);
   assert.equal(lang.phrases.length,10,lang.id);
   assert.equal(lang.partners.length,10,lang.id);
 }
});

test('each official-language country gets only matching languages, and every new language has ten cumulative and unique stages',()=>{
 const allNewIds=new Set();
 let total=0;
 for(const code of shared.getSharedExchangeCountryCodes()){
   const options=m.getAvailableExchangeLanguages(code);
   assert.ok(options.some(o=>o.id==='en'),code);
   assert.equal(options.some(o=>o.id==='es'),shared.isSpanishExchangeCountry(code),code);
   assert.equal(m.getExchangeLanguageMissionCount(code),options.length*10);
   for(const option of options){
     const pack=m.getExchangeLanguagePackage(code,option.id);
     assert.ok(pack,code+' '+option.id);
     assert.equal(pack.missions.length,10);
     assert.equal(pack.countryCode,code);
     if(option.id==='en'||option.id==='es')continue;
     total+=10;
     assert.equal(pack.featuredLanguage.name,option.name);
     const first=pack.missions[0].speech.steps[0].phrase;
     const ids=new Set(pack.missions.map(x=>x.id));
     assert.equal(ids.size,10);
     for(const [i,mission] of pack.missions.entries()){
       assert.ok(mission.id.startsWith(code+'-language-'+option.id+'-'));
       assert.ok(!allNewIds.has(mission.id));allNewIds.add(mission.id);
       assert.equal(mission.speech.steps.length,i+1);
       assert.equal(mission.speech.steps[0].phrase,first);
       assert.equal(mission.speech.languageCode,option.locale);
       assert.equal(mission.buildStatus,'ready');
       assert.ok(mission.speech.steps.every(s=>s.phrase && s.translation && s.partnerPhrase && s.partnerJa));
     }
     assert.equal(pack.missions[9].finalGoal,true);
     const fields=pack.missions[1].speech.fields.map(f=>f.id);
     for(const k of ['name','nameKana','homeCountry','city','school','hobby','food']) assert.ok(fields.includes(k));
   }
 }
 assert.equal(total,540);
 assert.equal(allNewIds.size,540);
 assert.equal(m.getExchangeLanguagePackage('jp','fr'),null);
 assert.equal(m.getExchangeLanguagePackage('us','pt'),null);
 const ch=m.getAvailableExchangeLanguages('ch').map(x=>x.id);
 assert.ok(ch.includes('fr')&&ch.includes('de')&&ch.includes('it'));
 const sg=m.getAvailableExchangeLanguages('sg').map(x=>x.id);
 assert.ok(sg.includes('ms'));
});

test('voice text scoring normalizes European alphabets without deleting non Latin letters',()=>{
 for(const [a,b] of [
  ['Straße','STRASSE'],['Français','francais'],['Œuvre','oeuvre'],['Bună','BUNA'],
  ['Țară','tara'],["J'aime","jaime"],['Mă numesc','ma numesc'],
 ]) assert.equal(normalizeSpeechText(a),normalizeSpeechText(b),a+' vs '+b);
 assert.equal(normalizeSpeechText('こんにちは مرحبا Привет'),'こんにちは مرحبا привет');
 assert.equal(normalizeSpeechText('Olá! Muito prazer!'),'ola muito prazer');
});

test('main screen, profile, and creator integration have no missing language-picker hooks',()=>{
 const dir=new URL('../src/',import.meta.url);
 const get=path=>readFileSync(new URL(path,dir),'utf8');
 assert.match(get('components/world-learning/language-v1/LanguageAdventure.jsx'),/getAvailableExchangeLanguages/);
 assert.match(get('components/world-learning/WorldMissionPanel.jsx'),/getExchangeLanguageMissionCount/);
 assert.match(get('components/world-learning/language-v1/CommunicationStage.jsx'),/normalizeSpeechText/);
 assert.match(get('components/world-learning/language-v1/CommunicationStage.jsx'),/languageKey/);
 assert.match(get('mission-creator/MissionCreator.jsx'),/getExchangeLanguageMissionCount/);
});

test('seventeen future languages stay registered but unpublished',()=>{
 assert.equal(FUTURE_LANGUAGE_CANDIDATES.length,17);
 assert.equal(new Set(FUTURE_LANGUAGE_CANDIDATES.map(x=>x.id)).size,17);
 const published=new Set(m.FIRST_WAVE_LANGUAGES.map(x=>x.id));
 assert.ok(FUTURE_LANGUAGE_CANDIDATES.every(x=>!published.has(x.id) && x.status==='pending-device-and-linguistic-review'));
});

test('every supported language displays a neutral US-style school name example',()=>{
  for(const code of shared.getSharedExchangeCountryCodes()){
    for(const option of m.getAvailableExchangeLanguages(code)){
      const pack=m.getExchangeLanguagePackage(code,option.id);
      const school=pack?.missions?.[1]?.speech?.fields?.find(field=>field.id==='school');
      assert.ok(school,code+' '+option.id+' missing school field');
      assert.equal(school.placeholder,'Riverside High School',code+' '+option.id);
    }
  }
  assert.ok(!sharedSource.includes('Anjo High School'));
  assert.ok(!multiSource.includes('Anjo High School'));
});
