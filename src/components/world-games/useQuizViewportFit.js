import {useLayoutEffect,useRef} from 'react';

// Fit the actual content (including ruby, long translated answers and image credits)
// into the visible browser viewport instead of assuming a desktop aspect ratio.
export function useQuizViewportFit(){
 const ref=useRef(null);
 useLayoutEffect(()=>{
  const el=ref.current,parent=el?.parentElement;if(!el||!parent)return;
  let frame=0;
  const fit=()=>{
   el.style.zoom='1';
   const css=getComputedStyle(parent);
   const gap=parseFloat(css.rowGap)||0;
   const siblings=[...parent.children].filter(n=>n!==el);
   const available=Math.max(100,parent.clientHeight-(parseFloat(css.paddingTop)||0)-(parseFloat(css.paddingBottom)||0)-siblings.reduce((h,n)=>h+n.getBoundingClientRect().height+gap,0)-8);
   let zoom=1;
   for(let i=0;i<4;i++){
    const height=el.getBoundingClientRect().height;
    if(height<=available+1)break;
    zoom*=available/height;el.style.zoom=String(zoom);
   }
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(fit);};
  fit();
  window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);el.addEventListener('load',schedule,true);
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(schedule):null;observer?.observe(parent);
  return()=>{cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('resize',schedule);el.removeEventListener('load',schedule,true);};
 });
 return ref;
}
