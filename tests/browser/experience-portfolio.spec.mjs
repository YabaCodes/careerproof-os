import {test,expect} from '@playwright/test';
test.use({isMobile:true,hasTouch:true});
async function pageStart(page){
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
}
async function portfolio(page){
  await page.locator('.mobile-nav [data-screen=portfolio]').click();
  await expect(page.locator('#main-content h1')).toHaveText('Experience');
}
/** CP-UX1: saving a new experience from the Experience tab opens its page. */
async function onPage(page,name){
  await expect(page.locator('.experience-page h1')).toHaveText(name);
}
async function back(page){
  await page.locator('[data-action=close-experience]').click();
  await expect(page.locator('#main-content h1')).toHaveText('Experience');
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
test('experiences sit on a role-grouped timeline with partial dates, search and their own page',async({page})=>{
  await page.setViewportSize({width:375,height:812});
  await pageStart(page);await portfolio(page);
  await addExperience(page);
  await page.locator('#portfolio-scope').fill('Deliver a synthetic initiative with carefully recorded technical context. '.repeat(8));
  await page.locator('#portfolio-experienceType').selectOption('initiative');
  await page.locator('#portfolio-startDate-precision').selectOption('year');
  await page.locator('#portfolio-startDate').fill('2022');
  await page.locator('#portfolio-endDate-precision').selectOption('month');
  await page.locator('#portfolio-endDate').fill('2026-04');
  await page.locator('#portfolio-technologies').fill('PLC, Validation, PLC');
  await save(page);
  const saved=(await snapshot(page)).projects[0];
  expect(saved).toMatchObject({name:'Synthetic Program A',experienceType:'initiative',
    startDate:{value:'2022',precision:'year'},endDate:{value:'2026-04',precision:'month'},
    confidentiality:'confidential',technologies:['PLC','Validation']});
  // Its page: type and status, dates, context, technologies; no horizontal scroll.
  await onPage(page,'Synthetic Program A');
  expect(new URL(page.url()).hash).toBe('#/portfolio/'+saved.id);
  await expect(page.locator('.experience-head .pill-outline')).toHaveText('Initiative');
  await expect(page.locator('.experience-sub')).toHaveText('2022 – Apr 2026');
  await expect(page.locator('.experience-context')).toContainText('carefully recorded technical context');
  await expect(page.locator('.experience-tech')).toContainText('PLC, Validation');
  await expect(page.locator('.experience-achievements h2')).toHaveText('Achievements · 0');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  // A deep link reopens the same page after a reload.
  await page.reload();await onPage(page,'Synthetic Program A');
  await back(page);
  // No role yet, so it is listed under Independent Experiences with a one-line summary.
  const group=page.locator('details.role-group');
  await expect(group).toHaveCount(1);
  await expect(group.locator('h2')).toHaveText('Independent Experiences');
  await expect(page.locator('.experience-row strong')).toHaveText('Synthetic Program A');
  await expect(page.locator('.experience-row-meta')).toHaveText('Initiative · 2022 – Apr 2026 · No achievements yet');
  await page.locator('#experience-search').fill('no such program');
  await expect(page.locator('.experience-row')).toHaveCount(0);
  await expect(page.locator('.timeline-empty')).toHaveText('No experiences match your search.');
  await page.locator('#experience-search').fill('technical context');
  await expect(page.locator('.experience-row')).toHaveCount(1);
  await expect(page.locator('#experience-search')).toBeFocused();
  await page.reload();
  await expect(page.locator('#main-content h1')).toHaveText('Experience');
  await expect(page.locator('.experience-row')).toHaveCount(1);
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
  await onPage(page,'Synthetic Equipment Initiative');
  await expect(page.locator('.experience-sub')).toContainText('Synthetic Manufacturing Co · Development Engineer');
  await page.locator('.experience-page [data-action=edit-project]').click();
  await page.locator('#portfolio-scope').fill('Synthetic equipment context');
  await save(page);
  // Editing keeps the page open; the timeline lists it under its role.
  await onPage(page,'Synthetic Equipment Initiative');
  await expect(page.locator('.experience-context')).toHaveText('Synthetic equipment context');
  await back(page);
  const roleGroup=page.locator('details.role-group').filter({has:page.locator('h2',{hasText:'Development Engineer'})});
  await expect(roleGroup).toHaveAttribute('open','');
  // The role was saved without an end date or "current", which the header states plainly.
  await expect(roleGroup.locator('.role-group-sub')).toHaveText('Synthetic Manufacturing Co · 2024 – End not recorded · 1 experience');
  await expect(roleGroup.locator('.role-current')).toHaveCount(0);
  await expect(roleGroup.locator('.experience-row')).toContainText('Synthetic Equipment Initiative');
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
  await onPage(page,'Synthetic Process Validation');
  await page.locator('.experience-achievements [data-action=project-capture]').click();
  await expect(page.getByRole('dialog')).toContainText('Capture an Achievement');
  await page.locator('#title').fill('Synthetic validation milestone');
  await page.locator('#contribution').fill('Completed verification with synthetic fixtures');
  await page.locator('[data-action=capture-next]').click(); // CP-UX2: When
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  const records=await snapshot(page);
  expect(records.achievements).toHaveLength(1);
  expect(records.recordLinks.filter(x=>x.linkType==='achievement-project')).toHaveLength(1);
  expect(records.recordLinks.find(x=>x.linkType==='achievement-project')).toMatchObject({
    sourceId:records.achievements[0].id,targetId:records.projects[0].id,isPrimary:true // CP-UX2: the experience it was captured in is primary
  });
  // The experience's page stays open and lists the new achievement with its date.
  await onPage(page,'Synthetic Process Validation');
  await expect(page.locator('.experience-achievements h2')).toHaveText('Achievements · 1');
  const row=page.locator('.story-row');
  await expect(row.locator('strong')).toHaveText('Synthetic validation milestone');
  await expect(row.locator('.story-row-result')).toHaveText('No result stated yet');
  await row.click();
  await expect(page.getByRole('dialog',{name:'Synthetic validation milestone'})).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Synthetic Process Validation');
});
test('linked experiences protect achievements; deletions require confirmation',async({page})=>{
  await pageStart(page);await portfolio(page);
  await addExperience(page,'Linked Synthetic');
  await save(page);
  await onPage(page,'Linked Synthetic');
  await page.locator('.experience-achievements [data-action=project-capture]').click();
  await page.locator('#title').fill('Linked synthetic draft');
  await page.locator('[data-action=save-achievement][data-status=draft]').click();
  await expect(page.locator('.story-row .status-tag')).toHaveText('Draft');
  // CP-012B: a linked experience opens the dependency preview instead of deleting.
  // CP-UX1: Delete lives in the experience editor.
  await page.locator('.experience-page [data-action=edit-project]').click();
  await page.locator('.modal-footer [data-action=remove-project]').click();
  await expect(page.getByRole('dialog')).toContainText('1 achievement');
  await expect(page.locator('#removal-mode-move')).toBeDisabled(); // no other experience exists
  await expect(page.locator('#removal-mode-unlink')).toBeChecked();
  await expect(page.locator('[data-action=confirm-removal]')).toBeDisabled();
  await page.locator('.close-dialog').click();
  expect((await snapshot(page)).projects).toHaveLength(1);
  await back(page);
  await addExperience(page,'Unlinked Synthetic');
  await save(page);
  await onPage(page,'Unlinked Synthetic');
  const unlinked=(await snapshot(page)).projects.find(p=>p.name==='Unlinked Synthetic');
  await page.locator('.experience-page [data-action=edit-project]').click();
  await page.locator('.modal-footer [data-action=remove-project][data-id="'+unlinked.id+'"]').click();
  await expect(page.getByRole('dialog')).toContainText('Nothing else links to it.');
  await page.locator('.modal [data-action=close]').last().click();
  expect((await snapshot(page)).projects).toHaveLength(2);
  await page.locator('.experience-page [data-action=edit-project]').click();
  await page.locator('.modal-footer [data-action=remove-project]').click();
  await page.locator('[data-action=confirm-removal]').click();
  await expect.poll(async()=> (await snapshot(page)).projects.length).toBe(1);
  await expect(page.locator('.experience-page')).toHaveCount(0);
  await expect(page.locator('.experience-row')).toHaveCount(1);
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
  expect(result).toEqual({schema:3,format:3,projectCount:1,same:true});
});
test('CP-012.0 apostrophes followed by digits survive display, edit and unchanged save',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await pageStart(page);await portfolio(page);
  const name="Line '24 upgrade",objective="Cut takt from '12 s baseline; FY'25 scope";
  await addExperience(page,name);
  await page.locator('#portfolio-scope').fill(objective); // CP-012.4: Context (scope) is the experience's own text
  await save(page);
  await onPage(page,name);
  await expect(page.locator('.experience-context')).toHaveText(objective);
  await page.locator('.experience-page [data-action=edit-project]').click();
  await expect(page.locator('#portfolio-name')).toHaveValue(name);
  await expect(page.locator('#portfolio-scope')).toHaveValue(objective);
  await save(page);
  const stored=(await snapshot(page)).projects[0];
  expect([stored.name,stored.scope]).toEqual([name,objective]);
  // Every shared template decodes back to the original text.
  const decoded=await page.evaluate(async samples=>{
    const {escapeHtml}=await import('/app/ui/html.js');
    return samples.map(s=>{const t=document.createElement('template');t.innerHTML=`<p title="${escapeHtml(s)}">${escapeHtml(s)}</p>`;const p=t.content.firstElementChild;return [p.textContent,p.getAttribute('title')];});
  },["'24","'1'2'3",'<b>&"\'</b>']);
  expect(decoded).toEqual([["'24","'24"],["'1'2'3","'1'2'3"],['<b>&"\'</b>','<b>&"\'</b>']]);
});
