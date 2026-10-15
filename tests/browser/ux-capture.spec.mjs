import {test,expect} from '@playwright/test';
import {fullCollections,base} from '../fixtures.mjs';
import {captureWhere,captureWhen,fillOccurred,openCaptureMore} from './ux-helpers.mjs';

// CP-UX2 (DEC-037) guided capture: Where → What → When. Synthetic data only.
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});

async function seed(page,c){
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async c=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme:'light'},await database.getGeneration());},c);
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
}
const snapshot=page=>page.evaluate(async()=>{const {database}=await import('/app/data/db.js');return (await database.readSnapshot()).collections;});
const y=value=>({value,precision:value.length===4?'year':value.length===7?'month':'day'});
const link=(id,linkType,sourceId,targetId,isPrimary=false)=>({...base(id),linkType,sourceId,targetId,isPrimary,note:''});

/**
 * role-1 Synthetic Engineer (2022 – current, primary) and role-old Synthetic Junior Engineer (2019 – Dec 2021).
 * project-1 (fixture) sits under role-1 with achievement-1 showing "Synthetic Skill".
 * p-span runs across both roles; five more ongoing experiences push the list past five.
 */
function world(){
  const c=fullCollections();
  c.roles.push({...c.roles[0],...base('role-old'),title:'Synthetic Junior Engineer',isCurrent:false,startDate:y('2019'),endDate:y('2021-12')});
  c.projects.push({...c.projects[0],...base('p-span'),name:'Synthetic Spanning Programme',experienceType:'project',status:'completed',startDate:y('2021-03'),endDate:y('2022-02')});
  c.recordLinks.push(link('l-span-old','role-project','role-old','p-span'),link('l-span-new','role-project','role-1','p-span'));
  for(const [i,name] of ['Alpha','Bravo','Charlie','Delta','Echo'].entries()){
    c.projects.push({...c.projects[0],...base('p-'+name.toLowerCase()),name:'Synthetic '+name+' Line',status:'active',startDate:y('2026-0'+(i+1)),endDate:null});
    c.recordLinks.push(link('l-'+name,'role-project','role-1','p-'+name.toLowerCase()));
  }
  return c;
}

test('CP-UX2 Where: recent experiences first, search, show all, and a choice is needed to continue',async({page})=>{
  await seed(page,world());
  await page.locator('.mobile-create').click();
  const form=page.locator('#achievement-form');
  await expect(form).toHaveAttribute('data-step','1');
  await expect(page.locator('#dialog-description')).toHaveText('Step 1 of 3');
  await expect(page.locator('#capture-title-1')).toHaveText('Where Did This Happen?');
  // Five most recent (ongoing first), then "Show all".
  await expect(page.locator('.where-options .where-option:visible strong')).toHaveText(['Synthetic Echo Line','Synthetic Delta Line','Synthetic Charlie Line','Synthetic Bravo Line','Synthetic Alpha Line']);
  await expect(page.locator('.where-options .where-option:visible small').first()).toHaveText('Synthetic Engineer · Active');
  await expect(page.locator('[data-action=where-show-all]')).toHaveText(/Show all 7 experiences/);
  // Next needs a choice.
  await page.locator('[data-action=capture-next]').click();
  await expect(page.locator('#form-error')).toHaveText('Choose where this happened, or choose “Not part of an experience”.');
  await expect(page.locator('#form-error')).toBeFocused();
  // Search finds an older experience; Enter in the search never submits.
  await page.locator('#where-search').fill('spanning');
  await page.locator('#where-search').press('Enter');
  await expect(form).toHaveAttribute('data-step','1');
  await expect(page.locator('#where-kicker')).toHaveText('Matches');
  await expect(page.locator('.where-options .where-option:visible strong')).toHaveText(['Synthetic Spanning Programme']);
  await page.locator('#where-search').fill('no such experience');
  await expect(page.locator('.where-no-match')).toBeVisible();
  await page.locator('#where-search').fill('');
  await page.locator('[data-action=where-show-all]').click();
  await expect(page.locator('#where-kicker')).toHaveText('All experiences');
  await expect(page.locator('.where-options .where-option:visible')).toHaveCount(7);
  // Searching is not an unsaved change.
  await page.keyboard.press('Escape');
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('CP-UX2 an achievement takes its role from the experience, by date when the experience spans two roles',async({page})=>{
  await seed(page,world());
  for(const [title,date,role] of [['Synthetic older result','2021-06','role-old'],['Synthetic newer result','2022-01','role-1'],['Synthetic undated draft',null,'role-1']]){
    await page.locator('.mobile-create').click();
    await page.locator('[data-action=where-show-all]').click();
    await captureWhere(page,'p-span');
    await expect(page.locator('#capture-context-text')).toHaveText('Synthetic Spanning Programme');
    await page.locator('#title').fill(title);
    if(date){
      await page.locator('#contribution').fill('Synthetic contribution');
      await captureWhen(page);await fillOccurred(page,date);
      await page.locator('[data-action=save-achievement][data-status=recorded]').click();
    }else await page.locator('[data-action=save-achievement][data-status=draft]').click();
    await expect(page.locator('.modal')).toHaveCount(0);
    const c=await snapshot(page),a=c.achievements.find(x=>x.title===title);
    expect(a.roleId,title).toBe(role);
    // The experience it was captured in is its primary experience.
    expect(c.recordLinks.filter(l=>l.sourceId===a.id&&l.linkType==='achievement-project').map(l=>[l.targetId,l.isPrimary])).toEqual([['p-span',true]]);
  }
});

test('CP-UX2 "Not part of an experience" records the chosen role, or none, with no experience link',async({page})=>{
  await seed(page,world());
  await page.locator('.mobile-create').click();
  await expect(page.locator('.where-role')).toBeHidden();
  await page.locator('input[name=where][value=__role]').check();
  await expect(page.locator('#capture-roleId')).toBeVisible();
  await expect(page.locator('#capture-roleId')).toHaveValue('role-1'); // the primary role is offered first
  await page.locator('#capture-roleId').selectOption('role-old');
  await page.locator('[data-action=capture-next]').click();
  await expect(page.locator('#capture-context-text')).toHaveText('Synthetic Junior Engineer');
  await page.locator('#title').fill('Synthetic role-only result');
  await page.locator('[data-action=save-achievement][data-status=draft]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  let c=await snapshot(page),a=c.achievements.find(x=>x.title==='Synthetic role-only result');
  expect(a.roleId).toBe('role-old');
  expect(c.recordLinks.some(l=>l.sourceId===a.id&&l.linkType==='achievement-project')).toBe(false);
  // "No role" is a valid answer too.
  await page.locator('.mobile-create').click();
  await page.locator('input[name=where][value=__role]').check();
  await page.locator('#capture-roleId').selectOption('');
  await page.locator('[data-action=capture-next]').click();
  await expect(page.locator('#capture-context-text')).toHaveText('Not part of an experience');
  await page.locator('#title').fill('Synthetic unattached draft');
  await page.locator('[data-action=save-achievement][data-status=draft]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  c=await snapshot(page);a=c.achievements.find(x=>x.title==='Synthetic unattached draft');
  expect(a.roleId).toBeNull();
});

test('CP-UX2 What and When: title counter, context on demand, suggested skill chips and skill search',async({page})=>{
  await seed(page,world());
  await page.locator('.mobile-create').click();
  await page.locator('[data-action=where-show-all]').click();
  await captureWhere(page,'project-1');
  await expect(page.locator('#capture-title-2')).toHaveText('What Happened?');
  await page.locator('#title').fill('Synthetic chip result');
  await expect(page.locator('#title-count')).toHaveText('21 / 160');
  await expect(page.locator('#capture-situation')).toBeHidden();
  await page.locator('[aria-controls=capture-situation]').click();
  await expect(page.locator('#rich-situation')).toBeFocused();
  await page.locator('#rich-situation').fill('Synthetic reason it was needed');
  await page.locator('#contribution').fill('Synthetic contribution');
  await captureWhen(page);
  await expect(page.locator('#dialog-description')).toHaveText('Step 3 of 3');
  // Skills the experience already shows are suggested, not ticked.
  await expect(page.locator('#skill-suggest-note')).toHaveText('Suggested from this experience');
  await expect(page.locator('.skill-chip:visible')).toHaveText(['Synthetic Skill']);
  await expect(page.locator('.skill-chip input[value=custom-competency]')).not.toBeChecked();
  await page.locator('.skill-chip',{hasText:'Synthetic Skill'}).click();
  await expect(page.locator('.skill-chip input[value=custom-competency]')).toBeChecked();
  // Any other skill is one search away.
  await page.locator('[data-action=find-skill]').click();
  await expect(page.locator('#skill-search')).toBeFocused();
  await page.locator('#skill-search').fill('stakeholder');
  const match=page.locator('.skill-chip:visible').filter({hasNotText:'Synthetic Skill'}).first();
  await expect(match).toBeVisible();
  const otherId=await match.locator('input').getAttribute('value');
  await match.click();
  await page.locator('#skill-search').fill('zzz no skill');
  await expect(page.locator('.skill-no-match')).toBeVisible();
  await expect(page.locator(`.skill-chip input[value="${otherId}"]`)).toBeChecked(); // ticked chips stay visible
  await expect(page.locator(`.skill-chip:has(input[value="${otherId}"])`)).toBeVisible();
  // Confidential is on by default; turning it off is stored.
  await expect(page.locator('#rich-confidential')).toBeChecked();
  await page.locator('.capture-switch').click();
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  const c=await snapshot(page),a=c.achievements.find(x=>x.title==='Synthetic chip result');
  expect(a).toMatchObject({situation:'Synthetic reason it was needed',confidentiality:'standard-private',roleId:'role-1',impactCategory:''});
  expect(c.recordLinks.filter(l=>l.sourceId===a.id&&l.linkType==='achievement-competency').map(l=>l.targetId).sort()).toEqual(['custom-competency',otherId].sort());
});

test('CP-UX2 editing shows every section; a changed Where re-derives the role, an unchanged one keeps it',async({page})=>{
  const c=world();
  // Stored role deliberately differs from what the date would give, and an impact category is set.
  Object.assign(c.achievements[0],{roleId:'role-old',impactCategory:'delivery'});
  await seed(page,c);
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await page.locator('.achievement-row[data-id=achievement-1]').click();
  await page.locator('[data-action=edit-achievement]').click();
  const form=page.locator('#achievement-form');
  await expect(form).toHaveAttribute('data-mode','all');
  await expect(page.locator('.capture-title')).toHaveText(['Where Did This Happen?','What Happened?','When Did It Happen?']);
  await expect(page.locator('[data-action=capture-next], [data-action=capture-back]')).toHaveCount(0);
  await expect(page.locator('#impactCategory')).toHaveCount(0); // no longer asked for
  await expect(page.locator('input[name=where][value=project-1]')).toBeChecked();
  await page.locator('#title').fill('Resolved synthetic issue (edited)');
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  let a=(await snapshot(page)).achievements.find(x=>x.id==='achievement-1');
  expect(a).toMatchObject({title:'Resolved synthetic issue (edited)',roleId:'role-old',impactCategory:'delivery'});
  // Moving it to the spanning experience takes that experience's role at its date (Feb 2024 → role-1).
  await page.locator('.achievement-row[data-id=achievement-1]').click();
  await page.locator('[data-action=edit-achievement]').click();
  await page.locator('[data-action=where-show-all]').click();
  await page.locator('input[name=where][value=p-span]').check();
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  const after=await snapshot(page);a=after.achievements.find(x=>x.id==='achievement-1');
  expect(a.roleId).toBe('role-1');
  expect(after.recordLinks.filter(l=>l.sourceId==='achievement-1'&&l.linkType==='achievement-project').map(l=>[l.targetId,l.isPrimary])).toEqual([['p-span',true]]);
  expect(a.impactCategory).toBe('delivery'); // carried through untouched
});

test('CP-UX2 an achievement can stay in further experiences under More details',async({page})=>{
  const c=world();
  c.recordLinks.push(link('l-a1-span','achievement-project','achievement-1','p-span',false));
  await seed(page,c);
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await page.locator('.achievement-row[data-id=achievement-1]').click();
  await page.locator('[data-action=edit-achievement]').click();
  await openCaptureMore(page);
  const others=page.locator('.rich-experience-list');
  await expect(others.locator('input[value=p-span]')).toBeChecked();
  await expect(others.locator('label:has(input[value=project-1])')).toBeHidden(); // the Where choice is not repeated
  await others.locator('input[value=p-alpha]').check();
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  const links=(await snapshot(page)).recordLinks.filter(l=>l.sourceId==='achievement-1'&&l.linkType==='achievement-project').map(l=>[l.targetId,l.isPrimary]).sort();
  expect(links).toEqual([['p-alpha',false],['p-span',false],['project-1',true]].sort());
});

test('CP-UX2 started from an experience, capture opens on What and Back shows the choice',async({page})=>{
  await seed(page,world());
  await page.goto('/#/portfolio/p-span');
  await page.locator('.experience-achievements [data-action=project-capture]').click();
  const form=page.locator('#achievement-form');
  await expect(form).toHaveAttribute('data-step','2');
  await expect(page.locator('#capture-context-text')).toHaveText('Synthetic Spanning Programme');
  await page.locator('[data-action=capture-back]:visible').click();
  await expect(form).toHaveAttribute('data-step','1');
  await expect(page.locator('#capture-title-1')).toBeFocused();
  await expect(page.locator('input[name=where][value=p-span]')).toBeChecked();
  await expect(page.locator('.where-option:has(input[value=p-span])')).toBeVisible(); // shown although not recent
});
