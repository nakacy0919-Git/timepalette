import test from 'node:test';
import assert from 'node:assert/strict';
import missionCreatorHandler from '../api/mission-creator.js';

const endpoint='https://script.google.com/macros/s/test/exec';
const redirectPrefix='https://script.googleusercontent.com/macros/echo?user_content_key=';
function respond(status,body,options={}){
 const r=new Response(body,{status,headers:{'Content-Type':options.type||'application/json',...(options.location?{'Location':options.location}:{})}});
 Object.defineProperty(r,'url',{value:options.url||endpoint});
 return r;
}
function res(){return {statusCode:0,body:null,headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(obj){this.body=obj;return this;}};}
async function fixture(fn){
 const origFetch=globalThis.fetch,origEnv=process.env.VERCEL_ENV,origEndpoint=process.env.MISSION_CREATOR_GAS_URL,origErr=console.error;
 process.env.VERCEL_ENV='preview';process.env.MISSION_CREATOR_GAS_URL=endpoint;
 try{await fn();}finally{
  globalThis.fetch=origFetch;console.error=origErr;
  if(origEnv===undefined)delete process.env.VERCEL_ENV;else process.env.VERCEL_ENV=origEnv;
  if(origEndpoint===undefined)delete process.env.MISSION_CREATOR_GAS_URL;else process.env.MISSION_CREATOR_GAS_URL=origEndpoint;
 }
}
test('login: one-time Google HTML 404 is retried once; redirect is GET only',async()=>fixture(async()=>{
 const methods=[];let attempts=0;
 globalThis.fetch=async(url,opts)=>{
  const u=String(url);methods.push([opts.method,u]);
  if(u===endpoint){attempts++;return respond(302,'',{location:redirectPrefix+attempts});}
  if(u===redirectPrefix+'1')return respond(404,'<html>not found</html>',{type:'text/html',url:u});
  if(u===redirectPrefix+'2')return respond(200,JSON.stringify({ok:true,data:{user:{role:'admin'}}}),{url:u});
  throw Error('Unexpected host or call');
 };
 const response=res();await missionCreatorHandler({method:'POST',body:{action:'login',pin:'0000'}},response);
 assert.equal(response.statusCode,200);assert.equal(response.body.ok,true);
 assert.deepEqual(methods.map(x=>x[0]),['POST','GET','POST','GET']);
 assert.ok(methods.filter(x=>x[0]==='POST').every(x=>x[1]===endpoint));
}));
test('mutating publication must never be retried or use manual redirects',async()=>fixture(async()=>{
 let calls=0;globalThis.fetch=async(url,opts)=>{
  calls++;assert.equal(opts.redirect,'follow');
  return respond(404,'<html>temporary error</html>',{url:redirectPrefix+'bad',type:'text/html'});
 };
 console.error=()=>{};
 const response=res();await missionCreatorHandler({method:'POST',body:{action:'setPublication',questionId:'x'}},response);
 assert.equal(calls,1);assert.equal(response.statusCode,502);
}));
test('normal JSON application denial does not retry login',async()=>fixture(async()=>{
 let calls=0;globalThis.fetch=async(url,opts)=>{calls++;return respond(200,JSON.stringify({ok:false,error:'Invalid PIN'}),{url:redirectPrefix+'json'});};
 const response=res();await missionCreatorHandler({method:'POST',body:{action:'login',pin:'0000'}},response);
 assert.equal(calls,1);assert.equal(response.body.ok,false);
}));
test('unexpected redirect cannot be followed and no user credentials are logged',async()=>fixture(async()=>{
 let calls=0;globalThis.fetch=async(url,opts)=>{calls++;return respond(302,'',{location:'https://example.org/collect'});};
 const orig=console.error;const messages=[];console.error=(...args)=>messages.push(JSON.stringify(args));
 try{
  const response=res();await missionCreatorHandler({method:'POST',body:{action:'login',pin:'1234'}},response);
  assert.equal(calls,1);assert.equal(response.statusCode,502);
  assert.equal(messages.some(s=>s.includes('1234')),false);
 }finally{console.error=orig;}
}));
test('production login behavior stays untouched',async()=>fixture(async()=>{
 process.env.VERCEL_ENV='production';let calls=0;
 globalThis.fetch=async(url,opts)=>{calls++;assert.equal(opts.redirect,'follow');return respond(200,JSON.stringify({ok:false,error:'authorization denied'}));};
 const response=res();await missionCreatorHandler({method:'POST',body:{action:'login',pin:'0000'}},response);
 assert.equal(calls,1);assert.equal(response.statusCode,200);
}));
