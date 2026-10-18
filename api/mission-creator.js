// Vercel server-side proxy: prevents cross-origin GAS fetches from the browser.
// Only MISSION_CREATOR_GAS_URL is server-side. Never use VITE_ for this variable.
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
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
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow',
      signal: AbortSignal.timeout(25000),
    });
    const content = await upstream.text();
    let result;
    try { result = JSON.parse(content); } catch { throw new Error('Non-JSON upstream response'); }
    if (!upstream.ok) return res.status(502).json({ ok: false, error: 'Googleの保存処理に失敗しました。' });
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
