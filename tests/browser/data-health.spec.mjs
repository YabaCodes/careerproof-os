import {test,expect} from '@playwright/test';
import {fullCollections,base} from '../fixtures.mjs';
test.use({isMobile:true,hasTouch:true});
async function seeded(page){
  const c=fullCollections();
  c.achievements.push({...base('gap-1'),title:'Synthetic gap achievement',contribution:'Synthetic contribution',occurredStart:{value:'2025-01',precision:'month'},occurredEnd:null,status:'recorded',preArchiveStatus:null,outcome:'',impactCategory:'delivery',roleId:null,situation:'',actions:'',confidentiality:'confidential',notes:''});
  c.projects.push({...c.projects[0],id:'idle-project',name:'Idle synthetic experience'});
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async c=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme:'light'},await database.getGeneration());},c);
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
}
const state=page=>page.evaluate(async()=>{const {database}=await import('/app/data/db.js');const s=await database.readSnapshot();return {s,exported:await database.getMeta('lastExportAt'),changed:await database.getMeta('lastChangeAt')};});

for(const width of [320,390]){
  test(`CP-012A Settings data health lists suggestions, opens records and changes nothing (${width}px)`,async({page})=>{
    await page.setViewportSize({width,height:780});
    await seeded(page);
    const before=await state(page);
    await page.locator('.header-settings').click();
    await page.locator('[data-action=check-integrity]').click();
    await expect(page.locator('#integrity-check-result')).toContainText('Check passed.');
    const report=page.locator('#data-health-report');
    await expect(report.locator('.health-headline')).toContainText('No critical problems.');
    await expect(report.locator('.health-issue')).toHaveCount(7);
    // Headless Chromium reports non-persistent storage, which is shown as advice, not a failure.
    await expect(report.locator('[data-code=storage-not-persistent]')).toHaveCount(1);
    await expect(report.locator('[data-code=export-never]')).toContainText('No backup exported from this device');
    for(const code of ['achievement-no-outcome','achievement-no-support','achievement-no-skill','achievement-no-context','experience-no-achievements'])
      await expect(report.locator(`[data-code=${code}]`)).toHaveCount(1);
    await expect(report).toContainText('not about your ability');
    // Layout: no horizontal overflow; every control inside the report is a full tap target.
    await report.locator('[data-code=achievement-no-outcome] summary').click();
    await report.locator('[data-code=experience-no-achievements] summary').click();
    expect(await page.locator('.modal-body').evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(1);
    for(const box of await report.locator('summary, button').evaluateAll(els=>els.filter(e=>e.getClientRects().length).map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height,l:r.left,r:r.right};}))){
      expect(box.h).toBeGreaterThanOrEqual(44);expect(box.l).toBeGreaterThanOrEqual(0);expect(box.r).toBeLessThanOrEqual(width+1);
    }
    // Reading the report changed nothing.
    expect(await state(page)).toEqual(before);
    // A suggestion opens the exact record behind it.
    await report.locator('[data-code=achievement-no-outcome] [data-action=health-open][data-id=gap-1]').click();
    await expect(page.getByRole('dialog')).toContainText('Synthetic gap achievement');
    await page.locator('.close-dialog').click();
    await page.locator('.header-settings').click();
    await page.locator('[data-action=check-integrity]').click();
    await page.locator('[data-code=experience-no-achievements] summary').click();
    await page.locator('[data-action=health-open][data-kind=project][data-id=idle-project]').click();
    await expect(page.locator('#portfolio-name')).toHaveValue('Idle synthetic experience');
    await page.locator('.close-dialog').click();
    expect(await state(page)).toEqual(before);
  });
}
test('CP-012A exporting clears the backup suggestion on the next check',async({page})=>{
  await seeded(page);
  await page.locator('.header-settings').click();
  await page.locator('[data-action=check-integrity]').click();
  await expect(page.locator('[data-code=export-never]')).toHaveCount(1);
  const download=page.waitForEvent('download');await page.locator('#export-backup').click();await download;
  await page.locator('[data-action=check-integrity]').click();
  await expect(page.locator('#data-health-report .health-headline')).toContainText('No critical problems.');
  await expect(page.locator('[data-code=export-never]')).toHaveCount(0);
  await expect(page.locator('[data-code=changes-since-export]')).toHaveCount(0);
});
