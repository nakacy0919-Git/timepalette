import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Camera, CheckCircle2, CircleHelp, Clock3, Compass, FilePlus2, Globe2, LayoutDashboard, LockKeyhole, LogOut, Pencil, Search, ShieldCheck, UploadCloud, ChevronDown, ChevronRight, MoreHorizontal, ExternalLink, X } from 'lucide-react';
import { getWorldLearningCountries } from '../utils/worldLearningRegistry';
import { creatorRequest } from './api';
import { blobToBase64, optimizeImage } from './image';

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
  ['free', '自由回答・話し合い'],
  ['web', 'Webサイトなどの資料を利用'],
];
const TARGET = 10;
const EMPTY = {
  id: '', countryIso: '', countryName: '', domain: 'language', type: 'text4',
  prompt: '', answer: '', choices: ['', '', ''], sources: ['', ''], notes: '',
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

function Access({ onLogin, onRegister, busy, error, registrationToken, onBack }) {
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [adminMode, setAdminMode] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    if (registrationToken) onRegister(registrationToken, name.trim());
    else onLogin({ pin, adminMode });
  };
  return (
    <main className="mc-access-wrap">
      <div className="mc-access mc-card">
        <div className="mc-logo"><Compass size={24} /><span>TimePalette</span></div>
        <div className="mc-eyebrow">TEACHER WORKSPACE</div>
        <h1>世界のミッションを、一緒に作ろう。</h1>
        <p>国を選んで問題を作成。写真は自動でWebPに変換し、プレビューして提出できます。</p>
        <form onSubmit={submit} className="mc-stack">
          {registrationToken ? <>
            <p>初回の登録です。問題の作成者として表示する名前を入力してください。</p>
            <label>お名前（初回のみ） <input autoFocus value={name} maxLength={60} onChange={e => setName(e.target.value)} placeholder="例：中西先生" required autoComplete="name" /></label>
          </> : <>
            <label>{adminMode ? '管理者PIN（4桁）' : '先生用共通パスコード（4桁）'} <input value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4桁を入力" inputMode="numeric" type="password" minLength={4} maxLength={4} required autoComplete="off" /></label>
          </>}
          <button className="mc-primary" type="submit" disabled={busy || (registrationToken ? !name.trim() : pin.length !== 4)}>{busy ? '確認中…' : registrationToken ? '問題作成を始める' : 'ログインする'}</button>
        </form>
        {error && <p role="alert" className="mc-error">{error}</p>}
        {registrationToken ? <button type="button" className="mc-text-btn" onClick={onBack}>ログインに戻る</button> : <>

          <button className="mc-text-btn" type="button" onClick={() => { setAdminMode(v => !v); setPin(''); }}>{adminMode ? '先生用のログインに戻る' : '管理者ログインはこちら'}</button>
        </>}
        <p className="mc-hint"><LockKeyhole size={14}/>先生用のパスコードは関係者にのみお伝えください。管理者の承認は別のログインが必要です。</p>
      </div>
    </main>
  );
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
  const photoMode = form.type === 'photo1' || form.type === 'photo4';
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
      {form.type === 'text4' && <div className="mc-choice-grid">{[form.answer, ...form.choices].map((c, i) =>
        <div key={i} className={showTeacherDetails && i === 0 ? 'mc-answer-correct' : ''}>{showTeacherDetails && i===0 && <CheckCircle2 size={15} aria-label="正答" />} {String.fromCharCode(65 + i)}. {c || '（未入力）'}</div>)}</div>}
      {form.type === 'web' && <p className="mc-hint">Webを使う問題は参考URLを保存します。外部ページの埋め込みには掲載元の許可が必要です。</p>}
      {showTeacherDetails && <ReferencePanel form={form} />}
    </section>
  );
}

function Editor({ form, setForm, photos, onPhoto, onSave, onSubmit, onCancel, busy, demo, error, saveStage, isAdmin, photoLoadBusy, photoLoadError, onRetryPhotos }) {
  const update = (k, value) => setForm(prev => ({ ...prev, [k]: value }));
  const photoCount = form.type === 'photo4' ? 4 : form.type === 'photo1' ? 1 : 0;
  return <div className="mc-editor-grid">
    <section className="mc-card mc-section">
      <div className="mc-section-top"><div><div className="mc-eyebrow">MISSION EDITOR</div><h2>{form.id ? '問題を編集' : '新しい問題を作る'}</h2></div><button className="mc-quiet" onClick={onCancel} type="button"><ArrowLeft size={17} />一覧へ</button></div>
      <div className="mc-fields-row"><div className="mc-country-field"><span>国</span><CountryPicker countries={form.countries || []} value={form.countryIso} onChange={iso => update('countryIso', iso)} label="問題を作成する国" /></div><label>カテゴリー <select value={form.domain} onChange={e => update('domain', e.target.value)}>{DOMAINS.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label></div>
      <label>問題の形式 <select value={form.type} onChange={e => update('type', e.target.value)}>{TYPES.map(([id, text]) => <option key={id} value={id}>{text}</option>)}</select></label>
      <label>問題文・活動の指示 <textarea rows={4} value={form.prompt} maxLength={2000} onChange={e => update('prompt', e.target.value)} placeholder="例：写真を見て、ネパールで人気の料理を選んでください。" /></label>
      {photoCount > 0 && <div className="mc-stack">
        {Boolean(form.id) && <div className="mc-existing-media-status" role="status">
          <span>既存の写真はGoogle Driveに保存済みです。{photoLoadBusy ? 'プレビューを読み込んでいます…' : photoLoadError ? 'プレビューだけを取得できませんでした。画像は保持されています。' : ''}</span>
          {photoLoadError && <button type="button" className="mc-outline mc-small" onClick={onRetryPhotos} disabled={photoLoadBusy}>写真表示を再試行</button>}
        </div>}
        <div className="mc-helper-title"><UploadCloud size={18}/> 写真をアップロード</div><p className="mc-muted">写真はこの端末内でWebPに変換されます。4択では①が正答、②〜④が誤答です。ゲーム公開時の表示順は変更できます。</p><div className="mc-upload-grid">{Array.from({ length: photoCount }, (_, i) => i + 1).map(n => <PhotoSlot key={n} slot={n} name={photos[n]?.name || form.media?.find(m=>Number(m.slot)===n)?.fileName} preview={photos[n]?.preview} onPick={onPhoto} busy={busy} isCorrect={form.type==='photo4' && n===1} singlePhoto={form.type==='photo1'}/>)}</div></div>}
      {form.type === 'text4' && <div className="mc-stack"><label>正しい答え <input value={form.answer} onChange={e => update('answer', e.target.value)} placeholder="正解の選択肢" /></label>{form.choices.map((v, i) => <label key={i}>まちがいの選択肢 {i + 1} <input value={v} onChange={e => update('choices', form.choices.map((c, j) => i === j ? e.target.value : c))}/></label>)}</div>}
      {!['text4', 'photo4'].includes(form.type) && <label>模範解答・参考となる回答（任意） <textarea rows={2} value={form.answer} onChange={e => update('answer', e.target.value)} /></label>}
      <label>参考Webページなど（任意） <input type="url" placeholder="https://..." value={form.sources[0] || ''} onChange={e => update('sources', [e.target.value, form.sources[1] || ''])}/></label>
      <label>参考URLをもう1件（任意） <input type="url" placeholder="https://..." value={form.sources[1] || ''} onChange={e => update('sources', [form.sources[0] || '', e.target.value])}/></label>
      <label>解説・出典・アイデア（任意） <textarea rows={3} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="教材の出典や、写真・Webページをどう使うかなど" /></label>
      <p className="mc-hint">外部サイトの写真や記事を転載・埋め込む場合は、管理者が掲載条件を確認します。</p>
      {error && <p role="alert" className="mc-error">{error}</p>}
      {busy && saveStage && <p role="status" aria-live="polite" className="mc-save-progress">{saveStage}</p>}
      <div className="mc-actions"><button className="mc-outline" disabled={busy || demo} type="button" onClick={onSave}>{busy ? '保存中…' : isAdmin && form.id ? '変更を保存' : '下書きを保存'}</button><button className="mc-primary" disabled={busy || demo} type="button" onClick={onSubmit}>{busy ? '処理中…' : isAdmin ? '保存して合格' : '確認して提出する'}</button></div>
      {demo && <p className="mc-demo-note">デモ中：写真の変換やプレビューは可能ですが、サーバーへの保存・提出はできません。</p>}
    </section>
    <QuestionPreview form={form} photos={photos}/>
  </div>;
}

async function loadStoredPhotos(question,session,onPhoto,onProgress){
  const count=question.type==='photo4'?4:question.type==='photo1'?1:0;
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
  onPrefetch, onDelete, onRestore,
  selectedCountry, countryNames, busy, reviewingIds
}) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const visible = questions.filter(q =>
    (filter === 'all'
      ? q.status !== 'deleted'
      : q.status === filter) &&
    (!selectedCountry || q.countryIso === selectedCountry) &&
    [q.prompt, q.countryName, q.authorName, q.domain]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

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

      <div className="mc-filter-row">
        <label className="mc-search">
          <Search size={18}/>
          <input
            placeholder="国・内容・作成者で検索"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="問題の状態で絞り込み"
          value={filter}
          onChange={e => setFilter(e.target.value)}
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

      {visible.length === 0 ? (
        <p className="mc-empty">
          該当する問題はありません。
        </p>
      ) : (
        <div className="mc-bank-list">
          {visible.slice(0, 200).map(q => (
            <article className="mc-question-row" key={q.id}>
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
                  <span className="mc-question-author">
                    作成：{q.authorName}
                  </span>
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
                      {q.status === 'approved' && <span className="mc-passed-label"><CheckCircle2 size={16}/>合格済み</span>}
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
  const [registrationToken, setRegistrationToken] = useState('');
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
    const candidates=questions
      .filter(q=>q.status!=='deleted'&&q.media?.length)
      .slice(0,2);

    const timer=setTimeout(()=>{
      if(disposed)return;
      // Prefetch two nearby photo questions concurrently, never blocking UI.
      candidates.forEach(q=>{loadPhotosFast(q).catch(()=>{});});
    },450);

    return ()=>{
      disposed=true;
      clearTimeout(timer);
    };
  },[session,user,loadingData,page,questions,loadPhotosFast]);

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
  const login=async({adminMode,pin})=>{setBusy(true);setError('');try{
    const teacherToken = adminMode ? '' : (localStorage.getItem('tp-mc-teacher-token') || '');
    const data=await creatorRequest('login',{pin,adminMode,teacherToken,withBootstrap:true});
    if(data.needsName){setRegistrationToken(data.registrationToken);return;}
    sessionStorage.setItem('tp-mc-session',data.session);if(data.user)setUser(data.user);if(data.bootstrap)initialBootstrapRef.current={session:data.session,data:data.bootstrap};setSession(data.session);setRegistrationToken('');
  }catch(e){setError(e.message);}finally{setBusy(false);}};
  const register=async(token,name)=>{setBusy(true);setError('');try{
    const data=await creatorRequest('registerTeacher',{registrationToken:token,displayName:name,withBootstrap:true});
    if(data.teacherToken)localStorage.setItem('tp-mc-teacher-token',data.teacherToken);
    sessionStorage.setItem('tp-mc-session',data.session);if(data.user)setUser(data.user);if(data.bootstrap)initialBootstrapRef.current={session:data.session,data:data.bootstrap};setSession(data.session);setRegistrationToken('');
  }catch(e){setError(e.message);}finally{setBusy(false);}};
  const reload=async()=>{if(demo)return;const data=await creatorRequest('bootstrap',{},session);setUser(data.user);setQuestions(data.questions);setProgress(data.progress);};
  const logout=()=>{initialBootstrapRef.current=null;photoCacheEpochRef.current+=1;photoCacheRef.current.clear();photoPendingRef.current.clear();sessionStorage.removeItem('tp-mc-session');setUser(null);setSession('');setDemo(false);setPhotos({});setError('');};
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
    setBusy(true);setError('');setSaveStage('問題文をGoogleスプレッドシートに保存しています…');
    const country=countries.find(c=>c.iso===form.countryIso);
    try{
      const total=form.type==='photo4'?4:form.type==='photo1'?1:0;
      const pendingSlots=Array.from({length:total},(_,index)=>index+1).filter(slot=>Boolean(photos[slot]?.blob));
      const instantFinalize=submit && pendingSlots.length===0;
      const finalize=instantFinalize?(user?.role==='admin'?'approved':'submitted'):undefined;
      const result=await creatorRequest('saveQuestion',{question:{...form,countryName:country?.name||form.countryName,choices:form.choices,sources:form.sources,countries:undefined},...(finalize?{finalize}:{})},session);
      const savedId=result.question.id;
      // Keep the server ID if a later image upload fails, so retry does not duplicate the question.
      setForm(prev => ({ ...prev, id: savedId }));
      for(let index=0;index<pendingSlots.length;index++){
        const slot=pendingSlots[index];
        setSaveStage(`写真 ${index+1}/${pendingSlots.length} をGoogleドライブに保存しています…`);
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
      setPage('bank');setPhotos({});setError('');
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
    {!active ? (session ? <div className="mc-access-wrap"><div role="status" className="mc-card mc-access">前回のログインを確認しています…</div></div> : <Access onLogin={login} onRegister={register} registrationToken={registrationToken} onBack={()=>{setRegistrationToken('');setError('');}} busy={busy} error={error}/>) : <>
      <header className="mc-header"><div className="mc-header-brand"><Compass size={24}/> <strong>TimePalette</strong><span>MISSION CREATOR</span></div><div className="mc-header-user"><span>{demo?'デモ（保存不可）':`${user.name} ／ ${user.role==='admin'?'管理者':'参加教師'}`}</span><button type="button" className="mc-quiet" onClick={logout}><LogOut size={17}/>終了</button></div></header>
      <div className="mc-app"><aside className="mc-sidebar"><nav>
        {[['dashboard',LayoutDashboard,'制作進捗'],['bank',BookOpen,'みんなの問題'],['editor',FilePlus2,'問題を作る']].map(([id,Icon,label])=><button key={id} className={page===id?'active':''} type="button" onClick={()=>id==='editor'?startNew(): (setPage(id),setError(''))}><Icon size={18}/>{label}</button>)}
        {user?.role==='admin' && <div className="mc-admin-hint"><ShieldCheck size={17}/>問題一覧で問題の編集・承認・削除・復元ができます。</div>}
      </nav><p>Google Sheets ＋ Drive 連携<br/>Chrome / Edge 推奨</p></aside><main className="mc-main">
        {demo && <div className="mc-demo-banner"><CircleHelp size={18}/>これは操作確認用の画面です。写真のWebP変換とプレビューを試せますが、保存・承認はできません。</div>}
        <div className="mc-main-heading"><div><div className="mc-eyebrow">GLOBAL COLLABORATION</div><h1>{page==='dashboard'?'制作進捗':page==='bank'?'みんなの問題':'問題を作る'}</h1><p>197か国 × 6カテゴリー × 各10問を、世界の先生たちと作る。</p></div>{page!=='editor'&&<button className="mc-primary" type="button" onClick={startNew}><FilePlus2 size={18}/>新しく作成</button>}</div>
        {error && page!=='editor' && <p role="alert" className="mc-error">{error}</p>}
        {loadingData && <div role="status" aria-live="polite" className="mc-save-progress">ログインしました。問題一覧・写真情報・進捗を読み込んでいます…</div>}
        {!loadingData && page==='dashboard'&&<Dashboard countries={countries} selectedCountry={selectedCountry} setSelectedCountry={setSelectedCountry} questions={questions} progress={progress} user={user} onSetProgress={setManual} busy={busy||demo}/>}
        {!loadingData && page==='bank'&&<QuestionBank questions={questions} user={user} onEdit={startEdit} onReview={review} onInspect={inspect} onPrefetch={prefetchPhotos} onDelete={archiveQuestion} onRestore={restoreQuestion} selectedCountry="" countryNames={countryNames} busy={busy||demo} reviewingIds={reviewingIds}/>}
        {!loadingData && page==='editor'&&<Editor form={form} setForm={setForm} photos={photos} onPhoto={pickPhoto} onSave={()=>persist(false)} onSubmit={()=>persist(true)} onCancel={()=>{editTokenRef.current+=1;setPage('bank');}} busy={busy} demo={demo} error={error} saveStage={saveStage} isAdmin={user?.role==='admin'} photoLoadBusy={photoLoadBusy} photoLoadError={photoLoadError} onRetryPhotos={retryEditorPhotos}/>}
      </main></div>
      {inspection && <ReviewDialog question={inspection} photos={inspectionPhotos} loading={inspectionLoading} loadingText={inspectionLoadingText} loadError={inspectionError} reviewError={reviewError} busy={busy || reviewingIds.has(inspection.id)} onClose={()=>setInspection(null)} onEdit={startEdit} onRetry={()=>inspect(inspection)} isAdmin={user?.role==='admin'} canEdit={user?.role==='admin'||user?.id===inspection.authorId} onReview={async(q,status)=>{const done=await review(q,status);if(done)setInspection(null);}}/>}
    </>}
  </div>;
}
