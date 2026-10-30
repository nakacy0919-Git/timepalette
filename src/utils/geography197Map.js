import boundaries from '../data/geography/boundary-overrides197.json' with {type:'json'};
import sourceWorld from '../data/geography/world197.json' with {type:'json'};
import {geoBounds,geoMercator,geoNaturalEarth1} from 'd3-geo';
const world={...sourceWorld,features:sourceWorld.features.map(f=>boundaries[f.id]?{...f,geometry:boundaries[f.id].geometry}:f)};
export const geographyWorld197=world;
export const countryFeatures197=iso=>world.features.filter(f=>f.properties.iso===iso);
const collection=features=>({type:'FeatureCollection',features});
export function geographyProjection197({worldView=false,codes=[],places=[],focusPoints=[],countryCenter}){
 const height=460;
 if(worldView)return geoNaturalEarth1().fitExtent([[15,15],[705,height-20]],world);
 const points=focusPoints.length?focusPoints:places.length?places.map(c=>c.coordinates):[countryCenter];
 const center=points[0]??countryCenter,rotation=-center[0];
 const features=codes.flatMap(countryFeatures197);
 if(focusPoints.length>1){
  const xs=points.map(p=>((p[0]+rotation+180)%360+360)%360-180),ys=points.map(p=>p[1]);
  const dx=Math.max(.05,(Math.max(...xs)-Math.min(...xs))*.2),dy=Math.max(.05,(Math.max(...ys)-Math.min(...ys))*.2);
  const box={type:'MultiPoint',coordinates:[[Math.min(...xs)-dx,Math.min(80,Math.max(...ys)+dy)],[Math.max(...xs)+dx,Math.max(-80,Math.min(...ys)-dy)]].map(([x,y])=>[x-rotation,y])};
  return geoMercator().rotate([rotation,0]).fitExtent([[35,35],[685,height-35]],box);
 }
 const fitting=collection([...features,...places.map(c=>({type:'Feature',properties:{},geometry:{type:'Point',coordinates:c.coordinates}}))]);
 const bounds=geoBounds(fitting);
 if(!features.length||!bounds.flat().every(Number.isFinite))return geoMercator().rotate([rotation,0]).center([0,center[1]]).scale(1800).translate([360,height/2]);
 return geoMercator().rotate([rotation,0]).fitExtent([[45,40],[675,height-40]],fitting);
}
