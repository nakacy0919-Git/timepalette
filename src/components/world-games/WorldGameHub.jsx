import {useEffect,useMemo,useState} from 'react';
import {ComposableMap,Geographies,Geography,Marker} from 'react-simple-maps';
import worldAtlas from 'world-atlas/countries-110m.json';
import {getLiveWorldLearningCountries} from '../../utils/worldLearningRegistry';
import {getGeography197Profile} from '../../utils/geography197';
import {makeLocalGameBank} from '../../utils/worldGameBank';
import {loadAiaPracticeBank} from '../../utils/aiaPracticeBank.js';
import {loadSchoolQuestionBank,provisionalGrade,SCHOOL_LEVELS,rubySegments} from '../../utils/schoolQuestionBank.js';
import {localizeQuestion} from '../../utils/worldGameLanguage';
import {questionPool,createGame,selectTerritory,rollJourney,answerGame,advanceGame,standings,missedQuestions,teamRank,availableTerritories,playableLimit,buySouvenir,classroomReport,classroomReportCsv} from '../../utils/worldGameEngine';
import {getUiSoundEnabled,setUiSoundEnabled,playUiSound} from '../../utils/uiSound';
import {TRAVEL_MODES,souvenirsForCountry,territoryChoices,regionalCollections,journeyAssets} from '../../utils/worldGameStrategy';
import './worldGameHub.css';
import OnlineBattle from './OnlineBattle.jsx';
import JourneyBoard from './JourneyBoard.jsx';
import JourneyRoomLobby from './JourneyRoomLobby.jsx';
import {useJourneyRoom} from './useJourneyRoom.js';
import {journeyStop} from '../../utils/worldJourneyStops.js';
import './brightWorldGames.css';
import countryFlags from '../../data/exploreCountryFlags.json';
import './journeyGeographic.css';
import './shuffleArcade.css';
import './worldArcadePlus.css';
import './journeyPolish.css';
import './journeyFullStage.css';
import './schoolQuestionLevels.css';
const ONLINE_ENDPOINT=import.meta.env.VITE_WORLD_BATTLE_API_URL||'';

const MODES=[
 {id:'shuffle',icon:'🔀',name:'World Shuffle',desc:'国・地域を選んでランダム4択'},
 {id:'battle',icon:'🏆',name:'World Quiz Battle',desc:'先生の端末で順番に答えるチーム対抗戦'},
 {id:'territory',icon:'🌍',name:'World Territory',desc:'国を選んでクイズに正解し、チームの色を広げよう'},
 {id:'journey',icon:'🎲',name:'World Journey',desc:'サイコロで旅してTimePalette Moneyを集めよう'},
];
const DOMAINS=[['place','地理・場所'],['time','時間・時差'],['language','ことば'],['lifeCulture','生活・文化'],['japanConnection','日本とのつながり'],['thinkConnect','比較・思考・交流']];
const countries=getLiveWorldLearningCountries();
const byIso=Object.fromEntries(countries.map(c=>[c.iso,c]));
const byAtlas=Object.fromEntries(countries.map(c=>[c.atlasName,c.iso]));
const baseBank=makeLocalGameBank(countries);
const domainEn={place:'Geography',time:'Time & Time Zones',language:'Language',lifeCulture:'Life & Culture',japanConnection:'Connections with Japan',thinkConnect:'Think & Connect'};
const geo=Object.fromEntries(countries.map(c=>{const p=getGeography197Profile(c.iso);return [c.iso,{center:p?.center,neighbors:(p?.neighbors||[]).map(n=>n.iso),region:c.region}];}));
const PRESET_KEY='timepalette.worldgames.settings.v3';
function readPreset(){try{return JSON.parse(localStorage.getItem(PRESET_KEY)||'null')||{};}catch{return {};}}
function persistPreset(preset){try{localStorage.setItem(PRESET_KEY,JSON.stringify(preset));return true;}catch{return false;}}
const regionLabels={Asia:'アジア',Europe:'ヨーロッパ',Africa:'アフリカ',Americas:'南北アメリカ',Oceania:'オセアニア',Atlantic:'大西洋','Indian Ocean':'インド洋'};
const name=iso=>byIso[iso]?.nameJa||iso;
const flag=iso=>byIso[iso]?.flagEmoji||'🌐';
function Scoreboard({game}){
 if(game.mode==='journey')return <div className="wj-scoreboard" aria-label="チーム得点表">{game.teams.map(t=><div key={t.id} className={'wj-score-chip '+(game.turn===t.id?'active':'')} style={{'--team':t.color}}><div className="wj-score-rank">{t.id+1}</div><div className="wj-score-copy"><strong title={t.name}>{t.name}</strong><span><b>{t.score.toLocaleString()}</b> pts</span></div><div className="wj-score-money"><b>{t.money.toLocaleString()}</b><small>TPM</small></div><img src={countryFlags.flags[journeyStop(game,t.position).country]} alt={name(journeyStop(game,t.position).country)}/></div>)}</div>;
 return <div className="wg-scores">{game.teams.map(t=><div key={t.id} className={'wg-score '+(game.phase!=='finished'&&game.turn===t.id?'active':'')} style={{'--team':t.color}}>
 <strong>{t.name}</strong><span>{t.score} pts</span><small>{t.correctCount}/{t.attempts} 正解{t.streak>1?' · 🔥 '+t.streak+'連続':''}</small>{game.mode==='territory'&&<small>{Object.values(game.owners).filter(id=>id===t.id).length}か国{game.strategy?' · 地域バッジ '+regionalCollections(game,t.id).length:''}</small>}{game.mode==='journey'&&<small>{t.money.toLocaleString()} TPM · {name(journeyStop(game,t.position).country)} · {t.visits.length}か国訪問{game.travelEconomy?' · 記念品 '+t.souvenirs.length+'個':''}</small>}</div>)}</div>;
}
function TerritoryMap({game,onPick}){
 const choiceInfo=territoryChoices(game);
 const playable=availableTerritories(game);
 const enabled=new Set(playable);
 const selected=new Set(game.route);
 const [query,setQuery]=useState(''),[page,setPage]=useState(0),[picker,setPicker]=useState(false);
 const filtered=playable.filter(iso=>name(iso).includes(query)||byIso[iso]?.nameEn.toLowerCase().includes(query.toLowerCase()));
 const maxPage=Math.max(0,Math.ceil(filtered.length/12)-1),currentPage=Math.min(page,maxPage);
 const choose=iso=>{if(game.phase==='select'&&enabled.has(iso)){setPicker(false);onPick(iso);}};
 return <div className="wg-map-section">
 <div className="wg-map"><ComposableMap projectionConfig={{scale:125}} width={800} height={400}><Geographies geography={worldAtlas}>{({geographies})=>geographies.map(geo=>{
  const iso=byAtlas[geo.properties?.name],owner=game.owners[iso],active=selected.has(iso),pickable=game.phase==='select'&&enabled.has(iso);
  return <Geography key={geo.rsmKey} geography={geo} fill={owner!==undefined?game.teams[owner].color:active?(enabled.has(iso)?'#6b9da7':'#b1c1c9'):'#dce5ec'} stroke="#fff" strokeWidth={0.5} onClick={()=>choose(iso)} style={{default:{outline:'none',cursor:pickable?'pointer':'default'},hover:{outline:'none',fill:pickable?'#f1b94b':undefined},pressed:{outline:'none'}}}/>;
 })}</Geographies></ComposableMap></div>
 <div className="wg-strategy"><strong>{choiceInfo.kind==='neighbor'?'隣接国へ進出':choiceInfo.kind==='expedition'?'特別遠征':choiceInfo.kind==='start'?'出発地点を選択':'自由探索'}</strong><span>{choiceInfo.kind==='neighbor'?'獲得済みの国と陸で接する候補国へ進めます。':choiceInfo.kind==='expedition'?'隣接する未出題の候補がないため、離れた国にも挑戦できます。':choiceInfo.kind==='start'?'最初の拠点は自由に選べます。':'正解で国を獲得。相手の国にも挑戦できます。'}</span></div>
 {game.strategy&&<p>選択範囲内の同じ地域の国（2か国以上）をすべて獲得すると、その地域につき初回200 pts。実際の国境を変えるものではなく、知識を集めるゲームです。</p>}
 <div className="wg-territory-footer"><b>挑戦可能：{playable.length}か国・地域</b><button className="wg-primary" disabled={game.phase!=='select'} onClick={()=>setPicker(true)}>国を選ぶ</button></div>
 {picker&&game.phase==='select'&&<div className="wg-overlay" role="dialog" aria-modal="true" aria-label="挑戦する国"><section className="wg-settings wg-wizard"><header className="wg-wizard-head"><h2>挑戦する国を選ぼう</h2><button className="wg-back" onClick={()=>setPicker(false)}>閉じる</button></header><label className="wg-label">国を検索<input value={query} onChange={e=>{setQuery(e.target.value);setPage(0);}} placeholder="国名で検索"/></label><div className="wg-country-grid">{filtered.slice(currentPage*12,(currentPage+1)*12).map(iso=><button key={iso} onClick={()=>choose(iso)}>{flag(iso)} {name(iso)}</button>)}</div><div className="wg-page-controls"><button disabled={currentPage===0} onClick={()=>setPage(currentPage-1)}>← 前</button><span>{currentPage+1} / {maxPage+1}</span><button disabled={currentPage===maxPage} onClick={()=>setPage(currentPage+1)}>次 →</button></div></section></div>}
 </div>;
}
function QuizCard({game,setGame,teacher,timer,roomAction,canControl=true,hostTimer=true}){
 const english=game.question?.language==='en';
 const tr=(ja,en)=>english?en:ja;
 const [choice,setChoice]=useState(null);
 const [ready,setReady]=useState(game.mode!=='battle'||game.phase==='review');
 const [seconds,setSeconds]=useState(timer);
 const [paused,setPaused]=useState(false),[showShop,setShowShop]=useState(false),[explainOpen,setExplainOpen]=useState(false);
 const active=ready&&game.phase==='question'&&timer>0;
 useEffect(()=>{
  if(!active||paused||seconds<=0)return;
  const id=window.setTimeout(()=>setSeconds(n=>Math.max(0,n-1)),1000);
  return ()=>clearTimeout(id);
 },[active,paused,seconds]);
 useEffect(()=>{
  if(active&&seconds===0&&!teacher&&hostTimer){if(roomAction)roomAction('answer',{index:-1});else setGame(g=>g.question?.id===game.question?.id&&g.turn===game.turn?answerGame(g,-1):g);}
 },[active,seconds,teacher,setGame,game.question?.id,game.turn,hostTimer]);
 const q=game.question,review=game.phase==='review';
 useEffect(()=>{if(review)playUiSound(game.mode==='battle'?'success':game.last?.correct?(game.mode==='journey'?'journeyReward':'correct'):'wrong');},[review,game.mode,game.last]);
 useEffect(()=>{if(!showShop)return;const close=e=>{if(e.key==='Escape')setShowShop(false);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[showShop]);
 if(!q)return null;
 const record=i=>{if(!canControl)return;if(roomAction)roomAction('answer',{index:i});else setGame(g=>g.question?.id===q.id&&g.turn===game.turn?answerGame(g,i):g);};
 const next=()=>{if(!canControl)return;if(roomAction)roomAction('next');else setGame(advanceGame);};
 const choose=i=>{if(review||!canControl)return;playUiSound('tap');if(teacher)setChoice(i);else record(i);};
 const submit=()=>{if(choice!==null)record(choice);};
 const correct=q.correctIndex;
 const read=value=>!english&&q.gradeBand==='elementary'&&q.readings?rubySegments(value,q.readings).map((part,i)=>part.reading?<ruby key={i}>{part.text}<rt>{part.reading}</rt></ruby>:part.text):value;
 const journeyReview=game.mode==='journey'&&review;
 if(!ready&&!review)return <section className="wg-question wg-handoff"><div aria-hidden="true">🛡️</div><h2>{english?game.teams[game.turn].name+"'s turn":game.teams[game.turn].name+' の番です'}</h2><p>{tr('他のチームから回答が見えないように端末を渡してください。','Pass the device to the next team without revealing your answer.')}</p><button className="wg-primary" onClick={()=>setReady(true)}>{tr('回答を始める','Start answering')}</button></section>;
 return <section className={'wg-question '+(teacher?'teacher':'')+(journeyReview?' wj-review-stage':'')+(!english&&q.gradeBand==='elementary'?' wg-furigana-question':'')} aria-label={tr("クイズ","Quiz")} lang={english?"en":"ja"}>
 <header><span>{game.mode==='shuffle'?'✈ WORLD SHUFFLE':flag(q.country)} {game.mode!=='shuffle'&&(english?(byIso[q.country]?.nameEn||q.country):name(q.country))} · {english?domainEn[q.domain]:DOMAINS.find(d=>d[0]===q.domain)?.[1]}</span><span className="ws-question-index">Q {game.round+1} <small>/ {game.limit}</small></span></header>
 {!journeyReview&&<div className="ws-country-banner"><div className="ws-flag-frame"><img className="ws-quiz-flag" src={'https://flagcdn.com/w320/'+q.country.toLowerCase()+'.png'} onError={e=>{const fallback=countryFlags.flags[q.country];if(fallback&&e.currentTarget.src!==fallback)e.currentTarget.src=fallback;}} alt={english?(byIso[q.country]?.nameEn||q.country)+' flag':name(q.country)+'の国旗'}/><span className="ws-flag-badge">✦</span></div><div className="ws-country-copy"><small>NOW EXPLORING / 冒険先</small><strong>{english?(byIso[q.country]?.nameEn||q.country):name(q.country)}</strong><span>{english?name(q.country):(byIso[q.country]?.nameEn||q.country)}</span></div><div className="ws-quiz-score"><span>★ SCORE</span><b>{game.teams[game.turn]?.score||0}</b><small>{tr('連続正解','STREAK')} {game.teams[game.turn]?.streak||0} 🔥</small></div></div>}
 {game.mode==='battle'&&!review&&<p className="wg-turn">{tr('回答者：','Answering team: ')}{game.teams[game.turn].name}{tr('（他チームは回答を見ないようにしてください）',' (Keep your answer private.)')}</p>}
 {active&&<div className="wg-timer"><div><strong>{seconds}{tr('秒',' sec')}</strong><span>{seconds===0?tr('時間終了','Time is up'):paused?tr('一時停止中','Paused'):tr('考える時間','Time to think')}</span>{teacher&&seconds>0&&<button onClick={()=>setPaused(p=>!p)}>{paused?tr('再開','Resume'):tr('一時停止','Pause')}</button>}</div><div className="wg-timer-track"><i style={{width:(seconds/timer*100)+'%'}}/></div></div>}
 {!journeyReview&&<h2>{read(q.prompt)}</h2>}{q.practiceDraft&&<small style={{display:'block',color:'#496783',fontSize:'12px',margin:'3px 0'}}>{tr('追加学習問題（内容・翻訳確認中）','Supplementary practice (content and translation under review)')}</small>}{!review&&<div className="wg-options">{q.choices.map((label,i)=><button key={i} disabled={review||!canControl} aria-pressed={!review&&choice===i} className={review?(i===correct?'correct':Object.values(game.answers).includes(i)?'wrong':''):choice===i?'selected':''} onClick={()=>choose(i)}><b>{'ABCD'[i]}</b><span>{read(label)}</span>{<i className="ws-answer-arrow" aria-hidden="true">›</i>}</button>)}</div>}
 {teacher&&!review&&<div className="wg-row"><button className="wg-primary" disabled={choice===null||!canControl} onClick={submit}>{game.mode==='battle'?tr('回答を確定','Submit answer'):tr('正解を発表','Reveal answer')}</button><button disabled={!canControl} onClick={()=>record(-1)}>{tr('パス・正解を確認','Pass / reveal')}</button></div>}
 {review&&!journeyReview&&<div className={'wg-feedback '+(game.last?.correct?'ws-success':'ws-try-again')} role="status"><h3>{game.mode==='shuffle'&&<span aria-hidden="true">{game.last?.correct?'⭐ ':'💡 '}</span>}{game.mode==='battle'?tr('正解発表','Answer reveal'):game.last.correct?tr('正解！','Correct!'):tr('正解を確認しよう','Let’s check the answer')}</h3><strong className="wg-correct-answer">✓ {read(q.choices[correct])}</strong><p>{read(q.explanation)}</p>{game.mode!=='battle'&&!game.last?.correct&&<small>{tr('あなたの回答：','Your answer: ')}{game.answers[game.turn]===-1?tr('未回答','No answer'):read(q.choices[game.answers[game.turn]])}</small>}
 {game.last?.transfer&&<p className="wg-reward">🏳️ エリア獲得！</p>}{game.last?.newRegions?.map(r=><p key={r.region} className="wg-reward">🏅 {regionLabels[r.region]||r.region} 選択範囲達成 · +200 pts</p>)}
 {game.mode==='battle'&&<p>{game.teams.map(t=>t.name+'：'+(game.answers[t.id]===correct?tr('正解','Correct'):game.answers[t.id]===-1?tr('未回答','No answer'):tr('不正解','Incorrect'))).join(' ／ ')}</p>}
 <small>{tr('教材：','Source: ')}{q.origin||'TimePalette'}{q.sources?.filter(s=>typeof s==='string'&&s.startsWith('https://')).map(s=><a key={s} href={s} target="_blank" rel="noreferrer"> · {tr('出典','Reference')}</a>)}</small>
 <button className="wg-primary" disabled={!canControl} onClick={next}>{game.round+1===game.limit?tr('結果を見る','See results'):tr('次へ','Next')}</button></div>}
 {journeyReview&&<div className={'wg-feedback wj-celebration '+(game.last?.correct?'wj-win':'wj-learn')} role="status">
  <div className="wj-review-top"><div className="wj-result-country"><img src={countryFlags.flags[q.country]} alt=""/><b>{name(q.country)}</b></div><span>{game.last?.correct?tr('すばらしい！','GREAT JOB!'):tr('次もチャレンジ！','KEEP EXPLORING!')}</span></div>
  <div className="wj-review-grid"><div className="wj-reward-panel">
    {game.last?.correct?<><div className="wj-coin-burst" aria-hidden="true">{Array.from({length:12},(_,i)=><i key={i} style={{'--i':i,'--x':((i%6)-2.5)*34+'px','--y':-(35+(i%4)*22)+'px'}}>T</i>)}</div><div className="wj-star-medal" aria-hidden="true">★</div><h3>{tr('正解！','CORRECT!')}</h3><div className="wj-tpm-reward"><span>🪙</span><b>+300</b><small>TPM</small></div><p>{tr('旅の資金を獲得！','Travel money earned!')}</p></>:<><div className="wj-star-medal" aria-hidden="true">💡</div><h3>{tr('正解を確認！','LET’S LEARN!')}</h3><p>{tr('次の冒険に生かそう！','Take this knowledge on your next journey!')}</p></>}
   </div><div className="wj-explanation"><small>{tr('正解','ANSWER')}</small><strong>✓ {read(q.choices[correct])}</strong><p>{read(q.explanation.length>230?q.explanation.slice(0,230)+'…':q.explanation)}</p>{q.explanation.length>230&&<button type="button" className="wg-back wj-full-explain" onClick={()=>setExplainOpen(true)}>{tr('解説全文','Read full explanation')}</button>}{!game.last?.correct&&<small>{tr('あなたの回答：','Your answer: ')}{game.answers[game.turn]===-1?tr('未回答','No answer'):read(q.choices[game.answers[game.turn]])}</small>}<small>{q.sources?.filter(s=>typeof s==='string'&&s.startsWith('https://')).slice(0,2).map((s,i)=><a key={s} href={s} target="_blank" rel="noreferrer">{tr('出典','Reference')} {i+1} · </a>)}</small></div></div>
  <footer className="wj-review-actions"><span className="wj-wallet">💰 <b>{game.teams[game.turn].money.toLocaleString()}</b> TPM</span>{game.travelEconomy&&<button type="button" className="wj-shop-launch" aria-expanded={showShop} onClick={()=>{playUiSound('open');setShowShop(true);}}>🎁 {tr('お土産ショップ','Souvenir shop')}</button>}<button className="wg-primary" disabled={!canControl} onClick={next}>{game.round+1===game.limit?tr('結果を見る','See results'):tr('次へ →','Next →')}</button></footer>
 </div>}
 {journeyReview&&showShop&&<div className="wj-shop-overlay" role="dialog" aria-modal="true" aria-label={name(q.country)+'のお土産ショップ'}><section className="wj-shop-modal"><header><div><small>旅の記念品コレクション</small><h2><img src={countryFlags.flags[q.country]} alt=""/> {name(q.country)}のお土産</h2></div><button type="button" autoFocus aria-label="閉じる" onClick={()=>setShowShop(false)}>×</button></header><div className="wj-shop-balance">💰 残高 <b>{game.teams[game.turn].money.toLocaleString()}</b> TPM <small>ゲーム内の記念品です・購入額を資産に計上</small></div><div className="wj-shop-grid">{souvenirsForCountry(q.country).map(item=>{const team=game.teams[game.turn],owned=team.souvenirs.some(x=>x.id===item.id&&x.country===q.country);return <article key={item.id}><div className="wj-item-art" aria-hidden="true">{item.icon}</div><h3>{item.label}</h3><p>{item.description}</p><button type="button" disabled={!canControl||owned||team.money<item.cost} onClick={()=>{playUiSound('coin');if(roomAction)roomAction('buy',{item:item.id});else setGame(g=>g.question?.id===q.id&&g.turn===game.turn?buySouvenir(g,item.id):g);}}>{owned?'✓ ゲット！':team.money<item.cost?'TPM不足':item.cost+' TPM で購入'}</button></article>})}</div><button type="button" className="wg-primary wj-shop-close" onClick={()=>setShowShop(false)}>冒険に戻る →</button></section></div>}
 {journeyReview&&explainOpen&&<div className="wj-shop-overlay" role="dialog" aria-modal="true" aria-label="解説全文"><section className="wj-shop-modal wj-reading-modal"><h2>解説</h2><p>{read(q.explanation)}</p><button className="wg-primary" onClick={()=>setExplainOpen(false)}>閉じる</button></section></div>}

 </section>;
}

function ClassroomResults({game}){
 const report=useMemo(()=>classroomReport(game),[game]);
 const [filter,setFilter]=useState('review');
 const [notice,setNotice]=useState('');
 const items=filter==='review'?report.review:report.questions;
 const download=()=>{
  try{
   const url=URL.createObjectURL(new Blob([classroomReportCsv(report)],{type:'text/csv;charset=utf-8'}));
   const link=document.createElement('a');
   link.href=url;link.download='timepalette-world-games-'+new Date().toISOString().slice(0,10)+'.csv';
   document.body.appendChild(link);link.click();link.remove();
   window.setTimeout(()=>URL.revokeObjectURL(url),30000);
   setNotice('CSVのダウンロードを開始しました。');
  }catch{setNotice('CSVを保存できませんでした。端末の設定を確認してください。');}
 };
 const percent=r=>r===null?'—':r+'%';
 return <section className="wg-class-report" aria-label="授業結果分析">
  <header><div><small>CLASSROOM INSIGHTS</small><h2>授業結果分析</h2><p>正答率は回答機会数を基準に集計。未回答も含みます。</p></div><button className="wg-primary" onClick={download}>CSVを保存</button></header>
  <p role="status">{notice}</p>
  <div className="wg-report-metrics">
   {[['正答率',percent(report.total.rate)],['正解',report.total.correct],['不正解',report.total.incorrect],['未回答',report.total.unanswered]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}
  </div>
  <div className="wg-report-columns">
   <section><h3>チーム別</h3>{report.teams.map(t=><div className="wg-report-stat" key={t.id}><div><b>{t.name}</b><strong>{percent(t.rate)}</strong></div><div className="wg-report-track"><i style={{width:(t.rate||0)+'%'}}/></div><small>{t.correct}/{t.attempts} 正解 · {t.unanswered} 未回答</small></div>)}</section>
   <section><h3>カテゴリー別</h3>{report.domains.map(d=><div className="wg-report-stat" key={d.domain}><div><b>{DOMAINS.find(x=>x[0]===d.domain)?.[1]||d.domain}</b><strong>{percent(d.rate)}</strong></div><div className="wg-report-track"><i style={{width:(d.rate||0)+'%'}}/></div><small>{d.correct}/{d.attempts} 正解</small></div>)}</section>
  </div>
  <h3>問題別・復習ポイント</h3><div className="wg-row"><button aria-pressed={filter==='review'} onClick={()=>setFilter('review')}>要復習（{report.review.length}）</button><button aria-pressed={filter==='all'} onClick={()=>setFilter('all')}>全問題（{report.questions.length}）</button></div>
  {items.length===0&&<p>復習が必要な問題はありません。</p>}
  <div className="wg-report-questions">{items.map(q=><details key={q.id}><summary><span>Q{q.round} · {flag(q.country)} {q.prompt}</span><strong>{percent(q.rate)}</strong></summary><p>正解：{q.correctAnswer}</p><p>{q.explanation}</p><div className="wg-report-responses">{q.responses.map(r=><div key={r.teamId}><b>{r.teamName}</b><span>{r.status==='correct'?'✓ 正解':r.status==='unanswered'?'— 未回答':'× 不正解'}{r.answer?' · '+r.answer:''}</span></div>)}</div></details>)}</div>
  <p className="wg-note">このゲームの結果のみを集計します。CSVは端末に保存され、サーバーに送信しません。学習活動の参考用であり、個人の成績を認証する機能ではありません。</p>
 </section>;
}

export default function WorldGameHub({onBackHome,initialMode}){
 const [preset]=useState(readPreset);
 const [grade,setGrade]=useState(SCHOOL_LEVELS.some(([id])=>id===preset.grade)?preset.grade:'all');
 const [school,setSchool]=useState({questions:[],index:{}}),[schoolStatus,setSchoolStatus]=useState('loading');
 const [schoolRetry,setSchoolRetry]=useState(0);
 useEffect(()=>{let active=true;setSchoolStatus('loading');loadSchoolQuestionBank().then(data=>{if(active){setSchool(data);setSchoolStatus('ready');}}).catch(()=>{if(active)setSchoolStatus('error');});return()=>{active=false;};},[schoolRetry]);
 const [includePractice,setIncludePractice]=useState(preset.includePractice!==false),[practice,setPractice]=useState([]),[practiceStatus,setPracticeStatus]=useState('loading');
 const [practiceRetry,setPracticeRetry]=useState(0);
 useEffect(()=>{let active=true;setPracticeStatus('loading');loadAiaPracticeBank().then(items=>{if(active){setPractice(items);setPracticeStatus('ready');}}).catch(()=>{if(active)setPracticeStatus('error');});return()=>{active=false;};},[practiceRetry]);
 const allBank=useMemo(()=>[...baseBank,...school.questions,...(includePractice?practice:[])].map(q=>provisionalGrade(q,school.index)),[includePractice,practice,school]);
 const bank=useMemo(()=>grade==='all'?allBank:allBank.filter(q=>q.gradeBand===grade),[allBank,grade]);
 const [online,setOnline]=useState(false);
 const [step,setStep]=useState(0),[countryPage,setCountryPage]=useState(0);
 const [mode,setMode]=useState(MODES.some(m=>m.id===initialMode)?initialMode:MODES.some(m=>m.id===preset.mode)?preset.mode:'shuffle'),[selected,setSelected]=useState(()=>Array.isArray(preset.selected)?preset.selected.filter(iso=>byIso[iso]):countries.map(c=>c.iso)),[domains,setDomains]=useState(()=>Array.isArray(preset.domains)?preset.domains.filter(id=>DOMAINS.some(d=>d[0]===id)):DOMAINS.map(d=>d[0]));
 const [search,setSearch]=useState(''),[limit,setLimit]=useState([5,10,20,30,50].includes(preset.limit)?preset.limit:10),[teams,setTeams]=useState(Number.isInteger(preset.teams)&&preset.teams>=2&&preset.teams<=8?preset.teams:2),[teacher,setTeacher]=useState(preset.teacher===true),[game,setGame]=useState(null);
 const [timer,setTimer]=useState([0,15,30,60].includes(preset.timer)?preset.timer:0),[teamNames,setTeamNames]=useState(Array.isArray(preset.teamNames)?preset.teamNames.slice(0,8):[]),[saved,setSaved]=useState('');
 const [questionLanguage,setQuestionLanguage]=useState(preset.questionLanguage==='en'?'en':'ja');
 const regions=useMemo(()=>[...new Set(countries.map(c=>c.region))].sort(),[]);
 const rawPool=useMemo(()=>questionPool(bank,selected,domains),[bank,selected,domains]);
 const pool=useMemo(()=>rawPool.map(q=>localizeQuestion(q,questionLanguage)).filter(Boolean),[rawPool,questionLanguage]);
 const selectedSet=new Set(selected);
 const filteredCountries=countries.filter(c=>(c.nameJa+' '+c.nameEn+' '+c.iso).toLowerCase().includes(search.toLowerCase()));
 const pageSize=12, maxPage=Math.max(0,Math.ceil(filteredCountries.length/pageSize)-1), shownPage=Math.min(countryPage,maxPage);
 const selectedMode=MODES.find(m=>m.id===mode);
 const actualLimit=playableLimit(mode,limit,pool.length,teams);
 const [sound,setSound]=useState(getUiSoundEnabled);
 const [full,setFull]=useState(false),[fullNotice,setFullNotice]=useState('');
 useEffect(()=>{const sync=()=>setFull(!!document.fullscreenElement);document.addEventListener('fullscreenchange',sync);return()=>document.removeEventListener('fullscreenchange',sync);},[]);
 const fullscreen=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else setFullNotice('この端末ではブラウザの全画面機能を使用してください。');}catch{setFullNotice('全画面に切り替えられませんでした。');}};
 const [journeySpeed,setJourneySpeed]=useState(preset.journeySpeed==='fast'?'fast':'slow');
 const [diceCount,setDiceCount]=useState([1,2,3].includes(preset.diceCount)?preset.diceCount:1);
 const [strategy,setStrategy]=useState(preset.strategy!==false),[travelEconomy,setTravelEconomy]=useState(preset.travelEconomy!==false);
 const [roomLobby,setRoomLobby]=useState(false);
 const session=useJourneyRoom({game,setGame,config:{speed:journeySpeed,teacher,timer},onGuestGame:(state,cfg)=>{setJourneySpeed(cfg.speed);setTeacher(cfg.teacher);setTimer(cfg.timer);setGame(state);setRoomLobby(false);}});
 const wizardSteps=[{id:'region',title:'冒険する地域・国',icon:'🌍',desc:'好きな地域・国を選ぼう。最初は全世界！'},{id:'learning',title:'出題内容を選ぼう',icon:'📚',desc:'言語・学年・カテゴリーを選択。'},{id:'rules',title:'プレイ設定',icon:'🎮',desc:'問題数、チーム数やゲームのルールを設定。'},{id:'confirm',title:'出発の準備',icon:'🚀',desc:'チーム名と設定を確認して、ゲームを始めよう！'}];
 const currentStep=wizardSteps[Math.min(step,3)],stepId=currentStep.id,lastStep=stepId==='confirm';
 const stepBlocked=(stepId==='region'&&!selected.length)||(stepId==='learning'&&(!pool.length||(includePractice&&practiceStatus==='loading')||schoolStatus==='loading'));
 const chooseAllDomains=()=>setDomains(DOMAINS.map(([id])=>id));
 const toggle=iso=>setSelected(s=>s.includes(iso)?s.filter(x=>x!==iso):[...s,iso]);
 const toggleRegion=region=>{const ids=countries.filter(c=>c.region===region).map(c=>c.iso);setSelected(s=>ids.every(x=>s.includes(x))?s.filter(x=>!ids.includes(x)):[...new Set([...s,...ids])]);};
 const start=()=>{if(actualLimit){playUiSound('open');setGame(createGame({mode,pool,limit,teamCount:teams,teamNames:Array.from({length:teams},(_,i)=>teamNames[i]||'チーム '+(i+1)),geo,strategy,travelEconomy,diceCount}));}};
 const save=()=>setSaved(persistPreset({mode,selected,domains,limit,teams,teacher,timer,teamNames,strategy,travelEconomy,questionLanguage,diceCount,journeySpeed,includePractice,grade})?'この端末に設定を保存しました。':'設定を保存できませんでした。');
 const replay=()=>{const missed=missedQuestions(game);if(missed.length)setGame(createGame({mode:'shuffle',pool:missed,limit:missed.length}));};
 const exit=()=>{if(!game||game.phase==='finished'||window.confirm('現在のゲームを終了しますか？')){session.close();setRoomLobby(false);setGame(null);setStep(0);}};
 if(online&&ONLINE_ENDPOINT)return <OnlineBattle endpoint={ONLINE_ENDPOINT} config={{teamNames:Array.from({length:teams},(_,i)=>String(teamNames[i]||"").trim()||"TEAM "+(i+1)),limit,seconds:timer,language:questionLanguage,countries:selected,domains}} onBack={()=>setOnline(false)}/>;
 return <main className={"wg-shell wg-bright wg-arcade wg-theme-"+(game?.mode||mode)+(game?" wg-playing":" wg-setup")+(game?.mode==='journey'?' wj-full-map':'')}>
 {(!game||game.mode!=='journey')&&<header className="wg-top"><button className="wg-back" onClick={game?exit:onBackHome}>← {game?'ゲーム設定':'ホーム'}</button><span>TIMEPALETTE / WORLD GAMES</span><div className="wg-top-actions"><button className="wg-back" onClick={fullscreen}>{full?'全画面解除':'⛶ 全画面'}</button><button className="wg-back" aria-pressed={sound} onClick={()=>{setUiSoundEnabled(!sound);setSound(!sound);}}> {sound?'🔊 効果音 ON':'🔇 効果音 OFF'}</button></div></header>}{fullNotice&&<div className="wg-full-notice" role="status" onClick={()=>setFullNotice('')}>{fullNotice}</div>}
 {!game?<><div className="wg-mode-splash"><img src={import.meta.env.BASE_URL+'world-activities/'+mode+'.webp'} alt=""/><div><span>LET'S PLAY</span><h1>{selectedMode.name}</h1><p>{selectedMode.desc}</p></div></div>
 
 <div className="wg-overlay wg-setup-overlay"><section className={"wg-settings wg-wizard wg-guided-wizard wg-quick-wizard wg-quick-"+stepId} role="dialog" aria-modal="true" aria-label={selectedMode.name+' の設定'}><header className="wg-wizard-head"><div><small>{selectedMode.name} · STEP {step+1} / {wizardSteps.length}</small><h2>{currentStep.icon} {currentStep.title}</h2><p className="ws-step-description">{currentStep.desc}</p></div><button className="wg-back" onClick={onBackHome}>× ホーム</button></header>
 <div className="wg-guided-progress" role="progressbar" aria-label="設定の進み具合" aria-valuenow={step+1} aria-valuemin={1} aria-valuemax={wizardSteps.length}><i style={{width:(step+1)/wizardSteps.length*100+'%'}}/></div>
 <div className="wg-wizard-body wg-guided-body" key={stepId}>
 {!initialMode&&stepId==='region'&&<label className="wg-label">ゲーム<select value={mode} onChange={e=>setMode(e.target.value)}>{MODES.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>}
 {stepId==='region'&&<>{mode==='journey'&&<button className="wj-room-launch" onClick={()=>setRoomLobby(true)}>🌐 別端末のルームにコードで参加</button>}{mode==='battle'&&ONLINE_ENDPOINT&&<button className="wg-back" onClick={()=>setOnline(true)}>オンライン対戦（限定テスト）</button>}<div className="wg-row wg-selection-actions"><button onClick={()=>setSelected(countries.map(c=>c.iso))}>🌐 全世界</button><button onClick={()=>setSelected([])}>すべて解除</button><b>{selected.length}か国・地域</b></div><div className="wg-guided-regions">{regions.map(r=>{const all=countries.filter(c=>c.region===r);const n=all.filter(c=>selectedSet.has(c.iso)).length;return <button key={r} aria-pressed={n===all.length} onClick={()=>toggleRegion(r)}><span>{{Asia:'🌏',Europe:'🌍',Africa:'🌍',Americas:'🌎',Oceania:'🌊',Atlantic:'🌊','Indian Ocean':'🌊'}[r]||'🌐'}</span><strong>{regionLabels[r]||r}</strong><small>{n}/{all.length}か国</small></button>;})}</div></>}
 {stepId==='region'&&<><label className="wg-label">個別の国を選ぶ<input value={search} onChange={e=>{setSearch(e.target.value);setCountryPage(0);}} placeholder="国名・英語名・国コード"/></label><div className="wg-country-grid">{filteredCountries.slice(shownPage*pageSize,(shownPage+1)*pageSize).map(c=><button key={c.iso} aria-pressed={selectedSet.has(c.iso)} onClick={()=>toggle(c.iso)}><img className="wg-country-flag" src={countryFlags.flags[c.iso]} alt=""/><span>{c.nameJa}</span><span className="wg-country-selected" aria-hidden="true">{selectedSet.has(c.iso)?'✓':'+'}</span></button>)}</div><div className="wg-page-controls"><button disabled={shownPage===0} onClick={()=>setCountryPage(shownPage-1)}>← 前</button><span>{shownPage+1} / {maxPage+1}</span><button disabled={shownPage===maxPage} onClick={()=>setCountryPage(shownPage+1)}>次 →</button></div></>}
 {stepId==='learning'&&<><h3 className="wg-quick-label">出題言語</h3><div className="wg-guided-choices wg-quick-language"><button aria-pressed={questionLanguage==='ja'} onClick={()=>setQuestionLanguage('ja')}><span>🇯🇵</span><strong>日本語</strong><small>問題・選択肢・解説を日本語で</small></button><button aria-pressed={questionLanguage==='en'} onClick={()=>setQuestionLanguage('en')}><span>🌐</span><strong>English</strong><small>Questions, choices and explanations in English</small></button></div></>}
 {stepId==='learning'&&<><h3 className="wg-quick-label">学年</h3><div className="wg-guided-choices wg-school-choices">{SCHOOL_LEVELS.map(([id,label,icon])=><button key={id} aria-pressed={grade===id} onClick={()=>setGrade(id)}><span>{icon}</span><strong>{label}</strong><small>{id==='elementary'?'漢字に振り仮名':id==='middle'?'基礎から応用':id==='high'?'データ・探究問題':'全レベル'} · {allBank.filter(q=>(id==='all'||q.gradeBand===id)&&selectedSet.has(q.country)&&localizeQuestion(q,questionLanguage)).length.toLocaleString()}問</small></button>)}</div><p role="status">{schoolStatus==='loading'?'学年別教材を読み込み中…':schoolStatus==='error'?'学年別教材を読み込めませんでした。':'独自1,008問を追加。既存問題の学年区分は暫定で、内容の精査を継続中です。'}</p>{schoolStatus==='error'&&<button onClick={()=>setSchoolRetry(n=>n+1)}>再読み込み</button>}</>}
 {stepId==='learning'&&<><h3 className="wg-quick-label">カテゴリー</h3><div className="wg-row wg-selection-actions"><button onClick={chooseAllDomains}>✓ 全選択</button><button onClick={()=>setDomains([])}>すべて解除</button><button type="button" aria-pressed={includePractice} onClick={()=>setIncludePractice(v=>!v)}>📚 追加学習問題 {includePractice?'ON':'OFF'}</button><small role="status">{practiceStatus==='loading'?'追加教材を読み込み中…':practiceStatus==='error'?'追加教材の読み込みに失敗しました。':includePractice?'118か国・4,720問の日英対応補足問題（内容・翻訳確認中）':'従来の確認済み問題のみ'}</small>{practiceStatus==='error'&&<button onClick={()=>setPracticeRetry(n=>n+1)}>再読み込み</button>}</div><div className="wg-domain-cards">{DOMAINS.map(([id,label],i)=>{const count=bank.filter(q=>q.domain===id&&selectedSet.has(q.country)&&localizeQuestion(q,questionLanguage)).length;return <button key={id} disabled={!count} aria-pressed={domains.includes(id)&&!!count} onClick={()=>setDomains(d=>d.includes(id)?d.filter(x=>x!==id):[...d,id])}><span className="wg-domain-icon" aria-hidden="true">{['🌍','🕒','💬','🎨','🤝','💡'][i]}</span><strong>{label}</strong><small>{count?count.toLocaleString()+'問':'準備中'}</small><span className="wg-domain-check" aria-hidden="true">{count&&domains.includes(id)?'✓':''}</span></button>;})}</div></>}
 {stepId==='rules'&&<section className="wg-quick-rule"><h3>🎯 クイズの数</h3><div className="wg-guided-choices wg-guided-numbers">{[5,10,20,30,50].map(n=><button key={n} aria-pressed={limit===n} onClick={()=>setLimit(n)}><strong>{n}</strong><small>問</small></button>)}</div></section>}
 {stepId==='rules'&&mode!=='shuffle'&&<section className="wg-quick-rule"><h3>👥 チームの数</h3><div className="wg-guided-choices wg-guided-numbers">{[2,3,4,5,6,7,8].map(n=><button key={n} aria-pressed={teams===n} onClick={()=>setTeams(n)}><span>👥</span><strong>{n}</strong><small>チーム</small></button>)}</div></section>}
 {stepId==='rules'&&<section className="wg-quick-rule"><h3>⏱️ 考える時間</h3><div className="wg-guided-choices wg-guided-numbers">{[0,15,30,60].map(n=><button key={n} aria-pressed={timer===n} onClick={()=>setTimer(n)}><span>⏱️</span><strong>{n||'なし'}</strong><small>{n?'秒':'制限なし'}</small></button>)}</div></section>}
 {stepId==='rules'&&<section className="wg-quick-rule"><h3>正解発表</h3><div className="wg-guided-choices"><button aria-pressed={!teacher} onClick={()=>setTeacher(false)}><span>⚡</span><strong>自動で発表</strong><small>答えるとすぐ正解がわかる</small></button><button aria-pressed={teacher} onClick={()=>setTeacher(true)}><span>🎓</span><strong>先生モード</strong><small>先生が正解発表を操作</small></button></div></section>}
 {stepId==='rules'&&mode==='territory'&&<section className="wg-quick-rule"><h3>陣取りルール</h3><div className="wg-guided-choices"><button aria-pressed={strategy} onClick={()=>setStrategy(true)}><span>🗺️</span><strong>戦略モード</strong><small>隣接国・地域を攻略</small></button><button aria-pressed={!strategy} onClick={()=>setStrategy(false)}><span>🌍</span><strong>自由探索</strong><small>好きな国に挑戦</small></button></div></section>}
 {stepId==='rules'&&mode==='journey'&&<section className="wg-quick-rule"><h3>🎲 サイコロの数</h3><div className="wg-guided-choices wg-guided-dice">{[1,2,3].map(n=><button key={n} aria-pressed={diceCount===n} onClick={()=>setDiceCount(n)}><span>{'🎲'.repeat(n)}</span><strong>{n}個</strong><small>サイコロ</small></button>)}</div></section>}
 {stepId==='rules'&&mode==='journey'&&<section className="wg-quick-rule"><h3>旅のスピード</h3><div className="wg-guided-choices"><button aria-pressed={journeySpeed==='slow'} onClick={()=>setJourneySpeed('slow')}><span>🐢</span><strong>ゆっくり</strong><small>景色を楽しむ</small></button><button aria-pressed={journeySpeed==='fast'} onClick={()=>setJourneySpeed('fast')}><span>⚡</span><strong>スピード</strong><small>テンポよく遊ぶ</small></button></div></section>}
 {stepId==='rules'&&mode==='journey'&&<section className="wg-quick-rule"><h3>旅の通貨・お土産</h3><div className="wg-guided-choices"><button aria-pressed={travelEconomy} onClick={()=>setTravelEconomy(true)}><span>🎁</span><strong>旅行・通貨 ON</strong><small>移動パス・お土産を集める</small></button><button aria-pressed={!travelEconomy} onClick={()=>setTravelEconomy(false)}><span>🎲</span><strong>シンプル</strong><small>クイズとすごろくに集中</small></button></div></section>}
 {lastStep&&<>{mode!=='shuffle'&&<div className="wg-quick-team-grid">{Array.from({length:teams},(_,i)=><label key={i}><span style={{'--team':['#2563eb','#dc2626','#059669','#d97706','#7c3aed','#0891b2','#db2777','#475569'][i]}}>👥 チーム {i+1}</span><input aria-label={'チーム '+(i+1)+' の名前'} maxLength={24} value={teamNames[i]||''} placeholder={'チーム '+(i+1)} onChange={e=>setTeamNames(old=>{const a=[...old];a[i]=e.target.value;return a;})}/></label>)}</div>}<div className="wg-launch-summary"><div><span>🌍 エリア</span><b>{selected.length}か国</b></div><div><span>💬 言語</span><b>{questionLanguage==='en'?'English':'日本語'}</b></div><div><span>🎓 学年</span><b>{SCHOOL_LEVELS.find(([id])=>id===grade)?.[1]}</b></div><div><span>📚 カテゴリー</span><b>{domains.length}種類</b></div><div><span>🎯 出題数</span><b>{actualLimit}問</b></div>{mode!=='shuffle'&&<div><span>👥 チーム</span><b>{teams}組</b></div>}<div><span>⏱ 時間</span><b>{timer?timer+'秒':'なし'}</b></div>{mode==='journey'&&<><div><span>🎲 サイコロ</span><b>{diceCount}個</b></div><div><span>🚗 スピード</span><b>{journeySpeed==='slow'?'ゆっくり':'高速'}</b></div></>}</div><div className="wg-row"><button onClick={save}>この授業の設定を保存</button><small role="status">{saved}</small></div>{['territory','journey'].includes(mode)&&<p className="wg-note">公平な対戦：{actualLimit?'各チーム '+actualLimit/teams+' ターン':'問題数を増やすかチーム数を減らしてください。'}</p>}</>}
 </div><footer className="wg-wizard-footer"><div><b>{pool.length.toLocaleString()}問</b><small>利用可能 · 今回 {actualLimit}問</small></div><div className="wg-row">{step>0&&<button onClick={()=>setStep(step-1)}>← 戻る</button>}{!lastStep?<button className="wg-primary" disabled={stepBlocked} onClick={()=>setStep(step+1)}>次へ →</button>:<>{mode==='journey'&&<button className="wj-room-launch" disabled={!actualLimit||schoolStatus==='loading'||(includePractice&&practiceStatus==='loading')} onClick={()=>{session.openHost(teams);setRoomLobby(true);}}>🌐 端末対戦ルームを作成</button>}<button className="wg-primary" disabled={!actualLimit||schoolStatus==='loading'||(includePractice&&practiceStatus==='loading')} onClick={start}>🚀 ゲーム開始 →</button></>}</div></footer></section></div></>:<>
 {game.mode!=='journey'&&<><div className="wg-game-title"><h1>{MODES.find(m=>m.id===game.mode)?.name}</h1><span>{Math.min(game.round+1,game.limit)} / {game.limit}</span></div><div className="wg-game-progress" role="progressbar" aria-label="ゲーム進捗" aria-valuemin={0} aria-valuemax={game.limit} aria-valuenow={game.round}><i style={{width:game.round/game.limit*100+'%'}}/></div><Scoreboard game={game}/></>}
 {game.phase==='finished'?<div className="wg-overlay wg-results-overlay" role="dialog" aria-modal="true" aria-label="ゲーム結果"><section className="wg-settings wg-results-panel"><h2>🏆 GAME COMPLETE</h2>{standings(game).map(t=><div key={t.id} className="wg-result"><div><strong>{teamRank(game,t)}位 · {t.name}</strong><small>{t.correctCount}/{t.attempts} 正解 · 最大{t.bestStreak}連続正解</small>{game.mode==='journey'&&<small>{t.visits.map(iso=>flag(iso)+' '+name(iso)).join(' · ')||'訪問なし'} · 現金{t.money} TPM · 記念品{t.souvenirs.length}個</small>}</div><span>{game.mode==='territory'?t.territories+'か国':game.mode==='journey'?t.assets+' TPM（総資産）':t.score+' pts'}</span></div>)}<div className="wg-row"><button className="wg-primary" onClick={exit}>設定に戻る</button>{!session.room&&missedQuestions(game).length>0&&<button onClick={replay}>間違えた{missedQuestions(game).length}問を復習</button>}</div><ClassroomResults game={game}/><details className="wg-review"><summary>今回の全問題と解説（{game.history.length}問）</summary>{game.history.map((row,i)=><article key={row.question.id}><b>{i+1}. {row.question.prompt}</b><p>{row.question.language==='en'?'Answer: ':'正解：'}{row.question.choices[row.question.correctIndex]}</p><small>{row.question.explanation}</small></article>)}</details></section></div>:<>
 {game.mode==='territory'&&<><h2 className="wg-turn">{game.teams[game.turn].name} のターン</h2><TerritoryMap game={game} onPick={iso=>setGame(g=>selectTerritory(g,iso))}/></>}
 {game.mode==='journey'&&<JourneyBoard game={game} scoreboard={<Scoreboard game={game}/>} onExit={exit} sound={sound} onToggleSound={()=>{setUiSoundEnabled(!sound);setSound(!sound);}} full={full} onFullscreen={fullscreen} onSpeedChange={setJourneySpeed} speed={journeySpeed} countryName={name} countryFlag={flag} canControl={session.canControl} remoteRoll={session.roll} onRequestRoll={session.room?travel=>session.action('roll',{travel}):null} roomLabel={session.room?(session.notice||('🌐 '+session.room.code+' · '+(session.room.role==='host'?'ホスト':'チーム '+(session.room.team+1)))):null} onRoll={(travel,die)=>setGame(g=>rollJourney(g,die,Math.random,g.travelEconomy?travel:'standard'))}/>}
 {game.question&&<div className="wg-overlay wg-quiz-overlay" role="dialog" aria-modal="true" aria-label="クイズ・解説"><QuizCard key={game.question.id+'-'+(game.mode==='battle'&&game.phase==='question'?game.turn:'review')} game={game} setGame={setGame} teacher={teacher} timer={timer} canControl={session.canControl} hostTimer={session.room?.role!=='guest'} roomAction={session.room?session.action:null}/></div>}
 </>}</>}
 {roomLobby&&<JourneyRoomLobby session={session} teamNames={teamNames} onClose={()=>{session.close();setRoomLobby(false);}} onStart={()=>{setRoomLobby(false);start();}}/>}
 {game&&session.room?.role==='guest'&&session.room.status==='error'&&<div className="wj-room-overlay"><section className="wj-room-panel" role="alertdialog" aria-label="接続が切れました"><h2>接続が切れました</h2><p>{session.notice}</p><button className="wg-primary" onClick={()=>{session.close();setGame(null);setStep(0);}}>設定に戻る</button></section></div>}
 </main>;
}
