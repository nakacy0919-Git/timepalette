import {Children,useLayoutEffect,useRef} from 'react';
import './mission-choice.css';

export function MissionChoiceText({children}){
  const ref=useRef(null);
  useLayoutEffect(()=>{
    const label=ref.current,button=label.closest('button');
    if(!button)return;
    let frame,active=true;
    const fit=()=>{
      const style=getComputedStyle(button),paddingY=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
      const width=label.clientWidth;
      let otherHeight=0;
      if(style.display!=='flex'||style.flexDirection==='column'){
        for(const sibling of button.children){
          if(sibling===label||sibling.contains(label))continue;
          if(getComputedStyle(sibling).position!=='absolute')otherHeight+=sibling.getBoundingClientRect().height;
        }
      }
      const height=Math.max(20,button.clientHeight-paddingY-otherHeight-4);
      if(!width)return;
      const max=Math.min(20,Math.max(15,button.clientHeight*.16));
      // Measure the actual wrapped text in the actual button, including Japanese.
      let font=max;
      label.style.fontSize=font+'px';
      while(font>13&&(label.scrollHeight>height+1||label.scrollWidth>width+1)){
        font=Math.max(13,font-.5);label.style.fontSize=font+'px';
      }
    };
    const schedule=()=>{if(!active)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(fit);};
    fit();
    const observer=new ResizeObserver(schedule);observer.observe(button);
    document.fonts?.ready.then(schedule);
    return()=>{active=false;observer.disconnect();cancelAnimationFrame(frame);};
  },[children]);
  return <span ref={ref} className="mission-choice-label">{children}</span>;
}

export default function MissionChoiceButton({children,className='',...props}){
  const nodes=Children.toArray(children);
  const textOnly=nodes.every(child=>typeof child==='string'||typeof child==='number');
  return <button {...props} className={`mission-choice ${textOnly?'mission-choice--text':''} ${className}`}>
    {textOnly?<MissionChoiceText>{nodes.join('')}</MissionChoiceText>:children}
  </button>;
}
