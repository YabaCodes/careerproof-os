import {test,expect} from '@playwright/test';
import {fullCollections} from '../fixtures.mjs';
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
test('CP-013A Skills explains evidence breadth without modifying stored records',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async c=>{
    const {database}=await import('/app/data/db.js');
    await database.replaceAllData(c,{theme:'light'},await database.getGeneration());
  },fullCollections());
  await page.reload();
  const before=await page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');
    return database.readSnapshot();
  });
  await page.locator('.mobile-nav [data-screen=competencies]').click();
  await page.locator('[data-action=skill-scope][data-scope=linked]').click();
  const details=page.locator('details.skill-entry').first();
  await details.locator('summary').click();
  await expect(details.locator('.skill-evidence-breadth')).toContainText('Evidence breadth: Emerging');
  await expect(details.locator('.skill-evidence-breadth')).toContainText('1 recorded example');
  await expect(details.locator('.skill-evidence-breadth')).toContainText('not a proficiency rating');
  const after=await page.evaluate(async()=>{
    const {database}=await import('/app/data/db.js');
    return database.readSnapshot();
  });
  expect(after).toEqual(before);
});
