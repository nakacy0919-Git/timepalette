import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLoginCode} from '../src/mission-creator/loginCode.js';
test('Japanese full-width numeric input becomes a four-digit ASCII code',()=>{
 assert.equal(normalizeLoginCode('１２３４'),'1234');
 assert.equal(normalizeLoginCode(' 1２-3４5'),'1234');
 assert.equal(normalizeLoginCode('abcd'),'');
});
