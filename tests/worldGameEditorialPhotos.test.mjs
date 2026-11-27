import test from 'node:test';
import assert from 'node:assert/strict';
import catalog from '../src/data/world-games/approvedQuestions.json' with {type:'json'};
import {localizeQuestion} from '../src/utils/worldGameLanguage.js';
import {shuffleOptions} from '../src/utils/worldGameEngine.js';
test('licensed image metadata survives language selection and choice shuffling',()=>{const items=catalog.questions.filter(q=>q.image);assert.ok(items.length>=8);for(const q of items){const p=q.image;assert.ok(p.author&&p.title&&p.altJa&&p.altEn&&p.verifiedOn&&p.changes);assert.match(p.sourceUrl,/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);assert.ok(['Public domain','CC BY-SA 4.0','CC BY 4.0','CC0'].includes(p.license));assert.ok(['question','review'].includes(p.stage));for(const lang of ['ja','en'])assert.deepEqual(shuffleOptions(localizeQuestion(q,lang),()=>.4).image,p);}});
