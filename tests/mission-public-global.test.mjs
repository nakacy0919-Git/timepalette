import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/mission-public.js';
import { normalizePublishedCatalog } from '../src/utils/publishedMissionCatalog.js';

const id = '12345678-1234-1234-1234-123456789abc';
function mockResponse(){
  return {
    headers:{},statusCode:0,body:null,
    setHeader(k,v){this.headers[k]=v;},
    status(n){this.statusCode=n;return this;},
    json(b){this.body=b;return this;},
    send(b){this.body=b;return this;}
  };
}
const original = {fetch:globalThis.fetch,endpoint:process.env.MISSION_CREATOR_GAS_URL};
async function withBackend(fn){
  process.env.MISSION_CREATOR_GAS_URL='https://script.google.com/macros/s/example/exec';
  const requests=[];
  globalThis.fetch=async url=>{
    requests.push(new URL(String(url)));
    return {ok:true,text:async()=>JSON.stringify({ok:true,data:{questions:[{
      id, countryIso:'af',domain:'language',type:'text4',prompt:'Greeting?',answer:'A',choices:['B','C','D'],media:[]
    }]}})};
  };
  try {await fn(requests);} finally {
    globalThis.fetch=original.fetch;
    if(original.endpoint===undefined)delete process.env.MISSION_CREATOR_GAS_URL;
    else process.env.MISSION_CREATOR_GAS_URL=original.endpoint;
  }
}
test('all valid country/category pairs use the question catalog backend',async()=>{
  await withBackend(async requests=>{
    const res=mockResponse();
    await handler({method:'GET',query:{action:'catalog',country:'af',domain:'language'}},res);
    assert.equal(res.statusCode,200);
    assert.equal(res.body.questions[0].countryIso,'af');
    assert.equal(requests[0].searchParams.get('countryIso'),'af');
    assert.equal(requests[0].searchParams.get('domain'),'language');
    assert.equal(requests[0].searchParams.get('action'),'publishedCatalog');
  });
});
test('invalid public scopes and unsupported actions are blocked',async()=>{
  await withBackend(async requests=>{
    for(const query of [{action:'catalog',country:'../../../',domain:'language'},
      {action:'catalog',country:'af',domain:'admin'}, {action:'delete',country:'af',domain:'language'}]){
      const res=mockResponse();await handler({method:'GET',query},res);
      assert.equal(res.statusCode,400);
    }
    assert.equal(requests.length,0);
  });
});
test('missions retain correct country identity; Rwanda mission IDs remain stable',()=>{
  const shared={id,type:'text4',domain:'language',prompt:'Greeting?',answer:'A',choices:['B','C','D']};
  const [af]=normalizePublishedCatalog([{...shared,countryIso:'af'}]);
  const [rw]=normalizePublishedCatalog([{...shared,countryIso:'rw'}]);
  assert.equal(af.id,'af-mc-'+id);
  assert.equal(rw.id,'rw-mc-'+id);
  assert.equal(af.domain,'language');
  assert.equal(af.challenge.choices.length,4);
});
