// Commons metadata is evidence of existence/licensing, not proof of geographic content.
import fs from 'node:fs';import {execFileSync} from 'node:child_process';
import packages from '../src/data/geography/round1.json' with {type:'json'};
const entries=Object.entries(packages);const files=entries.map(([,p])=>decodeURIComponent(p.photo.sourceUrl.split('/wiki/')[1]).replaceAll('_',' '));
const u=new URL('https://commons.wikimedia.org/w/api.php');
u.search=new URLSearchParams({action:'query',format:'json',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'900',titles:files.join('|')});
let payload;
try{payload=JSON.parse(execFileSync('curl',['-sS','--fail','--max-time','45',u.href],{encoding:'utf8',maxBuffer:5000000}));}catch(e){console.error('Commons metadata unavailable; no image passes inferred');process.exit(1);}
const pages=Object.values(payload.query?.pages||{});
const rows=entries.map(([code,p],i)=>{const f=files[i],page=pages.find(x=>x.title===f);const info=page?.imageinfo?.[0],meta=info?.extmetadata;return {country:code,file:f,exists:!!info,url:info?.thumburl||info?.url||null,width:info?.thumbwidth||info?.width||null,sourceUrl:info?.descriptionurl||p.photo.sourceUrl,license:meta?.LicenseShortName?.value||null,licenseUrl:meta?.LicenseUrl?.value||null,artist:meta?.Artist?.value||null,description:meta?.ImageDescription?.value||null,contentReview:p.photo.contentVerified?'VISUALLY_REVIEWED':'UNVERIFIED',browserLoad:'UNVERIFIED'};});
const report={generatedAt:new Date().toISOString(),references:rows.length,missing:rows.filter(r=>!r.exists).length,rows};
fs.mkdirSync('docs/qa',{recursive:true});fs.writeFileSync('docs/qa/geography-images.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({references:report.references,missing:report.missing,contentPending:rows.filter(r=>r.contentReview!=='VISUALLY_REVIEWED').length}));
if(report.missing)process.exitCode=1;
