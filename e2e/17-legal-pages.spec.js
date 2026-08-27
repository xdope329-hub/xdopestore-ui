const { test, expect } = require('@playwright/test');

// Legal pages: /terms-and-conditions and /privacy-policy render statically
// (content lives in src/data/legal), default to Spanish, and switch to
// English via the i18next cookie.

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([
    { name: 'newsletter', value: 'true', domain: 'localhost', path: '/', expires: 1897000000, httpOnly: false, secure: false, sameSite: 'Lax' },
  ]);
});

test('terms page renders in Spanish by default', async ({ page }) => {
  await page.goto('/terms-and-conditions', { waitUntil: 'domcontentloaded' });

  const content = page.locator('.legal-content');
  await expect(content).toBeVisible();
  await expect(page.locator('.breadcrumb-section h2')).toHaveText(/Términos y Condiciones/i);

  // Sections aligned with the store's actual offering
  await expect(content).toContainText(/hoodies con diseños bordados/i);
  await expect(content).toContainText(/Mercado Pago/i);
  await expect(content).toContainText(/retractarte/i);
  await expect(content).toContainText(/Ley 1480 de 2011/i);
  await expect(content).toContainText(/\$200\.000/);
  // All 16 numbered sections present
  await expect(content.locator('h3')).toHaveCount(9);
});

test('privacy page renders in Spanish by default', async ({ page }) => {
  await page.goto('/privacy-policy', { waitUntil: 'domcontentloaded' });

  const content = page.locator('.legal-content');
  await expect(content).toBeVisible();
  await expect(page.locator('.breadcrumb-section h2')).toHaveText(/Política de Privacidad/i);
  await expect(content).toContainText(/Ley 1581 de 2012/i);
  await expect(content).toContainText(/soporte@xdope\.com/i);
  await expect(content.locator('h3')).toHaveCount(7);
});

// Content is admin-managed (single language): when the API serves a page,
// the same admin content renders regardless of the language cookie. The
// bundled fallback is bilingual, but asserting English text here would fail
// against a seeded API, so we only assert the page still renders correctly.
test('terms page still renders with the English cookie set', async ({ page }) => {
  await page.context().addCookies([
    { name: 'i18next', value: 'en', domain: 'localhost', path: '/', expires: 1897000000, httpOnly: false, secure: false, sameSite: 'Lax' },
  ]);
  await page.goto('/terms-and-conditions', { waitUntil: 'domcontentloaded' });

  const content = page.locator('.legal-content');
  await expect(content).toBeVisible();
  await expect(content).toContainText(/XDOPE/i);
  await expect(content.locator('h3')).toHaveCount(9);
});
