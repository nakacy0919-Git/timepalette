import assert from 'node:assert/strict';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {createRecord,roomRequest,digest} from '../cloudflare/timepalette-battle-api/src/roomService.js';
const base='http://127.0.0.1:4190';
process.env.VITE_WORLD_BATTLE_API_URL=base+'/battle-test';
const server=await createServer({server:{host:'127.0.0.1',port:4190,strictPort:true}});await server.listen();
let browser,record,credentials;
const q={id:'qa-capital',country:'ca',domain:'place',language:'en',prompt:'What is the capital of Canada?',choices:['Ottawa','Toronto','Montreal','Vancouver'],correctIndex:0,explanation:'Ottawa is the capital.'};
const routeApi=async route=>{
 const req=route.request(),url=new URL(req.url()),path=url.pathname.replace('/battle-test','');
 const reply=(status,data)=>route.fulfill({status,json:data,headers:{'Cache-Control':'no-store'}});
 if(path==='/rooms'){
  const input=req.postDataJSON();
  const made=await createRecord({...input,limit:1,seconds:0},[q],Date.now());
  record=made.record;credentials=made.credentials;
  return reply(201,{...credentials,code:'ABC12345',view:made.view,serverTime:Date.now()});
 }
 const op=path.split('/').at(-1),secret=req.headers().authorization?.slice(7);
 if(!secret)return reply(403,{error:'invalid_credentials'});
 const out=roomRequest(record,await digest(secret),op,req.postDataJSON()||{},Date.now());
 record=out.record;
 return reply(out.status,out.data);
};
try{
 browser=await chromium.launch({headless:true});
 const pages=[];
 for(const viewport of [{width:1024,height:768},{width:820,height:1180},{width:390,height:844}]){
  const ctx=await browser.newContext({viewport});
  await ctx.route('**/battle-test/rooms**',routeApi);
  await ctx.addInitScript(()=>{sessionStorage.setItem('timepalette_opening_seen_v1','true');localStorage.setItem('timepalette_ui_sound_v1','off');});
  const page=await ctx.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/World Games/}).click();
  await page.getByRole('button',{name:/World Quiz Battle/}).click();
  await page.getByRole('button',{name:'オンライン対戦（限定テスト）'}).click();
  pages.push({ctx,page,errors});
 }
 const [host,red,blue]=pages.map(x=>x.page);
 await host.getByRole('button',{name:'先生：ルーム作成'}).click();
 await host.getByLabel('先生用作成キー').fill('x'.repeat(32));
 await host.getByRole('button',{name:'ルームを作成'}).click();
 await host.getByText('ABC12345',{exact:true}).waitFor();
 assert.equal(await host.getByRole('button',{name:'対戦開始'}).isDisabled(),true);
 for(const [i,p] of [red,blue].entries()){
  await p.getByRole('button',{name:'生徒：ルーム参加'}).click();
  await p.getByLabel('ルームコード').fill('ABC12345');
  await p.getByLabel('チーム参加キー').fill(credentials.teams[i].token);
  await p.getByRole('button',{name:'参加する',exact:true}).click();
  await p.getByText('ABC12345',{exact:true}).waitFor();
 }
 await host.getByText('2 / 2 チーム参加済み',{exact:true}).waitFor();
 await host.getByRole('button',{name:'対戦開始'}).click();
 for(const p of [red,blue]){
  await p.getByText(q.prompt,{exact:true}).waitFor();
  assert.equal(await p.locator('.wb-question').getAttribute('lang'),'en');
  assert.equal(await p.locator('.wg-options .correct').count(),0);
  assert.equal(await p.getByRole('button',{name:'正解発表',exact:true}).count(),0);
 }
 await Promise.all([red.locator('.wg-options button').filter({hasText:'Ottawa'}).click(),blue.locator('.wg-options button').filter({hasText:'Toronto'}).click()]);
 await Promise.all([red.getByRole('button',{name:'回答を確定'}).click(),blue.getByRole('button',{name:'回答を確定'}).click()]);
 await host.getByText('2 / 2 回答済み',{exact:true}).waitFor();
 await host.getByRole('button',{name:'正解発表',exact:true}).click();
 for(const p of [host,red,blue])await p.getByText('正解：Ottawa',{exact:true}).waitFor();
 await host.getByRole('button',{name:'最終結果'}).click();
 for(const {page,errors} of pages){
  await page.getByText('FINAL RESULTS',{exact:false}).waitFor();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);
  assert.deepEqual(errors,[]);
 }
 assert.equal(record.room.teams[0].score,100);assert.equal(record.room.teams[1].score,0);
 host.once('dialog',d=>d.accept());await host.getByRole('button',{name:'ルームを終了'}).click();
 await host.getByText('ルームを終了しました。',{exact:true}).waitFor();
 await red.getByText('ルーム終了',{exact:true}).waitFor();
 console.log('PASS: host and two independent browser contexts, private answers, synchronized scoring and room closure');
}finally{await browser?.close();await server.close();}
