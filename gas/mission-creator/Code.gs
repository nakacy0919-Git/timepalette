/* TimePalette Mission Creator — Google Apps Script (V8 runtime)
 * Deploy as Web App: execute as owner; access: anyone. ALL operations require
 * shared teacher PIN plus device credential, or admin invite + PIN; private storage.
 * Run setupMissionCreator() and createTeacherInvite() ONLY from script editor.
 */
const TP_DOMAINS = ['place', 'time', 'language', 'lifeCulture', 'japanConnection', 'thinkConnect'];
const TP_TYPES = ['text4', 'photo4', 'photo1', 'free', 'web'];
const TP_QHEAD = ['id', 'countryIso', 'countryName', 'domain', 'type', 'prompt', 'answer', 'choicesJson', 'sourcesJson', 'notes', 'authorId', 'authorName', 'status', 'reviewNote', 'createdAt', 'updatedAt'];
const TP_MHEAD = ['id', 'questionId', 'slot', 'fileId', 'fileName', 'size', 'createdAt'];
const TP_THEADE = ['id', 'name', 'role', 'inviteHash', 'pinHash', 'active'];
const TP_PHEAD = ['key', 'countryIso', 'domain', 'manualDone', 'updatedAt'];

function tpRandom_() { return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); }
function tpSha_(input) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(input))
    .map(v => ('0' + (v & 255).toString(16)).slice(-2)).join('');
}
function tpProps_() { return PropertiesService.getScriptProperties(); }
function tpPepper_() { const x=tpProps_().getProperty('TP_PEPPER'); if(!x)throw Error('Not configured');return x; }
let TP_MC_SPREADSHEET_FOR_REQUEST = null;
function tpTable_(name) {
  const id = tpProps_().getProperty('TP_DB_SHEET_ID');
  if (!id) throw Error('Mission Creator is not configured');
  const sh = (TP_MC_SPREADSHEET_FOR_REQUEST || (TP_MC_SPREADSHEET_FOR_REQUEST = SpreadsheetApp.openById(id))).getSheetByName(name);
  if (!sh) throw Error('Missing database tab');
  return sh;
}
function tpRows_(name) {
  const cache=CacheService.getScriptCache();
  const key='tp-rows-speed-v1-'+name;
  const enabled=['Questions','Media','Progress'].includes(name);
  if(enabled){
    const saved=cache.get(key);
    if(saved){
      try{return JSON.parse(saved);}
      catch(e){cache.remove(key);}
    }
  }
  const sh=tpTable_(name),values=sh.getDataRange().getValues();
  const keys=values.shift()||[];
  const rows=values.map((row,i)=>({
    _row:i+2,
    ...Object.fromEntries(keys.map((k,j)=>[k,row[j]]))
  })).filter(record=>String(record[keys[0]]||'').trim());
  if(enabled){
    const packed=JSON.stringify(rows);
    if(packed.length<50000){
      try{cache.put(key,packed,45);}
      catch(e){/* Cache is optional. */}
    }
  }
  return rows;
}
function tpInvalidateRows_(name){
  const cache=CacheService.getScriptCache();
  if(name==='Teachers')cache.remove('tp-teacher-list-fast-v1');
  if(['Questions','Media','Progress'].includes(name))
    cache.remove('tp-rows-speed-v1-'+name);
}
function tpTeacherRows_() {
  // Access controls are rechecked against this short-lived cache on every action.
  const cache = CacheService.getScriptCache(), key = 'tp-teacher-list-fast-v1';
  const cached = cache.get(key);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) { cache.remove(key); }
  }
  const rows = tpRows_('Teachers');
  const encoded = JSON.stringify(rows);
  if (encoded.length < 90000) cache.put(key, encoded, 45);
  return rows;
}
function tpCell_(v) {
  const value = v == null ? '' : String(v);
  return /^[=+\-@]/.test(value) ? "'" + value : value; // sheet formula injection defense
}
function tpAppend_(name, head, data) { tpTable_(name).appendRow(head.map(k=>tpCell_(data[k]))); tpInvalidateRows_(name); }
function tpReplace_(name, head, row, data) { tpTable_(name).getRange(row, 1, 1, head.length).setValues([head.map(k=>tpCell_(data[k]))]); tpInvalidateRows_(name); }
function tpWithLock_(fn) {
  const lock = LockService.getScriptLock(); lock.waitLock(12000);
  try { return fn(); } finally { lock.releaseLock(); }
}
function tpMediaFolder_() { const id=tpProps_().getProperty('TP_PRIVATE_MEDIA_FOLDER_ID');if(!id)throw Error('No media folder');return DriveApp.getFolderById(id); }
function tpNow_() { return new Date().toISOString(); }
function tpBool_(v) { return String(v).toLowerCase()==='true'; }

/* Run once. Creates NEW PRIVATE resources owned by the script owner.
 * Existing teacher-shared spreadsheet/folders MUST NOT be used for roles,
 * approvals, or image privacy. Their content is not deleted or moved.
 */
function setupMissionCreator() {
  const p=tpProps_();
  if(p.getProperty('TP_DB_SHEET_ID')) throw Error('Already configured. Do not run again.');
  const doc=SpreadsheetApp.create('TimePalette Mission Creator — PRIVATE database');
  const first=doc.getSheets()[0]; first.setName('Questions');
  first.getRange(1,1,1,TP_QHEAD.length).setValues([TP_QHEAD]);
  [['Media',TP_MHEAD],['Teachers',TP_THEADE],['Progress',TP_PHEAD]].forEach(([name,head])=>{
    const s=doc.insertSheet(name);s.getRange(1,1,1,head.length).setValues([head]);
  });
  const folder=DriveApp.createFolder('TimePalette Mission Creator — PRIVATE WebP');
  p.setProperties({TP_DB_SHEET_ID:doc.getId(),TP_PRIVATE_MEDIA_FOLDER_ID:folder.getId(),TP_PEPPER:tpRandom_()},false);
  Logger.log('PRIVATE Sheet ID: '+doc.getId());
  Logger.log('PRIVATE Drive folder ID: '+folder.getId());
  return {spreadsheetId:doc.getId(),folderId:folder.getId()};
}

/* Editor-only administration. Admin receives an invite like any teacher.
 * 4-digit PIN must be delivered SEPARATELY from the invitation link.
 * Never paste a PIN or invite into GitHub or Vercel environment variables.
 */
function createTeacherInvite(name, pin, role) {
  if (!String(name||'').trim() || !/^\d{4}$/.test(String(pin)) || !['teacher','admin'].includes(role)) throw Error('Provide name, 4-digit PIN and role teacher/admin');
  const invite=tpRandom_(), pepper=tpPepper_();
  tpWithLock_(()=>tpAppend_('Teachers', TP_THEADE, {
    id:Utilities.getUuid(),name:String(name).trim(),role,
    inviteHash:tpSha_(pepper+':invite:'+invite),pinHash:tpSha_(pepper+':pin:'+invite+':'+pin),active:'true',
  }));
  Logger.log('Share invitation code privately. Show PIN separately: '+invite);
  return invite;
}

/* Shared teacher passcode is configured in Script Properties, NOT in GitHub.
 * 4-digit PIN is a convenience gate for a trusted pilot, NOT a strong identity factor.
 */
function configureAdminPinFromSettings(){
  const p=tpProps_();
  const pin=String(p.getProperty('TP_ADMIN_PIN_TO_SET')||'');
  if(!/^\d{4}$/.test(pin))
    throw Error('TP_ADMIN_PIN_TO_SET must be a 4-digit PIN');
  const admins=tpTeacherRows_().filter(
    x=>x.role==='admin'&&tpBool_(x.active)
  );
  if(admins.length!==1)
    throw Error('Exactly one active admin account is required');
  p.setProperty(
    'TP_SIMPLE_ADMIN_PIN_HASH',
    tpSha_(tpPepper_()+':simple-admin:'+pin)
  );
  p.deleteProperty('TP_ADMIN_PIN_TO_SET');
  return 'Admin PIN configured successfully';
}
function tpSimpleAdminLogin_(args){
  const pin=String(args.pin||'');
  const cache=CacheService.getScriptCache();
  const expected=tpProps_().getProperty('TP_SIMPLE_ADMIN_PIN_HASH');
  if(!expected)throw Error('管理者PINが未設定です。');
  const attempts=Number(cache.get('tp-admin-pin-errors')||0);
  if(attempts>=5)
    throw Error('試行回数の上限です。15分後に再試行してください。');
  if(!/^\d{4}$/.test(pin)||
    tpSha_(tpPepper_()+':simple-admin:'+pin)!==expected){
    cache.put('tp-admin-pin-errors',String(attempts+1),900);
    throw Error('管理者PINが正しくありません。');
  }
  const admins=tpTeacherRows_().filter(
    x=>x.role==='admin'&&tpBool_(x.active)
  );
  if(admins.length!==1)
    throw Error('管理者アカウントを確認してください。');
  cache.remove('tp-admin-pin-errors');
  return tpNewSession_(admins[0]);
}
function configureSharedTeacherPin(pin) {
  if(!/^\d{4}$/.test(String(pin)))throw Error('4桁の数字を指定してください。');
  tpProps_().setProperty('TP_SHARED_TEACHER_PIN_HASH',tpSha_(tpPepper_()+':shared-teacher:'+pin));
  return '先生用の共通パスコードを設定しました。';
}
/* Set temporary TP_TEACHER_PIN_TO_SET in Apps Script Project Settings,
 * then run this function. It removes the temporary plaintext property.
 */
function configureTeacherPinFromSettings() {
  const p=tpProps_(),pin=p.getProperty('TP_TEACHER_PIN_TO_SET');
  if(!/^\d{4}$/.test(String(pin||'')))throw Error('Script Propertiesに TP_TEACHER_PIN_TO_SET を4桁で設定してください。');
  configureSharedTeacherPin(pin);
  p.deleteProperty('TP_TEACHER_PIN_TO_SET');
  return '先生の共通パスコード設定が完了しました。';
}
function tpNewSession_(member) {
  const session=tpRandom_();
  CacheService.getScriptCache().put('session_'+tpSha_(session),JSON.stringify({id:member.id,name:member.name,role:member.role}),21600);
  return {session,expiresInSeconds:21600,user:{id:member.id,name:member.name,role:member.role}};
}
function tpSharedLogin_(args) {
  const pin=String(args.pin||'');
  if(!/^\d{4}$/.test(pin))throw Error('4桁のパスコードを入力してください。');
  const cache=CacheService.getScriptCache();
  const failed=Number(cache.get('tp-shared-pin-fails')||0);
  if(failed>=20)throw Error('ログインの試行が多すぎます。15分後に再試行してください。');
  const expected=tpProps_().getProperty('TP_SHARED_TEACHER_PIN_HASH');
  if(!expected)throw Error('先生用パスコードがまだ設定されていません。管理者に連絡してください。');
  const correct=tpSha_(tpPepper_()+':shared-teacher:'+pin)===expected;
  if(!correct){cache.put('tp-shared-pin-fails',String(failed+1),900);throw Error('パスコードが正しくありません。');}
  cache.remove('tp-shared-pin-fails');
  const token=String(args.teacherToken||'');
  if(/^[a-f0-9]{64}$/.test(token)){
    const hash=tpSha_(tpPepper_()+':teacher-device:'+token);
    const member=tpTeacherRows_().find(x=>x.role==='teacher'&&x.inviteHash===hash&&tpBool_(x.active));
    if(member)return tpNewSession_(member);
  }
  // A short-lived enrollment token gives no access to questions or assets.
  const registrationToken=tpRandom_();
  cache.put('register_'+tpSha_(registrationToken),'authorized',600);
  return {needsName:true,registrationToken};
}
function tpRegisterTeacher_(args) {
  const registrationToken=String(args.registrationToken||'');
  const displayName=String(args.displayName||'').replace(/[<>\r\n]/g,'').trim();
  if(!/^[a-f0-9]{64}$/.test(registrationToken)||displayName.length<2||displayName.length>60)throw Error('名前を2〜60文字で入力してください。');
  return tpWithLock_(()=>{
    const cache=CacheService.getScriptCache(),key='register_'+tpSha_(registrationToken);
    if(cache.get(key)!=='authorized')throw Error('登録の有効期限が切れました。パスコードからやり直してください。');
    cache.remove(key);
    const teacherToken=tpRandom_(),pepper=tpPepper_();
    const member={id:Utilities.getUuid(),name:displayName,role:'teacher',inviteHash:tpSha_(pepper+':teacher-device:'+teacherToken),pinHash:'',active:'true'};
    tpAppend_('Teachers',TP_THEADE,member);
    return {...tpNewSession_(member),teacherToken};
  });
}
function tpLogin_(args) {
  if(args.adminMode===true)return tpSimpleAdminLogin_(args);
  const invite=String(args.invite||'').trim(),pin=String(args.pin||'');
  if(!invite)return tpSharedLogin_(args);
  if(!/^[a-f0-9]{64}$/.test(invite)||!/^\d{4}$/.test(pin))throw Error('招待コードまたはPINが正しくありません。');
  const pepper=tpPepper_(), inviteHash=tpSha_(pepper+':invite:'+invite);
  const cache=CacheService.getScriptCache(), failKey='fail_'+inviteHash.slice(0,45);
  const failed=Number(cache.get(failKey)||0);
  if(failed>=5)throw Error('試行回数の上限です。15分後に再試行してください。');
  const member=tpTeacherRows_().find(x=>x.inviteHash===inviteHash && tpBool_(x.active));
  const success=!!member && member.pinHash===tpSha_(pepper+':pin:'+invite+':'+pin);
  if(!success){cache.put(failKey,String(failed+1),900);throw Error('招待コードまたはPINが正しくありません。');}
  cache.remove(failKey);
  return tpNewSession_(member);
}
function tpUser_(args) {
  const session=String(args.session||'');
  if(!/^[a-f0-9]{64}$/.test(session))throw Error('ログインし直してください。');
  const text=CacheService.getScriptCache().get('session_'+tpSha_(session));
  if(!text)throw Error('ログインの有効期限が切れました。もう一度ログインしてください。');
  const user=JSON.parse(text);
  const member=tpTeacherRows_().find(x=>x.id===user.id && tpBool_(x.active));
  if(!member || member.role!==user.role)throw Error('アカウントを確認できませんでした。');
  return user;
}
function tpQuestion_(id) {return tpRows_('Questions').find(x=>x.id===String(id||''));}
function tpAdmin_(user) {if(user.role!=='admin')throw Error('管理者のみ実行できます。');}
function tpSources_(list) {
  const urls=(Array.isArray(list)?list:[]).map(v=>String(v||'').trim()).filter(Boolean).slice(0,2);
  if(urls.some(v=>!/^https?:\/\/[^\s]+$/i.test(v)||v.length>1800))throw Error('参考URLはhttps://またはhttp://で入力してください。');
  return urls;
}
function tpParse_(s) {try { return JSON.parse(String(s||'[]')); }catch{return [];}}
function tpOutputQuestion_(q,media) {
  const { _row, choicesJson, sourcesJson, ...other }=q;
  return {...other,choices:tpParse_(choicesJson),sources:tpParse_(sourcesJson),media:media.filter(m=>m.questionId===q.id).map(m=>({id:m.id,slot:Number(m.slot),fileName:m.fileName,createdAt:m.createdAt}))};
}
function tpBootstrap_(user) {
  const qs=tpRows_('Questions'),media=tpRows_('Media'),progress=tpRows_('Progress');
  // MVP supports <= 2,000 submissions. Add pagination before a wider rollout.
  if(qs.length>2000)throw Error('一覧が大きくなりました。管理者がページ分割を設定してください。');
  return {user,questions:qs.filter(q=>(user.role==='admin'||q.status!=='deleted')&&(user.role==='admin'||q.authorId===user.id||q.status!=='draft')).map(q=>{
    const item=tpOutputQuestion_(q,media);
    if(user.role!=='admin'&&q.authorId!==user.id)item.reviewNote='';
    return item;
  }),progress:Object.fromEntries(progress.map(p=>[p.key,Number(p.manualDone||0)]))};
}
function tpSaveQuestion_(args,user) {
  const p=args.question||{},id=String(p.id||'');
  const finalize=String(args.finalize||'');
  if(!['','submitted','approved'].includes(finalize))throw Error('保存処理を確認してください。');
  if(finalize==='approved'&&user.role!=='admin')throw Error('合格は管理者のみ実行できます。');
  const iso=String(p.countryIso||'').toLowerCase().trim();
  if(!/^[a-z]{2}$/.test(iso)||!TP_DOMAINS.includes(p.domain)||!TP_TYPES.includes(p.type))throw Error('国・カテゴリー・問題形式を確認してください。');
  const prompt=String(p.prompt||'').trim(),answer=String(p.answer||'').trim();
  if(prompt.length>2000||answer.length>1500||String(p.notes||'').length>5000)throw Error('文章が長すぎます。');
  const choices=(Array.isArray(p.choices)?p.choices:[]).slice(0,3).map(v=>String(v||'').slice(0,600));
  const sources=tpSources_(p.sources);
  return tpWithLock_(()=>{
    const previous=id?tpQuestion_(id):null;
    if(id&&!previous)throw Error('編集対象が見つかりませんでした。');
    if(previous && previous.status==='deleted')throw Error('削除済みの問題は復元してから編集してください。');
    if(previous && previous.status==='published')throw Error('公開済みの問題は編集できません。');
    if(previous && user.role!=='admin' && previous.authorId!==user.id)throw Error('他の先生の問題は編集できません。');
    if(previous && user.role!=='admin' && ['approved','published'].includes(previous.status))throw Error('承認後の修正は管理者へご相談ください。');
    const now=tpNow_();
    const row={id:previous?.id||Utilities.getUuid(),countryIso:iso,countryName:String(p.countryName||'').slice(0,90),domain:p.domain,type:p.type,prompt,answer,choicesJson:JSON.stringify(choices),sourcesJson:JSON.stringify(sources),notes:String(p.notes||''),authorId:previous?.authorId||user.id,authorName:previous?.authorName||user.name,status:finalize||(previous&&user.role==='admin'?previous.status:'draft'),reviewNote:previous?.reviewNote||'',createdAt:previous?.createdAt||now,updatedAt:now};
    if(finalize){
      if(!row.prompt||!row.countryIso||!row.domain)throw Error('国・カテゴリー・問題文を入力してください。');
      if(row.type==='text4'&&(!row.answer||tpParse_(row.choicesJson).filter(v=>String(v||'').trim()).length!==3))throw Error('4択の正答と誤答3つが必要です。');
      if(row.type==='photo4'||row.type==='photo1'){
        const slots=tpRows_('Media').filter(m=>m.questionId===row.id).map(m=>Number(m.slot));
        const expected=row.type==='photo4'?[1,2,3,4]:[1];
        if(slots.length!==expected.length||expected.some(slot=>!slots.includes(slot)))throw Error('写真の登録が不足しています。再アップロードせずに写真登録情報を確認してください。');
      }
      if(finalize==='approved')row.reviewNote='';
    }
    if(previous)tpReplace_('Questions',TP_QHEAD,previous._row,row);else tpAppend_('Questions',TP_QHEAD,row);
    return {question:tpOutputQuestion_(row,[])};
  });
}
function tpUpload_(args,user) {
  const id=String(args.questionId||''),slot=Number(args.slot),base64=String(args.base64||'');
  if(![1,2,3,4].includes(slot)||base64.length>1700000||!/^[A-Za-z0-9+/]+={0,2}$/.test(base64))throw Error('画像データを確認してください。');
  const q=tpQuestion_(id);
  if(!q || (user.role!=='admin' && q.authorId!==user.id))throw Error('画像を追加する権限がありません。');
  if(user.role!=='admin'&&['approved','published'].includes(q.status))throw Error('承認済みの問題には追加できません。');
  if(q.status==='deleted')throw Error('削除済みの問題には写真を追加できません。');
  if(!['photo4','photo1'].includes(q.type)||(q.type==='photo1'&&slot!==1))throw Error('写真のスロットを確認してください。');
  const bytes=Utilities.base64Decode(base64);
  if(bytes.length<16||bytes.length>1228800||String.fromCharCode(...bytes.slice(0,4))!=='RIFF'||String.fromCharCode(...bytes.slice(8,12))!=='WEBP')throw Error('WebP画像は1.2MB以下でアップロードしてください。');
  return tpWithLock_(()=>{
    const latest=tpQuestion_(id);
    if(!latest||latest.status==='deleted'||(user.role!=='admin'&&['approved','published'].includes(latest.status)))throw Error('編集権限がありません。');
    const name=q.id+'_P0'+slot+'.webp';
    const file=tpMediaFolder_().createFile(Utilities.newBlob(bytes,'image/webp',name));
    // The folder is PRIVATE, and no public file-sharing permission is set.
    const prev=tpRows_('Media').find(m=>m.questionId===id && Number(m.slot)===slot);
    const row={id:prev?.id||Utilities.getUuid(),questionId:id,slot,fileId:file.getId(),fileName:name,size:bytes.length,createdAt:tpNow_()};
    if(prev)tpReplace_('Media',TP_MHEAD,prev._row,row);else tpAppend_('Media',TP_MHEAD,row);
    // Replaced private assets are no longer referenced; put old files in Trash.
    if(prev && prev.fileId!==file.getId()){try{DriveApp.getFileById(prev.fileId).setTrashed(true);}catch(e){Logger.log('Old media cleanup skipped');}}
    return {id:row.id,slot,fileName:name,size:bytes.length};
  });
}
function tpSubmit_(args,user) {
  return tpWithLock_(()=>{
    const q=tpQuestion_(args.questionId);
    if(!q||(user.role!=='admin'&&q.authorId!==user.id))throw Error('問題が見つかりません。');
    if(['approved','published','deleted'].includes(q.status))throw Error('承認済み・削除済みの問題は再提出できません。');
    if(!q.prompt || !q.countryIso || !q.domain)throw Error('国・カテゴリー・問題文を入力してください。');
    if(q.type==='text4'&&(!q.answer||tpParse_(q.choicesJson).filter(Boolean).length!==3))throw Error('4択の正答と誤答3つが必要です。');
    if(q.type==='photo4'&&tpRows_('Media').filter(m=>m.questionId===q.id).length!==4)throw Error('写真4択には画像4枚が必要です。');
    if(q.type==='photo1'&&!tpRows_('Media').some(m=>m.questionId===q.id&&Number(m.slot)===1))throw Error('写真が1枚必要です。');
    q.status='submitted';q.updatedAt=tpNow_();tpReplace_('Questions',TP_QHEAD,q._row,q);
    return {questionId:q.id,status:'submitted'};
  });
}
function tpReview_(args,user) {
  tpAdmin_(user);
  if(!['approved','needs_revision'].includes(args.status))throw Error('合格または修正依頼を選んでください。');
  return tpWithLock_(()=>{
    const q=tpQuestion_(args.questionId);
    if(!q)throw Error('問題が見つかりません。');
    if(['published','deleted'].includes(q.status))throw Error('公開済み・削除済みの問題は変更できません。');
    if(!q.prompt||!q.countryIso||!TP_DOMAINS.includes(q.domain)||!TP_TYPES.includes(q.type))throw Error('国・カテゴリー・問題文を確認してください。');
    if(args.status==='approved'){
      if(!['draft','submitted','needs_revision'].includes(q.status))throw Error('この問題はすでに合格済みです。');
      if(q.type==='text4'&&(!q.answer||tpParse_(q.choicesJson).filter(v=>String(v||'').trim()).length!==3))throw Error('4択の正答と誤答3つが必要です。');
      if(q.type==='photo4'||q.type==='photo1'){
        const slots=tpRows_('Media').filter(m=>m.questionId===q.id).map(m=>Number(m.slot));
        const expected=q.type==='photo4'?[1,2,3,4]:[1];
        if(slots.length!==expected.length||expected.some(slot=>!slots.includes(slot)))throw Error('写真が揃っていません。写真を登録してから合格にしてください。');
      }
    }
    q.status=args.status;
    q.updatedAt=tpNow_();
    q.reviewNote=args.status==='approved'?'':String(args.reviewNote||'').slice(0,1000);
    tpReplace_('Questions',TP_QHEAD,q._row,q);
    return {questionId:q.id,status:q.status,updatedAt:q.updatedAt,reviewNote:q.reviewNote};
  });
}
function tpSetDeleted_(args,user,restore){
  tpAdmin_(user);
  return tpWithLock_(()=>{
    const q=tpQuestion_(args.questionId);
    if(!q)throw Error('対象の問題が見つかりません。');
    if(restore){
      if(q.status!=='deleted')throw Error('削除済みだけ復元できます。');
      q.status='submitted';
    }else{
      if(!['draft','submitted','needs_revision','approved'].includes(q.status))
        throw Error('提出済みの問題のみ削除できます。');
      q.status='deleted';
    }
    q.updatedAt=tpNow_();
    tpReplace_('Questions',TP_QHEAD,q._row,q);
    return {questionId:q.id,status:q.status};
  });
}
function tpProgress_(args,user) {
  tpAdmin_(user);
  const iso=String(args.countryIso||'').toLowerCase(),domain=String(args.domain||''),count=Number(args.manualDone);
  if(!/^[a-z]{2}$/.test(iso)||!['place','time'].includes(domain)||!Number.isInteger(count)||count<0||count>10)throw Error('地理・時差の完成数は0〜10です。');
  return tpWithLock_(()=>{
    const key=iso+':'+domain,prev=tpRows_('Progress').find(p=>p.key===key);
    const row={key,countryIso:iso,domain,manualDone:count,updatedAt:tpNow_()};
    if(prev)tpReplace_('Progress',TP_PHEAD,prev._row,row);else tpAppend_('Progress',TP_PHEAD,row);
    return row;
  });
}

function tpPhotoCacheKey_(fileId){
  return 'tp-webp-v3-'+tpSha_(String(fileId)).slice(0,28);
}

// The shared cache contains only image bytes.
// Every request must pass session and question authorization first.
function tpPhotoCacheRead_(fileId){
  try{
    const cache=CacheService.getScriptCache();
    const prefix=tpPhotoCacheKey_(fileId);
    const count=Number(cache.get(prefix+':n'));

    if(!Number.isInteger(count)||count<1||count>30)
      return null;

    const keys=Array.from({length:count},(_,i)=>prefix+':'+i);
    const stored=cache.getAll(keys);

    if(keys.some(key=>typeof stored[key]!=='string'))
      return null;

    const base64=keys.map(key=>stored[key]).join('');
    return base64.length<=1700000 ? base64 : null;
  }catch(e){
    return null;
  }
}

function tpPhotoCacheWrite_(fileId,base64){
  try{
    const size=60000;
    const count=Math.ceil(base64.length/size);
    if(count<1||count>30)return;

    const prefix=tpPhotoCacheKey_(fileId);
    const pieces={};

    for(let i=0;i<count;i++)
      pieces[prefix+':'+i]=base64.slice(i*size,(i+1)*size);

    const cache=CacheService.getScriptCache();
    cache.putAll(pieces,1200);
    cache.put(prefix+':n',String(count),1200);
  }catch(e){
    // A cache failure must never prevent photo viewing.
  }
}

function tpPhotoBase64Length_(base64){
  const padding=base64.endsWith('==')?2:base64.endsWith('=')?1:0;
  return Math.floor(base64.length*3/4)-padding;
}

function tpGetMediaBatch_(args,user){
  const started=Date.now();
  const q=tpQuestion_(args.questionId);

  if(!q || (user.role!=='admin' &&
    (q.status==='deleted' ||
     (q.authorId!==user.id && q.status==='draft'))))
    throw Error('問題が見つかりません。');

  const rows=tpRows_('Media')
    .filter(m=>m.questionId===q.id)
    .sort((a,b)=>Number(a.slot)-Number(b.slot));

  const photos=[];
  const errors=[];
  const missing=[];
  let total=0;
  let cacheHits=0;

  for(const item of rows){
    const slot=Number(item.slot);
    if(![1,2,3,4].includes(slot))continue;

    const cached=tpPhotoCacheRead_(item.fileId);
    if(!cached){
      missing.push(item);
      continue;
    }

    const size=tpPhotoBase64Length_(cached);
    if(size>1228800 || total+size>2400000){
      errors.push({slot,message:'個別取得が必要です'});
      continue;
    }

    total+=size;
    photos.push({slot,base64:cached});
    cacheHits++;
  }

  // Concurrent Google Drive API reads for cache misses.
  // DriveApp remains the fallback if API access is unavailable.
  let responses=null;
  let parallel=false;

  if(missing.length>1 &&
     typeof UrlFetchApp!=='undefined' &&
     typeof ScriptApp!=='undefined'){
    try{
      const token=ScriptApp.getOAuthToken();
      const requests=missing.map(item=>({
        url:'https://www.googleapis.com/drive/v3/files/'
          +encodeURIComponent(String(item.fileId))+'?alt=media',
        method:'get',
        headers:{Authorization:'Bearer '+token},
        muteHttpExceptions:true,
        timeoutSeconds:8
      }));

      responses=UrlFetchApp.fetchAll(requests);
      parallel=Array.isArray(responses) &&
        responses.length===missing.length;
    }catch(e){
      Logger.log('Parallel photo retrieval fallback');
    }
  }

  for(let i=0;i<missing.length;i++){
    const item=missing[i];
    const slot=Number(item.slot);

    try{
      const response=parallel?responses[i]:null;
      const bytes=response && response.getResponseCode()===200
        ? response.getBlob().getBytes()
        : DriveApp.getFileById(item.fileId).getBlob().getBytes();

      if(bytes.length>1228800)
        throw Error('Photo too large');

      if(total+bytes.length>2400000)
        throw Error('Batch size limit');

      const base64=Utilities.base64Encode(bytes);
      total+=bytes.length;

      photos.push({slot,base64});
      tpPhotoCacheWrite_(item.fileId,base64);
    }catch(e){
      errors.push({slot,message:'個別取得が必要です'});
    }
  }

  photos.sort((a,b)=>a.slot-b.slot);

  return {
    photos,
    errors,
    perf:{
      cacheHits,
      parallel,
      elapsedMs:Date.now()-started
    }
  };
}

function tpGetMedia_(args,user){
  const q=tpQuestion_(args.questionId);

  if(!q || (user.role!=='admin' &&
    (q.status==='deleted' ||
     (q.authorId!==user.id && q.status==='draft'))))
    throw Error('問題が見つかりません。');

  const media=tpRows_('Media').find(
    m=>m.questionId===q.id&&Number(m.slot)===Number(args.slot)
  );
  if(!media)throw Error('写真が見つかりません。');

  let base64=tpPhotoCacheRead_(media.fileId);

  if(!base64){
    const bytes=DriveApp.getFileById(media.fileId)
      .getBlob().getBytes();

    if(bytes.length>1228800)
      throw Error('画像が大きすぎます。');

    base64=Utilities.base64Encode(bytes);
    tpPhotoCacheWrite_(media.fileId,base64);
  }

  return {base64,mime:'image/webp'};
}

// Run from the Apps Script editor once before deploying.
function authorizeMissionCreatorPhotoFetch(){
  const response=UrlFetchApp.fetch(
    'https://www.googleapis.com/drive/v3/about?fields=kind',
    {
      headers:{
        Authorization:'Bearer '+ScriptApp.getOAuthToken()
      },
      muteHttpExceptions:true,
      timeoutSeconds:8
    }
  );

  const status=response.getResponseCode();
  if(status!==200)
    throw Error('Drive API authorization failed: HTTP '+status);

  return 'Drive API authorization OK';
}

function tpResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  try {
    const body=JSON.parse(e?.postData?.contents||'{}');
    const action=String(body.action||'');
    if(action==='login'){
      const data=tpLogin_(body);
      if(body.withBootstrap && data.session && data.user){
        try{data.bootstrap=tpBootstrap_(data.user);}
        catch(e){Logger.log('Initial data loading deferred');}
      }
      return tpResponse_({ok:true,data});
    }
    if(action==='registerTeacher'){
      const data=tpRegisterTeacher_(body);
      if(body.withBootstrap && data.session && data.user){
        try{data.bootstrap=tpBootstrap_(data.user);}
        catch(e){Logger.log('Initial data loading deferred');}
      }
      return tpResponse_({ok:true,data});
    }
    const user=tpUser_(body);
    let data;
    switch(action){
      case 'bootstrap':data=tpBootstrap_(user);break;
      case 'saveQuestion':data=tpSaveQuestion_(body,user);break;
      case 'uploadImage':data=tpUpload_(body,user);break;
      case 'submitQuestion':data=tpSubmit_(body,user);break;
      case 'reviewQuestion':data=tpReview_(body,user);break;
      case 'setProgress':data=tpProgress_(body,user);break;
      case 'getMediaBatch':data=tpGetMediaBatch_(body,user);break;
      case 'getMedia':data=tpGetMedia_(body,user);break;
      case 'deleteQuestion':data=tpSetDeleted_(body,user,false);break;
      case 'restoreQuestion':data=tpSetDeleted_(body,user,true);break;
      default:throw Error('Unsupported action');
    }
    return tpResponse_({ok:true,data});
  } catch(err) {
    // Never send stack traces, spreadsheet IDs or internal Drive file IDs.
    const msg=String(err?.message||'処理に失敗しました。');
    return tpResponse_({ok:false,error:msg.slice(0,260)});
  }
}
function doGet() {return ContentService.createTextOutput('TimePalette Mission Creator backend is running.');}
