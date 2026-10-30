import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  calculateSpeechAccuracy,evaluateSpeechDiagnostic,getSpeechDiagnosticPhrase,
  getSpeechLanguageName,getSpeechRecognitionErrorMessage,SPEECH_PASS_SCORE,
} from '../src/utils/speechRecognitionDiagnostics.js';

const locales=['en-US','es-ES','es-MX','fr-FR','fr-CA','pt-BR','pt-PT','de-DE','de-AT',
  'it-IT','nl-NL','ms-MY','sv-SE','ro-RO'];

test('diagnostic samples in all ten languages',()=>{
  const names=new Set();
  for(const locale of locales){
    const name=getSpeechLanguageName(locale),sample=getSpeechDiagnosticPhrase(locale);
    assert.ok(name&&sample);
    names.add(name);
    assert.equal(calculateSpeechAccuracy(sample,sample),100,locale);
  }
  assert.equal(names.size,10);
  assert.equal(getSpeechDiagnosticPhrase('fr-FR'),'Bonjour');
  assert.equal(getSpeechDiagnosticPhrase('pt-BR'),'Olá');
});

test('transcript received differs from matching the target',()=>{
  assert.deepEqual(evaluateSpeechDiagnostic('Bonjour',''),{
    recognized:false,accuracy:0,matched:false,status:'no-transcript'});
  assert.deepEqual(evaluateSpeechDiagnostic('Bonjour','bonsoir'),{
    recognized:true,accuracy:0,matched:false,status:'mismatch'});
  assert.deepEqual(evaluateSpeechDiagnostic('Olá','ola'),{
    recognized:true,accuracy:100,matched:true,status:'matched'});
  assert.equal(SPEECH_PASS_SCORE,80);
});

test('accent tolerant shared accuracy with word-level edit distance',()=>{
  assert.equal(calculateSpeechAccuracy('Bonjour je m’appelle Sara','bonjour je mappelle sara'),100);
  assert.equal(calculateSpeechAccuracy('Ich heiße Sara','ich heisse sara'),100);
  assert.equal(calculateSpeechAccuracy('Bună! Mă numesc Sara.','buna ma numesc sara'),100);
  assert.equal(calculateSpeechAccuracy('Hello nice to meet you','hello nice to meet'),80);
  assert.equal(calculateSpeechAccuracy('Hello nice to meet you','hello nice'),40);
});

test('each language has an accurate error message',()=>{
  for(const locale of locales){
    for(const error of ['language-not-supported','language-unavailable','no-match']){
      const message=getSpeechRecognitionErrorMessage(error,locale);
      assert.ok(message.includes(getSpeechLanguageName(locale)),locale+' '+error);
      assert.ok(!message.includes('英語(en-US)'),locale+' '+error);
    }
  }
  assert.match(getSpeechRecognitionErrorMessage('not-allowed','fr-FR'),/マイク/);
  assert.match(getSpeechRecognitionErrorMessage('network','pt-BR'),/接続/);
  assert.match(getSpeechRecognitionErrorMessage('unsupported','ms-MY'),/ブラウザー/);
});

test('mic test UI wired to real recognition callbacks, opt-in copy and mission scoring',()=>{
  const path=name=>new URL('../src/'+name,import.meta.url);
  const diagnostic=readFileSync(path('components/world-learning/language-v1/SpeechRecognitionDiagnostic.jsx'),'utf8');
  const stage=readFileSync(path('components/world-learning/language-v1/CommunicationStage.jsx'),'utf8');
  const adventure=readFileSync(path('components/world-learning/language-v1/LanguageAdventure.jsx'),'utf8');
  for(const text of ['recognition.lang=locale','recognition.onresult=','recognition.onerror=','recognition.onend=','navigator.clipboard.writeText','onClick={start}','isClosingRef.current']){
    assert.ok(diagnostic.includes(text),text);
  }
  assert.match(stage,/const calculateAccuracy = calculateSpeechAccuracy/);
  assert.match(stage,/getSpeechRecognitionErrorMessage\(code,languageCode\)/);
  assert.match(stage,/languageName/);
  assert.match(adventure,/SpeechRecognitionDiagnostic/);
  assert.match(adventure,/diagnostics\[selectedLocale\]/);
});
