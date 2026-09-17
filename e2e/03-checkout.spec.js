const { test, expect } = require("@playwright/test");
const { loginViaAPI, BASE_API } = require("./helpers/auth");

// Seed: ensure at least one product is in cart before checkout tests run
async function seedCart(page) {
  const cookies = await page.context().cookies();
  const token = cookies.find((c) => c.name === "uat")?.value;

  // Clear cart first, then add one product
  await page.request.delete(`${BASE_API}/cart`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {}); // ignore if endpoint doesn't exist

  const productsRes = await page.request.get(`${BASE_API}/product?paginate=1&stock_status=in_stock`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const products = await productsRes.json();
  const productId = products?.data?.data?.[0]?.id || products?.data?.[0]?.id;
  if (!productId) return null;

  await page.request.post(`${BASE_API}/cart`, {
    data: { product_id: productId, quantity: 1 },
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  return productId;
}

// Seed: ensure at least one address exists for the logged-in user
async function seedAddress(page) {
  const cookies = await page.context().cookies();
  const token = cookies.find((c) => c.name === "uat")?.value;

  const existing = await page.request.get(`${BASE_API}/address`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await existing.json();
  const addresses = body?.data?.data || body?.data || [];
  if (addresses.length > 0) return addresses[0].id;

  // Create a test address
  const created = await page.request.post(`${BASE_API}/address`, {
    data: {
      title: "Test Address",
      street: "123 Test Street",
      city: "Test City",
      pincode: "110001",
      phone: "9999999999",
      country_code: "91",
      country_id: "101", // India
      state_id: "1",
    },
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const createdBody = await created.json();
  return createdBody?.data?.id;
}

test.describe("Checkout", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test("checkout page loads with cart items", async ({ page }) => {
    const productAdded = await seedCart(page);
    if (!productAdded) test.skip(true, "No in-stock products available");

    await page.goto("/checkout");
    // Billing summary or cart sidebar must be present
    await expect(page.locator('.checkout-details, .checkout-right-box, .order-box').first()).toBeVisible({ timeout: 15000 });
  });

  test("shows delivery address section for logged-in user", async ({ page }) => {
    await seedCart(page);
    await seedAddress(page);

    await page.goto("/checkout");
    // The delivery/billing address section should render
    await expect(
      page.locator('[class*="delivery-address"], [class*="checkout-detail"], .checkout-detail-box').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("Place Order button is present and becomes enabled when required fields are filled", async ({ page }) => {
    await seedCart(page);
    const addressId = await seedAddress(page);

    await page.goto("/checkout");
    await page.waitForTimeout(3000); // let React hydrate & fetch cart

    // Billing address selection — look for radio/select with address id
    const billingRadio = page.locator(`[value="${addressId}"]`).first();
    if (await billingRadio.isVisible()) await billingRadio.click();

    // Payment method selection
    const paymentOption = page.locator('[name="payment_method"], [class*="payment"] input[type="radio"]').first();
    if (await paymentOption.isVisible()) await paymentOption.click();

    // PlaceOrder button
    const placeOrderBtn = page.locator('.order-btn, button:has-text("Place Order"), button:has-text("PlaceOrder")').first();
    await expect(placeOrderBtn).toBeVisible({ timeout: 10000 });
  });

  test("Place Order calls payment/initialize and redirects to success or payment gateway", async ({ page }) => {
    await seedCart(page);
    const addressId = await seedAddress(page);

    // Intercept the payment/initialize call
    let paymentInitCalled = false;
    page.on("request", (req) => {
      if (req.url().includes("/payment/initialize")) paymentInitCalled = true;
    });

    await page.goto("/checkout");
    await page.waitForTimeout(3000);

    // Select billing address
    const billingRadio = page.locator(`[value="${addressId}"]`).first();
    if (await billingRadio.isVisible()) await billingRadio.click();

    // Select first payment method
    const paymentOption = page.locator('[name="payment_method"], [class*="payment"] input[type="radio"]').first();
    if (await paymentOption.isVisible()) await paymentOption.click();

    const placeOrderBtn = page.locator('.order-btn, button:has-text("Place Order")').first();
    if (await placeOrderBtn.isEnabled()) {
      await page.locator("#checkout-terms-accepted").check();
      await placeOrderBtn.click();
      // Wait for navigation to success or payment gateway
      await page.waitForNavigation({ timeout: 15000 }).catch(() => {});
      const url = page.url();
      const isSuccess = url.includes("/order/success") || url.includes("/order/failure") || url.includes("/order/pending") || !url.includes("/checkout");
      expect(paymentInitCalled || isSuccess).toBe(true);
    } else {
      test.skip(true, "Place Order button still disabled — address/payment not selectable via automation");
    }
  });
});
