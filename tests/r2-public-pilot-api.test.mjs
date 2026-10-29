import test from 'node:test';
import assert from 'node:assert/strict';
import {createR2PublicPilotHandler} from '../api/mission-r2-public-pilot.js';
import {leaseKey} from '../lib/r2-public-lease.js';
const id='12345678-1234-1234-1234-123456789abc';
const sess='a'.repeat(64);
const orig={...Object.fromEntries(['VERCEL_ENV','R2_ACCOUNT_ID','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_BUCKET_NAME','MISSION_CREATOR_GAS_URL'].map(k=>[k,process.env[k]]))};
function mockRes(){return {headers:{},statusCode:0,body:null,setHeader(k,v){this.headers[k]=v;},status(v){this.statusCode=v;return this;},json(b){this.body=b;return this;}};}
function fixture({unpublished=false}={}){
 const calls=[];
 const fetcher=async(url,opt={})=>{
   const action=opt.method==='POST'?JSON.parse(opt.body).action:new URL(url).searchParams.get('action');
   calls.push(action);
   let data;
   if(action==='getPublicationOrder')data={ok:true,data:{countryIso:'rw',domain:'lifeCulture',questionIds:[id]}};
   else if(action==='publishedCatalog')data={ok:true,data:{questions:unpublished?[]:[{id,countryIso:'rw',domain:'lifeCulture',type:'photoText4',media:[{slot:1}]}]}};
   else throw Error('Unexpected GAS request');
   return {ok:true,text:async()=>JSON.stringify(data)};
 };
 const commands=[];
 const createClient=()=>({send:async c=>{
   commands.push({kind:c.constructor.name,parameters:c.input});
   if(c.constructor.name==='HeadObjectCommand')return {ContentLength:200};
   return {};
 },destroy(){}});
 return {handler:createR2PublicPilotHandler({fetcher,createClient,now:()=>1760000000000}),calls,commands};
}
async function withEnv(fn){
 Object.assign(process.env,{VERCEL_ENV:'preview',R2_ACCOUNT_ID:'a'.repeat(32),R2_ACCESS_KEY_ID:'test',R2_SECRET_ACCESS_KEY:'test',R2_BUCKET_NAME:'timepalette-public-webp',MISSION_CREATOR_GAS_URL:'https://script.google.com/macros/s/test/exec'});
 try{await fn();}finally{for(const [k,v] of Object.entries(orig)){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
}
test('published, admin-verified photo receives only a 30 second lease',async()=>withEnv(async()=>{
 const f=fixture(),res=mockRes();
 await f.handler({method:'POST',body:{action:'lease',questionId:id,slot:1,session:sess}},res);
 assert.equal(res.statusCode,200);
 assert.equal(res.body.expiresAt,1760000030000);
 assert.deepEqual(f.calls,['getPublicationOrder','publishedCatalog']);
 assert.deepEqual(f.commands.map(x=>x.kind),['HeadObjectCommand','PutObjectCommand']);
 assert.equal(f.commands[1].parameters.Key,leaseKey(id,1));
 const value=JSON.parse(String(f.commands[1].parameters.Body));
 assert.equal(value.expiresAt,1760000030000);
}));
test('unpublished photo cannot create a lease nor touch R2',async()=>withEnv(async()=>{
 const f=fixture({unpublished:true}),res=mockRes();
 await f.handler({method:'POST',body:{action:'lease',questionId:id,slot:1,session:sess}},res);
 assert.equal(res.statusCode,404);assert.deepEqual(f.commands,[]);
}));
test('revoke removes marker even if status changed; non-preview rejects all',async()=>withEnv(async()=>{
 const f=fixture(),res=mockRes();
 await f.handler({method:'POST',body:{action:'revoke',questionId:id,slot:1,session:sess}},res);
 assert.equal(res.statusCode,200);
 assert.deepEqual(f.commands.map(x=>x.kind),['DeleteObjectCommand']);
 assert.equal(f.commands[0].parameters.Key,leaseKey(id,1));
 process.env.VERCEL_ENV='production';
 const no=mockRes();await f.handler({method:'POST',body:{action:'lease',questionId:id,slot:1,session:sess}},no);
 assert.equal(no.statusCode,404);
}));
test('invalid session is rejected before any storage or media access',async()=>withEnv(async()=>{
 const f=fixture(),res=mockRes();
 await f.handler({method:'POST',body:{action:'lease',questionId:id,slot:1,session:'not-a-session'}},res);
 assert.equal(res.statusCode,403);assert.deepEqual(f.calls,[]);assert.deepEqual(f.commands,[]);
}));
test('admin and publication GAS reads start concurrently',async()=>withEnv(async()=>{
 const actions=[];
 let releaseAdmin,releaseCatalog;
 const adminWait=new Promise(resolve=>{releaseAdmin=resolve;});
 const catalogWait=new Promise(resolve=>{releaseCatalog=resolve;});
 const fetcher=async (url,opt={})=>{
   const action=opt.method==='POST'?JSON.parse(opt.body).action:new URL(url).searchParams.get('action');
   actions.push(action);
   if(action==='getPublicationOrder')await adminWait;
   else if(action==='publishedCatalog')await catalogWait;
   else throw Error('Unrecognized request');
   const data=action==='getPublicationOrder'?{ok:true,data:{countryIso:'rw',domain:'lifeCulture',questionIds:[id]}}:
     {ok:true,data:{questions:[{id,countryIso:'rw',domain:'lifeCulture',type:'photo4',media:[{slot:1}]}]}};
   return {ok:true,text:async()=>JSON.stringify(data)};
 };
 const commands=[];
 const createClient=()=>({send:async command=>{
   commands.push(command.constructor.name);return command.constructor.name==='HeadObjectCommand'?{ContentLength:200}:{};
 },destroy(){}});
 const handler=createR2PublicPilotHandler({fetcher,createClient,now:()=>1760000000000});
 const res=mockRes();
 const pending=handler({method:'POST',body:{action:'lease',questionId:id,slot:1,session:sess}},res);
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(actions,['getPublicationOrder','publishedCatalog']);
 releaseAdmin();releaseCatalog();await pending;
 assert.equal(res.statusCode,200);
 assert.deepEqual(commands,['HeadObjectCommand','PutObjectCommand']);
}));
test('GAS timeout identifies admin stage without exposing session secrets',async()=>withEnv(async()=>{
 const fetcher=async (url,opt={})=>{
   const action=opt.method==='POST'?JSON.parse(opt.body).action:new URL(url).searchParams.get('action');
   if(action==='getPublicationOrder'){const e=new Error('secret message');e.name='TimeoutError';throw e;}
   return {ok:true,text:async()=>JSON.stringify({ok:true,data:{questions:[{id,countryIso:'rw',domain:'lifeCulture',type:'photo4',media:[{slot:1}]}]}})};
 };
 const handler=createR2PublicPilotHandler({fetcher,createClient:()=>{throw Error('R2 must not be called');}});
 const res=mockRes();
 const old=console.error;console.error=()=>{};
 try{await handler({method:'POST',body:{action:'lease',questionId:id,slot:1,session:sess}},res);}
 finally{console.error=old;}
 assert.equal(res.statusCode,504);
 assert.match(res.body.error,/管理者確認/);
 assert.doesNotMatch(JSON.stringify(res.body),/secret|aaaaaa/i);
}));
