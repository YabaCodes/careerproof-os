import {test,expect} from '@playwright/test';
import {fullCollections} from '../fixtures.mjs';

// CP-PC (0.1.4-alpha.2): phone, website and professional links on the profile, used by CVs.
test.use({isMobile:true,hasTouch:true,viewport:{width:390,height:844}});
async function seed(page){
  await page.goto('/');await expect(page.locator('.hero-card')).toBeVisible();
  await page.evaluate(async c=>{const {database}=await import('/app/data/db.js');await database.replaceAllData(c,{theme:'light'},await database.getGeneration());},fullCollections());
  await page.reload();await expect(page.locator('.hero-card')).toBeVisible();
}
const profileRecord=page=>page.evaluate(async()=>{const {database}=await import('/app/data/db.js');return (await database.readSnapshot()).collections.profiles[0];});

test('CP-PC profile contact details save, show as links, are validated, and reach the CV contact step',async({page})=>{
  await seed(page);const before=await profileRecord(page);
  await page.locator('.header-profile').click();
  await page.locator('[data-action=edit-profile]').last().click();
  await expect(page.getByRole('dialog',{name:'Edit Career Profile'})).toBeVisible();
  // An unsafe address is refused with the user's text kept and nothing saved.
  await page.locator('#website').fill('javascript:alert(1)');
  await page.locator('[data-action=save-profile]').click();
  await expect(page.locator('#form-error')).toContainText('Enter the website as a web address');
  await expect(page.locator('#website')).toHaveValue('javascript:alert(1)');
  expect(await profileRecord(page)).toEqual(before);
  await page.locator('#phone').fill('+1 555 0100');
  await page.locator('#website').fill('example.test/me');
  await page.locator('#professionalLinks').fill('git.example/me\n\nhttps://linkedin.example/in/me\ngit.example/me');
  await page.locator('[data-action=save-profile]').click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const saved=await profileRecord(page);
  expect(saved).toMatchObject({phone:'+1 555 0100',website:'https://example.test/me',professionalLinks:['https://git.example/me','https://linkedin.example/in/me']});
  expect(saved.revision).toBe(before.revision+1);
  const contact=page.locator('.profile-contact');
  await expect(contact).toContainText('+1 555 0100');
  await expect(contact.locator('a.profile-link')).toHaveText(['example.test/me','git.example/me','linkedin.example/in/me']);
  await expect(contact.locator('a.profile-link').first()).toHaveAttribute('href','https://example.test/me');
  await expect(contact.locator('a.profile-link').first()).toHaveAttribute('rel','noopener noreferrer');
  await page.locator('[data-action=edit-profile]').last().click();
  await expect(page.locator('#website')).toHaveValue('https://example.test/me');
  await expect(page.locator('#professionalLinks')).toHaveValue('https://git.example/me\nhttps://linkedin.example/in/me');
  await page.locator('.close-dialog').click();
  // The CV contact step offers every detail; phone is off until ticked.
  await page.locator('.mobile-nav [data-screen=studio]').click();
  await page.locator('[data-action=studio-new][data-type=cv]').click();
  await page.locator('[data-action=wizard-next]').click();
  await page.locator('[data-action=wizard-next]').click();
  await expect(page.locator('input[name=contact]')).toHaveCount(5);
  await expect(page.locator('input[name=contact][value=phone]')).not.toBeChecked();
  await expect(page.locator('input[name=contact][value=website]')).toBeChecked();
  await expect(page.locator('input[name=contact][value=links]')).toBeChecked();
  await page.locator('input[name=contact][value=phone]').check();
  await page.locator('[data-action=wizard-finish]').click();
  await expect(page.locator('.doc-section').first()).toContainText('+1 555 0100 · Example City · example.test/me · git.example/me · linkedin.example/in/me');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
