import assert from 'node:assert/strict';import fs from 'node:fs';
import {createServer} from 'vite';import {chromium} from 'playwright';
const server=await createServer({server:{host:'127.0.0.1',port:4181,strictPort:true}});await server.listen();
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,headless:true,args:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--in-process-gpu']:[]});
try{
 const page=await browser.newPage({viewport:{width:1024,height:768}}),domains=['language','lifeCulture','japanConnection','thinkConnect'],errors=[];
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
  assert.equal(await page.locator('button').filter({hasText:'Question '+domain+' '}).count(),12);
  await page.getByRole('button',{name:'← 6つのカテゴリーへ'}).click();
 }
 await page.getByRole('button',{name:'Challenge',exact:true}).click();
 await page.locator('[data-domain="language"]').click();
 assert.equal(await page.locator('button').filter({hasText:'Question language '}).count(),0);
 assert.deepEqual(errors,[]);
 await page.route('https://{upload,thumb}.wikimedia.org/**',route=>route.abort());
 await page.goto('http://127.0.0.1:4181/tests/geography-browser.html?country=au');
 await page.locator('[data-mission="6"]').click();
 await page.getByRole('alert').first().waitFor();
 await page.locator('[data-answer="au"]').click();
 assert.equal(await page.getByRole('dialog',{name:'Mission clear'}).count(),0);
 assert.ok((await page.locator('.tp-geo-feedback').textContent()).includes('写真を読み込めていない'));

 fs.writeFileSync('docs/qa/country-panel.json',JSON.stringify({generatedAt:new Date().toISOString(),source:'Mock published API responses; not a live publication check',categories:4,questionsPerCategory:12,legacyFallback:false,learningLevelFilter:'PASS',missingPhotoBlocksClear:'PASS',browserErrors:errors,result:'PASS'},null,2)+'\n');
 console.log('PASS: four Creator-only categories, twelve questions each, learning levels, no browser errors');
}finally{await browser.close();await server.close();}
