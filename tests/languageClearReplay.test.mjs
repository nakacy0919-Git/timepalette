import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const get=path=>readFileSync(new URL('../src/'+path,import.meta.url),'utf8');

test('clear callback is gated once per practice session and cannot reschedule on a parent render',()=>{
  const stage=get('components/world-learning/language-v1/CommunicationStage.jsx');
  assert.match(stage,/const clearNotifiedRef = useRef\(false\)/);
  assert.match(stage,/if \(clearNotifiedRef\.current\) return/);
  assert.match(stage,/clearNotifiedRef\.current = true/);
  assert.match(stage,/onClearRef\.current\?\.\(mission\)/);
  assert.match(stage,/clearNotifiedRef\.current = false/);
  assert.match(stage,/clearNotifiedRef\.current \|\|/);
  assert.match(stage,/completeOnce\(\)/);
  assert.match(stage,/onFinish=\{completeOnce\}/);
  // The former onClear dependency caused the clear timer to re-arm every time
  // the parent dismissed the dialog, because the callback changed identity.
  const autoEffect=stage.split('/* AUTO CLEAR TO NEXT LANGUAGE MISSION */')[1]?.split('const savedSchool')[0];
  assert.ok(autoEffect);
  assert.doesNotMatch(autoEffect,/\b(onClear,|onClear\])\b/);
});

test('closing, retrying or selecting another mission creates a fresh speech-stage instance',()=>{
  const adventure=get('components/world-learning/language-v1/LanguageAdventure.jsx');
  assert.match(adventure,/const \[practiceRound,setPracticeRound\]=useState\(0\)/);
  assert.match(adventure,/const restartCurrentMission=\(\)=>/);
  assert.match(adventure,/setPracticeRound\(round=>round\+1\)/);
  assert.match(adventure,/const backToMissionList=\(\)=>/);
  assert.match(adventure,/missionListRef\.current\?\.focus\(\)/);
  assert.match(adventure,/key=\{activeMission\.id\+'-'\+practiceRound\}/);
  assert.match(adventure,/onRetry=\{restartCurrentMission\}/);
  assert.match(adventure,/onBackToList=\{backToMissionList\}/);
  assert.match(adventure,/onDismiss=\{backToMissionList\}/);
  assert.match(adventure,/onClick=\{\(\)=>selectMission\(index\)\}/);
  assert.doesNotMatch(adventure,/advanceTimerRef|1900|AUTO ADVANCE/);
});

test('language celebrations give meaningful next, retry and return options; other domains keep their defaults',()=>{
  const modal=get('components/world-learning/MissionSuccessCelebration.jsx');
  assert.match(modal,/onRetry = null/);
  assert.match(modal,/backLabel = 'Mission一覧'/);
  assert.match(modal,/finishLabel = 'Adventureへ戻る'/);
  assert.match(modal,/\{onRetry && nextMission && <button/);
  assert.match(modal,/onClick=\{onRetry\}/);
  assert.match(modal,/同じMissionをもう一度/);
  assert.match(modal,/\{!onRetry && <button/);
  assert.match(modal,/onBackToList \?\?\s+onDismiss/);
  assert.match(modal,/onRetry \? 'もう一度練習'/);
});

test('Accuracy visual is larger without changing scoring, 80% threshold or audio logic',()=>{
  const stage=get('components/world-learning/language-v1/CommunicationStage.jsx');
  const css=get('components/world-learning/language-v1/languageAdventureLayout.css');
  assert.match(stage,/className="tp-language-accuracy-meter/);
  assert.match(css,/\.tp-language-v2 \.tp-language-accuracy > \.tp-language-accuracy-meter/);
  assert.match(css,/width:min\(100%,255px\)!important/);
  assert.match(css,/font-size:clamp\(42px,4\.4vw,64px\)!important/);
  assert.match(css,/min-height:clamp\(190px,27vh,250px\)/);
  assert.match(stage,/const PASS_SCORE = 80/);
  assert.match(stage,/const calculateAccuracy = calculateSpeechAccuracy/);
});
