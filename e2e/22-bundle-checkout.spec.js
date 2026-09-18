const { test, expect } = require('@playwright/test');
const catalog = require('../src/app/api/product/product.json');
const settingsFixture = require('../src/app/api/settings/setting.json');
const themeFixture = require('../src/app/api/themeOptions/themeOption.json');
const baseURL = process.env.CHECKOUT_BASE_URL || 'http://localhost:3001';
const apiURL = process.env.API_URL || 'http://localhost:5000';

// Browser API writes are intercepted. The SSR test server should have GA4
// enabled; the Google script/collection requests are intercepted as well.
const variant = (id, name, price) => ({ id, _id: id, name, price, sale_price: price, status: 1, stock_status: 'in_stock', quantity: 10, attribute_values: [] });
const base = { ...catalog.data[0], id: '111111111111111111111111', slug: 'tan-cargo-shorts', name: 'QA Bundle', type: 'bundle', status: 1, price: 90000, sale_price: 90000, quantity: 20, stock_status: 'in_stock', related_products: [], cross_sell_products: [], variations: [], attributes: [] };
const smallId = '333333333333333333333333';
const largeId = '444444444444444444444444';
const child = { ...base, id: '222222222222222222222222', slug: 'qa-child', name: 'QA Child', type: 'classified', price: 40000, sale_price: 40000, variations: [variant(smallId, 'Small', 40000), variant(largeId, 'Large', 80000)] };
const secondChild = { ...child, id: '555555555555555555555555', name: 'QA Second Child' };
const bundle = { ...base, bundle_items: [
  { product_id: child, allowed_variation_ids: [largeId] },
  { product_id: secondChild, allowed_variation_ids: [] },
] };
// "Frecuentemente comprados juntos": producto simple de 90.000 con un relacionado con tallas.
const crossSellParent = { ...base, type: 'simple', bundle_items: [], cross_sell_products: [child.id] };
test.setTimeout(90000);

async function openProduct(page, { layout = 'product_thumbnail', crossSell = false, signedIn = false, width = 1280, parentOverride = null } = {}) {
  const parent = parentOverride || (crossSell ? crossSellParent : bundle);
  const settings = structuredClone(settingsFixture);
  settings.values.activation.guest_checkout = true;
  settings.values.payment_methods = [{ name: 'cod', status: true }];
  const theme = structuredClone(themeFixture);
  theme.options.popup = {};
  const state = { payments: [], syncs: [], adds: [], rows: [], errors: [] };
  page.on('pageerror', (e) => state.errors.push(e.message));
  await page.setViewportSize({ width, height: 1000 });
  const domain = new URL(baseURL).hostname;
  await page.context().addCookies([{ name: 'newsletter', value: 'true', domain, path: '/' }, ...(signedIn ? [{ name: 'uat', value: 'qa-session', domain, path: '/' }] : [])]);
  await page.context().route('https://www.googletagmanager.com/**', (route) => route.fulfill({ contentType: 'application/javascript', body: '' }));
  await page.context().route(/https:\/\/.*(?:google-analytics\.com|analytics\.google\.com)/, (route) => route.abort());
  await page.context().route(`${apiURL}/**`, async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    let status = 200, json = { data: [], total: 0 };
    if (path === '/settings') json = settings;
    else if (path === '/themeOptions') json = theme;
    else if (path === '/capacity') json = { enabled: false, reached: false };
    else if (path === '/self') json = { id: 'qa-user', name: 'QA Buyer', email: 'qa@example.com' };
    else if (path === '/product') json = { data: [child], total: 1 };
    else if (path.startsWith('/product/')) json = parent;
    else if (path === '/checkout/terms') json = { source: 'bundled', version: 'bundled-2026-08-27', path: '/terms-and-conditions' };
    else if (path === '/checkout') {
      // Invitados envían sus líneas: el resumen debe sumarlas todas (el servidor real las reprecia).
      const posted = req.method() === 'POST' ? req.postDataJSON()?.products || [] : [];
      const sum = posted.length ? posted.reduce((acc, line) => acc + Number(line.sub_total || 0), 0) : 90000;
      json = { total: sum, sub_total: sum, shipping_total: 0, shipping_quote: { amount: 0 }, cart: [] };
    }
    else if (path === '/payment/initialize') {
      state.payments.push(req.postDataJSON());
      status = 503;
      json = { message: 'QA: payment intercepted' };
    } else if (path === '/sync/cart') {
      const body = req.postDataJSON();
      state.syncs.push(body);
      state.rows = body.cart.map((line, index) => ({ ...line, id: `line-${index}`, product: bundle, sub_total: 90000 * line.quantity }));
      json = { items: state.rows, total: state.rows.reduce((sum, line) => sum + line.sub_total, 0), skipped: [] };
    } else if (path === '/cart') {
      if (req.method() === 'POST') {
        const body = req.postDataJSON();
        state.adds.push(body);
        // Como el servidor: la línea vuelve poblada con su producto, variante y subtotal.
        const product = [parent, child, secondChild].find((p) => p.id === String(body.product_id)) || parent;
        const variation = (product.variations || []).find((v) => v.id === String(body.variation_id || '')) || null;
        state.rows.push({ ...body, id: `cart-line-${state.rows.length + 1}`, product, variation, sub_total: Number(variation?.sale_price ?? product.sale_price) * Number(body.quantity || 1) });
        status = 201;
      }
      json = { items: state.rows, total: state.rows.reduce((sum, line) => sum + line.sub_total, 0) };
    }
    await route.fulfill({ status, json });
  });
  await page.goto(`${baseURL}/product/tan-cargo-shorts?layout=${layout}`);
  await expect(page.locator('.main-title').first()).toHaveText('QA Bundle');
  await expect(page.locator('.bundle')).toBeVisible();
  return state;
}

for (const { layout, width } of [{ layout: 'product_thumbnail', width: 1280 }, { layout: 'product_accordion', width: 1280 }, { layout: 'product_thumbnail', width: 390 }]) {
  test(`bundle requires every choice and keeps its fixed price (${layout}, ${width}px)`, async ({ page }, testInfo) => {
    const state = await openProduct(page, { layout, width });
    const selectors = page.locator('.bundle select');
    await expect(selectors).toHaveCount(2);
    const buy = page.locator('.bundle-btn');
    await expect(buy).toBeDisabled();
    await expect(selectors.nth(0)).toHaveValue('');
    await expect(selectors.nth(0).locator(`option[value="${smallId}"]`)).toHaveCount(0);
    await selectors.nth(0).selectOption(largeId);
    await expect(buy).toBeDisabled();
    await selectors.nth(1).selectOption(smallId);
    await expect(buy).toBeEnabled();
    await selectors.nth(1).selectOption('');
    await expect(buy).toBeDisabled();
    await selectors.nth(1).selectOption(largeId);
    if (layout === 'product_accordion') expect((await selectors.nth(0).boundingBox()).width).toBeGreaterThan(100);
    await expect(page.locator('.bundle .total-price')).toContainText('90.000');
    await buy.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('bundle-selected.png') });
    await buy.click();
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '{}').items?.length)).toBe(1);
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('cart')));
    expect(cart.items[0]).toMatchObject({ product_id: bundle.id, sub_total: 90000, bundle_selections: [{ product_id: child.id, variation_id: largeId }, { product_id: secondChild.id, variation_id: largeId }] });
    expect(state.errors).toEqual([]);
  });
}

// Paquete: la ficha (siempre incluida) más el relacionado marcado con su talla.
const idOf = (value) => (value == null ? null : String(value?._id ?? value?.id ?? value));
const packageOf = (lines) => lines.map(({ product_id, variation_id, quantity }) => ({ product_id: idOf(product_id), variation_id: idOf(variation_id), quantity }));
const expectedPackage = [{ product_id: base.id, variation_id: null, quantity: 1 }, { product_id: child.id, variation_id: largeId, quantity: 1 }];

async function buildPackage(page) {
  const boxes = page.locator('.bundle .bundle-box');
  await expect(boxes).toHaveCount(2);
  await expect(boxes.nth(0)).toContainText('QA Bundle');
  await expect(boxes.nth(0).locator('input[type="checkbox"]')).toBeChecked();
  await expect(boxes.nth(0).locator('input[type="checkbox"]')).toBeDisabled();
  await expect(page.locator('.bundle .total-price')).toContainText('90.000');
  await expect(page.locator('.bundle-btn')).toBeDisabled();
  await boxes.nth(1).locator('input[type="checkbox"]').check();
  await expect(page.locator('.bundle-btn')).toBeDisabled();
  await page.locator('.bundle select').selectOption(largeId);
  await expect(page.locator('.bundle .total-price')).toContainText('170.000');
  await expect(page.locator('.bundle-btn')).toBeEnabled();
}

async function seedGuestDraft(page) {
  await page.evaluate(() => {
    const address = { id: 'guest-1', title: 'Casa', street: 'Calle 10 # 20-30', city: 'Bogotá', phone: '3001234567', country_code: '57', country_id: '48', state_id: '1', pincode: '110111' };
    sessionStorage.setItem('xdope_checkout_guest_draft', JSON.stringify({ name: 'QA Buyer', email: 'qa@example.com', phone: '3001234567', country_code: '57', guest_addresses: [address], shipping_address_id: address.id, billing_address_id: address.id }));
  });
}

for (const { signedIn, layout } of [{ signedIn: false, layout: 'product_thumbnail' }, { signedIn: true, layout: 'product_thumbnail' }, { signedIn: false, layout: 'product_accordion' }]) {
  test(`the package adds this product plus the chosen related product (${signedIn ? 'account' : 'guest'}, ${layout})`, async ({ page }, testInfo) => {
    const state = await openProduct(page, { crossSell: true, signedIn, layout });
    await expect.poll(() => page.evaluate(() => (window.dataLayer || []).some((args) => args[0] === 'config'))).toBe(true);
    await buildPackage(page);
    await page.screenshot({ path: testInfo.outputPath('package-selected.png') });
    await page.locator('.bundle-btn').click();
    await expect.poll(() => page.evaluate(() => (window.dataLayer || []).filter((args) => args[0] === 'event' && args[1] === 'add_to_cart').length)).toBe(1);
    const event = await page.evaluate(() => window.dataLayer.find((args) => args[0] === 'event' && args[1] === 'add_to_cart')[2]);
    expect(event).toMatchObject({ value: 170000, items: [{ item_id: base.id, price: 90000, quantity: 1 }, { item_id: child.id, price: 80000, quantity: 1, item_variant: 'Large' }] });
    if (signedIn) {
      expect(packageOf(state.adds)).toEqual(expectedPackage);
    } else {
      const items = await page.evaluate(() => JSON.parse(localStorage.getItem('cart')).items);
      expect(packageOf(items)).toEqual(expectedPackage);
      expect(items.map((line) => line.sub_total)).toEqual([90000, 80000]);
    }
    expect(state.errors).toEqual([]);
  });
}

test('the package follows the variant chosen for this product', async ({ page }) => {
  const fixture = catalog.data[0];
  const parentOverride = { ...crossSellParent, type: 'classified', attributes: fixture.attributes, variations: fixture.variations };
  const state = await openProduct(page, { crossSell: true, parentOverride });
  const boxes = page.locator('.bundle .bundle-box');
  // La ficha abre con la variante vendible más barata (Brown, 15).
  await expect(boxes.nth(0)).toContainText('Brown');
  await expect(page.locator('.bundle .total-price')).toContainText('15');
  await boxes.nth(1).locator('input[type="checkbox"]').check();
  await page.locator('.bundle select').selectOption(largeId);
  await expect(page.locator('.bundle .total-price')).toContainText('80.015');
  await page.locator('li[title="Green"] img').first().click();
  await expect(boxes.nth(0)).toContainText('Green');
  await expect(page.locator('.bundle .total-price')).toContainText('80.016');
  await page.locator('.bundle-btn').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '{}').items?.length)).toBe(2);
  const items = await page.evaluate(() => JSON.parse(localStorage.getItem('cart')).items);
  expect(packageOf(items)).toEqual([{ product_id: base.id, variation_id: String(fixture.variations[1].id), quantity: 1 }, { product_id: child.id, variation_id: largeId, quantity: 1 }]);
  expect(items.map((line) => line.sub_total)).toEqual([16, 80000]);
  expect(state.errors).toEqual([]);
});

test('guest package reaches checkout with both lines and their sum', async ({ page }, testInfo) => {
  const state = await openProduct(page, { crossSell: true });
  await buildPackage(page);
  await page.locator('.bundle-btn').click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('cart') || '{}').items?.length)).toBe(2);
  await seedGuestDraft(page);
  await page.goto(`${baseURL}/checkout`);
  await expect(page.locator('.checkout-details .qty > li')).toHaveCount(2);
  await expect(page.locator('.list-total .count')).toContainText('170.000');
  await expect(page.locator('.box-loader')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('package-checkout.png'), fullPage: true });
  await page.locator('#checkout-terms-accepted').check();
  await page.locator('.order-btn').click();
  await expect.poll(() => state.payments.length).toBe(1);
  expect(packageOf(state.payments[0].products)).toEqual(expectedPackage);
  expect(state.errors).toEqual([]);
});

test('guest bundle choices reach checkout and survive signing in', async ({ page }) => {
  const state = await openProduct(page);
  await page.locator('.bundle select').nth(0).selectOption(largeId);
  await page.locator('.bundle select').nth(1).selectOption(smallId);
  await page.locator('.bundle-btn').click();
  await page.evaluate(() => {
    const address = { id: 'guest-1', title: 'Casa', street: 'Calle 10 # 20-30', city: 'Bogotá', phone: '3001234567', country_code: '57', country_id: '48', state_id: '1', pincode: '110111' };
    sessionStorage.setItem('xdope_checkout_guest_draft', JSON.stringify({ name: 'QA Buyer', email: 'qa@example.com', phone: '3001234567', country_code: '57', guest_addresses: [address], shipping_address_id: address.id, billing_address_id: address.id }));
  });
  await page.goto(`${baseURL}/checkout`);
  await expect(page.locator('.list-total .count')).toContainText('90.000');
  await expect(page.locator('.box-loader')).toHaveCount(0);
  await page.locator('#checkout-terms-accepted').check();
  await page.locator('.order-btn').click();
  await expect.poll(() => state.payments.length).toBe(1);
  const wanted = [{ product_id: child.id, variation_id: largeId }, { product_id: secondChild.id, variation_id: smallId }];
  expect(state.payments[0].products[0].bundle_selections).toEqual(wanted);
  await page.context().addCookies([{ name: 'uat', value: 'qa-session', domain: new URL(baseURL).hostname, path: '/' }]);
  await page.goto(`${baseURL}/cart`);
  await expect.poll(() => state.syncs.length).toBe(1);
  expect(state.syncs[0].cart[0].bundle_selections).toEqual(wanted);
  expect(state.errors).toEqual([]);
});
