import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, CheckCircle2, Download, ExternalLink, FileText, Printer, X } from 'lucide-react';
import SourceStudyReader from './SourceStudyReader.jsx';
import { getJicaWorldDiaryUrls } from '../../utils/jicaWorldDiary.js';
import './worldDiaryReflection.css';

const storageKey = (id) => 'timepalette:world-diary-draft:v1:' + id;
const emptyDraft = { reaction: '', question: '' };

function loadDraft(id) {
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey(id)) || 'null');
    return value && typeof value === 'object'
      ? { reaction: String(value.reaction || ''), question: String(value.question || '') }
      : emptyDraft;
  } catch {
    return emptyDraft;
  }
}

function exportText(mission, sourceUrl, draft) {
  return [
    'TimePalette | 世界日記 発見ノート',
    '資料：JICA海外協力隊 世界日記',
    '資料URL：' + sourceUrl,
    '学習ID：' + mission.id,
    '日付：' + new Date().toLocaleDateString('ja-JP'),
    '',
    '1. 読んで感じたこと・印象に残ったこと',
    draft.reaction,
    '',
    '2. もっと知りたいこと・疑問',
    draft.question,
    '',
    '※資料の本文や写真は転載していません。',
  ].join('\n');
}

export default function WorldDiaryReflectionPlayer({
  mission, countryName = '', alreadyCompleted = false, onClose, onComplete,
}) {
  const urls = useMemo(() => getJicaWorldDiaryUrls(mission), [mission]);
  const [selectedSource, setSelectedSource] = useState(0);
  const [draft, setDraft] = useState(() => loadDraft(mission.id));
  const [saveState, setSaveState] = useState('');
  const [recorded, setRecorded] = useState(alreadyCompleted);
  const [error, setError] = useState('');
  const sourceUrl = urls[selectedSource] || urls[0];
  const hasReflection = draft.reaction.trim().length > 0;
  const updateDraft = (field, value) => {
    const updated = { ...draft, [field]: value };
    setDraft(updated);
    setError('');
    try {
      window.localStorage.setItem(storageKey(mission.id), JSON.stringify(updated));
      setSaveState('このブラウザに下書きを一時保存しました');
    } catch {
      setSaveState('一時保存できません。必ず印刷・ファイル保存してください');
    }
  };

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const recordLearning = () => {
    if (!hasReflection) {
      setError('ブログを読んで、感想を入力してください。');
      return;
    }
    if (!recorded) onComplete?.(mission);
    setRecorded(true);
    setError('');
  };

  const download = () => {
    const blob = new Blob([exportText(mission, sourceUrl, draft)], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'TimePalette_世界日記_' + String(mission.id).replace(/[^a-zA-Z0-9_-]/g, '') + '.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!sourceUrl) return createPortal(<div className="tp-diary-overlay"><section className="tp-diary-dialog" role="dialog" aria-modal="true" aria-label="世界日記の出典確認"><header className="tp-diary-header"><div><h2>世界日記・出典確認中</h2><p>この教材の元記事URLを確認しています。</p></div><button type="button" aria-label="学習画面を閉じる" onClick={onClose}><X size={23}/></button></header><div className="tp-diary-columns"><div className="tp-diary-left"><p>元記事へのリンクが未登録のため、ここに資料を表示できません。世界日記の写真は転載しません。</p><a href="https://world-diary.jica.go.jp/" target="_blank" rel="noopener noreferrer">JICA 世界日記の公式サイトを開く</a></div><div className="tp-diary-right"><p>出典を確認できるまで、このミッションは採点しません。</p><button type="button" onClick={onClose}>一覧に戻る</button></div></div></section></div>,document.body);

  return createPortal(
    <div className="tp-diary-overlay">
      <section className="tp-diary-dialog" role="dialog" aria-modal="true" aria-label="世界日記を読んで感想を書く">
        <header className="tp-diary-header">
          <div>
            <span>TIMEPALETTE · WORLD DISCOVERY</span>
            <h2>世界日記を読んで、感じたことを書こう</h2>
            <p>{countryName ? countryName + ' · ' : ''}正解を選ぶクイズではありません。自分の発見や疑問を大切にしましょう。</p>
          </div>
          <button type="button" aria-label="学習画面を閉じる" onClick={onClose}><X size={23}/></button>
        </header>
        <div className="tp-diary-columns">
          <div className="tp-diary-left">
            <div className="tp-diary-section-title">
              <BookOpen size={20}/>
              <strong>STEP 1 · 世界日記を読む</strong>
            </div>
            {urls.length > 1 && (
              <label className="tp-diary-source-select">読む記事を選択
                <select value={selectedSource} onChange={(e) => setSelectedSource(Number(e.target.value))}>
                  {urls.map((url, index) => <option key={url} value={index}>世界日記 {index + 1}</option>)}
                </select>
              </label>
            )}
            <SourceStudyReader
              key={sourceUrl}
              source={{ title: 'JICA 海外協力隊 世界日記', organization: 'JICA（原文）', url: sourceUrl }}
              className="tp-diary-source-reader"
              allowFullscreen
              defaultZoom={0.75}
              fullscreenReturnLabel="全画面を閉じて発見ノートに戻る"
            />
            <p className="tp-diary-source-note">
              JICA公式サイトの原文をそのまま表示します。サイト側の制限で表示できない場合は、
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer">原文を開く <ExternalLink size={13}/></a>
              を利用してください。
            </p>
          </div>
          <div className="tp-diary-right">
            <div className="tp-diary-section-title">
              <FileText size={20}/>
              <strong>STEP 2 · 自分の感想を書く</strong>
            </div>
            <p className="tp-diary-guide">この文章は一人の隊員の体験談です。その国のすべての人に当てはまるとは限りません。自分が感じたことを書いてみましょう。</p>
            <label htmlFor="tp-diary-reaction">読んで感じたこと・印象に残ったこと</label>
            <textarea
              id="tp-diary-reaction"
              value={draft.reaction}
              onChange={(e) => updateDraft('reaction', e.target.value)}
              placeholder="驚いたこと、共感したこと、日本の生活と比べて考えたことなどを書こう。"
              rows={7}
            />
            <label htmlFor="tp-diary-question">もっと知りたいこと・疑問（任意）</label>
            <textarea
              id="tp-diary-question"
              value={draft.question}
              onChange={(e) => updateDraft('question', e.target.value)}
              placeholder="この記事を読んで、さらに調べたいと思ったことは？"
              rows={4}
            />
            <p className="tp-diary-save" role="status">{saveState}</p>
            {error && <p className="tp-diary-error" role="alert">{error}</p>}
            {recorded && <p className="tp-diary-complete"><CheckCircle2 size={18}/> 学習を記録しました。正解・不正解の判定はありません。</p>}
            <div className="tp-diary-actions">
              <button type="button" className="tp-diary-primary" onClick={recordLearning}>
                <CheckCircle2 size={17}/> 学習を記録
              </button>
              <button type="button" onClick={() => window.print()}>
                <Printer size={17}/> 印刷・PDF保存
              </button>
              <button type="button" onClick={download}>
                <Download size={17}/> テキスト保存
              </button>
            </div>
            <p className="tp-diary-privacy">感想はTimePaletteのサーバーに送信しません。ブラウザ内の下書きは消える場合があります。提出・長期保存には「印刷・PDF保存」を使ってください。</p>
          </div>
        </div>
      </section>
      <article className="tp-diary-print-page" aria-hidden="true">
        <div className="tp-diary-print-eyebrow">TIMEPALETTE · WORLD DISCOVERY JOURNAL</div>
        <h1>世界日記 発見ノート</h1>
        <p>国：{countryName || '________________'}　氏名：________________________　日付：________________</p>
        <hr/>
        <p><strong>資料：</strong>JICA海外協力隊 世界日記</p>
        <p className="tp-diary-print-url"><strong>出典URL：</strong>{sourceUrl}</p>
        <h2>1. 読んで感じたこと・印象に残ったこと</h2>
        <div className="tp-diary-print-answer">{draft.reaction || '　'}</div>
        <h2>2. もっと知りたいこと・疑問</h2>
        <div className="tp-diary-print-answer">{draft.question || '　'}</div>
        <p className="tp-diary-print-footer">原文・写真は転載せず、本人の感想だけを記録しています。</p>
      </article>
    </div>,
    document.body,
  );
}
