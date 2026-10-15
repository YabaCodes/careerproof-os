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

/**
 * CP-UX2 (DEC-037): a new capture opens on "Where did this happen?" when there
 * is anything to choose. Choose `where` (an experience id, or 'role' for
 * "Not part of an experience") and move on to "What happened?".
 */
export async function captureWhere(page,where='role'){
  const form=page.locator('#achievement-form');
  await expect(form).toBeVisible();
  if(await form.getAttribute('data-step')==='1'){
    await page.locator(`input[name=where][value="${where==='role'?'__role':where}"]`).check();
    await page.locator('[data-action=capture-next]').click();
  }
  await expect(form).toHaveAttribute('data-step','2');
}
/** From "What happened?" to "When did it happen?" (needs a title). */
export async function captureWhen(page){
  await page.locator('[data-action=capture-next]').click();
  await expect(page.locator('#achievement-form')).toHaveAttribute('data-step','3');
}
/**
 * Capture an achievement through all three steps. Fields left undefined are
 * not touched; `occurred` sets the date with the matching precision.
 */
export async function captureAchievement(page,{where='role',title,contribution,outcome,occurred,status='recorded'}={}){
  await captureWhere(page,where);
  if(title!==undefined)await page.locator('#title').fill(title);
  if(contribution!==undefined)await page.locator('#contribution').fill(contribution);
  if(outcome!==undefined)await page.locator('#outcome').fill(outcome);
  if(status==='draft'&&occurred===undefined){await page.locator('[data-action=save-achievement][data-status=draft]').click();return;}
  await captureWhen(page);
  if(occurred!==undefined)await fillOccurred(page,occurred);
  await page.locator(`[data-action=save-achievement][data-status=${status}]`).click();
}
/** Open "More details" in the capture form (it starts open when the record already has detailed actions or notes). */
export async function openCaptureMore(page){
  const more=page.locator('details.capture-more');
  if(!await more.evaluate(d=>d.open))await more.locator('summary').click();
  await expect(more).toHaveAttribute('open','');
}
