import {useEffect, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {ArrowLeft, CheckCircle2, ExternalLink, PlayCircle, RotateCcw, X} from 'lucide-react';
import {CreatorVideoEmbed} from './CreatorVideoMission.jsx';

// A learner explicitly confirms viewing. YouTube does not provide a reliable
// viewing-completion signal through this ordinary iframe, so do not fake one.
export default function UnicefVideoQuizMission({mission, alreadyCompleted, onClose, onComplete}) {
  const [step, setStep] = useState('watch');
  const [confirmed, setConfirmed] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [choice, setChoice] = useState(null);
  const [finished, setFinished] = useState(false);
  const closeButton = useRef(null);

  const questions = useMemo(() => mission.questions.map(q => {
    const options = q.choices.map((text, originalIndex) => ({text, originalIndex}));
    // Keep choice order stable within each question, while removing a fixed
    // correct-answer position from the authored question bank.
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    return {...q, options};
  }), [mission.id, mission.questions]);

  useEffect(() => {
    closeButton.current?.focus();
    const onKey = event => {if (event.key === 'Escape') onClose();};
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const current = questions[questionIndex];
  const selected = choice !== null;
  const correct = selected && choice === current.correctIndex;
  const handleNext = () => {
    if (!correct) return;
    if (questionIndex === questions.length - 1) {
      if (!finished) {
        setFinished(true);
        if (!alreadyCompleted) onComplete(mission);
      }
      setStep('complete');
      return;
    }
    setChoice(null);
    setQuestionIndex(index => index + 1);
  };

  const restart = () => {
    setStep('watch');
    setConfirmed(false);
    setQuestionIndex(0);
    setChoice(null);
    setFinished(false);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-slate-950/80 p-3 sm:p-6" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="unicef-mission-title" className="mx-auto max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 bg-gradient-to-r from-sky-900 to-blue-700 p-5 text-white sm:p-7">
          <div>
            <p className="mb-2 text-xs font-bold tracking-widest text-sky-100">TIMEPALETTE · UNICEF VIDEO MISSION</p>
            <h2 id="unicef-mission-title" className="text-xl font-black leading-snug sm:text-2xl">{mission.title}</h2>
            <p className="mt-2 text-sm text-sky-100">{mission.duration} · {mission.languageSupport} · 全{questions.length}問</p>
          </div>
          <button ref={closeButton} type="button" onClick={onClose} aria-label="動画ミッションを閉じる"
            className="shrink-0 rounded-full bg-white/20 p-3 hover:bg-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><X size={22}/></button>
        </header>

        {step === 'watch' && <div className="space-y-5 p-4 sm:p-7">
          <div className="rounded-2xl bg-sky-50 p-4 text-slate-800">
            <p className="mb-1 text-xs font-bold tracking-widest text-sky-700">STEP 1 / WATCH</p>
            <p className="text-base leading-7">{mission.intro}</p>
          </div>
          <CreatorVideoEmbed video={mission.video}/>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <a href={mission.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-sky-800 underline">
              <ExternalLink size={16}/> UNICEF公式の日本語説明を読む
            </a>
            <p className="text-xs text-slate-500">動画本体はYouTube公式プレーヤーで再生します。</p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sky-200 bg-white p-4 font-semibold text-slate-800">
            <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}
              className="mt-1 h-5 w-5 shrink-0 accent-sky-700"/>
            <span>動画の視聴を終えました（自己申告）</span>
          </label>
          <button type="button" disabled={!confirmed} onClick={() => {setStep('quiz');setChoice(null);}}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-4 font-black text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            <PlayCircle size={21}/> 視聴後の4択クイズに進む
          </button>
          <p className="text-xs text-slate-500">YouTubeの再生完了時刻は自動取得しません。動画が埋め込めない場合は「YouTubeで開く」から視聴できます。</p>
        </div>}

        {step === 'quiz' && <div className="space-y-5 p-4 sm:p-7">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-black text-blue-800">STEP 2 / QUIZ · {questionIndex + 1} / {questions.length}</p>
            <button type="button" onClick={() => {setStep('watch');setChoice(null);}} className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-bold text-slate-700"><ArrowLeft size={16}/> 動画を見直す</button>
          </div>
          <progress aria-label="クイズ進捗" value={questionIndex} max={questions.length} className="h-2 w-full accent-sky-600"/>
          <h3 className="text-lg font-black leading-relaxed text-slate-900 sm:text-xl">{current.prompt}</h3>
          <div className="grid gap-3" role="group" aria-label="4択の選択肢">
            {current.options.map((option, index) => {
              const isChosen = option.originalIndex === choice;
              return <button key={option.originalIndex} type="button"
                disabled={selected}
                onClick={() => setChoice(option.originalIndex)}
                aria-pressed={isChosen}
                className={'flex min-h-14 items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-base font-semibold transition-colors ' +
                  (isChosen ? (correct ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-rose-500 bg-rose-50 text-rose-900')
                    : 'border-slate-200 bg-white text-slate-800 hover:border-sky-400 disabled:opacity-80')}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">{String.fromCharCode(65 + index)}</span>
                <span>{option.text}</span>
              </button>;
            })}
          </div>
          {selected && <div role="status" aria-live="polite" className={'rounded-xl p-4 ' + (correct ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900')}>
            <p className="font-black">{correct ? '正解！' : 'もう一度チャレンジ！'}</p>
            <p className="mt-2 leading-7">{correct ? current.explanation : '動画の内容や公式の説明を確認して、再挑戦してみよう。'}</p>
          </div>}
          {selected && (correct
            ? <button type="button" onClick={handleNext} className="min-h-12 w-full rounded-xl bg-blue-700 px-5 py-4 font-black text-white">
                {questionIndex === questions.length - 1 ? '結果を見る・ミッションをクリア' : '次の問題へ'}
              </button>
            : <button type="button" onClick={() => setChoice(null)} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-800 px-5 py-4 font-black text-white"><RotateCcw size={19}/> もう一度答える</button>)}
        </div>}

        {step === 'complete' && <div className="space-y-5 p-6 text-center sm:p-9" role="status">
          <CheckCircle2 className="mx-auto text-emerald-600" size={64}/>
          <h3 className="text-2xl font-black text-emerald-800">VIDEO MISSION CLEAR!</h3>
          <p className="text-slate-800">全{questions.length}問正解しました。{alreadyCompleted ? '復習完了です。' : '学習記録にクリアを保存しました。'}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={restart} className="rounded-xl border-2 border-slate-300 px-5 py-3 font-bold text-slate-800">もう一度学ぶ</button>
            <button type="button" onClick={onClose} className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white">一覧へ戻る</button>
          </div>
        </div>}
      </section>
    </div>,
    document.body
  );
}
