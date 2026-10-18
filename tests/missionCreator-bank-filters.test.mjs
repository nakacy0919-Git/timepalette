import assert from 'node:assert/strict';
import test from 'node:test';
import { filterBankQuestions } from '../src/mission-creator/filterBankQuestions.js';

const original = [
  {id:'1', status:'draft', countryIso:'rw',
   countryName:'Rwanda', prompt:'Food', authorName:'A', domain:'lifeCulture'},
  {id:'2', status:'approved', countryIso:'rw',
   countryName:'Rwanda', prompt:'School', authorName:'B', domain:'lifeCulture'},
  {id:'3', status:'draft', countryIso:'mn',
   countryName:'Mongolia', prompt:'School', authorName:'C', domain:'language'},
  {id:'4', status:'deleted', countryIso:'mn',
   countryName:'Mongolia', prompt:'Home', authorName:'D', domain:'language'}
];

test('draft filter excludes approved and deleted', () => {
  assert.deepEqual(
    filterBankQuestions(original,{filter:'draft'}).map(q=>q.id),
    ['1','3']
  );
});

test('approved question disappears from the draft queue', () => {
  const updated = original.map(q =>
    q.id === '1' ? {...q,status:'approved'} : q
  );
  assert.deepEqual(
    filterBankQuestions(updated,{filter:'draft'}).map(q=>q.id),
    ['3']
  );
});

test('search and status can be combined', () => {
  assert.deepEqual(
    filterBankQuestions(original,{filter:'draft',search:'school'})
      .map(q=>q.id),
    ['3']
  );
});

test('all does not show deleted; approved is selectable', () => {
  assert.deepEqual(
    filterBankQuestions(original,{filter:'all'}).map(q=>q.id),
    ['1','2','3']
  );
  assert.deepEqual(
    filterBankQuestions(original,{filter:'approved'}).map(q=>q.id),
    ['2']
  );
});
