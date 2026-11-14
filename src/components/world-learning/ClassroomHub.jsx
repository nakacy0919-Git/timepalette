import {useState} from 'react';
import {getLiveWorldLearningCountries,getWorldLearningCountry} from '../../utils/worldLearningRegistry.js';
import {MISSION_DOMAINS} from '../../utils/missionDomains.js';
import {buildLearnerJourney} from '../../utils/learnerJourneyProgress.js';
import {readLesson,lessonUrl,setLearningScope,clearLearningData,completionReport} from '../../utils/classroomSession.js';
import LearningNotebook from './LearningNotebook.jsx';
import LearningBackupControls from './LearningBackupControls.jsx';
import WorldMissionPanel from './WorldMissionPanel.jsx';
import './classroomHub.css';
const levels=[['elementary','小学生'],['juniorHigh','中学生'],['highSchoolStandard','高校生'],['highSchoolAdvanced','Challenge']];
const uses=[['小学校','地図で国を探す・時計を動かす・あいさつをまねる','国旗や写真を投影し、ペアで予想してから答える'],['中学校','時差を計算する・学校生活を外国語で紹介する','交流可能な時間を比較し、答えの根拠を話し合う'],['高校','資料の出典を確認し、文化や日本との関係を比較する','複数の資料を読み、異なる見方を共有する']];
export default function ClassroomHub({onHome}) {
  const [initial]=useState(()=>readLesson(window.location.search));
  const countries=getLiveWorldLearningCountries();
  const [country,setCountry]=useState(initial?.country||'jp');
  const [domain,setDomain]=useState(initial?.domain||'time');
  const [level,setLevel]=useState(initial?.level||'elementary');
  const [running,setRunning]=useState(false);
  const [mode,setMode]=useState('personal');
  const [notice,setNotice]=useState('');
  const [resetConfirm,setResetConfirm]=useState(false);
  const [revision,setRevision]=useState(0);
  const selected=getWorldLearningCountry(country);
  const start=(next)=>{setLearningScope(next);if(next!=='personal')clearLearningData();setMode(next);setRunning(true);setNotice('');};
  const stop=()=>{setLearningScope('personal');setRunning(false);setRevision(v=>v+1);};
  const copy=async()=>{const url=lessonUrl(window.location.href,{country,domain,level});try{await navigator.clipboard.writeText(url);setNotice('生徒用リンクをコピーしました。国・カテゴリ・レベルのみ共有します。');}catch{setNotice(url);}};
  const download=()=>{const report=completionReport(buildLearnerJourney(countries));const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='timepalette-learning-summary.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setNotice('クリア数の記録を保存しました。名前・学校・音声・入力文は含みません。');};
  return <div className="tp-classroom" key={revision}>
    <header className="tp-classroom-bar"><button onClick={running?stop:onHome}>← {running?'授業設定に戻る':'ホーム'}</button><strong>TimePalette · 授業と個人学習</strong>{running&&<span>{mode==='demo'?'先生の実演':mode==='shared'?'共用端末で練習':'自分の端末で学習'}</span>}</header>
    {running?<>
      <p className="tp-classroom-notice">{mode==='personal'?'記録はこのブラウザーに保存されます。':mode==='demo'?'実演の記録は個人記録に加算されません。再読み込みで実演の記録は消えます。':'この練習の記録と入力内容は再読み込みで消えます。終了時は「記録と入力を消して終了」を押してください。'}</p>
      <div className="tp-classroom-actions"><button onClick={download}>クリア記録を保存</button>{mode!=='personal'&&<button onClick={()=>{clearLearningData();stop();}}>記録と入力を消して終了</button>}</div>
      <LearningNotebook country={country} domain={domain} level={level} countryName={selected.nameJa} domainName={MISSION_DOMAINS.find(d=>d.id===domain)?.labelJa} levelName={levels.find(l=>l[0]===level)?.[1]}/>
      <WorldMissionPanel key={country+domain+level+mode} countryCode={selected.iso} countryNameJa={selected.nameJa} countryNameEn={selected.nameEn} flagUrl={selected.flagUrl} initialLevel={level} initialDomain={domain}/>
    </>:<>
      <h1>今日の学習を始めよう</h1><p>先生は同じ教材へのリンクを配り、生徒は自分のペースで取り組めます。</p>
      <div className="tp-classroom-settings">
        <label>国・地域<select value={country} onChange={e=>setCountry(e.target.value)}>{countries.map(c=><option key={c.iso} value={c.iso}>{c.nameJa}</option>)}</select></label>
        <label>カテゴリ<select value={domain} onChange={e=>setDomain(e.target.value)}>{MISSION_DOMAINS.map(d=><option key={d.id} value={d.id}>{d.labelJa}</option>)}</select></label>
        <label>学習レベル<select value={level} onChange={e=>setLevel(e.target.value)}>{levels.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
      </div>
      {!selected?<p role="alert">この国の教材は利用できません。別の国を選んでください。</p>:<div className="tp-classroom-start">
        <button onClick={()=>start('personal')}>自分の端末で始める<small>記録をこのブラウザーに保存</small></button>
        <button onClick={()=>start('shared')}>共用iPadで始める<small>個人記録と分けた一時的な練習</small></button>
        <button onClick={()=>start('demo')}>先生の実演を始める<small>実演用の記録で授業を進める</small></button>
      </div>}
      <div className="tp-classroom-actions"><button onClick={copy}>生徒用リンクをコピー</button><button onClick={download}>この端末のクリア記録を保存</button><button onClick={()=>setResetConfirm(true)}>この端末の学習記録・入力を消す</button></div>
      <LearningBackupControls journey={()=>buildLearnerJourney(countries)} onRestored={()=>setRevision(v=>v+1)}/>
      {resetConfirm&&<div role="alertdialog" aria-label="学習記録の削除確認" className="tp-classroom-confirm"><p>このブラウザーのクリア記録と、Language Adventureの名前・学校などの入力、目標・振り返りを消します。元に戻せません。必要なら先にクリア記録を保存してください。</p><button onClick={()=>setResetConfirm(false)}>キャンセル</button><button onClick={()=>{try{clearLearningData();setNotice('学習記録と入力を削除しました。');setResetConfirm(false);setRevision(v=>v+1);}catch{setNotice('削除できませんでした。ブラウザーのサイトデータ設定を確認してください。');}}}>削除する</button></div>}
      <p className="tp-classroom-notice">名前はニックネーム、学校は架空の名前でも練習できます。音声認識はブラウザー側のサービスで処理される場合があります。学校の方針に合わせ、マイクを使わず入力でも取り組めます。</p>
      <table><caption>授業での活用例</caption><thead><tr><th>学年</th><th>生徒が自分で使う</th><th>先生が使う</th></tr></thead><tbody>{uses.map(row=><tr key={row[0]}>{row.map((cell,i)=>i===0?<th key={i}>{cell}</th>:<td key={i}>{cell}</td>)}</tr>)}</tbody></table>
      <p>公開教材の数は国・カテゴリ・レベルで異なります。Challenge用の公開教材がない場合は、通常の高校生レベルを選んでください。クリア記録は練習の記録で、本人確認を伴う成績評価ではありません。</p>
    </>}
    {notice&&<p role="status" className="tp-classroom-notice">{notice}</p>}
  </div>;
}
