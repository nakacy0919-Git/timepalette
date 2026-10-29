import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/mission-creator.js';
function mockRes() {
  return { statusCode: null, body: null, headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json(data) { this.body = data; return this; } };
}
async function fixture(fn, environment, reply) {
  const old = { fetch: globalThis.fetch,
    endpoint: process.env.MISSION_CREATOR_GAS_URL,
    environment: process.env.VERCEL_ENV,
    error: console.error };
  process.env.MISSION_CREATOR_GAS_URL = 'https://script.google.com/macros/s/example/exec';
  process.env.VERCEL_ENV = environment;
  console.error = () => {};
  globalThis.fetch = async () => ({
    ok: true, status: 200, redirected: true,
    url: 'https://script.googleusercontent.com/macros/echo?secret=must-not-appear',
    headers: { get: key => key === 'content-type' ? 'text/html; charset=utf-8' : null },
    text: async () => reply
  });
  try { await fn(); } finally {
    globalThis.fetch = old.fetch;
    console.error = old.error;
    if (old.endpoint === undefined) delete process.env.MISSION_CREATOR_GAS_URL;
    else process.env.MISSION_CREATOR_GAS_URL = old.endpoint;
    if (old.environment === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = old.environment;
  }
}
test('Preview shows harmless metadata for non-JSON Google responses without secrets', async () => {
  await fixture(async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { action: 'diagnosticProbe' } }, res);
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.code, 'google_response');
    assert.match(res.body.error, /HTTP 200/);
    assert.match(res.body.error, /text\/html/);
    assert.match(res.body.error, /HTML yes/);
    assert.doesNotMatch(res.body.error, /secret|must-not-appear|example\/exec/i);
  }, 'preview', '<html><body>Sign in</body></html>');
});
test('Production does not reveal upstream response metadata', async () => {
  await fixture(async () => {
    const res = mockRes();
    await handler({ method: 'POST', body: { action: 'diagnosticProbe' } }, res);
    assert.equal(res.statusCode, 502);
    assert.equal(res.body.code, 'google_response');
    assert.doesNotMatch(res.body.error, /HTTP 200|text\/html|secret/);
  }, 'production', '<html><body>Sign in</body></html>');
});
