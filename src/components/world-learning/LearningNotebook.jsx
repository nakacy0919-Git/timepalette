import {useState} from 'react';
import {learningStorage} from '../../utils/classroomSession.js';

const KEY = 'timepalette_learning_notes_v1';
const read = () => {
  try {const value=JSON.parse(learningStorage()?.getItem(KEY)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
  catch {return {};}
};

export default function LearningNotebook({country,domain,level,countryName,domainName,levelName}) {
  const id = [country,domain,level].join(':');
  const [note,setNote] = useState(()=>read()[id]||{});
  const [status,setStatus] = useState('');
  const update = (field,value) => {
    const next = {...note,[field]:value.slice(0,600),updatedAt:new Date().toISOString()};
    setNote(next);
    try {
      const storage=learningStorage();if(!storage)throw new Error('unavailable');
      const entries=Object.entries({...read(),[id]:next}).sort((a,b)=>String(b[1]?.updatedAt||'').localeCompare(String(a[1]?.updatedAt||''))).slice(0,200);
      storage.setItem(KEY,JSON.stringify(Object.fromEntries(entries)));
      setStatus('保存しました');
    } catch {setStatus('保存できません。必要な内容は印刷・PDF保存で残してください。');}
  };
  return <details className="tp-notebook">
    <summary>📝 今日の目標・振り返り</summary>
    <p>個人情報を書かず、学んだことを短く残そう。国・カテゴリ・レベルごとに、最新の内容を保存します。</p>
    <label>今日できるようになりたいこと<textarea maxLength={600} value={typeof note.goal==='string'?note.goal:''} onChange={e=>update('goal',e.target.value)} placeholder="例：日本と相手の国で、交流できる時間を見つける"/><span className="tp-notebook-print">{typeof note.goal==='string'?note.goal:'（未記入）'}</span></label>
    <label>発見したこと・その根拠<textarea maxLength={600} value={typeof note.discovery==='string'?note.discovery:''} onChange={e=>update('discovery',e.target.value)}/><span className="tp-notebook-print">{typeof note.discovery==='string'?note.discovery:'（未記入）'}</span></label>
    <label>次に調べたいこと<textarea maxLength={600} value={typeof note.question==='string'?note.question:''} onChange={e=>update('question',e.target.value)}/><span className="tp-notebook-print">{typeof note.question==='string'?note.question:'（未記入）'}</span></label>
    <p role="status">{status}</p>
    <div className="tp-classroom-actions"><button onClick={()=>window.print()}>振り返りを印刷・PDF保存</button></div>
    <p className="tp-notebook-print">{countryName} · {domainName} · {levelName}</p>
  </details>;
}
