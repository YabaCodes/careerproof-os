import {test,expect} from '@playwright/test';
import {openSettings} from './ux-helpers.mjs';
import {fullCollections} from '../fixtures.mjs';
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
test('CP-013B user saves repeat assessments, sees dated history, exports them, retains existing career records',async({page})=>{
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async records=>{
    const {database}=await import('/app/data/db.js');
    await database.replaceAllData(records,{theme:'dark'},await database.getGeneration());
  },fullCollections());
  await page.reload();
  await page.locator('.mobile-nav [data-screen=competencies]').click();
  const skill=page.locator('details.skill-entry[data-skill=custom-competency]');
  await skill.locator('summary').click();
  await expect(skill.locator('.skill-self-proficiency')).toContainText('Not assessed');
  await skill.locator('[data-action=assess-competency]').click();
  await expect(page.getByRole('dialog',{name:'Assess Your Proficiency'})).toBeVisible();
  await page.locator('#proficiency-level').selectOption('3');
  await page.locator('#proficiency-date').fill('2026-10-12');
  await page.locator('#proficiency-rationale').fill('Synthetic complex independent work');
  await page.locator('[data-action=save-proficiency]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(skill.locator('.skill-self-proficiency')).toContainText('L3 — Proficient');
  await expect(skill.locator('.skill-evidence-breadth')).toContainText('Evidence breadth: Emerging');
  await skill.locator('[data-action=assess-competency]').click();
  await page.locator('#proficiency-level').selectOption('2');
  await page.locator('#proficiency-date').fill('2026-01-01');
  await page.locator('[data-action=save-proficiency]').click();
  await expect(skill.locator('.skill-self-proficiency')).toContainText('L3 — Proficient');
  await skill.locator('.skill-assessment-history > summary').click();
  await expect(skill.locator('.skill-assessment-entry')).toHaveCount(2);
  await expect(skill.locator('.skill-assessment-entry').first()).toContainText('L3');
  await page.reload();await page.locator('.mobile-nav [data-screen=competencies]').click();
  const again=page.locator('details.skill-entry[data-skill=custom-competency]');
  await again.locator(':scope > summary').click();
  await expect(again.locator('.skill-self-proficiency')).toContainText('L3 — Proficient');
  await openSettings(page);
  await page.locator('[data-action=check-integrity]').click();
  await expect(page.locator('#integrity-check-result')).toContainText('Backup format 4 and schema 4');
  const downloadReady=page.waitForEvent('download');await page.locator('#export-backup').click();
  const download=await downloadReady,chunks=[];
  for await(const chunk of await download.createReadStream())chunks.push(chunk);
  const backup=JSON.parse(Buffer.concat(chunks).toString());
  expect(backup.manifest.formatVersion).toBe(4);
  expect(backup.collections.proficiencyAssessments).toHaveLength(2);
  expect(backup.collections.achievements).toHaveLength(1);
  expect(backup.collections.projects).toHaveLength(1);
});
test('CP-013B invalid form preserves values and old backup warns about history loss before restore',async({page})=>{
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async records=>{
    const {database}=await import('/app/data/db.js');
    await database.replaceAllData(records,{theme:'light'},await database.getGeneration());
  },fullCollections());
  await page.reload();await page.locator('.mobile-nav [data-screen=competencies]').click();
  const skill=page.locator('details.skill-entry[data-skill=custom-competency]');
  await skill.locator('summary').click();await skill.locator('[data-action=assess-competency]').click();
  await page.locator('[data-action=save-proficiency]').click();
  await expect(page.locator('#form-error')).toContainText('Choose a self-assessed proficiency level');
  await page.locator('#proficiency-level').selectOption('4');
  await page.locator('#proficiency-date').fill('2026-10-12');
  await page.locator('[data-action=save-proficiency]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const legacy=await page.evaluate(async()=>{
    const {createBackup}=await import('/app/data/backup.js');
    const file=JSON.parse((await createBackup()).json);
    // Format 2 predates proficiency history and Studio documents.
    for(const store of ['proficiencyAssessments','careerDocuments','documentSources']){delete file.collections[store];delete file.manifest.counts[store];}
    file.manifest.schemaVersion=2;file.manifest.formatVersion=2;return file;
  });
  await openSettings(page);
  await page.locator('#restore-file').setInputFiles({name:'Synthetic_OLDER_format2.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(legacy))});
  await expect(page.getByRole('dialog',{name:'Restore Career Data'})).toContainText('Older format-2 backup:');
  await expect(page.getByRole('dialog')).toContainText('removes any newer self-assessments');
  await expect(page.getByRole('dialog')).toContainText('Proficiency assessments');
  // No destructive restore: close preview and prove saved assessment remains.
  await page.locator('[data-action=settings]').last().click();
  const count=await page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');return (await database.readSnapshot()).collections.proficiencyAssessments.length;
  });
  expect(count).toBe(1);
});
