/**
 * Read-only, preview-only R2 photo experiment. R2 never decides publication.
 * Ask the existing GAS published catalog BEFORE reading a private R2 object.
 * Only the Rwanda/lifeCulture pilot namespace is eligible.
 */
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {checkR2Config, pilotKey, publishedSlotAllowed, validateWebp,
  PILOT_BUCKET,PILOT_COUNTRY,PILOT_DOMAIN} from './r2-pilot-core.js';

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

export async function readPreviewR2IfPublished({endpoint, questionId, slot, env, createClient=createR2Client}) {
  // This catalog lookup is deliberately required on EACH attempted R2 read.
  // No R2 bytes are served based on an old copy or a client-supplied status.
  const url = new URL(endpoint);
  url.searchParams.set('action','publishedCatalog');
  url.searchParams.set('countryIso',PILOT_COUNTRY);
  url.searchParams.set('domain',PILOT_DOMAIN);
  const response = await fetch(url,{
    redirect:'follow',signal:AbortSignal.timeout(16000),cache:'no-store',
  });
  if(!response.ok) return null;
  const txt = await response.text();
  if(txt.length>200000) return null;
  const catalog = JSON.parse(txt);
  if(!catalog?.ok || !publishedSlotAllowed(catalog?.data?.questions,questionId,slot))
    return null;

  const client=createClient(env);
  try {
    const result = await client.send(new GetObjectCommand({
      Bucket:PILOT_BUCKET,Key:pilotKey(questionId,slot),
    }));
    const data = Buffer.from(await result.Body.transformToByteArray());
    return validateWebp(data);
  } finally {
    client.destroy();
  }
}
