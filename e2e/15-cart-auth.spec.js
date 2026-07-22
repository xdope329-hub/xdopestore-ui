const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([
    { name: 'newsletter', value: 'true', domain: 'localhost', path: '/', expires: 1897000000, httpOnly: false, secure: false, sameSite: 'Lax' },
  ]);
});

test('guest at checkout is prompted to log in to continue to payment', async ({ page }) => {
  // No `uat` cookie => guest.
  await page.goto('/checkout', { waitUntil: 'networkidle' });
  await page.locator('.loader-wrapper').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // The login-required prompt must be shown for guests...
  const prompt = page.locator('.checkout-login-required');
  await expect(prompt).toBeVisible({ timeout: 10000 });
  await expect(prompt).toContainText(/Inicia sesión para continuar al pago|Log in to continue to payment/i);

  // ...and no payment/address UI should be present for a guest.
  await expect(page.locator('.checkout-detail-box ul')).toHaveCount(0);

  // Clicking the prompt's Login button opens the auth modal.
  await prompt.getByRole('button').click();
  await expect(page.locator('.auth-modal .auth-form-box')).toBeVisible({ timeout: 10000 });
});
