import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {flagEmojiFromCode} from '../src/utils/countryFlagEmoji.js';
import {countryFlagImageUrl} from '../src/utils/countryFlagImage.js';
import {readdirSync} from 'node:fs';

const read=rel=>readFileSync(new URL('../src/'+rel,import.meta.url),'utf8');

test('Canada and all ISO country codes show their own flag, never a generic globe',()=>{
  assert.equal(flagEmojiFromCode('ca'),'🇨🇦');
  assert.equal(flagEmojiFromCode('CA'),'🇨🇦');
  assert.equal(flagEmojiFromCode('fr'),'🇫🇷');
  assert.equal(flagEmojiFromCode('kz'),'🇰🇿');
  assert.equal(flagEmojiFromCode('rw'),'🇷🇼');
  assert.equal(flagEmojiFromCode('invalid'),'🌍');
});

test('language selector is visible alongside current country, with no redundant footer note',()=>{
  const adventure=read('components/world-learning/language-v1/LanguageAdventure.jsx');
  assert.match(adventure,/flagEmojiFromCode\(iso\)/);
  assert.match(adventure,/className="tp-language-country-tabs"/);
  assert.match(adventure,/className="tp-language-official-choices"/);
  assert.match(adventure,/aria-pressed=\{languageChoice===option\.id\}/);
  assert.match(adventure,/option\.nativeName/);
  assert.match(adventure,/switchLanguage\(option\.id\)/);
  assert.doesNotMatch(adventure,/<CommunicationMission/);
  assert.doesNotMatch(adventure,/tp-language-country-note/);
});

test('example speaker uses the actual mission locale and keeps user microphone separate',()=>{
  const stage=read('components/world-learning/language-v1/CommunicationStage.jsx');
  assert.match(stage,/className="tp-language-example-speaker"/);
  assert.match(stage,/onClick=\{onListen\}/);
  assert.match(stage,/aria-label=\{languageName\+'のお手本音声を再生'\}/);
  assert.match(stage,/onClick=\{\s*listening\s*\?\s*onStop\s*:\s*onStart/s);
  assert.match(stage,/speak\(\s*phrase,languageCode\s*\)/);
  assert.match(stage,/speak\(partnerPhrase,languageCode\)/);
  assert.doesNotMatch(stage,/className="tp-language-partner-card/);
  assert.doesNotMatch(stage,/<Headphones/);
});

test('speaking card is compact and has no horizontal overflow on tablets',()=>{
  const css=read('components/world-learning/language-v1/languageAdventureLayout.css');
  assert.match(css,/\.tp-language-v2 \.tp-language-target-card\{[^}]*max-width:790px/s);
  assert.match(css,/\.tp-language-v2 \.tp-language-speech-card\{[^}]*overflow-x:hidden/s);
  assert.match(css,/\.tp-language-v2 \.tp-language-accuracy > div\{[^}]*width:min\(100%,150px\)/s);
  assert.match(css,/\.tp-language-v2 \.tp-language-results > \*\{min-width:0/s);
  assert.match(css,/@media\(max-width:870px\)/);
  assert.match(css,/@media\(max-width:520px\)/);
  assert.match(css,/tp-language-example-speaker/);
});


test('country flag image URLs are stable for Canada and all country codes',()=>{
  assert.equal(countryFlagImageUrl('ca'),'https://flagcdn.com/w80/ca.png');
  assert.equal(countryFlagImageUrl('CA'),'https://flagcdn.com/w80/ca.png');
  assert.equal(countryFlagImageUrl('fr'),'https://flagcdn.com/w80/fr.png');
  assert.equal(countryFlagImageUrl('kz'),'https://flagcdn.com/w80/kz.png');
  assert.equal(countryFlagImageUrl('??'),null);
  assert.equal(countryFlagImageUrl(''),null);
  const dir=new URL('../src/data/',import.meta.url);
  const files=readdirSync(dir).filter(name=>/^countries_[a-z]\.json$/.test(name));
  const countries=Object.assign({},...files.map(name=>JSON.parse(readFileSync(new URL(name,dir),'utf8'))));
  assert.equal(Object.keys(countries).length,197);
  for(const code of Object.keys(countries)){
    assert.equal(countryFlagImageUrl(code),'https://flagcdn.com/w80/'+code+'.png',code);
  }
});

test('Language Adventure displays an IMG flag and gracefully falls back if offline',()=>{
  const c=read('components/world-learning/language-v1/LanguageAdventure.jsx');
  const css=read('components/world-learning/language-v1/languageAdventureLayout.css');
  assert.match(c,/const countryFlagUrl=countryFlagImageUrl\(iso\)/);
  assert.match(c,/<img src=\{countryFlagUrl\} alt=""/);
  assert.match(c,/onError=\{\(\)=>setFlagImageFailed\(true\)\}/);
  assert.match(c,/<Globe2 size=\{25\}\/>/);
  assert.doesNotMatch(c,/const countryFlag=flagEmojiFromCode\(iso\)/);
  assert.match(css,/\.tp-language-flag img\{/);
  assert.match(css,/aspect-ratio:40\/27/);
});
