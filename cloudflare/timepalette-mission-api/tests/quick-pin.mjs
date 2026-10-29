import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHmac} from 'node:crypto';
import worker from '../src/index.js';
const db=new DatabaseSync(':memory:');db.exec('PRAGMA foreign_keys=ON');
const migrations=new URL('../../timepalette-r2-worker/migrations/',import.meta.url);
for(const f of ['0001_init_mission_creator.sql','0002_auth.sql'])db.exec(fs.readFileSync(new URL(f,migrations),'utf8'));
const wrapped={prepare(sql){return{args:[],bind(...args){this.args=args;return this;},first(){return db.prepare(sql).get(...this.args)||null;},all(){return {results:db.prepare(sql).all(...this.args)};},run(){return{meta:{changes:db.prepare(sql).run(...this.args).changes}}}}}};
const bridge='z'.repeat(64), digest=(role,pin)=>createHmac('sha256',bridge).update('tp-quick-v1|'+role+'|'+pin).digest('hex');
const env={DB:wrapped,TP_BRIDGE_SECRET:bridge,TP_QUICK_TEACHER_HASH:digest('teacher','1234'),TP_QUICK_ADMIN_HASH:digest('admin','9876')};
db.prepare("INSERT INTO teachers(id,name,role,active,login_id) VALUES (?,'existing-admin','admin',1,'test-admin')")
 .run('11111111-1111-4111-8111-111111111111');
async function logIn(pin){const resp=await worker.fetch(new Request('https://worker/private',{method:'POST',headers:{'X-TP-Bridge':bridge,'Content-Type':'application/json'},body:JSON.stringify({action:'login',pin,withBootstrap:true})}),env);return {status:resp.status,body:await resp.json()};}
const denied=await logIn('0000');assert.equal(denied.status,401);assert.equal(denied.body.ok,false);
const teacher=await logIn('1234');assert.equal(teacher.status,200);assert.equal(teacher.body.data.user.role,'teacher');assert.equal(teacher.body.data.user.name,'共通教師');assert.ok(teacher.body.data.session);
const admin=await logIn('9876');assert.equal(admin.status,200);assert.equal(admin.body.data.user.role,'admin');assert.equal(admin.body.data.user.id,'11111111-1111-4111-8111-111111111111');
assert.equal(db.prepare('SELECT COUNT(*) AS n FROM teachers').get().n,2);
assert.equal((await logIn('1234')).body.data.user.id,teacher.body.data.user.id);
assert.equal((await logIn('12aa')).status,400);
console.log('PASS quick PIN: wrong code rejected, teacher and admin role isolation, shared identity stable, existing admin preserved');
