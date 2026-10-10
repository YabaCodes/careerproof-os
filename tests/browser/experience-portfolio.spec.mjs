import {test,expect} from '@playwright/test';
test.use({isMobile:true,hasTouch:true});
async function pageStart(page){
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
}
async function portfolio(page){
  await page.locator('.mobile-nav [data-screen=portfolio]').click();
  await expect(page.getByRole('heading',{name:'Experience Portfolio'})).toBeVisible();
}
async function addExperience(page,name='Synthetic Program A'){
  await page.locator('[data-action=add-project]').click();
  await expect(page.locator('#portfolio-form')).toBeVisible();
  await page.locator('#portfolio-name').fill(name);
}
async function save(page){
  await page.locator('[data-action=save-project]').click();
  await expect(page.locator('#portfolio-form')).toHaveCount(0);
}
async function snapshot(page){
  return page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');
    return (await database.readSnapshot()).collections;
  });
}
test('project, initiative and responsibility records use compact cards, partial dates and filters',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await pageStart(page);await portfolio(page);
  await addExperience(page);
  await page.locator('#portfolio-objective').fill('Deliver a synthetic initiative with carefully recorded technical objectives. '.repeat(8));
  await page.locator('#portfolio-experienceType').selectOption('initiative');
  await page.locator('#portfolio-startDate-precision').selectOption('year');
  await page.locator('#portfolio-startDate').fill('2022');
  await page.locator('#portfolio-endDate-precision').selectOption('month');
  await page.locator('#portfolio-endDate').fill('2026-04');
  await page.locator('#portfolio-technologies').fill('PLC, Validation, PLC');
  await save(page);
  await expect(page.locator('details.portfolio-card')).toHaveCount(1);
  const saved=(await snapshot(page)).projects[0];
  expect(saved).toMatchObject({name:'Synthetic Program A',experienceType:'initiative',
    startDate:{value:'2022',precision:'year'},endDate:{value:'2026-04',precision:'month'},
    confidentiality:'confidential',technologies:['PLC','Validation']});
  const card=page.locator('details.portfolio-card');
  await expect(card.locator('.portfolio-preview')).toHaveCSS('-webkit-line-clamp','2');
  await expect(card.locator('.portfolio-expanded')).toBeHidden();
  await card.locator('summary').click();
  await expect(card.locator('.portfolio-expanded')).toBeVisible();
  await expect(card.locator('.portfolio-expanded')).toContainText('Objective');
  await expect(card.locator('.portfolio-expanded')).toContainText('Technologies');
  await card.locator('summary').click();
  await expect(card.locator('.portfolio-expanded')).toBeHidden();
  await page.locator('#portfolio-filter-type').selectOption('project');
  await expect(page.locator('details.portfolio-card')).toHaveCount(0);
  await page.locator('#portfolio-filter-type').selectOption('initiative');
  await expect(page.locator('details.portfolio-card')).toHaveCount(1);
  await page.locator('#portfolio-search').fill('no such program');
  await expect(page.locator('details.portfolio-card')).toHaveCount(0);
  await page.locator('#portfolio-search').fill('Synthetic Program');
  await expect(page.locator('details.portfolio-card')).toHaveCount(1);
  await page.reload();
  await expect(page.getByRole('heading',{name:'Experience Portfolio'})).toBeVisible();
  await expect(page.locator('details.portfolio-card')).toHaveCount(1);
});
test('roles are linked through canonical IDs in one validated atomic transaction',async({page})=>{
  await pageStart(page);
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await page.locator('[data-action=add-career][data-kind=employers]').click();
  await page.locator('#career-name').fill('Synthetic Manufacturing Co');
  await page.locator('[data-action=save-career]').click();
  await page.locator('[data-action=add-career][data-kind=roles]').first().click();
  await page.locator('#career-title').fill('Development Engineer');
  await page.locator('#career-startDate-precision').selectOption('year');
  await page.locator('#career-startDate').fill('2024');
  await page.locator('[data-action=save-career]').click();
  const employer=(await snapshot(page)).employers[0],role=(await snapshot(page)).roles[0];
  await page.locator('.mobile-nav [data-screen=portfolio]').click();
  await addExperience(page,'Synthetic Equipment Initiative');
  await page.locator('#portfolio-employerId').selectOption(employer.id);
  await page.locator('.portfolio-role-option input').check();
  await save(page);
  const initial=await snapshot(page);
  expect(initial.projects).toHaveLength(1);
  expect(initial.recordLinks.filter(x=>x.linkType==='role-project')).toHaveLength(1);
  const link=initial.recordLinks.find(x=>x.linkType==='role-project');
  expect(link).toMatchObject({sourceId:role.id,targetId:initial.projects[0].id,revision:1});
  await page.locator('details.portfolio-card summary').click();
  await expect(page.locator('.portfolio-expanded')).toContainText('Development Engineer');
  await page.locator('[data-action=edit-project]').click();
  await page.locator('#portfolio-outcome').fill('Synthetic outcome reached');
  await save(page);
  const edited=await snapshot(page);
  expect(edited.recordLinks.find(x=>x.linkType==='role-project')).toEqual(link);
  expect(edited.projects[0].revision).toBe(2);
  const testInvalid=await page.evaluate(async({projectId,employerId,roleId})=>{
    const {database}=await import('/app/data/db.js');
    const before=await database.readSnapshot();
    const p=before.collections.projects.find(x=>x.id===projectId);
    let error='';
    try{await database.savePortfolioProject({...p,employerId:crypto.randomUUID()},[roleId]);}
    catch(e){error=e.message;}
    const after=await database.readSnapshot();
    return {error,unchanged:JSON.stringify(before.collections.projects)===JSON.stringify(after.collections.projects)&&
      JSON.stringify(before.collections.recordLinks)===JSON.stringify(after.collections.recordLinks)};
  },{projectId:initial.projects[0].id,employerId:employer.id,roleId:role.id});
  expect(testInvalid.error).toBeTruthy();
  expect(testInvalid.unchanged).toBe(true);
});
test('achievement captured from project is atomically linked and accessible',async({page})=>{
  await pageStart(page);await portfolio(page);
  await addExperience(page,'Synthetic Process Validation');
  await save(page);
  await page.locator('details.portfolio-card summary').click();
  await page.locator('[data-action=project-capture]').click();
  await expect(page.getByRole('dialog')).toContainText('Capture an achievement');
  await page.locator('#title').fill('Synthetic validation milestone');
  await page.locator('#contribution').fill('Completed verification with synthetic fixtures');
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  const records=await snapshot(page);
  expect(records.achievements).toHaveLength(1);
  expect(records.recordLinks.filter(x=>x.linkType==='achievement-project')).toHaveLength(1);
  expect(records.recordLinks.find(x=>x.linkType==='achievement-project')).toMatchObject({
    sourceId:records.achievements[0].id,targetId:records.projects[0].id,isPrimary:false
  });
  // CP-012B: an expanded card stays open after its dialog closes.
  await expect(page.locator('details.portfolio-card')).toHaveAttribute('open','');
  await expect(page.locator('[data-action=portfolio-achievement]')).toContainText('Synthetic validation milestone');
  await page.locator('[data-action=portfolio-achievement]').click();
  await expect(page.getByRole('dialog')).toContainText('Synthetic validation milestone');
});
test('linked experiences protect achievements; deletions require confirmation',async({page})=>{
  await pageStart(page);await portfolio(page);
  await addExperience(page,'Linked Synthetic');
  await save(page);
  await page.locator('details.portfolio-card summary').click();
  await page.locator('[data-action=project-capture]').click();
  await page.locator('#title').fill('Linked synthetic draft');
  await page.locator('[data-action=save-achievement][data-status=draft]').click();
  await expect(page.locator('details.portfolio-card')).toHaveAttribute('open','');
  // CP-012B: a linked experience opens the dependency preview instead of deleting.
  await page.locator('[data-action=remove-project]').click();
  await expect(page.getByRole('dialog')).toContainText('1 achievement');
  await expect(page.locator('#removal-mode-move')).toBeDisabled(); // no other experience exists
  await expect(page.locator('#removal-mode-unlink')).toBeChecked();
  await expect(page.locator('[data-action=confirm-removal]')).toBeDisabled();
  await page.locator('.close-dialog').click();
  expect((await snapshot(page)).projects).toHaveLength(1);
  await addExperience(page,'Unlinked Synthetic');
  await save(page);
  const unlinked=(await snapshot(page)).projects.find(p=>p.name==='Unlinked Synthetic');
  await page.locator('details.portfolio-card[data-project-id="'+unlinked.id+'"] summary').click();
  await page.locator('details.portfolio-card[data-project-id="'+unlinked.id+'"] [data-action=remove-project]').click();
  await expect(page.getByRole('dialog')).toContainText('Nothing else links to it.');
  await page.locator('.modal [data-action=close]').last().click();
  expect((await snapshot(page)).projects).toHaveLength(2);
  await page.locator('details.portfolio-card[data-project-id="'+unlinked.id+'"] [data-action=remove-project]').click();
  await page.locator('[data-action=confirm-removal]').click();
  await expect.poll(async()=> (await snapshot(page)).projects.length).toBe(1);
  expect((await snapshot(page)).achievements).toHaveLength(1);
});
test('project links round-trip through private backup; no schema changes',async({page})=>{
  await pageStart(page);await portfolio(page);
  await addExperience(page,'Backup Synthetic');
  await save(page);
  const result=await page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');
    const {createBackup,parseBackupJson,restoreBackup}=await import('/app/data/backup.js');
    const before=await database.readSnapshot(),file=await createBackup(),p=await parseBackupJson(file.json);
    await restoreBackup(p);
    const after=await database.readSnapshot();
    return {schema:p.backup.manifest.schemaVersion,format:p.backup.manifest.formatVersion,
      projectCount:after.collections.projects.length,same:JSON.stringify(before.collections.projects)===JSON.stringify(after.collections.projects)};
  });
  expect(result).toEqual({schema:2,format:2,projectCount:1,same:true});
});
test('CP-012.0 apostrophes followed by digits survive display, edit and unchanged save',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await pageStart(page);await portfolio(page);
  const name="Line '24 upgrade",objective="Cut takt from '12 s baseline; FY'25 scope";
  await addExperience(page,name);
  await page.locator('#portfolio-objective').fill(objective);
  await save(page);
  const card=page.locator('details.portfolio-card').first();
  await expect(card).toContainText(name);
  await card.locator('summary').click();
  await expect(card).toContainText(objective);
  await card.locator('[data-action=edit-project]').click();
  await expect(page.locator('#portfolio-name')).toHaveValue(name);
  await expect(page.locator('#portfolio-objective')).toHaveValue(objective);
  await save(page);
  const stored=(await snapshot(page)).projects[0];
  expect([stored.name,stored.objective]).toEqual([name,objective]);
  // Every shared template decodes back to the original text.
  const decoded=await page.evaluate(async samples=>{
    const {escapeHtml}=await import('/app/ui/html.js');
    return samples.map(s=>{const t=document.createElement('template');t.innerHTML=`<p title="${escapeHtml(s)}">${escapeHtml(s)}</p>`;const p=t.content.firstElementChild;return [p.textContent,p.getAttribute('title')];});
  },["'24","'1'2'3",'<b>&"\'</b>']);
  expect(decoded).toEqual([["'24","'24"],["'1'2'3","'1'2'3"],['<b>&"\'</b>','<b>&"\'</b>']]);
});
