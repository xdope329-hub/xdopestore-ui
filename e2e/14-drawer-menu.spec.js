const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 414, height: 896 }, hasTouch: true }); // mobile-sized w/ touch

async function openDrawer(page, drawer) {
  // retry a few times in case React hydration hasn't attached handlers yet
  for (let i = 0; i < 5; i++) {
    await page.locator('.toggle-nav').click();
    try {
      await expect(drawer).toHaveClass(/show/, { timeout: 1500 });
      return;
    } catch {}
  }
  throw new Error('drawer never opened');
}

test('hamburger drawer closes when tapping outside', async ({ page }) => {
  // suppress the newsletter popup (same cookie the project's e2e helpers use)
  await page.context().addCookies([
    { name: 'newsletter', value: 'true', domain: 'localhost', path: '/', expires: Math.floor(1897000000), httpOnly: false, secure: false, sameSite: 'Lax' },
  ]);
  await page.goto('/contact-us', { waitUntil: 'networkidle' });
  await page.locator('.loader-wrapper').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const drawer = page.locator('.offcanvas.offcanvas-collapse');

  // open the drawer
  await openDrawer(page, drawer);

  // backdrop should be present; tap it (i.e. tap outside the drawer)
  const backdrop = page.locator('.offcanvas-backdrop');
  await expect(backdrop).toBeVisible();
  await backdrop.click({ position: { x: 390, y: 450 } }); // far right, outside drawer
  await expect(drawer).not.toHaveClass(/show/);
  await expect(backdrop).toHaveCount(0);

  // X button still works
  await openDrawer(page, drawer);
  await page.locator('#toggle_menu_btn').click();
  await expect(drawer).not.toHaveClass(/show/);

  // clicking INSIDE the drawer (non-link area) does not close it
  await openDrawer(page, drawer);
  await page.locator('.offcanvas-header h5').click();
  await page.waitForTimeout(300);
  await expect(drawer).toHaveClass(/show/);
});

test('selecting a menu link closes the drawer', async ({ page }) => {
  await page.context().addCookies([
    { name: 'newsletter', value: 'true', domain: 'localhost', path: '/', expires: Math.floor(1897000000), httpOnly: false, secure: false, sameSite: 'Lax' },
  ]);
  await page.goto('/contact-us', { waitUntil: 'networkidle' });
  await page.locator('.loader-wrapper').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const drawer = page.locator('.offcanvas.offcanvas-collapse');
  await openDrawer(page, drawer);

  // Click the first real navigation link inside the drawer (skips submenu
  // toggles, which have no href).
  const link = drawer.locator('.offcanvas-body a.dropdown-item[href]').first();
  await expect(link).toBeVisible({ timeout: 10000 });
  await link.click();

  // Drawer must close after navigating.
  await expect(drawer).not.toHaveClass(/show/, { timeout: 5000 });
  await expect(page.locator('.offcanvas-backdrop')).toHaveCount(0);
});

test('swiping left on the drawer closes it', async ({ page }) => {
  await page.context().addCookies([
    { name: 'newsletter', value: 'true', domain: 'localhost', path: '/', expires: Math.floor(1897000000), httpOnly: false, secure: false, sameSite: 'Lax' },
  ]);
  await page.goto('/contact-us', { waitUntil: 'networkidle' });
  await page.locator('.loader-wrapper').waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const drawer = page.locator('.offcanvas.offcanvas-collapse');
  await openDrawer(page, drawer);

  // Simulate a leftward swipe via touch events dispatched on the drawer.
  await drawer.evaluate((el) => {
    const mk = (x, y) => new Touch({ identifier: 0, target: el, clientX: x, clientY: y });
    const fire = (type, x, y) => {
      const t = mk(x, y);
      el.dispatchEvent(new TouchEvent(type, {
        bubbles: true, cancelable: true,
        changedTouches: [t], touches: type === 'touchend' ? [] : [t],
      }));
    };
    fire('touchstart', 240, 300);
    fire('touchmove', 120, 305);
    fire('touchend', 90, 308);
  });

  await expect(drawer).not.toHaveClass(/show/, { timeout: 5000 });
});
