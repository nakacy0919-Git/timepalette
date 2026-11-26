import {useState} from 'react';
import './journeyRoom.css';

export default function JourneyRoomLobby({session,teamNames,onStart,onClose}){
 const [code,setCode]=useState(''),[name,setName]=useState('');
 const {room,notice,join,approve}=session;
 const approved=room?.people.filter(p=>p.approved)||[];
 return <div className="wj-room-overlay"><section className="wj-room-panel" role="dialog" aria-modal="true" aria-label="端末対戦ルーム">
 <header><span>🌐 WORLD JOURNEY · MULTIPLAYER</span><button onClick={onClose} aria-label="閉じる">×</button></header>
 <h2>{room?.role==='host'?'冒険仲間を待とう！':'ルームに参加'}</h2>
 {room?.role==='host'?<>
 <p>別の端末でワールドジャーニーを開き、「コードで参加」を選んでください。</p>
 <div className="wj-room-code" aria-label="ルームコード">{room.code}</div>
 <p role="status">{room.status==='connecting'?'接続準備中…':room.status==='ready'?'参加受付中':'接続エラー'} · {approved.length+1}/{room.teamCount}チーム</p>
 <div className="wj-room-list"><div><b>チーム1 · {teamNames[0]||'ホスト'}</b><span>✓ ホスト</span></div>
 {Array.from({length:room.teamCount-1},(_,i)=>{const p=approved.find(x=>x.team===i+1);return <div key={i}><b>チーム{i+2} · {teamNames[i+1]||'参加待ち'}</b><span>{p?'✓ '+p.name:'接続待ち'}</span></div>;})}
 {room.people.filter(p=>!p.approved).map(p=><div key={p.id}><b>{p.name}</b><button onClick={()=>approve(p.id)}>参加を許可</button></div>)}</div>
 <button className="wg-primary" disabled={room.status!=='ready'||approved.length!==room.teamCount-1} onClick={onStart}>🚀 全員でゲーム開始</button>
 </>:room?<>
 <div className="wj-room-code">{room.code}</div>
 <p role="status">{room.status==='connecting'?'接続中…':room.status==='waiting'?'ホストの参加許可を待っています…':room.status==='ready'?'チーム'+(room.team+1)+'で参加しました！ ゲーム開始までお待ちください。':'接続が停止しました'}</p>
 </>:<><p>同じ教室のホストから6桁のコードを教えてもらいましょう。</p><label>ルームコード<input inputMode="numeric" pattern="[0-9]{6}" value={code} onChange={e=>setCode(e.target.value.replace(/[^0-9]/g,'').slice(0,6))} placeholder="000000"/></label><label>チーム・端末の名前（任意）<input maxLength={24} value={name} onChange={e=>setName(e.target.value)} placeholder="チームの名前"/></label><button className="wg-primary" disabled={code.length!==6} onClick={()=>join(code,name)}>接続する →</button></>}
 {notice&&<p className="wj-room-error" role="alert">{notice}</p>}
 <small>試験運用 · 接続開始時はPeerJSの公開接続サービスを利用し、ゲームはWebRTCで端末間通信します。学校のWi-Fiの設定によって接続できない場合があります。<br/>個人名は不要です。ホスト端末はゲーム中に画面を閉じないでください。</small>
 <button className="wj-room-back" onClick={onClose}>← 戻る</button>
 </section></div>;
}
