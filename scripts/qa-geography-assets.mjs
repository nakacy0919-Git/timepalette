import fs from 'node:fs';
import {createHash} from 'node:crypto';
import packages from '../src/data/geography/round1.json' with {type:'json'};
import assets from '../src/data/geography/photo-assets.json' with {type:'json'};
const browser=JSON.parse(fs.readFileSync('docs/qa/geography-external-browser.json','utf8'));
const rows=Object.entries(packages).map(([country,p])=>{
  const asset=assets[country],issues=[];
  if(!asset||!/^\/geography\/photos\/[a-z]{2}\.(jpg|png|webp)$/.test(asset.publicPath||''))return {country,issues:['missing or invalid asset path']};
  const proof=browser.rows.find(r=>r.country===country);
  if(proof?.externalBrowserLoad!=='LOADED'||proof.sourceUrl!==asset.sourceUrl||proof.sha256!==asset.sha256)issues.push('external browser decode evidence missing or stale');
  if(asset.sourceUrl!==p.photo.sourceUrl||asset.downloadUrl!==p.photo.url)issues.push('source changed since byte verification');
  if(!asset.credit||asset.credit!==p.photo.credit||asset.license!==p.photo.license||asset.licenseUrl!==p.photo.licenseUrl)issues.push('attribution or license mismatch');
  try{
    const bytes=fs.readFileSync('public'+asset.publicPath);
    if(bytes.length!==asset.bytes||createHash('sha256').update(bytes).digest('hex')!==asset.sha256)issues.push('image bytes changed');
    const valid=bytes[0]===0xff&&bytes[1]===0xd8||bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
    if(!valid)issues.push('invalid image signature');
  }catch{issues.push('image file unavailable');}
  return {country,publicPath:asset.publicPath,sha256:asset.sha256,issues};
});
const report={generatedAt:new Date().toISOString(),scope:'Delivered original Commons bytes and attribution; geographic content reviewed separately',images:rows.length,errors:rows.reduce((n,r)=>n+r.issues.length,0),rows};
fs.writeFileSync('docs/qa/geography-assets.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({images:report.images,errors:report.errors}));
if(report.errors)process.exitCode=1;
