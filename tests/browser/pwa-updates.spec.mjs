import {test,expect} from '@playwright/test';

async function start(page){
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
}
async function controlled(page){
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
}

test('Settings provides a safe manual update check without altering saved data',async({page})=>{
  await start(page);
  await page.locator('.header-settings').click();
  await expect(page.getByRole('dialog')).toContainText('0.1.2-alpha.5');
  await expect(page.locator('#pwa-update-status')).toContainText('Checks automatically each time you open CareerProof');
  await page.locator('[data-action=check-updates]').click();
  await expect(page.locator('#pwa-update-status')).toContainText(/latest version available|downloading|Update ready|Checks automatically/);
  await expect(page.locator('.modal')).toBeVisible();
  await expect(page.locator('[data-action=confirm-restore]')).toHaveCount(0);
});

test('CP-012.1 every foreground checks for updates; simultaneous events are merged',async({page})=>{
  await page.addInitScript(()=>{
    const original=ServiceWorkerRegistration.prototype.update;window.__calls=0;window.__done=0;
    ServiceWorkerRegistration.prototype.update=function(){window.__calls++;return original.call(this).finally(()=>{window.__done++;});};
  });
  await start(page);await controlled(page);
  const settled=async()=>{await expect.poll(()=>page.evaluate(()=>window.__calls>0&&window.__calls===window.__done)).toBe(true);await page.waitForTimeout(50);};
  await settled();
  const base=await page.evaluate(()=>window.__calls);
  // Two foregrounds well inside the old 5-minute throttle window both check.
  for(let i=1;i<=2;i++){
    await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
    await expect.poll(()=>page.evaluate(()=>window.__calls)).toBe(base+i);
    await settled();
  }
  // visibilitychange + pageshow + online arriving together cause one network check.
  await page.evaluate(()=>{document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new Event('pageshow'));window.dispatchEvent(new Event('online'));});
  await settled();
  expect(await page.evaluate(()=>window.__calls)).toBe(base+3);
});

test('CP-012.1 a newly deployed version offers Back up first and a user-controlled restart',async({page})=>{
  await start(page);await controlled(page);
  const before=await page.evaluate(async()=>{const {database}=await import('/app/data/db.js');return (await database.readSnapshot()).collections;});
  await page.request.get('/__sw_variant__?v=next');
  try{
    await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
    const notice=page.locator('#pwa-update-notice');
    await expect(notice).toBeVisible({timeout:20000});
    await expect(notice).toContainText('New version ready');
    await expect(page.locator('#pwa-update-version')).toContainText('version 0.1.2-alpha.5');
    const backup=notice.locator('[data-action=export]'),restart=notice.locator('[data-action=reload-update]');
    for(const width of [320,375,430]){
      await page.setViewportSize({width,height:780});
      const [n,nav,b,r]=await Promise.all([notice,page.locator('.mobile-nav'),backup,restart].map(l=>l.boundingBox()));
      expect(n.y+n.height).toBeLessThanOrEqual(nav.y+1);
      for(const box of [b,r]){expect(box.height).toBeGreaterThanOrEqual(44);expect(box.x).toBeGreaterThanOrEqual(n.x-1);expect(box.x+box.width).toBeLessThanOrEqual(n.x+n.width+1);}
      expect(b.y+b.height<=r.y+1||r.y+r.height<=b.y+1||b.x+b.width<=r.x+1||r.x+r.width<=b.x+1).toBe(true);
    }
    // The update never reloads by itself: backing up first keeps the banner.
    const download=page.waitForEvent('download');await backup.click();await download;
    await expect(notice).toBeVisible();
    await restart.click();
    await expect(page.locator('.hero-card')).toBeVisible();
    await expect(page.locator('#pwa-update-notice')).toHaveCount(0);
    const after=await page.evaluate(async()=>{const {database}=await import('/app/data/db.js');return (await database.readSnapshot()).collections;});
    expect(after).toEqual(before);
  }finally{await page.request.get('/__sw_variant__?v=');}
});
