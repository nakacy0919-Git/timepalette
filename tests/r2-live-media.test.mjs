import test from 'node:test';
import assert from 'node:assert/strict';
import {liveEnabled,validScope,liveManifestKey,stopMedia,publishMedia,markCatalogReady} from '../lib/r2-live-media.js';
const id='12345678-1234-1234-1234-123456789abc';
const env={R2_MEDIA_ENABLED:'true',R2_ACCOUNT_ID:'a'.repeat(32),R2_ACCESS_KEY_ID:'test',R2_SECRET_ACCESS_KEY:'test',R2_BUCKET_NAME:'timepalette-public-webp'};
const endpoint='https://script.google.com/macros/s/deployment/exec';
const base64=Buffer.from('RIFFzzzzWEBPxxxx','ascii').toString('base64');
const catalog=(type='photoText4')=>({ok:true,data:{questions:[{id,countryIso:'rw',domain:'lifeCulture',type,media:type==='text4'?[]:[{slot:1}]}]}});
function fixture(type='photoText4'){
 const calls=[], commands=[];
 const fetcher=async(url,opts)=>{const action=new URL(url).searchParams.get('action');calls.push(action);const response=action==='publishedCatalog'?catalog(type):{ok:true,data:{mime:'image/webp',base64}};return {status:200,ok:true,text:async()=>JSON.stringify(response)};};
 const createClient=()=>({send:async x=>{commands.push(x);return {ContentLength:100}},destroy(){}});
 return {calls,commands,fetcher,createClient};
}
test('env and scope gates are strict',()=>{assert.equal(liveEnabled(env),true);assert.equal(liveEnabled({...env,R2_MEDIA_ENABLED:'false'}),false);assert.equal(validScope(id,'rw','lifeCulture'),true);assert.equal(validScope(id,'../../etc','lifeCulture'),false);});
test('publishing photo writes image BEFORE manifest',async()=>{
 const f=fixture(),result=await publishMedia({id,iso:'rw',domain:'lifeCulture',endpoint,env,fetcher:f.fetcher,createClient:f.createClient});
 assert.equal(result.status,'ready');assert.equal(result.count,1);
 assert.deepEqual(f.calls,['publishedCatalog','publishedPhoto','publishedCatalog']);
 assert.equal(f.commands.length,2);
 assert.match(f.commands[0].input.Key,/live-v1\/.*P01-[a-f0-9]{20}\.webp/);
 assert.equal(f.commands[1].input.Key,liveManifestKey(id));
 const manifest=JSON.parse(f.commands[1].input.Body);assert.equal(manifest.id,id);assert.equal(manifest.iso,'rw');
});
test('text question needs no image writes',async()=>{
 const f=fixture('text4'),r=await publishMedia({id,iso:'rw',domain:'lifeCulture',endpoint,env,fetcher:f.fetcher,createClient:f.createClient});
 assert.equal(r.status,'text-only');assert.equal(f.commands.length,0);
});
test('publication missing blocks all R2 writes',async()=>{
 const f=fixture();const fetcher=async()=>({status:200,ok:true,text:async()=>JSON.stringify({ok:true,data:{questions:[]}})});
 await assert.rejects(()=>publishMedia({id,iso:'rw',domain:'lifeCulture',endpoint,env,fetcher,createClient:f.createClient}),/Not published/);
 assert.equal(f.commands.length,0);
});
test('unpublish deletes only matching manifest',async()=>{
 const f=fixture();await stopMedia({id,env,createClient:f.createClient});
 assert.equal(f.commands.length,1);assert.equal(f.commands[0].input.Key,liveManifestKey(id));
});
test('catalog uses R2 only when manifest is available',async()=>{
 const f=fixture();const q=catalog().data.questions;
 const out=await markCatalogReady(q,{env,createClient:f.createClient});
 assert.match(out[0].r2MediaBase,/workers\.dev\/v2\/rw\/lifeCulture/);
 const gas=await markCatalogReady(q,{env:{...env,R2_MEDIA_ENABLED:'false'},createClient:f.createClient});
 assert.equal(gas[0].r2MediaBase,undefined);
});
