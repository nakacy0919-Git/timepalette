import {useMemo,useState} from 'react';
import {ComposableMap,Geographies,Geography} from 'react-simple-maps';
import worldAtlas from 'world-atlas/countries-110m.json';
import {getLiveWorldLearningCountries} from '../../utils/worldLearningRegistry';
import {makeLocalGameBank} from '../../utils/worldGameBank';
import {questionPool,createGame,selectTerritory,rollJourney,answerGame,advanceGame,standings} from '../../utils/worldGameEngine';
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
const regionLabels={Asia:'アジア',Europe:'ヨーロッパ',Africa:'アフリカ',Americas:'南北アメリカ',Oceania:'オセアニア'};
const name=iso=>byIso[iso]?.nameJa||iso;
const flag=iso=>byIso[iso]?.flagEmoji||'🌐';
function Scoreboard({game}){
 return <div className="wg-scores">{game.teams.map(t=><div key={t.id} className={'wg-score '+(game.phase!=='finished'&&game.turn===t.id?'active':'')} style={{'--team':t.color}}>
 <strong>{t.name}</strong><span>{t.score} pts</span>{game.mode==='territory'&&<small>{Object.values(game.owners).filter(id=>id===t.id).length}か国</small>}{game.mode==='journey'&&<small>{t.money.toLocaleString()} TPM · {name(game.route[t.position])}</small>}</div>)}</div>;
}
function TerritoryMap({game,onPick}){
 const playable=game.route.filter(iso=>game.pool.some(q=>q.country===iso&&!game.used.includes(q.id)));
 const enabled=new Set(playable);
 const selected=new Set(game.route);
 const [query,setQuery]=useState('');
 const choose=iso=>{if(game.phase==='select'&&enabled.has(iso))onPick(iso);};
 return <div className="wg-map-section">
 <div className="wg-map"><ComposableMap projectionConfig={{scale:125}} width={800} height={400}><Geographies geography={worldAtlas}>{({geographies})=>geographies.map(geo=>{
  const iso=byAtlas[geo.properties?.name],owner=game.owners[iso],active=selected.has(iso),pickable=game.phase==='select'&&enabled.has(iso);
  return <Geography key={geo.rsmKey} geography={geo} fill={owner!==undefined?game.teams[owner].color:active?'#6b9da7':'#dce5ec'} stroke="#fff" strokeWidth={0.5} onClick={()=>choose(iso)} style={{default:{outline:'none',cursor:pickable?'pointer':'default'},hover:{outline:'none',fill:pickable?'#f1b94b':undefined},pressed:{outline:'none'}}}/>;
 })}</Geographies></ComposableMap></div>
 <p>色のついた国から挑戦。正解するとその国を獲得できます。相手チームの国にも挑戦できます。</p>
 <label className="wg-label">国を検索<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="国名で検索"/></label>
 <div className="wg-country-grid">{playable.filter(iso=>name(iso).includes(query)||byIso[iso]?.nameEn.toLowerCase().includes(query.toLowerCase())).map(iso=><button key={iso} disabled={game.phase!=='select'} onClick={()=>choose(iso)} style={{borderColor:game.owners[iso]!==undefined?game.teams[game.owners[iso]].color:undefined}}>{flag(iso)} {name(iso)}{game.owners[iso]!==undefined&&<small> · {game.teams[game.owners[iso]].name}</small>}</button>)}</div>
 </div>;
}
function JourneyBoard({game,onRoll}){
 return <div className="wg-journey"><p>世界旅行ルート（ゲーム上の仮想ルート）</p><div className="wg-route">{game.route.map((iso,i)=><div key={iso} className={'wg-stop '+(game.target===iso?'current':'')}><b>{i+1}. {flag(iso)} {name(iso)}</b><div>{game.teams.filter(t=>t.position===i).map(t=><span key={t.id} style={{background:t.color}} title={t.name}>{t.id+1}</span>)}</div></div>)}</div>
 {game.phase==='select'&&<button className="wg-primary" onClick={onRoll}>🎲 {game.teams[game.turn].name} · サイコロを振る</button>}
 {game.dice!==null&&<p className="wg-dice" role="status">🎲 {game.dice} → {name(game.target)}</p>}
 <small>正解で300 TPM。未出題の問題がない国は次の停留所へ進みます。</small></div>;
}
function QuizCard({game,setGame,teacher}){
 const [choice,setChoice]=useState(null);
 const q=game.question,review=game.phase==='review';
 if(!q)return null;
 const choose=i=>{if(review)return;if(teacher)setChoice(i);else setGame(g=>answerGame(g,i));};
 const submit=()=>{if(choice!==null)setGame(g=>answerGame(g,choice));};
 const correct=q.correctIndex;
 return <section className={'wg-question '+(teacher?'teacher':'')} aria-label="クイズ">
 <header><span>{flag(q.country)} {name(q.country)} · {DOMAINS.find(d=>d[0]===q.domain)?.[1]}</span><span>{game.round+1} / {game.limit}</span></header>
 {game.mode==='battle'&&!review&&<p className="wg-turn">回答者：{game.teams[game.turn].name}（他チームは回答を見ないようにしてください）</p>}
 <h2>{q.prompt}</h2><div className="wg-options">{q.choices.map((label,i)=><button key={i} disabled={review} aria-pressed={!review&&choice===i} className={review?(i===correct?'correct':Object.values(game.answers).includes(i)?'wrong':''):choice===i?'selected':''} onClick={()=>choose(i)}><b>{'ABCD'[i]}</b><span>{label}</span></button>)}</div>
 {teacher&&!review&&<button className="wg-primary" disabled={choice===null} onClick={submit}>{game.mode==='battle'?'回答を確定':'正解を発表'}</button>}
 {review&&<div className="wg-feedback" role="status"><h3>{game.mode==='battle'?'正解発表':game.last.correct?'正解！':'正解を確認しよう'}</h3><strong>{q.choices[correct]}</strong><p>{q.explanation}</p>
 {game.mode==='battle'&&<p>{game.teams.map(t=>t.name+'：'+(game.answers[t.id]===correct?'正解':'不正解')).join(' ／ ')}</p>}
 <small>教材：{q.origin||'TimePalette'}{q.sources?.filter(s=>typeof s==='string'&&s.startsWith('https://')).map(s=><a key={s} href={s} target="_blank" rel="noreferrer"> · 出典</a>)}</small>
 <button className="wg-primary" onClick={()=>setGame(advanceGame)}>{game.round+1===game.limit?'結果を見る':'次へ'}</button></div>}
 </section>;
}
export default function WorldGameHub({onBackHome}){
 const [mode,setMode]=useState('shuffle'),[selected,setSelected]=useState(()=>countries.map(c=>c.iso)),[domains,setDomains]=useState(['place','time']);
 const [search,setSearch]=useState(''),[limit,setLimit]=useState(10),[teams,setTeams]=useState(2),[teacher,setTeacher]=useState(false),[game,setGame]=useState(null);
 const regions=useMemo(()=>[...new Set(countries.map(c=>c.region))].sort(),[]);
 const pool=useMemo(()=>questionPool(bank,selected,domains),[selected,domains]);
 const selectedSet=new Set(selected);
 const toggle=iso=>setSelected(s=>s.includes(iso)?s.filter(x=>x!==iso):[...s,iso]);
 const toggleRegion=region=>{const ids=countries.filter(c=>c.region===region).map(c=>c.iso);setSelected(s=>ids.every(x=>s.includes(x))?s.filter(x=>!ids.includes(x)):[...new Set([...s,...ids])]);};
 const start=()=>{if(pool.length)setGame(createGame({mode,pool,limit,teamCount:teams}));};
 const exit=()=>{if(!game||game.phase==='finished'||window.confirm('現在のゲームを終了しますか？'))setGame(null);};
 return <main className="wg-shell">
 <header className="wg-top"><button className="wg-back" onClick={game?exit:onBackHome}>← {game?'ゲーム設定':'ホーム'}</button><span>TIMEPALETTE / WORLD GAMES</span><small>LOCAL PLAY · 開発版</small></header>
 {!game?<><div className="wg-hero"><div><p>EXPLORE · LEARN · PLAY</p><h1>世界が、遊び場になる。</h1><span>4つのゲームを、ひとつのクイズエンジンで。</span></div><div aria-hidden="true">🌏</div></div>
 <div className="wg-modes">{MODES.map(m=><button key={m.id} className={mode===m.id?'chosen':''} aria-pressed={mode===m.id} onClick={()=>setMode(m.id)}><span>{m.icon}</span><strong>{m.name}</strong><small>{m.desc}</small></button>)}</div>
 <section className="wg-settings"><h2>出題範囲を設定</h2><div className="wg-row"><button onClick={()=>setSelected(countries.map(c=>c.iso))}>全世界</button><button onClick={()=>setSelected([])}>すべて解除</button><b>{selected.length}か国・地域</b></div>
 <div className="wg-row">{regions.map(r=>{const all=countries.filter(c=>c.region===r);const n=all.filter(c=>selectedSet.has(c.iso)).length;return <button key={r} aria-pressed={n===all.length} onClick={()=>toggleRegion(r)}>{regionLabels[r]||r} {n}/{all.length}</button>;})}</div>
 <label className="wg-label">個別の国を選ぶ<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="国名・英語名・国コード"/></label>
 <div className="wg-country-grid">{countries.filter(c=>(c.nameJa+' '+c.nameEn+' '+c.iso).toLowerCase().includes(search.toLowerCase())).map(c=><button key={c.iso} aria-pressed={selectedSet.has(c.iso)} onClick={()=>toggle(c.iso)}>{c.flagEmoji} {c.nameJa}</button>)}</div>
 <h3>カテゴリー</h3><div className="wg-row">{DOMAINS.map(([id,label])=>{const available=bank.some(q=>q.domain===id);return <button key={id} disabled={!available} aria-pressed={domains.includes(id)} onClick={()=>setDomains(d=>d.includes(id)?d.filter(x=>x!==id):[...d,id])}>{label}{!available?'（準備中）':''}</button>;})}</div>
 <div className="wg-config"><label>出題数<select value={limit} onChange={e=>setLimit(Number(e.target.value))}>{[5,10,20,30,50].map(n=><option key={n}>{n}</option>)}</select></label>
 {mode!=='shuffle'&&<label>チーム数<select value={teams} onChange={e=>setTeams(Number(e.target.value))}>{[2,3,4,5,6,7,8].map(n=><option key={n}>{n}</option>)}</select></label>}
 <label className="wg-check"><input type="checkbox" checked={teacher} onChange={e=>setTeacher(e.target.checked)}/> Teacher's Mode（先生が正解発表を操作）</label></div>
 <div className="wg-start"><div><strong>{pool.length.toLocaleString()}問</strong><p>利用可能な問題 · 今回は最大{Math.min(pool.length,limit)}問</p></div><button className="wg-primary" disabled={!pool.length} onClick={start}>ゲーム開始 →</button></div>
 <p className="wg-note">現在は地理・時差の独立した問題を使用します。JICA世界日記は出題対象外です。AIA教材由来の独自問題は利用条件・内容確認後に追加します。複数端末オンライン対戦は未実装です。</p></section></>:<>
 <div className="wg-game-title"><h1>{MODES.find(m=>m.id===game.mode)?.name}</h1><span>{Math.min(game.round+1,game.limit)} / {game.limit}</span></div><Scoreboard game={game}/>
 {game.phase==='finished'?<section className="wg-settings"><h2>🏆 GAME COMPLETE</h2>{standings(game).map((t,i)=><p key={t.id} className="wg-result"><strong>{i+1}. {t.name}</strong><span>{game.mode==='territory'?t.territories+'か国':game.mode==='journey'?t.money+' TPM':t.score+' pts'}</span></p>)}<button className="wg-primary" onClick={()=>setGame(null)}>設定に戻る</button></section>:<>
 {game.mode==='territory'&&<><h2 className="wg-turn">{game.teams[game.turn].name} のターン</h2><TerritoryMap game={game} onPick={iso=>setGame(g=>selectTerritory(g,iso))}/></>}
 {game.mode==='journey'&&<JourneyBoard game={game} onRoll={()=>setGame(g=>rollJourney(g,1+Math.floor(Math.random()*6)))}/>}
 {game.question&&<QuizCard key={game.question.id+'-'+(game.mode==='battle'&&game.phase==='question'?game.turn:'review')} game={game} setGame={setGame} teacher={teacher}/>}
 </>}</>}
 </main>;
}
