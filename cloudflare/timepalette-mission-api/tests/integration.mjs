import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pbkdf2Sync,randomBytes} from 'node:crypto';
import worker from '../src/index.js';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
const original=new URL('../../timepalette-r2-worker/migrations/0001_init_mission_creator.sql',import.meta.url);
db.exec(fs.readFileSync(original,'utf8'));db.exec(fs.readFileSync(new URL('../../timepalette-r2-worker/migrations/0002_auth.sql',import.meta.url),'utf8'));
db.exec(fs.readFileSync(
  new URL('../../timepalette-r2-worker/migrations/0003_creator_video.sql',import.meta.url),
  'utf8'
));
db.exec(fs.readFileSync(
  new URL('../../timepalette-r2-worker/migrations/0004_creator_learning.sql',import.meta.url),
  'utf8'
));
const wrapped={
 prepare(sql){return{_args:[],bind(...args){this._args=args;return this;},first(){return db.prepare(sql).get(...this._args)||null;},all(){return{results:db.prepare(sql).all(...this._args)};},run(){const data=db.prepare(sql).run(...this._args);return {meta:{changes:data.changes}}}};},
 async batch(statements){const out=[];db.exec('BEGIN');try{for(const s of statements)out.push(s.run());db.exec('COMMIT');return out;}catch(e){db.exec('ROLLBACK');throw e;}}
};
const bucket=new Map();const env={DB:wrapped,MEDIA:{async put(k,v){bucket.set(k,Buffer.from(v));},async get(k){const data=bucket.get(k);return data?{size:data.length,body:data,arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)}:null;},async delete(k){bucket.delete(k);}},TP_BRIDGE_SECRET:'a'.repeat(64)};
function cred(teacherId,name,pw,role){const salt=randomBytes(16).toString('hex');const hash=pbkdf2Sync(pw,Buffer.from(salt,'hex'),180000,32,'sha256').toString('hex');db.prepare('INSERT INTO teachers(id,login_id,name,role,active,password_salt,password_hash,password_iterations) VALUES(?,?,?,?,1,?,?,180000)').run(teacherId,teacherId.replaceAll('-','').slice(0,12),name,role,salt,hash);}
const aid='aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',tid='bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbbb';cred(aid,'admin','a-long-admin-password','admin');cred(tid,'teacher','teacher-password-long','teacher');
async function request(action,body={},auth){return worker.fetch(new Request('https://fake/private',{method:'POST',headers:{'X-TP-Bridge':auth||env.TP_BRIDGE_SECRET,'Content-Type':'application/json'},body:JSON.stringify({action,...body})}),env);}
async function invoke(action,body={},code=200){const r=await request(action,body);assert.equal(r.status,code,action+': '+await r.clone().text());return r.json();}
const login=await invoke('login',{account:'admin',password:'a-long-admin-password',withBootstrap:true});assert.equal(login.data.bootstrap.questions.length,0);assert.equal(login.data.user.loginId.length,12);const admin=login.data.session;
const teacher=(await invoke('login',{account:tid.replaceAll('-','').slice(0,12),password:'teacher-password-long',withBootstrap:true})).data.session;
assert.equal((await request('bootstrap',{session:admin},'bad')).status,404);
assert.equal((await request('bootstrap',{session:'a'.repeat(64)})).status,401);
const fresh=await invoke('saveQuestion',{session:teacher,question:{countryIso:'rw',countryName:'Rwanda',domain:'lifeCulture',type:'text4',prompt:'Question?',answer:'A',choices:['B','C','D']} });
const qid=fresh.data.question.id;assert.ok(qid);
const ownerView=await invoke('bootstrap',{session:teacher});assert.equal(ownerView.data.questions.length,1);
const approved=await invoke('reviewQuestion',{session:admin,questionId:qid,status:'approved'});assert.equal(approved.data.status,'approved');
await invoke('setPublication',{session:admin,questionId:qid,mode:'publish',rightsConfirmed:true});
let cat=await worker.fetch(new Request('https://fake/public/catalog?country=rw&domain=lifeCulture'),env);let c=await cat.json();assert.equal(c.questions[0].id,qid);assert.equal(c.questions[0].choices.length,3);
const before=(await worker.fetch(new Request('https://fake/public/image?questionId='+qid+'&slot=1'),env));assert.equal(before.status,404);
await invoke('setPublication',{session:admin,questionId:qid,mode:'unpublish'});
cat=await worker.fetch(new Request('https://fake/public/catalog?country=rw&domain=lifeCulture'),env);assert.equal((await cat.json()).questions.length,0);
const invite=await invoke('issueInvite',{session:admin,teacherId:tid});const token=invite.data.enrollmentToken;
const reg=await invoke('registerTeacher',{registrationToken:token,password:'new-password-is-long-enough',withBootstrap:true});assert.ok(reg.data.session);await invoke('registerTeacher',{registrationToken:token,password:'new-password-is-long-enough'},403);
await invoke('login',{account:'teacher',password:'new-password-is-long-enough'});
console.log('PASS integration: auth, sessions, ownership, questions, review, publication, catalog, revocation, one-time enrollment');
const photoQ=(await invoke('saveQuestion',{session:admin,question:{countryIso:'rw',countryName:'Rwanda',domain:'language',type:'photoText4',prompt:'Which word?',answer:'A',choices:['B','C','D']}})).data.question;
const photoBytes=Buffer.concat([Buffer.from('RIFF'),Buffer.from([14,0,0,0]),Buffer.from('WEBP'),Buffer.alloc(10,55)]);
const photo=await invoke('uploadImage',{session:admin,questionId:photoQ.id,slot:1,base64:photoBytes.toString('base64')});
assert.equal(photo.data.size,photoBytes.length);
await invoke('reviewQuestion',{session:admin,questionId:photoQ.id,status:'approved'});
await invoke('setPublication',{session:admin,questionId:photoQ.id,mode:'publish',rightsConfirmed:true});
const publicImg=await worker.fetch(new Request('https://fake/public/image?questionId='+photoQ.id+'&slot=1'),env);
assert.equal(publicImg.status,200);assert.equal(Buffer.from(await publicImg.arrayBuffer()).toString('hex'),photoBytes.toString('hex'));
await invoke('setPublication',{session:admin,questionId:photoQ.id,mode:'unpublish'});
assert.equal((await worker.fetch(new Request('https://fake/public/image?questionId='+photoQ.id+'&slot=1'),env)).status,404);
console.log('PASS integration: private R2 WebP upload and immediate public-image revocation');

const sameNameId='cccccccc-cccc-4ccc-cccc-cccccccccccc';cred(sameNameId,'teacher','second-teacher-password','teacher');
await invoke('login',{account:tid.replaceAll('-','').slice(0,12),password:'new-password-is-long-enough'});
await invoke('login',{account:sameNameId.replaceAll('-','').slice(0,12),password:'second-teacher-password'});
await invoke('login',{account:'teacher',password:'new-password-is-long-enough'},401);
console.log('PASS integration: duplicate teacher names isolated using stable login IDs');

const newTeacher=await invoke('createTeacher',{session:admin,name:'Global Teacher'});
assert.equal(newTeacher.data.teacher.loginId.length,12);
const newReg=await invoke('registerTeacher',{registrationToken:newTeacher.data.enrollmentToken,password:'welcome-new-teacher-password'});
assert.equal(newReg.data.user.name,'Global Teacher');
console.log('PASS integration: admin creates teacher and sends one-time onboarding invite');


// VIDEO_AUTHOR_INTEGRATION_V1
const videoTeacher = (await invoke('login', {
  account: tid.replaceAll('-', '').slice(0, 12),
  password: 'new-password-is-long-enough'
})).data.session;
const sampleVideo = {
  youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
  startSeconds: 15,
  endSeconds: 90,
  minChars: 5,
  maxChars: 100,
  keywords: ['learn', 'notice'],
  keywordMode: 'all'
};

const sampleProfile = {
  name: 'Test Teacher',
  school: 'Test School',
  region: 'Test Region',
  bio: 'Educational content creator',
  consent: true
};

for (const [type, domain, profileConsent] of [
  ['video4', 'language', true],
  ['videoReflect', 'lifeCulture', false]
]) {
  const saved = await invoke('saveQuestion', {
    session: videoTeacher,
    question: {
      countryIso: 'rw',
      countryName: 'Rwanda',
      domain,
      type,
      prompt: 'Test video learning mission',
      answer: type === 'video4' ? 'Correct' : '',
      choices: type === 'video4'
        ? ['Wrong A', 'Wrong B', 'Wrong C'] : [],
      authorProfile: sampleProfile,
      video: sampleVideo
    }
  });

  const id = saved.data.question.id;
  assert.ok(id);

  await invoke('submitQuestion', {
    session: videoTeacher, questionId: id
  });

  await invoke('reviewQuestion', {
    session: admin, questionId: id, status: 'approved'
  });

  // A teacher must not publish an approved question.
  await invoke('setPublication', {
    session: videoTeacher,
    questionId: id,
    mode: 'publish',
    rightsConfirmed: true
  }, 403);

  await invoke('setPublication', {
    session: admin,
    questionId: id,
    mode: 'publish',
    rightsConfirmed: true,
    profileRightsConfirmed: profileConsent
  });

  const url = 'https://fake/public/catalog?country=rw&domain=' + domain;
  const response = await worker.fetch(new Request(url), env);
  assert.equal(response.status, 200);

  const catalog = await response.json();
  const item = catalog.questions.find(q => q.id === id);

  assert.ok(item);
  assert.equal(item.type, type);
  assert.equal(item.video.youtubeId, 'dQw4w9WgXcQ');
  assert.equal(item.creator.consent, profileConsent);

  if (profileConsent) {
    assert.equal(item.creator.name, 'Test Teacher');
  } else {
    assert.notEqual(item.creator.name, 'Test Teacher');
  }

  const stored = db.prepare(
    'SELECT type,video_json,author_profile_verified ' +
    'FROM questions WHERE id=?'
  ).get(id);

  assert.equal(
    stored.type, type === 'video4' ? 'text4' : 'free'
  );
  assert.equal(JSON.parse(stored.video_json).mode, type);
  assert.equal(
    stored.author_profile_verified,
    profileConsent ? 1 : 0
  );

  await invoke('setPublication', {
    session: admin,
    questionId: id,
    mode: 'unpublish'
  });

  const after = await worker.fetch(new Request(url), env);
  const remaining = (await after.json()).questions;
  assert.equal(remaining.some(q => q.id === id), false);

  console.log('PASS video integration:', type);
}

console.log('PASS video author profile privacy and publication');// The full Creator bank is publishable: the 11th question must not be silently hidden.
for(let i=0;i<12;i++){
 const q=(await invoke('saveQuestion',{session:admin,question:{countryIso:'au',countryName:'Australia',domain:'thinkConnect',type:'text4',prompt:'Publication coverage '+i,answer:'A',choices:['B','C','D']}})).data.question;
 await invoke('reviewQuestion',{session:admin,questionId:q.id,status:'approved'});
 await invoke('setPublication',{session:admin,questionId:q.id,mode:'publish',rightsConfirmed:true});
}
const fullCatalog=await (await worker.fetch(new Request('https://fake/public/catalog?country=au&domain=thinkConnect'),env)).json();
assert.equal(fullCatalog.questions.length,12);
const order=(await invoke('getPublicationOrder',{session:admin,countryIso:'au',domain:'thinkConnect'})).data.questionIds;
assert.equal(order.length,12);
await invoke('setPublicationOrder',{session:admin,countryIso:'au',domain:'thinkConnect',questionIds:[...order].reverse()});
const reordered=await (await worker.fetch(new Request('https://fake/public/catalog?country=au&domain=thinkConnect'),env)).json();
assert.deepEqual(reordered.questions.map(q=>q.id),[...order].reverse());
console.log('PASS integration: publish and reorder more than ten questions without truncation');
