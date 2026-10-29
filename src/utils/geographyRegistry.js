import {getGeography197Package} from './geography197.js';
import packages from '../data/geography/round1.json' with {type:'json'};
import photoAssets from '../data/geography/photo-assets.json' with {type:'json'};
export const GEOGRAPHY_TYPES=['world-locator','neighbor-puzzle','shape-choice','capital-hunt','city-challenge','landscape-detective','life-photo-evidence','route-challenge','photo-evidence','geo-master'];
export const GEOGRAPHY_TITLES=['国をさがせ！','周辺の国・地域パズル','国の形を見ぬけ！','首都を見つけよう','都市を攻略せよ！','景色のたんてい','写真から読み取ろう','海まで荷物を運べ！','証拠と推測を分けよう','地理マスター'];
export const geographyCountries=Object.values(packages).map(p=>({...p,photo:{...p.photo,deliveryUrl:photoAssets[p.countryCode]?.publicPath}}));
const indexedPackages=Object.fromEntries(geographyCountries.map(p=>[p.countryCode,p]));
export function getGeographyPackage(code){
  const p=indexedPackages[String(code||'').toLowerCase()];
  if(!p)return null;
  return {...p,missions:GEOGRAPHY_TYPES.map((type,i)=>({id:`${p.countryCode}-place-${String(i+1).padStart(2,'0')}`,type,points:100,title:GEOGRAPHY_TITLES[i]}))};
}
export function sameCountry(feature, country){
  return (country.atlasId!=='-99'&&String(feature.id).padStart(3,'0')===country.atlasId)||feature.properties?.name===country.atlasName;
}
// Pure scoring gates shared by the UI and QA. No answer labels, translated names, or array positions are used as identity.
export function evaluateGeography(p,index,answer){
  switch(index){
    case 0:return answer===p.countryCode;
    case 1:return p.neighbors.every(n=>answer?.[n.iso]===n.iso)&&Object.keys(answer||{}).length===p.neighbors.length;
    case 2:return answer===p.countryCode;
    case 3:return answer===p.capitalId;
    case 4:return p.cities.every(c=>answer?.[c.id]===c.id)&&Object.keys(answer||{}).length===p.cities.length;
    case 5:return answer===p.countryCode;
    case 6:return Array.isArray(answer)&&answer.length===2&&answer.includes('visible')&&answer.includes('limited');
    case 7:return answer?.via===p.route.via&&answer?.port===p.route.port;
    case 8:return answer==='limited';
    case 9:return answer?.map===p.countryCode&&answer?.capital===p.capitalId&&answer?.fact==='fact';
    default:return false;
  }
}
export function geographyCandidates(p){
  const others=geographyCountries.filter(c=>c.countryCode!==p.countryCode);
  const seed=[...p.countryCode].reduce((s,c)=>s+c.charCodeAt(0),0);
  const choices=[p,...[0,5,11].map(n=>others[(seed+n)%others.length])];
  const rotate=seed%4;
  return [...choices.slice(rotate),...choices.slice(0,rotate)];
}

// Keep unfinished packages available to QA without exposing them in the country directory.
export function getReleasedGeographyPackage(code){return getGeography197Package(code);}
