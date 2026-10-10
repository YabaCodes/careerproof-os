import {test,expect} from '@playwright/test';
import {fullCollections} from '../fixtures.mjs';

test.use({isMobile:true,hasTouch:true});
async function start(page,seed=true){
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  if(seed){
    await page.evaluate(async c=>{
      const {database}=await import('/app/data/db.js');
      await database.replaceAllData(c,{theme:'dark'},await database.getGeneration());
    },fullCollections());
    await page.reload();
    await expect(page.locator('.hero-card')).toBeVisible();
  }
}
async function snapshot(page){
  return page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');
    return database.readSnapshot();
  });
}
async function settings(page){
  await page.locator('.header-settings').click();
  await expect(page.getByRole('dialog',{name:'Settings & data'})).toBeVisible();
}
async function selectBackup(page,backup){
  await page.locator('#restore-file').setInputFiles({
    name:'SYNTHETIC_CP011E_Backup.json',
    mimeType:'application/json',
    buffer:Buffer.from(JSON.stringify(backup))
  });
  await expect(page.getByRole('dialog',{name:'Restore career data'})).toBeVisible();
}
const sorted=c=>Object.fromEntries(Object.entries(c).map(([name,rows])=>[
  name,[...rows].sort((a,b)=>a.id.localeCompare(b.id))
]));
test('CP-E201 user can verify all current career data without writing, exporting or replacing anything',async({page})=>{
  await start(page);
  const before=await snapshot(page);
  await settings(page);
  const button=page.locator('[data-action=check-integrity]');
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.locator('#integrity-check-result')).toContainText('Check passed.');
  await expect(page.locator('#integrity-check-result')).toContainText('Backup format 2 and schema 2');
  await expect(page.locator('#integrity-check-result')).toContainText('nothing was restored or uploaded');
  await expect(button).toBeEnabled();
  expect(await snapshot(page)).toEqual(before);
  await button.click();
  await expect(page.locator('#integrity-check-result')).toContainText('Check passed.');
  expect(await snapshot(page)).toEqual(before);
});
test('CP-E202 restore preview rejects intervening ordinary edits and succeeds only after explicit re-selection',async({page})=>{
  await start(page);
  const initial=await snapshot(page);
  const backup=await page.evaluate(async()=>{
    const {createBackup}=await import('/app/data/backup.js');
    return JSON.parse((await createBackup()).json);
  });
  await settings(page);
  await selectBackup(page,backup);
  await expect(page.getByText('This replaces your current data')).toBeVisible();
  // Ordinary edits after file selection MUST invalidate the destructive preview.
  await page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');
    const c=(await database.readSnapshot()).collections;
    await database.saveRecord('employers',{...c.employers[0],description:'Synthetic edit after restore preview'});
  });
  const edited=await snapshot(page);
  expect(edited.revision).toBeGreaterThan(initial.revision);
  await page.locator('[data-action=confirm-restore]').click();
  await expect(page.locator('#toast')).toContainText('changed since you selected the backup');
  await expect(page.getByRole('dialog',{name:'Restore career data'})).toBeVisible();
  expect(await snapshot(page)).toEqual(edited);
  await page.locator('[data-action=settings]').last().click();
  await selectBackup(page,backup);
  await page.locator('[data-action=confirm-restore]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const restored=await snapshot(page);
  expect(sorted(restored.collections)).toEqual(sorted(initial.collections));
  expect(restored.preferences).toEqual(initial.preferences);
  expect(restored.generation).toBe(initial.generation+1);
});
test('CP-E203 cross-module navigation, complete backup and restoration preserve every rich record and link',async({page})=>{
  await start(page);
  const original=await snapshot(page);
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await expect(page.getByText('Synthetic Company').first()).toBeVisible();
  await page.locator('.mobile-nav [data-screen=portfolio]').click();
  await expect(page.locator('details.portfolio-card')).toHaveCount(1);
  await page.locator('details.portfolio-card summary').click();
  await expect(page.locator('[data-action=portfolio-achievement]')).toContainText('Resolved synthetic issue');
  await page.locator('[data-action=portfolio-achievement]').click();
  await expect(page.getByRole('dialog')).toContainText('Synthetic reduction');
  await expect(page.getByRole('dialog')).toContainText('SYNTHETIC-001');
  await page.locator('.close-dialog').click();
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await page.locator('.mobile-nav [data-screen=competencies]').click();
  await page.locator('#competency-search').fill('Synthetic Skill');
  await expect(page.locator('details.skill-entry')).toHaveCount(1);
  await page.locator('details.skill-entry summary').click();
  await expect(page.locator('[data-action=competency-achievement]')).toContainText('Resolved synthetic issue');
  await settings(page);
  await page.locator('[data-action=check-integrity]').click();
  await expect(page.locator('#integrity-check-result')).toContainText('Check passed.');
  const downloadReady=page.waitForEvent('download');
  await page.locator('#export-backup').click();
  const download=await downloadReady,parts=[];
  for await(const chunk of await download.createReadStream())parts.push(chunk);
  const backup=JSON.parse(Buffer.concat(parts).toString('utf8'));
  expect(backup.manifest.formatVersion).toBe(2);
  expect(backup.manifest.counts.recordLinks).toBe(3);
  expect(backup.manifest.counts.impactMetrics).toBe(1);
  expect(backup.manifest.counts.evidenceReferences).toBe(1);
  expect(backup.collections.achievements[0].situation).toBe('Synthetic situation');
  expect(backup.collections.achievements[0].confidentiality).toBe('confidential');

  // Deliberately mutate the synthetic fixture, then restore the exported file.
  await page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');
    const c=(await database.readSnapshot()).collections;
    await database.saveRecord('education',{...c.education[0],description:'Unrelated synthetic mutation'});
  });
  await selectBackup(page,backup);
  await expect(page.getByRole('dialog')).toContainText('Relationships');
  await page.locator('[data-action=confirm-restore]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const restored=await snapshot(page);
  expect(sorted(restored.collections)).toEqual(sorted(original.collections));
  expect(restored.preferences).toEqual(original.preferences);
});
test('CP-E204 installed offline shell supports Profile, Portfolio, Vault and Competency Library with existing evidence',async({page,context})=>{
  await start(page);
  await page.evaluate(async()=>{
    await navigator.serviceWorker.ready;
    if(!navigator.serviceWorker.controller)
      await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
  });
  expect(await page.evaluate(()=>caches.keys())).toContain('careerproof-v0.1.2-alpha.5');
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('.hero-card')).toBeVisible();
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await expect(page.getByText('Synthetic Company').first()).toBeVisible();
  await page.locator('.mobile-nav [data-screen=portfolio]').click();
  await expect(page.locator('details.portfolio-card')).toHaveCount(1);
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await page.locator('.mobile-nav [data-screen=competencies]').click();
  await page.locator('[data-action=skill-scope][data-scope=all]').click();
  await expect(page.locator('details.skill-entry')).toHaveCount(33);
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await expect(page.locator('.achievement-row')).toHaveCount(1);
  await page.locator('[data-action=detail]').first().click();
  await expect(page.getByRole('dialog')).toContainText('SYNTHETIC-001');
  await page.locator('.close-dialog').click();
  await settings(page);
  await page.locator('[data-action=check-integrity]').click();
  await expect(page.locator('#integrity-check-result')).toContainText('Check passed.');
  expect((await snapshot(page)).collections.recordLinks).toHaveLength(3);
  await context.setOffline(false);
});
