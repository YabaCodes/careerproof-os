// CP-UX1 (DEC-036) shared browser-test helpers. Not a spec file.
import {expect} from '@playwright/test';

/** Pick the date precision that fits the value (YYYY, YYYY-MM or YYYY-MM-DD), then type it. */
export async function fillOccurred(page,value){
  const precision=value.length===4?'year':value.length===7?'month':'day';
  await page.locator('#occurredPrecision-'+precision).check();
  await page.locator('#occurredOn').fill(value);
}
/** Open "More Details" in an achievement story; Archive, Delete and the remaining fields live there. */
export async function openMore(page){
  const more=page.locator('details.story-more');
  await expect(more).toBeVisible();
  if(!await more.evaluate(d=>d.open))await more.locator('summary').click();
}
/** Choose Recorded, Drafts or Archived in the Vault. */
export async function vaultStatus(page,status){
  await page.locator(`[data-action=vault-status][data-status=${status}]`).click();
  await expect(page.locator(`[data-action=vault-status][data-status=${status}]`)).toHaveAttribute('aria-pressed','true');
}
/** Open an experience's page from the Experience timeline. */
export async function openExperience(page,name){
  await page.locator('.experience-row').filter({hasText:name}).first().click();
  await expect(page.locator('.experience-page h1')).toHaveText(name);
}
