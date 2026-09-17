const { test, expect } = require('@playwright/test');
const BASE_API = process.env.API_URL || 'http://localhost:5000';
const catalog = require('../src/app/api/product/product.json');
const settingsFixture = require('../src/app/api/settings/setting.json');
const themeFixture = require('../src/app/api/themeOptions/themeOption.json');

// All browser API calls are mocked, including payments. No orders are created.
const baseURL = process.env.CHECKOUT_BASE_URL || 'http://localhost:3001';
const bundledVersion = 'bundled-2026-08-27';
const address = { id: 'address-1', title: 'Casa', street: 'Calle 10 # 20-30', city: 'Bogotá', phone: '3001234567', country_code: '57', country_id: '48', state_id: '1', pincode: '110111', is_default: true };
test.setTimeout(90000);

async function checkout(page, { signedIn = false, width = 1280, unavailable = false } = {}) {
  const product = { ...catalog.data[0], price: 50000, sale_price: 50000, quantity: 100, variations: [], is_digital: false };
  const cart = { items: [{ id: 'line-1', product, product_id: product.id, quantity: 1, sub_total: 50000 }], total: 50000, is_digital_only: false };
  const settings = structuredClone(settingsFixture);
  settings.values.activation.guest_checkout = true;
  settings.values.payment_methods = [{ name: 'cod', status: true }];
  const theme = structuredClone(themeFixture);
  theme.options.popup = {};
  const state = { payments: [], unavailable, version: bundledVersion, stale: false, legalUnavailable: false, errors: [] };
  page.on('pageerror', (error) => state.errors.push(error.message));
  await page.setViewportSize({ width, height: 1000 });
  const domain = new URL(baseURL).hostname;
  await page.context().addCookies([
    { name: 'newsletter', value: 'true', domain, path: '/' },
    ...(signedIn ? [{ name: 'uat', value: 'terms-test-session', domain, path: '/' }] : []),
  ]);
  await page.context().route('https://www.googletagmanager.com/**', (route) => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.context().route(/https:\/\/.*(?:google-analytics\.com|analytics\.google\.com)/, (route) => route.abort());
  await page.context().route(`${BASE_API}/**`, async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    let status = 200;
    let json = { data: [], total: 0 };
    if (pathname === '/settings') json = settings;
    else if (pathname === '/themeOptions') json = theme;
    else if (pathname === '/capacity') json = { enabled: false, reached: false };
    else if (pathname === '/cart') json = cart;
    else if (pathname === '/address') json = { data: [address] };
    else if (pathname === '/self') json = { id: 'user-1', name: 'QA Customer', email: 'qa@example.com', address: [address] };
    else if (pathname === '/checkout/terms') {
      status = state.unavailable ? 503 : 200;
      json = { version: state.version, path: '/terms-and-conditions', source: state.version === bundledVersion ? 'bundled' : 'cms' };
    } else if (pathname === '/checkout') {
      json = { total: 50000, sub_total: 50000, tax_total: 0, shipping_total: 0, shipping_quote: { amount: 0 }, cart: [] };
    } else if (pathname === '/payment/initialize') {
      state.payments.push(route.request().postDataJSON());
      status = state.stale ? 422 : 503;
      json = state.stale ? { code: 'TERMS_VERSION_CHANGED' } : { message: 'QA: payment intercepted' };
      if (state.stale) state.version = 'cms-updated-for-test';
    } else if (pathname.startsWith('/page/')) {
      status = state.legalUnavailable ? 503 : 404;
      json = { message: 'QA: no published page' };
    }
    await route.fulfill({ status, json });
  });
  await page.addInitScript(({ cart, address }) => {
    if (sessionStorage.getItem('terms-test-seeded')) return;
    sessionStorage.setItem('terms-test-seeded', '1');
    localStorage.setItem('cart', JSON.stringify(cart));
    sessionStorage.setItem('xdope_checkout_guest_draft', JSON.stringify({
      name: 'QA Customer', email: 'qa@example.com', phone: '3001234567', country_code: '57',
      guest_addresses: [address], shipping_address_id: address.id, billing_address_id: address.id,
      // Even a stale/manipulated draft cannot pre-check acceptance.
      terms_accepted: true, terms_version: 'old-version',
    }));
  }, { cart, address });
  await page.goto(`${baseURL}/checkout`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.checkout-right-box')).toBeVisible();
  await expect(page.locator('input[name="payment_method"]:checked')).toHaveCount(1);
  await expect(page.locator('.box-loader')).toHaveCount(0);
  await expect(page.locator('.list-total .count')).toContainText('50.000');
  return state;
}

for (const { signedIn, width } of [{ signedIn: false, width: 1280 }, { signedIn: true, width: 1280 }, { signedIn: false, width: 390 }]) {
  test(`explicit acceptance, links, unchecking and reload (${signedIn ? 'account' : 'guest'}, ${width}px)`, async ({ page }, testInfo) => {
    const state = await checkout(page, { signedIn, width });
    const input = page.locator('#checkout-terms-accepted');
    await expect(input).toBeEnabled();
    await expect(input).not.toBeChecked();
    await page.locator('.order-btn').click();
    await expect(page.locator('#checkout-terms-error')).toContainText(/Debes aceptar/);
    await expect(input).toBeFocused();
    expect(state.payments).toHaveLength(0);
    await input.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('terms-required.png') });

    for (const path of ['/terms-and-conditions', '/privacy-policy']) {
      const popupPromise = page.waitForEvent('popup');
      await page.locator(`.checkout-terms a[href="${path}"]`).click();
      const popup = await popupPromise;
      await expect(popup.locator('.legal-content')).toContainText('XDOPE');
      await popup.close();
      await expect(page).toHaveURL(`${baseURL}/checkout`);
    }
    if (!signedIn) await expect(page.locator('input[name="email"]')).toHaveValue('qa@example.com');
    await input.check();
    await page.locator('.order-btn').click();
    await expect.poll(() => state.payments.length).toBe(1);
    expect(state.payments[0]).toMatchObject({ terms_accepted: true, terms_version: bundledVersion, payment_method: 'cod' });
    await expect(page.locator('.Toastify__toast--error')).toContainText('QA: payment intercepted');
    await input.uncheck();
    await page.locator('.order-btn').click();
    await expect(page.locator('#checkout-terms-error')).toBeVisible();
    expect(state.payments).toHaveLength(1);
    await input.check();
    await page.reload();
    await expect(input).toBeEnabled();
    await expect(input).not.toBeChecked();
    expect(state.errors).toEqual([]);
  });
}

test('a stale version clears acceptance and requires reviewing the new terms', async ({ page }) => {
  const state = await checkout(page);
  const input = page.locator('#checkout-terms-accepted');
  await input.check();
  state.stale = true;
  await page.locator('.order-btn').click();
  await expect(input).not.toBeChecked();
  await expect(page.locator('#checkout-terms-error')).toContainText(/han cambiado/);
  await page.locator('.order-btn').click();
  expect(state.payments).toHaveLength(1);
  state.stale = false;
  await input.check();
  await page.locator('.order-btn').click();
  await expect.poll(() => state.payments.length).toBe(2);
  expect(state.payments[1].terms_version).toBe('cms-updated-for-test');
  expect(state.errors).toEqual([]);
});

test('unavailable terms block payment until the customer retries and accepts', async ({ page }) => {
  const state = await checkout(page, { unavailable: true });
  const input = page.locator('#checkout-terms-accepted');
  await expect(input).toBeDisabled();
  await page.locator('.order-btn').click();
  await expect(page.locator('#checkout-terms-error')).toContainText(/No pudimos cargar/);
  expect(state.payments).toHaveLength(0);
  state.unavailable = false;
  await page.locator('.checkout-terms button').click();
  await expect(input).toBeEnabled();
  await expect(input).not.toBeChecked();
  await input.check();
  await page.locator('.order-btn').click();
  await expect.poll(() => state.payments.length).toBe(1);
  expect(state.errors).toEqual([]);
});

test('legal page outages show retry instead of different fallback terms', async ({ page }) => {
  const state = await checkout(page);
  state.legalUnavailable = true;
  await page.goto(`${baseURL}/terms-and-conditions`);
  await expect(page.locator('.legal-content [role="alert"]')).toContainText(/No pudimos cargar/);
  await expect(page.locator('.legal-block')).toHaveCount(0);
  state.legalUnavailable = false;
  await page.locator('.legal-content button').click();
  await expect(page.locator('.legal-block').first()).toBeVisible();
  expect(state.errors).toEqual([]);
});
