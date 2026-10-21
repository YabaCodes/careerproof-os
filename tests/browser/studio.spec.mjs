import {test,expect} from '@playwright/test';
import {studioCollections} from '../fixtures.mjs';
import {openSettings} from './ux-helpers.mjs';

// CP-STU (DEC-040): Studio journeys on synthetic records. Physical iPhone acceptance remains separate.
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
async function seed(page,c=studioCollections(),theme='light'){
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async({c,theme})=>{
    const {database}=await import('/app/data/db.js');
    await database.replaceAllData(c,{theme},await database.getGeneration());
    localStorage.setItem('careerproof-theme',theme);
  },{c,theme});
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
}
const read=page=>page.evaluate(async()=>{const {database}=await import('/app/data/db.js');return (await database.readSnapshot()).collections;});
const careerOnly=c=>Object.fromEntries(Object.entries(c).filter(([k])=>k!=='careerDocuments'&&k!=='documentSources'));
const noOverflow=async page=>expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
async function newReview(page){
  await page.locator('.mobile-nav [data-screen=studio]').click();
  await page.locator('[data-action=studio-new][data-type=review]').click();
  await expect(page.getByRole('dialog',{name:'New Performance Review'})).toBeVisible();
}
async function pdfHeader(download){
  const stream=await download.createReadStream();const chunks=[];for await(const chunk of stream)chunks.push(chunk);
  return Buffer.concat(chunks).toString('latin1');
}

test('STU-B1 Studio replaces Profile in the tab bar; the initials open Profile, which holds Settings',async({page})=>{
  await seed(page);
  await expect(page.locator('.mobile-nav > button')).toHaveText(['Home','Vault','Experience','Skills','Studio']);
  await expect(page.locator('.header-profile')).toHaveText('SE');
  await expect(page.locator('.header-profile')).toHaveAttribute('aria-label','Profile and settings');
  const box=await page.locator('.header-profile').boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
  await page.locator('.mobile-nav [data-screen=studio]').click();
  await expect(page.locator('#main-content h1')).toHaveText('Studio');
  await expect(page.locator('.studio-card')).toHaveCount(2);
  await expect(page.locator('.studio-empty')).toContainText('No documents yet');
  await page.locator('.header-profile').click();
  await expect(page.locator('#main-content h1')).toHaveText('Career Profile');
  await page.locator('.profile-settings').click();
  await expect(page.getByRole('dialog',{name:'Settings & Data'})).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Database schema 4');
  await page.locator('.close-dialog').click();
  await page.setViewportSize({width:1280,height:900});
  await expect(page.locator('.side-links .nav-item')).toHaveText(['Home','Vault','Experience','Skills','Studio','Profile']);
  await expect(page.locator('.header-profile')).toBeHidden();
  await expect(page.locator('.sidebar-settings')).toBeVisible();
});

test('STU-B2 a review is scoped, chosen, drafted, edited, alerted on a source change and exported as PDF',async({page})=>{
  await seed(page);const before=await read(page);
  await newReview(page);
  await expect(page.locator('[data-action=review-preset][data-preset=last-6]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#review-info')).toContainText('2 recorded achievements');
  await expect(page.locator('#review-confidential-hint')).toHaveText('Off: 1 confidential achievement is left out.');
  const title=await page.locator('#review-title').inputValue();expect(title).toMatch(/^Performance Review · /);
  await page.locator('[data-action=review-preset][data-preset=last-12]').click();
  await expect(page.locator('[data-action=review-preset][data-preset=last-12]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#review-title')).not.toHaveValue(title);
  await page.locator('[data-action=wizard-next]').click();
  await expect(page.locator('#studio-wizard')).toHaveAttribute('data-step','2');
  await expect(page.locator('#wizard-step-title')).toBeFocused();
  await expect(page.locator('input[name=achievement]')).toHaveCount(2);
  await expect(page.getByText('Hidden win')).toHaveCount(0);
  await page.locator('input[name=achievement][value=ach-b]').uncheck();
  await expect(page.locator('#review-chosen')).toHaveText('1 of 2');
  await noOverflow(page);
  await page.locator('[data-action=wizard-finish]').click();
  await expect(page.locator('.document-page h1')).toContainText('Performance Review');
  await expect(page).toHaveURL(/#\/studio\//);
  let docs=(await read(page)).careerDocuments;
  expect(docs).toHaveLength(1);
  expect(docs[0].contentBlocks.filter(b=>b.section==='achievements').map(b=>b.heading)).toEqual(['Cut changeover time']);
  expect(JSON.stringify(docs[0])).not.toContain('Secret');
  expect(careerOnly(await read(page))).toEqual(careerOnly(before));
  // Edit the summary: it becomes the user's text, records unchanged.
  await page.locator('.doc-section').first().locator('.doc-block-edit').click();
  await expect(page.getByRole('dialog',{name:'Edit Text'})).toBeVisible();
  await page.locator('#block-text').fill('My own summary of the period.');
  await page.locator('[data-action=save-block]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.doc-block').first()).toContainText('My own summary of the period.');
  await expect(page.locator('.doc-block').first().locator('.doc-tag')).toHaveText('Edited by you');
  // A later change to the achievement is reported, never written in.
  await page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');const s=await database.readSnapshot();
    const a=s.collections.achievements.find(x=>x.id==='ach-a');await database.saveRecord('achievements',{...a,outcome:'Changeover down from 42 to 29 minutes.'});
  });
  await page.reload();
  await expect(page.locator('.document-banner').first()).toContainText('1 part of this document no longer matches its source');
  const flagged=page.locator('.doc-block.needs-review');
  await expect(flagged).toContainText('42 to 31 minutes');await expect(flagged.locator('.block-alert')).toContainText('42 to 29 minutes');
  await flagged.locator('[data-action=block-use-updated]').click();
  await expect(page.locator('.doc-block.needs-review')).toHaveCount(0);
  await expect(page.locator('.document-banner')).toHaveCount(0);
  await expect(page.locator('.doc-section').nth(1)).toContainText('42 to 29 minutes');
  docs=(await read(page)).careerDocuments;
  expect(docs[0].contentBlocks.find(b=>b.section==='summary').text).toBe('My own summary of the period.');
  const source=(await read(page)).documentSources.find(s=>s.sourceId==='ach-a');
  expect(source.sourceRevision).toBe((await read(page)).achievements.find(a=>a.id==='ach-a').revision);
  // Export: a real PDF download, nothing uploaded.
  const download=page.waitForEvent('download');
  await page.locator('.document-topbar [data-action=export-pdf]').click();
  const file=await download;
  expect(file.suggestedFilename()).toMatch(/^CareerProof_Performance_Review_.+\.pdf$/);
  const pdf=await pdfHeader(file);expect(pdf.startsWith('%PDF-1.4')).toBe(true);expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
  await expect(page.locator('#toast')).toContainText('PDF generated');
  // Preview and the list row.
  await page.locator('[data-action=preview-document]').click();
  await expect(page.getByRole('dialog',{name:'Preview'})).toContainText('My own summary of the period.');
  await page.locator('.close-dialog').click();
  await page.locator('[data-action=close-document]').click();
  await expect(page.locator('.studio-doc')).toHaveCount(1);
  await expect(page.locator('.studio-attention')).toHaveCount(0);
});

test('STU-B3 a CV is built from chosen work, reordered, versioned and deleted without touching records',async({page})=>{
  await seed(page);const before=await read(page);
  await page.locator('.mobile-nav [data-screen=studio]').click();
  await page.locator('[data-action=studio-new][data-type=cv]').click();
  await expect(page.locator('#cv-title')).toHaveValue('CV — Synthetic Engineer');
  await page.locator('input[name=templateId][value=cv-technical]').check();
  await expect(page.locator('.studio-template.is-selected')).toContainText('Technical Specialist');
  await page.locator('#cv-title').fill('CV — Synthetic Lead');
  // Enter in the only text field moves on; it never submits (reloads) the page.
  await page.locator('#cv-title').press('Enter');
  await expect(page.locator('#studio-wizard')).toHaveAttribute('data-step','2');
  await expect(page.locator('input[name=role]')).toHaveCount(2);
  await expect(page.getByText('Hidden win')).toHaveCount(0);
  await page.locator('#cv-confidential').check();
  await expect(page.getByText('Hidden win')).toBeVisible();
  await expect(page.locator('#cv-confidential')).toBeFocused();
  await page.locator('#cv-confidential').uncheck();
  await expect(page.locator('input[name=achievement][value=ach-d]')).toBeChecked();
  await page.locator('input[name=includeEducation]').uncheck();
  await noOverflow(page);
  await page.locator('[data-action=wizard-next]').click();
  await expect(page.locator('input[name=contact][value=phone]')).not.toBeChecked();
  await expect(page.locator('input[name=contact][value=email]')).toBeChecked();
  await page.locator('[data-action=wizard-finish]').click();
  await expect(page.locator('.document-page h1')).toHaveText('CV — Synthetic Lead');
  let c=await read(page);const cv=c.careerDocuments[0];
  expect(cv.templateId).toBe('cv-technical');
  expect(cv.sections.find(s=>s.key==='education').visible).toBe(false);
  expect(JSON.stringify(cv)).not.toContain('555 0100');
  await expect(page.locator('.doc-section h2')).toHaveText(['Contact','Summary','Core Skills','Technologies','Selected Projects','Employment','Credentials']);
  // Reorder and show: Core Skills moves below Technologies; Education is shown again.
  await page.locator('.document-order summary').click();
  await page.locator('[data-action=move-section][data-section=skills][data-delta="1"]').click();
  await expect(page.locator('.doc-section h2')).toHaveText(['Contact','Summary','Technologies','Core Skills','Selected Projects','Employment','Credentials']);
  await page.locator('[data-action=toggle-section][data-section=education]').check();
  await expect(page.locator('.doc-section h2')).toContainText(['Education']);
  await expect(page.locator('.document-order')).toHaveAttribute('open','');
  for(const b of await page.locator('.section-move').all()){const r=await b.boundingBox();expect(r.width).toBeGreaterThanOrEqual(44);expect(r.height).toBeGreaterThanOrEqual(44);}
  // Add text of my own.
  await page.locator('[data-action=add-block][data-section=projects]').click();
  await page.locator('#block-heading').fill('Volunteer Workshop');await page.locator('#block-date').fill('2019');await page.locator('#block-text').fill('- Taught a weekend class');
  await page.locator('[data-action=save-block]').click();
  await expect(page.locator('.doc-block',{hasText:'Volunteer Workshop'}).locator('.doc-tag')).toContainText(['Edited by you','Your text']);
  // Details: rename and switch the look.
  await page.locator('[data-action=document-settings]').click();
  await page.locator('input[name=templateId][value=cv-professional]').check();
  await page.locator('#document-title').press('Enter');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.document-meta')).toContainText('Professional Standard');
  // New version, then delete the original.
  await page.locator('[data-action=duplicate-document]').click();
  await expect(page.locator('.document-page h1')).toHaveText('CV — Synthetic Lead (2)');
  c=await read(page);expect(c.careerDocuments).toHaveLength(2);
  const copy=c.careerDocuments.find(d=>d.title.endsWith('(2)')),original=c.careerDocuments.find(d=>d.id===cv.id);
  expect(copy.contentBlocks).toEqual(original.contentBlocks);expect(copy.sections).toEqual(original.sections);
  await page.locator('[data-action=close-document]').click();
  await page.locator('.studio-doc',{hasText:'CV — Synthetic Lead'}).filter({hasNotText:'(2)'}).click();
  page.once('dialog',d=>d.accept());
  await page.locator('[data-action=delete-document]').click();
  await expect(page.locator('#main-content h1')).toHaveText('Studio');
  await expect(page.locator('.studio-doc')).toHaveCount(1);
  c=await read(page);
  expect(c.documentSources.every(s=>s.documentId===copy.id)).toBe(true);
  expect(careerOnly(c)).toEqual(careerOnly(before));
  // Export the remaining CV.
  await page.locator('.studio-doc').click();
  const download=page.waitForEvent('download');await page.locator('.document-topbar [data-action=export-pdf]').click();
  expect((await pdfHeader(await download)).startsWith('%PDF-1.4')).toBe(true);
});

test('STU-B4 deleting a source keeps the document text; the user removes or keeps it',async({page})=>{
  await seed(page);
  await newReview(page);
  await page.locator('[data-action=wizard-next]').click();
  await page.locator('[data-action=wizard-finish]').click();
  await expect(page.locator('.document-page')).toBeVisible();
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await page.locator('#vault-results .achievement-row',{hasText:'Onboarded two engineers'}).click();
  await page.locator('details.story-more summary').click();
  let message='';page.once('dialog',d=>{message=d.message();void d.accept();});
  await page.locator('[data-action=delete-achievement]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(message).toContain('used in 1 Studio document');
  await page.locator('.mobile-nav [data-screen=studio]').click();
  await expect(page.locator('.studio-attention')).toHaveText('2 parts to review');
  await page.locator('.studio-doc').click();
  const gone=page.locator('.doc-block.needs-review',{hasText:'Onboarded two engineers'});
  await expect(gone.locator('.block-alert')).toContainText('was deleted');
  await gone.locator('[data-action=block-keep]').click();
  const kept=page.locator('.doc-block',{hasText:'Onboarded two engineers'});
  await expect(kept.locator('.block-alert')).toHaveCount(0);
  await expect(kept.locator('.doc-tag')).toContainText(['Edited by you','Your text']);
  // The summary still counted the deleted achievement: the user can take the new count.
  const summary=page.locator('.doc-block.needs-review').first();
  await expect(summary).toContainText('2 achievements');
  await summary.locator('[data-action=block-use-updated]').click();
  await expect(page.locator('.doc-section').first()).toContainText('1 achievement');
  await expect(page.locator('.document-banner')).toHaveCount(0);
});

test('STU-B5 backups carry Studio documents; older format-3 restores warn before removing them',async({page})=>{
  await seed(page);
  await newReview(page);await page.locator('[data-action=wizard-next]').click();await page.locator('[data-action=wizard-finish]').click();
  await expect(page.locator('.document-page')).toBeVisible();
  const backup=await page.evaluate(async()=>{const {createBackup}=await import('/app/data/backup.js');return JSON.parse((await createBackup()).json);});
  expect(backup.manifest.formatVersion).toBe(4);expect(backup.manifest.counts.careerDocuments).toBe(1);
  const older=structuredClone(backup);older.manifest.formatVersion=3;older.manifest.schemaVersion=3;
  for(const s of ['careerDocuments','documentSources']){delete older.collections[s];delete older.manifest.counts[s];}
  await page.locator('[data-action=close-document]').click();
  await openSettings(page);
  await page.locator('#restore-file').setInputFiles({name:'Synthetic_format3.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(older))});
  await expect(page.getByRole('dialog',{name:'Restore Career Data'})).toContainText('Older format-3 backup:');
  await expect(page.getByRole('dialog')).toContainText('Studio documents');
  await page.locator('[data-action=settings]').last().click();
  expect((await read(page)).careerDocuments).toHaveLength(1);
});

for(const theme of ['light','dark']){
  test(`STU-B6 Studio screens fit 320px without sideways scrolling (${theme})`,async({page})=>{
    await page.setViewportSize({width:320,height:700});await seed(page,studioCollections(),theme);
    await page.locator('.mobile-nav [data-screen=studio]').click();await noOverflow(page);
    await page.locator('[data-action=studio-new][data-type=cv]').click();await noOverflow(page);
    for(const step of [2,3]){await page.locator('[data-action=wizard-next]').click();await expect(page.locator('#studio-wizard')).toHaveAttribute('data-step',String(step));await noOverflow(page);}
    await page.locator('[data-action=wizard-finish]').click();
    await page.locator('.document-order summary').click();await noOverflow(page);
    for(const el of await page.locator('.document-page button:visible').all()){const r=await el.boundingBox();expect(r.x+r.width).toBeLessThanOrEqual(320);}
    await page.locator('[data-action=preview-document]').click();await noOverflow(page);
  });
}
