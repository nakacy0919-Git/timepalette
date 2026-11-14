import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import CreatorReflectionPlayer from '../src/components/world-learning/CreatorReflectionPlayer.jsx';
import '../src/index.css';
function Preview(){
  const [mode,setMode]=useState(null),[clears,setClears]=useState(0);
  const mission={id:'qa-reflection',type:'creator-reflection',prompt:'写真から気づいたことを一つ挙げ、そう考えた手がかりを説明しましょう。',referenceAnswer:'一つの見方だけでなく、別の見方も考えてみましょう。',explanation:'写真で直接確かめられることと、推測したことを分けて説明します。',materials:mode==='photo'?[{type:'image',url:'/geography/photos/af.jpg'}]:[],sourceUrls:[]};
  return <main className="p-6"><h1>自由回答の確認用教材（本番データには保存しません）</h1><button className="m-3 border p-3" onClick={()=>setMode('photo')}>写真で考える</button><button className="m-3 border p-3" onClick={()=>setMode('text')}>文章で考える</button><p role="status">確認用の完了回数：{clears}</p>{mode&&<CreatorReflectionPlayer key={mode} mission={mission} position={1} total={1} onClose={()=>setMode(null)} onComplete={()=>setClears(n=>n+1)} alreadyCompleted={false}/>}</main>;
}
createRoot(document.getElementById('root')).render(<Preview/>);
