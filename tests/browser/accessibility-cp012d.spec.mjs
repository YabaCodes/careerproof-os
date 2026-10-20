import {test,expect} from '@playwright/test';
import {openSettings} from './ux-helpers.mjs';

// CP-012D: keyboard semantics and reduced-motion checks use synthetic/empty records.
test('Settings theme radios use a single tab stop and keyboard arrows, Home and End',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  await openSettings(page);
  const group=page.getByRole('radiogroup',{name:'Color theme'});
  const system=group.getByRole('radio',{name:'System'});
  const light=group.getByRole('radio',{name:'Light'});
  const dark=group.getByRole('radio',{name:'Dark'});
  await expect(system).toHaveAttribute('aria-checked','true');
  await expect(system).toHaveAttribute('tabindex','0');
  await expect(light).toHaveAttribute('tabindex','-1');
  await expect(dark).toHaveAttribute('tabindex','-1');
  await system.focus();
  await page.keyboard.press('ArrowRight');
  await expect(light).toBeFocused();
  await expect(light).toHaveAttribute('aria-checked','true');
  await expect(light).toHaveAttribute('tabindex','0');
  await expect(system).toHaveAttribute('tabindex','-1');
  await page.keyboard.press('ArrowDown');
  await expect(dark).toBeFocused();
  await expect(dark).toHaveAttribute('aria-checked','true');
  await page.keyboard.press('ArrowRight');
  await expect(system).toBeFocused();
  await expect(system).toHaveAttribute('aria-checked','true');
  await page.keyboard.press('End');
  await expect(dark).toBeFocused();
  await expect(dark).toHaveAttribute('aria-checked','true');
  await page.keyboard.press('Home');
  await expect(system).toBeFocused();
  await expect(system).toHaveAttribute('aria-checked','true');
  await page.keyboard.press('Tab');
  await expect(page.locator('#export-backup')).toBeFocused();
  await page.locator('.close-dialog').click();
  await openSettings(page);
  await expect(system).toHaveAttribute('aria-checked','true');
});

test('Reduced motion suppresses animation and transitions while preserving visible focus',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  await openSettings(page);
  const close=page.locator('.close-dialog');
  await expect(page.getByRole('dialog')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  const state=await close.evaluate(el=>{
    const styles=getComputedStyle(el);
    return {animation:styles.animationName,transition:styles.transitionProperty,outline:styles.outlineStyle,outlineWidth:styles.outlineWidth};
  });
  expect(state.animation).toBe('none');
  expect(state.transition).toBe('none');
  expect(state.outline).not.toBe('none');
  expect(parseFloat(state.outlineWidth)).toBeGreaterThanOrEqual(2);
});


test('Failed achievement save focuses its accessible error summary, then supports correction',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  await page.locator('[data-action="capture"]:visible').first().click();
  const dialog=page.getByRole('dialog');
  const error=dialog.locator('#form-error');
  // CP-UX2: with nothing to choose under Where, capture opens on "What happened?"; Next needs a title.
  await expect(dialog.locator('#achievement-form')).toHaveAttribute('data-step','2');
  await dialog.locator('[data-action="capture-next"]').click();
  await expect(error).toBeVisible();
  await expect(error).toHaveAttribute('role','alert');
  await expect(error).toHaveAttribute('tabindex','-1');
  await expect(error).toBeFocused();
  await expect(error).toHaveText('Add a title before you continue.');
  await dialog.locator('#title').fill('Synthetic accessibility check');
  await dialog.locator('[data-action="capture-next"]').click();
  await expect(error).toBeHidden();
  // Recording without "What did you do?" returns to the step that holds the problem.
  await dialog.locator('[data-action="save-achievement"][data-status="recorded"]').click();
  await expect(dialog.locator('#achievement-form')).toHaveAttribute('data-step','2');
  await expect(error).toBeFocused();
  await expect(error).toContainText('contribution');
  await dialog.locator('#contribution').fill('Synthetic action, for keyboard test only.');
  await dialog.locator('[data-action="capture-next"]').click();
  await dialog.locator('[data-action="save-achievement"][data-status="recorded"]').click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Synthetic accessibility check').first()).toBeVisible();
});

test('Reduced-motion validation feedback remains visible and focused',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await page.locator('[data-action="capture"]:visible').first().click();
  const dialog=page.getByRole('dialog');
  await dialog.locator('[data-action="capture-next"]').click();
  const error=dialog.locator('#form-error');
  await expect(error).toBeFocused();
  await expect(error).toBeVisible();
  await expect(error).toHaveAttribute('role','alert');
});
