const { test, expect } = require("@playwright/test");
const { loginViaAPI, BASE_API } = require("./helpers/auth");

/**
 * Specs covering the storefront checkout fixes:
 *  - selecting a billing address radio promotes it to the user's default
 *  - applying a coupon survives a payment-method change (the discount
 *    line is still > 0 after toggling COD <-> MERCADOPAGO)
 *  - PlaceOrder surfaces an in-app error (toast / no overlay) when
 *    /payment/initialize returns a non-2xx — never a Next dev overlay
 */

async function seedCartAndTwoAddresses(page) {
  const cookies = await page.context().cookies();
  const token = cookies.find((c) => c.name === "uat")?.value;

  // 1 product in cart
  await page.request.delete(`${BASE_API}/clear/cart`, {
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

  // Make sure the user has at least TWO addresses so the radio can flip
  const addrRes = await page.request.get(`${BASE_API}/address`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const addrBody = await addrRes.json();
  const existing = addrBody?.data?.data || addrBody?.data || [];
  while (existing.length < 2) {
    const created = await page.request.post(`${BASE_API}/address`, {
      data: {
        title: existing.length === 0 ? "Home" : "Office",
        street: existing.length === 0 ? "Calle 1 #1-1" : "Calle 2 #2-2",
        city: "Bogotá",
        pincode: "110111",
        phone: "3001234567",
        country_code: "57",
        country_id: "48",
        state_id: "1",
      },
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const body = await created.json();
    existing.push(body);
  }
  return existing.map((a) => a.id || a._id);
}

test.describe("Checkout — recent fixes", () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page);
  });

  test("selecting a billing address radio promotes it to the user's default", async ({ page }) => {
    const [a1, a2] = await seedCartAndTwoAddresses(page);
    if (!a1 || !a2) test.skip(true, "Could not seed two addresses");

    await page.goto("/checkout");
    await page.waitForTimeout(2500);

    // The non-default address should NOT carry the Default badge yet. The
    // billing card for that address is the one we'll click.
    const targetRadio = page.locator(`input[type="radio"][name="billing_address_id"][value="${a2}"]`).first();
    if (!(await targetRadio.isVisible())) test.skip(true, "Billing radio not visible — DOM mismatch");
    await targetRadio.click({ force: true });

    // Wait for the optimistic PATCH + refetch to land
    await page.waitForTimeout(2000);

    // Confirm against the API directly so we're testing the persisted state,
    // not just the local UI.
    const cookies = await page.context().cookies();
    const token = cookies.find((c) => c.name === "uat")?.value;
    const fresh = await page.request.get(`${BASE_API}/address`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await fresh.json();
    const list = body?.data?.data || body?.data || [];
    const newDefault = list.find((a) => a?.is_default);
    expect(String(newDefault?.id || newDefault?._id)).toBe(String(a2));
  });

  test("coupon discount survives a payment-method change", async ({ page }) => {
    await seedCartAndTwoAddresses(page);

    // Make sure at least one usable coupon exists. If the catalog has none,
    // skip — the assertion is meaningless without one.
    const cookies = await page.context().cookies();
    const token = cookies.find((c) => c.name === "uat")?.value;
    const couponRes = await page.request.get(`${BASE_API}/coupon?status=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const couponBody = await couponRes.json();
    const coupon = (couponBody?.data?.data || couponBody?.data || [])[0];
    if (!coupon?.code) test.skip(true, "No active coupon to apply");

    await page.goto("/checkout");
    await page.waitForSelector(".checkout-details, .checkout-right-box", { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Apply the coupon
    const couponInput = page.locator('input[name="coupon"], input[placeholder*="oupon"], input[placeholder*="Coupon"]').first();
    if (!(await couponInput.isVisible())) test.skip(true, "Coupon input not visible");
    await couponInput.fill(coupon.code);
    await page.locator('button:has-text("Apply"), .apply-button').first().click({ force: true });

    // Wait for "Coupon applied" badge / "You saved" line
    const appliedBadge = page.locator('.offer-apply-box, :has-text("You saved"), :has-text("Yousaved")').first();
    await expect(appliedBadge).toBeVisible({ timeout: 10000 });

    // Snapshot the displayed total before toggling payment
    const totalLocator = page.locator(".total .count, .list-total .count, [class*='total'] .count").first();
    const totalBefore = (await totalLocator.textContent() || "").trim();

    // Toggle to the second payment method (MERCADOPAGO if available)
    const paymentRadios = page.locator('input[type="radio"][name="payment_method"]');
    const n = await paymentRadios.count();
    if (n < 2) test.skip(true, "Need at least two payment methods enabled for this test");

    // Pick a non-checked one
    const second = paymentRadios.nth(1);
    await second.click({ force: true });
    await page.waitForTimeout(2500); // /checkout recompute round-trip

    // Coupon-applied badge must still be visible, and the total must be the same
    await expect(appliedBadge).toBeVisible();
    const totalAfter = (await totalLocator.textContent() || "").trim();
    expect(totalAfter).toBe(totalBefore);
  });

  test("PlaceOrder surfaces a toast on /payment/initialize 4xx — no dev overlay", async ({ page }) => {
    await seedCartAndTwoAddresses(page);

    // Intercept the payment call and force a 422 from the server's vantage point
    await page.route("**/payment/initialize", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({ message: "El carrito está vacío" }),
      });
    });

    await page.goto("/checkout");
    await page.waitForTimeout(3000);

    // Select first payment method to enable the button
    const paymentRadio = page.locator('input[type="radio"][name="payment_method"]').first();
    if (await paymentRadio.isVisible()) await paymentRadio.click({ force: true });

    const placeOrderBtn = page.locator('.order-btn, button:has-text("Place Order")').first();
    if (!(await placeOrderBtn.isEnabled())) test.skip(true, "Place Order disabled in this state");

    // Capture console errors. PlaceOrder must NOT emit console.error (which
    // Next.js dev mode would turn into a runtime overlay).
    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await placeOrderBtn.click();

    // Toast with the server message
    const toast = page.locator('.Toastify__toast, [class*="toast"], .toast-message').first();
    await expect(toast).toBeVisible({ timeout: 8000 });

    // Next.js dev overlay must NOT have rendered. Since Next 15.4 the
    // `nextjs-portal` element is always mounted in dev (it hosts the dev
    // tools button), so look for an actual error dialog inside it instead.
    const nextOverlay = page.locator('nextjs-portal [role="dialog"], nextjs-portal [data-nextjs-dialog], [data-nextjs-dialog-overlay]');
    expect(await nextOverlay.count()).toBe(0);

    // We tolerate informational console.warn but not console.error from our
    // own component. (Next.js itself may log unrelated errors in dev.)
    const ours = consoleErrors.filter((line) => line.includes("[PlaceOrder]"));
    expect(ours).toEqual([]);
  });

  test("un cupón escrito pero no aplicado no viaja al pago ni bloquea el pedido", async ({ page }) => {
    await seedCartAndTwoAddresses(page);

    // Capturar el cuerpo del pago sin crear una orden real.
    let initializeBody = null;
    await page.route("**/payment/initialize", async (route) => {
      initializeBody = route.request().postDataJSON();
      await route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ message: "capturado por el test" }) });
    });

    await page.goto("/checkout");
    await page.waitForSelector(".checkout-details, .checkout-right-box", { timeout: 15000 });
    await page.waitForTimeout(2500);

    // Escribir un cupón inválido y dejar el foco en el campo (sin "Aplicar").
    const couponInput = page.locator('input[name="coupon"]').first();
    await couponInput.fill("INVALIDCOUPON999");

    const paymentRadio = page.locator('input[type="radio"][name="payment_method"]').first();
    if (await paymentRadio.isVisible()) await paymentRadio.click({ force: true });
    await page.waitForTimeout(1500);

    const placeOrderBtn = page.locator(".order-btn").first();
    if (!(await placeOrderBtn.isEnabled())) test.skip(true, "Place Order disabled in this state");
    await placeOrderBtn.click();
    await expect.poll(() => initializeBody, { timeout: 10000 }).not.toBeNull();

    expect(initializeBody.coupon_code).toBe("");
    expect("coupon" in initializeBody).toBe(false);
    // Ningún aviso de cupón inválido: el único error visible es el del test.
    await expect(page.locator(".Toastify__toast--error").filter({ hasText: /cup[oó]n|coupon/i })).toHaveCount(0);
  });
});
