import { useState } from 'react';
import { ArrowRight, Compass, Globe2, Shuffle, Trophy, Map, Dices } from 'lucide-react';
import HomeToolsButton from '../navigation/HomeToolsButton';
import timePaletteLogo from '../../assets/branding/timepalette_global_adventure_logo.png';
import openingBackground from '../../assets/opening/timepalette_opening_background.png';
import { playUiSound } from '../../utils/uiSound';
import './worldActivityHome.css';

const ACTIVITIES=[
 {id:'adventure',name:'Adventure',ja:'世界の冒険学習',description:'世界の国をめぐり、6つの分野で学ぶ',Icon:Compass},
 {id:'shuffle',name:'Shuffle',ja:'世界ランダムクイズ',description:'国・地域を選んでランダム4択',Icon:Shuffle},
 {id:'battle',name:'Quiz Battle',ja:'世界クイズ対抗戦',description:'みんなで答えるチーム対抗戦',Icon:Trophy},
 {id:'territory',name:'Territory',ja:'世界陣取りゲーム',description:'クイズに正解してエリアを広げよう',Icon:Map},
 {id:'journey',name:'Journey',ja:'世界旅行すごろく',description:'旅をしてTimePalette Moneyを集めよう',Icon:Dices},
];
function ActivityTile({activity,onSelect}){
 const {id,name,ja,description,Icon}=activity;
 const [artFailed,setArtFailed]=useState(false);
 return <button type="button" data-activity={id} className={'tp-home-tile tp-home-tile-'+id} onClick={()=>onSelect(id)}>
  <span className="tp-home-tile-art" aria-hidden="true">
   {!artFailed?<img className="tp-home-card-image" src={import.meta.env.BASE_URL+'world-activities/'+id+'.webp'} alt="" onError={()=>setArtFailed(true)} draggable="false" width={800} height={600}/>:<><Globe2 className="tp-tile-orbit"/><Icon className="tp-tile-icon" strokeWidth={1.7}/></>}
   <span className="tp-home-card-shade"/>
  </span>
  <span className="tp-home-tile-copy"><strong>World <span>{name}</span></strong><span className="tp-home-tile-ja">{ja}</span><small>{description}</small></span>
  <span className="tp-home-tile-arrow" aria-hidden="true"><ArrowRight size={19}/></span>
 </button>;
}
export default function WorldAdventureHome({onExploreWorld,onOpenTool,onOpenGame}){
 const select=id=>{if(id==='adventure'){playUiSound('open');onExploreWorld?.();}else onOpenGame?.(id);};
 return <div className="tp-activity-home">
  <HomeToolsButton onSelectTool={onOpenTool}/>
  <img src={openingBackground} alt="" aria-hidden="true" className="tp-home-background"/>
  <div className="tp-home-shade" aria-hidden="true"/>
  <div className="tp-home-content">
   <div className="tp-home-brand"><img src={timePaletteLogo} alt="TimePalette 世界の冒険学習"/></div>
   <section className="tp-home-hero">
    <div className="tp-home-copy">
     <div className="tp-home-tag"><Globe2 size={15}/> EXPLORE · LEARN · PLAY</div>
     <h1>世界を、<span>ゲームで冒険する。</span></h1>
     <p>5つのアクティビティで、世界の知識と出会い、学びをもっと楽しく。</p>
    </div>
   </section>
   <section className="tp-home-activities" aria-label="5つのアクティビティ">
    <div className="tp-home-grid">{ACTIVITIES.map(activity=><ActivityTile key={activity.id} activity={activity} onSelect={select}/>)}</div>
   </section>
  </div>
 </div>;
}
