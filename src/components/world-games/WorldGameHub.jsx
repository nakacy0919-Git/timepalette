import {useEffect,useMemo,useState} from 'react';
import {ComposableMap,Geographies,Geography,Marker} from 'react-simple-maps';
import worldAtlas from 'world-atlas/countries-110m.json';
import {getLiveWorldLearningCountries} from '../../utils/worldLearningRegistry';
import {getGeography197Profile} from '../../utils/geography197';
import {makeLocalGameBank} from '../../utils/worldGameBank';
import {localizeQuestion} from '../../utils/worldGameLanguage';
import {questionPool,createGame,selectTerritory,rollJourney,answerGame,advanceGame,standings,missedQuestions,teamRank,availableTerritories,playableLimit,buySouvenir,classroomReport,classroomReportCsv} from '../../utils/worldGameEngine';
import {getUiSoundEnabled,setUiSoundEnabled,playUiSound} from '../../utils/uiSound';
import {TRAVEL_MODES,SOUVENIRS,territoryChoices,regionalCollections,journeyAssets} from '../../utils/worldGameStrategy';
import './worldGameHub.css';
import OnlineBattle from './OnlineBattle.jsx';
import JourneyBoard from './JourneyBoard.jsx';
import {journeyStop} from '../../utils/worldJourneyStops.js';
import './brightWorldGames.css';
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
const bank=makeLocalGameBank(countries);
const domainEn={place:'Geography',time:'Time & Time Zones',language:'Language',lifeCulture:'Life & Culture',japanConnection:'Connections with Japan',thinkConnect:'Think & Connect'};
const geo=Object.fromEntries(countries.map(c=>{const p=getGeography197Profile(c.iso);return [c.iso,{center:p?.center,neighbors:(p?.neighbors||[]).map(n=>n.iso),region:c.region}];}));
const PRESET_KEY='timepalette.worldgames.settings.v2';
function readPreset(){try{return JSON.parse(localStorage.getItem(PRESET_KEY)||'null')||{};}catch{return {};}}
function persistPreset(preset){try{localStorage.setItem(PRESET_KEY,JSON.stringify(preset));return true;}catch{return false;}}
const regionLabels={Asia:'アジア',Europe:'ヨーロッパ',Africa:'アフリカ',Americas:'南北アメリカ',Oceania:'オセアニア'};
const name=iso=>byIso[iso]?.nameJa||iso;
const flag=iso=>byIso[iso]?.flagEmoji||'🌐';
function Scoreboard({game}){
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
function QuizCard({game,setGame,teacher,timer}){
 const english=game.question?.language==='en';
 const tr=(ja,en)=>english?en:ja;
 const [choice,setChoice]=useState(null);
 const [ready,setReady]=useState(game.mode!=='battle'||game.phase==='review');
 const [seconds,setSeconds]=useState(timer);
 const [paused,setPaused]=useState(false);
 const active=ready&&game.phase==='question'&&timer>0;
 useEffect(()=>{
  if(!active||paused||seconds<=0)return;
  const id=window.setTimeout(()=>setSeconds(n=>Math.max(0,n-1)),1000);
  return ()=>clearTimeout(id);
 },[active,paused,seconds]);
 useEffect(()=>{
  if(active&&seconds===0&&!teacher)setGame(g=>g.question?.id===game.question?.id&&g.turn===game.turn?answerGame(g,-1):g);
 },[active,seconds,teacher,setGame,game.question?.id,game.turn]);
 const q=game.question,review=game.phase==='review';
 useEffect(()=>{if(review)playUiSound(game.mode==='battle'?'success':game.last?.correct?'correct':'wrong');},[review,game.mode,game.last]);
 if(!q)return null;
 const record=i=>setGame(g=>g.question?.id===q.id&&g.turn===game.turn?answerGame(g,i):g);
 const choose=i=>{if(review)return;playUiSound('tap');if(teacher)setChoice(i);else record(i);};
 const submit=()=>{if(choice!==null)record(choice);};
 const correct=q.correctIndex;
 if(!ready&&!review)return <section className="wg-question wg-handoff"><div aria-hidden="true">🛡️</div><h2>{english?game.teams[game.turn].name+"'s turn":game.teams[game.turn].name+' の番です'}</h2><p>{tr('他のチームから回答が見えないように端末を渡してください。','Pass the device to the next team without revealing your answer.')}</p><button className="wg-primary" onClick={()=>setReady(true)}>{tr('回答を始める','Start answering')}</button></section>;
 return <section className={'wg-question '+(teacher?'teacher':'')} aria-label={tr("クイズ","Quiz")} lang={english?"en":"ja"}>
 <header><span>{flag(q.country)} {english?(byIso[q.country]?.nameEn||q.country):name(q.country)} · {english?domainEn[q.domain]:DOMAINS.find(d=>d[0]===q.domain)?.[1]}</span><span>{game.round+1} / {game.limit}</span></header>
 {game.mode==='battle'&&!review&&<p className="wg-turn">{tr('回答者：','Answering team: ')}{game.teams[game.turn].name}{tr('（他チームは回答を見ないようにしてください）',' (Keep your answer private.)')}</p>}
 {active&&<div className="wg-timer"><div><strong>{seconds}{tr('秒',' sec')}</strong><span>{seconds===0?tr('時間終了','Time is up'):paused?tr('一時停止中','Paused'):tr('考える時間','Time to think')}</span>{teacher&&seconds>0&&<button onClick={()=>setPaused(p=>!p)}>{paused?tr('再開','Resume'):tr('一時停止','Pause')}</button>}</div><div className="wg-timer-track"><i style={{width:(seconds/timer*100)+'%'}}/></div></div>}
 <h2>{q.prompt}</h2><div className="wg-options">{q.choices.map((label,i)=><button key={i} disabled={review} aria-pressed={!review&&choice===i} className={review?(i===correct?'correct':Object.values(game.answers).includes(i)?'wrong':''):choice===i?'selected':''} onClick={()=>choose(i)}><b>{'ABCD'[i]}</b><span>{label}</span></button>)}</div>
 {teacher&&!review&&<div className="wg-row"><button className="wg-primary" disabled={choice===null} onClick={submit}>{game.mode==='battle'?tr('回答を確定','Submit answer'):tr('正解を発表','Reveal answer')}</button><button onClick={()=>record(-1)}>{tr('パス・正解を確認','Pass / reveal')}</button></div>}
 {review&&<div className="wg-feedback" role="status"><h3>{game.mode==='battle'?tr('正解発表','Answer reveal'):game.last.correct?tr('正解！','Correct!'):tr('正解を確認しよう','Let’s check the answer')}</h3><strong>{q.choices[correct]}</strong><p>{q.explanation}</p>
 {game.last?.transfer&&<p className="wg-reward">🏳️ エリア獲得！</p>}{game.last?.newRegions?.map(r=><p key={r.region} className="wg-reward">🏅 {regionLabels[r.region]||r.region} 選択範囲達成 · +200 pts</p>)}
 {game.mode==='journey'&&game.last?.correct&&<p className="wg-reward">🪙 +300 TPM 獲得！</p>}
 {game.mode==='journey'&&game.travelEconomy&&<div className="wg-shop"><h4>🎁 {name(q.country)} の旅の記念品</h4><p>保有 {game.teams[game.turn].money} TPM · 記念品は資産として計上（購入額と同額）</p><div className="wg-travel-options">{SOUVENIRS.map(item=>{const team=game.teams[game.turn],owned=team.souvenirs.some(x=>x.id===item.id&&x.country===q.country);return <button key={item.id} disabled={owned||team.money<item.cost} onClick={()=>{playUiSound('tap');setGame(g=>g.question?.id===q.id&&g.turn===game.turn?buySouvenir(g,item.id):g);}}><b>{item.icon} {item.label}</b><small>{owned?'購入済み':item.cost+' TPM'}</small></button>})}</div></div>}
 {game.mode==='battle'&&<p>{game.teams.map(t=>t.name+'：'+(game.answers[t.id]===correct?tr('正解','Correct'):game.answers[t.id]===-1?tr('未回答','No answer'):tr('不正解','Incorrect'))).join(' ／ ')}</p>}
 <small>{tr('教材：','Source: ')}{q.origin||'TimePalette'}{q.sources?.filter(s=>typeof s==='string'&&s.startsWith('https://')).map(s=><a key={s} href={s} target="_blank" rel="noreferrer"> · {tr('出典','Reference')}</a>)}</small>
 <button className="wg-primary" onClick={()=>setGame(advanceGame)}>{game.round+1===game.limit?tr('結果を見る','See results'):tr('次へ','Next')}</button></div>}
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
 const [online,setOnline]=useState(false);
 const [step,setStep]=useState(0),[countryPage,setCountryPage]=useState(0),[teamPage,setTeamPage]=useState(0);
 const [mode,setMode]=useState(MODES.some(m=>m.id===initialMode)?initialMode:MODES.some(m=>m.id===preset.mode)?preset.mode:'shuffle'),[selected,setSelected]=useState(()=>Array.isArray(preset.selected)?preset.selected.filter(iso=>byIso[iso]):countries.map(c=>c.iso)),[domains,setDomains]=useState(()=>Array.isArray(preset.domains)?preset.domains.filter(id=>DOMAINS.some(d=>d[0]===id)):['place','time']);
 const [search,setSearch]=useState(''),[limit,setLimit]=useState([5,10,20,30,50].includes(preset.limit)?preset.limit:10),[teams,setTeams]=useState(Number.isInteger(preset.teams)&&preset.teams>=2&&preset.teams<=8?preset.teams:2),[teacher,setTeacher]=useState(preset.teacher===true),[game,setGame]=useState(null);
 const [timer,setTimer]=useState([0,15,30,60].includes(preset.timer)?preset.timer:0),[teamNames,setTeamNames]=useState(Array.isArray(preset.teamNames)?preset.teamNames.slice(0,8):[]),[saved,setSaved]=useState('');
 const [questionLanguage,setQuestionLanguage]=useState(preset.questionLanguage==='en'?'en':'ja');
 const regions=useMemo(()=>[...new Set(countries.map(c=>c.region))].sort(),[]);
 const rawPool=useMemo(()=>questionPool(bank,selected,domains),[selected,domains]);
 const pool=useMemo(()=>rawPool.map(q=>localizeQuestion(q,questionLanguage)).filter(Boolean),[rawPool,questionLanguage]);
 const selectedSet=new Set(selected);
 const filteredCountries=countries.filter(c=>(c.nameJa+' '+c.nameEn+' '+c.iso).toLowerCase().includes(search.toLowerCase()));
 const pageSize=12, maxPage=Math.max(0,Math.ceil(filteredCountries.length/pageSize)-1), shownPage=Math.min(countryPage,maxPage);
 const selectedMode=MODES.find(m=>m.id===mode);
 const actualLimit=playableLimit(mode,limit,pool.length,teams);
 const [sound,setSound]=useState(getUiSoundEnabled);
 const [strategy,setStrategy]=useState(preset.strategy!==false),[travelEconomy,setTravelEconomy]=useState(preset.travelEconomy!==false);
 const toggle=iso=>setSelected(s=>s.includes(iso)?s.filter(x=>x!==iso):[...s,iso]);
 const toggleRegion=region=>{const ids=countries.filter(c=>c.region===region).map(c=>c.iso);setSelected(s=>ids.every(x=>s.includes(x))?s.filter(x=>!ids.includes(x)):[...new Set([...s,...ids])]);};
 const start=()=>{if(actualLimit){playUiSound('open');setGame(createGame({mode,pool,limit,teamCount:teams,teamNames,geo,strategy,travelEconomy}));}};
 const save=()=>setSaved(persistPreset({mode,selected,domains,limit,teams,teacher,timer,teamNames,strategy,travelEconomy,questionLanguage})?'この端末に設定を保存しました。':'設定を保存できませんでした。');
 const replay=()=>{const missed=missedQuestions(game);if(missed.length)setGame(createGame({mode:'shuffle',pool:missed,limit:missed.length}));};
 const exit=()=>{if(!game||game.phase==='finished'||window.confirm('現在のゲームを終了しますか？')){setGame(null);setStep(0);}};
 if(online&&ONLINE_ENDPOINT)return <OnlineBattle endpoint={ONLINE_ENDPOINT} config={{teamNames:Array.from({length:teams},(_,i)=>String(teamNames[i]||"").trim()||"TEAM "+(i+1)),limit,seconds:timer,language:questionLanguage,countries:selected,domains}} onBack={()=>setOnline(false)}/>;
 return <main className={"wg-shell wg-bright wg-theme-"+(game?.mode||mode)+(game?" wg-playing":" wg-setup")}>
 <header className="wg-top"><button className="wg-back" onClick={game?exit:onBackHome}>← {game?'ゲーム設定':'ホーム'}</button><span>TIMEPALETTE / WORLD GAMES</span><button className="wg-back" aria-pressed={sound} onClick={()=>{setUiSoundEnabled(!sound);setSound(!sound);}}> {sound?'🔊 効果音 ON':'🔇 効果音 OFF'}</button></header>
 {!game?<><div className="wg-mode-splash"><img src={import.meta.env.BASE_URL+'world-activities/'+mode+'.webp'} alt=""/><div><span>LET'S PLAY</span><h1>{selectedMode.name}</h1><p>{selectedMode.desc}</p></div></div>
 
 <div className="wg-overlay wg-setup-overlay"><section className="wg-settings wg-wizard" role="dialog" aria-modal="true" aria-label={selectedMode.name+' の設定'}><header className="wg-wizard-head"><div><small>{selectedMode.name} · STEP {step+1} / 3</small><h2>{['出題範囲を設定','問題を選ぼう','プレイ設定'][step]}</h2></div><button className="wg-back" onClick={onBackHome}>× ホーム</button></header><div className="wg-wizard-steps" aria-hidden="true">{[0,1,2].map(i=><i key={i} className={i<=step?'active':''}/>)}</div><div className="wg-wizard-body">
 {!initialMode&&step===0&&<label className="wg-label">ゲーム<select value={mode} onChange={e=>setMode(e.target.value)}>{MODES.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></label>}
 {step===0&&<>{mode==='battle'&&ONLINE_ENDPOINT&&<div className="wg-row"><button onClick={()=>setOnline(true)}>オンライン対戦（限定テスト）</button><small>下の出題範囲・チーム設定を使用します。参加だけの場合は設定不要です。</small></div>}<div className="wg-row"><button onClick={()=>setSelected(countries.map(c=>c.iso))}>全世界</button><button onClick={()=>setSelected([])}>すべて解除</button><b>{selected.length}か国・地域</b></div>
 <div className="wg-row">{regions.map(r=>{const all=countries.filter(c=>c.region===r);const n=all.filter(c=>selectedSet.has(c.iso)).length;return <button key={r} aria-pressed={n===all.length} onClick={()=>toggleRegion(r)}>{regionLabels[r]||r} {n}/{all.length}</button>;})}</div>
 <label className="wg-label">個別の国を選ぶ<input value={search} onChange={e=>{setSearch(e.target.value);setCountryPage(0);}} placeholder="国名・英語名・国コード"/></label>
 <div className="wg-country-grid">{filteredCountries.slice(shownPage*pageSize,(shownPage+1)*pageSize).map(c=><button key={c.iso} aria-pressed={selectedSet.has(c.iso)} onClick={()=>toggle(c.iso)}>{c.flagEmoji} {c.nameJa}</button>)}</div><div className="wg-page-controls"><button disabled={shownPage===0} onClick={()=>setCountryPage(shownPage-1)}>← 前</button><span>{shownPage+1} / {maxPage+1}</span><button disabled={shownPage===maxPage} onClick={()=>setCountryPage(shownPage+1)}>次 →</button></div></>}
 {step===1&&<><h3>出題言語 / Question language</h3><div className="wg-row" aria-label="出題言語"><button aria-pressed={questionLanguage==='ja'} onClick={()=>setQuestionLanguage('ja')}>日本語</button><button aria-pressed={questionLanguage==='en'} onClick={()=>setQuestionLanguage('en')}>English</button><small>{questionLanguage==='en'?'English questions, choices and explanations. 未翻訳 '+(rawPool.length-pool.length)+'問は除外。':'問題・選択肢・解説を日本語で表示'}</small></div><h3>カテゴリー</h3><div className="wg-row">{DOMAINS.map(([id,label])=>{const available=bank.some(q=>q.domain===id);return <button key={id} disabled={!available} aria-pressed={domains.includes(id)} onClick={()=>setDomains(d=>d.includes(id)?d.filter(x=>x!==id):[...d,id])}>{label}{!available?'（準備中）':''}</button>;})}</div>
 </>}
 {step===2&&<><div className="wg-config"><label>出題数<select value={limit} onChange={e=>setLimit(Number(e.target.value))}>{[5,10,20,30,50].map(n=><option key={n}>{n}</option>)}</select></label>
 {mode!=='shuffle'&&<label>チーム数<select value={teams} onChange={e=>{setTeams(Number(e.target.value));setTeamPage(0);}}>{[2,3,4,5,6,7,8].map(n=><option key={n}>{n}</option>)}</select></label>}
 <label>考える時間<select value={timer} onChange={e=>setTimer(Number(e.target.value))}>{[0,15,30,60].map(n=><option key={n} value={n}>{n?n+'秒':'制限なし'}</option>)}</select></label>
 <label className="wg-check"><input type="checkbox" checked={teacher} onChange={e=>setTeacher(e.target.checked)}/> Teacher's Mode（先生が正解発表を操作）</label>
 {mode==='territory'&&<label className="wg-check"><input type="checkbox" checked={strategy} onChange={e=>setStrategy(e.target.checked)}/> 戦略モード（隣接国・地域達成）</label>}
 {mode==='journey'&&<label className="wg-check"><input type="checkbox" checked={travelEconomy} onChange={e=>setTravelEconomy(e.target.checked)}/> 旅行・通貨モード（移動パス・記念品）</label>}</div>
 {mode!=='shuffle'&&<div className="wg-team-names">{Array.from({length:teams},(_,i)=>i).slice(teamPage*4,teamPage*4+4).map(i=><label key={i}>TEAM {i+1}<input maxLength={24} value={teamNames[i]||''} placeholder={'TEAM '+(i+1)} onChange={e=>setTeamNames(old=>{const a=[...old];a[i]=e.target.value;return a;})}/></label>)}</div>}
 {mode!=='shuffle'&&teams>4&&<div className="wg-page-controls"><button disabled={teamPage===0} onClick={()=>setTeamPage(0)}>TEAM 1–4</button><button disabled={teamPage===1} onClick={()=>setTeamPage(1)}>TEAM 5–{teams}</button></div>}
 <div className="wg-row"><button onClick={save}>この授業の設定を保存</button><small role="status">{saved}</small></div>
 {['territory','journey'].includes(mode)&&<p className="wg-note">公平な対戦のため全チームのターン数を同じに調整します。{actualLimit?('各チーム '+actualLimit/teams+' ターン。'):'問題数を増やすかチーム数を減らしてください。'}</p>}</>}
 </div><footer className="wg-wizard-footer"><div><b>{pool.length.toLocaleString()}問</b><small>利用可能 · 今回 {actualLimit}問</small></div><div className="wg-row">{step>0&&<button onClick={()=>setStep(step-1)}>← 戻る</button>}{step<2?<button className="wg-primary" disabled={step===0?!selected.length:!pool.length} onClick={()=>setStep(step+1)}>次へ →</button>:<button className="wg-primary" disabled={!actualLimit} onClick={start}>ゲーム開始 →</button>}</div></footer></section></div></>:<>
 <div className="wg-game-title"><h1>{MODES.find(m=>m.id===game.mode)?.name}</h1><span>{Math.min(game.round+1,game.limit)} / {game.limit}</span></div><div className="wg-game-progress" role="progressbar" aria-label="ゲーム進捗" aria-valuemin={0} aria-valuemax={game.limit} aria-valuenow={game.round}><i style={{width:game.round/game.limit*100+'%'}}/></div><Scoreboard game={game}/>
 {game.phase==='finished'?<div className="wg-overlay wg-results-overlay" role="dialog" aria-modal="true" aria-label="ゲーム結果"><section className="wg-settings wg-results-panel"><h2>🏆 GAME COMPLETE</h2>{standings(game).map(t=><div key={t.id} className="wg-result"><div><strong>{teamRank(game,t)}位 · {t.name}</strong><small>{t.correctCount}/{t.attempts} 正解 · 最大{t.bestStreak}連続正解</small>{game.mode==='journey'&&<small>{t.visits.map(iso=>flag(iso)+' '+name(iso)).join(' · ')||'訪問なし'} · 現金{t.money} TPM · 記念品{t.souvenirs.length}個</small>}</div><span>{game.mode==='territory'?t.territories+'か国':game.mode==='journey'?t.assets+' TPM（総資産）':t.score+' pts'}</span></div>)}<div className="wg-row"><button className="wg-primary" onClick={()=>{setGame(null);setStep(0);}}>設定に戻る</button>{missedQuestions(game).length>0&&<button onClick={replay}>間違えた{missedQuestions(game).length}問を復習</button>}</div><ClassroomResults game={game}/><details className="wg-review"><summary>今回の全問題と解説（{game.history.length}問）</summary>{game.history.map((row,i)=><article key={row.question.id}><b>{i+1}. {row.question.prompt}</b><p>{row.question.language==='en'?'Answer: ':'正解：'}{row.question.choices[row.question.correctIndex]}</p><small>{row.question.explanation}</small></article>)}</details></section></div>:<>
 {game.mode==='territory'&&<><h2 className="wg-turn">{game.teams[game.turn].name} のターン</h2><TerritoryMap game={game} onPick={iso=>setGame(g=>selectTerritory(g,iso))}/></>}
 {game.mode==='journey'&&<JourneyBoard game={game} countryName={name} countryFlag={flag} onRoll={(travel,die)=>setGame(g=>rollJourney(g,die,Math.random,g.travelEconomy?travel:'standard'))}/>}
 {game.question&&<div className="wg-overlay wg-quiz-overlay" role="dialog" aria-modal="true" aria-label="クイズ・解説"><QuizCard key={game.question.id+'-'+(game.mode==='battle'&&game.phase==='question'?game.turn:'review')} game={game} setGame={setGame} teacher={teacher} timer={timer}/></div>}
 </>}</>}
 </main>;
}
