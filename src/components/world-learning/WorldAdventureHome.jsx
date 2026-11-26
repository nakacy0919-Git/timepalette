import { lazy, Suspense, useState } from 'react';
import { ArrowRight, Compass, Globe2, Shuffle, Trophy, Map, Dices } from 'lucide-react';
import { buildLearnerJourney } from '../../utils/learnerJourneyProgress.js';
import JourneySummaryCard from './JourneySummaryCard.jsx';
import HomeToolsButton from '../navigation/HomeToolsButton';
import timePaletteLogo from '../../assets/branding/timepalette_global_adventure_logo.png';
import openingBackground from '../../assets/opening/timepalette_opening_background.png';
import { getLiveWorldLearningCountries } from '../../utils/worldLearningRegistry';
import { playUiSound } from '../../utils/uiSound';
import './worldActivityHome.css';
const MyWorldJourney = lazy(() => import('./MyWorldJourney.jsx'));

const ACTIVITIES=[
 {id:'adventure',name:'World Adventure',ja:'世界の冒険学習',description:'国を訪れ、6分野のミッションに挑戦',Icon:Compass},
 {id:'shuffle',name:'World Shuffle',ja:'世界ランダムクイズ',description:'国や地域を選んで4択クイズ',Icon:Shuffle},
 {id:'battle',name:'World Quiz Battle',ja:'世界クイズ対抗戦',description:'チームで知識を競い合おう',Icon:Trophy},
 {id:'territory',name:'World Territory',ja:'世界陣取りゲーム',description:'正解して地図のエリアを広げよう',Icon:Map},
 {id:'journey',name:'World Journey',ja:'世界旅行すごろく',description:'旅をしてTimePalette Moneyを集めよう',Icon:Dices},
];
export default function WorldAdventureHome({onExploreWorld,onOpenTool,onOpenGame}){
 const liveCountries=getLiveWorldLearningCountries();
 const [showJourney,setShowJourney]=useState(false);
 const journey=buildLearnerJourney(liveCountries);
 const startAdventure=()=>{playUiSound('open');onExploreWorld?.();};
 const select=id=>{if(id==='adventure')startAdventure();else onOpenGame?.(id);};
 return <div className="tp-activity-home">
  <HomeToolsButton onSelectTool={onOpenTool}/>
  <img src={openingBackground} alt="" aria-hidden="true" className="tp-home-background"/>
  <div className="tp-home-shade" aria-hidden="true"/>
  <div className="tp-home-content">
   <div className="tp-home-brand"><img src={timePaletteLogo} alt="TimePalette 世界の冒険学習"/></div>
   <section className="tp-home-hero">
    <div className="tp-home-copy">
     <div className="tp-home-tag"><Globe2 size={15}/> EXPLORE · LEARN · CONNECT</div>
     <h1>世界を、<span>冒険しながら学ぶ。</span></h1>
     <p>世界の国を訪れ、地図・時間・ことば・文化から新しい発見をしよう。</p>
    </div>
    <div id="journey" className="tp-home-progress"><JourneySummaryCard summary={journey} onOpen={()=>setShowJourney(true)}/></div>
   </section>
   <section className="tp-home-activities" aria-label="5つのアクティビティ">
    <div className="tp-home-activity-heading"><span>CHOOSE YOUR ADVENTURE</span><strong>5つの冒険から選ぼう</strong><button type="button" className="tp-home-compact-progress" onClick={()=>setShowJourney(true)}>世界探究のあしあと <span>{journey.exploredCountries}/{journey.totalCountries}</span><ArrowRight size={16}/></button></div>
    <div className="tp-home-grid">
     {ACTIVITIES.map(({id,name,ja,description,Icon})=><button key={id} type="button" data-activity={id} className={'tp-home-tile tp-home-tile-'+id} onClick={()=>select(id)}>
      <span className="tp-home-tile-art" aria-hidden="true"><Globe2 className="tp-tile-orbit"/><Icon className="tp-tile-icon" strokeWidth={1.7}/></span>
      <span className="tp-home-tile-copy"><strong>{name}</strong><span className="tp-home-tile-ja">{ja}</span><small>{description}</small></span>
      <span className="tp-home-tile-arrow" aria-hidden="true"><ArrowRight size={19}/></span>
     </button>)}
    </div>
   </section>
  </div>
  {showJourney&&<Suspense fallback={<div role="status" className="fixed inset-0 z-[100] flex items-center justify-center bg-[#061123] text-cyan-100">進捗を読み込み中…</div>}><MyWorldJourney summary={journey} onClose={()=>setShowJourney(false)} onExplore={()=>{setShowJourney(false);startAdventure();}}/></Suspense>}
 </div>;
}
