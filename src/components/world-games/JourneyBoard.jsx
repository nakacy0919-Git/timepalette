import {useEffect,useRef,useState} from 'react';
import {TRAVEL_MODES} from '../../utils/worldGameStrategy.js';
import {journeyStop,journeyPage,journeyReading} from '../../utils/worldJourneyStops.js';
import JourneyAtlas from './JourneyAtlas.jsx';
import {playUiSound} from '../../utils/uiSound.js';
import flags from '../../data/exploreCountryFlags.json';

const patterns=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
const faces=[1,6,2,5,3,4];
const angles={1:[0,0],6:[0,180],2:[0,-90],5:[0,90],3:[-90,0],4:[90,0]};
function Dice({value,rolling}){
 const [x,y]=angles[value];
 return <div className={'wj-dice-stage '+(rolling?'rolling':'')}><div className="wj-dice-shadow"/><div className="wj-dice-flight"><div className="wj-dice-cube" style={{'--rx':x+'deg','--ry':y+'deg'}}>{faces.map((v,i)=><div key={v} className={'wj-face wj-face-'+i}>{Array.from({length:9},(_,p)=><i key={p} className={patterns[v].includes(p)?'pip':''}/>)}</div>)}</div></div></div>;
}
export default function JourneyBoard({game,onRoll,countryName,countryFlag,speed='slow',scoreboard,onExit,sound,onToggleSound,full,onFullscreen,onSpeedChange}){
 const team=game.teams[game.turn],stops=game.journeyStops;
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [travel,setTravel]=useState('standard'),[popup,setPopup]=useState(false),[rolling,setRolling]=useState(false),[dice,setDice]=useState([1]),[moving,setMoving]=useState(false),[cursor,setCursor]=useState(team.position);
 const timers=useRef([]),rollRef=useRef(false),callback=useRef(onRoll);
 callback.current=onRoll;
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
 useEffect(()=>{setCursor(team.position);setTravel('standard');},[game.turn,team.position]);
 const stop=journeyStop(game,cursor),{chapter,next}=journeyPage(game,cursor);
 const kana={'東京':'とうきょう','大阪':'おおさか','福岡':'ふくおか','釜山':'プサン','済州':'チェジュ','北京':'ペキン','上海':'シャンハイ','西安':'シーアン','咸興':'ハムフン','南浦':'ナムポ','新北市':'しんほくし','台中':'たいちゅう'};
 const stepMs=speed==='fast'?230:850;
 const later=(fn,ms)=>{const t=setTimeout(fn,ms);timers.current.push(t);};
 const roll=()=>{
  if(rollRef.current||game.phase!=='select'||settingsOpen)return;
  rollRef.current=true;
  const values=Array.from({length:game.diceCount||1},()=>1+Math.floor(Math.random()*6)),value=values.reduce((a,b)=>a+b,0),extra=TRAVEL_MODES[travel].extra;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  playUiSound('diceRoll');setDice(values);setMoving(true);setPopup(true);setRolling(true);
  later(()=>{
   setRolling(false);playUiSound('diceReveal');
   later(()=>{
    setPopup(false);
    const count=value+extra;
    for(let i=1;i<=count;i++)later(()=>setCursor((team.position+i)%stops.length),(i-1)*(reduced?0:stepMs));
    later(()=>{rollRef.current=false;setMoving(false);callback.current(travel,values);},count*(reduced?0:stepMs)+120);
   },reduced?0:1200);
  },reduced?0:1550);
 };
 
 return <section className="wj-board" aria-label="世界旅行すごろく">
  <JourneyAtlas game={game} cursor={cursor} moving={moving&&!popup} stepMs={stepMs} countryName={countryName} countryFlag={countryFlag} settingsOpen={settingsOpen} onCloseSettings={()=>setSettingsOpen(false)} settingsContent={<div className="wj-settings-extra"><button aria-pressed={sound} onClick={onToggleSound}>{sound?'🔊 効果音 ON':'🔇 効果音 OFF'}</button><button onClick={onFullscreen}>{full?'全画面解除':'⛶ 全画面'}</button><button aria-pressed={speed==='slow'} onClick={()=>onSpeedChange('slow')}>🐢 ゆっくり</button><button aria-pressed={speed==='fast'} onClick={()=>onSpeedChange('fast')}>⚡ 高速</button><button className="wj-exit-button" onClick={onExit}>← ゲームを終了</button></div>}/>
  <div className="wj-stage-hud"><div className="wj-stage-location"><img src={flags.flags[stop.country]} alt=""/><div><small>{countryName(stop.country)} · {chapter+1}/{game.route.length}か国</small><strong>{journeyReading(stop.label)?<ruby>{stop.label}<rt>{journeyReading(stop.label)}</rt></ruby>:stop.label}</strong></div><span className="wj-stage-round">{Math.min(game.round+1,game.limit)}/{game.limit}</span></div><div className="wj-stage-scores">{scoreboard}</div></div>
  <button className="wj-stage-settings" type="button" aria-label="ゲーム設定" aria-expanded={settingsOpen} disabled={moving||popup||game.phase!=='select'} onClick={()=>setSettingsOpen(v=>!v)}>⚙️ <span>設定</span></button>
  <div className="wj-stage-footer"><div className="wj-stage-turn" style={{'--turn-color':team.color}}><span className="wj-turn-dot"/><div><b>{team.name} のターン</b><small>{moving?'移動中…':game.phase==='select'?'サイコロを振って出発！':'クイズに挑戦！'}</small></div></div><div className="wj-stage-actions">{game.phase==='select'&&<>{game.travelEconomy&&<select aria-label="移動パス" value={travel} disabled={moving||popup||settingsOpen} onChange={e=>setTravel(e.target.value)}>{Object.entries(TRAVEL_MODES).map(([id,o])=><option key={id} value={id} disabled={team.money<o.cost}>{o.icon} {o.label} · {o.cost} TPM</option>)}</select>}<button className="wg-primary wj-roll" disabled={moving||popup||settingsOpen} onClick={roll}><span aria-hidden="true" className="wj-roll-icon">🎲</span><span><small>{moving?'移動中':'タップして出発！'}</small><strong>サイコロを振る</strong></span><b>{game.diceCount||1}個</b></button></>}{game.phase!=='select'&&game.dice!==null&&<strong className="wj-last-roll">🎲 {game.dice} → {journeyStop(game,team.position).label}</strong>}</div></div>
  {popup&&<div className="wg-overlay" role="dialog" aria-modal="true" aria-label="サイコロ"><div className="wj-dice-popup"><h2>{rolling?'サイコロを振ろう！':<>合計 <b className="wj-dice-total">{dice.reduce((a,b)=>a+b,0)}</b> マス！</>}</h2><div className="wj-multi-dice">{dice.map((value,i)=><div key={i} className="wj-dice-cell"><Dice value={value} rolling={rolling}/>{!rolling&&<b className="wj-dice-result-number">{value}</b>}</div>)}</div><p>{team.name} · {rolling?'サイコロが転がります':'旅を続けよう！'}</p></div></div>}
 </section>;
}
