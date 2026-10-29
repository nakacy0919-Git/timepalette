import {getTimePackage} from './time197.js';

// Built-in missions are releases, not teacher submissions. Never fabricate
// approved/published Creator records or add manual counts to the same release.
export const getPublishedTimeMissions = iso => getTimePackage(iso)?.missions ?? [];
export function getCreatorCompletionCount({manual=0,approved=0,builtIn=0}={}) {
  const safe=value=>Number.isFinite(Number(value))?Math.max(0,Number(value)):0;
  return Math.min(10,Math.max(safe(manual),safe(approved),safe(builtIn)));
}
export function getTimeReleaseSummary(countries) {
  return countries.reduce((summary,country)=>{
    const count=getPublishedTimeMissions(country.iso).length;
    return {countries:summary.countries+(count>0?1:0),missions:summary.missions+count};
  },{countries:0,missions:0});
}
