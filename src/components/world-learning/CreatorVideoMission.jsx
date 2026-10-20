import {useState} from 'react';
import {checkReflection,videoEmbedUrl} from '../../utils/creatorVideo.js';

export function CreatorVideoEmbed({video}) {
  const url=videoEmbedUrl(video);
  if(!url)return <p role="alert">YouTube動画のURLを確認してください。</p>;
  const start=Number(video?.startSeconds||0),end=Number(video?.endSeconds||0);
  return <section className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-3" aria-label="学習用YouTube動画">
    <div className="aspect-video overflow-hidden rounded-xl bg-slate-900">
      <iframe title="教材のYouTube動画" src={url} loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full" />
    </div>
    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
      <span>視聴範囲：{Math.floor(start/60)}分{start%60}秒 ～ {end?`${Math.floor(end/60)}分${end%60}秒`:'動画の最後'}</span>
      <a target="_blank" rel="noopener noreferrer" href={'https://www.youtube.com/watch?v='+encodeURIComponent(video.youtubeId)} className="font-bold text-blue-700 underline">YouTubeで開く</a>
    </div>
    <p className="mt-1 text-xs text-slate-500">動画の埋め込みが許可されていない場合は、YouTubeで開いて視聴してください。再生完了そのものの確認は行いません。</p>
  </section>;
}
export function CreatorVideoReflectionGame({mission,onComplete}) {
  const [answer,setAnswer]=useState('');
  const [cleared,setCleared]=useState(false);
  const [attempted,setAttempted]=useState(false);

  const result=checkReflection(answer,mission.reflection);
  const submit=()=>{setAttempted(true);if(!result.passed||cleared)return;setCleared(true);onComplete?.(mission);};
  return <section className="space-y-4">
    <CreatorVideoEmbed video={mission.video}/>
    <label className="block text-base font-bold text-slate-800">動画を見て、自分の考えを書いてみよう
      <textarea rows={6} maxLength={3000} value={answer} onChange={e=>{if(!cleared)setAnswer(e.target.value)}} disabled={cleared}
        className="mt-2 block w-full rounded-xl border border-slate-300 p-4 text-base font-normal leading-7" placeholder="気づいたことや、考えたことを文章で書いてください。" />
    </label>
    <div className="flex flex-wrap justify-between gap-2 text-sm text-slate-700">
      <span>入力文字数：<strong>{result.length}</strong> / {result.minChars}～{result.maxChars}文字</span>
      <span>キーワード条件：{mission.reflection?.keywordMode==='any'?'いずれか1つ':'すべて'} {mission.reflection?.keywords?.join('、')||'なし'}</span>
    </div>
    {attempted&&!result.passed&&!cleared&&<p role="alert" className="rounded-xl bg-amber-50 p-3 text-amber-900">{result.length<result.minChars?'文字数が不足しています。':result.length>result.maxChars?'最大文字数を超えています。':'指定されたキーワードを確認してください。'}</p>}
    {cleared?<p role="status" className="rounded-xl bg-emerald-50 p-4 font-bold text-emerald-800">条件達成！ ミッションクリアです。これは文字数・キーワードの形式チェックであり、内容の正誤を採点したものではありません。</p>
      :<button type="button" onClick={submit} className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white">回答を提出する</button>}
    <p className="text-xs text-slate-500">回答文は現在、サーバーへ送信・保存されません。自分の考えを入力する学習活動です。</p>
  </section>;
}
