import {liveEnabled,adminVerified,stopMedia,publishMedia} from '../lib/r2-live-media.js';
import {cloudflareCreator} from '../lib/timepalette-cloudflare-proxy.js';
// Vercel server-side proxy: prevents cross-origin GAS fetches from the browser.
// Only MISSION_CREATOR_GAS_URL is server-side. Never use VITE_ for this variable.
// Preview-only reliability workaround for Google's intermittent one-time
// ContentService redirect 404s. Only login is retried; never retry writes.
const LOGIN_REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
function safeContentRedirect(location) {
  if (!location) return null;
  try {
    const target = new URL(location);
    if (target.protocol !== 'https:' || target.hostname !== 'script.googleusercontent.com' ||
        target.pathname !== '/macros/echo') return null;
    return target.href;
  } catch { return null; }
}
async function fetchLoginWithRecovery(endpoint, payload) {
  const signal = AbortSignal.timeout(23000); // entire operation, not each hop
  let latest;
  for (let attempt = 0; attempt < 2; attempt++) {
    latest = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'manual', signal,
    });
    // Apps Script ContentService returns a one-time Google-hosted response URL.
    // The POST payload must never be forwarded to the redirect destination.
    for (let hop = 0; LOGIN_REDIRECT_STATUSES.has(latest.status); hop++) {
      if (hop >= 3) throw new Error('Too many Google redirects');
      const next = safeContentRedirect(latest.headers.get('location'));
      if (!next) throw new Error('Unexpected Google redirect');
      latest = await fetch(next, {method: 'GET', redirect: 'manual', signal});
    }
    // Only the known HTML 404 defect may cause another POST. A login creates
    // transient sessions, not question/media/publication records.
    if (attempt === 0 && latest.status === 404 &&
        latest.url?.startsWith('https://script.googleusercontent.com/macros/echo?') &&
        /^\s*</.test(await latest.clone().text())) {
      await new Promise(resolve => setTimeout(resolve, 450));
      continue;
    }
    return latest;
  }
  return latest;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  if (process.env.MISSION_CREATOR_BACKEND === 'cloudflare') return cloudflareCreator(req,res);
  const endpoint = process.env.MISSION_CREATOR_GAS_URL;
  if (!endpoint || !/^https:\/\/script\.google\.com\/macros\/s\//.test(endpoint)) {
    return res.status(503).json({ ok: false, code: 'not_configured', error: 'Mission CreatorのGoogle連携はまだ設定されていません。' });
  }
  const payload = req.body;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return res.status(400).json({ ok: false, error: 'Invalid request' });
  }
  // 1.2MB image → ~1.6MB base64. Deny very large requests.
  if (JSON.stringify(payload).length > 2_200_000) {
    return res.status(413).json({ ok: false, error: 'ファイルが大きすぎます。' });
  }
  try {
    // Remove public media authorization BEFORE a verified admin stops publication.
    // This fails closed if GAS later fails; no unauthorized caller can revoke.
    if(liveEnabled() && payload.action==='setPublication' && payload.mode==='unpublish'){
      const verified=await adminVerified(endpoint,payload.session,payload.questionId,payload.countryIso,payload.domain);
      if(!verified)return res.status(403).json({ok:false,error:'管理者または公開問題を確認できませんでした。'});
      await stopMedia({id:payload.questionId});
    }
    const upstream = payload.action === 'login' && process.env.VERCEL_ENV === 'preview'
      ? await fetchLoginWithRecovery(endpoint, payload)
      : await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload),
          redirect: 'follow',
          signal: AbortSignal.timeout(25000),
        });
    const content = await upstream.text();
    let result;
    try { result = JSON.parse(content); } catch {
      // Safe metadata only: never record HTML, credentials, PIN, Google script URL, or question data.
      let hostname = 'unknown';
      try {
        const remoteHost = new URL(upstream.url).hostname;
        hostname = remoteHost === 'script.google.com' ? 'script.google.com'
          : remoteHost === 'script.googleusercontent.com' ? 'script.googleusercontent.com'
          : remoteHost.endsWith('.googleusercontent.com') ? 'googleusercontent.com' : 'other';
      } catch {}
      const contentType = String(upstream.headers?.get?.('content-type') || '')
        .split(';')[0].trim().toLowerCase();
      const safeType = ['text/html', 'text/plain', 'application/json', 'application/octet-stream']
        .includes(contentType) ? contentType : 'other';
      const safeStatus = Number.isInteger(upstream.status) ? upstream.status : 0;
      const isHtml = /^\s*</.test(content);
      const metadata = { status: safeStatus, type: safeType, host: hostname,
        redirected: Boolean(upstream.redirected), html: isHtml, length: content.length };
      console.error('Mission Creator invalid GAS reply metadata', metadata);
      if (process.env.VERCEL_ENV === 'preview') {
        const info = 'HTTP ' + safeStatus + ' / ' + safeType + ' / ' + hostname
          + ' / HTML ' + (isHtml ? 'yes' : 'no') + ' / ' + content.length + ' bytes';
        return res.status(502).json({ ok: false, code: 'google_response',
          error: 'Google応答診断：' + info });
      }
      throw new Error('Non-JSON upstream response');
    }
    if (!upstream.ok) return res.status(502).json({ ok: false, error: 'Googleの保存処理に失敗しました。' });
    if(result?.ok && liveEnabled() && payload.action==='setPublication' && payload.mode==='publish'){
      // GAS publication is authoritative; only the matching published catalog can
      // authorize live images. On sync errors the old GAS photo route remains valid.
      try{
        const media=await publishMedia({id:payload.questionId,iso:payload.countryIso,
          domain:payload.domain,endpoint});
        result.data={...result.data,r2MediaStatus:media.status};
      }catch(error){
        console.error('Production R2 media sync pending',{kind:String(error?.name||'upstream').slice(0,32)});
        result.data={...result.data,r2MediaStatus:'pending'};
      }
    }
    return res.status(200).json(result);
  } catch (err) {
    const kind=err?.name==='TimeoutError'||err?.name==='AbortError'
      ? 'google_timeout'
      : err?.message==='Non-JSON upstream response'
        ? 'google_response' : 'google_network';
    // Never log credentials, PINs, question contents or raw upstream errors.
    console.error('Mission Creator Google upstream failure',{
      action:String(payload.action||'').slice(0,45),kind
    });
    const message=kind==='google_timeout'
      ? 'Google側の応答が遅れています。保存操作の場合は再送信前に一覧を確認してください。'
      : kind==='google_response'
        ? 'Googleから正しい形式の応答が返っていません。管理者に連絡してください。'
        : 'Googleとの通信に失敗しました。時間をおいて再試行してください。';
    return res.status(kind==='google_timeout'?504:502).json({ok:false,code:kind,error:message});
  }
}
