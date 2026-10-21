import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Camera, CheckCircle2, CircleHelp, Clock3, Compass, FilePlus2, Globe2, LayoutDashboard, LockKeyhole, LogOut, Pencil, Search, ShieldCheck, UploadCloud, ChevronDown, ChevronRight, MoreHorizontal, ExternalLink, X } from 'lucide-react';
import { getWorldLearningCountries } from '../utils/worldLearningRegistry';
import { creatorRequest } from './api';
import { filterBankQuestions } from './filterBankQuestions.js';
import PublishedMissionManager from './PublishedMissionManager.jsx';
import MissionFactoryImport from './MissionFactoryImport.jsx';
import { BULK_LIMIT, createBulkPlan, eligibleForBulk, executeBulkPlan } from './bulkActions.js';
import { blobToBase64, optimizeImage } from './image';
import {videoEmbedUrl} from '../utils/creatorVideo.js';

const DOMAINS = [
  ['place', '場所・地理'],
  ['time', '時間・時差'],
  ['language', 'ことば・交流'],
  ['lifeCulture', '生活・文化'],
  ['japanConnection', '日本とのつながり'],
  ['thinkConnect', '比較・思考・交流'],
];
const TYPES = [
  ['text4', '文章による4択'],
  ['photo4', '写真4枚の4択'],
  ['photo1', '写真1枚で考える'],
  ['photoText4', '写真1枚＋文章4択'],
  ['free', '自由回答・話し合い'],
  ['web', 'Webサイトなどの資料を利用'],
  ['video4', 'YouTube動画＋4択'],
  ['videoReflect', 'YouTube動画＋感想・記述'],
];
const LEVEL_OPTIONS = [
  ['elementary','小学生'],['juniorHigh','中学生'],
  ['highSchoolStandard','高校生'],['highSchoolAdvanced','高校生 Challenge（英語版）'],
];
const STANDARD_LEVELS = ['elementary','juniorHigh','highSchoolStandard'];
const TARGET = 10;
const EMPTY = {
  id: '', countryIso: '', countryName: '', domain: 'language', type: 'text4',
  prompt: '', answer: '', choices: ['', '', ''], sources: ['', ''], notes: '',
  authorProfile:{name:'',school:'',region:'',bio:'',consent:false},video:{youtubeUrl:'',startSeconds:0,endSeconds:0,minChars:80,maxChars:600,keywords:[],keywordMode:'all'},
  learning:{levels:[...STANDARD_LEVELS],challenge:{promptEn:'',answerEn:'',choicesEn:['','',''],explanationEn:''},
    voice:{enabled:false,lang:'en-US',prompt:'',target:'',alternatives:[]}},
  updatedAt: '',
};
const statusJa = {
  draft: '下書き', submitted: '提出済み', needs_revision: '要修正', approved: '承認済み', published: '公開済み', deleted: '削除済み',
};
const formatNumber = (value) => new Intl.NumberFormat('ja-JP').format(value);
const safeHttp = (url) => /^https?:\/\//i.test(String(url || ''));

function useCountries() {
  return useMemo(() => getWorldLearningCountries().map((c) => ({
    iso: c.iso.toLowerCase(), name: c.nameJa, nameEn: c.nameEn, flag: c.flagEmoji, flagUrl: c.flagUrl,
  })), []);
}

// Actual flag images are used instead of relying on Windows rendering of flag emoji
// inside a native <select>. The source URLs come from TimePalette's country data.
function CountryFlag({ country }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [country?.flagUrl]);
  const title = country ? `${country.name}の国旗` : '国旗';
  return <span className="mc-country-flag" role="img" aria-label={title}>
    {country?.flagUrl && !failed
      ? <img src={country.flagUrl} alt="" loading="lazy" onError={() => setFailed(true)} />
      : <span aria-hidden="true">{country?.flag || '🌍'}</span>}
  </span>;
}

// Searchable picker: 197 country flags are visible in the menu on desktop and tablet.
function CountryPicker({ countries, value, onChange, label = '国を選択' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const selected = countries.find(c => c.iso === value);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = countries.filter(c =>
    !normalizedQuery || [c.name, c.nameEn, c.iso].some(s =>
      String(s || '').toLocaleLowerCase().includes(normalizedQuery))
  );
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = e => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
  const toggle = () => {
    setOpen(v => !v);
    setQuery('');
    if (!open) window.requestAnimationFrame(() => inputRef.current?.focus());
  };
  return <div className="mc-country-picker" ref={rootRef}>
    <button type="button" className="mc-country-trigger" aria-haspopup="listbox" aria-expanded={open} aria-label={label} onClick={toggle}>
      {selected ? <><CountryFlag country={selected}/><span className="mc-country-selected-name">{selected.name}</span></> : <span>国を選択</span>}
      <ChevronDown className="mc-country-trigger-chevron" size={19} aria-hidden="true" />
    </button>
    {open && <div className="mc-country-popover">
      <input ref={inputRef} type="search" className="mc-country-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="国名・英語名・国コードで検索" aria-label="国を検索" />
      <div className="mc-country-options" role="listbox" aria-label={label}>
        {matches.length ? matches.map(c => <button type="button" role="option" aria-selected={c.iso === value} className={'mc-country-option'+(c.iso===value?' selected':'')} key={c.iso} onClick={()=>{onChange(c.iso);setOpen(false);setQuery('');}}>
          <CountryFlag country={c}/><span className="mc-country-option-name">{c.name}</span><small>{c.iso.toUpperCase()}</small>
        </button>) : <p className="mc-country-empty">該当する国がありません。</p>}
      </div>
      <div className="mc-country-option-count">{matches.length} / {countries.length} か国</div>
    </div>}
  </div>;
}

function Access({ onLogin, onRegister, busy, error, registrationToken, onBack, cloudflare }) {
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const submit = event => {
    event.preventDefault();
    if(cloudflare) onLogin({pin});
    else if(registrationToken)onRegister(registrationToken,name.trim());
    else onLogin({pin,adminMode});
  };
  const invalid=cloudflare?pin.length!==4
    :(registrationToken?!name.trim():pin.length!==4);
  return <main className="mc-access-wrap"><div className="mc-access mc-card">
    <div className="mc-logo"><Compass size={24}/><span>TimePalette</span></div>
    <div className="mc-eyebrow">TEACHER WORKSPACE</div>
    <h1>世界のミッションを、一緒に作ろう。</h1>
    <p>国を選んで問題を作成。写真をWebPに変換して提出できます。</p>
    <form className="mc-stack" onSubmit={submit}>
      {cloudflare ? <label>4桁のログインコード<input autoFocus type="password" inputMode="numeric" pattern="[0-9]*" value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} maxLength={4} minLength={4} required autoComplete="off" /></label> : registrationToken ? <><p>初回登録です。お名前を入力してください。</p><label>お名前<input autoFocus value={name} maxLength={60} onChange={e=>setName(e.target.value)} required autoComplete="name"/></label></> :
      <label>{adminMode?'管理者PIN（4桁）':'先生用共通パスコード（4桁）'}<input value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,'').slice(0,4))} inputMode="numeric" type="password" minLength={4} maxLength={4} required autoComplete="off"/></label>}
      <button className="mc-primary" type="submit" disabled={busy||invalid}>{busy?'確認中…':registrationToken?'登録して始める':'ログインする'}</button>
    </form>
    {error&&<p role="alert" className="mc-error">{error}</p>}
    {registrationToken?<button type="button" className="mc-text-btn" onClick={onBack}>ログインに戻る</button>:
      !cloudflare&&<button type="button" className="mc-text-btn" onClick={()=>{setAdminMode(v=>!v);setPin('');}}>{adminMode?'先生用のログインに戻る':'管理者ログインはこちら'}</button>}
    <p className="mc-hint"><LockKeyhole size={14}/>{cloudflare?'先生・管理者ともに数字4桁だけでログインできます。':'PINは関係者のみに共有してください。'}</p>
  </div></main>;
}

function TeacherAccessPanel({session}){
 const [teachers,setTeachers]=useState([]),[loading,setLoading]=useState(false),[error,setError]=useState(''),[invite,setInvite]=useState('');
 const [newName,setNewName]=useState('');
 const refresh=async()=>{setLoading(true);setError('');try{const result=await creatorRequest('listTeachers',{},session);setTeachers(result.teachers||[]);}catch(e){setError(e.message);}finally{setLoading(false);}};
 const create=async()=>{if(!newName.trim())return;setLoading(true);setError('');setInvite('');try{
  const result=await creatorRequest('createTeacher',{name:newName.trim()},session);
  const url=new URL(window.location.href);url.search='';url.hash='';url.searchParams.set('enroll',result.enrollmentToken);setInvite(url.toString());setNewName('');
  const updated=await creatorRequest('listTeachers',{},session);setTeachers(updated.teachers||[]);
 }catch(e){setError(e.message);}finally{setLoading(false);}};
 const issue=async(t)=>{setLoading(true);setError('');setInvite('');try{const result=await creatorRequest('issueInvite',{teacherId:t.id},session);
  const url=new URL(window.location.href);url.search='';url.hash='';url.searchParams.set('enroll',result.enrollmentToken);setInvite(url.toString());
 }catch(e){setError(e.message);}finally{setLoading(false);}};
 return <section className="mc-card mc-section" aria-label="先生のアカウント設定"><h2>先生のアカウント設定</h2>
 <p>既存の先生に新しい招待リンクを発行します。リンクは7日間・1回限り有効です。個別に送ってください。</p>
 <div className="mc-fields-row"><label>新しく先生を登録<input value={newName} onChange={e=>setNewName(e.target.value)} maxLength={60} placeholder="お名前"/></label>
 <button type="button" className="mc-primary mc-small" disabled={loading||newName.trim().length<2} onClick={create}>登録して招待リンクを発行</button></div>
 <button type="button" className="mc-outline mc-small" disabled={loading} onClick={refresh}>先生一覧を表示／更新</button>
 {error&&<p className="mc-error" role="alert">{error}</p>}
 {teachers.map(t=><div key={t.id} className="mc-public-item"><span>{t.name}（ID: {t.loginId}／{t.role==='admin'?'管理者':'教師'}／{t.configured?'設定済み':'未設定'}）</span>
  <button type="button" className="mc-outline mc-small" disabled={loading||!t.active} onClick={()=>issue(t)}>招待・パスワード再設定リンクを発行</button></div>)}
 {invite&&<div><label>発行されたリンク（この画面を閉じると表示されません）<input readOnly value={invite} onFocus={e=>e.target.select()}/></label>
 <button className="mc-outline mc-small" type="button" onClick={()=>navigator.clipboard.writeText(invite)}>リンクをコピー</button></div>}
 </section>;
}

function ProgressBadge({ value }) {
  return <div className="mc-progress-line"><span style={{ width: `${Math.min(TARGET, value) * 10}%` }} /></div>;
}

function PhotoSlot({ slot, preview, name, onPick, busy, isCorrect, singlePhoto }) {
  return (
    <label className={`mc-photo-slot${isCorrect ? ' mc-answer-correct' : ''}`}>
      {isCorrect && <span className="mc-correct-badge"><CheckCircle2 size={14} />正答の写真</span>}
      {preview ? <img src={preview} alt={`写真${slot}`} /> : <div className="mc-photo-empty"><Camera size={30} /><span>{name ? `写真${slot}：保存済み（クリックして差し替え）` : `写真${slot}を選択`}</span></div>}
      <span className="mc-photo-caption">{singlePhoto ? '観察する写真' : isCorrect ? '① 正答の写真' : `誤答の写真 ${slot}`}</span>
      <small>{name || (preview ? '保存済みの画像' : 'JPEG / PNG / WebP')}</small>
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => { const file = e.target.files?.[0]; if (file) onPick(slot, file); e.target.value = ''; }} />
    </label>
  );
}

// Source URLs, attribution and editorial notes are for teachers and administrators.
// They are never part of the learner-facing preview.
function ReferencePanel({ form }) {
  const links = (form.sources || []).map(v => String(v || '').trim()).filter(safeHttp);
  const notes = String(form.notes || '').trim();
  return <section className="mc-reference-panel" aria-label="出典・参考資料（先生用）">
    <h4><BookOpen size={17} /> 出典・参考資料（先生用）</h4>
    {links.length ? <div className="mc-reference-links">{links.map((url, i) =>
      <a href={url} target="_blank" rel="noopener noreferrer" key={`${url}-${i}`}>
        <ExternalLink size={15} /><span>参考URL {i + 1}：{url}</span>
      </a>)}</div> : <p className="mc-reference-empty">参考URLはまだ登録されていません。</p>}
    {notes ? <div className="mc-reference-notes"><strong>解説・出典・制作メモ</strong><p>{notes}</p></div>
      : <p className="mc-reference-empty">出典・解説メモはまだ登録されていません。</p>}
    <p className="mc-reference-caution">リンク先の内容・写真の掲載条件は、公開前に管理者が確認してください。</p>
  </section>;
}

function QuestionPreview({ form, photos }) {
  const [showTeacherDetails, setShowTeacherDetails] = useState(true);
  const photoMode = ['photo1', 'photo4', 'photoText4'].includes(form.type);
  const photoCount = form.type === 'photo4' ? 4 : 1;
  return (
    <section className="mc-preview" aria-label="問題プレビュー">
      <div className="mc-eyebrow">MISSION PREVIEW</div>
      <h3>問題の表示を確認</h3>
      <div className="mc-preview-modes" role="group" aria-label="プレビューモード">
        <button type="button" className={showTeacherDetails ? 'active' : ''} aria-pressed={showTeacherDetails} onClick={()=>setShowTeacherDetails(true)}>先生確認</button>
        <button type="button" className={!showTeacherDetails ? 'active' : ''} aria-pressed={!showTeacherDetails} onClick={()=>setShowTeacherDetails(false)}>生徒表示</button>
      </div>
      <p className="mc-preview-mode-hint">{showTeacherDetails
        ? '編集・承認用：緑色は正答です。出典やメモも確認できます。'
        : '生徒の表示イメージ：正答の色・出典メモを隠しています。'}</p>
      <p className="mc-prompt">{String(form.prompt || '').trim() || 'ここに問題文が表示されます。'}</p>
      {photoMode && <div className={`mc-preview-grid ${photoCount === 1 ? 'mc-one-photo' : ''}`}>
        {Array.from({ length: photoCount }, (_, i) => i + 1).map(slot => {
          const isCorrect = form.type === 'photo4' && slot === 1 && showTeacherDetails;
          return <div key={slot} className={`mc-preview-option${isCorrect ? ' mc-answer-correct' : ''}`}>
            {isCorrect && <span className="mc-correct-badge"><CheckCircle2 size={14}/>正答</span>}
            {photos[slot]?.preview ? <img src={photos[slot].preview} alt={`選択肢${slot}`} /> : <div className="mc-placeholder"><Camera />写真{slot}</div>}
            <small>{form.type === 'photo4' ? `選択肢 ${slot}` : '観察する写真'}</small>
          </div>;
        })}
      </div>}
       {['text4', 'photoText4','video4'].includes(form.type) && <div className="mc-choice-grid">{[form.answer, ...form.choices].map((c, i) =>
        <div key={i} className={showTeacherDetails && i === 0 ? 'mc-answer-correct' : ''}>{showTeacherDetails && i===0 && <CheckCircle2 size={15} aria-label="正答" />} {String.fromCharCode(65 + i)}. {c || '（未入力）'}</div>)}</div>}
       {['video4','videoReflect'].includes(form.type) && videoEmbedUrl(form.video) && <div className="mc-stack">
         <p className="mc-hint">生徒画面に表示する動画</p>
         <iframe title="動画プレビュー" src={videoEmbedUrl(form.video)} style={{width:'100%',aspectRatio:'16/9',border:0,borderRadius:10}} loading="lazy" allow="encrypted-media; picture-in-picture" allowFullScreen/>
         {form.type==='videoReflect' && <p className="mc-hint">{form.video?.minChars||80}〜{form.video?.maxChars||600}文字、キーワード：{form.video?.keywords?.join('、')||'指定なし'}</p>}
       </div>}
       {form.type === 'web' && <p className="mc-hint">Webを使う問題は参考URLを保存します。外部ページの埋め込みには掲載元の許可が必要です。</p>}
      {showTeacherDetails && <ReferencePanel form={form} />}
    </section>
  );
}

function Editor({ form, setForm, photos, onPhoto, onSave, onSubmit, onCancel, busy, demo, error, saveStage, isAdmin, photoLoadBusy, photoLoadError, onRetryPhotos }) {
  const update = (k, value) => setForm(prev => ({ ...prev, [k]: value }));
  const updateProfile=(k,v)=>setForm(prev=>({...prev,authorProfile:{...(prev.authorProfile||{}),[k]:v}}));
  const updateVideo=(k,v)=>setForm(prev=>({...prev,video:{...(prev.video||{}),[k]:v}}));
  const updateLearning=(next)=>setForm(prev=>({...prev,learning:{...(prev.learning||EMPTY.learning),...next}}));
  const updateEnglish=(k,v)=>setForm(prev=>({...prev,learning:{...(prev.learning||EMPTY.learning),challenge:{...(prev.learning?.challenge||EMPTY.learning.challenge),[k]:v}}}));
  const updateVoice=(k,v)=>setForm(prev=>({...prev,learning:{...(prev.learning||EMPTY.learning),
    voice:{...EMPTY.learning.voice,...(prev.learning?.voice||{}),[k]:v}}}));
  const photoCount = form.type === 'photo4' ? 4 : ['photo1', 'photoText4'].includes(form.type) ? 1 : 0;
  return <div className="mc-editor-grid">
    <section className="mc-card mc-section">
      <div className="mc-section-top"><div><div className="mc-eyebrow">MISSION EDITOR</div><h2>{form.id ? '問題を編集' : '新しい問題を作る'}</h2></div><button className="mc-quiet" onClick={onCancel} type="button"><ArrowLeft size={17} />一覧へ</button></div>
      <div className="mc-fields-row"><div className="mc-country-field"><span>国</span><CountryPicker countries={form.countries || []} value={form.countryIso} onChange={iso => update('countryIso', iso)} label="問題を作成する国" /></div><label>カテゴリー <select value={form.domain} onChange={e => update('domain', e.target.value)}>{DOMAINS.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label></div>
      <label>問題の形式 <select value={form.type} onChange={e => update('type', e.target.value)}>{TYPES.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>
       <fieldset className="mc-stack" style={{border:'1px solid #bfdce9',borderRadius:12,padding:12,marginTop:12}}>
         <legend>対象学習レベル（複数選択可）</legend>
         <p className="mc-muted">同じ問題を複数のレベルに公開できます。選択していないレベルには表示されません。</p>
         {LEVEL_OPTIONS.map(([id,label])=><label key={id} style={{display:'flex',alignItems:'center',gap:9}}>
           <input type="checkbox" style={{width:'auto'}} checked={(form.learning?.levels||STANDARD_LEVELS).includes(id)}
             onChange={e=>{const current=form.learning?.levels||STANDARD_LEVELS;updateLearning({levels:e.target.checked?[...new Set([...current,id])]:current.filter(x=>x!==id)});}}/>{label}
         </label>)}
         {(form.learning?.levels||STANDARD_LEVELS).includes('highSchoolAdvanced')&&<div className="mc-stack" style={{borderTop:'1px solid #dbeafe',paddingTop:12}}>
           <strong>Challenge用の英語教材（必須）</strong>
           <label>English mission prompt<textarea rows={3} maxLength={2000} value={form.learning?.challenge?.promptEn||''} onChange={e=>updateEnglish('promptEn',e.target.value)}/></label>
           {['text4','photoText4','video4'].includes(form.type)&&<>
             <label>Correct answer (English)<input maxLength={1500} value={form.learning?.challenge?.answerEn||''} onChange={e=>updateEnglish('answerEn',e.target.value)}/></label>
             {[0,1,2].map(i=><label key={i}>Wrong answer {i+1} (English)<input maxLength={600} value={form.learning?.challenge?.choicesEn?.[i]||''}
               onChange={e=>updateEnglish('choicesEn',[0,1,2].map(j=>i===j?e.target.value:(form.learning?.challenge?.choicesEn?.[j]||'')))}/></label>)}
           </>}
           <label>Explanation (English, optional)<textarea rows={2} maxLength={3500} value={form.learning?.challenge?.explanationEn||''} onChange={e=>updateEnglish('explanationEn',e.target.value)}/></label>
           <p className="mc-hint">Challengeでは英語版を表示します。英語の正確さは先生・管理者が確認してください。ゲーム操作ボタン全体の英語化は次の段階で対応します。</p>
         </div>}
       </fieldset>
       <fieldset className="mc-stack" style={{border:'1px solid #bae6fd',borderRadius:12,padding:12,marginTop:12}}>
         <legend>声で練習する（音声認識・任意）</legend>
         <label style={{display:'flex',alignItems:'center',gap:8}}><input type="checkbox" style={{width:'auto'}}
           checked={form.learning?.voice?.enabled===true} onChange={e=>updateVoice('enabled',e.target.checked)}/>
           この問題に音声練習を付ける</label>
         {form.learning?.voice?.enabled===true && <div className="mc-stack">
           <p className="mc-hint">4択の正解判定は従来どおりです。音声練習は得点に影響しません。</p>
           <label>発話言語コード（BCP 47）<input value={form.learning?.voice?.lang||'en-US'} maxLength={35}
             onChange={e=>updateVoice('lang',e.target.value)} placeholder="en-US / fr-FR / sw-KE"/></label>
           <p className="mc-hint">対応可否は端末・ブラウザごとに異なります。対応していない言語は手入力で練習できます。</p>
           <label>発話する場面の指示（任意）<textarea rows={2} maxLength={350}
             value={form.learning?.voice?.prompt||''} onChange={e=>updateVoice('prompt',e.target.value)}
             placeholder="例：写真の人に、英語で挨拶してみましょう。"/></label>
           <label>お手本の表現（必須）<input maxLength={180} value={form.learning?.voice?.target||''}
             onChange={e=>updateVoice('target',e.target.value)} placeholder="Nice to meet you"/></label>
           <label>許容する言い換え（任意・1行に1つ、最大5件）<textarea rows={3}
             value={(form.learning?.voice?.alternatives||[]).join('\n')}
             onChange={e=>updateVoice('alternatives',e.target.value.split(/\r?\n/).slice(0,5))}/></label>
           <p className="mc-hint">学習者の音声認識が外部サービスを使用する場合があります。TimePaletteでは録音データ・認識結果を保存しません。音声認識は発音の精密な採点ではありません。</p>
         </div>}
       </fieldset>
       <label>問題文・活動の指示 <textarea rows={4} value={form.prompt} maxLength={2000} onChange={e => update('prompt', e.target.value)} placeholder="例：写真を見て、ネパールで人気の料理を選んでください。" /></label>
       {['video4','videoReflect'].includes(form.type) && <fieldset className="mc-stack" style={{border:'1px solid #bfdbfe',borderRadius:12,padding:12,marginTop:12}}><legend>YouTube教材</legend>
         <label>YouTube動画のURL <input type="url" value={form.video?.youtubeUrl||(form.video?.youtubeId?'https://www.youtube.com/watch?v='+form.video.youtubeId:'')} onChange={e=>updateVideo('youtubeUrl',e.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></label>
         <div className="mc-fields-row"><label>開始位置（秒） <input type="number" min={0} max={21600} value={form.video?.startSeconds??0} onChange={e=>updateVideo('startSeconds',Number(e.target.value))}/></label>
         <label>終了位置（秒・0は最後まで） <input type="number" min={0} max={21600} value={form.video?.endSeconds??0} onChange={e=>updateVideo('endSeconds',Number(e.target.value))}/></label></div>
         <small>動画URLと開始・終了秒を指定できます。YouTube側が埋め込みを禁止している場合は、外部リンクで視聴します。</small>
         {form.type==='videoReflect' && <>
           <div className="mc-fields-row"><label>最低文字数 <input type="number" min={1} max={1000} value={form.video?.minChars??80} onChange={e=>updateVideo('minChars',Number(e.target.value))}/></label>
           <label>最大文字数 <input type="number" min={1} max={3000} value={form.video?.maxChars??600} onChange={e=>updateVideo('maxChars',Number(e.target.value))}/></label></div>
           <label>必要なキーワード（カンマ区切り・最大8語、任意） <input value={(form.video?.keywords||[]).join('、')} onChange={e=>updateVideo('keywords',e.target.value.split(/[、,]/).map(x=>x.trim()))}/></label>
           <label>キーワード条件 <select value={form.video?.keywordMode||'all'} onChange={e=>updateVideo('keywordMode',e.target.value)}><option value="all">すべて含む</option><option value="any">いずれかを含む</option></select></label>
           <small>クリア判定は文字数・キーワードの形式条件のみです。内容の良し悪しは自動採点しません。</small>
         </>}
       </fieldset>}
       {photoCount > 0 && <div className="mc-stack">
        {Boolean(form.id) && <div className="mc-existing-media-status" role="status">
          <span>既存の写真は保存済みです。{photoLoadBusy ? 'プレビューを読み込んでいます…' : photoLoadError ? 'プレビューだけを取得できませんでした。画像は保持されています。' : ''}</span>
          {photoLoadError && <button type="button" className="mc-outline mc-small" onClick={onRetryPhotos} disabled={photoLoadBusy}>写真表示を再試行</button>}
        </div>}
        <div className="mc-helper-title"><UploadCloud size={18}/> 写真をアップロード</div><p className="mc-muted">写真はこの端末内でWebPに変換されます。4択では①が正答、②〜④が誤答です。ゲーム公開時の表示順は変更できます。</p><div className="mc-upload-grid">{Array.from({ length: photoCount }, (_, i) => i + 1).map(n => <PhotoSlot key={n} slot={n} name={photos[n]?.name || form.media?.find(m=>Number(m.slot)===n)?.fileName} preview={photos[n]?.preview} onPick={onPhoto} busy={busy} isCorrect={form.type==='photo4' && n===1} singlePhoto={form.type==='photo1'}/>)}</div></div>}
       {['text4','photoText4','video4'].includes(form.type) && <div className="mc-stack"><label>正しい答え <input value={form.answer} onChange={e => update('answer', e.target.value)} placeholder="正解の選択肢" /></label>{form.choices.map((v, i) => <label key={i}>まちがいの選択肢 {i + 1} <input value={v} onChange={e => update('choices', form.choices.map((c, j) => i === j ? e.target.value : c))}/></label>)}</div>}
       {!['text4', 'photo4', 'photoText4','video4'].includes(form.type) && <label>模範解答・参考となる回答（任意） <textarea rows={2} value={form.answer} onChange={e => update('answer', e.target.value)} /></label>}
      <label>参考Webページなど（任意） <input type="url" placeholder="https://..." value={form.sources[0] || ''} onChange={e => update('sources', [e.target.value, form.sources[1] || ''])}/></label>
      <label>参考URLをもう1件（任意） <input type="url" placeholder="https://..." value={form.sources[1] || ''} onChange={e => update('sources', [form.sources[0] || '', e.target.value])}/></label>
      <label>解説・出典・アイデア（任意） <textarea rows={3} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="教材の出典や、写真・Webページをどう使うかなど" /></label>
      <p className="mc-hint">外部サイトの写真や記事を転載・埋め込む場合は、管理者が掲載条件を確認します。</p>
       <fieldset className="mc-stack" style={{border:'1px solid #dbeafe',borderRadius:12,padding:12,marginTop:12}}><legend>作成者プロフィール</legend>
         <label>表示する作成者名 <input value={form.authorProfile?.name||''} maxLength={60} onChange={e=>updateProfile('name',e.target.value)} placeholder="例：山田 花子"/></label>
         <label>学校・団体（任意） <input value={form.authorProfile?.school||''} maxLength={100} onChange={e=>updateProfile('school',e.target.value)}/></label>
         <label>地域・国（任意） <input value={form.authorProfile?.region||''} maxLength={80} onChange={e=>updateProfile('region',e.target.value)}/></label>
         <label>紹介文（任意） <textarea rows={2} maxLength={450} value={form.authorProfile?.bio||''} onChange={e=>updateProfile('bio',e.target.value)}/></label>
         <label><input type="checkbox" checked={form.authorProfile?.consent===true} onChange={e=>updateProfile('consent',e.target.checked)}/> 名前・プロフィールを本番サイトに公開することに同意します（管理者による公開確認が必要）</label>
         <small>共通PINでの作成者名は本人確認済みではありません。管理者が公開前に確認します。</small>
       </fieldset>
      {error && <p role="alert" className="mc-error">{error}</p>}
      {busy && saveStage && <p role="status" aria-live="polite" className="mc-save-progress">{saveStage}</p>}
      <div className="mc-actions"><button className="mc-outline" disabled={busy || demo} type="button" onClick={onSave}>{busy ? '保存中…' : isAdmin && form.id ? '変更を保存' : '下書きを保存'}</button><button className="mc-primary" disabled={busy || demo} type="button" onClick={onSubmit}>{busy ? '処理中…' : isAdmin ? '保存して合格' : '確認して提出する'}</button></div>
      {demo && <p className="mc-demo-note">デモ中：写真の変換やプレビューは可能ですが、サーバーへの保存・提出はできません。</p>}
    </section>
    <QuestionPreview form={form} photos={photos}/>
  </div>;
}

async function loadStoredPhotos(question,session,onPhoto,onProgress){
  const count=question.type==='photo4'?4:['photo1','photoText4'].includes(question.type)?1:0;
  if(!count)return;

  const media=Array.isArray(question.media)?question.media:[];
  const missing=new Map(media.map(p=>[Number(p.slot),p]));

  if(missing.size!==count ||
    Array.from({length:count},(_,i)=>i+1).some(slot=>!missing.has(slot)))
    throw Error('保存済み写真の登録情報が不足しています。');

  let batchError='';
  onProgress?.('写真'+count+'枚をまとめて読み込んでいます…');

  try{
    const result=await creatorRequest(
      'getMediaBatch',{questionId:question.id},session
    );
    if(!Array.isArray(result?.photos))
      throw Error('一括取得の応答が不正です');

    for(const photo of result.photos){
      const slot=Number(photo.slot);
      if(missing.has(slot) && typeof photo.base64==='string'
         && photo.base64.length>0){
        onPhoto(slot,{
          preview:'data:image/webp;base64,'+photo.base64,
          name:missing.get(slot).fileName
        });
        missing.delete(slot);
      }
    }
  }catch(err){
    batchError=err?.message||'一括取得失敗';
    if(['502','504','timeout','network','google_timeout','google_response','google_network'].includes(String(err?.code||''))||
       batchError.includes('Google連携に接続できません')){
      throw Error('Googleから写真を一時的に取得できません。元の写真は保存されています。');
    }
  }

  if(missing.size===0)return;

  onProgress?.('残り'+missing.size+'枚を並行して再取得しています…');

  const failures=await Promise.all(
    [...missing.entries()].map(async ([slot,item])=>{
      try{
        const result=await creatorRequest(
          'getMedia',{questionId:question.id,slot},session
        );
        if(!result?.base64)throw Error('空の画像データ');
        onPhoto(slot,{
          preview:'data:image/webp;base64,'+result.base64,
          name:item.fileName
        });
        return null;
      }catch(err){
        return '写真'+slot+'：'+(err?.message||'取得失敗');
      }
    })
  );

  const errors=failures.filter(Boolean);
  if(errors.length){
    throw Error(errors.join(' ／ ')+
      (batchError?'（一括取得：'+batchError+'）':''));
  }
}


function QuestionBank({
  questions, user, onEdit, onReview, onInspect,
  onPrefetch, onDelete, onRestore, onPublication, onEditPublished,
  selectedCountry, countryNames, busy, reviewingIds,
  filter, onFilterChange, search, onSearchChange,
  onBulkAction, bulkProgress, bulkReport
}) {

  const [authorFilter,setAuthorFilter]=useState('');
  const [typeFilter,setTypeFilter]=useState('');
  const [sortMode,setSortMode]=useState('latest');
  const [authorDetails,setAuthorDetails]=useState(null);
  const authors=[...new Set(questions.map(q=>q.authorName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ja'));
  const statusCounts=Object.fromEntries(Object.keys(statusJa).map(key=>[key,questions.filter(q=>q.status===key).length]));
  const visible=filterBankQuestions(questions,{filter,search,selectedCountry}).filter(q=>
     (!authorFilter||q.authorName===authorFilter)&&(!typeFilter||q.type===typeFilter))
    .sort((a,b)=>sortMode==='oldest'?String(a.updatedAt).localeCompare(String(b.updatedAt)):String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const [bulkMode, setBulkMode] = useState('approve');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const eligibleVisible = visible.slice(0, 200).filter(q => eligibleForBulk(q, bulkMode));
  const eligibleIds = eligibleVisible.slice(0, BULK_LIMIT).map(q => q.id);
  const checkedIds = eligibleIds.filter(id => selectedIds.has(id));
  const allChecked = eligibleIds.length > 0 && eligibleIds.every(id => selectedIds.has(id));
  useEffect(() => { setSelectedIds(new Set()); }, [filter, search]);
  useEffect(() => {
    setSelectedIds(previous => {
      const fresh = new Set([...previous].filter(id => eligibleVisible.some(q => q.id === id)));
      return fresh.size === previous.size ? previous : fresh;
    });
  }, [questions, bulkMode]);
  const toggleBulkSelection = (id, checked) => {
    setSelectedIds(previous => {
      const next = new Set(previous);
      if (checked) {
        if (next.size >= BULK_LIMIT) return previous;
        next.add(id);
      } else next.delete(id);
      return next;
    });
  };
  const submitBulk = async () => {
    const ok = await onBulkAction(bulkMode, checkedIds);
    if (ok) setSelectedIds(new Set());
  };

  return (
    <section className="mc-card mc-section">
      <div className="mc-section-top">
        <div>
          <div className="mc-eyebrow">MISSION BANK</div>
          <h2>集まった問題</h2>
        </div>
        <span className="mc-count">
          {formatNumber(visible.length)} 件
        </span>
      </div>

       {user?.role==='admin' && <div className="mc-filter-row" aria-label="状態ごとの問題件数" style={{gap:8,flexWrap:'wrap'}}>
         {Object.entries(statusCounts).map(([status,count])=><button key={status} type="button" className="mc-outline mc-small" onClick={()=>onFilterChange(status)}>{statusJa[status]}：{count}</button>)}
       </div>}
       <div className="mc-filter-row">
         <label className="mc-search">
          <Search size={18}/>
          <input
            placeholder="国・内容・作成者で検索"
            value={search}
            onChange={e => onSearchChange(e.target.value)}
          />
        </label>
        <select
          aria-label="問題の状態で絞り込み"
          value={filter}
          onChange={e => onFilterChange(e.target.value)}
        >
          <option value="all">すべての状態</option>
          {Object.entries(statusJa)
            .filter(([id]) =>
              user?.role === 'admin' || id !== 'deleted'
            )
            .map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
        </select>
      </div>

       <div className="mc-filter-row" style={{gap:8,flexWrap:'wrap'}}>
         <label>作成者<select aria-label="作成者で絞り込む" value={authorFilter} onChange={e=>setAuthorFilter(e.target.value)}><option value="">すべて</option>{authors.map(a=><option key={a} value={a}>{a}</option>)}</select></label>
         <label>形式<select aria-label="問題形式で絞り込む" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="">すべて</option>{TYPES.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
         <label>更新順<select aria-label="並び替え" value={sortMode} onChange={e=>setSortMode(e.target.value)}><option value="latest">新しい順</option><option value="oldest">古い順</option></select></label>
       </div>
       {user?.role === 'admin' && (
         <section className="mc-bulk-panel" aria-label="管理者の一括処理">
          <div className="mc-bulk-top">
            <div><strong>一括管理</strong><p>問題を確認して選択し、承認と公開は別々に実行します。</p></div>
            <label className="mc-bulk-mode-label">操作
              <select value={bulkMode} disabled={busy} onChange={event => {
                const mode = event.target.value;
                setBulkMode(mode);
                setSelectedIds(new Set());
                onFilterChange(mode === 'approve' ? 'draft' : 'approved');
              }}>
                <option value="approve">下書きを一括承認</option>
                <option value="publish">承認済みを一括公開（国・カテゴリー自動判定）</option>
              </select>
            </label>
          </div>
          <div className="mc-bulk-controls">
            <label className="mc-bulk-checkall">
              <input type="checkbox" checked={allChecked} disabled={busy || eligibleIds.length===0}
                onChange={event=>setSelectedIds(event.target.checked ? new Set(eligibleIds) : new Set())}/>
              表示中の対象を選択（最大{BULK_LIMIT}件）
            </label>
            <span className="mc-bulk-count">対象 {eligibleVisible.length}件・選択 {checkedIds.length}件</span>
            <button type="button" className="mc-primary mc-small" disabled={busy || checkedIds.length===0}
              onClick={submitBulk}>{bulkMode==='approve' ? '選択した下書きを一括承認' : '選択した承認済みを一括公開'}</button>
          </div>
          {bulkMode === 'publish' && <p className="mc-bulk-note">国・カテゴリーは問題に登録された情報から自動判定します。各国・各カテゴリー10問まで。写真・出典・公開権利を確認してから実行してください。</p>}
          {bulkProgress && <p className="mc-save-progress" role="status" aria-live="polite">{bulkProgress}</p>}
          {bulkReport && <div className="mc-bulk-result" role="status">
            <strong>{bulkReport.mode==='approve'?'一括承認':'一括公開'}：成功 {bulkReport.done.length}件 / 失敗 {bulkReport.failed.length}件</strong>
            {bulkReport.failed.length>0 && <>
              <p>失敗した問題は自動再送していません。一覧の最新状態を確認してください。</p>
              <ul>{bulkReport.failed.map(x=><li key={x.id}>{x.title || x.id}：{x.reason}</li>)}</ul>
            </>}
            {!bulkReport.refreshed && <p>一覧の再取得に失敗しました。画面を更新して結果を確認してください。</p>}
          </div>}
        </section>
      )}

      {visible.length === 0 ? (
        <p className="mc-empty">
          該当する問題はありません。
        </p>
      ) : (
        <div className="mc-bank-list">
          {visible.slice(0, 200).map(q => (
            <article className="mc-question-row" key={q.id}>
              {user?.role === 'admin' && eligibleForBulk(q, bulkMode) && (
                <label className="mc-bulk-item-select">
                  <input type="checkbox" checked={selectedIds.has(q.id)} disabled={busy}
                    onChange={event=>toggleBulkSelection(q.id,event.target.checked)}
                    aria-label={'一括' + (bulkMode==='approve'?'承認':'公開') + '対象：' + String(q.prompt||'').slice(0,60)}/>
                  <span>一括対象に選択</span>
                </label>
              )}
              <button
                type="button"
                className="mc-question-cover"
                aria-label={
                  '問題・写真を確認：' +
                  String(q.prompt || '問題文未入力').slice(0, 140)
                }
                onClick={() => onInspect(q)}
                onPointerEnter={() => onPrefetch(q)}
                onFocus={() => onPrefetch(q)}
              />

              <div className="mc-question-main">
                <div className="mc-question-meta">
                  <span className="mc-status">
                    {statusJa[q.status] || q.status}
                  </span>
                  <span className="mc-question-meta-location">
                    {countryNames[q.countryIso] || q.countryName}
                    {' · '}
                    {DOMAINS.find(d => d[0] === q.domain)?.[1] || q.domain}
                  </span>
                   <button type="button" className="mc-question-author" style={{position:'relative',zIndex:2}} onClick={()=>setAuthorDetails(q)} title="作成者情報を見る">作成：{q.authorName||'不明'} <span aria-hidden="true">ⓘ</span></button>
                </div>

                <h3>
                  {q.prompt || '（問題文未入力）'}
                </h3>

                <div className="mc-question-subline">
                  <small>
                    {TYPES.find(t => t[0] === q.type)?.[1] || '問題'}
                    {q.updatedAt
                      ? ' ・ 最終更新：' +
                        String(q.updatedAt).slice(0, 10)
                      : ''}
                  </small>
                  <span className="mc-question-view-hint">
                    <Search size={14}/>
                    クリックして詳細を見る
                    <ChevronRight size={15}/>
                  </span>
                </div>

                {q.reviewNote && (
                  <p className="mc-review-note">
                    管理者からのコメント：{q.reviewNote}
                  </p>
                )}
              </div>

              <div className="mc-question-actions">
                {user?.role === 'admin' ? (
                  q.status === 'deleted' ? (
                    <button type="button" className="mc-outline mc-small" disabled={busy} onClick={() => onRestore(q)}>復元</button>
                  ) : (
                    <>
                      {['draft','submitted','needs_revision'].includes(q.status) && (
                        <button type="button" className="mc-primary mc-small mc-quick-pass" disabled={busy || reviewingIds?.has(q.id)} onClick={() => onReview(q,'approved')}>
                          <CheckCircle2 size={16}/>{reviewingIds?.has(q.id) ? '処理中…' : '合格'}
                        </button>
                      )}
                      {q.status === 'approved' && <>
                        <span className="mc-passed-label"><CheckCircle2 size={16}/>合格済み</span>
                        <button type="button" className="mc-primary mc-small" disabled={busy || reviewingIds?.has(q.id)} onClick={() => onPublication(q,'publish')}>TimePaletteに公開</button>
                      </>}
                      {q.status === 'published' && <><button type="button" className="mc-outline mc-small" disabled={busy || reviewingIds?.has(q.id)} onClick={() => onEditPublished(q)}>編集（公開停止）</button><button type="button" className="mc-outline mc-small" disabled={busy || reviewingIds?.has(q.id)} onClick={() => onPublication(q,'unpublish')}>公開停止</button></>}
                      {!['published','needs_revision'].includes(q.status) && (
                        <button type="button" className="mc-outline mc-small" disabled={busy || reviewingIds?.has(q.id)} onClick={() => onReview(q,'needs_revision')}>修正依頼</button>
                      )}
                      {q.status !== 'published' && (
                        <details className="mc-bank-more">
                          <summary aria-label="その他の操作"><MoreHorizontal size={18}/>その他</summary>
                          <div className="mc-bank-more-menu">
                            <button type="button" disabled={busy || reviewingIds?.has(q.id)} onClick={() => onEdit(q)}><Pencil size={15}/>編集</button>
                            <button type="button" className="mc-delete-action" disabled={busy || reviewingIds?.has(q.id)} onClick={() => onDelete(q)}>削除</button>
                          </div>
                        </details>
                      )}
                    </>
                  )
                ) : (
                  user?.id === q.authorId && !['approved','published','deleted'].includes(q.status) && (
                    <button type="button" className="mc-outline mc-small" disabled={busy} onClick={() => onEdit(q)}><Pencil size={15}/>編集</button>
                  )
                )}
              </div>
            </article>
          ))}
        </div>
      )}

       {authorDetails&&<div className="mc-review-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setAuthorDetails(null)}}><section role="dialog" aria-modal="true" className="mc-review-dialog" aria-label="作成者の詳細" style={{maxWidth:500}}>
         <div className="mc-review-dialog-header"><h2>作成者プロフィール</h2><button className="mc-outline mc-small" type="button" onClick={()=>setAuthorDetails(null)}>閉じる</button></div>
         <div className="mc-review-dialog-body"><h3>{authorDetails.authorProfile?.name||authorDetails.authorName||'未登録'}</h3>
         <p>所属：{authorDetails.authorProfile?.school||'未登録'}</p><p>地域：{authorDetails.authorProfile?.region||'未登録'}</p>
         <p style={{whiteSpace:'pre-wrap'}}>{authorDetails.authorProfile?.bio||'紹介文は登録されていません。'}</p>
         <small>公開同意：{authorDetails.authorProfile?.consent?'あり':'未確認'}・本番公開確認：{authorDetails.authorProfileVerified?'済み':'未確認'}</small></div>
       </section></div>}
       {visible.length > 200 && (
         <p className="mc-hint">
          先頭200件まで表示しています。
          検索条件を絞ってください。
        </p>
      )}
    </section>
  );
}

// Administrators can review the actual stored images, correct answer, sources and notes
// before approving; the private images are loaded through the authenticated API.
function ReviewDialog({ question, photos, loading, loadingText, loadError, reviewError, busy, onClose, onReview, onEdit, onRetry, isAdmin, canEdit }) {
  useEffect(() => {
    const onEscape = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [onClose]);
  return <div className="mc-review-backdrop" onMouseDown={e => { if(e.target === e.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label="問題と写真の確認" className="mc-review-dialog">
      <div className="mc-review-dialog-header">
        <div><div className="mc-eyebrow">{isAdmin ? 'ADMIN REVIEW' : 'TEACHER VIEW'}</div><h2>{isAdmin ? '承認前の内容・出典確認' : 'みんなの問題・写真を確認'}</h2><p>{question.countryName} ・作成：{question.authorName} ・状態：{statusJa[question.status] || question.status}</p></div>
        <button className="mc-outline mc-small" type="button" onClick={onClose} aria-label="閉じる"><X size={17}/>閉じる</button>
      </div>
      {loading && <p role="status" aria-live="polite" className="mc-save-progress">{loadingText || '保存済みの写真を読み込んでいます…'}</p>}
      {loadError && <div role="alert" className="mc-error"><p>{loadError}</p><button type="button" className="mc-outline mc-small" disabled={loading} onClick={onRetry}>写真を再読み込み</button></div>}
      {reviewError && <p role="alert" className="mc-error">{reviewError}</p>}
      <div className="mc-review-dialog-body"><QuestionPreview form={question} photos={photos} /></div>
      <div className="mc-review-dialog-actions">
        {canEdit && <button className="mc-outline" type="button" disabled={busy} onClick={()=>{onClose();onEdit(question);}}><Pencil size={16}/>編集画面を開く</button>}
        {isAdmin && <>
          {!['published','needs_revision','deleted'].includes(question.status) && <button className="mc-outline" type="button" disabled={busy} onClick={()=>onReview(question,'needs_revision')}>修正依頼</button>}
          {['draft','submitted','needs_revision'].includes(question.status) && <button className="mc-primary" type="button" disabled={busy} onClick={()=>onReview(question,'approved')}><CheckCircle2 size={16}/>合格</button>}
        </>}
      </div>
    </section>
  </div>;
}

function Dashboard({ countries, selectedCountry, setSelectedCountry, questions, progress, user, onSetProgress, busy }) {
  const [filter, setFilter] = useState('');
  const totals = useMemo(() => {
    const out = {};
    for (const q of questions) {
      const key = `${q.countryIso}:${q.domain}`;
      out[key] ||= { submitted: 0, approved: 0 };
      if (!['draft','deleted'].includes(q.status)) out[key].submitted += 1;
      if (['approved', 'published'].includes(q.status)) out[key].approved += 1;
    }
    return out;
  }, [questions]);
  const getValue = (iso, domain) => Math.min(TARGET, Math.max(Number(progress[`${iso}:${domain}`] || 0), totals[`${iso}:${domain}`]?.approved || 0));
  const overall = countries.reduce((a, c) => a + DOMAINS.reduce((b, [d]) => b + getValue(c.iso, d), 0), 0);
  const country = countries.find(c => c.iso === selectedCountry);
  return <div className="mc-stack"><div className="mc-summary-grid"><div className="mc-stat"><span>対象国</span><strong>{countries.length}</strong><small>国・地域の登録数</small></div><div className="mc-stat"><span>制作目標</span><strong>{formatNumber(countries.length * 60)}</strong><small>6カテゴリー × 10問</small></div><div className="mc-stat"><span>完成として登録</span><strong>{formatNumber(overall)}</strong><small>承認・管理者の完成登録</small></div><div className="mc-stat"><span>提出済み</span><strong>{formatNumber(questions.filter(q => !['draft','deleted'].includes(q.status)).length)}</strong><small>下書きを除く投稿数</small></div></div>
    <section className="mc-card mc-section"><div className="mc-section-top"><div><div className="mc-eyebrow">COUNTRY PROGRESS</div><h2>国ごとの制作状況</h2></div><Globe2 size={24}/></div>
      <div className="mc-filter-row"><label className="mc-search"><Search size={18}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="国を検索"/></label><CountryPicker countries={countries} value={selectedCountry} onChange={setSelectedCountry} label="制作進捗を表示する国" /></div>
      {country && <div className="mc-progress-grid">{DOMAINS.map(([domain,label])=>{const key=`${country.iso}:${domain}`;const value=getValue(country.iso,domain);const count=totals[key] || { submitted: 0, approved: 0 };return <article className="mc-progress-card" key={domain}><span>{label}</span><strong>{value}<small>/10</small></strong><ProgressBadge value={value}/><small>提出 {count.submitted} ／ 承認 {count.approved}</small>{user?.role==='admin' && ['place','time'].includes(domain) && <div className="mc-manual-progress"><label>自作分の完成数</label><input type="number" min="0" max="10" defaultValue={Number(progress[key]||0)} key={`${key}-${progress[key]}`} id={`progress-${domain}`} /><button disabled={busy} className="mc-outline mc-small" onClick={()=>onSetProgress(country.iso,domain,document.getElementById(`progress-${domain}`).value)}>登録</button></div>}</article>})}</div>}
      <h3 className="mc-subheading">ほかの国の一覧</h3><div className="mc-country-list">{countries.filter(c=>c.name.includes(filter) || c.iso.includes(filter.toLowerCase())).map(c=><button key={c.iso} type="button" className={c.iso===selectedCountry?'mc-country selected':'mc-country'} onClick={()=>{setSelectedCountry(c.iso);window.scrollTo({top:0,behavior:'smooth'});}}><span className="mc-country-grid-name"><CountryFlag country={c}/><span>{c.name}</span></span><span>{DOMAINS.reduce((sum,[d])=>sum+getValue(c.iso,d),0)}/60</span></button>)}</div>
    </section>
  </div>;
}

export default function MissionCreator() {
  const countries = useCountries();
  const countryNames = useMemo(()=>Object.fromEntries(countries.map(c=>[c.iso,c.name])),[countries]);
  const [session, setSession] = useState(()=>sessionStorage.getItem('tp-mc-session') || '');
  const [registrationToken, setRegistrationToken] = useState(()=>{
    const t=new URLSearchParams(window.location.search).get('enroll');
    if(t && /^[a-f0-9]{64}$/i.test(t)){
      const url=new URL(window.location.href);url.searchParams.delete('enroll');
      window.history.replaceState({},'',url.pathname+url.search+url.hash);
      return t;
    }
    return '';
  });
  const [cloudflare, setCloudflare] = useState(null);
  useEffect(()=>{let cancelled=false;fetch('/api/mission-backend',{cache:'no-store'})
    .then(r=>r.json()).then(d=>{if(!cancelled)setCloudflare(d.backend==='cloudflare');})
    .catch(()=>{if(!cancelled)setCloudflare(false);});return()=>{cancelled=true;};},[]);
  const [user, setUser] = useState(null);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(Boolean(session));
  const [saveStage, setSaveStage] = useState('');
  const [photoLoadBusy,setPhotoLoadBusy] = useState(false);
  const [photoLoadError,setPhotoLoadError] = useState('');
  const editTokenRef=useRef(0);
  const [page, setPage] = useState('dashboard');
  // null = role-dependent default; admins start with drafts.
  const [bankFilter, setBankFilter] = useState(null);
  const [bankSearch, setBankSearch] = useState('');
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState('');
  const [bulkReport, setBulkReport] = useState(null);
  const previousPageRef = useRef('dashboard');
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState({});
  const [selectedCountry, setSelectedCountry] = useState(countries[0]?.iso || 'rw');
  const [form, setForm] = useState(EMPTY);
  const [photos, setPhotos] = useState({});
  const [inspection, setInspection] = useState(null);
  const [inspectionPhotos, setInspectionPhotos] = useState({});
  const [inspectionLoading, setInspectionLoading] = useState(false);
  const [inspectionError, setInspectionError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewingIds, setReviewingIds] = useState(new Set());
  const reviewingRef=useRef(new Set());
  const [inspectionLoadingText, setInspectionLoadingText] = useState('');
  const initialBootstrapRef=useRef(null);
  const photoCacheRef=useRef(new Map());
  const photoPendingRef=useRef(new Map());
  const photoCacheEpochRef=useRef(0);

  // Return to the first remaining item after leaving the editor.
  useEffect(() => {
    const previous = previousPageRef.current;
    previousPageRef.current = page;
    if (previous !== 'editor' || page !== 'bank') return;
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [page]);

  useEffect(()=>{
    photoCacheEpochRef.current+=1;
    photoCacheRef.current.clear();
    photoPendingRef.current.clear();
  },[session]);

  const loadPhotosFast=useCallback(async(q,onPhoto=()=>{},onProgress)=>{
    // Image timestamps (not review status) determine cache invalidation.
    const stamp=q.media?.length
      ? q.media.map(m=>String(m.slot)+':'+String(m.createdAt||q.updatedAt||'')).join('|')
      : String(q.updatedAt||'');
    const key=q.id+':'+stamp;
    const saved=photoCacheRef.current.get(key);

    if(saved){
      for(const [slot,item] of Object.entries(saved))
        onPhoto(Number(slot),item);
      return;
    }

    const existing=photoPendingRef.current.get(key);
    if(existing){
      onProgress?.('先読みした写真を表示しています…');
      const items=await existing;
      for(const [slot,item] of Object.entries(items))
        onPhoto(Number(slot),item);
      return;
    }

    const epoch=photoCacheEpochRef.current;
    const collected={};

    const task=loadStoredPhotos(q,session,(slot,item)=>{
      collected[slot]=item;
      onPhoto(Number(slot),item);
    },onProgress).then(()=>{
      if(photoCacheEpochRef.current===epoch){
        photoCacheRef.current.set(key,collected);
        while(photoCacheRef.current.size>8){
          photoCacheRef.current.delete(
            photoCacheRef.current.keys().next().value
          );
        }
      }
      return collected;
    });

    photoPendingRef.current.set(key,task);

    try{
      await task;
    }finally{
      if(photoPendingRef.current.get(key)===task)
        photoPendingRef.current.delete(key);
    }
  },[session]);

  const prefetchPhotos=useCallback((q)=>{
    if(!session||!user||loadingData||
       q.status==='deleted'||!q.media?.length)return;
    loadPhotosFast(q).catch(()=>{});
  },[session,user,loadingData,loadPhotosFast]);

  useEffect(()=>{
    if(!session||!user||loadingData||page!=='bank')return;

    let disposed=false;
    const currentFilter = bankFilter ??
      (user?.role === 'admin' ? 'draft' : 'all');
    const candidates = filterBankQuestions(questions, {
      filter: currentFilter,
      search: bankSearch
    }).filter(q=>q.media?.length).slice(0,2);

    const timer=setTimeout(()=>{
      if(disposed)return;
      // Prefetch two nearby photo questions concurrently, never blocking UI.
      candidates.forEach(q=>{loadPhotosFast(q).catch(()=>{});});
    },450);

    return ()=>{
      disposed=true;
      clearTimeout(timer);
    };
  },[session,user,loadingData,page,questions,loadPhotosFast,bankFilter,bankSearch]);

  useEffect(()=>{
    if (!session) { setLoadingData(false); return; }
    const ready=initialBootstrapRef.current;
    if(ready && ready.session===session){
      initialBootstrapRef.current=null;
      setUser(ready.data.user);
      setQuestions(ready.data.questions);
      setProgress(ready.data.progress);
      setLoadingData(false);
      return;
    }
    let cancelled=false;
    setLoadingData(true);
    creatorRequest('bootstrap', {}, session).then(data=>{
      if(cancelled)return;
      setUser(data.user);setQuestions(data.questions);setProgress(data.progress);
    }).catch((err)=>{
      if(cancelled)return;
      // Never keep a half-initialized session after a bootstrap failure.
      setError(err?.message || '問題一覧を読み込めませんでした。もう一度ログインしてください。');
      sessionStorage.removeItem('tp-mc-session');setSession('');setUser(null);
    }).finally(()=>{if(!cancelled)setLoadingData(false);});
    return ()=>{cancelled=true;};
  },[session]);
  const act=async(action,payload={})=>{
    setBusy(true);setError('');
    try{return await creatorRequest(action,payload,session);}catch(e){setError(e.message);throw e;}finally{setBusy(false);}
  };
  const login=async({adminMode,pin,account,password})=>{setBusy(true);setError('');try{
    const teacherToken = adminMode ? '' : (localStorage.getItem('tp-mc-teacher-token') || '');
    const data=await creatorRequest('login',cloudflare?{pin,withBootstrap:true}:{pin,adminMode,teacherToken,withBootstrap:true});
    if(data.needsName){setRegistrationToken(data.registrationToken);return;}
    sessionStorage.setItem('tp-mc-session',data.session);if(data.user)setUser(data.user);if(data.bootstrap)initialBootstrapRef.current={session:data.session,data:data.bootstrap};setSession(data.session);setRegistrationToken('');
  }catch(e){setError(e.message);}finally{setBusy(false);}};
  const register=async(token,name)=>{setBusy(true);setError('');try{
    const data=await creatorRequest('registerTeacher',cloudflare?{registrationToken:token,password:name,withBootstrap:true}:{registrationToken:token,displayName:name,withBootstrap:true});
    if(data.teacherToken)localStorage.setItem('tp-mc-teacher-token',data.teacherToken);
    sessionStorage.setItem('tp-mc-session',data.session);if(data.user)setUser(data.user);if(data.bootstrap)initialBootstrapRef.current={session:data.session,data:data.bootstrap};setSession(data.session);setRegistrationToken('');
  }catch(e){setError(e.message);}finally{setBusy(false);}};
  const reload=async()=>{if(demo)return;const data=await creatorRequest('bootstrap',{},session);setUser(data.user);setQuestions(data.questions);setProgress(data.progress);};
  const logout=()=>{if(cloudflare&&session)void creatorRequest('logout',{},session).catch(()=>{});setBankFilter(null);setBankSearch('');initialBootstrapRef.current=null;photoCacheEpochRef.current+=1;photoCacheRef.current.clear();photoPendingRef.current.clear();sessionStorage.removeItem('tp-mc-session');setUser(null);setSession('');setDemo(false);setPhotos({});setError('');};
  const startNew=()=>{editTokenRef.current+=1;setPhotoLoadBusy(false);setPhotoLoadError('');setForm({...EMPTY,countryIso:selectedCountry,countryName:countryNames[selectedCountry],countries});setPhotos({});setError('');setPage('editor');};
  const loadEditorPhotoPreview=(q,token)=>{
    if(demo||!Array.isArray(q.media)||!q.media.length){setPhotoLoadBusy(false);return;}
    setPhotoLoadBusy(true);
    setPhotoLoadError('');
    void loadPhotosFast(q,(slot,item)=>{
      if(editTokenRef.current!==token)return;
      setPhotos(old=>old[slot]?.blob ? old : {...old,[slot]:item});
    }).catch(()=>{
      if(editTokenRef.current===token)setPhotoLoadError('preview_unavailable');
    }).finally(()=>{
      if(editTokenRef.current===token)setPhotoLoadBusy(false);
    });
  };
  const startEdit=(q)=>{
    const token=++editTokenRef.current;
    setError('');
    setPhotoLoadError('');
    setForm({...EMPTY,...q,countries,
      choices:Array.isArray(q.choices)?[...q.choices,'','',''].slice(0,3):['','',''],
      sources:Array.isArray(q.sources)?[...q.sources,'',''].slice(0,2):['','']});
    setPhotos({});
    setPage('editor');
    loadEditorPhotoPreview(q,token);
  };
  const retryEditorPhotos=()=>{
    const token=++editTokenRef.current;
    loadEditorPhotoPreview(form,token);
  };
  const pickPhoto=async(slot,file)=>{try{const next=await optimizeImage(file);setPhotos(old=>{if(old[slot]?.preview?.startsWith('blob:'))URL.revokeObjectURL(old[slot].preview);return {...old,[slot]:{...next,preview:next.previewUrl,name:`${file.name} → WebP (${Math.round(next.blob.size/1024)}KB)`}};});setError('');}catch(e){setError(e.message);}};
  const persist=async(submit)=>{
    if(demo||busy)return;
    if(!form.countryIso || !form.prompt.trim()){setError('国と問題文を入力してください。');return;}
    setBusy(true);setError('');setSaveStage('問題文を保存しています…');
    const country=countries.find(c=>c.iso===form.countryIso);
    try{
      const total=form.type==='photo4'?4:['photo1','photoText4'].includes(form.type)?1:0;
      const pendingSlots=Array.from({length:total},(_,index)=>index+1).filter(slot=>Boolean(photos[slot]?.blob));
      const instantFinalize=submit && pendingSlots.length===0;
      const finalize=instantFinalize?(user?.role==='admin'?'approved':'submitted'):undefined;
      const result=await creatorRequest('saveQuestion',{question:{...form,countryName:country?.name||form.countryName,choices:form.choices,sources:form.sources,countries:undefined},...(finalize?{finalize}:{})},session);
      const savedId=result.question.id;
      // Keep the server ID if a later image upload fails, so retry does not duplicate the question.
      setForm(prev => ({ ...prev, id: savedId }));
      for(let index=0;index<pendingSlots.length;index++){
        const slot=pendingSlots[index];
        setSaveStage(`写真 ${index+1}/${pendingSlots.length} を保存しています…`);
        await creatorRequest('uploadImage',{questionId:savedId,slot,base64:await blobToBase64(photos[slot].blob)},session);
        // A successful photo is already on Drive. Do not upload it again if a later step fails.
        setPhotos(prev => prev[slot]?.blob===photos[slot].blob
          ? {...prev,[slot]:{...prev[slot],blob:undefined}}
          : prev);
      }
      if(submit&&!instantFinalize){
        setSaveStage(user?.role==='admin'?'保存した写真を確認して合格にしています…':'提出処理を完了しています…');
        if(user?.role==='admin'){
          // Approved questions remain approved after an admin photo replacement.
          if(form.status!=='approved')
            await creatorRequest('reviewQuestion',{questionId:savedId,status:'approved'},session);
        }else{
          await creatorRequest('submitQuestion',{questionId:savedId},session);
        }
      }
      if(pendingSlots.length===0){
        const updated={...result.question,media:Array.isArray(form.media)?form.media:[]};
        setQuestions(prev=>{
          const exists=prev.some(item=>item.id===savedId);
          return exists?prev.map(item=>item.id===savedId?updated:item):[updated,...prev];
        });
      }else{
        setSaveStage('新しい写真情報を反映しています…');
        await reload();
      }
      editTokenRef.current+=1;
      setPage('bank');if(form.status==='approved')setBankFilter('approved');setPhotos({});setError('');
    }catch(e){
      setError(`${e.message} 保存済みの問題や写真が残っている可能性があります。「みんなの問題」の状態を確認してから再試行してください。`);
    }finally{setBusy(false);setSaveStage('');}
  };
  const inspect=async(q)=>{
    if(!user || (user.role!=='admin' &&
       q.authorId!==user.id && q.status==='draft'))return;
    setInspection(q);
    setInspectionPhotos({});
    setInspectionError('');
    setReviewError('');
    setInspectionLoadingText('');
    if(demo)return;
    setInspectionLoading(true);
    try {
      await loadPhotosFast(q,
        (slot,item)=>setInspectionPhotos(old=>({...old,[slot]:item})),
        setInspectionLoadingText);
    } catch(e) {
      setInspectionError('写真の読み込みに失敗しました：'
        +e.message+'。元の写真は上書きされていません。');
    } finally {
      setInspectionLoading(false);
      setInspectionLoadingText('');
    }
  };
  const review=async(q,status)=>{
    if(demo || busy || reviewingRef.current.has(q.id))return false;
    let reviewNote='';
    if(status==='needs_revision'){
      const note=window.prompt('修正してほしい内容を入力してください（キャンセルで中止）',q.reviewNote||'');
      if(note===null)return false;
      reviewNote=note.trim();
      if(!reviewNote){window.alert('修正内容を入力してください。');return false;}
    }
    reviewingRef.current.add(q.id);
    setReviewingIds(new Set(reviewingRef.current));
    setReviewError('');
    setError('');
    try{
      const result=await creatorRequest('reviewQuestion',{questionId:q.id,status,reviewNote},session);
      const updated={status:result.status,updatedAt:result.updatedAt,reviewNote:result.reviewNote};
      setQuestions(prev=>prev.map(item=>item.id===q.id?{...item,...updated}:item));
      setInspection(prev=>prev?.id===q.id?{...prev,...updated}:prev);
      return true;
    }catch(e){
      const message=e?.message||'更新に失敗しました。';
      setError(message);
      if(inspection?.id===q.id)setReviewError('合格・修正依頼の処理に失敗しました：'+message);
      return false;
    }finally{
      reviewingRef.current.delete(q.id);
      setReviewingIds(new Set(reviewingRef.current));
    }
  };
  const publication=async(q,mode)=>{
    if(user?.role!=='admin'||busy||demo)return false;
    if(mode==='publish'){
      if(!window.confirm('写真・出典・内容・公開権利を確認済みですか？\nTimePalette本体に公開します。'))return false;
    }else if(!window.confirm('この問題をTimePaletteから公開停止しますか？'))return false;
    setBusy(true);setError('');
    try{
       let profileRightsConfirmed=false;
       if(mode==='publish' && q.authorProfile?.consent && q.authorProfile?.name){
         profileRightsConfirmed=window.confirm('作成者本人の同意と、名前・学校・紹介文の公開権利を確認しましたか？\nキャンセルの場合はプロフィールを公開せずに問題のみ公開します。');
       }
       const result=await creatorRequest('setPublication',{
         questionId:q.id,mode,rightsConfirmed:mode==='publish',profileRightsConfirmed,countryIso:q.countryIso,domain:q.domain
      },session);
      setQuestions(previous=>previous.map(item=>item.id===q.id?
        {...item,status:result.status,updatedAt:result.updatedAt}:item));
      setInspection(previous=>previous?.id===q.id?
        {...previous,status:result.status}:previous);
      if(result.r2MediaStatus==='pending')window.alert('問題は公開済みです。写真の高速配信への同期が未完了です。公開ミッション管理の「画像を再同期」を実行できます。');
      return true;
    }catch(e){setError(e?.message||'公開処理に失敗しました。');return false;}
    finally{setBusy(false);}
  };
  const bulkAction=async(mode,ids)=>{
    if(user?.role!=='admin'||busy||bulkRunning||demo)return false;
    let plan;
    try { plan=createBulkPlan(mode,ids,questions,user.role); }
    catch(e){ setError(e?.message||'一括処理を開始できませんでした。'); return false; }
    const label=mode==='approve'?'一括承認':'一括公開';
    const message=mode==='approve'
      ? '選択した' + plan.items.length + '件の下書きを承認済みにします。個々の問題内容と写真を確認済みですか？\n公開はまだ行いません。'
      : '選択した' + plan.items.length + '件をTimePaletteに公開します。\n全件の写真・出典・解答・公開利用権を確認済みですか？';
    if(!window.confirm(message))return false;
    setBusy(true);setBulkRunning(true);setBulkReport(null);setBulkProgress('');setError('');
    try{
      const result=await executeBulkPlan(plan,
        (action,payload)=>creatorRequest(action,payload,session),
        info=>setBulkProgress('' + label + '：' + info.current + '/' + info.total + ' 件 ' + (info.stage==='running'?'処理中':'完了') + ' ・ ' + info.title));
      let refreshed=true;
      try{await reload();}
      catch(_){refreshed=false;setError('処理結果の一覧を再取得できませんでした。画面を更新して状態を確認してください。');}
      setBulkReport({...result,refreshed});
      return true;
    }catch(e){setError(e?.message||label+'に失敗しました。');return false;}
    finally{setBusy(false);setBulkRunning(false);setBulkProgress('');}
  };
  const archiveQuestion=async(q)=>{
    if(user?.role!=='admin'||busy)return;
    if(!window.confirm('この問題を削除済みに移動しますか？\n\n'+q.countryName+'：'+String(q.prompt||'').slice(0,90)+'\n\n写真は残り、復元できます。'))return;
    try{await act('deleteQuestion',{questionId:q.id});await reload();}
    catch{/* error displayed by act */}
  };
  const restoreQuestion=async(q)=>{
    if(user?.role!=='admin'||busy)return;
    if(!window.confirm('この問題を提出済みとして復元しますか？'))return;
    try{await act('restoreQuestion',{questionId:q.id});await reload();}
    catch{/* error displayed by act */}
  };
  const setManual=async(countryIso,domain,count)=>{try{await act('setProgress',{countryIso,domain,manualDone:Number(count)});await reload();}catch{/* shown */}};
  const active=demo||user;
  return <div className="mc-root">
    {!active ? (session ? <div className="mc-access-wrap"><div role="status" className="mc-card mc-access">前回のログインを確認しています…</div></div> : <Access cloudflare={cloudflare} onLogin={login} onRegister={register} registrationToken={cloudflare?'':registrationToken} onBack={()=>{setRegistrationToken('');setError('');}} busy={busy} error={error}/>) : <>
      <header className="mc-header"><div className="mc-header-brand"><Compass size={24}/> <strong>TimePalette</strong><span>MISSION CREATOR</span></div><div className="mc-header-user"><span>{demo?'デモ（保存不可）':`${user.name} ／ ${user.role==='admin'?'管理者':'参加教師'}`}</span><button type="button" className="mc-quiet" onClick={logout}><LogOut size={17}/>終了</button></div></header>
      <div className="mc-app"><aside className="mc-sidebar"><nav>
        {[['dashboard',LayoutDashboard,'制作進捗'],['bank',BookOpen,'みんなの問題'],['publication',ShieldCheck,'公開ミッション管理'],['factory',UploadCloud,'AI 5問一括登録'],['editor',FilePlus2,'問題を作る']].filter(([id])=>id!=='publication'||user?.role==='admin').map(([id,Icon,label])=><button key={id} className={page===id?'active':''} type="button" onClick={()=>id==='editor'?startNew(): (setPage(id),setError(''))}><Icon size={18}/>{label}</button>)}
        {user?.role==='admin' && <div className="mc-admin-hint"><ShieldCheck size={17}/>問題一覧で問題の編集・承認・削除・復元ができます。</div>}
      </nav><p>{cloudflare?'Cloudflare D1 ＋ R2':'Google Sheets ＋ Drive'} 連携<br/>Chrome / Edge 推奨</p></aside><main className="mc-main">
        {demo && <div className="mc-demo-banner"><CircleHelp size={18}/>これは操作確認用の画面です。写真のWebP変換とプレビューを試せますが、保存・承認はできません。</div>}
        <div className="mc-main-heading"><div><div className="mc-eyebrow">GLOBAL COLLABORATION</div><h1>{page==='dashboard'?'制作進捗':page==='bank'?'みんなの問題':page==='publication'?'公開ミッション管理':page==='factory'?'AI 5問一括登録':'問題を作る'}</h1><p>197か国 × 6カテゴリー × 各10問を、世界の先生たちと作る。</p></div>{page!=='editor'&&<button className="mc-primary" type="button" onClick={startNew}><FilePlus2 size={18}/>新しく作成</button>}</div>
        {error && page!=='editor' && <p role="alert" className="mc-error">{error}</p>}
        {loadingData && <div role="status" aria-live="polite" className="mc-save-progress">ログインしました。問題一覧・写真情報・進捗を読み込んでいます…</div>}
        {!loadingData && page==='factory'&&<MissionFactoryImport session={session} questions={questions} user={user} demo={demo} onDone={reload}/>}
        {!loadingData && page==='dashboard'&&<><Dashboard countries={countries} selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry} questions={questions} progress={progress} user={user} onSetProgress={setManual} busy={busy||demo}/></>}
        {!loadingData && page==='publication' && user?.role==='admin' &&
          <PublishedMissionManager cloudflare={cloudflare} countries={countries} questions={questions} session={session}
            busy={busy||demo} onPublication={publication} onInspect={inspect}
            onEditPublished={async q=>{const ok=await publication(q,'unpublish');if(ok)startEdit({...q,status:'approved'});}}/>}
        {!loadingData && page==='bank'&&<QuestionBank questions={questions} user={user} onEdit={startEdit} onReview={review} onInspect={inspect} onPrefetch={prefetchPhotos} onDelete={archiveQuestion} onRestore={restoreQuestion} onPublication={publication} onBulkAction={bulkAction} bulkProgress={bulkProgress} bulkReport={bulkReport} selectedCountry="" countryNames={countryNames} busy={busy||demo||bulkRunning} reviewingIds={reviewingIds}
          onEditPublished={async q=>{const ok=await publication(q,'unpublish');if(ok)startEdit({...q,status:'approved'});}}
          filter={bankFilter ?? (user?.role === 'admin' ? 'draft' : 'all')}
          onFilterChange={setBankFilter}
          search={bankSearch}
          onSearchChange={setBankSearch}/>}
        {!loadingData && page==='editor'&&<Editor form={form} setForm={setForm} photos={photos} onPhoto={pickPhoto} onSave={()=>persist(false)} onSubmit={()=>persist(true)} onCancel={()=>{editTokenRef.current+=1;setPage('bank');}} busy={busy} demo={demo} error={error} saveStage={saveStage} isAdmin={user?.role==='admin'} photoLoadBusy={photoLoadBusy} photoLoadError={photoLoadError} onRetryPhotos={retryEditorPhotos}/>}
      </main></div>
      {inspection && <ReviewDialog question={inspection} photos={inspectionPhotos} loading={inspectionLoading} loadingText={inspectionLoadingText} loadError={inspectionError} reviewError={reviewError} busy={busy || reviewingIds.has(inspection.id)} onClose={()=>setInspection(null)} onEdit={startEdit} onRetry={()=>inspect(inspection)} isAdmin={user?.role==='admin'} canEdit={user?.role==='admin'||user?.id===inspection.authorId} onReview={async(q,status)=>{const done=await review(q,status);if(done)setInspection(null);}}/>}
    </>}
  </div>;
}
