import {test,expect} from '@playwright/test';

// CP-012D: keyboard semantics and reduced-motion checks use synthetic/empty records.
test('Settings theme radios use a single tab stop and keyboard arrows, Home and End',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  await page.locator('[data-action="settings"]:visible').click();
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
  await page.locator('[data-action="settings"]:visible').click();
  await expect(system).toHaveAttribute('aria-checked','true');
});

test('Reduced motion suppresses animation and transitions while preserving visible focus',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  await page.locator('[data-action="settings"]:visible').click();
  const close=page.locator('.close-dialog');
  await close.focus();
  const state=await close.evaluate(el=>{
    const styles=getComputedStyle(el);
    return {animation:styles.animationName,transition:styles.transitionProperty,outline:styles.outlineStyle,outlineWidth:styles.outlineWidth};
  });
  expect(state.animation).toBe('none');
  expect(state.transition).toBe('none');
  expect(state.outline).not.toBe('none');
  expect(parseFloat(state.outlineWidth)).toBeGreaterThanOrEqual(2);
});
