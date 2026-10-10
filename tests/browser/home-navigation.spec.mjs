import {test,expect} from '@playwright/test';
import {fullCollections,legacyAchievement} from '../fixtures.mjs';
import {migrateLegacyAchievement} from '../../dist/app/domain/validation.js';
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
async function seed(page,c){
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  if(c)await page.evaluate(async c=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme:'light'},await database.getGeneration());},c);
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
}
const next=page=>page.locator('.next-card');

test('CP-012.2 Home next action follows first achievement → draft → backup → headline → recent win',async({page})=>{
  // Empty record: start with the first achievement.
  await seed(page);
  await expect(next(page)).toContainText('Capture your first achievement');
  await expect(page.locator('.metric-card').filter({hasText:'Last export'})).toContainText('Never');
  await next(page).locator('[data-action=capture]').click();
  await expect(page.getByRole('dialog',{name:'Capture an achievement'})).toBeVisible();
  await page.locator('.close-dialog').click();

  // A draft takes priority and opens that exact draft.
  const c=fullCollections();
  c.achievements.push(migrateLegacyAchievement(legacyAchievement('draft-1','draft')));
  await seed(page,c);
  await expect(next(page)).toContainText('Finish 1 draft');
  await next(page).locator('[data-action=detail]').click();
  await expect(page.getByRole('dialog')).toContainText('Draft');
  await page.locator('.close-dialog').click();

  // Without drafts and without an export, the backup comes next; exporting clears it.
  await seed(page,fullCollections());
  await expect(next(page)).toContainText('Export a backup');
  await expect(page.locator('.metric-card.metric-warn')).toContainText('Never');
  const download=page.waitForEvent('download');await next(page).locator('[data-action=export]').click();await download;
  await expect(page.locator('.metric-card').filter({hasText:'Last export'})).toContainText('Today');
  await page.reload();
  await expect(page.locator('.metric-card.metric-warn')).toHaveCount(0);
  await expect(next(page)).toContainText('Capture a recent win'); // the fixture profile has a headline

  // Truthful counts and correct plurals.
  await expect(page.locator('.metric-card').filter({hasText:'Recorded'})).toContainText('1');
  await expect(page.locator('.metric-card').filter({hasText:'Experiences'})).toContainText('1 with achievements');
  await expect(page.locator('.metric-card').filter({hasText:'Skills'})).toContainText('of 33 have examples');
});

test('CP-012.2 five tabs open their own screens; Settings and capture live in the header',async({page})=>{
  await seed(page,fullCollections());
  const tabs=[['home','CareerProof'],['vault','Achievement Vault'],['portfolio','Experience Portfolio'],['competencies','Skills'],['profile','Career Profile']];
  for(const [screen,title] of tabs){
    await page.locator(`.mobile-nav [data-screen=${screen}]`).click();
    await expect(page.locator('#main-content h1')).toHaveText(title);
    await expect(page.locator(`.mobile-nav [data-screen=${screen}]`)).toHaveAttribute('aria-current','page');
    await expect(page.locator('.mobile-nav [aria-current=page]')).toHaveCount(1);
    await expect(page.locator('.mobile-create')).toBeVisible();
    await expect(page.locator('.header-settings')).toBeVisible();
  }
  await expect(page.getByText('Back to Career Profile')).toHaveCount(0);
  await expect(page.getByText('Open Experience Portfolio')).toHaveCount(0);
  await page.locator('.mobile-nav [data-screen=vault]').click();
  await expect(page.locator('.page-title p')).toHaveText('1 achievement · 0 drafts');
  await page.locator('.mobile-nav [data-screen=competencies]').click();
  await expect(page.locator('[data-action=skill-scope][data-scope=linked]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('details.skill-entry')).toHaveCount(1);
  await expect(page.locator('.skill-panel .career-meta').first()).toHaveText('1 skill');
  await page.locator('.header-settings').click();
  await expect(page.getByRole('radiogroup',{name:'Color theme'})).toBeVisible();
  await expect(page.locator('[data-action=set-theme][aria-checked=true]')).toHaveText('Light');
});
