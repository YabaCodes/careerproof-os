import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import {fullCollections,legacyBackup,collections} from '../tests/fixtures.mjs';
import {generateBackup} from '../dist/app/domain/validation.js';
import {spawn} from 'node:child_process';
const server=spawn(process.execPath,['scripts/test-server.mjs'],{env:{...process.env,CP_TEST_PORT:'4185'},stdio:'inherit'});
process.on('exit',()=>server.kill());
for(let i=0;i<50;i++){try{await fetch('http://127.0.0.1:4185');break;}catch{await new Promise(resolve=>setTimeout(resolve,100));}}
const destination=process.argv[2]??'test-results/ui-audit';
await mkdir(destination,{recursive:true});
const browser=await chromium.launch();
const findings=[];
for(const theme of ['light','dark'])for(const width of [320,375,390,430,768,1024,1440]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:4185');
  await page.waitForSelector('.hero-card');
  const c=fullCollections();
  c.profiles[0].displayName='Alex Synthetic Professional';
  c.profiles[0].headline='Engineering and technical delivery across multidisciplinary synthetic programs';
  c.profiles[0].email='synthetic.professional.with.long.contact.address@example.test';
  c.profiles[0].summary='Synthetic professional summary. '.repeat(18);
  c.achievements[0].title='Delivered a synthetic technical recovery with cross-functional coordination and a documented outcome';
  c.achievements[0].contribution='Synthetic contribution and supporting context. '.repeat(25);
  await page.evaluate(async({c,theme})=>{
    const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme},await database.getGeneration());localStorage.setItem('careerproof-theme',theme);
  },{c,theme});await page.reload();await page.waitForSelector('.hero-card');
  async function capture(state){
    await page.screenshot({path:destination+'/'+width+'-'+theme+'-'+state+'.png',fullPage:!await page.locator('.modal').count()});
    findings.push(await page.evaluate(({width,theme,state})=>{
      const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
      const outside=[...document.querySelectorAll('main *, .modal *, .topbar *, .sidebar *')].filter(visible).filter(el=>{const r=el.getBoundingClientRect();return r.left<-1||r.right>innerWidth+1;}).slice(0,15).map(el=>el.className||el.id||el.tagName);
      const undersized=[...document.querySelectorAll('button,input,select')].filter(visible).filter(el=>{const r=el.getBoundingClientRect();return r.height<44||r.width<44;}).map(el=>({name:el.getAttribute('aria-label')??el.textContent.trim().slice(0,40),width:Math.round(el.getBoundingClientRect().width),height:Math.round(el.getBoundingClientRect().height)}));
      return {width,theme,state,overflow:document.documentElement.scrollWidth-innerWidth,outside,undersized};
    },{width,theme,state}));
  }
  const action=async selector=>{const inside=page.locator('.modal').locator(selector).filter({visible:true}),target=(await inside.count())?inside:page.locator(selector).filter({visible:true});if(await target.count()){await target.first().click();return;}const to=selector.match(/data-screen="(.*?)"/)?.[1];if(!to)throw new Error('Missing control: '+selector);findings.push({width,theme,state:'navigation-unavailable',destination:to,overflow:0,outside:[],undersized:[]});await page.evaluate(to=>location.hash='/'+to,to);await page.waitForFunction(to=>to==='home'?Boolean(document.querySelector('.hero-card')):document.querySelector('h1')?.textContent===({vault:'Achievement Vault',profile:'Career Profile'}[to]),to);};
  const close=async()=>{await action('[data-action="close"]');await page.waitForSelector('.modal',{state:'detached'});};
  await capture('home');
  await action('[data-screen="vault"]');await capture('vault');
  await page.locator('#vault-search').fill('no-synthetic-match');await capture('no-results');await page.locator('#vault-search').fill('');
  await action('[data-action="detail"]');await capture('detail');await action('[data-action="edit-achievement"]');await capture('edit');await close();
  await action('[data-screen="profile"]');await capture('profile');await action('[data-action="edit-profile"]');await capture('profile-edit');await close();
  await action('[data-action="capture"]');await capture('capture');await page.locator('#outcome').scrollIntoViewIfNeeded();await capture('capture-bottom');await action('[data-action="save-achievement"][data-status="recorded"]');await capture('validation');await close();
  await action('[data-action="settings"]');await capture('settings');
  const download=page.waitForEvent('download');await action('[data-action="export"]');await download;await page.waitForSelector('#toast.visible');await capture('export-notice');
  await page.locator('#restore-file').setInputFiles({name:'Synthetic_Invalid.json',mimeType:'application/json',buffer:Buffer.from('{"bad":true}')});await page.waitForFunction(()=>document.getElementById('toast')?.textContent.includes('Cannot restore'));await capture('import-error');
  await page.locator('#restore-file').setInputFiles({name:'Synthetic_Backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(generateBackup(c)))});
  await capture('restore');await action('[data-action="settings"]');
  await page.locator('#restore-file').setInputFiles({name:'Synthetic_Legacy.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacyBackup()))});
  await capture('legacy-restore');await close();
  await page.evaluate(async({empty,theme})=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(empty,{theme},await database.getGeneration());},{empty:collections(),theme});
  await page.reload();await page.waitForSelector('.profile-card');await action('[data-screen="home"]');await capture('empty-home');await action('[data-screen="vault"]');await capture('empty-vault');await action('[data-screen="profile"]');await capture('empty-profile');await context.close();
}
await browser.close();await writeFile(destination+'/findings.json',JSON.stringify(findings,null,2));
server.kill();
console.log(JSON.stringify({screenshots:findings.filter(f=>f.state!=='navigation-unavailable').length,navigationGaps:findings.filter(f=>f.state==='navigation-unavailable').length,overflowingStates:findings.filter(f=>f.overflow>1).length,clippedStates:findings.filter(f=>f.outside.length).length,undersizedStates:findings.filter(f=>f.undersized.length).length},null,2));
