/* Zero-dependency functional smoke test for GAS business rules. */
const fs=require('fs');const path=require('path');const vm=require('vm');const assert=require('node:assert/strict');const crypto=require('node:crypto');
const sheets=new Map(),cache=new Map(),props={};let last=0;
class Grid {
 constructor(name){this.name=name;this.rows=[[]];}
 setName(n){this.name=n;}
 getDataRange(){return {getValues:()=>this.rows.map(r=>r.slice())};}
 getRange(row,col,h,w){return {setValues:(v)=>{for(let i=0;i<h;i++){this.rows[row-1+i] ||= [];for(let j=0;j<w;j++)this.rows[row-1+i][col-1+j]=v[i][j];}}};}
 appendRow(values){this.rows.push(values);}
}
class Book {
 constructor(id){this.id=id;this.tabs=[new Grid('Sheet1')];}
 getId(){return this.id;}getSheets(){return this.tabs;}insertSheet(n){const g=new Grid(n);this.tabs.push(g);return g;}
 getSheetByName(n){return this.tabs.find(x=>x.name===n);}
}
const files=new Map(),folders=new Map();
let parallelPhotoRequests=0;
const env={
 Utilities:{
  getUuid:()=>crypto.randomUUID(),
  computeDigest:(_alg,s)=>[...crypto.createHash('sha256').update(s).digest()].map(n=>n>127?n-256:n),
  DigestAlgorithm:{SHA_256:'SHA_256'},
  base64Decode:s=>[...Buffer.from(s,'base64')],
  base64Encode:b=>Buffer.from(b).toString('base64'),
  newBlob:(bytes,mime,name)=>({bytes,mime,name,getSize(){return bytes.length;},getBytes(){return bytes;}}),
 },
 SpreadsheetApp:{create:()=>{const id='sheet'+(++last);const b=new Book(id);sheets.set(id,b);return b;},openById:(id)=>sheets.get(id)},
 DriveApp:{createFolder:()=>{const id='folder'+(++last);const f={getId:()=>id,createFile:blob=>{const fileId='file'+(++last);files.set(fileId,blob);return {getId:()=>fileId};}};folders.set(id,f);return f;},getFolderById:id=>folders.get(id),getFileById:id=>({getBlob:()=>files.get(id)})},
  ScriptApp:{getOAuthToken:()=>'mock-token'},
  UrlFetchApp:{fetchAll:requests=>{
    parallelPhotoRequests++;
    return requests.map(request=>{
      const match=String(request.url).match(/\/files\/([^?]+)/);
      const id=match?decodeURIComponent(match[1]):'';
      const blob=files.get(id);
      return {
        getResponseCode:()=>blob?200:404,
        getBlob:()=>blob
      };
    });
  }},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperties:v=>Object.assign(props,v),setProperty:(k,v)=>{props[k]=v;},deleteProperty:k=>{delete props[k];}})},
  CacheService:{getScriptCache:()=>({
    get:k=>cache.get(k)||null,
    put:(k,v)=>cache.set(k,v),
    remove:k=>cache.delete(k),
    getAll:keys=>Object.fromEntries(
      keys.filter(k=>cache.has(k)).map(k=>[k,cache.get(k)])
    ),
    putAll:items=>{
      for(const [k,v] of Object.entries(items))cache.set(k,v);
    }
  })},
 LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{}})},
 ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({s,setMimeType(){return this;}})},
 Logger:{log:()=>{}},
};env.global=env;
vm.createContext(env);
const code=fs.readFileSync(path.join(__dirname,'../gas/mission-creator/Code.gs'),'utf8');vm.runInContext(code,env);
function run(code){return vm.runInContext(code,env);}
function call(request){return JSON.parse(run('doPost')({postData:{contents:JSON.stringify(request)}}).s);}
const setup=run('setupMissionCreator()');assert(setup.spreadsheetId&&setup.folderId);
// Teacher login: shared 4-digit PIN, first-time display name, then device-bound login.
props.TP_TEACHER_PIN_TO_SET='3939';
assert.equal(run('configureTeacherPinFromSettings()').includes('完了'),true);
assert.equal(props.TP_TEACHER_PIN_TO_SET,undefined);
assert.equal(call({action:'login',pin:'1111'}).ok,false);
const enroll=call({action:'login',pin:'3939'});
assert.equal(enroll.ok,true);assert.equal(enroll.data.needsName,true);
assert.equal(call({action:'bootstrap',session:enroll.data.registrationToken}).ok,false);
const enrolled=call({action:'registerTeacher',registrationToken:enroll.data.registrationToken,displayName:'Teacher One'});
assert.equal(enrolled.ok,true);assert(enrolled.data.teacherToken);
const restored=call({action:'login',pin:'3939',teacherToken:enrolled.data.teacherToken});
assert.equal(restored.ok,true);assert(restored.data.session);
const otherEnroll=call({action:'login',pin:'3939'}).data;
const other=call({action:'registerTeacher',registrationToken:otherEnroll.registrationToken,displayName:'Teacher Two'}).data;

const teacher=run("createTeacherInvite('Teacher','1234','teacher')");const admin=run("createTeacherInvite('Admin','9876','admin')");
assert.equal(call({action:'login',invite:teacher,pin:'0000'}).ok,false);
const teacherSession=call({action:'login',invite:teacher,pin:'1234'}).data.session;
const adminSession=call({action:'login',invite:admin,pin:'9876'}).data.session;
assert.equal(call({action:'login',adminMode:true,pin:'2468'}).ok,false);
props.TP_ADMIN_PIN_TO_SET='2468';
assert.equal(run('configureAdminPinFromSettings()'),'Admin PIN configured successfully');
assert.equal(props.TP_ADMIN_PIN_TO_SET,undefined);
assert.equal(call({action:'login',adminMode:true,pin:'0000'}).ok,false);
const simpleAdmin=call({action:'login',adminMode:true,pin:'2468'});
assert.equal(simpleAdmin.ok,true);
assert.equal(simpleAdmin.data.user.role,'admin');
assert.equal(simpleAdmin.data.expiresInSeconds,21600);
assert(teacherSession&&adminSession);
const saved=call({action:'saveQuestion',session:teacherSession,question:{countryIso:'rw',countryName:'ルワンダ',domain:'language',type:'photo4',prompt:'Which photo is correct?',answer:'',choices:[],sources:['https://example.org'],notes:'test'}});
assert.equal(saved.ok,true);const qid=saved.data.question.id;
assert.equal(call({action:'reviewQuestion',session:restored.data.session,questionId:qid,status:'approved'}).ok,false);
assert.equal(call({action:'saveQuestion',session:other.session,question:{id:qid,countryIso:'rw',domain:'language',type:'photo4',prompt:'Steal'}}).ok,false);

assert.equal(call({action:'reviewQuestion',session:teacherSession,questionId:qid,status:'approved'}).ok,false);
assert.equal(call({action:'submitQuestion',session:teacherSession,questionId:qid}).ok,false);
const webp=Buffer.from('RIFF\x08\x00\x00\x00WEBP----','binary').toString('base64');
for(let i=1;i<=4;i++) assert.equal(call({action:'uploadImage',session:teacherSession,questionId:qid,slot:i,base64:webp}).ok,true);
assert.equal(call({action:'submitQuestion',session:teacherSession,questionId:qid}).ok,true);
assert.equal(call({action:'reviewQuestion',session:adminSession,questionId:qid,status:'approved'}).ok,true);
assert.equal(call({action:'saveQuestion',session:teacherSession,question:{id:qid,countryIso:'rw',countryName:'ルワンダ',domain:'language',type:'photo4',prompt:'Edit after approval'}}).ok,false);
assert.equal(call({action:'setProgress',session:teacherSession,countryIso:'rw',domain:'time',manualDone:10}).ok,false);
assert.equal(call({action:'setProgress',session:adminSession,countryIso:'rw',domain:'time',manualDone:10}).ok,true);
const combined=call({
  action:'login',adminMode:true,pin:'2468',withBootstrap:true
});
assert.equal(combined.ok,true);
assert.equal(combined.data.bootstrap.questions.some(q=>q.id===qid),true);
const dash=call({action:'bootstrap',session:teacherSession});assert.equal(dash.data.questions[0].status,'approved');assert.equal(dash.data.progress['rw:time'],10);
const batch=call({action:'getMediaBatch',
  session:teacherSession,questionId:qid});
assert.equal(batch.ok,true);
assert.equal(batch.data.photos.length,4);
assert.equal(batch.data.photos.find(p=>p.slot===1).base64,webp);
assert.equal(batch.data.errors.length,0);
assert.equal(batch.data.perf.parallel,true);
assert.equal(parallelPhotoRequests>0,true);
const previousParallelRequests=parallelPhotoRequests;
const cachedBatch=call({
  action:'getMediaBatch',
  session:teacherSession,
  questionId:qid
});
assert.equal(cachedBatch.ok,true);
assert.equal(cachedBatch.data.perf.cacheHits,4);
assert.equal(parallelPhotoRequests,previousParallelRequests);
// Fast admin moderation: incomplete drafts cannot pass; completed drafts can.
const fastSaved=call({action:'saveQuestion',session:adminSession,question:{countryIso:'rw',countryName:'ルワンダ',domain:'lifeCulture',type:'photo4',prompt:'Fast moderation of a complete draft'}});
assert.equal(fastSaved.ok,true);
const fastId=fastSaved.data.question.id;
assert.equal(call({action:'reviewQuestion',session:adminSession,questionId:fastId,status:'approved'}).ok,false);
for(let i=1;i<=4;i++)assert.equal(call({action:'uploadImage',session:adminSession,questionId:fastId,slot:i,base64:webp}).ok,true);
const approvedDraft=call({action:'reviewQuestion',session:adminSession,questionId:fastId,status:'approved'});
assert.equal(approvedDraft.ok,true);
assert.equal(approvedDraft.data.status,'approved');
assert.equal(typeof approvedDraft.data.updatedAt,'string');
assert.equal(approvedDraft.data.reviewNote,'');
const teacherVisible=call({action:'bootstrap',session:other.session}).data.questions.find(q=>q.id===fastId);
assert.equal(teacherVisible.status,'approved');
assert.equal(Boolean(teacherVisible.media[0].createdAt),true);
assert.equal(call({action:'reviewQuestion',session:adminSession,questionId:fastId,status:'needs_revision',reviewNote:'Please revise'}).ok,true);
assert.equal(call({action:'reviewQuestion',session:adminSession,questionId:fastId,status:'approved'}).ok,true);
const adminDraft=call({action:'saveQuestion',session:adminSession,question:{countryIso:'rw',countryName:'ルワンダ',domain:'lifeCulture',type:'free',prompt:'A draft to delete'}}).data.question.id;
assert.equal(call({action:'deleteQuestion',session:adminSession,questionId:adminDraft}).ok,true);
const m=call({action:'getMedia',session:teacherSession,questionId:qid,slot:1});assert.equal(m.ok,true);assert.equal(m.data.base64,webp);
assert.equal(call({action:'deleteQuestion',session:teacherSession,questionId:qid}).ok,false);
assert.equal(call({action:'deleteQuestion',session:adminSession,questionId:qid}).ok,true);
const archivedTeacher=call({action:'bootstrap',session:teacherSession});
assert.equal(archivedTeacher.data.questions.some(q=>q.id===qid),false);
const archivedAdmin=call({action:'bootstrap',session:adminSession});
assert.equal(archivedAdmin.data.questions.find(q=>q.id===qid).status,'deleted');
assert.equal(call({action:'getMedia',session:teacherSession,questionId:qid,slot:1}).ok,false);
assert.equal(call({action:'getMedia',session:adminSession,questionId:qid,slot:1}).ok,true);
assert.equal(call({action:'reviewQuestion',session:adminSession,questionId:qid,status:'needs_revision'}).ok,false);
assert.equal(call({action:'restoreQuestion',session:teacherSession,questionId:qid}).ok,false);
assert.equal(call({action:'restoreQuestion',session:adminSession,questionId:qid}).ok,true);
assert.equal(call({action:'bootstrap',session:teacherSession}).data.questions.find(q=>q.id===qid).status,'submitted');
assert.equal(call({action:'getMedia',session:teacherSession,questionId:qid,slot:1}).ok,true);
console.log('PASS: login, roles, photos, review, progress, archive and restore');
