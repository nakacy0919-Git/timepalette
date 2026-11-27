import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVoiceVotes,voteSummary} from '../src/utils/shuffleVoiceVotes.js';
test('recognizes standalone English and Japanese letters, including repeated choices',()=>{
 assert.deepEqual(parseVoiceVotes('A B A C D'),[2,1,1,1]);
 assert.deepEqual(parseVoiceVotes('Ａ、ビー！ シー。ディー エーエー'),[3,1,1,1]);
 assert.deepEqual(parseVoiceVotes('Apple, banana, correct, dog'),[0,0,0,0]);
 assert.deepEqual(parseVoiceVotes('答えはAです'),[1,0,0,0]);
});
test('vote ratios and ties do not pick a false winner',()=>{
 assert.deepEqual(voteSummary([0,0,0,0]),{total:0,leaders:[],percent:[0,0,0,0]});
 assert.deepEqual(voteSummary([4,2,3,1]),{total:10,leaders:[0],percent:[40,20,30,10]});
 assert.deepEqual(voteSummary([2,2,0,0]).leaders,[0,1]);
});
