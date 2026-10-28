import atlas from 'world-atlas/countries-50m.json' with {type:'json'};
import {feature,mesh,neighbors} from 'topojson-client';
import {geoCentroid} from 'd3-geo';
import {sameCountry} from './geographyRegistry.js';

const geometries=atlas.objects.countries.geometries;
const features=feature(atlas,atlas.objects.countries).features;
const adjacency=neighbors(geometries);
const borders=new Map();
// A generalized atlas is not authoritative evidence that a very short border is absent.
export const borderExceptions=[{
  country:'bw',neighbor:'zm',reason:'Kazungula river border is not represented in the 50m topology',
  sourceUrl:'https://www.jica.go.jp/english/information/seminar/2024/20250304.html',
  checkedAt:'2026-10-27',
}];
const indexOf=country=>features.findIndex(f=>sameCountry(f,country));
export function sharedBorderPoint(country,neighbor){
  const a=indexOf(country),b=indexOf(neighbor),key=[a,b].sort((a,b)=>a-b).join(':');
  if(a<0||b<0)return null;
  if(!borders.has(key)){
    const boundary=mesh(atlas,{type:'GeometryCollection',geometries:[geometries[a],geometries[b]]},(x,y)=>x!==y);
    const point=boundary.coordinates.length?geoCentroid(boundary):null;
    borders.set(key,point?.every(Number.isFinite)?point:null);
  }
  return borders.get(key);
}
// Eight compass sectors using an initial great-circle bearing, including longitude wrap.
export function compassDirection(from,to){
  if(!from?.every(Number.isFinite)||!to?.every(Number.isFinite))return null;
  const rad=Math.PI/180,lat1=from[1]*rad,lat2=to[1]*rad,delta=(to[0]-from[0])*rad;
  const x=Math.sin(delta)*Math.cos(lat2),y=Math.cos(lat1)*Math.sin(lat2)-Math.sin(lat1)*Math.cos(lat2)*Math.cos(delta);
  if(Math.hypot(x,y)<1e-12)return null;
  const bearing=(Math.atan2(x,y)/rad+360)%360;
  return ['北','北東','東','南東','南','南西','西','北西'][Math.round(bearing/45)%8];
}
export function neighborDirection(country,neighbor){
  const point=country.neighborKind==='land-border'?sharedBorderPoint(country,neighbor):neighbor.center;
  return point?compassDirection(country.center,point):null;
}
export function auditLandNeighbors(country){
  if(country.neighborKind!=='land-border')return {issues:[],exceptions:[]};
  const index=indexOf(country),issues=[],exceptions=[];
  if(index<0)return {issues:['missing target topology'],exceptions};
  const declared=country.neighbors.map(indexOf);
  for(const other of adjacency[index])if(!declared.includes(other))issues.push('missing land neighbor: '+features[other].properties.name);
  for(const neighbor of country.neighbors){
    if(adjacency[index].includes(indexOf(neighbor)))continue;
    const exception=borderExceptions.find(e=>e.country===country.countryCode&&e.neighbor===neighbor.iso);
    if(exception)exceptions.push(exception);else issues.push('declared neighbor has no shared boundary: '+neighbor.name);
  }
  for(const exception of borderExceptions.filter(e=>e.country===country.countryCode))
    if(!country.neighbors.some(n=>n.iso===exception.neighbor))issues.push('missing documented short-border neighbor: '+exception.neighbor);
  return {issues,exceptions};
}
