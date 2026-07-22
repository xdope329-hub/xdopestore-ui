const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 414, height: 896 }, hasTouch: true }); // phone-sized (<578px rules apply)

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([
    { name: 'newsletter', value: 'true', domain: 'localhost', path: '/', expires: 1897000000, httpOnly: false, secure: false, sameSite: 'Lax' },
  ]);
});

test('bottom navigation is present on product pages', async ({ page }) => {
  const res = await page.request.get('http://localhost:5000/product?paginate=1&status=1');
  const body = await res.json().catch(() => null);
  const slug = body?.data?.[0]?.slug;
  test.skip(!slug, 'no product available in the API');

  await page.goto(`/product/${slug}`, { waitUntil: 'networkidle' });
  await page.locator('.loader-wrapper').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // In the mock environment the product detail page may fail to SSR entirely
  // (its endpoint isn't mocked) — in that case no layout exists to assert on.
  const layoutRendered = (await page.locator('header').count()) > 0;
  test.skip(!layoutRendered, 'product page did not render in this environment');

  await expect(page.locator('.mobile-menu')).toBeVisible();
});

test('bottom navigation is present on regular pages', async ({ page }) => {
  await page.goto('/contact-us', { waitUntil: 'networkidle' });
  await page.locator('.loader-wrapper').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await expect(page.locator('.mobile-menu')).toBeVisible();
});

test('mobile bottom-bar Cart opens a VISIBLE cart drawer', async ({ page }) => {
  await page.goto('/contact-us', { waitUntil: 'networkidle' });
  await page.locator('.loader-wrapper').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // The header cart icon (2nd icon-nav item) must NOT be display:none on
  // phones anymore — the drawer lives inside it.
  const cartLi = page.locator('.icon-nav ul li').nth(1);
  await expect(cartLi).toBeVisible();

  // Tap the bottom-bar Cart button (retry for hydration).
  const drawer = page.locator('#cart_side');
  for (let i = 0; i < 5; i++) {
    await page.locator('.mobile-menu li', { hasText: /Cart|Carrito/i }).locator('a').first().click();
    try {
      await expect(drawer).toHaveClass(/open-side|show-div/, { timeout: 1500 });
      break;
    } catch {}
  }
  await expect(drawer).toHaveClass(/open-side|show-div/);
  // ...and it must be actually visible (not inside a display:none ancestor).
  await expect(page.locator('#cart_side .cart-inner')).toBeVisible();
});
