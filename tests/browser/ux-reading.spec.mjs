import {test,expect} from '@playwright/test';
import {fullCollections,base} from '../fixtures.mjs';
import {fillOccurred,openMore,vaultStatus,openExperience} from './ux-helpers.mjs';

// CP-UX1 (DEC-036) reading and scanning: Experience timeline and pages, the achievement
// story, the Vault, the month/year date control and Profile tap-to-edit. Synthetic data only.
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});

async function seed(page,c=fullCollections()){
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async c=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme:'light'},await database.getGeneration());},c);
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
}
const snapshot=page=>page.evaluate(async()=>{const {database}=await import('/app/data/db.js');return (await database.readSnapshot()).collections;});
const noOverflow=page=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
const y=value=>({value,precision:value.length===4?'year':value.length===7?'month':'day'});
const link=(id,linkType,sourceId,targetId,isPrimary=false)=>({...base(id),linkType,sourceId,targetId,isPrimary,note:''});
const achievement=(c,id,over={})=>({...c.achievements[0],...base(id),title:'Synthetic '+id,roleId:null,status:'recorded',preArchiveStatus:null,...over});

/** Three roles at one employer; one experience spans two roles; one achievement sits on a role only. */
function careerWorld(){
  const c=fullCollections();
  c.roles.push({...c.roles[0],...base('role-old'),title:'Synthetic Junior Engineer',isCurrent:false,startDate:y('2019'),endDate:y('2021-12')});
  c.roles.push({...c.roles[0],...base('role-first'),title:'Synthetic Graduate',isCurrent:false,startDate:y('2016'),endDate:y('2018')});
  c.projects.push({...c.projects[0],...base('p-span'),name:'Synthetic Spanning Programme',status:'completed',startDate:y('2021-03'),endDate:y('2022-02')});
  c.projects.push({...c.projects[0],...base('p-first'),name:'Synthetic Graduate Scheme',status:'completed',startDate:y('2016'),endDate:y('2018')});
  c.recordLinks.push(link('l1','role-project','role-old','p-span'),link('l2','role-project','role-1','p-span'),link('l3','role-project','role-first','p-first'));
  c.achievements.push(achievement(c,'a-loose',{roleId:'role-old',occurredStart:y('2020')}));
  return c;
}

test('CP-UX1 timeline: role groups, one row per experience, remembered open groups and a working Back',async({page})=>{
  await seed(page,careerWorld());
  await page.locator('.mobile-nav [data-screen=portfolio]').click();
  await expect(page.locator('#main-content h1')).toHaveText('Experience');
  await expect(page.locator('.page-title p')).toHaveText('3 Roles · 3 Experiences');
  const groups=page.locator('details.role-group');
  await expect(groups.locator('h2')).toHaveText(['Synthetic Engineer','Synthetic Junior Engineer','Synthetic Graduate']);
  expect(await groups.evaluateAll(gs=>gs.map(g=>g.open))).toEqual([true,true,false]); // the two most recent roles start open
  await expect(groups.nth(0).locator('.role-current')).toHaveText('Current');
  // An experience spanning two roles is listed once, under the most recent, naming the earlier one.
  await expect(page.locator('.experience-row[data-id=p-span]')).toHaveCount(1);
  await expect(groups.nth(0).locator('.experience-row[data-id=p-span] .experience-row-also')).toHaveText('Also: Synthetic Junior Engineer');
  // A role's achievements that sit in no experience are one row, opening the Vault for that role.
  const loose=groups.nth(1).locator('[data-action=role-achievements]');
  await expect(loose).toContainText('1 achievement not in an experience');
  // Rows are 44px+ targets and nothing scrolls sideways, even at 320px.
  await page.setViewportSize({width:320,height:700});
  for(const h of await page.locator('.experience-row:visible').evaluateAll(rs=>rs.map(r=>r.getBoundingClientRect().height)))expect(h).toBeGreaterThanOrEqual(44);
  expect(await noOverflow(page)).toBe(true);
  await page.setViewportSize({width:390,height:844});

  // The viewer's open/closed choices survive opening an experience and coming back.
  await groups.nth(0).locator('summary').click();
  await groups.nth(2).locator('summary').click();
  await openExperience(page,'Synthetic Graduate Scheme');
  await expect(page.locator('.experience-sub')).toHaveText('Synthetic Company · Synthetic Graduate · 2016 – 2018');
  await page.locator('[data-action=close-experience]').click();
  expect(await page.locator('details.role-group').evaluateAll(gs=>gs.map(g=>g.open))).toEqual([false,true,true]);

  // The page subtitle reads the roles in order; the browser Back button returns to the timeline.
  await groups.nth(0).locator('summary').click();
  await openExperience(page,'Synthetic Spanning Programme');
  await expect(page.locator('.experience-sub')).toHaveText('Synthetic Company · Synthetic Junior Engineer → Synthetic Engineer · Mar 2021 – Feb 2022');
  expect(await noOverflow(page)).toBe(true);
  await page.goBack();
  await expect(page.locator('.experience-page')).toHaveCount(0);
  await expect(page.locator('#main-content h1')).toHaveText('Experience');
  await page.goForward();
  await expect(page.locator('.experience-page h1')).toHaveText('Synthetic Spanning Programme');
  // Bottom navigation leaves the page; returning to the tab shows the timeline, not the old page.
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await page.locator('.mobile-nav [data-screen=portfolio]').click();
  await expect(page.locator('.experience-page')).toHaveCount(0);
  await page.locator('details.role-group').nth(1).locator('[data-action=role-achievements]').click();
  await expect(page.locator('#main-content h1')).toHaveText('Achievement Vault');
  await expect(page.locator('#role-filter')).toHaveValue('role-old');
  await expect(page.locator('#vault-results .achievement-row')).toHaveCount(1);
  await expect(page.locator('#vault-results .vault-row-meta')).toHaveText('2020 · Synthetic Junior Engineer');
});

test('CP-UX1 an achievement reads as Result → What I Did → Context; everything else is folded under More Details',async({page})=>{
  const c=fullCollections();
  c.achievements.push(achievement(c,'a-needs-date',{status:'draft',occurredStart:null,contribution:'Synthetic contribution'}));
  c.achievements.push(achievement(c,'a-needs-both',{status:'draft',occurredStart:null,contribution:'',outcome:''}));
  await seed(page,c);
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await page.locator('.achievement-row[data-id=achievement-1]').click();
  const dialog=page.getByRole('dialog',{name:'Resolved synthetic issue'});
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('#dialog-description')).toHaveText('Feb 29, 2024 · Synthetic Initiative · Synthetic Engineer');
  await expect(dialog.locator('.story > section h3')).toHaveText(['Result','What I Did','Context','Skills Shown']);
  await expect(dialog.locator('.story-result p')).toHaveText('Synthetic outcome');
  await expect(dialog.locator('.story-metrics li')).toHaveText(/Synthetic reduction\s*12 → 6 hours/);
  await expect(dialog.locator('.story-section .chip')).toHaveText('Synthetic Skill');
  await expect(dialog.locator('.story-notice')).toHaveCount(0); // recorded: no notice
  // Archive, Delete and the remaining detail stay out of the way until asked for.
  await expect(dialog.locator('details.story-more')).not.toHaveAttribute('open','');
  await expect(dialog.locator('[data-action=toggle-archive]')).toBeHidden();
  await expect(dialog.locator('.modal-footer .button')).toHaveText(['Edit']);
  await openMore(page);
  await expect(dialog.locator('.story-more .story-section h3')).toHaveText(['Detailed Actions','Notes','Impact Category','Evidence References','Privacy']);
  await expect(dialog.locator('.story-more')).toContainText('Synthetic actions');
  await expect(dialog.locator('.story-more')).toContainText('SYNTHETIC-001');
  await expect(dialog.locator('.story-more')).toContainText('User provided, not independently verified.');
  await expect(dialog.locator('[data-action=toggle-archive]')).toBeVisible();
  expect(await page.locator('.modal-body').evaluate(el=>el.scrollWidth-el.clientWidth)).toBeLessThanOrEqual(0);
  await page.locator('.close-dialog').click();
  // A draft's notice names only what is still missing before it can be recorded.
  await vaultStatus(page,'draft');
  await page.locator('.achievement-row[data-id=a-needs-date]').click();
  await expect(page.locator('.story-notice')).toHaveText('Draft — not counted yet. Add a date, then record it.');
  await page.locator('.close-dialog').click();
  await page.locator('.achievement-row[data-id=a-needs-both]').click();
  await expect(page.locator('.story-notice')).toHaveText('Draft — not counted yet. Add what you did and a date, then record it.');
  await expect(page.locator('.story-result p')).toHaveText('No result stated yet');
  await expect(page.locator('.story-section',{hasText:'What I Did'}).locator('p')).toHaveText('Not added yet');
});

test('CP-UX1 Vault: Recorded by default, Drafts and Archived one tap away, rows under year headings',async({page})=>{
  const c=fullCollections(); // achievement-1: Feb 29, 2024, primary experience "Synthetic Initiative"
  c.achievements.push(
    achievement(c,'a-2025',{roleId:'role-1',occurredStart:y('2025-06')}),
    achievement(c,'a-2023',{roleId:'role-1',occurredStart:y('2023')}),
    achievement(c,'a-draft',{status:'draft',occurredStart:null,contribution:''}),
    achievement(c,'a-archived',{status:'archived',preArchiveStatus:'recorded',occurredStart:y('2022-01')}));
  await seed(page,c);
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await expect(page.locator('.page-title p')).toHaveText('3 Achievements · 1 Draft · 1 Archived');
  await expect(page.locator('#vault-status .segment')).toHaveText(['Recorded · 3','Drafts · 1','Archived · 1']);
  await expect(page.locator('[data-action=vault-status][data-status=recorded]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.vault-year')).toHaveText(['2025','2024','2023']);
  await expect(page.locator('.vault-row-meta')).toHaveText(['Jun 2025 · Synthetic Engineer','Feb 29, 2024 · Synthetic Initiative','2023 · Synthetic Engineer']);
  await expect(page.locator('#vault-results .status-tag')).toHaveCount(0); // recorded rows carry no tag
  // Search narrows every segment's count, not just the visible list.
  await page.locator('#vault-search').fill('a-2025');
  await expect(page.locator('#vault-status .segment')).toHaveText(['Recorded · 1','Drafts · 0']); // Archived shows only when something matches
  await expect(page.locator('#vault-search')).toBeFocused();
  await page.locator('#vault-search').fill('');
  await vaultStatus(page,'draft');
  await expect(page.locator('.vault-year')).toHaveText(['No Date']);
  await expect(page.locator('#vault-results .achievement-row .status-tag')).toHaveText('Draft');
  await vaultStatus(page,'archived');
  await expect(page.locator('#vault-results .achievement-row')).toHaveCount(1);
  await expect(page.locator('#vault-results .status-tag')).toHaveText('Archived');
  // Sort lives with the filters; "Last edited" lists without year headings.
  await vaultStatus(page,'recorded');
  await page.locator('#vault-filter-toggle').click();
  await page.locator('#sort-order').selectOption('updated');
  await expect(page.locator('#vault-filter-toggle')).toHaveText('Filters · 1');
  await expect(page.locator('.vault-year')).toHaveCount(0);
  await expect(page.locator('#vault-results .achievement-row')).toHaveCount(3);
  // Search and Filters share one line, even at 320px.
  await page.setViewportSize({width:320,height:700});
  const [search,toggle]=await page.locator('.vault-toolbar .search-field, .vault-toolbar .filter-toggle').evaluateAll(els=>els.map(e=>e.getBoundingClientRect()).map(r=>({top:r.top,bottom:r.bottom,right:r.right})));
  expect(Math.abs(search.top-toggle.top)).toBeLessThanOrEqual(2);
  expect(toggle.right).toBeLessThanOrEqual(320);
  expect(await noOverflow(page)).toBe(true);
  // An empty segment says what is (not) there instead of suggesting a failed search.
  await seed(page,fullCollections());
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await expect(page.locator('#vault-status .segment')).toHaveText(['Recorded · 1','Drafts · 0']); // Archived appears only when used
  await vaultStatus(page,'draft');
  await expect(page.locator('.no-results strong')).toHaveText('No Drafts');
  await expect(page.locator('[data-action=clear-filters]')).toHaveCount(0);
});

test('CP-UX1 achievement dates: month by default, year or exact day when known, never inventing a day',async({page})=>{
  await seed(page);
  const thisMonth=await page.evaluate(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');});
  await page.locator('.mobile-create').click();
  await expect(page.locator('#occurredPrecision-month')).toBeChecked();
  await expect(page.locator('#occurredOn')).toHaveValue(thisMonth);
  await expect(page.locator('.date-field .field-hint')).toHaveText("Use the month or year when you don't know the exact day.");
  await page.locator('#title').fill('Synthetic month result');
  await page.locator('#contribution').fill('Synthetic contribution');
  await fillOccurred(page,'2025-03-14');
  // Day → month keeps the month; month → day cannot know the day, so it is left blank.
  await page.locator('#occurredPrecision-month').check();
  await expect(page.locator('#occurredOn')).toHaveAttribute('type','month');
  await expect(page.locator('#occurredOn')).toHaveValue('2025-03');
  await page.locator('#occurredPrecision-year').check();
  await expect(page.locator('#occurredOn')).toHaveAttribute('type','text');
  await expect(page.locator('#occurredOn')).toHaveValue('2025');
  await page.locator('#occurredPrecision-day').check();
  await expect(page.locator('#occurredOn')).toHaveValue('');
  await fillOccurred(page,'2025-03');
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  let saved=(await snapshot(page)).achievements.find(a=>a.title==='Synthetic month result');
  expect(saved.occurredStart).toEqual({value:'2025-03',precision:'month'});
  // A year on its own is a complete answer too.
  await page.locator('.mobile-create').click();
  await page.locator('#title').fill('Synthetic year result');
  await page.locator('#contribution').fill('Synthetic contribution');
  await fillOccurred(page,'2019');
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  saved=(await snapshot(page)).achievements.find(a=>a.title==='Synthetic year result');
  expect(saved.occurredStart).toEqual({value:'2019',precision:'year'});
  // Editing reopens at the stored precision.
  const month=(await snapshot(page)).achievements.find(a=>a.title==='Synthetic month result');
  await page.locator(`.achievement-row[data-id="${month.id}"]`).first().click();
  await expect(page.locator('#dialog-description')).toHaveText(/^Mar 2025/);
  await page.locator('[data-action=edit-achievement]').click();
  await expect(page.locator('#occurredPrecision-month')).toBeChecked();
  await expect(page.locator('#occurredOn')).toHaveValue('2025-03');
  // A malformed year is refused rather than guessed.
  await page.locator('#occurredPrecision-year').check();
  await page.locator('#occurredOn').fill('25');
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('#form-error')).toContainText('Choose a valid occurrence date.');
  expect((await snapshot(page)).achievements.find(a=>a.id===month.id).occurredStart).toEqual({value:'2025-03',precision:'month'});
});

test('CP-UX1 Profile: a record\'s name opens its editor, and Delete lives in that editor',async({page})=>{
  await seed(page);
  await page.locator('.mobile-nav [data-screen=profile]').click();
  await expect(page.locator('.career-entry-actions')).toHaveCount(0);
  await expect(page.locator('.career-open')).toHaveText(['Synthetic Company','Synthetic Engineer','Example Degree','Synthetic Certificate']);
  for(const h of await page.locator('.career-open').evaluateAll(bs=>bs.map(b=>b.getBoundingClientRect().height)))expect(h).toBeGreaterThanOrEqual(44);
  // The heading still reads as the record's name; the button says it opens the editor.
  await expect(page.getByRole('heading',{name:'Synthetic Company',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Synthetic Company',exact:true})).toHaveAccessibleDescription('Opens the editor');
  await page.getByRole('button',{name:'Synthetic Certificate',exact:true}).click();
  await expect(page.getByRole('dialog',{name:'Edit Credential'})).toBeVisible();
  const del=page.locator('.modal-footer [data-action=delete-career][data-kind=credentials][data-id=credential-1]');
  await expect(del).toBeVisible();
  expect((await del.boundingBox()).height).toBeGreaterThanOrEqual(44);
  await del.click();
  await expect(page.locator('#removal-form')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Nothing else links to it.');
  await page.locator('[data-action=confirm-removal]').click();
  await expect(page.locator('#toast')).toContainText('deleted');
  expect((await snapshot(page)).credentials).toHaveLength(0);
  // A new record has nothing to delete yet.
  await page.locator('[data-action=add-career][data-kind=credentials]').click();
  await expect(page.getByRole('dialog',{name:'Add Credential'})).toBeVisible();
  await expect(page.locator('.modal-footer [data-action=delete-career]')).toHaveCount(0);
});

test('CP-UX1 #33 follow-ups: no future assessment dates, readable dates, and assessed skills are archived not deleted',async({page})=>{
  await seed(page);
  const today=await page.evaluate(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');});
  const tomorrow=await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()+1);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');});
  await page.locator('.mobile-nav [data-screen=competencies]').click();
  const skill=page.locator('details.skill-entry[data-skill=custom-competency]');
  await skill.locator('summary').click();
  await expect(skill.locator('[data-action=delete-competency]')).toBeVisible(); // no history yet
  await skill.locator('[data-action=assess-competency]').click();
  await expect(page.locator('#proficiency-date')).toHaveAttribute('max',today);
  await page.locator('#proficiency-level').selectOption('3');
  await page.locator('#proficiency-date').fill(tomorrow);
  await page.locator('[data-action=save-proficiency]').click();
  await expect(page.locator('#form-error')).toContainText('The assessment date cannot be in the future.');
  expect((await snapshot(page)).proficiencyAssessments??[]).toHaveLength(0);
  await page.locator('#proficiency-date').fill('2026-01-15');
  await page.locator('[data-action=save-proficiency]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(skill.locator('.skill-self-proficiency')).toContainText('Jan 15, 2026');
  await skill.locator('.skill-assessment-history > summary').click();
  await expect(skill.locator('.skill-assessment-entry')).toContainText('Jan 15, 2026');
  await expect(skill.locator('[data-action=delete-competency]')).toHaveCount(0);
  await expect(skill.locator('.skill-delete-note')).toHaveText('Has self-assessment history, so it can be archived but not deleted.');
  await expect(skill.locator('[data-action=archive-competency]')).toBeVisible();
});

test('CP-UX1 keyboard: rows open with Enter, focus moves to the page heading, and Back returns focus to the list',async({page})=>{
  await seed(page,careerWorld());
  await page.locator('.mobile-nav [data-screen=portfolio]').click();
  await page.locator('.experience-row[data-id=p-span]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.experience-page h1')).toBeFocused();
  await page.locator('[data-action=close-experience]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content h1')).toHaveText('Experience');
  await expect(page.locator('#main-content h1')).toBeFocused();
  // Role groups are native disclosures: Enter on the summary toggles them.
  const third=page.locator('details.role-group').nth(2);
  await third.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(third).toHaveAttribute('open','');
});
