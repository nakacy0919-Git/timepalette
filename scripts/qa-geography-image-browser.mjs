import fs from 'node:fs';import {chromium} from 'playwright';
import packages from '../src/data/geography/round1.json' with {type:'json'};
const proxy=process.env.QA_USE_PROXY&&process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY}:undefined;
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,headless:true,proxy,args:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--in-process-gpu']:[]});
try{
const page=await browser.newPage({viewport:{width:1100,height:900}});
const failed=[];page.on('requestfailed',r=>failed.push({error:r.failure()?.errorText}));
const rows=Object.entries(packages);
await page.setContent('<html><head><meta charset="utf-8"></head><body style="margin:0;display:grid;grid-template-columns:repeat(4,1fr)">'+rows.map(([code,p])=>`<figure><img data-country="${code}" src="${p.photo.url.replaceAll('&','&amp;')}" style="width:230px;height:170px;object-fit:contain"><figcaption>${code}: ${p.photo.captionJa}</figcaption></figure>`).join('')+'</body></html>',{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>[...document.images].every(i=>i.complete),{timeout:45000}).catch(()=>{});
const loads=await page.locator('img').evaluateAll(imgs=>imgs.map(i=>({country:i.dataset.country,browserLoad:i.complete&&i.naturalWidth>0?'LOADED':'FAILED',naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight})));
await page.screenshot({path:'docs/qa/browser/commons-photos.png',fullPage:true});
const report=JSON.parse(fs.readFileSync('docs/qa/geography-images.json','utf8'));
for(const row of report.rows)Object.assign(row,loads.find(l=>l.country===row.country));
report.browserFailures=failed;report.browserLoadFailures=loads.filter(l=>l.browserLoad!=='LOADED').length;
fs.writeFileSync('docs/qa/geography-images.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({loaded:loads.filter(l=>l.browserLoad==='LOADED').length,failed:report.browserLoadFailures,networkErrors:[...new Set(failed.map(f=>f.error))]}));
if(report.browserLoadFailures)process.exitCode=1;
}finally{await browser.close();}
