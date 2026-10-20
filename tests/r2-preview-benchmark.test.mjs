import test from 'node:test';
import assert from 'node:assert/strict';
import {createMissionPublicHandler} from '../api/mission-public.js';
import {isPreviewR2Request,readPreviewR2IfPublished,PREVIEW_AUTH_TTL_MS,PREVIEW_CDN_TTL_SECONDS} from '../lib/r2-preview-photo.js';

const id = '12345678-1234-1234-1234-123456789abc';
const env = {VERCEL_ENV:'preview',R2_ACCOUNT_ID:'a'.repeat(32),
  R2_ACCESS_KEY_ID:'test',R2_SECRET_ACCESS_KEY:'test',R2_BUCKET_NAME:'timepalette-public-webp'};
function response(){return {headers:{},statusCode:0,body:undefined,
  setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},
  json(v){this.body=v;return this;},send(v){this.body=v;return this;}};}
const original={...Object.fromEntries(Object.keys(env).map(k=>[k,process.env[k]])),
  endpoint:process.env.MISSION_CREATOR_GAS_URL,fetch:globalThis.fetch};
const webp=Buffer.concat([Buffer.from('RIFF'),Buffer.alloc(4),Buffer.from('WEBP'),Buffer.alloc(20)]);
async function withFixture(fn,options={}){
  const requests=[];
  Object.assign(process.env,env,{MISSION_CREATOR_GAS_URL:'https://script.google.com/macros/s/test/exec'});
  const r2Calls=[];
  const authorizationCache=new Map();
  const handler=createMissionPublicHandler({r2Reader:args=>readPreviewR2IfPublished({
    ...args,
    authorizationCache,clock:()=>options.now??1000,
    // Explicit S3 transport fake: never contacts a live R2 endpoint in tests.
    createClient:()=>({
      async send(command){
        r2Calls.push(command.input);
        if(options.noR2)throw Object.assign(new Error('mock key missing'),{name:'NoSuchKey'});
        return {Body:{transformToByteArray:async()=>webp}};
      },
      destroy(){}
    })
  })});
  globalThis.fetch=async url=>{
    const parsed=new URL(String(url));requests.push(parsed);
    const action=parsed.searchParams.get('action');
    const payload= action==='publishedCatalog'
      ? {ok:true,data:{questions:options.unpublished?[]:[{
        id,countryIso:'rw',domain:'lifeCulture',type:'photo4',media:[{slot:1}]
      }]}}
      :options.unpublished? {ok:false} : {ok:true,data:{mime:'image/webp',base64:webp.toString('base64')}};
    return {ok:true,text:async()=>JSON.stringify(payload)};
  };
  try{await fn(requests,handler,r2Calls);}finally{
    globalThis.fetch=original.fetch;
    for(const [k,v] of Object.entries(original)){
      if(['fetch','endpoint'].includes(k))continue;
      if(v===undefined)delete process.env[k];else process.env[k]=v;
    }
    if(original.endpoint===undefined)delete process.env.MISSION_CREATOR_GAS_URL;
    else process.env.MISSION_CREATOR_GAS_URL=original.endpoint;
  }
}
test('R2 benchmark flag is preview-only and requires complete bucket config',()=>{
  assert.equal(isPreviewR2Request({r2pilot:'1'},env),true);
  assert.equal(isPreviewR2Request({r2pilot:'1'},{...env,VERCEL_ENV:'production'}),false);
  assert.equal(isPreviewR2Request({r2pilot:'0'},env),false);
  assert.equal(isPreviewR2Request({r2pilot:'1'},{...env,R2_BUCKET_NAME:'anything-else'}),false);
});
test('preview R2 benchmark verifies published status before reading private object',async()=>{
  await withFixture(async (urls,handler,r2Calls)=>{
    const r=response();await handler({method:'GET',query:{action:'image',questionId:id,slot:'1',r2pilot:'1'}},r);
    assert.equal(r.statusCode,200);
    assert.equal(r.headers['X-TimePalette-Image-Source'],'r2');
    assert.equal(Buffer.compare(r.body,webp),0);
    assert.equal(urls.length,1);
    assert.equal(urls[0].searchParams.get('action'),'publishedCatalog');
    assert.deepEqual(r2Calls,[{Bucket:'timepalette-public-webp',Key:`pilot/${id}/P01.webp`}]);
  });
});
test('unpublished image is NOT accessible even when previously copied into R2',async()=>{
  await withFixture(async (urls,handler,r2Calls)=>{
    const r=response();await handler({method:'GET',query:{action:'image',questionId:id,slot:'1',r2pilot:'1'}},r);
    assert.equal(r.statusCode,404);
    assert.equal(r2Calls.length,0);
    assert.equal(urls.length,2);
    assert.equal(urls[1].searchParams.get('action'),'publishedPhoto');
  },{unpublished:true});
});
test('R2 not found silently falls back to published GAS photo',async()=>{
  await withFixture(async (urls,handler,r2Calls)=>{
    const r=response();await handler({method:'GET',query:{action:'image',questionId:id,slot:'1',r2pilot:'1'}},r);
    assert.equal(r.statusCode,200);
    assert.equal(r.headers['X-TimePalette-Image-Source'],'gas');
    assert.equal(urls.length,2);
  },{noR2:true});
});
test('ordinary image requests continue using GAS without touching R2',async()=>{
  await withFixture(async (urls,handler,r2Calls)=>{
    const r=response();await handler({method:'GET',query:{action:'image',questionId:id,slot:'1'}},r);
    assert.equal(r.statusCode,200);
    assert.equal(r.headers['X-TimePalette-Image-Source'],'gas');
    assert.equal(r2Calls.length,0);
    assert.equal(urls.length,1);
  });
});

test('warm grant removes redundant GAS authorization while retaining bounded CDN lifetime',async()=>{
  await withFixture(async (urls,handler,r2Calls)=>{
    const query={action:'image',questionId:id,slot:'1',r2pilot:'1',bench:'1'};
    const cold=response();await handler({method:'GET',query},cold);
    const warm=response();await handler({method:'GET',query},warm);
    assert.equal(cold.statusCode,200);assert.equal(warm.statusCode,200);
    assert.equal(cold.headers['X-TimePalette-Auth-Cache'],'MISS');
    assert.equal(warm.headers['X-TimePalette-Auth-Cache'],'HIT');
    assert.match(warm.headers['Server-Timing'],/publication;dur=0/);
    assert.match(warm.headers['Server-Timing'],/r2;dur=/);
    assert.equal(warm.headers['Cache-Control'],`public, s-maxage=${PREVIEW_CDN_TTL_SECONDS}, max-age=0`);
    assert.equal(urls.length,1,'GAS catalog should be fetched once');
    assert.equal(r2Calls.length,2);
  });
});
test('expired grant rechecks GAS and blocks a stopped publication',async()=>{
  const options={now:1000,unpublished:false};
  await withFixture(async (urls,handler,r2Calls)=>{
    const query={action:'image',questionId:id,slot:'1',r2pilot:'1',bench:'2'};
    const first=response();await handler({method:'GET',query},first);
    assert.equal(first.statusCode,200);
    options.unpublished=true;
    options.now+=PREVIEW_AUTH_TTL_MS+1;
    const second=response();await handler({method:'GET',query},second);
    assert.equal(second.statusCode,404);
    assert.equal(r2Calls.length,1,'expired/denied publication must not read R2');
    assert.deepEqual(urls.map(url=>url.searchParams.get('action')),
      ['publishedCatalog','publishedCatalog','publishedPhoto']);
  },options);
});
test('publication TTL and CDN TTL stay strictly under prior 30-second bound',()=>{
  assert.ok(PREVIEW_AUTH_TTL_MS/1000+PREVIEW_CDN_TTL_SECONDS <= 30);
});
