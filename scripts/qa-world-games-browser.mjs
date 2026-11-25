import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
const server=await createServer({server:{host:'127.0.0.1',port:4189,strictPort:true}});await server.listen();
let browser;
try{
 browser=await chromium.launch({headless:true});
 for(const viewport of [{width:1024,height:768},{width:820,height:1180},{width:390,height:844}]){
  const context=await browser.newContext({viewport,hasTouch:true});
  await context.addInitScript(()=>{sessionStorage.setItem('timepalette_opening_seen_v1','true');localStorage.setItem('timepalette_ui_sound_v1','off');});
  const page=await context.newPage();page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4189/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/World Games/}).click();
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
  assert.deepEqual(errors,[]);
  console.log('PASS: all four modes at '+viewport.width+'x'+viewport.height);
  await context.close();
 }
}finally{await browser?.close();await server.close();}
