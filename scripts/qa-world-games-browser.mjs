import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({server:{host:'127.0.0.1',port:4189,strictPort:true}});await server.listen();
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:1461,height:800},{width:1180,height:820},{width:1024,height:768},{width:820,height:1180},{width:390,height:844}]){
  const context=await browser.newContext({viewport,hasTouch:true});
  await context.addInitScript(()=>{sessionStorage.setItem('timepalette_opening_seen_v1','true');localStorage.setItem('timepalette_ui_sound_v1','off');});
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4189/',{waitUntil:'domcontentloaded'});
  const home=page.locator('.tp-activity-home');
  await home.waitFor();
  assert.equal(await home.locator('[data-activity]').count(),5);
  assert.deepEqual(await home.locator('[data-activity]').evaluateAll(nodes=>nodes.map(n=>n.dataset.activity)),['adventure','shuffle','battle','territory','journey']);
  assert.equal(await home.locator('#journey').count(),0,'progress belongs inside Adventure');
  assert.equal(await home.getByRole('button',{name:'ゲームを始める',exact:true}).count(),0);
  assert.equal(await home.getByRole('button',{name:'設定を見る',exact:true}).count(),0);
  await home.locator('.tp-home-card-image').first().waitFor();
  assert.equal(await home.locator('.tp-home-card-image').count(),5,'all five original illustrations must render');
  await home.locator('.tp-home-card-image').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
  assert.equal(await home.locator('.tp-home-card-image').evaluateAll(images=>images.every(img=>img.naturalWidth===800&&img.naturalHeight===600)),true,'original WebP dimensions');
  const rects=await home.locator('[data-activity]').evaluateAll(nodes=>nodes.map(n=>({x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})));
  if(viewport.width>=900){
   assert.ok(rects.every(r=>Math.abs(r.y-rects[0].y)<2&&r.width<=250&&r.height<=310),'compact equal-row cards');
   assert.ok(rects.slice(1).every((r,i)=>r.x-(rects[i].x+rects[i].width)>=13),'card spacing');
  }
  if(viewport.width>=820){
   const boxes=await home.locator('[data-activity]').evaluateAll(nodes=>nodes.map(n=>n.getBoundingClientRect().bottom));
   assert.ok(boxes.every(bottom=>bottom<=viewport.height),'all five activities visible');
  }
  await mkdir('artifacts/world-games-home',{recursive:true});
  await home.locator('.tp-home-brand img').evaluate(img=>img.decode());
  await home.locator('.tp-home-background').evaluate(img=>img.decode());
  await page.screenshot({path:'artifacts/world-games-home/home-'+viewport.width+'x'+viewport.height+'.png',fullPage:true,animations:'disabled'});
  await home.locator('[data-activity="adventure"]').click();
  await page.getByRole('button',{name:'ホームに戻る',exact:true}).waitFor();
  await page.getByRole('button',{name:/My World Journey/}).click();
  await page.getByRole('dialog',{name:'My World Journey 世界探究の進捗'}).waitFor();
  await page.getByRole('button',{name:'冒険ホームに戻る',exact:true}).click();
  await page.getByRole('dialog',{name:'My World Journey 世界探究の進捗'}).waitFor({state:'hidden'});
  await page.getByRole('button',{name:'ホームに戻る',exact:true}).click();
  await home.waitFor();
  for(const mode of ['battle','territory','journey']){
   await home.locator('[data-activity="'+mode+'"]').click();
   await page.locator('.wg-modes button[aria-pressed=true]').waitFor();
   const label=await page.locator('.wg-modes button[aria-pressed=true] strong').textContent();
   assert.equal(label,{battle:'World Quiz Battle',territory:'World Territory',journey:'World Journey'}[mode]);
   await page.getByRole('button',{name:'← ホーム',exact:true}).click();
   await home.waitFor();
  }
  await home.locator('[data-activity="shuffle"]').click();
  const shell=page.locator('.wg-shell');await shell.waitFor();
  await shell.getByRole('button',{name:'すべて解除',exact:true}).click();
  await shell.getByRole('button',{name:/アゼルバイジャン/}).click();
  await shell.getByRole('button',{name:/ウズベキスタン/}).click();
  await shell.getByRole('button',{name:'ゲーム開始 →'}).click();
  for(let i=0;i<8;i++){
   await shell.locator('.wg-options button').first().click();
   await shell.locator('.wg-feedback').waitFor();
   await shell.locator('.wg-feedback .wg-primary').click();
  }
  await shell.getByText('GAME COMPLETE',{exact:false}).waitFor();
  const report=shell.getByRole('region',{name:'授業結果分析'});
  await report.waitFor();
  assert.equal(await report.locator('.wg-report-metrics>div').count(),4);
  await report.getByRole('button',{name:'全問題（8）',exact:true}).click();
  assert.equal(await report.locator('details').count(),8);
  await report.locator('summary').first().click();
  assert.equal(await report.locator('details[open] .wg-report-responses>div').count(),1);
  const downloadEvent=page.waitForEvent('download');
  await report.getByRole('button',{name:'CSVを保存',exact:true}).click();
  const download=await downloadEvent;
  assert.match(download.suggestedFilename(),/^timepalette-world-games-.*\.csv$/);
  assert.equal(await download.failure(),null);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'classroom report overflow');

  await shell.getByRole('button',{name:'設定に戻る',exact:true}).click();
  await shell.getByRole('button',{name:/World Quiz Battle/}).click();
  await shell.getByRole('button',{name:'ゲーム開始 →'}).click();
  await shell.getByRole('button',{name:'回答を始める',exact:true}).click();
  await shell.locator('.wg-options button').first().click();
  await shell.getByRole('button',{name:'回答を始める',exact:true}).click();
  await shell.locator('.wg-options button').nth(1).click();
  await shell.locator('.wg-feedback').waitFor();
  page.once('dialog',d=>d.accept());
  await shell.getByRole('button',{name:'← ゲーム設定',exact:true}).click();
  await shell.getByRole('button',{name:/World Territory/}).click();
  await shell.getByRole('button',{name:'ゲーム開始 →'}).click();
  await shell.locator('.wg-country-grid button').first().click();
  await shell.locator('.wg-options button').first().click();
  await shell.locator('.wg-feedback').waitFor();
  page.once('dialog',d=>d.accept());
  await shell.getByRole('button',{name:'← ゲーム設定',exact:true}).click();
  await shell.getByRole('button',{name:/World Journey/}).click();
  await shell.getByRole('button',{name:'ゲーム開始 →'}).click();
  await shell.getByRole('button',{name:/サイコロを振る/}).click();
  await shell.locator('.wg-options button').first().click();
  await shell.locator('.wg-feedback').waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,'page overflow');
  // Exercise the actual English display and scoring in the same browser.
  page.once('dialog',d=>d.accept());
  await shell.getByRole('button',{name:'← ゲーム設定',exact:true}).click();
  await shell.getByRole('button',{name:/World Shuffle/}).click();
  await shell.getByRole('button',{name:'English',exact:true}).click();
  await shell.getByRole('button',{name:'ゲーム開始 →'}).click();
  const quiz=shell.locator('.wg-question');
  await quiz.waitFor();
  assert.equal(await quiz.getAttribute('lang'),'en');
  const quizText=await quiz.locator('h2,.wg-options').allTextContents();
  assert.equal(/[\u3040-\u30ff\u3400-\u9fff]/.test(quizText.join(' ')),false);
  await quiz.locator('.wg-options button').first().click();
  await quiz.locator('.wg-feedback').waitFor();
  await quiz.getByRole('button',{name:'Next',exact:true}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: all four modes at '+viewport.width+'x'+viewport.height);
  await context.close();
 }
}finally{await browser?.close();await server.close();}
