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
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, session, ...payload }),
    });
  } catch {
    throw new CreatorApiError('接続できませんでした。通信環境を確認してください。', 'network');
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
