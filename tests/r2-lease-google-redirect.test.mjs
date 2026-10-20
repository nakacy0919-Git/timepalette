import test from 'node:test';
import assert from 'node:assert/strict';
import {readOnlyGasJson} from '../api/mission-r2-public-pilot.js';
const endpoint='https://script.google.com/macros/s/test/exec';
const once='https://script.googleusercontent.com/macros/echo?user_content_key=temporary';
const json={ok:true,data:{countryIso:'rw',domain:'lifeCulture',questionIds:[]}};
function response({ok=true,status=200,content='',location,url=''}){
  return {ok,status,url,headers:{get:k=>k==='location'?location:null},text:async()=>content};
}
test('read-only GAS follows ContentService with GET and never forwards session POST',async()=>{
  const seen=[];
  const fetcher=async(url,opts)=>{
    seen.push({url:String(url),method:opts.method||'GET',body:opts.body});
    return seen.length===1?response({ok:false,status:302,location:once,url:endpoint}):
      response({content:JSON.stringify(json),url:once});
  };
  const r=await readOnlyGasJson(endpoint,{method:'POST',body:'session-only-please'},fetcher);
  assert.deepEqual(r,json);
  assert.deepEqual(seen.map(s=>s.method),['POST','GET']);
  assert.equal(seen[1].body,undefined);
});
test('one-time HTML 404 is retried once only for read-only GAS operation',async()=>{
  let n=0;const seen=[];
  const fetcher=async(url,opts)=>{
    seen.push({url:String(url),method:opts.method||'GET'});
    ++n;
    if(n===1||n===3)return response({ok:false,status:302,location:once,url:endpoint});
    if(n===2)return response({ok:false,status:404,content:'<html>Not Found</html>',url:once});
    return response({content:JSON.stringify(json),url:once});
  };
  assert.deepEqual(await readOnlyGasJson(endpoint,{method:'POST',body:'secret'},fetcher),json);
  assert.deepEqual(seen.map(s=>s.method),['POST','GET','POST','GET']);
});
test('unknown external redirect blocked without contacting it',async()=>{
  let n=0;const fetcher=async()=>{n++;return response({ok:false,status:302,location:'https://evil.example/collect',url:endpoint});};
  await assert.rejects(readOnlyGasJson(endpoint,{method:'POST',body:'secret'},fetcher),/Unsafe GAS redirect/);
  assert.equal(n,1);
});
test('valid JSON application denial is returned without retry',async()=>{
  let n=0;const fetcher=async()=>{n++;return response({content:JSON.stringify({ok:false,error:'not allowed'})});};
  assert.deepEqual(await readOnlyGasJson(endpoint,{},fetcher),{ok:false,error:'not allowed'});
  assert.equal(n,1);
});
