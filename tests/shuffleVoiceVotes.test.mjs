import test from 'node:test';
import assert from 'node:assert/strict';
import {parseVoiceVotes,voteSummary} from '../src/utils/shuffleVoiceVotes.js';
test('counts only actual answer phrases, including readings',()=>{
 const choices=['オロモ語','英語','ギニアビサウ・クレオール語','アファル語'], readings={'語':'ご','英語':'えいご'};
 assert.deepEqual(parseVoiceVotes('A B A C D',choices,readings),[0,0,0,0]);
 assert.deepEqual(parseVoiceVotes('Ａ、ビー！ シー。ディー エーエー',choices,readings),[0,0,0,0]);
 assert.deepEqual(parseVoiceVotes('答えはAです',choices,readings),[0,0,0,0]);
 assert.deepEqual(parseVoiceVotes('英語、えいご。オロモ語！',choices,readings),[1,2,0,0]);
 assert.deepEqual(parseVoiceVotes('答えは英語です',choices,readings),[0,1,0,0]);
 assert.deepEqual(parseVoiceVotes('クレオール語',choices,readings),[0,0,0,0]);
 assert.deepEqual(parseVoiceVotes('NEW YORK CITY!', ['New York City','York','London','Paris']),[1,0,0,0]);
 assert.deepEqual(parseVoiceVotes('New York', ['New York City','York','London','Paris']),[0,0,0,0]);
 assert.deepEqual(parseVoiceVotes('英語',['英語','英語','中国語','日本語']),[0,0,0,0]);
});
test('vote ratios and ties do not pick a false winner',()=>{
 assert.deepEqual(voteSummary([0,0,0,0]),{total:0,leaders:[],percent:[0,0,0,0]});
 assert.deepEqual(voteSummary([4,2,3,1]),{total:10,leaders:[0],percent:[40,20,30,10]});
 assert.deepEqual(voteSummary([2,2,0,0]).leaders,[0,1]);
});
