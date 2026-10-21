import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compareCreatorVoice, normalizeVoiceText, validVoiceLocale } from '../src/utils/creatorVoiceMatch.js';

test('punctuation and case are ignored without inventing pronunciation scores', () => {
  assert.equal(normalizeVoiceText(' HELLO,   World! '), 'hello world');
  assert.equal(compareCreatorVoice('Hello World!', {target:'hello world',alternatives:[]}).matched, true);
});
test('teacher alternatives accepted, unrelated phrases rejected', () => {
  const voice={target:'Good morning', alternatives:['Morning','Hello there']};
  assert.equal(compareCreatorVoice('MORNING!',voice).matched,true);
  assert.equal(compareCreatorVoice('Good evening',voice).matched,false);
});
test('empty text is never accepted',()=>{
  assert.equal(compareCreatorVoice('',{target:'',alternatives:['']}).matched,false);
});
test('unicode NFKC normalization handles full width expressions',()=>{
  assert.equal(normalizeVoiceText('Ｈｅｌｌｏ！'), 'hello');
});
test('language setting requires BCP47-like form',()=>{
  assert.equal(validVoiceLocale('en-US'),true);
  assert.equal(validVoiceLocale('fr-FR'),true);
  assert.equal(validVoiceLocale('rw-RW'),true);
  assert.equal(validVoiceLocale('malicious <script>'),false);
});
