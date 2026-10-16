import {test,expect} from '@playwright/test';
import {fullCollections,base} from '../fixtures.mjs';

// CP-012C Home dashboard: what is missing, and achievements by role. Synthetic data only.
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
async function seed(page,c){
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  if(c)await page.evaluate(async c=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme:'light'},await database.getGeneration());},c);
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
}
const achievement=(c,id,over={})=>({...c.achievements[0],...base(id),title:'Synthetic '+id,outcome:'',roleId:null,status:'recorded',preArchiveStatus:null,...over});
function world(){
  const c=fullCollections();
  c.roles.push({...c.roles[0],id:'role-old',title:'Synthetic Process Engineer',isCurrent:false,startDate:{value:'2018',precision:'year'},endDate:{value:'2021-12',precision:'month'}});
  c.roles.push({...c.roles[0],id:'role-empty',title:'Synthetic Intern',isCurrent:false,startDate:{value:'2015',precision:'year'},endDate:{value:'2016',precision:'year'}});
  c.achievements.push(
    achievement(c,'a-old',{roleId:'role-old',outcome:'Synthetic result'}),
    achievement(c,'a-gap',{roleId:'role-1'}),
    achievement(c,'a-draft',{roleId:'role-1',status:'draft',contribution:''}),
    achievement(c,'a-archived',{roleId:'role-old',status:'archived',preArchiveStatus:'recorded'}));
  return c;
}
const gaps=page=>page.locator('.home-gaps details[data-code]');

test('CP-012C Complete Your Record lists documentation gaps that open their records and update after an edit',async({page})=>{
  await seed(page,world());
  await expect(page.locator('.home-record > h2')).toHaveText('Your Record');
  await page.locator('.home-record-disclosure').first().locator(':scope > summary').click();
  expect(await gaps(page).evaluateAll(n=>n.map(d=>d.dataset.code))).toEqual(['achievement-no-outcome','achievement-no-support','achievement-no-skill']);
  await expect(gaps(page).first().locator('summary')).toHaveText('1 recorded achievement has no stated outcome');
  await expect(page.locator('.home-gaps')).not.toContainText('draft'); // drafts stay in the next action and Data Health

  // A gap stays open after its record's dialog closes.
  const support=page.locator('.home-gaps details[data-code=achievement-no-support]');
  await support.locator('summary').click();
  await support.locator('[data-action=health-open]').first().click();
  await expect(page.getByRole('dialog',{name:/^Synthetic a-/})).toBeVisible(); // CP-UX1: the dialog is named by the achievement
  await page.locator('.close-dialog').click();
  await expect(support).toHaveAttribute('open','');

  // Completing the outcome removes that gap as soon as the record is saved.
  const outcome=page.locator('.home-gaps details[data-code=achievement-no-outcome]');
  await outcome.locator('summary').click();
  await outcome.locator('[data-action=health-open]').click();
  await page.locator('[data-action=edit-achievement]').click();
  await page.locator('#outcome').fill('Synthetic outcome now stated');
  await page.locator('[data-action=save-achievement][data-status=recorded]').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect(page.locator('.home-gaps details[data-code=achievement-no-outcome]')).toHaveCount(0);
  await expect(gaps(page)).toHaveCount(2);

  // The full report, including drafts and backup items, is one tap away.
  await page.locator('[data-action=open-data-health]').click();
  await expect(page.getByRole('dialog',{name:'Settings & Data'})).toBeVisible();
  await expect(page.locator('#data-health-report')).toContainText('1 draft not recorded yet');
});

test('CP-012C Achievements by Role counts active records per role, most recent first, and opens the filtered Vault',async({page})=>{
  await seed(page,world());
  await page.locator('.home-record-disclosure').last().locator(':scope > summary').click();
  const rows=page.locator('.role-coverage .role-row');
  await expect(rows.locator('strong')).toHaveText(['Synthetic Engineer','Synthetic Process Engineer','Synthetic Intern']);
  await expect(rows.nth(0)).toContainText('2 achievements · 1 draft · 1 experience'); // CP-UX1: recorded and drafts counted apart
  await expect(rows.nth(1)).toContainText('1 achievement'); // the archived one is not counted
  await expect(rows.nth(2)).toContainText('No achievements recorded yet');
  expect(await rows.evaluateAll(n=>n.map(r=>r.tagName))).toEqual(['BUTTON','BUTTON','DIV']); // empty roles are not links
  await rows.nth(0).click();
  await expect(page.locator('#main-content h1')).toHaveText('Achievement Vault');
  await expect(page.locator('#role-filter')).toHaveValue('role-1');
  await expect(page.locator('#vault-filters')).toBeVisible();
  await expect(page.locator('[data-action=vault-status][data-status=recorded]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('#vault-results .achievement-row')).toHaveCount(2);
  await page.locator('[data-action=vault-status][data-status=draft]').click();
  await expect(page.locator('#vault-results .achievement-row')).toHaveCount(1);
  await expect(page.locator('#role-filter')).toHaveValue('role-1'); // the role filter is kept across segments
  // Achievements without a role are summarised, not hidden.
  const c=world();c.achievements.push(achievement(c,'a-loose',{outcome:'Synthetic loose result'}));
  await seed(page,c);
  await expect(page.locator('.role-coverage .role-row-none')).toContainText('Not linked to a role');
  await expect(page.locator('.role-coverage .role-row-none')).toContainText('1 achievement');
});

test('CP-012C empty and complete records: no empty sections, and a plain statement when nothing is missing',async({page})=>{
  await page.setViewportSize({width:320,height:700});
  await seed(page);
  await expect(page.locator('.home-record-disclosure')).toHaveCount(2);
  await expect(page.locator('.role-coverage')).toHaveCount(0);
  await seed(page,fullCollections());
  await expect(page.locator('.home-gaps-done')).toHaveText('Nothing missing from your recorded achievements, experiences or credentials.');
  await expect(page.locator('.role-coverage .role-row')).toHaveCount(1);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
