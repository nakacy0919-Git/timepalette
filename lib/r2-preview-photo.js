/**
 * Preview-only R2 photo experiment. R2 is never the authority for publication.
 * A small positive-only GAS authorization cache avoids serial multi-second
 * catalog requests on warm invocations. Revocation bound (assuming fresh GAS
 * publication data): 15s local auth + 12s CDN = at most ~27s.
 * Preview + Rwanda lifeCulture only; normal/prod requests are unchanged.
 */
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {checkR2Config, pilotKey, publishedSlotAllowed, validateWebp,
  PILOT_BUCKET,PILOT_COUNTRY,PILOT_DOMAIN} from './r2-pilot-core.js';

export const PREVIEW_AUTH_TTL_MS = 15_000;
export const PREVIEW_CDN_TTL_SECONDS = 12;
const positiveAuthorizationCache = new Map();

export function isPreviewR2Request(query, env) {
  return env.VERCEL_ENV==='preview' && query?.r2pilot==='1' && checkR2Config(env);
}

function createR2Client(env){
  return new S3Client({
    region:'auto', endpoint:`https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials:{accessKeyId:env.R2_ACCESS_KEY_ID,
      secretAccessKey:env.R2_SECRET_ACCESS_KEY},
    maxAttempts:2,
  });
}

/** Return bytes only if a current or briefly-cached publishedCatalog authorizes it. */
export async function readPreviewR2IfPublished({
  endpoint, questionId, slot, env,
  createClient=createR2Client,
  authorizationCache=positiveAuthorizationCache,
  clock=Date.now,
  timings={},
}) {
  const key = `${endpoint}|${PILOT_COUNTRY}|${PILOT_DOMAIN}|${questionId}|${slot}`;
  const cached = authorizationCache.get(key);
  const fresh = cached && cached.expiresAt > clock();
  timings.publishedCacheHit = Boolean(fresh);
  timings.publishedMs = 0;
  if (!fresh) {
    authorizationCache.delete(key);
    const start = performance.now();
    try {
      const url = new URL(endpoint);
      url.searchParams.set('action','publishedCatalog');
      url.searchParams.set('countryIso',PILOT_COUNTRY);
      url.searchParams.set('domain',PILOT_DOMAIN);
      const response = await fetch(url,{
        redirect:'follow',signal:AbortSignal.timeout(16000),cache:'no-store',
      });
      if (!response.ok) return null;
      const txt = await response.text();
      if (txt.length > 200000) return null;
      const catalog = JSON.parse(txt);
      if (!catalog?.ok || !publishedSlotAllowed(catalog?.data?.questions,questionId,slot))
        return null;
      // Never cache negative results or failures. Only cache explicit, validated grants.
      if (authorizationCache.size >= 32) authorizationCache.clear();
      authorizationCache.set(key, {expiresAt:clock()+PREVIEW_AUTH_TTL_MS});
    } finally {
      timings.publishedMs = Math.round(performance.now()-start);
    }
  }

  const client=createClient(env);
  const start=performance.now();
  try {
    const result = await client.send(new GetObjectCommand({
      Bucket:PILOT_BUCKET,Key:pilotKey(questionId,slot),
    }));
    const data = Buffer.from(await result.Body.transformToByteArray());
    return validateWebp(data);
  } finally {
    timings.r2Ms = Math.round(performance.now()-start);
    client.destroy();
  }
}
