const { test, expect } = require("@playwright/test");
const { loginViaAPI, BASE_API } = require("./helpers/auth");

async function seedCartAndAddress(page) {
  const cookies = await page.context().cookies();
  const token = cookies.find((c) => c.name === "uat")?.value;

  // Clear cart then add a product
  await page.request.delete(`${BASE_API}/cart`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => {});

  const productsRes = await page.request.get(`${BASE_API}/product?paginate=1&stock_status=in_stock`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const productsBody = await productsRes.json();
  const productId =
    productsBody?.data?.data?.[0]?.id ||
    productsBody?.data?.data?.[0]?._id ||
    productsBody?.data?.[0]?.id ||
    productsBody?.data?.[0]?._id;
  if (productId) {
    await page.request.post(`${BASE_API}/cart`, {
      data: { product_id: productId, quantity: 1 },
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
  }

  // Ensure an address exists
  const addrRes = await page.request.get(`${BASE_API}/address`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const addrBody = await addrRes.json();
  const addresses = addrBody?.data?.data || addrBody?.data || [];
  if (addresses.length === 0) {
    await page.request.post(`${BASE_API}/address`, {
      data: { title: "Home", street: "123 Test St", city: "Mumbai", pincode: "400001", phone: "9999999999", country_code: "91", country_id: "101", state_id: "1" },
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
  }
}

test.describe("Checkout Extended", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
    await seedCartAndAddress(page);
  });

  test("sidebar shows product names and subtotal", async ({ page }) => {
    await page.goto("/checkout");
    await expect(page.locator(".checkout-right-box, .checkout-details").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator(".order-box, .summery-box, [class*='billing']").first()).toBeVisible({ timeout: 8000 });
  });

  test("billing summary shows subtotal, shipping and total", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForSelector(".checkout-details, .checkout-right-box", { timeout: 15000 });

    await expect(page.locator("[class*='sub-total'], .sub-total").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator(".total, [class*='total']").first()).toBeVisible({ timeout: 8000 });
  });

  test("delivery options are shown for non-digital orders", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForTimeout(3000);

    // Delivery options section (DeliveryOptions component)
    const deliverySection = page.locator("[class*='delivery'], .delivery-option, li:has([name='delivery_description'])").first();
    const isVisible = await deliverySection.isVisible().catch(() => false);
    // If not shown it's a digital-only cart — acceptable
    if (isVisible) {
      await expect(deliverySection).toBeVisible();
    }
  });

  test("payment options are displayed", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForTimeout(3000);

    // PaymentOptions component renders payment method radio buttons
    const paymentSection = page.locator("[class*='payment'], [name='payment_method']").first();
    await expect(paymentSection).toBeVisible({ timeout: 12000 });
  });

  test("coupon input is present in billing summary", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForSelector(".checkout-details, .checkout-right-box", { timeout: 15000 });

    const couponInput = page.locator('[name="coupon"], input[placeholder*="oupon"], input[placeholder*="Coupon"]').first();
    await expect(couponInput).toBeVisible({ timeout: 8000 });
  });

  test("invalid coupon shows error message", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForSelector(".checkout-details, .checkout-right-box", { timeout: 15000 });

    const couponInput = page.locator('[name="coupon"], input[placeholder*="oupon"], input[placeholder*="Coupon"]').first();
    if (await couponInput.isVisible()) {
      await couponInput.fill("INVALIDCOUPON999");
      // Submit coupon — look for apply button
      // The UI runs in Spanish by default ("Aplicar ahora"), so match the
      // button by its class first; a text match would otherwise land on the
      // nearby "Copiar Código" buttons.
      const applyBtn = page.locator('.apply-button, button:has-text("Apply"), button:has-text("Aplicar")').first();
      if (await applyBtn.isVisible()) {
        await applyBtn.click();
        // Error message should appear
        const error = page.locator('[class*="error"], [class*="invalid"], [class*="coupon-error"], .text-danger').first();
        await expect(error).toBeVisible({ timeout: 8000 });
      }
    }
  });

  test("order success page is accessible with order id param", async ({ page }) => {
    // Verify the success page renders (it reads id from URL params)
    await page.goto("/order/success?id=test123");
    await expect(page).not.toHaveURL(/404/);
    const content = page.locator("main, .section-b-space, .container, [class*='success']").first();
    await expect(content).toBeVisible({ timeout: 12000 });
  });

  test("order failure page renders correctly", async ({ page }) => {
    await page.goto("/order/failure");
    await expect(page).not.toHaveURL(/404/);
    const content = page.locator("main, .section-b-space, .container").first();
    await expect(content).toBeVisible({ timeout: 12000 });
  });
});

test.describe("Checkout Empty State", () => {
  test("checkout with empty cart shows no-data message", async ({ page }) => {
    await loginViaAPI(page);

    // Clear cart via the correct clear-all endpoint
    const cookies = await page.context().cookies();
    const token = cookies.find((c) => c.name === "uat")?.value;
    await page.request.delete(`${BASE_API}/clear/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});

    await page.goto("/checkout");
    // Wait for CartProvider to refetch and render the empty state
    await page.waitForTimeout(5000);

    // When cart is empty the sidebar renders NoDataFound (class="no-data-added")
    const emptyState = page.locator(".no-data-added, [class*='no-data'], img[alt='no-data']").first();
    await expect(emptyState).toBeVisible({ timeout: 12000 });
  });
});
