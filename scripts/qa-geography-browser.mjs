import fs from 'node:fs';
import {createServer} from 'vite';
import {chromium} from 'playwright';
import {geographyCountries,getGeographyPackage,geographyCandidates} from '../src/utils/geographyRegistry.js';
const touch=process.env.QA_TOUCH==='1';
const activate=loc=>touch?loc.tap():loc.click();
const server=await createServer({server:{host:'127.0.0.1',port:4178,strictPort:true}});await server.listen();
let browser;
fs.mkdirSync('docs/qa/browser',{recursive:true});
const report={generatedAt:new Date().toISOString(),inputMode:touch?'Touch emulation (Chromium); not physical Safari':'Mouse and keyboard',scope:'UI correct/incorrect and layout; live photos assessed separately',imageTransport:process.env.QA_CACHED_IMAGES?'QA network interception enabled':'Production same-origin Commons assets; no network interception',rows:[]};
const reportPath=process.env.QA_REPORT_PATH||'docs/qa/geography-browser.json';
const selected=geographyCountries.filter(p=>(!process.env.QA_GROUP||p.group===process.env.QA_GROUP)&&(!process.env.QA_COUNTRIES||process.env.QA_COUNTRIES.split(',').includes(p.countryCode)));
try{
for(const viewport of [{width:1024,height:768},{width:820,height:1180}]){
  browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined,headless:true,proxy:process.env.QA_USE_PROXY&&process.env.HTTPS_PROXY?{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}:undefined,args:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE?['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--single-process','--no-zygote','--use-gl=angle','--use-angle=swiftshader','--in-process-gpu']:[]});

  const context=await browser.newContext({viewport,...(touch?{hasTouch:true,isMobile:true,deviceScaleFactor:2}:{})});
  const page=await context.newPage();page.setDefaultTimeout(5000);
  // Network images are NOT replaced with fixtures: failures remain visible and recorded.
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  if(process.env.QA_CACHED_IMAGES){
    await page.route('https://{upload,thumb}.wikimedia.org/**',route=>{
      const c=geographyCountries.find(c=>new URL(c.photo.url).href===new URL(route.request().url()).href);
      if(!c)return route.abort();
      const root=process.env.QA_CACHED_IMAGES;
      const updated=root+'/'+c.countryCode+'-new.jpg',original=root+'/'+c.countryCode+'.jpg';
      const file=fs.existsSync(updated)?updated:original;
      const bytes=fs.readFileSync(file),mime=bytes[0]===137?'image/png':bytes.toString('ascii',0,4)==='RIFF'?'image/webp':'image/jpeg';
      return route.fulfill({body:bytes,contentType:mime});
    });
  }
  for(const country of selected){
    const p=getGeographyPackage(country.countryCode);
    await page.goto(`http://127.0.0.1:4178/tests/geography-browser.html?country=${p.countryCode}`,{waitUntil:'domcontentloaded'});
    for(let i=0;i<10;i++){
      if(process.env.QA_MISSIONS&&!process.env.QA_MISSIONS.split(',').includes(String(i+1)))continue;
      const row={country:p.countryCode,mission:i+1,viewport:`${viewport.width}x${viewport.height}`,interaction:'PENDING',layout:'PENDING',images:'PENDING'};
      try{
        await page.locator(`[data-mission="${i+1}"]`).click();
        const root=page.getByTestId('geography-mission');await root.waitFor();
        if([5,6,8].includes(i))await page.waitForFunction(()=>[...document.images].every(i=>i.complete),null,{timeout:8000}).catch(()=>{});
        const bounds=await root.evaluate(el=>{const r=el.getBoundingClientRect();const outside=[...el.querySelectorAll('button,svg,img')].filter(e=>{const b=e.getBoundingClientRect();return b.width&&b.height&&(b.bottom>innerHeight+1||b.top<0||b.right>innerWidth+1||b.left<0)}).map(e=>e.tagName+':'+(e.getAttribute('data-answer')||e.getAttribute('data-city')||e.textContent).slice(0,50));return {height:r.height,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,outside};});
        row.layout=bounds.outside.length||bounds.scrollHeight>bounds.clientHeight+2?'FAIL':'PASS';row.overflow=bounds;
        if(['au','ao'].includes(p.countryCode)&&[1,5,9].includes(i))await page.screenshot({path:`docs/qa/browser/${p.countryCode}-P${i+1}-${viewport.width}-review.png`});
        const click=async sel=>{
          let loc=root.locator(sel).first();
          if(touch&&await root.locator('g'+sel).count())loc=root.locator('g'+sel).first();
          const tag=await loc.evaluate(e=>e.tagName.toLowerCase());
          if(tag==='path'&&!touch)await loc.press('Enter');
          else if(tag==='path'){
            const point=await loc.evaluate(el=>{
              const b=el.getBBox(),m=el.getScreenCTM(),points=[];
              for(const x of [.5,.25,.75,.05,.95])for(const y of [.5,.25,.75,.05,.95])points.push(new DOMPoint(b.x+b.width*x,b.y+b.height*y));
              const length=el.getTotalLength();for(let n=0;n<100;n++)points.push(el.getPointAtLength(length*n/100));
              for(const p of points){const q=p.matrixTransform(m);if(q.x>=0&&q.y>=0&&q.x<innerWidth&&q.y<innerHeight&&document.elementFromPoint(q.x,q.y)===el)return {x:q.x,y:q.y};}
              return null;
            });
            if(!point)throw Error('No visible touch target: '+sel);
            await page.touchscreen.tap(point.x,point.y);
          }else if(tag==='g')await activate(loc.locator('circle[data-hit],circle').last());
          else await activate(loc);
        };
        const notClear=async()=>{if(await page.getByRole('dialog',{name:'Mission clear'}).count())throw Error('Incorrect action cleared mission');};
        if(i===0){const map=root.locator('svg.tp-geo-map');const initial=await map.getAttribute('viewBox');await root.getByRole('button',{name:'地図を拡大',exact:true}).click();if(await map.getAttribute('viewBox')===initial)throw Error('Zoom did not change map');await root.getByRole('button',{name:'地図を東へ移動',exact:true}).click();await root.getByRole('button',{name:'地図全体を表示',exact:true}).click();if(await map.getAttribute('viewBox')!==initial)throw Error('Map reset failed');row.mapNavigation='PASS';}
        const wrongCity=p.cities.find(c=>c.id!==p.capitalId).id;
        const wrongCountry=geographyCandidates(p).find(c=>c.countryCode!==p.countryCode).countryCode;
        switch(i){
          case 0:await click(`[data-country="${wrongCountry}"]`);await notClear();await click(`[data-country="${p.countryCode}"]`);break;
          case 1:{const a=p.neighbors[0],b=p.neighbors[1];if(b){await click(`[data-card="${a.iso}"]`);await click(`[data-slot="${b.iso}"]`);await notClear();}else{await click(`[data-slot="${a.iso}"]`);await notClear();}for(const n of p.neighbors){await click(`[data-card="${n.iso}"]`);await click(`[data-slot="${n.iso}"]`);}break;}
          case 2:case 5:{const wrong=root.locator('[data-answer]').filter({hasNot:page.locator('never')});const id=await wrong.evaluateAll((els,code)=>els.find(e=>e.dataset.answer!==code)?.dataset.answer,p.countryCode);await click(`[data-answer="${id}"]`);await notClear();await click(`[data-answer="${p.countryCode}"]`);break;}
          case 3:await click(`[data-city="${wrongCity}"]`);await notClear();await click(`[data-city="${p.capitalId}"]`);break;
          case 4:await click(`[data-city="${p.cities[1].id}"]`);await notClear();for(const c of p.cities)await click(`[data-city="${c.id}"]`);break;
          case 6:await click('[data-answer="climate"]');await activate(root.getByRole('button',{name:'2つの説明を確かめる'}));await notClear();await click('[data-answer="climate"]');await click('[data-answer="visible"]');await click('[data-answer="limited"]');await activate(root.getByRole('button',{name:'2つの説明を確かめる'}));break;
          case 7:await click('[data-answer="port-Rotterdam"]');await notClear();await click(`[data-answer="via-${p.route.via}"]`);await click(`[data-answer="port-${p.route.port}"]`);break;
          case 8:await click('[data-answer="weather"]');await notClear();await click('[data-answer="limited"]');break;
          case 9:await click(`[data-country="${wrongCountry}"]`);await notClear();await click(`[data-country="${p.countryCode}"]`);await click(`[data-city="${wrongCity}"]`);await notClear();await click(`[data-city="${p.capitalId}"]`);await click('[data-answer="wrong-fact"]');await notClear();await click('[data-answer="fact"]');break;
        }
        await page.getByRole('dialog',{name:'Mission clear'}).waitFor();row.interaction='PASS';
        row.images=await page.locator('img').evaluateAll(imgs=>imgs.length?imgs.every(im=>im.complete&&im.naturalWidth>0)?'LOADED':'UNVERIFIED':'NONE');
        if(process.env.QA_CACHED_IMAGES&&row.images==='LOADED')row.images='LOCAL_COMMONS_RENDER_PASS';
        if(row.layout==='FAIL')await page.screenshot({path:`docs/qa/browser/${p.countryCode}-P${i+1}-${viewport.width}-layout.png`});
        await page.getByRole('button',{name:'一覧へ',exact:true}).click();
      }catch(e){row.interaction='FAIL';row.error=e.message;await page.screenshot({path:`docs/qa/browser/${p.countryCode}-P${i+1}-${viewport.width}-failure.png`}).catch(()=>{});await page.goto(`http://127.0.0.1:4178/tests/geography-browser.html?country=${p.countryCode}`,{waitUntil:'domcontentloaded'});}
      row.browserErrors=[...errors];report.rows.push(row);
    }
    const beforeReplay=await page.evaluate(code=>JSON.parse(localStorage.getItem('timepalette-place-progress-v1:'+code)||'{}').completedMissionIds||[],p.countryCode);
    await page.locator('[data-mission="1"]').click();
    await page.locator(`[data-country="${p.countryCode}"]`).first().press('Enter');
    await page.getByRole('dialog',{name:'Mission clear'}).waitFor();
    const afterReplay=await page.evaluate(code=>JSON.parse(localStorage.getItem('timepalette-place-progress-v1:'+code)||'{}').completedMissionIds||[],p.countryCode);
    report.rows.filter(r=>r.country===p.countryCode&&r.viewport===`${viewport.width}x${viewport.height}`).forEach(r=>r.replayDoesNotDuplicate=afterReplay.length===beforeReplay.length&&new Set(afterReplay).size===afterReplay.length);
    await page.reload();
    const saved=await page.evaluate(code=>JSON.parse(localStorage.getItem('timepalette-place-progress-v1:'+code)||'{}'),p.countryCode);
    report.rows.filter(r=>r.country===p.countryCode&&r.viewport===`${viewport.width}x${viewport.height}`).forEach(r=>r.progressSaved=saved.completedMissionIds?.includes(`${p.countryCode}-place-${String(r.mission).padStart(2,'0')}`)||false);
    console.log(p.countryCode,viewport.width,report.rows.filter(r=>r.country===p.countryCode&&r.viewport===`${viewport.width}x${viewport.height}`).map(r=>r.interaction==='PASS'&&r.layout==='PASS'?'✓':'✗').join(''));
    fs.writeFileSync(reportPath+'.running',JSON.stringify(report,null,2)+'\n');
  }
  await context.close();await browser.close();
}
}finally{await browser?.close().catch(()=>{});await server.close();}
report.finishedAt=new Date().toISOString();
fs.writeFileSync(reportPath+'.running',JSON.stringify(report,null,2)+'\n');
fs.renameSync(reportPath+'.running',reportPath);
const failed=report.rows.filter(r=>r.interaction!=='PASS'||r.layout!=='PASS'||!r.progressSaved);
console.log('Checks:',report.rows.length,'Failures:',failed.length);
if(failed.length)process.exitCode=1;
