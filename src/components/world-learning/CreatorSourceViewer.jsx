import {useEffect,useRef,useState} from 'react';

export function safeSourceUrl(value){
 try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null;}catch{return null;}
}

export function ExplanationLinks({text,onOpen}){
 return String(text||'').split(/(https?:\/\/[^\s<>「」『』【】（）]+)/g).map((part,index)=>{
  const match=part.match(/^(https?:\/\/.*?)([。、,;！!？?]*)$/);
  const url=match&&safeSourceUrl(match[1]);
  return url?<span key={index}><button type="button" className="tp-source-link" onClick={()=>onOpen(url)} aria-label={`資料を開く：${new URL(url).hostname}`}>📖 {new URL(url).hostname} の資料を読む</button>{match[2]}</span>:part;
 });
}

export default function CreatorSourceViewer({url,onClose}){
 const close=useRef(null);const [loading,setLoading]=useState(true);
 useEffect(()=>{const previous=document.activeElement;close.current?.focus();return()=>previous?.focus();},[]);
 const safe=safeSourceUrl(url);
 if(!safe)return null;
 return <section className="tp-source-viewer" role="dialog" aria-modal="true" aria-label="TimePalette 資料ビュー" onKeyDown={event=>{if(event.key==='Escape'){event.stopPropagation();onClose();}}}>
  <header><div><strong>📖 資料を見てみよう</strong><p>{new URL(safe).hostname}</p></div><button ref={close} type="button" onClick={onClose}>解説に戻る ×</button></header>
  <p className="tp-source-notice">{loading?'資料を読み込んでいます。 ':''}外部サイトの設定により、この画面では表示できない資料もあります。その場合は解説に戻って学習を続けられます。</p>
  <iframe title="参考資料" src={safe} sandbox="allow-scripts allow-forms" referrerPolicy="no-referrer" onLoad={()=>setLoading(false)}/>
 </section>;
}
