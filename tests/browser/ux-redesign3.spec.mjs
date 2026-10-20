import {test,expect} from '@playwright/test';
import {fullCollections,base} from '../fixtures.mjs';

// CP-UX3 Step 3: synthetic-only mobile flows. Physical iPhone acceptance remains separate.
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
function world(){
  const c=fullCollections();
  c.projects[0]={...c.projects[0],status:'active',confidentiality:'standard-private',objective:'Existing objective stays'};
  c.achievements.push({...c.achievements[0],...base('plan-1'),title:'Supplier readiness planned',contribution:'',
    outcome:'',occurredStart:null,occurredEnd:null,status:'draft',preArchiveStatus:null,confidentiality:'standard-private'});
  c.recordLinks.push({...base('plan-link'),linkType:'achievement-project',sourceId:'plan-1',targetId:'project-1',isPrimary:true,note:''});
  return c;
}
async function seed(page,c=world()){
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async c=>{
    const {database}=await import('/app/data/db.js');
    await database.replaceAllData(c,{theme:'light'},await database.getGeneration());
  },c);
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
}
const read=page=>page.evaluate(async()=>{
  const {database}=await import('/app/data/db.js');return await database.readSnapshot();
});
async function openDraft(page){
  await page.locator('.mobile-nav-item[data-screen=vault]').click();
  await page.locator('[data-action=vault-status][data-status=draft]').click();
  await page.locator('#vault-results .achievement-row',{hasText:'Supplier readiness planned'}).click();
  await expect(page.locator('[data-action=draft-to-expected]')).toBeVisible();
  await page.locator('[data-action=draft-to-expected]').click();
}
test('UX301-S3: compact Home, both record drilldowns, all five destinations and global capture',async({page})=>{
  await page.setViewportSize({width:320,height:700});await seed(page);
  await expect(page.locator('.compact-metric strong')).toHaveText(['1','1','1','1']);
  await expect(page.locator('.compact-metric span')).toHaveText(['Recorded','Draft','Experiences','Skills Shown']);
  await expect(page.locator('.compact-export')).toContainText('export generated on this device');
  await expect(page.locator('.home-record-disclosure')).toHaveCount(2);
  await page.locator('.home-record-disclosure').first().locator('summary').click();
  await expect(page.locator('.home-gaps')).toBeVisible();
  await page.locator('.home-record-disclosure').last().locator('summary').click();
  await expect(page.locator('.role-coverage .role-row')).toBeVisible();
  await expect(page.locator('.compact-quick-add button')).toHaveText(['+ Experience','+ Employer','+ Credential']);
  for(const item of ['home','vault','portfolio','competencies','studio']){
    await page.locator('.mobile-nav-item[data-screen='+item+']').click();
    await expect(page.locator('.mobile-nav-item[data-screen='+item+']')).toHaveAttribute('aria-current','page');
  }
  await page.locator('.mobile-create').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.locator('.close-dialog').click();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
test('UX305-S3 / UX306-S3: moving a Draft appends and archives it; Undo restores only what moved',async({page})=>{
  await seed(page);const before=await read(page);
  await openDraft(page);
  await expect(page.getByRole('dialog',{name:'Make It an Expected Result'})).toBeVisible();
  await expect(page.locator('#expected-experience')).toHaveValue('project-1');
  await page.locator('#expected-text').fill('Both suppliers pass readiness audit in Q1.');
  await expect(page.locator('#expected-preview')).toContainText('Existing objective stays');
  await expect(page.locator('#expected-preview')).toContainText('Both suppliers pass readiness audit in Q1.');
  await page.locator('[data-action=save-expected]').click();
  await expect(page.locator('.expected-undo')).toBeVisible();
  await expect(page.locator('.goal-box')).toContainText('Both suppliers pass readiness audit in Q1.');
  let changed=await read(page);
  expect(changed.collections.achievements.find(a=>a.id==='plan-1').status).toBe('archived');
  expect(changed.collections.achievements.find(a=>a.id==='plan-1').preArchiveStatus).toBe('draft');
  expect(changed.collections.projects[0].objective).toBe('Existing objective stays\n\nBoth suppliers pass readiness audit in Q1.');
  expect(changed.collections.recordLinks).toEqual(before.collections.recordLinks);
  await page.locator('[data-action=undo-expected]').click();
  await expect(page.locator('.expected-undo')).toHaveCount(0);
  const undone=await read(page);
  expect(undone.collections.projects[0].objective).toBe(before.collections.projects[0].objective);
  expect(undone.collections.achievements.find(a=>a.id==='plan-1').status).toBe('draft');
  expect(undone.collections.recordLinks).toEqual(before.collections.recordLinks);
});
test('UX308-S3: conversion survives reload and is in the current backup (schema and format 4 since v0.1.4)',async({page})=>{
  await seed(page);await openDraft(page);
  await page.locator('#expected-text').fill('Planned result is not an achievement.');
  await page.locator('[data-action=save-expected]').click();
  await expect(page.locator('.expected-undo')).toBeVisible();
  await page.reload();
  await expect(page.locator('.expected-undo')).toHaveCount(0);
  const s=await read(page);
  expect(s.collections.achievements.find(a=>a.id==='plan-1').status).toBe('archived');
  expect(s.collections.projects[0].objective).toContain('Planned result is not an achievement.');
  const backup=await page.evaluate(async()=>{
    const {createBackup}=await import('/app/data/backup.js');return JSON.parse((await createBackup()).json).manifest;
  });
  expect(backup.schemaVersion).toBe(4);expect(backup.formatVersion).toBe(4);
});
test('UX309-S3: confidential Draft cannot move into standard-private Experience',async({page})=>{
  const c=world();c.achievements.find(a=>a.id==='plan-1').confidentiality='confidential';
  await seed(page,c);const before=await read(page);await openDraft(page);
  await expect(page.locator('#expected-privacy-note')).toContainText('Confidential');
  await page.locator('[data-action=save-expected]').click();
  await expect(page.locator('#form-error')).toContainText('mark the experience Confidential');
  expect((await read(page)).collections).toEqual(before.collections);
});
