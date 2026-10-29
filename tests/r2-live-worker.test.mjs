import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/timepalette-r2-worker/src/index.js';
const id='12345678-1234-1234-1234-123456789abc';
const base=`https://test.workers.dev/v2/rw/lifeCulture/${id}/P01.webp`;
function setup({hasManifest=true,iso='rw',slotKey=`live-v1/${id}/P01-${'b'.repeat(20)}.webp`}={}){
 const calls=[];
 const data={version:1,id,iso,domain:'lifeCulture',slots:{1:slotKey}};
 const env={MEDIA:{async get(key){calls.push(key);if(key===`live-v1/${id}/manifest.json`&&hasManifest)return {size:200,json:async()=>data};if(key===slotKey)return {size:64,body:new Uint8Array(64)};return null;}}};
 return {env,calls};
}
test('production worker returns WebP only if live manifest allows exact scope',async()=>{
 const {env,calls}=setup();const r=await worker.fetch(new Request(base),env);
 assert.equal(r.status,200);assert.equal(r.headers.get('Cache-Control'),'no-store');
 assert.equal(calls.length,2);
});
test('deleted manifest immediately blocks image retrieval',async()=>{
 const {env,calls}=setup({hasManifest:false});const r=await worker.fetch(new Request(base),env);
 assert.equal(r.status,404);assert.equal(calls.length,1);
});
test('wrong country refuses public image',async()=>{
 const {env,calls}=setup();const r=await worker.fetch(new Request(base.replace('/rw/','/jp/')),env);
 assert.equal(r.status,404);assert.equal(calls.length,1);
});
test('invalid object key blocks image; no R2 media read',async()=>{
 const {env,calls}=setup({slotKey:'pilot/hidden.webp'});const r=await worker.fetch(new Request(base),env);
 assert.equal(r.status,404);assert.equal(calls.length,1);
});
test('unknown path and POST are denied',async()=>{
 const {env}=setup();assert.equal((await worker.fetch(new Request(base,{method:'POST'}),env)).status,405);
 assert.equal((await worker.fetch(new Request('https://test.workers.dev/live-private'),env)).status,404);
});
