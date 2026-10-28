import fs from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {answerFingerprint} from './geography-answer-fingerprint.mjs';
const fingerprint=answerFingerprint();
const jobs=[false,true].flatMap(touch=>[{width:1024,height:768},{width:820,height:1180}].map(viewport=>({touch,viewport,path:`docs/qa/rwanda-format-${touch?'touch':'mouse'}-${viewport.width}.json`})));
const results=await Promise.allSettled(jobs.map((job,index)=>new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['scripts/qa-geography-browser.mjs'],{stdio:'inherit',env:{...process.env,QA_GROUP:'A',QA_TOUCH:job.touch?'1':'0',QA_COUNTRIES:'',QA_MISSIONS:'',QA_PORT:String(4187+index),QA_VIEWPORTS:JSON.stringify([job.viewport]),QA_REPORT_PATH:job.path}});
 child.on('error',reject);child.on('exit',code=>code===0?resolve(job):reject(Error(job.path+' exit '+code)));
})));
for(const result of results)if(result.status==='rejected')throw result.reason;
assert.equal(answerFingerprint(),fingerprint,'Source changed during matrix run');
for(const touch of [false,true]){
 const reports=jobs.filter(j=>j.touch===touch).map(j=>JSON.parse(fs.readFileSync(j.path)));
 for(const report of reports){assert.equal(report.answerFingerprint,fingerprint);assert.equal(report.rows.length,110);}
 const merged={...reports[0],scope:'A group complete Rwanda answer-contract matrix: both tablet viewports',finishedAt:new Date().toISOString(),rows:reports.flatMap(r=>r.rows)};
 assert.equal(new Set(merged.rows.map(r=>r.country+':'+r.mission+':'+r.viewport)).size,220);
 fs.writeFileSync('docs/qa/geography-A-'+(touch?'touch':'release')+'-browser.json',JSON.stringify(merged,null,2)+'\n');
}
console.log('PASS: A110 x two viewports x mouse/touch = 440 cases');
