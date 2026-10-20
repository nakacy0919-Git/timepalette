// Preview-only short-lived public gateway lease. Not a production publication system.
import {isUuid,isPhotoSlot,pilotKey,publishedSlotAllowed,PILOT_COUNTRY,PILOT_DOMAIN} from './r2-pilot-core.js';
export const LEASE_LIFETIME_MS=30_000;
export function leaseKey(id,slot){
  if(!isUuid(id)||!isPhotoSlot(slot))throw new Error('Invalid photo identifier');
  return `pilot-leases/${id.toLowerCase()}/P0${slot}.json`;
}
export function gatewayPath(id,slot){
  if(!isUuid(id)||!isPhotoSlot(slot))throw new Error('Invalid photo identifier');
  return `/v1/${PILOT_COUNTRY}/${PILOT_DOMAIN}/${id.toLowerCase()}/P0${slot}.webp`;
}
export function leasePayload(id,slot,now){
  return JSON.stringify({id:id.toLowerCase(),slot,expiresAt:now+LEASE_LIFETIME_MS});
}
export {pilotKey,publishedSlotAllowed};
