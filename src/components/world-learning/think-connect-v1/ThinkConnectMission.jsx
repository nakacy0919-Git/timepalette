import { Check } from 'lucide-react';
import { useMemo, useState } from 'react';
import { playUiSound } from '../../../utils/uiSound';

function Hint({children}) {
  return <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-bold leading-5 text-rose-700">💡 {children}</div>;
}

function FinishButton({ready,onClick,label='Mission Clear'}) {
  return <button type="button" disabled={!ready} onClick={onClick}
    className="mt-4 w-full rounded-xl bg-fuchsia-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-fuchsia-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none">
    {label}
  </button>;
}

function SelfCompare({mission,interaction,onClear}) {
  const items=interaction?.items??[];
  const [answers,setAnswers]=useState({});
  const ready=items.every(x=>answers[x.id]);
  const labels=[['same','🙂 似ている'],['different','↔️ 違う'],['unknown','❓ まだわからない']];
  return <div>
    <p className="text-[10px] font-black tracking-[.15em] text-fuchsia-500">COMPARE WITH YOURSELF</p>
    <div className="mt-3 grid gap-2.5">
      {items.map(item=><div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-[12px] font-black leading-5 text-slate-800">{item.label}</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {labels.map(([value,label])=><button key={value} type="button" onClick={()=>{setAnswers(v=>({...v,[item.id]:value}));playUiSound('tap');}}
            className={`rounded-xl border-2 px-2 py-2 text-[10px] font-black ${answers[item.id]===value?'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-800':'border-slate-200 bg-slate-50 text-slate-500'}`}>{label}</button>)}
        </div>
      </div>)}
    </div>
    <FinishButton ready={ready} onClick={()=>{playUiSound('success');onClear(mission);}} label="比較を保存"/>
  </div>;
}

function ThreeWaySort({mission,interaction,onClear}) {
  const items=interaction?.items??[];
  const [answers,setAnswers]=useState({});
  const [wrong,setWrong]=useState(false);
  const ready=items.every(x=>answers[x.id]);
  const opts=[['fact','📖 FACT'],['idea','💡 MY IDEA'],['need','🔎 NEED MORE']];
  const check=()=>{
    const ok=items.every(x=>answers[x.id]===x.answer);
    playUiSound(ok?'success':'error');
    if(ok)onClear(mission);else setWrong(true);
  };
  return <div>
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((item,i)=><div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="min-h-[70px] text-[12px] font-black leading-5 text-slate-800">{i+1}. {item.text}</p>
        <div className="mt-2 grid gap-1.5">
          {opts.map(([value,label])=><button key={value} type="button" onClick={()=>{setWrong(false);setAnswers(v=>({...v,[item.id]:value}));}}
            className={`rounded-xl border-2 px-2 py-2 text-[10px] font-black ${answers[item.id]===value?'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-800':'border-slate-200 bg-slate-50 text-slate-500'}`}>{label}</button>)}
        </div>
      </div>)}
    </div>
    <FinishButton ready={ready} onClick={check} label="分類をチェック"/>
    {wrong&&<Hint>事実・自分の考え・資料だけでは分からないことをもう一度分けよう。</Hint>}
  </div>;
}

function QuestionLab({mission,interaction,onClear}) {
  const pairs=interaction?.pairs??[];
  const [answers,setAnswers]=useState({});
  const [wrong,setWrong]=useState(false);
  const ready=pairs.every(x=>answers[x.id]);
  const check=()=>{
    const ok=pairs.every(x=>answers[x.id]==='good');
    playUiSound(ok?'success':'error');
    if(ok)onClear(mission);else setWrong(true);
  };
  return <div>
    <p className="text-[10px] font-black tracking-[.15em] text-fuchsia-500">WHICH QUESTION OPENS A CONVERSATION?</p>
    <div className="mt-3 grid gap-3">
      {pairs.map((p,i)=><div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-[10px] font-black text-slate-400">PAIR {i+1}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[['good',p.good],['bad',p.bad]].map(([value,text])=><button key={value} type="button" onClick={()=>{setWrong(false);setAnswers(v=>({...v,[p.id]:value}));}}
            className={`min-h-[72px] rounded-2xl border-2 p-3 text-left text-[11px] font-black leading-5 ${answers[p.id]===value?'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-800':'border-slate-200 bg-slate-50 text-slate-700'}`}>{text}</button>)}
        </div>
      </div>)}
    </div>
    <FinishButton ready={ready} onClick={check} label="質問の質をチェック"/>
    {wrong&&<Hint>相手を決めつけず、相手が自由に説明できる質問を選ぼう。</Hint>}
  </div>;
}

function PerspectiveChoice({mission,interaction,onClear}) {
  const scenarios=interaction?.scenarios??[];
  const [answers,setAnswers]=useState({});
  const [wrong,setWrong]=useState(false);
  const ready=scenarios.every(x=>answers[x.id]);
  const check=()=>{
    const ok=scenarios.every(x=>answers[x.id]==='best');
    playUiSound(ok?'success':'error');
    if(ok)onClear(mission);else setWrong(true);
  };
  return <div>
    <div className="grid gap-3">
      {scenarios.map((s,i)=><div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-[11px] font-black leading-5 text-slate-800">{i+1}. {s.scene}</p>
        <div className="mt-2 grid gap-2">
          {[['best',s.best],['other',s.other]].map(([value,text])=><button key={value} type="button" onClick={()=>{setWrong(false);setAnswers(v=>({...v,[s.id]:value}));}}
            className={`rounded-xl border-2 px-3 py-2.5 text-left text-[11px] font-black ${answers[s.id]===value?'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-800':'border-slate-200 bg-slate-50 text-slate-700'}`}>{text}</button>)}
        </div>
      </div>)}
    </div>
    <FinishButton ready={ready} onClick={check} label="反応をチェック"/>
    {wrong&&<Hint>『評価する』より『もっと知る』につながる反応を選ぼう。</Hint>}
  </div>;
}

function ThreeChoiceBuilder({mission,interaction,onClear,mode}) {
  const groups = mode==='community'
    ? [['課題',interaction?.problems??[]],['行動',interaction?.actions??[]],['一緒にやる人',interaction?.people??[]]]
    : [['JAPAN',interaction?.japan??[]],['RWANDA',interaction?.rwanda??[]],['PURPOSE',interaction?.purpose??[]]];
  const [selected,setSelected]=useState({});
  const ready=groups.every((_,i)=>selected[i]);
  return <div>
    <div className="grid gap-3">
      {groups.map(([label,options],i)=><div key={label} className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-[10px] font-black tracking-[.12em] text-fuchsia-500">{label}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {options.map(option=><button key={option} type="button" onClick={()=>{setSelected(v=>({...v,[i]:option}));playUiSound('tap');}}
            className={`rounded-xl border-2 px-3 py-2.5 text-left text-[11px] font-black ${selected[i]===option?'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-800':'border-slate-200 bg-slate-50 text-slate-700'}`}>{option}</button>)}
        </div>
      </div>)}
    </div>
    {ready&&<div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-[12px] font-black leading-6 text-emerald-800">
      {mode==='community'?'COMMUNITY PLAN':'FUSION CARD'}： {selected[0]} ＋ {selected[1]} → {selected[2]}
    </div>}
    <FinishButton ready={ready} onClick={()=>{playUiSound('success');onClear(mission);}} label={mode==='community'?'Community Plan完成':'Fusion Card完成'}/>
  </div>;
}

function AgendaBuilder({mission,interaction,onClear}) {
  const activities=interaction?.activities??[];
  const target=interaction?.targetMinutes??20;
  const required=interaction?.required??[];
  const [selected,setSelected]=useState([]);
  const total=selected.reduce((sum,id)=>sum+(activities.find(x=>x.id===id)?.minutes??0),0);
  const ready=total===target && required.every(id=>selected.includes(id));
  const toggle=id=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
  return <div>
    <div className={`rounded-2xl border p-4 text-center ${total===target?'border-emerald-200 bg-emerald-50':'border-fuchsia-200 bg-fuchsia-50'}`}>
      <p className="text-[10px] font-black tracking-[.15em] text-slate-500">TIME BUDGET</p>
      <p className="mt-1 text-3xl font-black text-slate-900">{total} / {target} min</p>
      <p className="mt-1 text-[10px] font-bold text-slate-500">Hello・Questions・Final message は必須</p>
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2">
      {activities.map(item=>{const active=selected.includes(item.id);return <button key={item.id} type="button" onClick={()=>{toggle(item.id);playUiSound('tap');}}
        className={`rounded-2xl border-2 p-3 text-left ${active?'border-fuchsia-500 bg-fuchsia-50':'border-slate-200 bg-white'}`}>
        <p className="text-[11px] font-black text-slate-800">{item.label}</p><p className="mt-1 text-[10px] font-bold text-slate-400">{item.minutes} min</p>
      </button>})}
    </div>
    <FinishButton ready={ready} onClick={()=>{playUiSound('success');onClear(mission);}} label="20分プラン完成"/>
  </div>;
}

function PairMatch({mission,interaction,onClear,finalMode=false}) {
  const pairs=interaction?.pairs??[];
  const right=useMemo(()=>pairs.map(x=>({id:x.id,text:x.right})).reverse(),[pairs]);
  const [left,setLeft]=useState(null); const [rightSel,setRightSel]=useState(null); const [matched,setMatched]=useState([]); const [wrong,setWrong]=useState(false);
  const resolve=(a,b)=>{
    if(!a||!b)return;
    if(a===b){const next=[...matched,a];setMatched(next);setLeft(null);setRightSel(null);setWrong(false);playUiSound('success');if(next.length===pairs.length)window.setTimeout(()=>onClear(mission),finalMode?500:300);}
    else {setWrong(true);playUiSound('error');window.setTimeout(()=>{setLeft(null);setRightSel(null);setWrong(false);},600);}
  };
  return <div>
    <div className="flex justify-end"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700">{matched.length}/{pairs.length} MATCH</span></div>
    <div className="mt-3 grid grid-cols-2 gap-3">
      <div className="space-y-2">{pairs.map(item=>{const done=matched.includes(item.id);return <button key={item.id} disabled={done} onClick={()=>{setLeft(item.id);if(rightSel)resolve(item.id,rightSel);}} className={`min-h-[58px] w-full rounded-2xl border-2 p-3 text-left text-[11px] font-black ${done?'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60':left===item.id?'border-fuchsia-500 bg-fuchsia-50':'border-slate-200 bg-white'}`}>{done?'✓ ':''}{item.left}</button>})}</div>
      <div className="space-y-2">{right.map(item=>{const done=matched.includes(item.id);return <button key={item.id} disabled={done} onClick={()=>{setRightSel(item.id);if(left)resolve(left,item.id);}} className={`min-h-[58px] w-full rounded-2xl border-2 p-3 text-left text-[10px] font-black ${done?'border-emerald-300 bg-emerald-50 text-emerald-700 opacity-60':rightSel===item.id?'border-blue-500 bg-blue-50':'border-slate-200 bg-white'}`}>{done?'✓ ':''}{item.text}</button>})}</div>
    </div>
    {wrong&&<Hint>その組み合わせではありません。資料の役割を考えよう。</Hint>}
  </div>;
}

function MessageBuilder({mission,interaction,onClear}) {
  const steps=interaction?.steps??[];
  const [selected,setSelected]=useState({});
  const ready=steps.every(x=>selected[x.id]);
  return <div>
    <div className="grid gap-3">
      {steps.map(step=><div key={step.id} className="rounded-2xl border border-slate-200 bg-white p-3">
        <p className="text-[10px] font-black tracking-[.15em] text-fuchsia-500">{step.label}</p>
        <div className="mt-2 grid gap-2">
          {step.options.map(option=><button key={option} type="button" onClick={()=>{setSelected(v=>({...v,[step.id]:option}));playUiSound('tap');}}
            className={`rounded-xl border-2 px-3 py-2.5 text-left text-[11px] font-black ${selected[step.id]===option?'border-fuchsia-500 bg-fuchsia-50 text-fuchsia-800':'border-slate-200 bg-slate-50 text-slate-700'}`}>{option}</button>)}
        </div>
      </div>)}
    </div>
    {ready&&<div className="mt-4 rounded-[22px] bg-slate-950 p-4 text-white"><p className="text-[9px] font-black tracking-[.16em] text-fuchsia-300">YOUR EXCHANGE SCRIPT</p><div className="mt-2 space-y-1 text-sm font-black leading-6">{steps.map(s=><p key={s.id}>{selected[s.id]}</p>)}</div></div>}
    <FinishButton ready={ready} onClick={()=>{playUiSound('success');onClear(mission);}} label="交流スクリプト完成"/>
  </div>;
}

export default function ThinkConnectMission({mission,onClear}) {
  const interaction=mission?.interaction??{};
  switch(interaction.type){
    case 'self-compare-board': return <SelfCompare mission={mission} interaction={interaction} onClear={onClear}/>;
    case 'three-way-sort': return <ThreeWaySort mission={mission} interaction={interaction} onClear={onClear}/>;
    case 'question-lab': return <QuestionLab mission={mission} interaction={interaction} onClear={onClear}/>;
    case 'perspective-choice': return <PerspectiveChoice mission={mission} interaction={interaction} onClear={onClear}/>;
    case 'community-builder': return <ThreeChoiceBuilder mission={mission} interaction={interaction} onClear={onClear} mode="community"/>;
    case 'agenda-builder': return <AgendaBuilder mission={mission} interaction={interaction} onClear={onClear}/>;
    case 'fusion-builder': return <ThreeChoiceBuilder mission={mission} interaction={interaction} onClear={onClear} mode="fusion"/>;
    case 'source-lens-match': return <PairMatch mission={mission} interaction={interaction} onClear={onClear}/>;
    case 'message-builder': return <MessageBuilder mission={mission} interaction={interaction} onClear={onClear}/>;
    case 'final-connect': return <PairMatch mission={mission} interaction={interaction} onClear={onClear} finalMode/>;
    default: return <div className="rounded-2xl bg-white p-4 font-black">Unknown mission type</div>;
  }
}
