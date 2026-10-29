import {getReleasedGeographyPackage} from './geographyRegistry.js';
import {getPublishedSummary} from './publishedMissionSummary.js';
import rwanda from '../data/place_r.json' with {type:'json'};
import {getWorldAdventureDomainPackage} from './worldAdventureRegistry.js';
export const MISSION_DOMAINS = [
  {id:'place',labelJa:'場所・地理',labelEn:'Place & Geography',icon:'🌍'},
  {id:'time',labelJa:'時間・時差',labelEn:'Time & Time Zones',icon:'⏰'},
  {id:'language',labelJa:'ことば・交流',labelEn:'Language & Communication',icon:'🗣️'},
  {id:'lifeCulture',labelJa:'生活・文化',labelEn:'Life & Culture',icon:'🏠'},
  {id:'japanConnection',labelJa:'日本とのつながり',labelEn:'Japan Connection',icon:'🇯🇵'},
  {id:'thinkConnect',labelJa:'比較・思考',labelEn:'Think & Connect',icon:'🧠'},
];
export const CREATOR_DOMAINS = ['language','lifeCulture','japanConnection','thinkConnect'];
export const isCreatorDomain = domain => CREATOR_DOMAINS.includes(domain);
// The country directory no longer depends on any embedded mission bank.
export const makeCountryMissionShell = country => {
  const geo=getReleasedGeographyPackage(country?.iso);
  const place=(geo?.missions||(country?.iso==='rw'?rwanda.missions:[])).map(m=>({...m,domain:'place'}));
  const time=(getWorldAdventureDomainPackage(country?.iso,'time')?.missions||[]).map(m=>({...m,domain:'time'}));
  const missions=[...place,...time,...getPublishedSummary(country?.iso)];
  return {countryNameEn:country?.nameEn||'',countryNameJa:country?.nameJa||'',design:{domains:MISSION_DOMAINS},missions,totalMissions:missions.length,maxWorldPoints:missions.reduce((n,m)=>n+(Number(m.points)||0),0)};
};
