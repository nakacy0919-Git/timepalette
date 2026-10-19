// Strict, self-contained validation for the admin-only R2 connectivity pilot.
// Do not expand beyond Rwanda lifeCulture without an explicit design review.
export const PILOT_COUNTRY = 'rw';
export const PILOT_DOMAIN = 'lifeCulture';
export const PILOT_BUCKET = 'timepalette-public-webp';

export function isUuid(value){
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
export function isPhotoSlot(slot){
  return Number.isInteger(slot) && slot >= 1 && slot <= 4;
}
export function pilotKey(id, slot){
  if(!isUuid(id) || !isPhotoSlot(slot))throw new Error('Invalid photo ID or slot');
  return `pilot/${id.toLowerCase()}/P0${slot}.webp`;
}
export function validateWebp(bytes){
  if(!Buffer.isBuffer(bytes) || bytes.length < 16 || bytes.length > 1228800 ||
    bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WEBP')
    throw new Error('Invalid WebP image');
  return bytes;
}
export function publishedSlotAllowed(catalog,id,slot){
  if(!isUuid(id)||!isPhotoSlot(slot)||!Array.isArray(catalog))return false;
  return catalog.some(q=>q?.id===id && q.countryIso===PILOT_COUNTRY &&
    q.domain===PILOT_DOMAIN && ['photo4','photoText4'].includes(q.type) &&
    Array.isArray(q.media) && q.media.some(m=>Number(m.slot)===slot));
}
export function checkR2Config(env){
  return !!(env.R2_ACCOUNT_ID && /^[0-9a-f]{32}$/i.test(env.R2_ACCOUNT_ID) &&
    env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET_NAME===PILOT_BUCKET);
}
