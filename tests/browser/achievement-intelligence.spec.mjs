import {test,expect} from '@playwright/test';
import {fullCollections} from '../fixtures.mjs';

test.use({isMobile:true,hasTouch:true});

async function start(page,seeded=true){
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  if(seeded){
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
    return (await database.readSnapshot()).collections;
  });
}
async function openEdit(page){
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await page.locator('[data-action=detail][data-id=achievement-1]').click();
  await page.locator('[data-action=edit-achievement]').click();
  await expect(page.locator('#achievement-form')).toBeVisible();
  await page.locator('#rich-detail-panel summary').click();
}
async function save(page){
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('#achievement-form')).toHaveCount(0);
}
test('rich achievement edits preserve existing role, precision, IDs, links, metrics and evidence',async({page})=>{
  await start(page);await openEdit(page);
  await expect(page.locator('#rich-roleId')).toHaveValue('role-1');
  await expect(page.locator('#rich-confidentiality')).toHaveValue('confidential');
  await expect(page.locator('.metric-row')).toHaveCount(1);
  await expect(page.locator('.evidence-row')).toHaveCount(1);
  await expect(page.locator('input[name=projectId][value=project-1]')).toBeChecked();
  await expect(page.locator('input[name=competencyId][value=custom-competency]')).toBeChecked();
  await expect(page.locator('#rich-primaryProjectId')).toHaveValue('project-1');
  await page.locator('#rich-situation').fill('A synthetic challenge during preproduction');
  await page.locator('#rich-actions').fill('Prepared a hypothetical engineering study');
  await page.locator('.metric-row [name=resultValue]').fill('4');
  await save(page);
  const c=await snapshot(page);
  expect(c.achievements[0]).toMatchObject({id:'achievement-1',revision:4,roleId:'role-1',situation:'A synthetic challenge during preproduction',actions:'Prepared a hypothetical engineering study'});
  expect(c.impactMetrics[0]).toMatchObject({id:'metric-1',revision:4,baselineValue:12,resultValue:4});
  expect(c.evidenceReferences[0]).toMatchObject({id:'evidence-1',revision:4,referenceValue:'SYNTHETIC-001'});
  expect(c.recordLinks).toHaveLength(3);
  expect(c.recordLinks.find(x=>x.id==='link-2').isPrimary).toBe(true);
  await page.reload();
  await openEdit(page);
  await expect(page.locator('#rich-situation')).toHaveValue('A synthetic challenge during preproduction');
});

test('adding metrics and references persists after reload and restores from private backup',async({page})=>{
  await start(page);await openEdit(page);
  await page.locator('[data-action=add-rich-metric]').click();
  const added=page.locator('.metric-row').last();
  await added.locator('[name=metricName]').fill('First pass yield');
  await added.locator('[name=unit]').fill('%');
  await added.locator('[name=baselineValue]').fill('86');
  await added.locator('[name=resultValue]').fill('93');
  await added.locator('[name=sourceNote]').fill('Synthetic test protocol');
  await page.locator('[data-action=add-rich-evidence]').click();
  const ev=page.locator('.evidence-row').last();
  await ev.locator('[name=label]').fill('Synthetic report');
  await ev.locator('[name=referenceType]').selectOption('url');
  await ev.locator('[name=referenceValue]').fill('https://example.test/validation');
  await save(page);
  let c=await snapshot(page);
  expect(c.impactMetrics).toHaveLength(2);
  expect(c.evidenceReferences).toHaveLength(2);
  expect(c.impactMetrics.find(x=>x.metricName==='First pass yield').resultValue).toBe(93);
  const check=await page.evaluate(async()=>{
    const {createBackup,parseBackupJson}=await import('/app/data/backup.js');
    const file=await createBackup(),backup=await parseBackupJson(file.json);
    return {format:backup.backup.manifest.formatVersion,metrics:backup.backup.manifest.counts.impactMetrics,
      references:backup.backup.manifest.counts.evidenceReferences,competencyLinks:backup.backup.collections.recordLinks.filter(l=>l.linkType==='achievement-competency').length};
  });
  expect(check).toEqual({format:2,metrics:2,references:2,competencyLinks:1});
  await page.reload();await openEdit(page);
  await expect(page.locator('.metric-row')).toHaveCount(2);
  await expect(page.locator('.evidence-row')).toHaveCount(2);
  await page.locator('.metric-row').last().locator('[data-action=remove-rich-row]').click();
  await page.locator('.evidence-row').last().locator('[data-action=remove-rich-row]').click();
  await save(page);
  c=await snapshot(page);
  expect(c.impactMetrics).toHaveLength(1);
  expect(c.evidenceReferences).toHaveLength(1);
  expect(c.impactMetrics[0].id).toBe('metric-1');
});

test('invalid evidence URL and metric are rejected without any data write',async({page})=>{
  await start(page);const initial=await snapshot(page);await openEdit(page);
  await page.locator('[data-action=add-rich-evidence]').click();
  const row=page.locator('.evidence-row').last();
  await row.locator('[name=referenceType]').selectOption('url');
  await row.locator('[name=label]').fill('Invalid URL');
  await row.locator('[name=referenceValue]').fill('javascript:alert(1)');
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('#form-error')).toContainText('valid http');
  expect(await snapshot(page)).toEqual(initial);
  await row.locator('[name=referenceValue]').fill('https://example.test/safe');
  await page.locator('[data-action=add-rich-metric]').click();
  await page.locator('.metric-row').last().locator('[name=metricName]').fill('Missing values');
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('#form-error')).toContainText('numeric value');
  expect(await snapshot(page)).toEqual(initial);
});

test('competency library displays 32 built-in skills plus custom skills and linked examples',async({page})=>{
  await start(page);
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await page.locator('[data-screen=competencies][data-action=nav]').filter({hasText:'Open Competency Library'}).click();
  await expect(page.getByRole('heading',{name:'Competency Library'})).toBeVisible();
  await expect(page.locator('details.skill-entry')).toHaveCount(33);
  await page.locator('#competency-search').fill('Synthetic Skill');
  await expect(page.locator('details.skill-entry')).toHaveCount(1);
  await page.locator('details.skill-entry summary').click();
  await expect(page.locator('[data-action=competency-achievement]')).toContainText('Resolved synthetic issue');
  await page.locator('[data-action=competency-achievement]').click();
  await expect(page.getByRole('dialog')).toContainText('Resolved synthetic issue');
  await page.locator('.close-dialog').click();
  await page.locator('[data-action=add-competency]').click();
  await page.locator('#skill-name').fill('Industrialization Strategy');
  await page.locator('#skill-category').selectOption('custom-category');
  await page.locator('#skill-description').fill('Methods to scale manufacturing safely');
  await page.locator('[data-action=save-competency]').click();
  const c=await snapshot(page);
  expect(c.competencies.find(x=>x.name==='Industrialization Strategy')).toMatchObject({isBuiltIn:false,status:'active'});
  await expect(page.locator('details.skill-entry')).toHaveCount(1); // current search retained
  await page.locator('#competency-search').fill('Industrialization');
  await expect(page.locator('details.skill-entry')).toHaveCount(1);
  await page.locator('details.skill-entry summary').click();
  page.once('dialog',d=>d.accept());
  await page.locator('[data-action=archive-competency]').click();
  await expect(page.locator('details.skill-entry')).toHaveCount(0);
  expect((await snapshot(page)).competencies.find(x=>x.name==='Industrialization Strategy').status).toBe('archived');
});

test('Vault filters support role, project, competency and date without changing source records',async({page})=>{
  await start(page);
  const before=await snapshot(page);
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await expect(page.locator('.achievement-row')).toHaveCount(1);
  await page.locator('#role-filter').selectOption('role-1');
  await page.locator('#project-filter').selectOption('project-1');
  await page.locator('#competency-filter').selectOption('custom-competency');
  await expect(page.locator('.achievement-row')).toHaveCount(1);
  await page.locator('#date-start-filter').fill('2025-01-01');
  await expect(page.locator('.achievement-row')).toHaveCount(0);
  await page.locator('#date-start-filter').fill('2024-01-01');
  await expect(page.locator('.achievement-row')).toHaveCount(1);
  await page.locator('#role-filter').selectOption('');
  await page.locator('#project-filter').selectOption('');
  await page.locator('#competency-filter').selectOption('');
  await expect(await snapshot(page)).toEqual(before);
});

test('save transaction rejects invalid skill reference without modifying any collection',async({page})=>{
  await start(page);
  const result=await page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');
    const before=await database.readSnapshot(),a=before.collections.achievements[0];
    let error='';
    try{await database.saveAchievementBundle({...a},['project-1'],null,['missing-id'],[],[]);}
    catch(e){error=e.message;}
    const after=await database.readSnapshot();
    return {error,unchanged:JSON.stringify(before.collections)===JSON.stringify(after.collections)};
  });
  expect(result.error).toMatch(/competency/i);
  expect(result.unchanged).toBe(true);
});

test('archived competency remains linked to historical achievement through edit/save',async({page})=>{
  await start(page);
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await page.locator('[data-screen=competencies][data-action=nav]').filter({hasText:'Open Competency Library'}).click();
  await page.locator('#competency-search').fill('Synthetic Skill');
  await page.locator('details.skill-entry summary').click();
  page.once('dialog',d=>d.accept());
  await page.locator('[data-action=archive-competency]').click();
  const previous=(await snapshot(page)).recordLinks;
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await page.locator('[data-action=detail][data-id=achievement-1]').click();
  await page.locator('[data-action=edit-achievement]').click();
  await page.locator('#rich-detail-panel summary').click();
  await expect(page.locator('input[name=competencyId][value=custom-competency]')).toBeChecked();
  await expect(page.locator('.rich-check')).toContainText('archived historical link');
  await save(page);
  expect((await snapshot(page)).recordLinks).toEqual(previous);
});
