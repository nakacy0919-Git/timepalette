const ENDPOINT = '/api/mission-creator';

export class CreatorApiError extends Error {
  constructor(message, code = '') {
    super(message);
    this.name = 'CreatorApiError';
    this.code = code;
  }
}

export async function creatorRequest(action, payload = {}, session = '') {
  let response;
  const controller = new AbortController();
  const timeoutMs = action === 'getMediaBatch' ? 12000
    : action === 'getMedia' ? 16000 : 40000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, session, ...payload }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new CreatorApiError('Google連携が制限時間内に応答しませんでした。通信またはGoogle側の処理を確認してください。', 'timeout');
    }
    throw new CreatorApiError('接続できませんでした。通信環境を確認してください。', 'network');
  } finally {
    clearTimeout(timeout);
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new CreatorApiError('サーバーからの応答を読み取れませんでした。', 'response');
  }
  if (!response.ok || !data.ok) {
    throw new CreatorApiError(data.error || `エラー (${response.status})`, data.code || String(response.status));
  }
  return data.data;
}
