import {useEffect,useMemo,useState} from 'react';
import {ComposableMap,Geographies,Geography,Marker} from 'react-simple-maps';
import worldAtlas from 'world-atlas/countries-110m.json';
import {getLiveWorldLearningCountries} from '../../utils/worldLearningRegistry';
import {getGeography197Profile} from '../../utils/geography197';
import {makeLocalGameBank} from '../../utils/worldGameBank';
import {questionPool,createGame,selectTerritory,rollJourney,answerGame,advanceGame,standings,missedQuestions,teamRank,availableTerritories,playableLimit,buySouvenir} from '../../utils/worldGameEngine';
import {getUiSoundEnabled,setUiSoundEnabled,playUiSound} from '../../utils/uiSound';
import {TRAVEL_MODES,SOUVENIRS,territoryChoices,regionalCollections,journeyAssets} from '../../utils/worldGameStrategy';
import './worldGameHub.css';

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
const geo=Object.fromEntries(countries.map(c=>{const p=getGeography197Profile(c.iso);return [c.iso,{center:p?.center,neighbors:(p?.neighbors||[]).map(n=>n.iso),region:c.region}];}));
const PRESET_KEY='timepalette.worldgames.settings.v2';
function readPreset(){try{return JSON.parse(localStorage.getItem(PRESET_KEY)||'null')||{};}catch{return {};}}
function persistPreset(preset){try{localStorage.setItem(PRESET_KEY,JSON.stringify(preset));return true;}catch{return false;}}
const regionLabels={Asia:'アジア',Europe:'ヨーロッパ',Africa:'アフリカ',Americas:'南北アメリカ',Oceania:'オセアニア'};
const name=iso=>byIso[iso]?.nameJa||iso;
const flag=iso=>byIso[iso]?.flagEmoji||'🌐';
function Scoreboard({game}){
 return <div className="wg-scores">{game.teams.map(t=><div key={t.id} className={'wg-score '+(game.phase!=='finished'&&game.turn===t.id?'active':'')} style={{'--team':t.color}}>
 <strong>{t.name}</strong><span>{t.score} pts</span><small>{t.correctCount}/{t.attempts} 正解{t.streak>1?' · 🔥 '+t.streak+'連続':''}</small>{game.mode==='territory'&&<small>{Object.values(game.owners).filter(id=>id===t.id).length}か国{game.strategy?' · 地域バッジ '+regionalCollections(game,t.id).length:''}</small>}{game.mode==='journey'&&<small>{t.money.toLocaleString()} TPM · {name(game.route[t.position])} · {t.visits.length}か国訪問{game.travelEconomy?' · 記念品 '+t.souvenirs.length+'個':''}</small>}</div>)}</div>;
}
function TerritoryMap({game,onPick}){
 const choiceInfo=territoryChoices(game);
 const playable=availableTerritories(game);
 const enabled=new Set(playable);
 const selected=new Set(game.route);
 const [query,setQuery]=useState('');
 const choose=iso=>{if(game.phase==='select'&&enabled.has(iso))onPick(iso);};
 return <div className="wg-map-section">
 <div className="wg-map"><ComposableMap projectionConfig={{scale:125}} width={800} height={400}><Geographies geography={worldAtlas}>{({geographies})=>geographies.map(geo=>{
  const iso=byAtlas[geo.properties?.name],owner=game.owners[iso],active=selected.has(iso),pickable=game.phase==='select'&&enabled.has(iso);
  return <Geography key={geo.rsmKey} geography={geo} fill={owner!==undefined?game.teams[owner].color:active?(enabled.has(iso)?'#6b9da7':'#b1c1c9'):'#dce5ec'} stroke="#fff" strokeWidth={0.5} onClick={()=>choose(iso)} style={{default:{outline:'none',cursor:pickable?'pointer':'default'},hover:{outline:'none',fill:pickable?'#f1b94b':undefined},pressed:{outline:'none'}}}/>;
 })}</Geographies></ComposableMap></div>
 <div className="wg-strategy"><strong>{choiceInfo.kind==='neighbor'?'隣接国へ進出':choiceInfo.kind==='expedition'?'特別遠征':choiceInfo.kind==='start'?'出発地点を選択':'自由探索'}</strong><span>{choiceInfo.kind==='neighbor'?'獲得済みの国と陸で接する候補国へ進めます。':choiceInfo.kind==='expedition'?'隣接する未出題の候補がないため、離れた国にも挑戦できます。':choiceInfo.kind==='start'?'最初の拠点は自由に選べます。':'正解で国を獲得。相手の国にも挑戦できます。'}</span></div>
 {game.strategy&&<p>選択範囲内の同じ地域の国（2か国以上）をすべて獲得すると、その地域につき初回200 pts。実際の国境を変えるものではなく、知識を集めるゲームです。</p>}
 <p>挑戦可能：{playable.length}か国・地域</p>
 <label className="wg-label">国を検索<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="国名で検索"/></label>
 <div className="wg-country-grid">{playable.filter(iso=>name(iso).includes(query)||byIso[iso]?.nameEn.toLowerCase().includes(query.toLowerCase())).map(iso=><button key={iso} disabled={game.phase!=='select'} onClick={()=>choose(iso)} style={{borderColor:game.owners[iso]!==undefined?game.teams[game.owners[iso]].color:undefined}}>{flag(iso)} {name(iso)}{game.owners[iso]!==undefined&&<small> · {game.teams[game.owners[iso]].name}</small>}</button>)}</div>
 </div>;
}
function JourneyBoard({game,onRoll}){
 const [rolling,setRolling]=useState(false);
 const [face,setFace]=useState(1);
 const [travel,setTravel]=useState('standard');
 const current=game.teams[game.turn];
 const ticket=TRAVEL_MODES[travel];
 useEffect(()=>{
  if(!rolling)return;
  const interval=window.setInterval(()=>setFace(1+Math.floor(Math.random()*6)),85);
  const timeout=window.setTimeout(()=>{setRolling(false);onRoll(travel);setTravel('standard');},650);
  return ()=>{clearInterval(interval);clearTimeout(timeout);};
 },[rolling,onRoll,travel]);
 return <div className="wg-journey"><p>WORLD PASSPORT · 世界旅行ルート（ゲーム上の仮想ルート）</p>
 <div className="wg-map wg-journey-map"><ComposableMap projectionConfig={{scale:125}} width={800} height={400}><Geographies geography={worldAtlas}>{({geographies})=>geographies.map(geo=><Geography key={geo.rsmKey} geography={geo} fill={game.route.includes(byAtlas[geo.properties?.name])?'#739da6':'#d9e4eb'} stroke="#fff" strokeWidth={0.5} style={{default:{outline:'none'},hover:{outline:'none'},pressed:{outline:'none'}}}/>)}</Geographies>{game.teams.map(t=>{const center=getGeography197Profile(game.route[t.position])?.center;return Array.isArray(center)&&center.length===2?<Marker key={t.id} coordinates={center}><circle cx={t.id%3*5} cy={Math.floor(t.id/3)*5} r={9} fill={t.color} stroke="#fff" strokeWidth={1.5}/><text x={t.id%3*5} y={Math.floor(t.id/3)*5+3} fontSize={9} textAnchor="middle" fill="#fff">{t.id+1}</text></Marker>:null;})}</ComposableMap></div><div className="wg-route">{game.route.map((iso,i)=><div key={iso} className={'wg-stop '+(game.target===iso?'current':'')}><b>{i+1}. {flag(iso)} {name(iso)}</b><div>{game.teams.filter(t=>t.position===i).map(t=><span key={t.id} style={{background:t.color}} title={t.name}>{t.id+1}</span>)}</div></div>)}</div>
 {game.phase==='select'&&game.travelEconomy&&<div className="wg-travel-options" aria-label="移動パス">{Object.entries(TRAVEL_MODES).map(([id,option])=><button key={id} disabled={rolling||current.money<option.cost} aria-pressed={travel===id} onClick={()=>setTravel(id)}><b>{option.icon} {option.label}</b><small>{option.cost} TPM · サイコロ{option.extra?' + '+option.extra:'そのまま'}</small></button>)}</div>}
 {game.phase==='select'&&<button className="wg-primary" disabled={rolling||(game.travelEconomy&&current.money<ticket.cost)} onClick={()=>setRolling(true)}>{rolling?'🎲 '+face+' …':'🎲 '+game.teams[game.turn].name+' · サイコロを振る'}</button>}
 {game.dice!==null&&<p className="wg-dice" role="status">🎲 {game.dice}{game.travel&&TRAVEL_MODES[game.travel].extra?' + '+TRAVEL_MODES[game.travel].extra:''} → {name(game.target)}</p>}
 <small>正解で300 TPM。未出題の問題がない国は次の停留所へ進みます。移動パスと旅行ルートは学習ゲーム上の設定です。</small></div>;
}
function QuizCard({game,setGame,teacher,timer}){
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
 if(!ready&&!review)return <section className="wg-question wg-handoff"><div aria-hidden="true">🛡️</div><h2>{game.teams[game.turn].name} の番です</h2><p>他のチームから回答が見えないように端末を渡してください。</p><button className="wg-primary" onClick={()=>setReady(true)}>回答を始める</button></section>;
 return <section className={'wg-question '+(teacher?'teacher':'')} aria-label="クイズ">
 <header><span>{flag(q.country)} {name(q.country)} · {DOMAINS.find(d=>d[0]===q.domain)?.[1]}</span><span>{game.round+1} / {game.limit}</span></header>
 {game.mode==='battle'&&!review&&<p className="wg-turn">回答者：{game.teams[game.turn].name}（他チームは回答を見ないようにしてください）</p>}
 {active&&<div className="wg-timer"><div><strong>{seconds}秒</strong><span>{seconds===0?'時間終了':paused?'一時停止中':'考える時間'}</span>{teacher&&seconds>0&&<button onClick={()=>setPaused(p=>!p)}>{paused?'再開':'一時停止'}</button>}</div><div className="wg-timer-track"><i style={{width:(seconds/timer*100)+'%'}}/></div></div>}
 <h2>{q.prompt}</h2><div className="wg-options">{q.choices.map((label,i)=><button key={i} disabled={review} aria-pressed={!review&&choice===i} className={review?(i===correct?'correct':Object.values(game.answers).includes(i)?'wrong':''):choice===i?'selected':''} onClick={()=>choose(i)}><b>{'ABCD'[i]}</b><span>{label}</span></button>)}</div>
 {teacher&&!review&&<div className="wg-row"><button className="wg-primary" disabled={choice===null} onClick={submit}>{game.mode==='battle'?'回答を確定':'正解を発表'}</button><button onClick={()=>record(-1)}>パス・正解を確認</button></div>}
 {review&&<div className="wg-feedback" role="status"><h3>{game.mode==='battle'?'正解発表':game.last.correct?'正解！':'正解を確認しよう'}</h3><strong>{q.choices[correct]}</strong><p>{q.explanation}</p>
 {game.last?.transfer&&<p className="wg-reward">🏳️ エリア獲得！</p>}{game.last?.newRegions?.map(r=><p key={r.region} className="wg-reward">🏅 {regionLabels[r.region]||r.region} 選択範囲達成 · +200 pts</p>)}
 {game.mode==='journey'&&game.last?.correct&&<p className="wg-reward">🪙 +300 TPM 獲得！</p>}
 {game.mode==='journey'&&game.travelEconomy&&<div className="wg-shop"><h4>🎁 {name(q.country)} の旅の記念品</h4><p>保有 {game.teams[game.turn].money} TPM · 記念品は資産として計上（購入額と同額）</p><div className="wg-travel-options">{SOUVENIRS.map(item=>{const team=game.teams[game.turn],owned=team.souvenirs.some(x=>x.id===item.id&&x.country===q.country);return <button key={item.id} disabled={owned||team.money<item.cost} onClick={()=>{playUiSound('tap');setGame(g=>g.question?.id===q.id&&g.turn===game.turn?buySouvenir(g,item.id):g);}}><b>{item.icon} {item.label}</b><small>{owned?'購入済み':item.cost+' TPM'}</small></button>})}</div></div>}
 {game.mode==='battle'&&<p>{game.teams.map(t=>t.name+'：'+(game.answers[t.id]===correct?'正解':game.answers[t.id]===-1?'未回答':'不正解')).join(' ／ ')}</p>}
 <small>教材：{q.origin||'TimePalette'}{q.sources?.filter(s=>typeof s==='string'&&s.startsWith('https://')).map(s=><a key={s} href={s} target="_blank" rel="noreferrer"> · 出典</a>)}</small>
 <button className="wg-primary" onClick={()=>setGame(advanceGame)}>{game.round+1===game.limit?'結果を見る':'次へ'}</button></div>}
 </section>;
}
export default function WorldGameHub({onBackHome}){
 const [preset]=useState(readPreset);
 const [mode,setMode]=useState(MODES.some(m=>m.id===preset.mode)?preset.mode:'shuffle'),[selected,setSelected]=useState(()=>Array.isArray(preset.selected)?preset.selected.filter(iso=>byIso[iso]):countries.map(c=>c.iso)),[domains,setDomains]=useState(()=>Array.isArray(preset.domains)?preset.domains.filter(id=>DOMAINS.some(d=>d[0]===id)):['place','time']);
 const [search,setSearch]=useState(''),[limit,setLimit]=useState([5,10,20,30,50].includes(preset.limit)?preset.limit:10),[teams,setTeams]=useState(Number.isInteger(preset.teams)&&preset.teams>=2&&preset.teams<=8?preset.teams:2),[teacher,setTeacher]=useState(preset.teacher===true),[game,setGame]=useState(null);
 const [timer,setTimer]=useState([0,15,30,60].includes(preset.timer)?preset.timer:0),[teamNames,setTeamNames]=useState(Array.isArray(preset.teamNames)?preset.teamNames.slice(0,8):[]),[saved,setSaved]=useState('');
 const regions=useMemo(()=>[...new Set(countries.map(c=>c.region))].sort(),[]);
 const pool=useMemo(()=>questionPool(bank,selected,domains),[selected,domains]);
 const selectedSet=new Set(selected);
 const actualLimit=playableLimit(mode,limit,pool.length,teams);
 const [sound,setSound]=useState(getUiSoundEnabled);
 const [strategy,setStrategy]=useState(preset.strategy!==false),[travelEconomy,setTravelEconomy]=useState(preset.travelEconomy!==false);
 const toggle=iso=>setSelected(s=>s.includes(iso)?s.filter(x=>x!==iso):[...s,iso]);
 const toggleRegion=region=>{const ids=countries.filter(c=>c.region===region).map(c=>c.iso);setSelected(s=>ids.every(x=>s.includes(x))?s.filter(x=>!ids.includes(x)):[...new Set([...s,...ids])]);};
 const start=()=>{if(actualLimit){playUiSound('open');setGame(createGame({mode,pool,limit,teamCount:teams,teamNames,geo,strategy,travelEconomy}));}};
 const save=()=>setSaved(persistPreset({mode,selected,domains,limit,teams,teacher,timer,teamNames,strategy,travelEconomy})?'この端末に設定を保存しました。':'設定を保存できませんでした。');
 const replay=()=>{const missed=missedQuestions(game);if(missed.length)setGame(createGame({mode:'shuffle',pool:missed,limit:missed.length}));};
 const exit=()=>{if(!game||game.phase==='finished'||window.confirm('現在のゲームを終了しますか？'))setGame(null);};
 return <main className="wg-shell">
 <header className="wg-top"><button className="wg-back" onClick={game?exit:onBackHome}>← {game?'ゲーム設定':'ホーム'}</button><span>TIMEPALETTE / WORLD GAMES</span><button className="wg-back" aria-pressed={sound} onClick={()=>{setUiSoundEnabled(!sound);setSound(!sound);}}> {sound?'🔊 効果音 ON':'🔇 効果音 OFF'}</button></header>
 {!game?<><div className="wg-hero"><div><p>EXPLORE · LEARN · PLAY</p><h1>世界が、遊び場になる。</h1><span>4つのゲームを、ひとつのクイズエンジンで。</span></div><div aria-hidden="true">🌏</div></div>
 <div className="wg-modes">{MODES.map(m=><button key={m.id} className={mode===m.id?'chosen':''} aria-pressed={mode===m.id} onClick={()=>setMode(m.id)}><span>{m.icon}</span><strong>{m.name}</strong><small>{m.desc}</small></button>)}</div>
 <section className="wg-settings"><h2>出題範囲を設定</h2><div className="wg-row"><button onClick={()=>setSelected(countries.map(c=>c.iso))}>全世界</button><button onClick={()=>setSelected([])}>すべて解除</button><b>{selected.length}か国・地域</b></div>
 <div className="wg-row">{regions.map(r=>{const all=countries.filter(c=>c.region===r);const n=all.filter(c=>selectedSet.has(c.iso)).length;return <button key={r} aria-pressed={n===all.length} onClick={()=>toggleRegion(r)}>{regionLabels[r]||r} {n}/{all.length}</button>;})}</div>
 <label className="wg-label">個別の国を選ぶ<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="国名・英語名・国コード"/></label>
 <div className="wg-country-grid">{countries.filter(c=>(c.nameJa+' '+c.nameEn+' '+c.iso).toLowerCase().includes(search.toLowerCase())).map(c=><button key={c.iso} aria-pressed={selectedSet.has(c.iso)} onClick={()=>toggle(c.iso)}>{c.flagEmoji} {c.nameJa}</button>)}</div>
 <h3>カテゴリー</h3><div className="wg-row">{DOMAINS.map(([id,label])=>{const available=bank.some(q=>q.domain===id);return <button key={id} disabled={!available} aria-pressed={domains.includes(id)} onClick={()=>setDomains(d=>d.includes(id)?d.filter(x=>x!==id):[...d,id])}>{label}{!available?'（準備中）':''}</button>;})}</div>
 <div className="wg-config"><label>出題数<select value={limit} onChange={e=>setLimit(Number(e.target.value))}>{[5,10,20,30,50].map(n=><option key={n}>{n}</option>)}</select></label>
 {mode!=='shuffle'&&<label>チーム数<select value={teams} onChange={e=>setTeams(Number(e.target.value))}>{[2,3,4,5,6,7,8].map(n=><option key={n}>{n}</option>)}</select></label>}
 <label>考える時間<select value={timer} onChange={e=>setTimer(Number(e.target.value))}>{[0,15,30,60].map(n=><option key={n} value={n}>{n?n+'秒':'制限なし'}</option>)}</select></label>
 <label className="wg-check"><input type="checkbox" checked={teacher} onChange={e=>setTeacher(e.target.checked)}/> Teacher's Mode（先生が正解発表を操作）</label>
 {mode==='territory'&&<label className="wg-check"><input type="checkbox" checked={strategy} onChange={e=>setStrategy(e.target.checked)}/> 戦略モード（隣接国・地域達成）</label>}
 {mode==='journey'&&<label className="wg-check"><input type="checkbox" checked={travelEconomy} onChange={e=>setTravelEconomy(e.target.checked)}/> 旅行・通貨モード（移動パス・記念品）</label>}</div>
 {mode!=='shuffle'&&<div className="wg-team-names">{Array.from({length:teams},(_,i)=><label key={i}>TEAM {i+1}<input maxLength={24} value={teamNames[i]||''} placeholder={'TEAM '+(i+1)} onChange={e=>setTeamNames(old=>{const a=[...old];a[i]=e.target.value;return a;})}/></label>)}</div>}
 <div className="wg-row"><button onClick={save}>この授業の設定を保存</button><small role="status">{saved}</small></div>
 <div className="wg-start"><div><strong>{pool.length.toLocaleString()}問</strong><p>利用可能な問題 · 今回は{actualLimit}問</p></div><button className="wg-primary" disabled={!actualLimit} onClick={start}>ゲーム開始 →</button></div>
 {['territory','journey'].includes(mode)&&<p className="wg-note">公平な対戦のため全チームのターン数を同じに調整します。{actualLimit?('各チーム '+actualLimit/teams+' ターン。'):'問題数を増やすかチーム数を減らしてください。'}</p>}
 <p className="wg-note">現在は地理・時差の独立した問題を使用します。JICA世界日記は出題対象外です。AIA教材由来の独自問題は利用条件・内容確認後に追加します。複数端末オンライン対戦は未実装です。</p></section></>:<>
 <div className="wg-game-title"><h1>{MODES.find(m=>m.id===game.mode)?.name}</h1><span>{Math.min(game.round+1,game.limit)} / {game.limit}</span></div><div className="wg-game-progress" role="progressbar" aria-label="ゲーム進捗" aria-valuemin={0} aria-valuemax={game.limit} aria-valuenow={game.round}><i style={{width:game.round/game.limit*100+'%'}}/></div><Scoreboard game={game}/>
 {game.phase==='finished'?<section className="wg-settings"><h2>🏆 GAME COMPLETE</h2>{standings(game).map(t=><div key={t.id} className="wg-result"><div><strong>{teamRank(game,t)}位 · {t.name}</strong><small>{t.correctCount}/{t.attempts} 正解 · 最大{t.bestStreak}連続正解</small>{game.mode==='journey'&&<small>{t.visits.map(iso=>flag(iso)+' '+name(iso)).join(' · ')||'訪問なし'} · 現金{t.money} TPM · 記念品{t.souvenirs.length}個</small>}</div><span>{game.mode==='territory'?t.territories+'か国':game.mode==='journey'?t.assets+' TPM（総資産）':t.score+' pts'}</span></div>)}<div className="wg-row"><button className="wg-primary" onClick={()=>setGame(null)}>設定に戻る</button>{missedQuestions(game).length>0&&<button onClick={replay}>間違えた{missedQuestions(game).length}問を復習</button>}</div><details className="wg-review"><summary>今回の全問題と解説（{game.history.length}問）</summary>{game.history.map((row,i)=><article key={row.question.id}><b>{i+1}. {row.question.prompt}</b><p>正解：{row.question.choices[row.question.correctIndex]}</p><small>{row.question.explanation}</small></article>)}</details></section>:<>
 {game.mode==='territory'&&<><h2 className="wg-turn">{game.teams[game.turn].name} のターン</h2><TerritoryMap game={game} onPick={iso=>setGame(g=>selectTerritory(g,iso))}/></>}
 {game.mode==='journey'&&<JourneyBoard game={game} onRoll={travel=>setGame(g=>rollJourney(g,1+Math.floor(Math.random()*6),Math.random,g.travelEconomy?travel:'standard'))}/>}
 {game.question&&<QuizCard key={game.question.id+'-'+(game.mode==='battle'&&game.phase==='question'?game.turn:'review')} game={game} setGame={setGame} teacher={teacher} timer={timer}/>}
 </>}</>}
 </main>;
}
