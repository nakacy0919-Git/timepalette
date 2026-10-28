import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {feature} from 'topojson-client';
import atlas from 'world-atlas/countries-110m.json' with {type:'json'};
import data from '../src/data/place_r.json' with {type:'json'};
import {answerFingerprint} from './geography-answer-fingerprint.mjs';
const server=await createServer({server:{host:'127.0.0.1',port:4183,strictPort:true}});await server.listen();
let browser;
const report={generatedAt:new Date().toISOString(),answerFingerprint:answerFingerprint(),scope:'Rwanda P07/P08/P10 answer-gate regression. External reference photos and physical iPad are not certified by this test.',rows:[]};
try{
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--in-process-gpu']});
 const page=await browser.newPage({viewport:{width:1440,height:1100}});page.setDefaultTimeout(8000);page.setDefaultNavigationTimeout(30000);
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('timepalette-place-progress-v1:rw')||'{}').completedMissionIds||[]);
 const choose=label=>page.locator('main').getByRole('button',{name:label,exact:true}).click();
 for(const index of [6,7,9]){
  await page.goto('http://127.0.0.1:4183/tests/rwanda-reference.html',{waitUntil:'domcontentloaded'});
  await page.locator('aside button').filter({hasText:'P'+String(index+1).padStart(2,'0')}).click();
  const m=data.missions[index];
  if(index===6){
   const wrong=m.choices.filter(c=>!c.correct),good=m.choices.filter(c=>c.correct);
   for(const c of wrong)await choose(c.ja);await choose('2つ選んで答え合わせ');assert.ok(!(await saved()).includes(m.id));
   for(const c of wrong)await choose(c.ja);for(const c of good)await choose(c.ja);await choose('2つ選んで答え合わせ');
  }else if(index===7){
   const country=m.route.countryChoices,port=m.route.portChoices;
   const card=label=>page.locator('main button').filter({hasText:label}).click();
   await card(country.find(c=>!c.correct).ja);await card(port.find(c=>!c.correct).ja);await choose('🚚 トラックを出発させる！');assert.ok(!(await saved()).includes(m.id));
   await card(country.find(c=>c.correct).ja);await card(port.find(c=>c.correct).ja);assert.ok(!(await saved()).includes(m.id));await choose('🚚 トラックを出発させる！');
  }else{
   const geoIndex=feature(atlas,atlas.objects.countries).features.findIndex(f=>f.properties.name==='Rwanda');
   await page.locator('main .rsm-geography').nth(geoIndex).click();
   await page.locator('main .rsm-marker circle').first().waitFor();await page.waitForTimeout(400);await page.locator('main .rsm-marker').first().locator('circle').last().click();
   await page.getByText('正しい情報を3つ選ぼう！',{exact:true}).waitFor();
   const wrong=m.facts.filter(c=>!c.correct),good=m.facts.filter(c=>c.correct);
   const card=label=>page.locator('main button').filter({hasText:label}).click();
   for(const c of wrong)await card(c.ja);await card(good[0].ja);await choose('🔑 最後の鍵をアンロック！');assert.ok(!(await saved()).includes(m.id));
   for(const c of wrong)await card(c.ja);for(const c of good.slice(1))await card(c.ja);await choose('🔑 最後の鍵をアンロック！');
  }
  await page.waitForFunction(id=>(JSON.parse(localStorage.getItem('timepalette-place-progress-v1:rw')||'{}').completedMissionIds||[]).includes(id),m.id);report.rows.push({mission:index+1,wrongRejected:true,correctAccepted:true});
 }
 report.status='PASS';
} catch(e){report.status='FAIL';report.error=e.message;process.exitCode=1;}
finally{await browser?.close().catch(()=>{});await server.close();fs.writeFileSync('docs/qa/rwanda-reference-answer-gates.json',JSON.stringify(report,null,2)+'\n');console.log(report.status,report.error||report.rows.length+' missions');}
