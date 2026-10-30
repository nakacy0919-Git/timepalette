import test from 'node:test';
import assert from 'node:assert/strict';
let id=0;
async function fixture(state='running',enabled=true){
 const records={notes:[],resumes:0,contexts:[]};
 class Context{
  state=state;currentTime=1;destination={};
  constructor(){records.contexts.push(this);}
  resume(){records.resumes++;this.state='running';return Promise.resolve();}
  createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}};}
  createOscillator(){const note={};records.notes.push(note);return{frequency:{setValueAtTime(v){note.frequency=v;},exponentialRampToValueAtTime(){}},connect(){},start(t){note.start=t;},stop(t){note.stop=t;}};}
 }
 globalThis.window={AudioContext:Context,localStorage:{getItem:()=>enabled?'on':'off',setItem(){}}};
 const sound=await import(`../src/utils/uiSound.js?test=${++id}`);return{records,sound};
}
test('correct actions and completion use distinct complete bell sequences without duplicate playback',async()=>{
 const{records,sound}=await fixture();sound.playUiSound('correct');assert.deepEqual(records.notes.map(n=>n.frequency),[587.33,880]);
 sound.playUiSound('correct');assert.equal(records.notes.length,2);
 sound.playUiSound('success');assert.equal(records.notes.length,7);assert.ok(records.notes.every(n=>n.stop>n.start));
 sound.playUiSound('success');assert.equal(records.notes.length,7);
});
test('Safari interrupted or suspended audio resumes before notes are scheduled',async()=>{
 for(const state of ['interrupted','suspended']){const{records,sound}=await fixture(state);sound.prepareUiSound();await Promise.resolve();sound.playUiSound('success');assert.equal(records.resumes,1);assert.equal(records.notes.length,5);}
});
test('muting is respected and a closed audio context is recreated',async()=>{
 let f=await fixture('suspended',false);f.sound.prepareUiSound();f.sound.playUiSound('success');assert.equal(f.records.contexts.length,0);
 f=await fixture();f.sound.prepareUiSound();f.records.contexts[0].state='closed';f.sound.playUiSound('correct');assert.equal(f.records.contexts.length,2);assert.equal(f.records.notes.length,2);
 delete globalThis.window;
});
