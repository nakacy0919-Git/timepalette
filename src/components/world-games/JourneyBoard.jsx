import {useEffect,useRef,useState} from 'react';
import {TRAVEL_MODES} from '../../utils/worldGameStrategy.js';
import {journeyStop,journeyPage,journeyReading} from '../../utils/worldJourneyStops.js';
import JourneyAtlas from './JourneyAtlas.jsx';
import {playUiSound} from '../../utils/uiSound.js';
import flags from '../../data/exploreCountryFlags.json';

const patterns=[[],[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
const faces=[1,6,2,5,3,4];
const angles={1:[0,0],6:[0,180],2:[0,-90],5:[0,90],3:[-90,0],4:[90,0]};
function DiceFaces(){return faces.map((v,i)=><span key={v} className={'wj-face wj-face-'+i}>{Array.from({length:9},(_,p)=><i key={p} className={patterns[v].includes(p)?'pip':''}/>)}</span>);}
function DicePreview(){return <span className="wj-dice-preview" aria-hidden="true"><span className="wj-preview-cube"><DiceFaces/></span></span>;}
function MapDice({value,rolling,origin,index,count,spacing}){
 const [x,y]=angles[value],offset=(index-(count-1)/2)*spacing;
 const dx=origin.x-offset,dy=origin.y;
 return <div className={'wj-map-die '+(rolling?'rolling':'landed')} style={{'--offset':offset+'px','--dx':dx+'px','--dy':dy+'px','--rx':x+'deg','--ry':y+'deg','--sway':(index%2===0?1:-1)*18+'px','--delay':index*70+'ms'}}>
 <div className="wj-map-die-shadow"/><div className="wj-map-die-flight"><div className="wj-dice-cube"><DiceFaces/></div></div>
 {!rolling&&<b className="wj-map-die-number">{value}</b>}</div>;
}
export default function JourneyBoard({game,onRoll,countryName,countryFlag,speed='slow',scoreboard,onExit,sound,onToggleSound,full,onFullscreen,onSpeedChange,canControl=true,remoteRoll,onRequestRoll,roomLabel}){
 const team=game.teams[game.turn],stops=game.journeyStops;
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [travel,setTravel]=useState('standard'),[popup,setPopup]=useState(false),[rolling,setRolling]=useState(false),[dice,setDice]=useState([1]),[moving,setMoving]=useState(false),[cursor,setCursor]=useState(team.position);
 const timers=useRef([]),rollRef=useRef(false),callback=useRef(onRoll),boardRef=useRef(null),buttonRef=useRef(null);
 const [throwOrigin,setThrowOrigin]=useState({x:0,y:0,spacing:130});
 callback.current=onRoll;
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
 useEffect(()=>{setCursor(team.position);setTravel('standard');},[game.turn,team.position]);
 const stop=journeyStop(game,cursor),{chapter,next}=journeyPage(game,cursor);
 const kana={'東京':'とうきょう','大阪':'おおさか','福岡':'ふくおか','釜山':'プサン','済州':'チェジュ','北京':'ペキン','上海':'シャンハイ','西安':'シーアン','咸興':'ハムフン','南浦':'ナムポ','新北市':'しんほくし','台中':'たいちゅう'};
 const stepMs=speed==='fast'?230:850;
 const later=(fn,ms)=>{const t=setTimeout(fn,ms);timers.current.push(t);};
 const roll=(plan=null)=>{
  if(rollRef.current||game.phase!=='select'||(!plan&&(settingsOpen||!canControl)))return;
  if(!plan&&onRequestRoll){onRequestRoll(travel);return;}
  if(plan)setSettingsOpen(false);
  rollRef.current=true;
  const selectedTravel=plan?.travel||travel,values=plan?.values||Array.from({length:game.diceCount||1},()=>1+Math.floor(Math.random()*6)),value=values.reduce((a,b)=>a+b,0),extra=TRAVEL_MODES[selectedTravel].extra;
  const reduced=!plan&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const board=boardRef.current?.getBoundingClientRect(),button=buttonRef.current?.getBoundingClientRect();if(board&&button)setThrowOrigin({x:button.left+button.width*.18-board.left-board.width/2,y:button.top+button.height/2-board.top-board.height*.50,spacing:Math.min(172,Math.max(76,board.width*.21))});
  playUiSound('diceRoll');setDice(values);setMoving(true);setPopup(true);setRolling(true);
  later(()=>{
   setRolling(false);playUiSound('diceReveal');
   later(()=>{
    setPopup(false);
    const count=value+extra;
    for(let i=1;i<=count;i++)later(()=>setCursor((team.position+i)%stops.length),(i-1)*(reduced?0:stepMs));
    later(()=>{rollRef.current=false;setMoving(false);if(!plan)callback.current(selectedTravel,values);},count*(reduced?0:stepMs)+120);
   },1600);
  },reduced?0:2440);
 };
 
 useEffect(()=>{if(remoteRoll&&remoteRoll.round===game.round)roll(remoteRoll);},[remoteRoll?.id]);
 return <section ref={boardRef} className="wj-board" aria-label="世界旅行すごろく">
  {roomLabel&&<div className="wj-room-badge" role="status">{roomLabel}</div>}
  <JourneyAtlas game={game} cursor={cursor} moving={moving&&!popup} stepMs={stepMs} countryName={countryName} countryFlag={countryFlag} settingsOpen={settingsOpen} onCloseSettings={()=>setSettingsOpen(false)} settingsContent={<div className="wj-settings-extra"><button aria-pressed={sound} onClick={onToggleSound}>{sound?'🔊 効果音 ON':'🔇 効果音 OFF'}</button><button onClick={onFullscreen}>{full?'全画面解除':'⛶ 全画面'}</button><button aria-pressed={speed==='slow'} disabled={!!onRequestRoll} onClick={()=>onSpeedChange('slow')}>🐢 ゆっくり</button><button aria-pressed={speed==='fast'} disabled={!!onRequestRoll} onClick={()=>onSpeedChange('fast')}>⚡ 高速</button><button className="wj-exit-button" onClick={onExit}>← ゲームを終了</button></div>}/>
  <div className={"wj-stage-hud"+(moving&&!popup?" wj-stage-traveling":"")}><div className="wj-stage-location" aria-hidden={moving&&!popup}><img src={flags.flags[stop.country]} alt=""/><div><small>{countryName(stop.country)} · {chapter+1}/{game.route.length}か国</small><strong>{journeyReading(stop.label)?<ruby>{stop.label}<rt>{journeyReading(stop.label)}</rt></ruby>:stop.label}</strong></div><span className="wj-stage-round">{Math.min(game.round+1,game.limit)}/{game.limit}</span></div><div className="wj-stage-scores">{scoreboard}</div></div>
  <button className="wj-stage-settings" type="button" aria-label="ゲーム設定" aria-expanded={settingsOpen} disabled={moving||popup||game.phase!=='select'} onClick={()=>setSettingsOpen(v=>!v)}>⚙️ <span>設定</span></button>
  <div className="wj-stage-footer"><div className="wj-stage-turn" style={{'--turn-color':team.color}}><span className="wj-turn-dot"/><div><b>{team.name} のターン</b><small>{moving?'移動中…':game.phase==='select'?(canControl?'サイコロを振って出発！':'ほかのチームのターンです'):'クイズに挑戦！'}</small></div></div><div className="wj-stage-actions">{game.phase==='select'&&<>{game.travelEconomy&&<select aria-label="移動パス" value={travel} disabled={!canControl||moving||popup||settingsOpen} onChange={e=>setTravel(e.target.value)}>{Object.entries(TRAVEL_MODES).map(([id,o])=><option key={id} value={id} disabled={team.money<o.cost}>{o.icon} {o.label} · {o.cost} TPM</option>)}</select>}<button ref={buttonRef} className="wg-primary wj-roll" disabled={!canControl||moving||popup||settingsOpen} onClick={()=>roll()}><DicePreview/><span><small>{moving?'移動中':'タップして出発！'}</small><strong>サイコロを振る</strong></span><b>{game.diceCount||1}個</b></button></>}{game.phase!=='select'&&game.dice!==null&&<strong className="wj-last-roll">🎲 {game.dice} → {journeyStop(game,team.position).label}</strong>}</div></div>
  {popup&&<div className="wj-dice-map-overlay" role="dialog" aria-modal="true" aria-label="サイコロ">
   {!rolling&&<div className="wj-dice-map-result wj-dice-landed-title" role="status"><small>{team.name} のターン</small><div><span>合計</span><b>{dice.reduce((sum,n)=>sum+n,0)}</b><span>マス！</span></div></div>}
   {dice.map((value,i)=><MapDice key={i} value={value} rolling={rolling} origin={throwOrigin} index={i} count={dice.length} spacing={throwOrigin.spacing}/>)}
   {!rolling&&<div className="wj-dice-map-hint">✨ {dice.join(' ＋ ')} ＝ {dice.reduce((sum,n)=>sum+n,0)}　出発！</div>}
  </div>}
 </section>;
}
