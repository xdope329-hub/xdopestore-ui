const { test, expect } = require('@playwright/test');
const { dismissNewsletterModal, BASE_API } = require('./helpers/auth');

// Real QA catalog and checkout quotes; payment submission is intercepted so
// these browser checks never create an order or contact a payment gateway.
test.setTimeout(60000);
let product, variation, price;
const money = (value) => Math.round(value).toLocaleString('es-CO');
const shipping = (page) => page.locator('.sub-total > li').nth(1).locator('.count');
const total = (page) => page.locator('.list-total .count');
const address = (id, city) => ({ id, city, title: city, street: 'Calle 10 # 20-30', phone: '3001234567', country_code: '57', country_id: '48', state_id: '1', pincode: '110111' });
const addresses = [address('guest-bogota', 'Bogotá'), address('guest-leticia', 'Leticia')];

test.beforeAll(async ({ request }) => {
  const res = await request.get(`${BASE_API}/product?paginate=10&stock_status=in_stock`);
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  const products = body.data?.data || body.data;
  product = products.find((p) => p.variations?.some((v) => v.quantity >= 2 && Number(v.sale_price || v.price) > 100000 && Number(v.sale_price || v.price) < 200000));
  expect(product, 'QA needs a stocked variant below the free-shipping threshold').toBeTruthy();
  variation = product.variations.find((v) => v.quantity >= 2 && Number(v.sale_price || v.price) > 100000 && Number(v.sale_price || v.price) < 200000);
  price = Number(variation.sale_price || variation.price);
});

async function openCheckout(page, { withAddress = false, stalePrice = false } = {}) {
  await dismissNewsletterModal(page);
  await page.route('**/payment/initialize', (route) => route.fulfill({ status: 503, json: { message: 'QA: payment unavailable' } }));
  await page.addInitScript(({ product, variation, price, addresses, withAddress, stalePrice }) => {
    if (sessionStorage.getItem('qa_seeded')) return;
    sessionStorage.setItem('qa_seeded', '1');
    const shownPrice = stalePrice ? price - 10000 : price;
    const item = { id: null, product, product_id: product.id || product._id, variation: { ...variation, price: shownPrice, sale_price: shownPrice }, variation_id: variation.id || variation._id, quantity: 1, sub_total: shownPrice };
    localStorage.setItem('cart', JSON.stringify({ items: [item], total: shownPrice }));
    if (withAddress) sessionStorage.setItem('xdope_checkout_guest_draft', JSON.stringify({ name: 'QA Checkout', email: 'qa-checkout@example.com', phone: '3001234567', country_code: '57', guest_addresses: addresses, shipping_address_id: addresses[0].id, billing_address_id: addresses[0].id }));
  }, { product, variation, price, addresses, withAddress, stalePrice });
  await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.checkout-right-box')).toBeVisible();
  await expect(page.locator('input[name="payment_method"]:checked')).toHaveCount(1);
  await expect(page.locator('.box-loader')).toHaveCount(0);
  await expect(total(page)).toContainText(money(price + (withAddress ? 9900 : 0)));
}

for (const width of [1280, 390]) {
  test(`banner stays visible without covering navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await openCheckout(page);
    for (const y of [400, 1000, 0]) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await expect.poll(async () => page.locator('.announcement-bar').evaluate((el) => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(1);
      if (y) {
        await expect(page.locator('header')).toHaveClass(/sticky/);
        await expect.poll(async () => page.evaluate(() => document.querySelector('header').getBoundingClientRect().top - document.querySelector('.announcement-bar').getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(-1);
      }
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: test.info().outputPath(`checkout-${width}.png`), fullPage: true });
  });
}

test('initial shipping is zero and total equals subtotal', async ({ page }) => {
  await openCheckout(page);
  await expect(shipping(page)).toHaveText(/\$\s*0/);
  await expect(total(page)).toContainText(money(price));
  await expect(page.locator('.sub-total')).not.toContainText('Envío gratis');
});

test('changing shipping city changes the rate; billing city does not', async ({ page }) => {
  await openCheckout(page, { withAddress: true });
  await page.locator('[name="shipping_address_id"][value="guest-leticia"]').check({ force: true });
  await expect(shipping(page)).toContainText('14.900');
  await expect(total(page)).toContainText(money(price + 14900));
  await page.locator('[name="billing_address_id"][value="guest-leticia"]').check({ force: true });
  await page.locator('[name="shipping_address_id"][value="guest-bogota"]').check({ force: true });
  await expect(shipping(page)).toContainText('9.900');
  await expect(total(page)).toContainText(money(price + 9900));
});

test('quantity crosses free-shipping threshold and returns to paid shipping', async ({ page }) => {
  await openCheckout(page, { withAddress: true });
  await page.locator('.checkout-right-box .quantity-left-plus').click();
  await expect(shipping(page)).toContainText(/gratis/i);
  await expect(total(page)).toContainText(money(price * 2));
  await page.locator('.checkout-right-box .quantity-left-minus').click();
  await expect(shipping(page)).toContainText('9.900');
  await expect(total(page)).toContainText(money(price + 9900));
});

test('guest contact and selected shipping city survive reload', async ({ page }) => {
  await openCheckout(page, { withAddress: true });
  await page.locator('[name="shipping_address_id"][value="guest-leticia"]').check({ force: true });
  await expect(shipping(page)).toContainText('14.900');
  await page.reload();
  await expect(page.locator('input[name="email"]')).toHaveValue('qa-checkout@example.com');
  await expect(page.locator('[name="shipping_address_id"][value="guest-leticia"]')).toBeChecked();
  await expect(shipping(page)).toContainText('14.900');
});

test('invalid coupon keeps the selected city shipping and total', async ({ page }) => {
  await openCheckout(page, { withAddress: true });
  await page.locator('[name="coupon"]').fill('QA_INVALID_20260910');
  await page.locator('.apply-button').click();
  await expect(page.locator('.coupon-error')).toBeVisible();
  await expect(shipping(page)).toContainText('9.900');
  await expect(total(page)).toContainText(money(price + 9900));
  await page.locator('[name="shipping_address_id"][value="guest-leticia"]').check({ force: true });
  await expect(shipping(page)).toContainText('14.900');
  await expect(page.locator('.coupon-error')).toHaveCount(0);
});

test('latest city wins when quote responses arrive out of order', async ({ page }) => {
  await openCheckout(page, { withAddress: true });
  await page.route('**/checkout', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const body = route.request().postDataJSON();
    const response = await route.fetch();
    if (body.city === 'Leticia') await new Promise((resolve) => setTimeout(resolve, 1200));
    await route.fulfill({ response });
  });
  const pending = page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/checkout') && r.postDataJSON().city === 'Leticia');
  await page.locator('label[for="address-shipping-1"] .delivery-address-detail p').click();
  await expect(page.locator('[name="shipping_address_id"][value="guest-leticia"]')).toBeChecked();
  await pending;
  await page.locator('label[for="address-shipping-0"] .delivery-address-detail p').click();
  await expect(page.locator('[name="shipping_address_id"][value="guest-bogota"]')).toBeChecked();
  await expect(shipping(page)).toContainText('9.900');
  await page.waitForTimeout(1600);
  await expect(shipping(page)).toContainText('9.900');
});

test('payment failure preserves cart and contact fields', async ({ page }) => {
  await openCheckout(page, { withAddress: true });
  const calls = [];
  page.on('request', (r) => { if (r.url().endsWith('/payment/initialize')) calls.push(r.postDataJSON()); });
  await page.locator('.order-btn').click();
  await expect(page.locator('.Toastify__toast--error').filter({ hasText: 'QA: payment unavailable' })).toBeVisible();
  expect(calls).toHaveLength(1);
  expect(calls[0].shipping_address.city).toBe('Bogotá');
  expect(calls[0].products[0].variation_id).toBe(variation.id || variation._id);
  expect(calls[0]).not.toHaveProperty('password');
  await expect(page.locator('input[name="email"]')).toHaveValue('qa-checkout@example.com');
  await expect(page.locator('.checkout-right-box .qty-input')).toHaveValue('1');
  await expect(page.locator('.order-btn')).toBeEnabled();
});

test('removing the final item displays the empty-cart state', async ({ page }) => {
  await openCheckout(page);
  await page.locator('.checkout-remove-item').click();
  await expect(page.locator('.checkout-right-box')).toHaveCount(0);
  await expect(page.locator('.order-btn')).toHaveCount(0);
  await expect(page.locator('body')).toContainText(/vacío/i);
});

test('server price changes are reflected in checkout summary', async ({ page }) => {
  await openCheckout(page, { withAddress: true, stalePrice: true });
  await expect(total(page)).toContainText(money(price + 9900));
  await expect(page.locator('.checkout-price-update')).toBeVisible();
  await expect(page.locator('.cart-content h5')).toContainText(money(price));
});

test('quote failure displays a clear error and prevents payment until recalculated', async ({ page }) => {
  await openCheckout(page, { withAddress: true });
  await page.route('**/checkout', (route) => route.request().method() === 'POST' ? route.fulfill({ status: 503, json: { message: 'QA: quote unavailable' } }) : route.continue());
  await page.locator('[name="shipping_address_id"][value="guest-leticia"]').check({ force: true });
  await expect(page.locator('.checkout-quote-error')).toBeVisible();
  const calls = [];
  page.on('request', (r) => { if (r.url().endsWith('/payment/initialize')) calls.push(r.url()); });
  await page.locator('.order-btn').click();
  await page.waitForTimeout(800);
  expect(calls, 'no order should be submitted with an unknown shipping total').toHaveLength(0);
  await page.unroute('**/checkout');
  await page.locator('.checkout-quote-error button').click();
  await expect(shipping(page)).toContainText('14.900');
  await expect(page.locator('.checkout-quote-error')).toHaveCount(0);
  await page.locator('.order-btn').click();
  await expect.poll(() => calls.length).toBe(1);
});

test('guest can add and edit a delivery address through the modal', async ({ page }) => {
  await openCheckout(page);
  const addressPosts = [];
  page.on('request', (r) => { if (r.method() === 'POST' && r.url().endsWith('/address')) addressPosts.push(r.url()); });
  await page.getByText('Agregar nueva', { exact: true }).first().click();
  const modal = page.locator('.modal.show');
  await modal.locator('button[type="submit"]').click();
  await expect(modal.locator('input[name="street"]')).toHaveClass(/is-invalid/);
  await modal.locator('input[name="street"]').fill('Calle 10 # 20-30');
  await modal.locator('input[name="title"]').fill('Casa QA');
  await modal.locator('input[name="phone"]').fill('3001234567');
  async function select(name, text) {
    const box = modal.locator('.custom-select-box').filter({ has: page.locator(`input[id="${name}"]`) });
    await box.locator('input[readonly]').click();
    await box.locator('li').filter({ has: page.getByText(text, { exact: true }) }).click();
  }
  await select('state_id', 'Bogotá D.C.');
  await select('city', 'Bogotá');
  await modal.locator('button[type="submit"]').click();
  await expect(modal).toHaveCount(0);
  await expect(shipping(page)).toContainText('9.900');
  await page.locator('label[for="address-shipping-0"] .address-edit-btn').click();
  await expect(modal.locator('input[name="street"]')).toHaveValue('Calle 10 # 20-30');
  await select('state_id', 'Amazonas');
  await expect(modal.getByText('Elegir una ciudad de la lista', { exact: true })).toHaveCount(0);
  await select('city', 'Leticia');
  await modal.locator('button[type="submit"]').click();
  await expect(modal).toHaveCount(0);
  await expect(shipping(page)).toContainText('14.900');
  expect(addressPosts).toHaveLength(0);
  // Custom towns must still be preserved when reopening an address.
  await page.locator('label[for="address-shipping-0"] .address-edit-btn').click();
  await select('city', 'Otra ciudad (no está en la lista)');
  await modal.locator('input[name="city"]').fill('Ciudad QA');
  await modal.locator('button[type="submit"]').click();
  await expect(modal).toHaveCount(0);
  await page.locator('label[for="address-shipping-0"] .address-edit-btn').click();
  await expect(modal.locator('input[name="city"]')).toBeEditable();
  await expect(modal.locator('input[name="city"]')).toHaveValue('Ciudad QA');
});

test('network failure allows quote retry without submitting an order', async ({ page }) => {
  await openCheckout(page, { withAddress: true });
  await page.route('**/checkout', (route) => route.request().method() === 'POST' ? route.abort('failed') : route.continue());
  await page.locator('[name="shipping_address_id"][value="guest-leticia"]').check({ force: true });
  await expect(page.locator('.checkout-quote-error')).toBeVisible();
  await expect(page.locator('.box-loader')).toHaveCount(0);
  const calls = [];
  page.on('request', (r) => { if (r.url().endsWith('/payment/initialize')) calls.push(r.url()); });
  await page.locator('.order-btn').click();
  await expect(page.locator('.Toastify__toast--error')).toBeVisible();
  expect(calls).toHaveLength(0);
  await page.unroute('**/checkout');
  await page.locator('.checkout-quote-error button').click();
  await expect(shipping(page)).toContainText('14.900');
});

test('pending destination quote blocks payment until its total is ready', async ({ page }) => {
  await openCheckout(page, { withAddress: true });
  let release;
  const waiting = new Promise((resolve) => { release = resolve; });
  await page.route('**/checkout', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    await waiting;
    await route.continue();
  });
  await page.locator('[name="shipping_address_id"][value="guest-leticia"]').check({ force: true });
  await expect(page.locator('.box-loader')).toBeVisible();
  const calls = [];
  page.on('request', (r) => { if (r.url().endsWith('/payment/initialize')) calls.push(r.url()); });
  // Keyboard activation can reach the button beneath the loading overlay.
  try {
    await page.locator('.order-btn').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.Toastify__toast--error')).toBeVisible();
    expect(calls).toHaveLength(0);
  } finally { release(); }
  await expect(shipping(page)).toContainText('14.900');
});

test('valid coupon survives city changes and removal restores the full total', async ({ page }) => {
  await openCheckout(page, { withAddress: true });
  // QA has no published coupons. Use a controlled discount response with
  // real cart and city calculations to verify the UI coupon lifecycle.
  await page.route('**/checkout', async (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    const payload = route.request().postDataJSON();
    if (payload.coupon_code !== 'QA_VALID') return route.continue();
    const response = await route.fetch({ postData: { ...payload, coupon_code: '' } });
    const body = await response.json();
    await route.fulfill({ response, json: { ...body, coupon_total_discount: 10000, total: body.total - 10000, applied_coupon: { code: 'QA_VALID', type: 'fixed', amount: 10000 } } });
  });
  await page.locator('[name="coupon"]').fill('QA_VALID');
  await page.locator('.apply-button').click();
  await expect(page.locator('.offer-apply-box')).toBeVisible();
  await expect(total(page)).toContainText(money(price + 9900 - 10000));
  await page.locator('[name="shipping_address_id"][value="guest-leticia"]').check({ force: true });
  await expect(total(page)).toContainText(money(price + 14900 - 10000));
  await page.locator('.close-coupon').click();
  await expect(total(page)).toContainText(money(price + 14900));
  await expect(page.locator('.offer-apply-box')).toHaveCount(0);
});
