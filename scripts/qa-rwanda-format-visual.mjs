import fs from 'node:fs';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {getGeographyPackage} from '../src/utils/geographyRegistry.js';
import {getRwandaFormat} from '../src/utils/geographyRwandaFormat.js';
import {answerFingerprint} from './geography-answer-fingerprint.mjs';
const server=await createServer({server:{host:'127.0.0.1',port:4184,strictPort:true}});await server.listen();
let browser;const rows=[];
try{
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--in-process-gpu']});
 const page=await browser.newPage();page.setDefaultTimeout(8000);page.setDefaultNavigationTimeout(30000);
 for(const viewport of [{width:1024,height:768},{width:820,height:1180}]){
  await page.setViewportSize(viewport);
  for(const code of ['af','au','ar','at']){
   const p=getGeographyPackage(code),f=getRwandaFormat(p);
   await page.goto('http://127.0.0.1:4184/tests/geography-browser.html?country='+code,{waitUntil:'domcontentloaded'});
   await page.locator(`[data-continent="${f.continent}"]`).press('Enter');
   const regions=page.locator('[data-region] rect');await regions.first().waitFor();
   const overlap=await regions.evaluateAll(els=>{const b=els.map(e=>e.getBoundingClientRect());return b.some((a,i)=>b.some((c,j)=>i<j&&Math.min(a.right,c.right)-Math.max(a.left,c.left)>1&&Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top)>1));});
   const anchorsInside=await page.locator('[data-region] line').evaluateAll(els=>els.every(e=>{const p=new DOMPoint(Number(e.getAttribute('x1')),Number(e.getAttribute('y1'))).matrixTransform(e.getScreenCTM());const r=e.ownerSVGElement.getBoundingClientRect();return p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom;}));
   await page.locator('.tp-geo-answer-feedback').waitFor({state:'detached'});
   const screenshot=`docs/qa/browser/${code}-rwanda-region-${viewport.width}.png`;await page.screenshot({path:screenshot});
   if(overlap||!anchorsInside)throw Error(code+' overlapping/offscreen region targets');rows.push({country:code,viewport:viewport.width,regionTargets:'PASS',anchorsInside,screenshot});
   if(code==='af'){
    await page.locator('[data-mission="10"]').click();await page.locator(`[data-country="${code}"]`).first().press('Enter');await page.locator(`[data-city="${p.capitalId}"] circle[data-hit]`).click();await page.locator('[data-fact]').first().waitFor();await page.locator('.tp-geo-answer-feedback').waitFor({state:'detached'});await page.screenshot({path:`docs/qa/browser/af-rwanda-final-facts-${viewport.width}.png`});
   }
  }
 }
}finally{await browser?.close().catch(()=>{});await server.close();}
fs.writeFileSync('docs/qa/rwanda-format-visual.json',JSON.stringify({generatedAt:new Date().toISOString(),answerFingerprint:answerFingerprint(),scope:'Regional-label collision inspection and representative screenshots; physical iPad not tested',rows},null,2)+'\n');console.log('PASS',rows.length);
