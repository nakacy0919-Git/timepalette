import {useEffect,useRef,useState} from 'react';
import {Wrench} from 'lucide-react';
import ToolsMenu from './ToolsMenu';

export default function HomeToolsButton({onSelectTool}){
 const [open,setOpen]=useState(false);const root=useRef(null),button=useRef(null);
 useEffect(()=>{const outside=e=>{if(!root.current?.contains(e.target))setOpen(false);};const escape=e=>{if(e.key==='Escape'){setOpen(false);button.current?.focus();}};document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};},[]);
 return <div ref={root} className="absolute right-4 top-4 z-[1001] text-slate-900 sm:right-6 sm:top-6" data-testid="home-tools"><button ref={button} type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} className="flex min-h-11 items-center gap-2 rounded-full border border-white/70 bg-white/95 px-4 py-2 text-sm font-bold text-slate-700 shadow-lg"><Wrench size={16}/>ツール</button>{open&&<ToolsMenu onSelectTool={onSelectTool} onClose={()=>setOpen(false)}/>}</div>;
}
