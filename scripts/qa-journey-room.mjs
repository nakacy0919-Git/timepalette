// Opt-in live check: two browser contexts connect via the HTTPS room relay.
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
const base=process.env.BASE_URL||'http://127.0.0.1:4178';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});
try{
 const host=await browser.newPage(),guest=await browser.newPage();
 for(const page of [host,guest]){
  if(process.env.RELAY_API_URL)await page.route('**/api/journey-room',async route=>{
   try{const r=await fetch(process.env.RELAY_API_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:route.request().postData()});const body=await r.text(),data=JSON.parse(body),request=route.request().postDataJSON();console.log('relay',request.op,r.status,data.error||'',data.snapshot?.seq||request.snapshot?.seq||'');await route.fulfill({status:r.status,contentType:'application/json',body});}catch{await route.abort();}
  });
  await page.goto(base);
  const skip=page.getByRole('button',{name:/SKIP/});
  if(await skip.isVisible())await skip.click();
  await page.getByRole('button',{name:/World Journey/}).click({timeout:30000});
  await page.getByRole('button',{name:/複数端末で遊ぶ/}).click();
 }
 const next=()=>host.getByRole('button',{name:'次へ →',exact:true}).click();
 await host.getByRole('button',{name:/ホストになる/}).click();
 await next();await next();
 await host.getByRole('button',{name:/スピード テンポ/}).click();
 await next();
 await host.getByRole('button',{name:/端末対戦ルームを作成/}).click();
 await host.getByText(/参加受付中/).waitFor({timeout:20000});
 const code=await host.locator('.wj-room-code').innerText();
 assert.match(code,/^\d{6}$/);
 await guest.getByRole('button',{name:/ルームに参加/}).click();
 await guest.getByLabel('ルームコード').fill(code);
 await guest.getByRole('button',{name:/接続する/}).click();
 await host.getByRole('button',{name:'参加を許可'}).click({timeout:25000});
 await guest.getByText(/チーム2で参加しました/).waitFor({timeout:10000});
 await host.getByRole('button',{name:/全員でゲーム開始/}).click();
 await guest.getByRole('button',{name:/サイコロを振る/}).waitFor({timeout:10000});
 assert.equal(await guest.getByRole('button',{name:/サイコロを振る/}).isDisabled(),true);
 await host.getByRole('button',{name:/サイコロを振る/}).click();
 await guest.getByRole('dialog',{name:'サイコロ'}).waitFor();
 await host.getByRole('dialog',{name:'クイズ・解説'}).waitFor({timeout:20000});
 await guest.getByRole('dialog',{name:'クイズ・解説'}).waitFor({timeout:20000});
 await host.locator('.wg-options button').first().click();
 await guest.getByRole('button',{name:/次へ →/}).waitFor();
 assert.equal(await guest.getByRole('button',{name:/次へ →/}).isDisabled(),true);
 await host.getByRole('button',{name:/次へ →/}).click();
 await guest.getByRole('button',{name:/サイコロを振る/}).waitFor();
 await guest.getByRole('button',{name:/サイコロを振る/}).click();
 await host.getByRole('dialog',{name:'サイコロ'}).waitFor();
 await guest.getByRole('dialog',{name:'クイズ・解説'}).waitFor({timeout:20000});
 await guest.locator('.wg-options button').first().click();
 await host.getByRole('button',{name:/次へ →/}).waitFor();
 console.log('PASS: two contexts joined, shared dice and questions, rotated turns, and synchronized guest answers');
}finally{await browser.close();}
