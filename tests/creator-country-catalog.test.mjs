import test from 'node:test';import assert from 'node:assert/strict';
import {fetchPublishedCountry} from '../src/utils/publishedMissionCatalog.js';
const question=(domain,i=0)=>({id:`aaaaaaaa-aaaa-4aaa-aaaa-${String(i).padStart(12,'0')}`,countryIso:'au',domain,type:'text4',prompt:'Question '+i,answer:'A',choices:['B','C','D']});
test('loads all four Creator categories, retaining more than ten per category',async()=>{
 const calls=[];
 const missions=await fetchPublishedCountry('au',{fetcher:async url=>{
  const u=new URL(url,'https://example.invalid');calls.push(u.searchParams.get('domain'));
  const domain=u.searchParams.get('domain');return {ok:true,json:async()=>({ok:true,questions:Array.from({length:12},(_,i)=>question(domain,['language','lifeCulture','japanConnection','thinkConnect'].indexOf(domain)*100+i))})};
 }});
 assert.equal(missions.length,48);assert.deepEqual(new Set(calls),new Set(['language','lifeCulture','japanConnection','thinkConnect']));
 assert.ok(missions.every(m=>m.id.startsWith('au-mc-')));
});
test('scope mismatch rejects the load rather than mixing countries',async()=>{
 await assert.rejects(fetchPublishedCountry('au',{fetcher:async()=>({ok:true,json:async()=>({ok:true,questions:[{...question('language'),countryIso:'rw'}]})})}),/scope/);
});
test('failed category does not return a misleading partial success',async()=>{
 await assert.rejects(fetchPublishedCountry('au',{fetcher:async()=>({ok:false})}),/failed/);
});
