import assert from 'node:assert/strict';import fs from 'node:fs';
import {createServer} from 'vite';import {chromium} from 'playwright';
const server=await createServer({server:{host:'127.0.0.1',port:4181,strictPort:true}});await server.listen();
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,headless:true,args:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--in-process-gpu']:[]});
try{
 const page=await browser.newPage({viewport:{width:1024,height:768}}),domains=['place','time','language','lifeCulture','japanConnection','thinkConnect'],errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/mission-public?**',route=>{
  const u=new URL(route.request().url()),country=u.searchParams.get('country'),domain=u.searchParams.get('domain');
  const questions=Array.from({length:12},(_,i)=>({id:`aaaaaaaa-aaaa-4aaa-aaaa-${String(domains.indexOf(domain)*100+i).padStart(12,'0')}`,countryIso:country,domain,type:'text4',prompt:'Question '+domain+' '+i,answer:'A',choices:['B','C','D']}));
  return route.fulfill({json:{ok:true,questions}});
 });
 await page.goto('http://127.0.0.1:4181/tests/geography-browser.html?country=au&panel=1');
 await page.waitForFunction(()=>document.body.textContent.includes('0 / 12 問クリア'));
 for(const domain of domains){
  await page.locator(`[data-domain="${domain}"]`).click();
  assert.equal(await page.locator('.tp-world-mission-card').count(),12);
  await page.getByRole('button',{name:'← 6つのカテゴリーへ'}).click();
 }
 await page.locator('[data-domain="place"]').click();
 await page.getByRole('button',{name:'地理アドベンチャーを始める（10ミッション）',exact:true}).click();
 await page.getByRole('heading',{name:'オーストラリア 地理アドベンチャー'}).waitFor();
 await page.getByRole('button',{name:'Place Adventureを閉じる',exact:true}).click();
 await page.getByRole('button',{name:'← 6つのカテゴリーへ'}).click();
 await page.route('**/api/mission-public?**',route=>{const u=new URL(route.request().url()),country=u.searchParams.get('country'),domain=u.searchParams.get('domain');return route.fulfill({json:{ok:true,questions:Array.from({length:4},(_,i)=>({id:`aaaaaaaa-aaaa-4aaa-aaaa-${String(domains.indexOf(domain)*100+i).padStart(12,'0')}`,countryIso:country,domain,type:'text4',prompt:'Question '+domain+' '+i,answer:'A',choices:['B','C','D']}))}});});
 for(const viewport of [{width:1024,height:768},{width:820,height:1180},{width:1440,height:900}]){
  await page.evaluate(()=>localStorage.setItem('timepalette_world_learning_v1',JSON.stringify({version:1,countries:{br:{completedMissionIds:['br-mc-aaaaaaaa-aaaa-4aaa-aaaa-000000000300']}}})));await page.setViewportSize(viewport);await page.goto('http://127.0.0.1:4181/tests/geography-browser.html?country=br&panel=1');await page.locator('[data-domain="lifeCulture"]').click();await page.waitForFunction(()=>document.querySelectorAll('.tp-mission-ticket').length===4);
  assert.equal(await page.locator('.tp-mission-ticket.is-cleared').count(),1);assert.equal(await page.locator('.tp-journey-progress progress').getAttribute('value'),'1');assert.equal(await page.locator('.tp-mission-ticket').filter({hasText:'Question'}).count(),0);
  const overflow=await page.locator('.tp-mission-ticket').evaluateAll(els=>els.some(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth||r.bottom>innerHeight||el.scrollWidth>el.clientWidth+1;}));if(overflow){console.log(await page.locator('.tp-mission-ticket').evaluateAll(els=>els.map(e=>({rect:e.getBoundingClientRect().toJSON(),scroll:e.scrollWidth,client:e.clientWidth}))));await page.screenshot({path:'docs/qa/browser/mission-ticket-overflow.png'});}assert.equal(overflow,false);
  await page.screenshot({animations:'disabled',path:`docs/qa/browser/mission-tickets-${viewport.width}.png`});
  await page.locator('.tp-mission-ticket').first().click();await page.getByRole('dialog',{name:'ミッション',exact:true}).waitFor();await page.getByRole('button',{name:'ミッションを閉じる'}).click();
 }
 await page.getByRole('button',{name:'← 6つのカテゴリーへ'}).click();
 await page.getByRole('button',{name:'Challenge',exact:true}).click();
 await page.locator('[data-domain="language"]').click();
 assert.equal(await page.locator('.tp-world-mission-card').count(),0);
 assert.deepEqual(errors,[]);
 await page.route('https://{upload,thumb}.wikimedia.org/**',route=>route.abort());
 await page.route('**/geography/photos/**',route=>route.abort());
 await page.goto('http://127.0.0.1:4181/tests/geography-browser.html?country=au');
 await page.locator('[data-mission="6"]').click();
 await page.getByRole('alert').first().waitFor();
 await page.locator('[data-answer="au"]').click();
 assert.equal(await page.getByRole('dialog',{name:'Mission clear'}).count(),0);
 assert.ok((await page.locator('.tp-geo-feedback').textContent()).includes('写真を読み込めていない'));

 fs.writeFileSync('docs/qa/country-panel.json',JSON.stringify({generatedAt:new Date().toISOString(),source:'Mock published API responses; not a live publication check',categories:6,questionsPerCategory:12,missionTickets:{viewports:3,fourCardsWithinViewport:true,opensPlayer:true,noQuestionSpoilers:true},legacyFallback:false,learningLevelFilter:'PASS',missingPhotoBlocksClear:'PASS',browserErrors:errors,result:'PASS'},null,2)+'\n');
 console.log('PASS: all six Creator categories, four with no legacy fallback, twelve questions each, learning levels, no browser errors');
}finally{await browser.close();await server.close();}
