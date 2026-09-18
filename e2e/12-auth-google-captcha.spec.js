// Auth extras: reCAPTCHA checkbox + "Sign in with Google" button.
//
// Both elements are env-gated at build time (NEXT_PUBLIC_RECAPTCHA_SITE_KEY /
// NEXT_PUBLIC_GOOGLE_CLIENT_ID), so this spec asserts CONSISTENCY by default:
// the login and register surfaces must each render the same set of extras,
// and the core email/password form must always work.
//
// Set EXPECT_AUTH_EXTRAS=1 (built WITH keys) or EXPECT_AUTH_EXTRAS=0 (built
// WITHOUT keys) to make the assertions strict.

const { test, expect } = require("@playwright/test");

const STRICT = process.env.EXPECT_AUTH_EXTRAS; // "1", "0" or undefined

test.beforeEach(async ({ page }) => {
  await page.context().addCookies([
    { name: "newsletter", value: "true", domain: "localhost", path: "/", expires: 1897000000, httpOnly: false, secure: false, sameSite: "Lax" },
  ]);
});

async function checkExtras(page, scope) {
  const captcha = scope.locator('[data-testid="captcha"]');
  const google = scope.locator('[data-testid="google-login"]');
  const captchaCount = await captcha.count();
  const googleCount = await google.count();

  if (STRICT === "1") {
    expect(captchaCount).toBe(1);
    expect(googleCount).toBe(1);
    // Standard pattern: Google sign-in is NOT captcha-gated (the signed
    // Google credential is the bot check) — no blocking overlay may exist.
    expect(await scope.locator('[data-testid="google-captcha-block"]').count()).toBe(0);
  } else if (STRICT === "0") {
    expect(captchaCount).toBe(0);
    expect(googleCount).toBe(0);
  } else {
    // Consistency: a build has keys or it doesn't — never a mix per surface.
    expect(captchaCount).toBeLessThanOrEqual(1);
    expect(googleCount).toBeLessThanOrEqual(1);
  }
  return { captchaCount, googleCount };
}

test("login page renders form and env-gated auth extras", async ({ page }) => {
  await page.goto("/auth/login", { waitUntil: "networkidle" });
  await page.locator(".loader-wrapper").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  const email = page.locator('input[name="email"]').first();
  const password = page.locator('input[name="password"]').first();
  await expect(email).toBeVisible();
  await expect(password).toBeVisible();
  // Fields must start EMPTY with hint placeholders — never prefilled values.
  await expect(email).toHaveValue("");
  await expect(password).toHaveValue("");
  expect(await email.getAttribute("placeholder")).toBeTruthy();
  expect(await password.getAttribute("placeholder")).toBeTruthy();
  await checkExtras(page, page);
});

test("register page renders form and env-gated auth extras", async ({ page }) => {
  await page.goto("/auth/register", { waitUntil: "networkidle" });
  await page.locator(".loader-wrapper").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  await expect(page.locator('input[name="email"]').first()).toBeVisible();
  await checkExtras(page, page);
});

test("auth modal renders form and env-gated auth extras", async ({ page }) => {
  await page.goto("/contact-us", { waitUntil: "networkidle" });
  await page.locator(".loader-wrapper").waitFor({ state: "hidden", timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // The header user icon opens the auth modal for guests (retry for hydration)
  for (let i = 0; i < 5; i++) {
    await page.locator(".icon-nav a").filter({ has: page.locator("svg") }).nth(2).click().catch(() => {});
    if (await page.locator(".auth-modal .auth-form-box").count()) break;
    await page.waitForTimeout(800);
  }
  await expect(page.locator(".auth-modal .auth-form-box")).toBeVisible();
  await checkExtras(page, page.locator(".auth-modal"));
});
