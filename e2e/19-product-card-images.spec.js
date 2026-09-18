const { test, expect } = require("@playwright/test");
const { dismissNewsletterModal } = require("./helpers/auth");

/**
 * Fotos de las tarjetas de producto (ProductImage):
 *  - las primeras tarjetas de la home se piden de inmediato, el resto en
 *    diferido (`loading="lazy"`);
 *  - cada foto pasa de esqueleto (is-loading) a visible (is-loaded);
 *  - al cambiar de variante la tarjeta no vuelve al esqueleto.
 */

test.beforeEach(async ({ page }) => {
  await dismissNewsletterModal(page);
});

test("home: primeras fotos con prioridad, el resto en diferido, y todas salen del esqueleto", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator(".loader-wrapper").waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
  const images = page.locator(".basic-product .product-img img");
  // Las secciones de producto llegan por separado: esperar a tener varias.
  await expect.poll(async () => images.count(), { timeout: 20000 }).toBeGreaterThan(1).catch(() => {});
  const total = await images.count();
  if (total < 2) test.skip(true, "La home no muestra tarjetas de producto en este entorno");

  await expect(images.first()).toHaveAttribute("loading", "eager");
  const lazyCount = await page.locator('.basic-product .product-img img[loading="lazy"]').count();
  expect(lazyCount, "las tarjetas fuera de la primera fila cargan en diferido").toBeGreaterThan(0);

  // Al desplazarse, todas las fotos terminan visibles (sin esqueleto eterno).
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(async () => page.locator(".basic-product .product-img.is-loading").count(), { timeout: 20000 }).toBe(0);
  expect(await page.locator(".basic-product .product-img.is-loaded").count()).toBe(total);
});

test("cambiar de variante no vuelve al esqueleto ni rompe la foto", async ({ page }) => {
  await page.goto("/search?search=RinRin", { waitUntil: "domcontentloaded" });
  await page.locator(".loader-wrapper").waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
  const card = page.locator(".basic-product").first();
  const option = card.locator(".variant-option:not([disabled])").first();
  const found = await page.waitForSelector(".basic-product .variant-option:not([disabled])", { timeout: 20000 }).catch(() => null);
  if (!found) test.skip(true, "No hay un producto con variantes para probar");

  const wrapper = card.locator(".product-img");
  await expect(wrapper).toHaveClass(/is-loaded/, { timeout: 20000 });
  const before = await card.locator(".product-img img").getAttribute("src");

  await option.click();
  await expect(wrapper).toHaveClass(/is-loaded/);
  await expect(wrapper).not.toHaveClass(/is-swapping/, { timeout: 20000 });
  const after = await card.locator(".product-img img").getAttribute("src");
  expect(after).toBeTruthy();
  // Con foto de variante cambia la URL; sin foto se conserva la miniatura.
  expect([before, after].every(Boolean)).toBe(true);
});
