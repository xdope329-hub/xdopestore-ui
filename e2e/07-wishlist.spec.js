const { test, expect } = require("@playwright/test");
const { loginViaAPI, dismissNewsletterModal, BASE_API } = require("./helpers/auth");

test.describe("Wishlist", () => {
  test("guest clicking header wishlist icon opens the wishlist page", async ({ page }) => {
    await dismissNewsletterModal(page);
    await page.goto("/");

    // The heart/wishlist icon is the 1st li.onhover-div in .icon-nav
    await page.locator(".icon-nav li.onhover-div").first().click();
    await expect(page).toHaveURL(/wishlist/, { timeout: 8000 });
    await expect(page.locator(".auth-modal")).not.toBeVisible();
  });

  test("guest can add a product without logging in and see it in the wishlist", async ({ page }) => {
    await dismissNewsletterModal(page);
    await page.goto("/collections");
    await page.waitForSelector(".basic-product", { timeout: 15000 });

    const wishlistButton = page.locator(".basic-product .wishlist-icon").first();
    await expect(wishlistButton).toBeVisible({ timeout: 5000 });
    await wishlistButton.click();

    await expect(page.locator(".auth-modal")).not.toBeVisible();
    await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem("wishlist") || "[]").length)).toBeGreaterThan(0);

    await page.goto("/wishlist");
    await expect(page.locator(".cart-table tbody tr").first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('[role="status"] button')).toBeVisible();
  });

  test("logged-in user: heart icon in product card adds to wishlist", async ({ page }) => {
    await loginViaAPI(page);
    await page.goto("/collections");

    await page.waitForSelector(".basic-product", { timeout: 15000 });

    // The wishlist anchor is inside .cart-info with class heart-icon or no class
    const productBox = page.locator(".basic-product").first();
    await productBox.hover();

    // In the cart-info area, find the wishlist anchor (AddToWishlist renders <a> or <li>)
    const heartBtn = page.locator(".basic-product .cart-info a, .basic-product li[title] a").first();
    await expect(heartBtn).toBeVisible({ timeout: 5000 });
    await heartBtn.click();

    // Toast notification should appear
    const toast = page.locator('.Toastify__toast, .Toastify__toast-body, [class*="toast"]').first();
    await expect(toast).toBeVisible({ timeout: 8000 });
  });

  test("wishlist page is accessible when logged in", async ({ page }) => {
    await loginViaAPI(page);
    await page.goto("/wishlist");

    // Wishlist page uses .cart-table (same as cart) or no-data
    const content = page.locator('.cart-table, [class*="no-data"], .wishlist-section').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });

  test("wishlist page shows products added via API", async ({ page }) => {
    await loginViaAPI(page);

    const cookies = await page.context().cookies();
    const token = cookies.find((c) => c.name === "uat")?.value;
    const productsRes = await page.request.get(`${BASE_API}/product?paginate=1`);
    const productsBody = await productsRes.json();
    const productId = productsBody?.data?.[0]?._id || productsBody?.data?.[0]?.id;

    if (productId && token) {
      await page.request.post(`${BASE_API}/wishlist`, {
        data: { product_id: productId },
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
    }

    await page.goto("/wishlist");
    // After adding a product, cart-table should have tbody rows
    await expect(page.locator(".cart-table tbody tr").first()).toBeVisible({ timeout: 15000 });
  });

  test("wishlist page has remove and add-to-cart buttons per row", async ({ page }) => {
    await loginViaAPI(page);

    // Seed a wishlist item
    const cookies = await page.context().cookies();
    const token = cookies.find((c) => c.name === "uat")?.value;
    const productsRes = await page.request.get(`${BASE_API}/product?paginate=1`);
    const productsBody = await productsRes.json();
    const productId = productsBody?.data?.[0]?._id || productsBody?.data?.[0]?.id;
    if (productId) {
      await page.request.post(`${BASE_API}/wishlist`, {
        data: { product_id: productId },
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
    }

    await page.goto("/wishlist");
    await page.waitForSelector(".cart-table tbody tr", { timeout: 15000 });

    // Desktop icon-box is a direct child of td (mobile one is nested inside .mobile-cart-content)
    await expect(page.locator(".cart-table tbody tr td > .icon-box .icon").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator(".cart-table tbody tr td > .icon-box .cart").first()).toBeVisible({ timeout: 5000 });
  });

  test("header wishlist icon redirects logged-in user to wishlist page", async ({ page }) => {
    await loginViaAPI(page);
    await page.locator(".icon-nav li.onhover-div").first().click();
    await expect(page).toHaveURL(/wishlist/, { timeout: 8000 });
  });
});
