import fs from 'node:fs';import {createHash} from 'node:crypto';
import assets from '../src/data/geography/photo-assets.json' with {type:'json'};
const origin='https://timepalette.pic-speak-story.com';
const rows=[];
for(const [country,a] of Object.entries(assets)){
 const issues=[];let status,bytes;
 try{const r=await fetch(origin+a.publicPath,{signal:AbortSignal.timeout(25000)});status=r.status;bytes=Buffer.from(await r.arrayBuffer());if(!r.ok||createHash('sha256').update(bytes).digest('hex')!==a.sha256)issues.push('production bytes differ or unavailable');}
 catch(e){issues.push(e.message);}
 rows.push({country,status,bytes:bytes?.length,expectedSha256:a.sha256,issues});
}
const report={checkedAt:new Date().toISOString(),origin,scope:'Production same-origin photo byte and status verification; content and browser decode are recorded separately',images:rows.length,errors:rows.filter(r=>r.issues.length).length,rows};
fs.writeFileSync('docs/qa/geography-production-assets.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({images:report.images,errors:report.errors}));if(report.errors)process.exitCode=1;
