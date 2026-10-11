import {test,expect} from '@playwright/test';
import {legacyBackup,fullCollections} from '../fixtures.mjs';
import {generateBackup} from '../../dist/app/domain/validation.js';
async function start(page){await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();await expect(page.getByRole('heading',{name:'CareerProof',exact:true})).toBeVisible();}
async function settings(page){await page.locator('.header-settings').click();await expect(page.getByRole('dialog')).toBeVisible();}
async function capture(page,title='Synthetic mobile entry'){
  await page.locator('.mobile-create').click();await page.locator('#title').fill(title);await page.locator('#contribution').fill('Synthetic mobile contribution');await page.locator('#occurredOn').fill('2024-02-29');
}
async function importFile(page,backup){
  await settings(page);
  await page.locator('#restore-file').setInputFiles({name:'Synthetic_Backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
}
async function rawCollections(page){
  return page.evaluate(async()=>{const {database}=await import('/app/data/db.js');return (await database.readSnapshot()).collections;});
}
test('mobile capture/edit/archive/profile preserve the accepted dialog behavior and data across reload',async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await start(page);await capture(page);
  for(const id of ['title','contribution','occurredOn','impactCategory','outcome']){await page.locator('#'+id).click();await expect(page.getByRole('dialog')).toBeVisible();}
  await page.locator('#impactCategory').selectOption('delivery');
  await page.locator('[data-action="save-achievement"][data-status="recorded"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();await expect(page.getByRole('button').filter({hasText:'Synthetic mobile entry'}).first()).toBeVisible();
  await page.locator('[data-action="detail"]').first().click();await page.locator('[data-action="edit-achievement"]').click();await page.locator('#title').fill('Edited synthetic entry');await page.locator('[data-action="save-achievement"][data-status="recorded"]').click();
  await page.locator('[data-action="detail"]').first().click();await page.locator('[data-action="toggle-archive"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  let c=await rawCollections(page);expect(c.achievements[0].status).toBe('archived');expect(c.achievements[0].preArchiveStatus).toBe('recorded');
  await page.locator('.mobile-nav [data-screen="vault"]').click();await page.locator('#status-filter').selectOption('archived');await page.locator('[data-action="detail"]').first().click();await page.locator('[data-action="toggle-archive"]').click();
  await page.locator('.mobile-nav [data-screen="profile"]').click();await page.locator('[data-action="edit-profile"]').last().click();await page.locator('#displayName').fill('Synthetic Mobile Engineer');await page.locator('[data-action="save-profile"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.reload();await expect(page.getByText('Synthetic Mobile Engineer').first()).toBeVisible();c=await rawCollections(page);
  expect(c.achievements[0].occurredStart).toEqual({value:'2024-02-29',precision:'day'});expect(c.achievements[0].status).toBe('recorded');expect(c.achievements[0]).not.toHaveProperty('occurredOn');expect(errors).toEqual([]);
});
test('schema-1 browser data migrates losslessly and blank draft dates remain blank in the editor',async({page})=>{
  await page.goto('/__fixture__');
  const legacy=legacyBackup();
  await page.evaluate(async backup=>{
    const r=indexedDB.open('careerproof-local',1);
    r.onupgradeneeded=()=>{for(const store of ['profiles','achievements'])r.result.createObjectStore(store,{keyPath:'id'});r.result.createObjectStore('meta',{keyPath:'key'});};
    const db=await new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    const tx=db.transaction(['profiles','achievements'],'readwrite');
    for(const p of backup.collections.profiles)tx.objectStore('profiles').put(p);for(const a of backup.collections.achievements)tx.objectStore('achievements').put(a);
    await new Promise((resolve,reject)=>{tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error);});db.close();
  },legacy);
  await start(page);const c=await rawCollections(page);
  for(const old of legacy.collections.achievements){const a=c.achievements.find(x=>x.id===old.id);expect(a.revision).toBe(old.revision);expect(a.createdAt).toBe(old.createdAt);expect(a.updatedAt).toBe(old.updatedAt);expect(a.occurredStart).toEqual(old.occurredOn?{value:old.occurredOn,precision:'day'}:null);expect(a.confidentiality).toBe('confidential');}
  await page.locator('.mobile-nav [data-screen="vault"]').click();await page.locator('#status-filter').selectOption('draft');
  await page.locator('[data-action="detail"]').first().click();await page.locator('[data-action="edit-achievement"]').click();await expect(page.locator('#occurredOn')).toHaveValue('');
  await page.locator('[data-action="save-achievement"][data-status="draft"]').click();expect((await rawCollections(page)).achievements.find(a=>a.status==='draft').occurredStart).toBeNull();
});
test('Settings export imports cleanly, legacy warning is explicit, and invalid files preserve data',async({page})=>{
  await start(page);await capture(page);await page.locator('[data-action="save-achievement"][data-status="recorded"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await settings(page);await page.locator('[data-action=set-theme][data-value=dark]').click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await expect(page.locator('[data-action=set-theme][data-value=dark]')).toHaveAttribute('aria-checked','true');
  const downloadPromise=page.waitForEvent('download');await page.locator('#export-backup').click();const download=await downloadPromise;
  const chunks=[];for await(const c of await download.createReadStream())chunks.push(c);const backup=JSON.parse(Buffer.concat(chunks).toString());
  expect(backup.manifest.formatVersion).toBe(2);expect(backup.collections.competencies).toHaveLength(32);expect(backup.preferences.theme).toBe('dark');
  const before=await rawCollections(page);
  const malformed=structuredClone(backup);malformed.collections.achievements[0].status=['recorded'];
  await page.locator('#restore-file').setInputFiles({name:'Synthetic_Invalid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(malformed))});
  await expect(page.locator('#toast')).toContainText('Cannot restore');expect(await rawCollections(page)).toEqual(before);await expect(page.getByRole('dialog',{name:'Settings & data'})).toBeVisible();
  await page.locator('#restore-file').setInputFiles({name:'Synthetic_Valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await expect(page.getByText('This replaces your current data')).toBeVisible();await page.locator('[data-action="confirm-restore"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);expect(await rawCollections(page)).toEqual(before);
  await importFile(page,legacyBackup());await expect(page.getByText('Legacy format-1 backup:')).toBeVisible();await expect(page.getByRole('dialog')).toContainText('custom competencies and links currently stored here will be removed');
  await page.locator('[data-action="confirm-restore"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);expect((await rawCollections(page)).achievements).toHaveLength(3);await expect(page.locator('html')).toHaveAttribute('data-theme','system');
});
test('partial imported achievement dates remain usable in the existing year/month editor',async({page})=>{
  await start(page);
  const c=fullCollections();c.achievements[0].occurredStart={value:'2024',precision:'year'};
  await importFile(page,generateBackup(c));await page.locator('[data-action="confirm-restore"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('[data-action="detail"]').first().click();await page.locator('[data-action="edit-achievement"]').click();
  await expect(page.locator('#occurredOn')).toHaveAttribute('type','text');await expect(page.locator('#occurredOn')).toHaveValue('2024');await page.locator('#title').fill('Edited partial-date synthetic entry');
  await page.locator('[data-action="save-achievement"][data-status="recorded"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  const out=await rawCollections(page);expect(out.achievements[0].occurredStart).toEqual({value:'2024',precision:'year'});expect(out.achievements[0].actions).toBe(c.achievements[0].actions);
  c.achievements[0].occurredStart={value:'2024-06',precision:'month'};
  await importFile(page,generateBackup(c));await page.locator('[data-action="confirm-restore"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('[data-action="detail"]').first().click();await page.locator('[data-action="edit-achievement"]').click();await expect(page.locator('#occurredOn')).toHaveAttribute('type','month');await expect(page.locator('#occurredOn')).toHaveValue('2024-06');
});
test('a second browser tab cannot overwrite a restored record even when its revision still matches',async({page,context})=>{
  await start(page);await capture(page,'Synthetic shared entry');await page.locator('[data-action="save-achievement"][data-status="recorded"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  const second=await context.newPage();await start(second);
  await second.locator('[data-action="detail"]').first().click();await second.locator('[data-action="edit-achievement"]').click();await second.locator('#title').fill('Stale synthetic overwrite');
  const backup=await page.evaluate(async()=>{const {createBackup}=await import('/app/data/backup.js');return JSON.parse((await createBackup()).json);});
  await importFile(page,backup);await page.locator('[data-action="confirm-restore"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await second.locator('[data-action="save-achievement"][data-status="recorded"]').click();await expect(second.locator('#form-error')).toContainText('Reload this tab');expect((await rawCollections(page)).achievements[0].title).toBe('Synthetic shared entry');
  await second.reload();await expect(second.getByText('Synthetic shared entry').first()).toBeVisible();
});
test('mobile navigation has five equal positions at 320/375px and direct backdrop respects dirty forms',async({page})=>{
  await start(page);
  for(const width of [320,375]){
    await page.setViewportSize({width,height:812});
    const boxes=await page.locator('.mobile-nav > button').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x+r.width/2,width:r.width,y:r.y+r.height/2};}));
    expect(boxes).toHaveLength(5);for(let i=1;i<boxes.length;i++){expect(Math.abs((boxes[i].x-boxes[i-1].x)-(boxes[1].x-boxes[0].x))).toBeLessThan(1);expect(boxes[i].y).toBe(boxes[0].y);}
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await capture(page);page.once('dialog',d=>d.dismiss());await page.keyboard.press('Escape');await expect(page.locator('#title')).toHaveValue('Synthetic mobile entry');
  page.once('dialog',d=>d.accept());await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  await settings(page);await page.locator('.modal-backdrop').click({position:{x:2,y:2}});await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.setViewportSize({width:1280,height:900});await page.locator('.side-links [data-screen="profile"]').click();await expect(page.getByRole('heading',{name:'Career Profile'})).toBeVisible();
});
test('cached PWA opens offline with stored records and all foundation modules',async({page,context})=>{
  await start(page);await capture(page,'Synthetic offline entry');await page.locator('[data-action="save-achievement"][data-status="recorded"]').click();await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));});
  const keys=await page.evaluate(()=>caches.keys());expect(keys).toContain('careerproof-v0.1.2-alpha.7');
  await context.setOffline(true);await page.reload();await expect(page.getByText('Synthetic offline entry').first()).toBeVisible();await settings(page);await expect(page.getByRole('dialog')).toContainText('Database schema 2');
  const cachedAssets=await page.evaluate(async()=>{
    const files=['icon.svg','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','favicon-32.png','favicon-16.png','app/ui/dialog.js'];
    return Promise.all(files.map(async file=>({file,ok:(await fetch('./'+file)).ok})));
  });
  expect(cachedAssets.every(asset=>asset.ok)).toBe(true);
  await expect(page.getByRole('dialog')).toContainText('0.1.2-alpha.7');
  await page.locator('[data-action=close]').click();
  expect(await page.locator('.mobile-nav').evaluate(el=>el.getBoundingClientRect().height)).toBe(61);
  await page.locator('[data-action=detail]').first().click();await page.locator('[data-action=edit-achievement]').click();
  await expect(page.locator('#occurredOn')).toHaveValue('2024-02-29');
  expect(await page.locator('#occurredOn').evaluate(el=>getComputedStyle(el).appearance)).toBe('none');
  await context.setOffline(false);
});
test('worker activation replaces the previous cache and retains local records offline',async({page,context})=>{
  await page.goto('/__fixture__');
  const seeded=fullCollections();
  await page.evaluate(async c=>{
    const {database}=await import('/app/data/db.js');
    await database.initialize();
    await database.replaceAllData(c,{theme:'light'},await database.getGeneration());
  },seeded);
  const before=await rawCollections(page);
  await page.evaluate(async()=>{
    await navigator.serviceWorker.register('/__legacy_sw__',{scope:'/'});
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  });
  expect(await page.evaluate(()=>caches.keys())).toContain('careerproof-v0.1.1-alpha.2');
  await start(page);
  await page.evaluate(async()=>{
    if(!navigator.serviceWorker.controller?.scriptURL.endsWith('/sw.js'))await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  });
  const cachesNow=await page.evaluate(()=>caches.keys());
  expect(cachesNow).toContain('careerproof-v0.1.2-alpha.7');await expect.poll(()=>page.evaluate(()=>caches.keys())).not.toContain('careerproof-v0.1.1-alpha.2');
  expect(await rawCollections(page)).toEqual(before);
  await context.setOffline(true);await page.reload();await expect(page.getByText('Resolved synthetic issue').first()).toBeVisible();expect(await rawCollections(page)).toEqual(before);await context.setOffline(false);
});
