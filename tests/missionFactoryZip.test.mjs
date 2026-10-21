import {test} from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {readMissionFactoryZip} from '../src/mission-creator/missionFactoryImport.js';
import {FACTORY_VERSION} from '../src/mission-creator/missionFactorySchema.js';

function manifest(count=5){return {version:FACTORY_VERSION,questions:Array.from({length:count},(_,i)=>({
  countryIso:'rw',domain:'lifeCulture',type:'photoText4',prompt:`ZIP test ${i+1}`,
  answer:'Correct',choices:['Wrong A','Wrong B','Wrong C'],
  learning:{levels:['elementary','juniorHigh']},images:{1:`images/test-${i+1}.png`}
}))};}
async function fixture({missingImage=false,malicious=false,oversize=false}={}){
  const data=manifest();const zip=new JSZip();
  zip.file('questions.json',JSON.stringify(data));
  for(let i=1;i<=5;i++){
    if(missingImage&&i===2)continue;
    zip.file(`images/test-${i}.png`,oversize&&i===1?new Uint8Array(15*1024*1024+1):new Uint8Array([137,80,78,71,13,10,26,10]));
  }
  if(malicious)zip.file('../secret.png','unsafe');
  const buffer=await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'});
  buffer.name='test.zip';buffer.size=buffer.byteLength;
  return buffer;
}
test('loads five image quizzes from a real ZIP and resolves every image',async()=>{
  const data=await readMissionFactoryZip(await fixture());
  assert.equal(data.items.length,5);
  assert.equal(data.items[1].images[0].entry.name,'images/test-2.png');
});
test('rejects missing images before writing any question',async()=>{
  await assert.rejects(readMissionFactoryZip(await fixture({missingImage:true})),/がZIP内にありません/);
});
test('rejects traversal payload and unexpected entries',async()=>{
  await assert.rejects(readMissionFactoryZip(await fixture({malicious:true})),/ZIP内に不正なファイルパス/);
});
test('rejects decompression bomb sized image before image extraction',async()=>{
  await assert.rejects(readMissionFactoryZip(await fixture({oversize:true})),/ファイルサイズが不正/);
});
