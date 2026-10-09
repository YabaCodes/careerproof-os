import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';

// CP_TEST_ROOT selects the frozen alpha.2 dist or the newly built alpha.3 dist.
// No synthetic career records are inserted: only unsaved form values are shown.
const stage=process.argv[2];
if(!['before','after'].includes(stage))throw new Error('Pass before or after');
const destination=process.argv[3]??'test-results/ios-refinement/'+stage;
await mkdir(destination,{recursive:true});
const server=spawn(process.execPath,['scripts/test-server.mjs'],{env:{...process.env,CP_TEST_PORT:'4186'},stdio:'inherit'});
const browser=await chromium.launch();
const geometry=[];
try{
  for(let i=0;i<50;i++){
    try{await fetch('http://127.0.0.1:4186');break;}catch{await new Promise(resolve=>setTimeout(resolve,100));}
  }
  for(const theme of ['light','dark'])for(const width of [320,375,390,430]){
    const context=await browser.newContext({viewport:{width,height:812},isMobile:true,hasTouch:true,serviceWorkers:'block',locale:'en-US'});
    const page=await context.newPage();
    await page.addInitScript(theme=>localStorage.setItem('careerproof-theme',theme),theme);
    await page.goto('http://127.0.0.1:4186');await page.waitForSelector('.hero-card');
    await page.locator('.mobile-nav').screenshot({path:`${destination}/${stage}-${width}-${theme}-nav.png`});
    await page.locator('.mobile-create').click();
    await page.locator('#occurredOn').fill('2026-10-09');
    await page.locator('#title').fill('Synthetic achievement');
    await page.locator('#contribution').fill('Documented a synthetic process improvement.');
    await page.locator('#occurredOn').scrollIntoViewIfNeeded();
    // A crop shows the label, date, category and both content margins.
    const box=await page.locator('.field-row').boundingBox();
    await page.screenshot({path:`${destination}/${stage}-${width}-${theme}-date.png`,clip:{x:0,y:box.y-8,width,height:box.height+16}});
    await page.locator('.modal-body').evaluate(el=>el.scrollTop=0);
    await page.locator('.modal').focus();
    await page.screenshot({path:`${destination}/${stage}-${width}-${theme}-capture.png`});
    geometry.push(await page.evaluate(({width,theme})=>{
      const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
      return {width,theme,date:rect('#occurredOn'),category:rect('#impactCategory'),nav:rect('.mobile-nav'),footer:rect('.modal-footer'),body:rect('.modal-body')};
    },{width,theme}));
    await context.close();
  }
  await writeFile(`${destination}/${stage}-geometry.json`,JSON.stringify(geometry,null,2)+'\n');
  console.log(`${stage}: 24 Chromium screenshots, 8 viewport/theme geometries`);
}finally{await browser.close();server.kill();}
