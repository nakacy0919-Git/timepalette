import {useState} from 'react';
import './journeyRoom.css';

export function JourneyPlayMode({stage,onSingle,onMulti,onHost,onJoin,onBack,onClose}){
 const roles=stage==='roles';
 return <div className="wj-room-overlay"><section className="wj-room-panel wj-mode-panel" role="dialog" aria-modal="true" aria-label={roles?'複数端末の役割を選ぶ':'遊び方を選ぶ'}>
 <header><span>🌐 WORLD JOURNEY · {roles?'MULTIPLAYER':'LET’S PLAY'}</span><button onClick={onClose} aria-label="閉じる">×</button></header>
 <h2>{roles?'どうやって参加する？':'どんな遊び方にする？'}</h2>
 <p>{roles?'ホストがルームを作り、ほかのチームは6桁の番号で参加。':'みんなで世界を冒険しよう！ 端末に合わせて選んでね。'}</p>
 <div className="wj-mode-cards">
 {roles?<><button className="wj-mode-card gold" onClick={onHost}><span className="wj-mode-icon">🏆</span><strong>ホストになる</strong><small>ルームを作って仲間を招待</small><b>ルームを作成 →</b></button><button className="wj-mode-card blue" onClick={onJoin}><span className="wj-mode-icon">🔑</span><strong>ルームに参加</strong><small>ホストの6桁コードを入力</small><b>コードを入力 →</b></button></>:<><button className="wj-mode-card gold" onClick={onSingle}><span className="wj-mode-icon">🎲</span><strong>1台で遊ぶ</strong><small>1つの画面で順番に対戦</small><b>すぐに設定へ →</b></button><button className="wj-mode-card blue" onClick={onMulti}><span className="wj-mode-icon">🌐</span><strong>複数端末で遊ぶ</strong><small>iPad・PC・スマホで対戦</small><b>2〜8チーム →</b></button></>}
 </div>
 <button className="wj-room-back" onClick={roles?onBack:onClose}>← {roles?'遊び方を選び直す':'ホームに戻る'}</button>
 </section></div>;
}

export default function JourneyRoomLobby({session,teamNames,onStart,onClose}){
 const [code,setCode]=useState('');
 const {room,notice,join,approve}=session;
 const approved=room?.people.filter(p=>p.approved)||[];
 return <div className="wj-room-overlay"><section className="wj-room-panel" role="dialog" aria-modal="true" aria-label="端末対戦ルーム">
 <header><span>🌐 WORLD JOURNEY · MULTIPLAYER</span><button onClick={onClose} aria-label="閉じる">×</button></header>
 <h2>{room?.role==='host'?'冒険仲間を待とう！':'ルームに参加'}</h2>
 {room?.role==='host'?<>
 <p>別の端末でワールドジャーニーを開き、「複数端末で遊ぶ → ルームに参加」を選んでね。</p>
 <div className="wj-room-code" aria-label="ルームコード">{room.code}</div>
 <p role="status">{room.status==='connecting'?'接続準備中…':room.status==='ready'?'参加受付中':'接続エラー'} · {approved.length+1}/{room.teamCount}チーム</p>
 <div className="wj-room-list"><div><b>チーム1 · {teamNames[0]||'ホスト'}</b><span>✓ ホスト</span></div>
 {Array.from({length:room.teamCount-1},(_,i)=>{const p=approved.find(x=>x.team===i+1);return <div key={i}><b>チーム{i+2} · {teamNames[i+1]||'参加待ち'}</b><span>{p?'✓ '+p.name:'接続待ち'}</span></div>;})}
 {room.people.filter(p=>!p.approved).map(p=><div key={p.id}><b>{p.name}</b><button onClick={()=>approve(p.id)}>参加を許可</button></div>)}</div>
 <button className="wg-primary" disabled={room.status!=='ready'||approved.length!==room.teamCount-1} onClick={onStart}>🚀 全員でゲーム開始</button>
 </>:room&&room.status!=='error'?<>
 <div className="wj-room-code">{room.code}</div>
 <p role="status">{room.status==='connecting'?'接続中…':room.status==='waiting'?'ホストの参加許可を待っています…':room.status==='ready'?'チーム'+(room.team+1)+'で参加しました！ ゲーム開始までお待ちください。':'接続が停止しました'}</p>
 </>:<><p>ホストから教えてもらった6桁の番号を入力してね。</p><label className="wj-code-label">ルームコード<input className="wj-code-input" inputMode="numeric" pattern="[0-9]{6}" autoComplete="off" value={code} onChange={e=>setCode(e.target.value.replace(/[０-９]/g,c=>String(c.charCodeAt(0)-65296)).replace(/[^0-9]/g,'').slice(0,6))} placeholder="000000" maxLength={6}/></label><button className="wg-primary" disabled={code.length!==6} onClick={()=>join(code)}>🌐 接続する →</button></>}
 {notice&&<p className="wj-room-error" role="alert">{notice}</p>}
 <small>🔒 HTTPS通信で同期します。別のWi-Fiでもインターネットに接続できれば参加できます。個人名は不要です。ホスト端末はゲーム中に画面を閉じないでください。</small>
 <button className="wj-room-back" onClick={onClose}>← 戻る</button>
 </section></div>;
}
