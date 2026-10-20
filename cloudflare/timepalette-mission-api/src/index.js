import {HEX_64, UUID, TYPES, sha256, randomHex, derivePassword,
  passwordValid, isoValid, domainValid, response, ok, ApiFault, requireThat, hex,
  parseArray, now, safeAccount, checkScope} from './security.js';

const TTL_SECONDS=6*3600, IMAGE_MAX=1228800;

const corsHeaders={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};

function statusCode(err){return err instanceof ApiFault?err.status:500;}
function errResponse(err){return response({ok:false,error:err instanceof ApiFault?err.message:'サーバー処理に失敗しました。'},statusCode(err));}
function parseObject(value){try {const x=JSON.parse(value||'{}');return x&&typeof x==='object'&&!Array.isArray(x)?x:{};} catch {return {};}}
function cleanProfile(input){
 const p=input&&typeof input==='object'?input:{};
 return {name:String(p.name||'').replace(/[<>\r\n]/g,'').trim().slice(0,60),
  school:String(p.school||'').replace(/[<>\r\n]/g,'').trim().slice(0,100),
  region:String(p.region||'').replace(/[<>\r\n]/g,'').trim().slice(0,80),
  bio:String(p.bio||'').replace(/[<>]/g,'').trim().slice(0,450),consent:p.consent===true};
}
function parseYoutubeId(value){
 const text=String(value||'').trim();if(/^[A-Za-z0-9_-]{11}$/.test(text))return text;
 try {const url=new URL(text);if(url.protocol!=='https:')return '';const host=url.hostname.toLowerCase();
  if(host==='youtu.be'){const id=url.pathname.slice(1);return /^[A-Za-z0-9_-]{11}$/.test(id)?id:'';}
  if(!['youtube.com','www.youtube.com','m.youtube.com','youtube-nocookie.com','www.youtube-nocookie.com'].includes(host))return '';
  const parts=url.pathname.split('/').filter(Boolean);const id=parts[0]==='watch'?url.searchParams.get('v'):['shorts','embed','live'].includes(parts[0])?parts[1]:'';
  return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:'';
 }catch{return '';}
}
function cleanVideo(input){
 const p=input&&typeof input==='object'?input:{};const youtubeId=parseYoutubeId(p.youtubeUrl||p.youtubeId);
 const start=Number(p.startSeconds||0),end=Number(p.endSeconds||0);
 const startSeconds=Number.isInteger(start)&&start>=0&&start<=21600?start:0;
 const endSeconds=Number.isInteger(end)&&end>startSeconds&&end<=21600?end:0;
 const minChars=Number.isInteger(Number(p.minChars))?Math.max(1,Math.min(1000,Number(p.minChars))):80;
 const maxChars=Number.isInteger(Number(p.maxChars))?Math.max(minChars,Math.min(3000,Number(p.maxChars))):600;
 return {youtubeId,startSeconds,endSeconds,minChars,maxChars,keywordMode:p.keywordMode==='any'?'any':'all',
 keywords:(Array.isArray(p.keywords)?p.keywords:String(p.keywords||'').split(/[、,\n]/)).slice(0,8).map(s=>String(s).trim().slice(0,30)).filter(Boolean)};
}
function storedQuestionType(type){
 return type==='video4'?'text4':type==='videoReflect'?'free':type;
}
function logicalQuestionType(q){
 const video=parseObject(q.video_json);
 if(q.type==='text4'&&video.mode==='video4')return 'video4';
 if(q.type==='free'&&video.mode==='videoReflect')return 'videoReflect';
 return q.type;
}
function rowToQuestion(q,media=[]){return {
 id:q.id,countryIso:q.country_iso,countryName:q.country_name,domain:q.domain,type:logicalQuestionType(q),
 prompt:q.prompt,answer:q.answer,choices:parseArray(q.choices_json),sources:parseArray(q.sources_json),
 notes:q.notes,authorId:q.author_id,authorName:q.author_name,authorProfile:parseObject(q.author_profile_json),video:parseObject(q.video_json),authorProfileVerified:q.author_profile_verified===1,status:q.status,reviewNote:q.review_note,
 createdAt:q.created_at,updatedAt:q.updated_at,
 media:media.map(m=>({id:m.id,slot:m.slot,fileName:m.file_name,createdAt:m.created_at}))};}
function visible(q,user){return user.role==='admin'||(q.status!=='deleted'&&(q.author_id===user.id||q.status!=='draft'));}
function ownerOrAdmin(q,user){requireThat(user.role==='admin'||q.author_id===user.id,'編集する権限がありません。',403);}
function adminOnly(user){requireThat(user.role==='admin','管理者権限が必要です。',403);}
function mediaSlots(type){return type==='photo4'?[1,2,3,4]:['photoText4','photo1'].includes(type)?[1]:[];}
async function getQuestion(env,id){requireThat(UUID.test(String(id||'')),'問題IDを確認してください。');const q=await env.DB.prepare('SELECT * FROM questions WHERE id=?').bind(id).first();requireThat(q,'問題が見つかりません。',404);return q;}
async function getMediaRows(env,id){return (await env.DB.prepare('SELECT * FROM media WHERE question_id=? ORDER BY slot').bind(id).all()).results;}
async function assertComplete(env,q){
 requireThat(q.prompt.trim()&&isoValid(q.country_iso)&&domainValid(q.domain)&&TYPES.includes(q.type),'国・カテゴリー・問題文を入力してください。');
 if(['text4','photoText4','video4'].includes(q.type)){
  const wrong=parseArray(q.choices_json).map(s=>String(s).trim());
  requireThat(q.answer.trim()&&wrong.length===3&&wrong.every(Boolean)&&new Set([q.answer.trim(),...wrong]).size===4,'4択の正答・誤答3つを確認してください。');
 }
 if(q.type==='photo4')requireThat(/写真スロット\s*([1-4])/i.test(q.answer),'写真4択の正解スロットを確認してください。');
 if(['video4','videoReflect'].includes(q.type)){
  const video=parseObject(q.video_json);
  requireThat(/^[A-Za-z0-9_-]{11}$/.test(video.youtubeId||''),'有効なYouTube URLを入力してください。');
  requireThat(video.endSeconds===0||video.endSeconds>video.startSeconds,'動画の開始・終了時間を確認してください。');
  requireThat(video.endSeconds===0||video.endSeconds-video.startSeconds<=1800,'動画の指定範囲は30分以内にしてください。');
  if(q.type==='videoReflect')requireThat(video.minChars>=1&&video.maxChars>=video.minChars&&video.maxChars<=3000,'記述の文字数条件を確認してください。');
 }
 const want=mediaSlots(q.type);if(want.length){const rows=await getMediaRows(env,q.id);
  requireThat(rows.length===want.length&&want.every(slot=>rows.some(m=>m.slot===slot&&m.r2_status==='ready'&&m.r2_object_key)),
    '必要な画像のR2登録が揃っていません。');
 }
}
async function getSession(env,token){
 requireThat(typeof token==='string'&&HEX_64.test(token),'ログインし直してください。',401);
 const digest=await sha256(token);
 const user=await env.DB.prepare(`SELECT t.id,t.login_id,t.name,t.role,t.active FROM sessions s JOIN teachers t ON t.id=s.teacher_id
  WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>?`).bind(digest,now()).first();
 requireThat(user&&user.active===1,'セッションの有効期限が切れました。再ログインしてください。',401);
 return {id:user.id,loginId:user.login_id,name:user.name,role:user.role};
}
async function startSession(env,teacher,withBootstrap){
 const token=randomHex(),created=now(),expires=new Date(Date.now()+TTL_SECONDS*1000).toISOString();
 await env.DB.prepare('INSERT INTO sessions(token_hash,teacher_id,created_at,expires_at) VALUES(?,?,?,?)')
 .bind(await sha256(token),teacher.id,created,expires).run();
 const user={id:teacher.id,loginId:teacher.login_id,name:teacher.name,role:teacher.role};
 const result={session:token,expiresInSeconds:TTL_SECONDS,user};
 if(withBootstrap)result.bootstrap=await bootstrap(env,user);
 return result;
}
async function throttle(env,name){
 // Per-account 15-minute limiter. Never store client IP, PINs or plaintext passwords.
 const key=await sha256('login:'+name.toLocaleLowerCase());
 const row=await env.DB.prepare('SELECT count,expires_at FROM login_failures WHERE account_key=?').bind(key).first();
 requireThat(!row||row.expires_at<=now()||row.count<8,'ログイン試行回数の上限です。15分後に再試行してください。',429);
 return key;
}
async function noteFailure(env,key){
 const expires=new Date(Date.now()+15*60*1000).toISOString();
 await env.DB.prepare(`INSERT INTO login_failures(account_key,count,expires_at) VALUES(?,1,?) ON CONFLICT(account_key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END, expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END`)
 .bind(key,expires,now(),now()).run();
}
// Quick entry uses HMAC of the short code with the private Worker bridge secret.
// No PIN or keyed digest is ever stored in public source, GitHub, or the browser.
const TP_SHARED_TEACHER_ID = '83c94f36-e591-49ce-9ea9-7205a167ec14';
const pinEq=(a,b)=>{if(typeof a!=='string'||typeof b!=='string'||a.length!==64||b.length!==64)return false;let x=0;for(let i=0;i<64;i++)x|=a.charCodeAt(i)^b.charCodeAt(i);return x===0;};
async function quickPinDigest(env,role,pin){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.TP_BRIDGE_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
 const sig=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('tp-quick-v1|'+role+'|'+pin));
 return hex(new Uint8Array(sig));
}
async function quickLogin(env,args){
 const pin=String(args.pin||'');
 requireThat(/^\d{4}$/.test(pin),'4桁の数字を入力してください。');
 requireThat(/^[0-9a-f]{64}$/i.test(String(env.TP_QUICK_TEACHER_HASH||''))&&
  /^[0-9a-f]{64}$/i.test(String(env.TP_QUICK_ADMIN_HASH||''))&&
  typeof env.TP_BRIDGE_SECRET==='string'&&env.TP_BRIDGE_SECRET.length>=48,
  '簡単ログインを準備しています。管理者にご連絡ください。',503);
 // Global cooldown limits online guesses of 4-digit codes; a coordinated attacker
 // could still cause temporary denial of login. Restrict access further at Vercel/WAF.
 const key=await throttle(env,'quick-pin-gateway-v1');
 const [teacherDigest,adminDigest]=await Promise.all([
  quickPinDigest(env,'teacher',pin),quickPinDigest(env,'admin',pin)]);
 const teacher=pinEq(teacherDigest,env.TP_QUICK_TEACHER_HASH);
 const admin=pinEq(adminDigest,env.TP_QUICK_ADMIN_HASH);
 if(!teacher&&!admin){await noteFailure(env,key);throw new ApiFault('ログインコードが正しくありません。',401);}
 await env.DB.prepare('DELETE FROM login_failures WHERE account_key=?').bind(key).run();
 let member;
 if(admin){
  const members=(await env.DB.prepare("SELECT * FROM teachers WHERE role='admin' AND active=1 LIMIT 2").all()).results;
  requireThat(members.length===1,'管理者アカウントを確認できません。',503);
  member=members[0];
 }else{
  await env.DB.prepare("INSERT OR IGNORE INTO teachers(id,name,role,active,auth_version,login_id,created_at,updated_at) VALUES(?,'共通教師','teacher',1,0,'shared-teacher',?,?)")
   .bind(TP_SHARED_TEACHER_ID,now(),now()).run();
  member=await env.DB.prepare("SELECT * FROM teachers WHERE id=? AND role='teacher' AND active=1")
   .bind(TP_SHARED_TEACHER_ID).first();
  requireThat(member,'共通教師アカウントを確認できません。',503);
 }
 return startSession(env,member,args.withBootstrap===true);
}
async function login(env,args){
 if(typeof args.pin!=='undefined')return quickLogin(env,args);
 const account=safeAccount(args.account),password=args.password;
 requireThat(account&&typeof password==='string'&&password.length<=128,'アカウント名とパスワードを入力してください。');
 const key=await throttle(env,account);
 let t=await env.DB.prepare('SELECT * FROM teachers WHERE login_id=? OR id=?').bind(account,account).first();
 if(!t){const match=(await env.DB.prepare('SELECT * FROM teachers WHERE name=? LIMIT 2').bind(account).all()).results;if(match.length===1)t=match[0];}
 let authorized=false;
 if(t&&t.active===1&&t.password_salt&&t.password_hash&&passwordValid(password)){
  const calculated=await derivePassword(password,t.password_salt,Number(t.password_iterations||100000));
  authorized=calculated===t.password_hash;
 }
 if(!authorized){await noteFailure(env,key);throw new ApiFault('アカウント名またはパスワードが正しくありません。',401);}
 await env.DB.prepare('DELETE FROM login_failures WHERE account_key=?').bind(key).run();
 return startSession(env,t,args.withBootstrap===true);
}
async function register(env,args){
 const token=String(args.registrationToken||''),pw=args.password;
 requireThat(HEX_64.test(token)&&passwordValid(pw),'招待リンクと12文字以上のパスワードを確認してください。');
 const hash=await sha256(token),stamp=now();
 const enrollment=await env.DB.prepare(`SELECT e.teacher_id,t.id,t.login_id,t.name,t.role,t.active FROM enrollments e JOIN teachers t ON t.id=e.teacher_id
   WHERE e.token_hash=? AND e.used_at IS NULL AND e.expires_at>?`).bind(hash,stamp).first();
 requireThat(enrollment&&enrollment.active===1,'招待リンクが無効または期限切れです。',403);
 const salt=randomHex(16),digest=await derivePassword(pw,salt);
 const claimed=await env.DB.prepare('UPDATE enrollments SET used_at=? WHERE token_hash=? AND used_at IS NULL AND expires_at>?')
  .bind(stamp,hash,stamp).run();
 requireThat(claimed.meta.changes===1,'招待登録が競合しました。管理者にお問い合わせください。',409);
 const updated=await env.DB.prepare('UPDATE teachers SET password_salt=?,password_hash=?,password_iterations=100000,auth_version=auth_version+1,updated_at=? WHERE id=? AND active=1')
  .bind(salt,digest,stamp,enrollment.teacher_id).run();
 requireThat(updated.meta.changes===1,'教師アカウントを登録できませんでした。管理者にご連絡ください。',409);
 await env.DB.prepare('DELETE FROM sessions WHERE teacher_id=?').bind(enrollment.teacher_id).run();
 return startSession(env,enrollment,args.withBootstrap===true);
}
async function listTeachers(env,user){adminOnly(user);const rows=(await env.DB.prepare('SELECT id,login_id,name,role,active,password_hash FROM teachers ORDER BY role,name').all()).results;
 return {teachers:rows.map(t=>({id:t.id,loginId:t.login_id,name:t.name,role:t.role,active:t.active===1,configured:!!t.password_hash}))};}
async function issueInvite(env,user,args){adminOnly(user);const t=await env.DB.prepare('SELECT id,active FROM teachers WHERE id=?').bind(String(args.teacherId||'')).first();
 requireThat(t&&t.active===1,'先生が見つからないか無効です。',404);
 const token=randomHex(),stamp=now(),expires=new Date(Date.now()+7*86400*1000).toISOString();
 await env.DB.prepare('INSERT INTO enrollments(token_hash,teacher_id,created_by,created_at,expires_at) VALUES(?,?,?,?,?)')
 .bind(await sha256(token),t.id,user.id,stamp,expires).run();return {enrollmentToken:token,expiresAt:expires};}
async function createTeacher(env,user,args){
 adminOnly(user);
 const name=String(args.name||'').replace(/[<>\r\n]/g,'').trim();
 requireThat(name.length>=2&&name.length<=60,'先生のお名前は2〜60文字で入力してください。');
 const id=crypto.randomUUID(),loginId=id.replaceAll('-','').slice(0,12),stamp=now();
 await env.DB.prepare("INSERT INTO teachers(id,login_id,name,role,active,auth_version,created_at,updated_at) VALUES(?,?,?,'teacher',1,0,?,?)")
  .bind(id,loginId,name,stamp,stamp).run();
 const invite=await issueInvite(env,user,{teacherId:id});
 return {teacher:{id,loginId,name,role:'teacher',active:true,configured:false},...invite};
}
async function bootstrap(env,user){
 const qs=(await env.DB.prepare('SELECT * FROM questions ORDER BY updated_at DESC').all()).results;
 requireThat(qs.length<=2000,'問題一覧が多すぎます。ページ分割が必要です。',503);
 const media=(await env.DB.prepare('SELECT id,question_id,slot,file_name,created_at FROM media ORDER BY slot').all()).results;
 const lookup=new Map();for(const m of media){if(!lookup.has(m.question_id))lookup.set(m.question_id,[]);lookup.get(m.question_id).push(m);}
 const progress=(await env.DB.prepare('SELECT key,manual_done FROM progress').all()).results;
 return {user,questions:qs.filter(q=>visible(q,user)).map(q=>{
 const item=rowToQuestion(q,lookup.get(q.id)||[]);if(user.role!=='admin'&&item.authorId!==user.id)item.reviewNote='';return item;}),
 progress:Object.fromEntries(progress.map(p=>[p.key,p.manual_done]))};
}
async function saveQuestion(env,user,args){
 const p=args.question||{},id=String(p.id||''),finalize=String(args.finalize||'');
 requireThat(['','submitted','approved'].includes(finalize),'保存状態が不正です。');
 if(finalize==='approved')adminOnly(user);
 const iso=String(p.countryIso||'').toLowerCase().trim();checkScope(iso,p.domain);
 requireThat(TYPES.includes(p.type),'問題形式が不正です。');
 const prompt=String(p.prompt||'').trim(),answer=String(p.answer||'').trim(),notes=String(p.notes||'');
 requireThat(prompt.length<=2000&&answer.length<=1500&&notes.length<=5000,'文章が長すぎます。');
 const choices=(Array.isArray(p.choices)?p.choices:[]).slice(0,3).map(x=>String(x??'').slice(0,600));
 const sources=(Array.isArray(p.sources)?p.sources:[]).slice(0,2).map(x=>String(x||'').trim().slice(0,1500)).filter(x=>/^https?:\/\//i.test(x));
  const profile=cleanProfile(p.authorProfile);
  const video=cleanVideo(p.video);video.mode=['video4','videoReflect'].includes(p.type)?p.type:'';
 let prev=null;if(id)prev=await getQuestion(env,id);
 if(prev){ownerOrAdmin(prev,user);requireThat(!['published','deleted'].includes(prev.status),'公開中・削除済みの問題は編集できません。');
  if(user.role!=='admin')requireThat(!['approved'].includes(prev.status),'承認済みの修正は管理者へ相談してください。');}
 const stamp=now(),qid=prev?.id||crypto.randomUUID();
 const next={id:qid,country_iso:iso,country_name:String(p.countryName||'').slice(0,90),domain:p.domain,type:p.type,prompt,answer,
 choices_json:JSON.stringify(choices),sources_json:JSON.stringify(sources),notes,
 author_id:prev?.author_id||user.id,author_name:(profile.name && (!prev||user.role==='admin'||prev.author_id===user.id))?profile.name:(prev?.author_name||user.name),
  author_profile_json:JSON.stringify(profile),video_json:JSON.stringify(video),author_profile_verified:0,
 status:finalize||(prev&&user.role==='admin'?prev.status:'draft'),review_note:prev?.review_note||'',created_at:prev?.created_at||stamp,updated_at:stamp};
 if(finalize)await assertComplete(env,next);
 if(prev){const r=await env.DB.prepare(`UPDATE questions SET country_iso=?,country_name=?,domain=?,type=?,prompt=?,answer=?,choices_json=?,sources_json=?,notes=?,author_name=?,author_profile_json=?,video_json=?,author_profile_verified=0,status=?,review_note=?,updated_at=?,version=version+1 WHERE id=? AND version=? AND status NOT IN('published','deleted')`)
  .bind(next.country_iso,next.country_name,next.domain,storedQuestionType(next.type),next.prompt,next.answer,next.choices_json,next.sources_json,next.notes,next.author_name,next.author_profile_json,next.video_json,next.status,next.review_note,next.updated_at,qid,prev.version).run();
  requireThat(r.meta.changes===1,'他の先生が更新しました。再読み込みしてください。',409);
 }else{await env.DB.prepare(`INSERT INTO questions(id,country_iso,country_name,domain,type,prompt,answer,choices_json,sources_json,notes,author_id,author_name,author_profile_json,video_json,author_profile_verified,status,review_note,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
  .bind(qid,next.country_iso,next.country_name,next.domain,storedQuestionType(next.type),next.prompt,next.answer,next.choices_json,next.sources_json,next.notes,next.author_id,next.author_name,next.author_profile_json,next.video_json,0,next.status,next.review_note,next.created_at,next.updated_at).run();}
 return {question:rowToQuestion(next,prev?await getMediaRows(env,qid):[])};
}
function b64ToBytes(s){const binary=atob(s);const result=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)result[i]=binary.charCodeAt(i);return result;}
function bytesToB64(buf){const bytes=new Uint8Array(buf);let out='';for(let i=0;i<bytes.length;i+=16384)out+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(out);}
function imageValid(buf){const b=new Uint8Array(buf);return b.length>=16&&b.length<=IMAGE_MAX&&String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP';}
async function uploadImage(env,user,args){
 const q=await getQuestion(env,args.questionId),slot=Number(args.slot);ownerOrAdmin(q,user);
 requireThat(!['published','deleted'].includes(q.status),'公開中・削除済みの画像は変更できません。');
 if(user.role!=='admin')requireThat(q.status!=='approved','承認済みの画像は変更できません。');
 requireThat(Number.isInteger(slot)&&mediaSlots(q.type).includes(slot),'画像のスロットが不正です。');
 const b64=String(args.base64||'');requireThat(b64.length<1_700_000&&/^[A-Za-z0-9+/]+={0,2}$/.test(b64),'WebP画像データが不正です。');
 const bytes=b64ToBytes(b64);requireThat(imageValid(bytes),'画像は1.2MB以下のWebP形式で登録してください。');
 const sha=await sha256(bytes),key=`media-v2/${q.id}/P0${slot}-${sha.slice(0,20)}.webp`;
 await env.MEDIA.put(key,bytes,{httpMetadata:{contentType:'image/webp'},customMetadata:{sha256:sha}});
 const current=await getQuestion(env,q.id);
 if(['published','deleted'].includes(current.status)){throw new ApiFault('公開状態が変わりました。更新してください。',409);}
 const existing=await env.DB.prepare('SELECT id,r2_object_key FROM media WHERE question_id=? AND slot=?').bind(q.id,slot).first();
 const name=`${q.id}_P0${slot}.webp`,stamp=now();
 await env.DB.prepare(`INSERT INTO media(id,question_id,slot,legacy_drive_file_id,file_name,size_bytes,r2_object_key,r2_sha256,r2_status,created_at,updated_at)
  VALUES(?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(question_id,slot) DO UPDATE SET file_name=excluded.file_name,size_bytes=excluded.size_bytes,r2_object_key=excluded.r2_object_key,r2_sha256=excluded.r2_sha256,r2_status='ready',created_at=excluded.created_at,updated_at=excluded.updated_at`)
 .bind(existing?.id||crypto.randomUUID(),q.id,slot,null,name,bytes.length,key,sha,'ready',stamp,stamp).run();
 // Never delete the originally imported media-v1 backup during pilot rollout.
 if(existing?.r2_object_key?.startsWith('media-v2/') && existing.r2_object_key!==key){
  try{await env.MEDIA.delete(existing.r2_object_key);}catch{/* orphan cleanup is best-effort */}
 }
 return {id:existing?.id||'',slot,fileName:name,size:bytes.length};
}
async function editStatus(env,user,args,mode){
 const q=await getQuestion(env,args.questionId),stamp=now();
 if(mode==='submit'){
  ownerOrAdmin(q,user);requireThat(!['approved','published','deleted'].includes(q.status),'再提出できない状態です。');await assertComplete(env,{...q,type:logicalQuestionType(q)});
  await env.DB.prepare("UPDATE questions SET status='submitted',updated_at=?,version=version+1 WHERE id=? AND status IN('draft','submitted','needs_revision')").bind(stamp,q.id).run();
  return {questionId:q.id,status:'submitted'};
 }
 adminOnly(user);
 if(mode==='review'){
  requireThat(['approved','needs_revision'].includes(args.status)&&!['published','deleted'].includes(q.status),'承認状態を確認してください。');
  if(args.status==='approved')await assertComplete(env,{...q,type:logicalQuestionType(q)});
  const note=args.status==='approved'?'':String(args.reviewNote||'').slice(0,1000);
  const r=await env.DB.prepare("UPDATE questions SET status=?,review_note=?,updated_at=?,version=version+1 WHERE id=? AND status NOT IN('published','deleted')")
    .bind(args.status,note,stamp,q.id).run();requireThat(r.meta.changes===1,'公開状態が変わりました。',409);
  return {questionId:q.id,status:args.status,updatedAt:stamp,reviewNote:note};
 }
 const restoring=mode==='restore';requireThat(restoring?q.status==='deleted':['draft','submitted','needs_revision','approved'].includes(q.status),'削除・復元できない状態です。');
 const target=restoring?'submitted':'deleted';
 const r=await env.DB.prepare('UPDATE questions SET status=?,updated_at=?,version=version+1 WHERE id=? AND status=?')
 .bind(target,stamp,q.id,q.status).run();requireThat(r.meta.changes===1,'状態が変更されました。',409);
 return {questionId:q.id,status:target};
}
async function setProgress(env,user,args){adminOnly(user);const iso=String(args.countryIso||'').toLowerCase(),domain=String(args.domain||''),count=Number(args.manualDone);
 checkScope(iso,domain);requireThat(['place','time'].includes(domain)&&Number.isInteger(count)&&count>=0&&count<=10,'進捗は0〜10の整数です。');
 const stamp=now(),key=`${iso}:${domain}`;
 await env.DB.prepare('INSERT INTO progress(key,country_iso,domain,manual_done,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET manual_done=excluded.manual_done,updated_at=excluded.updated_at')
 .bind(key,iso,domain,count,stamp).run();return {key,countryIso:iso,domain,manualDone:count,updatedAt:stamp};
}
async function scopedPublished(env,iso,domain){const r=(await env.DB.prepare("SELECT id FROM questions WHERE country_iso=? AND domain=? AND status='published' ORDER BY created_at,id").bind(iso,domain).all()).results.map(x=>x.id);
 const saved=await env.DB.prepare('SELECT question_ids_json FROM publication_order WHERE key=?').bind(`${iso}:${domain}`).first();
 const priority=parseArray(saved?.question_ids_json).filter(x=>r.includes(x));return [...new Set([...priority,...r])].slice(0,10);}
async function saveOrder(env,iso,domain,ids){await env.DB.prepare('INSERT INTO publication_order(key,question_ids_json,updated_at) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET question_ids_json=excluded.question_ids_json,updated_at=excluded.updated_at')
 .bind(`${iso}:${domain}`,JSON.stringify(ids),now()).run();}
async function orderAction(env,user,args,set){adminOnly(user);const iso=String(args.countryIso||'').toLowerCase(),domain=String(args.domain||'');checkScope(iso,domain);const ids=await scopedPublished(env,iso,domain);
 if(set){const desired=args.questionIds;requireThat(Array.isArray(desired)&&desired.length===ids.length&&desired.length<=10&&new Set(desired).size===desired.length&&desired.every(x=>ids.includes(x)),'公開順序が変更されています。再読み込みしてください。',409);await saveOrder(env,iso,domain,desired);return {countryIso:iso,domain,questionIds:desired};}
 return {countryIso:iso,domain,questionIds:ids};}
async function publish(env,user,args){adminOnly(user);const mode=String(args.mode||'');requireThat(['publish','unpublish'].includes(mode),'公開操作を確認してください。');
 const q=await getQuestion(env,args.questionId),stamp=now(),was=q.status;
 if(mode==='publish'){
 requireThat(was==='approved'&&args.rightsConfirmed===true,'承認済みの問題と公開利用権を確認してください。');
 requireThat(['text4','photo4','photoText4','video4','videoReflect'].includes(logicalQuestionType(q)),'この形式は公開できません。');await assertComplete(env,{...q,type:logicalQuestionType(q)});
 const profile=cleanProfile(parseObject(q.author_profile_json));const profileVerified=profile.consent&&args.profileRightsConfirmed===true?1:0;
 const r=await env.DB.prepare(`UPDATE questions SET status='published',author_profile_verified=?,updated_at=?,version=version+1 WHERE id=? AND status='approved'
 AND (SELECT COUNT(*) FROM questions WHERE country_iso=? AND domain=? AND status='published')<10`)
 .bind(profileVerified,stamp,q.id,q.country_iso,q.domain).run();requireThat(r.meta.changes===1,'公開条件が変更されました。10問上限を確認してください。',409);
 }else{
 requireThat(was==='published','公開中の問題のみ停止できます。');
 // Legacy R2 v2 route is authorized by this manifest. Revoke BEFORE marking D1 unpublished.
 await env.MEDIA.delete(`live-v1/${q.id}/manifest.json`);
 const r=await env.DB.prepare("UPDATE questions SET status='approved',updated_at=?,version=version+1 WHERE id=? AND status='published'").bind(stamp,q.id).run();
 requireThat(r.meta.changes===1,'公開状態が変更されました。',409);
 }
 await env.DB.prepare('INSERT INTO publication_log(id,question_id,action,admin_id,rights_basis,created_at) VALUES(?,?,?,?,?,?)')
 .bind(crypto.randomUUID(),q.id,mode,user.id,mode==='publish'?'admin_confirmed':'',stamp).run();
 try{await saveOrder(env,q.country_iso,q.domain,await scopedPublished(env,q.country_iso,q.domain));}catch{/* public reads always reconcile */}
 return {questionId:q.id,status:mode==='publish'?'published':'approved',updatedAt:stamp};
}
async function mediaRead(env,user,args,batch){
 const q=await getQuestion(env,args.questionId);
 requireThat(visible(q,user),'表示する権限がありません。',403);
 const rows=await getMediaRows(env,q.id);
 if(!batch){const slot=Number(args.slot);requireThat([1,2,3,4].includes(slot),'画像番号を確認してください。');
 const m=rows.find(x=>x.slot===slot);requireThat(m&&m.r2_status==='ready'&&m.r2_object_key,'画像が見つかりません。',404);
 const obj=await env.MEDIA.get(m.r2_object_key);requireThat(obj&&obj.size<=IMAGE_MAX,'画像を読み込めません。',502);
 return {base64:bytesToB64(await obj.arrayBuffer()),mime:'image/webp'};}
 const photos=[],errors=[];let total=0;
 for(const m of rows){if(m.r2_status!=='ready'||!m.r2_object_key){errors.push({slot:m.slot,message:'画像を取得できません'});continue;}
  const obj=await env.MEDIA.get(m.r2_object_key);
  if(!obj||obj.size>IMAGE_MAX||total+obj.size>2400000){errors.push({slot:m.slot,message:'個別取得が必要です'});continue;}
  total+=obj.size;photos.push({slot:m.slot,base64:bytesToB64(await obj.arrayBuffer())});}
 return {photos,errors,perf:{elapsedMs:0,cacheHits:0,parallel:true}};
}
async function publicCatalog(env,url){
 const iso=String(url.searchParams.get('country')||url.searchParams.get('countryIso')||'').toLowerCase(),domain=url.searchParams.get('domain')||'';
 checkScope(iso,domain);const ids=await scopedPublished(env,iso,domain);if(!ids.length)return response({ok:true,questions:[]});
 const rows=(await env.DB.prepare("SELECT * FROM questions WHERE country_iso=? AND domain=? AND status='published'").bind(iso,domain).all()).results;
 const qmap=new Map(rows.map(q=>[q.id,q]));const media=(await env.DB.prepare(`SELECT m.question_id,m.slot FROM media m JOIN questions q ON q.id=m.question_id WHERE q.country_iso=? AND q.domain=? AND q.status='published' AND m.r2_status='ready'`).bind(iso,domain).all()).results;
 const byQ=new Map();for(const m of media){if(!byQ.has(m.question_id))byQ.set(m.question_id,[]);byQ.get(m.question_id).push({slot:m.slot});}
 const questions=ids.filter(id=>qmap.has(id)).map(id=>{const q=qmap.get(id);return {id:q.id,countryIso:q.country_iso,domain:q.domain,type:logicalQuestionType(q),prompt:q.prompt.slice(0,2000),answer:q.answer.slice(0,1500),choices:parseArray(q.choices_json),explanation:q.notes.slice(0,3500),sources:parseArray(q.sources_json).filter(s=>/^https?:\/\//i.test(String(s))).slice(0,2),media:byQ.get(q.id)||[],video:parseObject(q.video_json),
 creator:q.author_profile_verified===1&&parseObject(q.author_profile_json).consent===true?cleanProfile(parseObject(q.author_profile_json)):{name:'教材協力者',school:'',region:'',bio:'',consent:false}};});
 return new Response(JSON.stringify({ok:true,questions}),{headers:{...corsHeaders,'Content-Type':'application/json'}});
}
async function publicImage(env,url){
 const id=String(url.searchParams.get('questionId')||''),slot=Number(url.searchParams.get('slot'));
 requireThat(UUID.test(id)&&[1,2,3,4].includes(slot),'画像を確認してください。');
 const m=await env.DB.prepare(`SELECT m.r2_object_key,m.size_bytes FROM media m JOIN questions q ON q.id=m.question_id
  WHERE q.id=? AND q.status='published' AND m.slot=? AND m.r2_status='ready'`).bind(id,slot).first();
 requireThat(m&&m.r2_object_key,'画像は公開されていません。',404);
 const obj=await env.MEDIA.get(m.r2_object_key);requireThat(obj&&obj.size>=16&&obj.size<=IMAGE_MAX,'画像が見つかりません。',404);
 return new Response(obj.body,{headers:{...corsHeaders,'Content-Type':'image/webp'}});
}
async function action(env,body){
 if(body.action==='login')return login(env,body);
 if(body.action==='registerTeacher')return register(env,body);
 const user=await getSession(env,body.session);
 switch(body.action){
 case 'bootstrap':return bootstrap(env,user);
 case 'saveQuestion':return saveQuestion(env,user,body);
 case 'uploadImage':return uploadImage(env,user,body);
 case 'submitQuestion':return editStatus(env,user,body,'submit');
 case 'reviewQuestion':return editStatus(env,user,body,'review');
 case 'deleteQuestion':return editStatus(env,user,body,'delete');
 case 'restoreQuestion':return editStatus(env,user,body,'restore');
 case 'setProgress':return setProgress(env,user,body);
 case 'getPublicationOrder':return orderAction(env,user,body,false);
 case 'setPublicationOrder':return orderAction(env,user,body,true);
 case 'setPublication':return publish(env,user,body);
 case 'getMediaBatch':return mediaRead(env,user,body,true);
 case 'getMedia':return mediaRead(env,user,body,false);
 case 'listTeachers':return listTeachers(env,user);
 case 'issueInvite':return issueInvite(env,user,body);
 case 'createTeacher':return createTeacher(env,user,body);
 case 'logout':await env.DB.prepare('UPDATE sessions SET revoked_at=? WHERE token_hash=?').bind(now(),await sha256(body.session)).run();return {loggedOut:true};
 default:throw new ApiFault('対応していない操作です。',400);
 }
}
export default {async fetch(request,env){
 try{
  const url=new URL(request.url);
  if(request.method==='GET'&&url.pathname==='/health')return response({ok:true,service:'TimePalette Mission API',version:1});
  if(request.method==='GET'&&url.pathname==='/public/catalog')return await publicCatalog(env,url);
  if(request.method==='GET'&&url.pathname==='/public/image')return await publicImage(env,url);
  requireThat(request.method==='POST'&&url.pathname==='/private','Not found',404);
  requireThat(typeof env.TP_BRIDGE_SECRET==='string'&&env.TP_BRIDGE_SECRET.length>=48&&request.headers.get('X-TP-Bridge')===env.TP_BRIDGE_SECRET,'Not found',404);
  requireThat(Number(request.headers.get('Content-Length')||0)<=2_200_000,'大きすぎるリクエストです。',413);
  const txt=await request.text();requireThat(txt.length<=2_200_000,'大きすぎるリクエストです。',413);
  let body;try{body=JSON.parse(txt);}catch{throw new ApiFault('JSONが不正です。');}
  requireThat(body&&typeof body==='object'&&!Array.isArray(body),'不正なリクエストです。');
  return ok(await action(env,body));
 }catch(err){if(!(err instanceof ApiFault))console.error('TimePalette Worker fault',String(err?.name||'unknown'));return errResponse(err);}
}};
