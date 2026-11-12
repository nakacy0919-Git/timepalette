import {useState} from 'react';
import {MAX_BACKUP_BYTES,progressBackup,parseProgressBackup,restoreProgressBackup} from '../../utils/learningBackup.js';

function downloadLearningJson(value,filename) {
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export default function LearningBackupControls({journey,onRestored}) {
  const [pending,setPending]=useState(null);
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const read = async event => {
    const file=event.target.files?.[0];event.target.value='';setPending(null);
    if(!file)return;
    setBusy(true);
    try {
      if(file.size>MAX_BACKUP_BYTES)throw new Error('バックアップは1MB以内で選んでください。');
      const value=parseProgressBackup(await file.text());setPending(value);setNotice('内容を確認してから復元してください。');
    }catch(error){setNotice(error.message);}finally{setBusy(false);}
  };
  const save=()=>{try{downloadLearningJson(progressBackup(journey()),'timepalette-progress-backup.json');setNotice('クリアした問題の記録を保存しました。名前・入力文・振り返りは含みません。');}catch(error){setNotice(error.message);}};
  return <section className="tp-learning-backup" aria-label="学習記録の引き継ぎ">
    <h2>端末変更に備えて、学習記録を残す</h2>
    <p>クリアした問題を別の端末へ引き継げます。復元しても、この端末ですでにクリアした問題は消えません。ポイントは追加されません。</p>
    <div className="tp-classroom-actions"><button onClick={save}>クリア記録のバックアップ</button><label>バックアップを選ぶ<input disabled={busy} type="file" accept="application/json,.json" onChange={read}/></label></div>
    {pending&&<div className="tp-classroom-confirm" role="alertdialog" aria-label="復元の確認"><p>{pending.countries.length}か国・{pending.countries.reduce((n,c)=>n+c.missions.length,0)}件の記録を読み込みます。練習記録としてのみ使用してください。</p><button onClick={()=>setPending(null)}>キャンセル</button><button onClick={()=>{try{const count=restoreProgressBackup(pending);setPending(null);setNotice(`${count}件のクリア記録を追加しました。`);onRestored();}catch(error){setNotice(error.message);}}}>この端末に復元</button></div>}
    <p role="status">{notice}</p>
  </section>;
}
