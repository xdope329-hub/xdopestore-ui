const { test, expect } = require("@playwright/test");
const { loginViaAPI, dismissNewsletterModal, ensureTestUser, BASE_API } = require("./helpers/auth");

/**
 * Checkout: sesión de invitado y validación.
 *  - Un token de renovación huérfano (logout incompleto) NUNCA vuelve a
 *    iniciar sesión solo durante el checkout de invitado.
 *  - El logout del header borra AMBAS cookies de sesión.
 *  - Los campos del invitado validan de verdad (nombre, correo, teléfono,
 *    contraseña de "crear cuenta") y Enter no dispara POST /address.
 *  - Escribir un cupón no llama al API en cada tecla.
 */

const COOKIE_BASE = { domain: "localhost", path: "/", httpOnly: false, secure: false, sameSite: "Lax" };
const inADay = () => Math.floor(Date.now() / 1000) + 86400;

const guestCheckoutEnabled = async (page) => {
  const res = await page.request.get(`${BASE_API}/settings`);
  const body = await res.json();
  return Boolean(body?.values?.activation?.guest_checkout);
};

// Carrito de invitado: vive en localStorage (CartProvider lo lee al montar).
const seedGuestCart = async (page) => {
  const res = await page.request.get(`${BASE_API}/product?paginate=1&stock_status=in_stock`);
  const body = await res.json();
  const product = body?.data?.data?.[0] || body?.data?.[0];
  if (!product) return null;
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate((p) => {
    const price = Number(p.sale_price || p.price || 0);
    const item = { id: null, product: p, product_id: p.id || p._id, variation: null, variation_id: null, quantity: 1, sub_total: price };
    localStorage.setItem("cart", JSON.stringify({ items: [item], total: price }));
  }, product);
  return product;
};

const cookieNames = async (page) => (await page.context().cookies()).map((c) => c.name);

test.describe("Checkout — sesión de invitado", () => {
  test.beforeEach(async ({ page }) => {
    await dismissNewsletterModal(page);
  });

  test("un refresh token huérfano no vuelve a iniciar sesión durante el checkout de invitado", async ({ page }) => {
    const { body } = await ensureTestUser(page);
    const refreshToken = body?.refresh_token;
    if (!refreshToken) test.skip(true, "El API no devolvió refresh_token");

    const product = await seedGuestCart(page);
    if (!product) test.skip(true, "No hay productos en stock");

    // Escenario del bug: se cerró sesión pero quedó viva la cookie `urt`.
    await page.context().addCookies([{ name: "urt", value: refreshToken, expires: inADay(), ...COOKIE_BASE }]);

    const refreshCalls = [];
    const couponCalls = [];
    page.on("request", (req) => {
      if (/\/refresh(\?|$)/.test(req.url())) refreshCalls.push(req.url());
      if (/\/coupon(\?|$)/.test(req.url())) couponCalls.push(req.url());
    });

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.locator(".loader-wrapper").waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
    await page.waitForSelector(".checkout-right-box, .checkout-form-section", { timeout: 20000 });
    // Tiempo de sobra para que cualquier 401 → /refresh hubiera ocurrido.
    await page.waitForTimeout(3000);

    expect(refreshCalls, "no debe llamarse /refresh como invitado").toHaveLength(0);
    expect(couponCalls, "la lista de cupones exige sesión: no se pide como invitado").toHaveLength(0);
    expect(await cookieNames(page)).not.toContain("uat");
    // Sigue viendo el checkout de invitado, no las direcciones guardadas.
    await expect(page.locator('input[type="radio"][name="billing_address_id"][value]:not([value^="guest-"])')).toHaveCount(0);
    await expect(page.locator(".checkout-form-section")).toBeVisible();
  });

  test("el logout del header borra ambas cookies de sesión y revoca el refresh", async ({ page }) => {
    const body = await loginViaAPI(page);
    const refreshToken = body?.refresh_token;
    if (!refreshToken) test.skip(true, "El API no devolvió refresh_token");
    await page.context().addCookies([{ name: "urt", value: refreshToken, expires: inADay(), ...COOKIE_BASE }]);

    const logoutCalls = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && /\/logout(\?|$)/.test(req.url())) logoutCalls.push(req.postData() || "");
    });

    await page.goto("/", { waitUntil: "domcontentloaded" });
    // El icono de salir es el último de .icon-nav y solo existe con sesión.
    const logoutLink = page.locator(".icon-nav li.onhover-div:last-child a");
    await expect(page.locator(".icon-nav li.onhover-div")).toHaveCount(4, { timeout: 15000 }).catch(() => {});
    await logoutLink.click();
    await page.waitForTimeout(1500);

    const names = await cookieNames(page);
    expect(names).not.toContain("uat");
    expect(names).not.toContain("urt");
    expect(names).not.toContain("account");
    expect(logoutCalls.length, "debe revocarse el refresh en el servidor").toBeGreaterThan(0);
    expect(logoutCalls[0]).toContain(refreshToken);
  });
});

test.describe("Checkout — validación del invitado", () => {
  test.beforeEach(async ({ page }) => {
    await dismissNewsletterModal(page);
    if (!(await guestCheckoutEnabled(page))) test.skip(true, "Checkout de invitados desactivado en este entorno");
    const product = await seedGuestCart(page);
    if (!product) test.skip(true, "No hay productos en stock");
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await page.locator(".loader-wrapper").waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
    await page.waitForSelector(".checkout-form-section", { timeout: 20000 });
  });

  test("teléfono es un campo de texto numérico y los campos inválidos se marcan al pedir", async ({ page }) => {
    const phone = page.locator('input[name="phone"]');
    await expect(phone).toHaveAttribute("type", "tel");

    await page.locator('input[name="name"]').fill("   ");
    await page.locator('input[name="email"]').fill("correo-invalido");
    await phone.fill("300abc");

    await page.locator(".order-btn").first().click();
    // Toast con el primer requisito pendiente…
    await expect(page.locator(".Toastify__toast--error").first()).toBeVisible({ timeout: 8000 });
    // …y cada campo inválido marcado en rojo con su mensaje.
    await expect(page.locator('input[name="name"]')).toHaveClass(/is-invalid/);
    await expect(page.locator('input[name="email"]')).toHaveClass(/is-invalid/);
    await expect(phone).toHaveClass(/is-invalid/);
    await expect(page.locator(".invalid-feedback").filter({ hasText: /7 a 15|7 to 15/ })).toBeVisible();

    // Valores correctos limpian las marcas.
    await page.locator('input[name="name"]').fill("Ana Pérez");
    await page.locator('input[name="email"]').fill("ana@example.com");
    await phone.fill("3001234567");
    await page.locator('input[name="email"]').blur();
    await expect(page.locator('input[name="name"]')).not.toHaveClass(/is-invalid/);
    await expect(page.locator('input[name="email"]')).not.toHaveClass(/is-invalid/);
    await expect(phone).not.toHaveClass(/is-invalid/);
  });

  test("crear cuenta exige una contraseña con las reglas del registro", async ({ page }) => {
    await page.locator('label[for="create_account"]').click();
    const password = page.locator('input[name="password"]');
    await expect(password).toBeVisible();
    await password.fill("abc");
    await page.locator(".order-btn").first().click();
    await expect(password).toHaveClass(/is-invalid/, { timeout: 8000 });
    await expect(page.locator(".invalid-feedback").filter({ hasText: /8/ })).toBeVisible();
  });

  test("Enter en un campo del invitado no envía POST /address", async ({ page }) => {
    const addressPosts = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && /\/address(\?|$)/.test(req.url())) addressPosts.push(req.url());
    });
    const name = page.locator('input[name="name"]');
    await name.fill("Ana Pérez");
    await name.press("Enter");
    await page.waitForTimeout(1000);
    expect(addressPosts).toHaveLength(0);
    // Sigue en el checkout, sin toast de "dirección agregada".
    await expect(page.locator(".checkout-form-section")).toBeVisible();
  });

  test("escribir un cupón no consulta el API en cada tecla", async ({ page }) => {
    const checkoutPosts = [];
    page.on("request", (req) => {
      if (req.method() === "POST" && /\/checkout(\?|$)/.test(req.url())) checkoutPosts.push(req.url());
    });
    const coupon = page.locator('input[name="coupon"]');
    await expect(coupon).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(500);
    const before = checkoutPosts.length;
    await coupon.pressSequentially("PROMO", { delay: 50 });
    await page.waitForTimeout(800);
    expect(checkoutPosts.length - before).toBe(0);
  });
});
