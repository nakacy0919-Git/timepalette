import assert from 'node:assert/strict';
import handler from '../api/mission-creator.js';
const response = () => ({code:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},status(n){this.code=n;return this;},json(x){this.body=x;return this;}});
let res=response();await handler({method:'GET'},res);assert.equal(res.code,405);
const before=process.env.MISSION_CREATOR_GAS_URL;delete process.env.MISSION_CREATOR_GAS_URL;
res=response();await handler({method:'POST',body:{action:'bootstrap'}},res);assert.equal(res.code,503);assert.equal(res.body.code,'not_configured');
if(before!==undefined)process.env.MISSION_CREATOR_GAS_URL=before;
console.log('PASS: rejects GET and blocks writes before server-side GAS configuration');
