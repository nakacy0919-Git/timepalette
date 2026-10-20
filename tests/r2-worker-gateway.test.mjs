import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../cloudflare/timepalette-r2-worker/src/index.js';
import {leaseKey,gatewayPath,leasePayload,LEASE_LIFETIME_MS} from '../lib/r2-public-lease.js';
const id='12345678-1234-1234-1234-123456789abc';
const base='https://worker.example.workers.dev';
const url=base+gatewayPath(id,1);
const data=Buffer.concat([Buffer.from('RIFF'),Buffer.alloc(4),Buffer.from('WEBP'),Buffer.alloc(200)]);
function env(lease){let imageReads=0;return {MEDIA:{
  get:async key=>{
    if(key===leaseKey(id,1))return lease?{json:async()=>lease}:null;
    if(key===`pilot/${id}/P01.webp`){imageReads++;return {body:data,size:data.length};}
    throw Error('unexpected object key: '+key);
  }},reads:()=>imageReads};}
test('lease path is limited to UUID and one photo slot',()=>{
 assert.equal(leaseKey(id,1),`pilot-leases/${id}/P01.json`);
 assert.equal(gatewayPath(id,1),`/v1/rw/lifeCulture/${id}/P01.webp`);
 assert.throws(()=>gatewayPath('../../secrets',1));
 assert.throws(()=>leaseKey(id,5));
 assert.equal(LEASE_LIFETIME_MS,30000);
});
test('worker returns a published leased WebP without contacting GAS',async()=>{
 const expiresAt=Date.now()+20000;
 const storage=env(JSON.parse(leasePayload(id,1,expiresAt-30000)));
 const res=await worker.fetch(new Request(url),storage);
 assert.equal(res.status,200);
 assert.equal(res.headers.get('Cache-Control'),'no-store');
 assert.equal(res.headers.get('Content-Type'),'image/webp');
 assert.equal(Buffer.compare(Buffer.from(await res.arrayBuffer()),data),0);
 assert.equal(storage.reads(),1);
});
test('missing or expired lease never reads the photo',async()=>{
 for(const lease of [null,{id,slot:1,expiresAt:Date.now()-1},{id,slot:2,expiresAt:Date.now()+5000}]){
  const storage=env(lease);
  const res=await worker.fetch(new Request(url),storage);
  assert.equal(res.status,404);assert.equal(storage.reads(),0);
 }
});
test('worker refuses unknown country, malformed route, and POST',async()=>{
 const storage=env(null);
 for(const req of [new Request(base+'/v1/af/language/'+id+'/P01.webp'),new Request(base+'/x'),
   new Request(url,{method:'POST'})]){
   const res=await worker.fetch(req,storage);
   assert.ok([404,405].includes(res.status));
 }
 assert.equal(storage.reads(),0);
});
