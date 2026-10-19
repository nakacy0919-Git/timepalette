import test from 'node:test';
import assert from 'node:assert/strict';
import {PILOT_BUCKET,pilotKey,publishedSlotAllowed,checkR2Config,validateWebp} from '../lib/r2-pilot-core.js';
const uuid='12345678-1234-1234-1234-123456789abc';
const q={id:uuid,countryIso:'rw',domain:'lifeCulture',type:'photo4',media:[{slot:1},{slot:2}]};
test('pilot R2 object paths are deterministic and restricted',()=>{
  assert.equal(pilotKey(uuid,2),`pilot/${uuid}/P02.webp`);
  assert.throws(()=>pilotKey('../etc',1));
  assert.throws(()=>pilotKey(uuid,5));
  assert.throws(()=>pilotKey(uuid,1.5));
});
test('published catalog must match exact country domain and photo slot',()=>{
  assert.equal(publishedSlotAllowed([q],uuid,1),true);
  assert.equal(publishedSlotAllowed([q],uuid,3),false);
  assert.equal(publishedSlotAllowed([{...q,countryIso:'af'}],uuid,1),false);
  assert.equal(publishedSlotAllowed([{...q,domain:'language'}],uuid,1),false);
  assert.equal(publishedSlotAllowed([{...q,type:'text4'}],uuid,1),false);
  assert.equal(publishedSlotAllowed([q],'12345678-1234-1234-1234-123456789ab0',1),false);
});
test('private configured bucket is the only allowed target',()=>{
  const env={R2_ACCOUNT_ID:'a'.repeat(32),R2_ACCESS_KEY_ID:'abc',R2_SECRET_ACCESS_KEY:'xyz',R2_BUCKET_NAME:PILOT_BUCKET};
  assert.ok(checkR2Config(env));
  assert.equal(checkR2Config({...env,R2_BUCKET_NAME:'copeak-classroom-audio'}),false);
  assert.equal(checkR2Config({...env,R2_SECRET_ACCESS_KEY:''}),false);
  assert.equal(checkR2Config({...env,R2_ACCOUNT_ID:'not-an-id'}),false);
});
test('bad or oversized WebP payloads are rejected',()=>{
  assert.throws(()=>validateWebp(Buffer.from('hi')));
  assert.throws(()=>validateWebp(Buffer.alloc(1228801)));
  assert.throws(()=>validateWebp(Buffer.from('RIFFxxxxBAD DATA')));
  const ok=Buffer.from('RIFFxxxxWEBP0000');
  assert.equal(validateWebp(ok),ok);
});
