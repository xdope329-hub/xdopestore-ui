const { test, expect } = require('@playwright/test');

// Simulate an English-preferring browser: Spanish must still win by default.
test.use({ locale: 'en-US', extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' } });

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([
    { name: 'newsletter', value: 'true', domain: 'localhost', path: '/', expires: 1897000000, httpOnly: false, secure: false, sameSite: 'Lax' },
  ]);
});

test('contact page: Spanish default, new text, only FB/IG/WhatsApp', async ({ page }) => {
  await page.goto('/contact-us', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const title = page.locator('.contact-title');
  // Spanish default despite English browser
  await expect(title.locator('h2')).toHaveText(/Ponerse en Contacto/i);
  await expect(title.locator('p')).toHaveText(/Puedes contactarnos a través de cualquiera de las siguientes redes sociales/i);

  // exactly three social links: facebook, instagram, whatsapp
  const links = title.locator('.footer-social a');
  await expect(links).toHaveCount(3);
  const hrefs = await links.evaluateAll((as) => as.map((a) => a.href));
  expect(hrefs.some((h) => h.includes('facebook'))).toBe(true);
  expect(hrefs.some((h) => h.includes('instagram'))).toBe(true);
  expect(hrefs.some((h) => h.includes('wa.me'))).toBe(true);
  expect(hrefs.some((h) => h.includes('twitter') || h.includes('pinterest'))).toBe(false);

  // language switcher still allows English (dropdown shows Español as current)
  await expect(page.locator('#select-language span').first()).toHaveText(/Español/i);
});
