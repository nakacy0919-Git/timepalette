import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {getCountryLanguageNote} from '../src/utils/languageCountryNote.js';

const get=(path)=>readFileSync(new URL('../src/'+path,import.meta.url),'utf8');

test('Kazakhstan note belongs to Kazakhstan; no Rwanda text leaks to other countries',()=>{
  const kz=getCountryLanguageNote({
    countryCode:'kz',country:{nameJa:'カザフスタン'},languageName:'英語',
  });
  assert.equal(kz.title,'カザフスタンのこと');
  assert.match(kz.text,/カザフ語/);
  assert.match(kz.text,/ロシア語/);
  assert.match(kz.text,/英語/);
  assert.doesNotMatch(kz.text,/ルワンダ|Kinyarwanda/);
  const rw=getCountryLanguageNote({countryCode:'rw',country:{nameJa:'ルワンダ'},languageName:'フランス語'});
  assert.equal(rw.title,'ルワンダのこと');
  assert.match(rw.text,/キニヤルワンダ語/);
  assert.match(rw.text,/フランス語/);
  const jp=getCountryLanguageNote({countryCode:'jp',country:{nameJa:'日本'},languageName:'英語'});
  assert.equal(jp.title,'日本のこと');
  assert.doesNotMatch(jp.text,/ルワンダ|カザフ語/);
});

test('all 197 country records receive their own non-Rwanda cultural labels',()=>{
  const base=new URL('../src/data/',import.meta.url);
  const files=readdirSync(base).filter(f=>/^countries_[a-z]\.json$/.test(f));
  const countries=Object.assign({},...files.map(f=>JSON.parse(readFileSync(new URL(f,base),'utf8'))));
  assert.equal(Object.keys(countries).length,197);
  for(const [code,record] of Object.entries(countries)){
    const note=getCountryLanguageNote({countryCode:code,country:record,languageName:'英語'});
    assert.ok(note.title.startsWith(record.nameJa||record.nameEn),code);
    assert.match(note.text,/英語/);
    if(code!=='rw')assert.doesNotMatch(note.text,/ルワンダでは/,code);
  }
});

test('all ten missions render as vertical left-side navigation, not header pills',()=>{
  const component=get('components/world-learning/language-v1/LanguageAdventure.jsx');
  assert.match(component,/className="tp-language-sidebar"/);
  assert.match(component,/aria-label="言語ミッション一覧"/);
  assert.match(component,/missions\.map\(\(mission,index\)=>/);
  assert.match(component,/Mission \{index\+1\}/);
  assert.match(component,/className="tp-language-mission-heading"/);
  assert.match(component,/getAvailableExchangeLanguages/);
  assert.match(component,/onClear=\{complete\}/);
  assert.match(component,/diagnosticOpen&&<SpeechRecognitionDiagnostic/);
  assert.doesNotMatch(component,/MISSION PROGRESS|tp-language-resizer|leftWidth|音声認識：/);
});

test('new responsive screen removes unnecessary static action and progress cards',()=>{
  const layout=get('components/world-learning/language-v1/languageAdventureLayout.css');
  const side=get('components/world-learning/language-v1/CommunicationMission.jsx');
  const stage=get('components/world-learning/language-v1/CommunicationStage.jsx');
  const launcher=get('components/world-learning/LanguageAdventureLauncher.jsx');
  assert.match(layout,/height:100dvh/);
  assert.match(layout,/grid-template-rows:repeat\(10,minmax\(0,1fr\)\)/);
  assert.match(layout,/@media\(max-width:870px\)/);
  assert.match(layout,/@media\(max-width:520px\)/);
  assert.match(layout,/@media\(max-height:740px\)/);
  assert.match(layout,/overflow:hidden/);
  assert.match(layout,/tp-language-country-note/);
  assert.match(launcher,/overflow-hidden/);
  assert.doesNotMatch(launcher,/overflow-y-auto/);
  assert.match(side,/getCountryLanguageNote/);
  assert.doesNotMatch(side,/RWANDA LANGUAGE NOTE|MISSION PROGRESS|80%\+/);
  for(const name of ['tp-language-speech-card','tp-language-stage','tp-language-target-card',
    'tp-language-results','tp-language-accuracy','tp-language-transcript']){
    assert.ok(stage.includes(name),'Missing compact speech class '+name);
  }
});
