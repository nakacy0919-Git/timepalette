import assert from 'node:assert/strict';
import handler from '../api/mission-creator.js';
const response = () => ({code:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},status(n){this.code=n;return this;},json(x){this.body=x;return this;}});
let res=response();await handler({method:'GET'},res);assert.equal(res.code,405);
const before=process.env.MISSION_CREATOR_GAS_URL;delete process.env.MISSION_CREATOR_GAS_URL;
res=response();await handler({method:'POST',body:{action:'bootstrap'}},res);assert.equal(res.code,503);assert.equal(res.body.code,'not_configured');
if(before!==undefined)process.env.MISSION_CREATOR_GAS_URL=before;
// A slow upstream must be distinguishable from a bad response or configuration.
const savedFetch=globalThis.fetch;
const savedGasUrl=process.env.MISSION_CREATOR_GAS_URL;
process.env.MISSION_CREATOR_GAS_URL='https://script.google.com/macros/s/fake/exec';
globalThis.fetch=async()=>{const e=new Error('timeout');e.name='TimeoutError';throw e;};
try{
  res=response();await handler({method:'POST',body:{action:'getMediaBatch'}},res);
  assert.equal(res.code,504);
  assert.equal(res.body.code,'google_timeout');
}finally{
  globalThis.fetch=savedFetch;
  if(savedGasUrl===undefined)delete process.env.MISSION_CREATOR_GAS_URL;
  else process.env.MISSION_CREATOR_GAS_URL=savedGasUrl;
}
console.log('PASS: route guards and Google upstream timeout diagnosis');
