import {test,expect} from '@playwright/test';

test('Settings provides a safe manual update check without altering saved data',async({page})=>{
  await page.goto('/');
  await expect(page.locator('.hero-card')).toBeVisible();
  await page.locator('.mobile-nav [data-action=settings]').click();
  await expect(page.getByRole('dialog')).toContainText('0.1.1-alpha.7');
  await expect(page.locator('[data-action=check-updates]')).toBeVisible();
  await page.locator('[data-action=check-updates]').click();
  await expect(page.locator('#pwa-update-status')).toContainText(/Update check completed|Update ready|No app update registration found/);
  await expect(page.locator('.modal')).toBeVisible();
  await expect(page.locator('[data-action=confirm-restore]')).toHaveCount(0);
});
