import {test,expect} from '@playwright/test';

test.use({isMobile:true,hasTouch:true});
async function openProfile(page){
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await expect(page.getByRole('heading',{name:'Career Profile'})).toBeVisible();
}
async function add(page,kind){
  await page.locator('[data-action=add-career][data-kind='+kind+']').first().click();
  await expect(page.locator('#career-form')).toBeVisible();
}
async function save(page){
  await page.locator('[data-action=save-career]').click();
  await expect(page.locator('#career-form')).toHaveCount(0);
}
async function snapshot(page){
  return page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');
    return (await database.readSnapshot()).collections;
  });
}
async function createEmployer(page,name='Sample Engineering Ltd'){
  await add(page,'employers');
  await page.locator('#career-name').fill(name);
  await page.locator('#career-industry').fill('Manufacturing');
  await save(page);
}
async function createRole(page,title,start='2023'){
  await add(page,'roles');
  await page.locator('#career-title').fill(title);
  await page.locator('#career-startDate-precision').selectOption('year');
  await page.locator('#career-startDate').fill(start);
  await page.locator('#career-isCurrent').check();
  await save(page);
}

test('employers group multiple overlapping roles; primary role stays consistent',async({page})=>{
  await openProfile(page);
  await createEmployer(page);
  await expect(page.getByRole('heading',{name:'Sample Engineering Ltd'})).toBeVisible();
  await createRole(page,'Engineer', '2022');
  await createRole(page,'Team Lead', '2024');
  const before=await snapshot(page);
  expect(before.employers).toHaveLength(1);
  expect(before.roles).toHaveLength(2);
  expect(before.roles.every(r=>r.employerId===before.employers[0].id&&r.isCurrent&&r.endDate===null)).toBe(true);
  await page.locator('[data-action="edit-career"][data-kind="roles"][data-id="'+before.roles[1].id+'"]').click();
  await page.locator('#career-isPrimary').check();
  await save(page);
  const after=await snapshot(page);
  expect(after.profiles[0].primaryRoleId).toBe(before.roles[1].id);
  expect(after.roles.find(r=>r.id===before.roles[1].id).revision).toBe(2);
  await page.reload();
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await expect(page.locator('.career-primary')).toHaveCount(1);
  await expect(page.getByRole('heading',{name:'Team Lead'})).toBeVisible();
  // CP-012B: a referenced employer is never silently deleted. Its roles need an employer
  // and there is no other employer to move them to, so nothing can be confirmed.
  await page.locator('[data-action=delete-career][data-kind=employers]').click();
  await expect(page.getByRole('dialog')).toContainText('Linked to this employer');
  await expect(page.getByRole('dialog')).toContainText('2 roles');
  await expect(page.locator('#removal-mode-move')).toBeDisabled();
  await expect(page.locator('#removal-mode-unlink')).toBeDisabled();
  await expect(page.locator('[data-action=confirm-removal]')).toBeDisabled();
  await page.locator('.close-dialog').click();
  expect((await snapshot(page)).employers).toHaveLength(1);
  // The primary role shows its dependents and needs an explicit choice plus confirmation.
  await page.locator('[data-action="delete-career"][data-kind="roles"][data-id="'+before.roles[1].id+'"]').click();
  await expect(page.getByRole('dialog')).toContainText('Your primary role');
  await expect(page.locator('#removal-mode-move')).toBeChecked(); // another role at the same employer exists
  await page.locator('#removal-mode-unlink').check();
  await expect(page.getByRole('dialog')).toContainText('Your primary role will be cleared.');
  await expect(page.locator('[data-action=confirm-removal]')).toBeDisabled();
  await page.locator('#removal-confirm').check();
  await page.locator('[data-action=confirm-removal]').click();
  await expect(page.locator('#toast')).toContainText('Role deleted.');
  await expect.poll(async()=>(await snapshot(page)).roles.length).toBe(1);
  expect((await snapshot(page)).profiles[0].primaryRoleId).toBeNull();
  expect((await snapshot(page)).employers).toHaveLength(1);
});

test('year/month/day precision, optional dates and validation errors',async({page})=>{
  await openProfile(page);
  await createEmployer(page,'Precision Research');
  await add(page,'roles');
  await page.locator('#career-title').fill('Senior Engineer');
  await page.locator('#career-startDate-precision').selectOption('year');
  await page.locator('#career-startDate').fill('2025');
  await page.locator('#career-endDate-precision').selectOption('month');
  await page.locator('#career-endDate').fill('2024-12');
  await page.locator('[data-action=save-career]').click();
  await expect(page.locator('#form-error')).toContainText('cannot be before');
  await page.locator('#career-isCurrent').check();
  await save(page);
  const record=(await snapshot(page)).roles[0];
  expect(record.startDate).toEqual({value:'2025',precision:'year'});
  expect(record.endDate).toBeNull();
  await page.locator('[data-action=edit-career][data-kind=roles]').first().click();
  expect(await page.locator('#career-startDate').inputValue()).toBe('2025');
  await page.locator('#career-startDate-precision').selectOption('month');
  await page.locator('#career-startDate').fill('2025-06');
  await save(page);
  expect((await snapshot(page)).roles[0].startDate).toEqual({value:'2025-06',precision:'month'});
  await page.reload();
  await page.locator('.mobile-nav [data-screen=profile]').click();
  expect(await page.locator('.career-role').count()).toBe(1);
});

test('education and credentials support editing, no expiry and URL safety',async({page})=>{
  await openProfile(page);
  await add(page,'education');
  await page.locator('#career-institution').fill('Example University');
  await page.locator('#career-qualification').fill('Master of Engineering');
  await page.locator('#career-startDate-precision').selectOption('year');
  await page.locator('#career-startDate').fill('2019');
  await page.locator('#career-completionDate-precision').selectOption('month');
  await page.locator('#career-completionDate').fill('2021-06');
  await save(page);
  await add(page,'credentials');
  await page.locator('#career-name').fill('Example Professional Certification');
  await page.locator('#career-issuer').fill('Example Institute');
  await page.locator('#career-issuedDate-precision').selectOption('day');
  await page.locator('#career-issuedDate').fill('2024-03-12');
  await page.locator('#career-verificationUrl').fill('javascript:alert(1)');
  await page.locator('[data-action=save-career]').click();
  await expect(page.locator('#form-error')).toContainText('valid http');
  await page.locator('#career-verificationUrl').fill('https://example.com/verify');
  await save(page);
  const before=await snapshot(page);
  expect(before.education[0].startDate).toEqual({value:'2019',precision:'year'});
  expect(before.education[0].completionDate).toEqual({value:'2021-06',precision:'month'});
  expect(before.credentials[0].issuedDate).toEqual({value:'2024-03-12',precision:'day'});
  expect(before.credentials[0].expirationDate).toBeNull();
  await page.locator('[data-action=edit-career][data-kind=credentials]').first().click();
  await page.locator('#career-notes').fill('Lifetime credential with user-provided reference');
  await save(page);
  expect((await snapshot(page)).credentials[0].revision).toBe(2);
  await page.reload();
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await expect(page.getByRole('heading',{name:'Master of Engineering'})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Example Professional Certification'})).toBeVisible();
});

test('P0 career collections round-trip through backup and leave achievements intact',async({page})=>{
  await openProfile(page);
  await createEmployer(page);
  await createRole(page,'Engineering Lead');
  await add(page,'education');
  await page.locator('#career-institution').fill('Test University');
  await page.locator('#career-qualification').fill('Bachelor of Science');
  await save(page);
  const result=await page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');
    const {createBackup,parseBackupJson,restoreBackup}=await import('/app/data/backup.js');
    const before=await database.readSnapshot();
    const backup=await createBackup();
    const prepared=await parseBackupJson(backup.json);
    await restoreBackup(prepared);
    const after=await database.readSnapshot();
    const shape=c=>JSON.stringify(Object.fromEntries(Object.entries(c).map(([key,records])=>[key,[...records].sort((a,b)=>a.id.localeCompare(b.id))])));
    return {format:prepared.backup.manifest.formatVersion,employers:after.collections.employers.length,
      roles:after.collections.roles.length,education:after.collections.education.length,
      equal:shape(before.collections)===shape(after.collections),competencies:after.collections.competencies.length};
  });
  expect(result).toMatchObject({format:2,employers:1,roles:1,education:1,equal:true,competencies:32});
});

test('career forms stay contained on mobile and preserve unsaved edits',async({page})=>{
  await page.setViewportSize({width:320,height:670});await openProfile(page);
  await add(page,'education');
  await page.locator('#career-institution').fill('Unsaved University');
  const geometry=await page.locator('#career-form').evaluate(el=>({scrollWidth:el.scrollWidth,width:el.clientWidth}));
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.width);
  page.once('dialog',d=>d.dismiss());
  await page.locator('.modal .close-dialog').click();
  await expect(page.locator('#career-institution')).toHaveValue('Unsaved University');
  page.once('dialog',d=>d.accept());
  await page.locator('.modal .close-dialog').click();
  await expect(page.locator('#career-form')).toHaveCount(0);
});
