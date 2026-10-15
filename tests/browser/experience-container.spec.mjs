import {test,expect} from '@playwright/test';
import {fullCollections} from '../fixtures.mjs';

// CP-012.4 (DEC-034): Experience is a container for achievements. Synthetic data only.
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
async function seed(page,c=fullCollections()){
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async c=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme:'light'},await database.getGeneration());},c);
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
}
const snapshot=page=>page.evaluate(async()=>{const {database}=await import('/app/data/db.js');return (await database.readSnapshot()).collections;});
const project=async(page,id)=>(await snapshot(page)).projects.find(p=>p.id===id);
async function saveProject(page){await page.locator('[data-action=save-project]').click();await expect(page.locator('#portfolio-form')).toHaveCount(0);}

test('CP-012.4 new experiences use the container form; earlier notes stay visible and are never cleared by an edit',async({page})=>{
  await seed(page);
  await page.locator('.mobile-nav [data-screen=portfolio]').click();
  // New experience: one short Context and an optional Goal / expected result (CP-UX1, DEC-036);
  // no responsibilities / outcome fields.
  await page.locator('[data-action=add-project]').click();
  await expect(page.locator('#portfolio-scope')).toBeVisible();
  await expect(page.locator('label[for=portfolio-scope]')).toHaveText('Context');
  await expect(page.locator('label[for=portfolio-objective]')).toHaveText('Goal or expected result (optional)');
  for(const id of ['personalResponsibility','outcome'])await expect(page.locator('#portfolio-'+id)).toHaveCount(0);
  await expect(page.locator('.modal legend',{hasText:'Earlier Notes'})).toHaveCount(0);
  await expect(page.locator('.modal-footer [data-action=remove-project]')).toHaveCount(0); // nothing to delete yet
  await page.locator('.close-dialog').click();

  // The timeline row counts the linked achievement; the page shows it with its result,
  // the objective as the Goal (the experience is completed) and earlier text under Earlier Notes.
  const row=page.locator('.experience-row[data-id=project-1]');
  await expect(row.locator('.experience-row-meta')).toContainText('1 achievement');
  await row.click();
  await expect(page.locator('.experience-page h1')).toHaveText('Synthetic Initiative');
  await expect(page.locator('.goal-box h2')).toHaveText('Goal');
  await expect(page.locator('.goal-box p')).toHaveText('Example');
  await expect(page.locator('.goal-box [data-action=project-capture]')).toHaveCount(0); // only offered while ongoing
  await expect(page.locator('.experience-achievements h2')).toHaveText('Achievements · 1');
  await expect(page.locator('.story-row .story-row-result')).toHaveText('Synthetic outcome');
  await expect(page.locator('.story-row .story-row-date')).toHaveText('Feb 29, 2024');
  await expect(page.locator('.experience-skills .chip')).toHaveText('Synthetic Skill · 1');
  const notes=page.locator('details.experience-notes');
  await expect(notes.locator('summary')).toHaveText('Earlier Notes');
  await notes.locator('summary').click();
  await expect(notes).toContainText('My Responsibilities');
  await expect(notes).toContainText('Outcome');
  await expect(notes.locator('h3',{hasText:'Objective'})).toHaveCount(0);

  // An unchanged edit keeps every stored field; the earlier notes are shown for editing.
  const original=await project(page,'project-1');
  await page.locator('.experience-page [data-action=edit-project]').click();
  await expect(page.locator('.modal legend',{hasText:'Earlier Notes'})).toBeVisible();
  for(const id of ['objective','personalResponsibility','outcome'])await expect(page.locator('#portfolio-'+id)).toHaveValue('Example');
  await saveProject(page);
  const unchanged=await project(page,'project-1');
  expect({...unchanged,updatedAt:'',revision:0}).toEqual({...original,updatedAt:'',revision:0});
  expect(unchanged.revision).toBe(original.revision+1);
  await expect(page.locator('.experience-page h1')).toHaveText('Synthetic Initiative'); // the page stays open

  // Clearing one earlier note saves it empty; it then disappears and the others stay.
  await page.locator('.experience-page [data-action=edit-project]').click();
  await page.locator('#portfolio-outcome').fill('');
  // QA-023: verify the form was cleared before saving, so an intermittent
  // timing/input problem is attributable to the editor rather than the assertion.
  await expect(page.locator('#portfolio-outcome')).toHaveValue('');
  await saveProject(page);
  expect(await project(page,'project-1')).toMatchObject({outcome:'',objective:'Example',personalResponsibility:'Example',scope:'Example'});
  await page.locator('.experience-page [data-action=edit-project]').click();
  await expect(page.locator('#portfolio-outcome')).toHaveCount(0);
  await page.locator('#portfolio-name').fill('Synthetic Initiative Renamed');
  await saveProject(page);
  expect(await project(page,'project-1')).toMatchObject({name:'Synthetic Initiative Renamed',outcome:'',objective:'Example',personalResponsibility:'Example'});
  await expect(page.locator('.experience-page h1')).toHaveText('Synthetic Initiative Renamed');

  // Defence in depth: a stored field that is missing from the form keeps its value.
  const read=await page.evaluate(async previous=>{
    const {readPortfolioForm}=await import('/app/ui/experiencePortfolio.js');
    const form=document.createElement('form');
    form.innerHTML='<input name="name" value="Synthetic"><input name="experienceType" value="project"><input name="status" value="active">'+
      '<input name="confidentiality" value="confidential"><input name="scope" value="New context"><input name="technologies" value="">';
    const r=readPortfolioForm(form,{...previous,objective:'  spaced  ',outcome:'Kept outcome'}).record;
    return [r.objective,r.personalResponsibility,r.outcome,r.scope];
  },await project(page,'project-1'));
  expect(read).toEqual(['  spaced  ','Example','Kept outcome','New context']);

  // The row opens the achievement itself, read as a story.
  await page.locator('.story-row').click();
  const dialog=page.getByRole('dialog',{name:'Resolved synthetic issue'});
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.story-metrics li')).toHaveText(/Synthetic reduction\s*12 → 6 hours/);
});

test('CP-UX1 an ongoing experience shows its goal as the expected result, with a shortcut to record it',async({page})=>{
  const c=fullCollections();
  Object.assign(c.projects[0],{status:'active',endDate:null,objective:'Synthetic line qualified for volume production'});
  await seed(page,c);
  await page.goto('/#/portfolio/project-1');
  await expect(page.locator('.experience-page h1')).toHaveText('Synthetic Initiative');
  await expect(page.locator('.experience-head .pill-status')).toHaveText('Active');
  await expect(page.locator('.experience-sub')).toHaveText('Synthetic Company · Synthetic Engineer · 2024 – now');
  await expect(page.locator('.goal-box h2')).toHaveText('Expected Result');
  await expect(page.locator('.goal-box p')).toHaveText('Synthetic line qualified for volume production');
  await page.locator('.goal-box [data-action=project-capture]').click();
  await expect(page.locator('#achievement-form')).toBeVisible();
  // The capture form opens linked to this experience.
  await page.locator('[data-action=toggle-rich-panel]').click();
  await expect(page.locator('input[name=projectId][value=project-1]')).toBeChecked();
  page.once('dialog',d=>d.accept());await page.keyboard.press('Escape');
  await expect(page.locator('.modal')).toHaveCount(0);
  // Back returns to the timeline, where the ongoing experience is marked live.
  await page.locator('[data-action=close-experience]').click();
  await expect(page.locator('.experience-row[data-id=project-1] .live-dot')).toHaveCount(1);
  expect(new URL(page.url()).hash).toBe('#/portfolio');
});

test('CP-012.4 an achievement creates and links a new experience inline, saved atomically with it',async({page})=>{
  await page.setViewportSize({width:320,height:700});
  await seed(page);
  const before=await snapshot(page);
  await page.locator('.mobile-create').click();
  await page.locator('#title').fill('Synthetic inline result');
  await page.locator('#contribution').fill('Synthetic contribution for an inline experience');
  await page.locator('[data-action=toggle-rich-panel]').click();
  await page.locator('#rich-roleId').selectOption('role-1');
  const toggle=page.locator('[data-action=toggle-inline-experience]');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded','true');
  await expect(page.locator('#inline-experience-name')).toBeFocused();

  // Empty name is refused in place.
  await page.locator('[data-action=add-inline-experience]').click();
  await expect(page.locator('#inline-experience-error')).toHaveText('Enter a name for the experience.');

  // A same-named saved experience is linked instead of duplicated.
  await page.locator('#inline-experience-name').fill('  synthetic   INITIATIVE ');
  await page.locator('[data-action=add-inline-experience]').click();
  await expect(page.locator('#inline-experience-status')).toContainText('already exists');
  await expect(page.locator('input[name=projectId][value=project-1]')).toBeChecked();
  await expect(page.locator('.rich-check.is-new')).toHaveCount(0);

  // A new one is added as a checked "New" choice (Enter works) and offered as primary.
  const name='Synthetic <b>Line</b> & \'24 Upgrade';
  await toggle.click();
  await page.locator('#inline-experience-name').fill(name);
  await page.locator('#inline-experience-name').press('Enter');
  const added=page.locator('.rich-check.is-new');
  await expect(added).toHaveCount(1);
  await expect(added.locator('span')).toHaveText(name);
  await expect(added.locator('input')).toBeChecked();
  await expect(page.locator('#inline-experience-panel')).toBeHidden();
  await expect(toggle).toHaveAttribute('aria-expanded','false');
  await expect(page.locator('#inline-experience-status')).toContainText('saved when you save this achievement');
  await page.locator('#rich-primaryProjectId').selectOption({label:name});
  expect((await snapshot(page)).projects).toHaveLength(before.projects.length); // nothing saved yet
  const overflow=await page.locator('.modal-body').evaluate(el=>el.scrollWidth-el.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  const after=await snapshot(page);
  const created=after.projects.find(p=>p.name===name);
  expect(created).toMatchObject({employerId:'employer-1',status:'active',revision:1,confidentiality:'confidential',objective:'',outcome:''});
  const saved=after.achievements.find(a=>a.title==='Synthetic inline result');
  const links=after.recordLinks.filter(l=>l.sourceId===saved.id&&l.linkType==='achievement-project');
  expect(links.map(l=>[l.targetId,l.isPrimary]).sort()).toEqual([[created.id,true],['project-1',false]].sort());
  expect(after.recordLinks.filter(l=>l.linkType==='role-project'&&l.targetId===created.id).map(l=>l.sourceId)).toEqual(['role-1']);

  // It appears on the Experience timeline under its role, text shown literally.
  await page.locator('.mobile-nav [data-screen=portfolio]').click();
  const row=page.locator(`.experience-row[data-id="${created.id}"]`);
  await expect(row.locator('strong')).toHaveText(name);
  await expect(row.locator('.experience-row-meta')).toContainText('1 achievement');
  await expect(page.locator('details.role-group',{has:row}).locator('h2')).toHaveText('Synthetic Engineer');
});

test('CP-012.4 a new experience typed into a discarded achievement is never created',async({page})=>{
  await seed(page);
  const before=await snapshot(page);
  await page.locator('.mobile-create').click();
  await page.locator('#title').fill('Discarded synthetic result');
  await page.locator('[data-action=toggle-rich-panel]').click();
  await page.locator('[data-action=toggle-inline-experience]').click();
  await page.locator('#inline-experience-name').fill('Discarded Synthetic Experience');
  await page.locator('[data-action=add-inline-experience]').click();
  await expect(page.locator('.rich-check.is-new')).toHaveCount(1);
  page.once('dialog',d=>d.accept()); // "You have unsaved changes. Discard them?"
  await page.locator('.close-dialog').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(await snapshot(page)).toEqual(before);
  // Unticking a new experience before saving also creates nothing.
  await page.locator('.mobile-create').click();
  await page.locator('#title').fill('Synthetic result without the new experience');
  await page.locator('#contribution').fill('Synthetic contribution');
  await page.locator('[data-action=toggle-rich-panel]').click();
  await page.locator('[data-action=toggle-inline-experience]').click();
  await page.locator('#inline-experience-name').fill('Unticked Synthetic Experience');
  await page.locator('[data-action=add-inline-experience]').click();
  await page.locator('.rich-check.is-new input').uncheck();
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  const after=await snapshot(page);
  expect(after.projects).toEqual(before.projects);
  expect(after.achievements).toHaveLength(before.achievements.length+1);
});
