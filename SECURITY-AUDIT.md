# xdopestore-ui — Application Security Assessment

**Scope:** `xdopestore-ui` (Next.js 15 App Router storefront) and its npm dependencies. The sibling `xdopestore-api` (Express/Mongo) was read only where needed to confirm or refute storefront findings (session contract, price handling, order ownership); it was not audited end to end.
**Date:** 2026-09-02 · **Branch audited:** `feature-xdope-home-colors` (working tree, 12 files already had uncommitted changes) · **Method:** manual source review of every route, component, hook, context, config, lockfile and test helper; `npm audit`; backend cross-checks.

All fixes described as **Fixed** below have been applied to the working tree (uncommitted). Review with `git diff`, revert any file with `git checkout -- <path>`. The pre-upgrade lockfile is saved at `%TEMP%\claude\...\scratchpad\package-lock.before.json`.

---

## 1. Executive summary

The storefront's business logic is in good shape: prices are rebuilt server-side for guests, order access is ownership-checked, refresh tokens rotate with replay detection, and the login response never contains password hashes or OTPs. The real exposure was in the **client platform layer**:

1. The deployed framework was in an unknown, vulnerable state: `package.json` asked for `next ^15.5.0`, the lockfile pinned **15.0.7** (30+ advisories, including the middleware authorization bypass CVE-2025-29927), `node_modules` had 15.4.5, and Vercel ran a non-reproducible `npm install`.
2. Server-side product lookups **disabled TLS certificate verification**, exposing all metadata traffic to man-in-the-middle.
3. **No HTTP security headers** at all (no CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).
4. Session tokens (access 7 days, refresh 30 days) live in **JavaScript-readable cookies**, and two login paths also copied the whole login body — tokens included — into `localStorage` and a second cookie. Combined with four **unsanitised `dangerouslySetInnerHTML`** sinks fed by CMS content, any admin-side compromise or stored XSS became full shopper account takeover with silent 30-day renewal.
5. Open redirects through cookies, `javascript:` URLs accepted from CMS links, JSON-LD `</script>` injection, hard-coded test credentials shared with QA/production, and an image optimizer that could reach loopback services rounded out the picture.

**Security score: 38/100 before → 76/100 after the applied fixes.** The remaining gap is architectural (tokens still readable by JavaScript until a backend-for-frontend issues `HttpOnly` cookies; CSP still needs `'unsafe-inline'` until nonces are wired) plus items outside this repository (production DB dumps in `_to_delete/`, the test account possibly existing in production).

Verification after fixes: `npm run test:unit` → 63/63 pass (49 before; 14 new security tests); `npm audit` (after `npm audit fix`) → 0 critical, 3 remaining advisories, all in the postcss/brace-expansion build-tool chain pinned by Next; `next build` (production) → success for every route, middleware 34.8 kB.

---

## 2. Phase 1 — Project understanding

| Aspect | Finding |
|---|---|
| Framework / build | Next.js 15 (App Router, JS not TS), React 19, `next build`, Vercel deploy (`vercel.json`), `npm` with `legacy-peer-deps` |
| UI stack | reactstrap/bootstrap, formik + yup, react-i18next (es default, en), swiper, react-slick, react-toastify |
| Backend | `xdopestore-api` (Express + Mongoose) at `API_PROD_URL` (Render in prod, `localhost:5000` in dev), called directly from the browser with `Authorization: Bearer` |
| Authentication | Email/password (`/login`), Google Identity Services (`/login/google`), reCAPTCHA v2 on register; API issues `{access_token (JWT HS256, 15 min), refresh_token (opaque, 30 d, rotated)}` |
| Session storage (client) | `uat` (access) and `urt` (refresh) cookies via js-cookie, `SameSite=Lax`, `Secure` on https, **not HttpOnly**; `account` cookie + `localStorage.account`; guest cart/wishlist in `localStorage` |
| Authorization | Middleware only checks cookie *presence* for `/account/*`; the API enforces ownership and roles on every call |
| Sensitive data | Names, e-mails, phones, addresses, order history; payment handled by MercadoPago redirect (no card data in the UI) |
| Env / secrets | `API_PROD_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `NEXT_PUBLIC_SITE_URL`; no server secrets in the UI (good). `.env.local` is git-ignored |
| Third parties | Google GSI, reCAPTCHA, Google Fonts, Google Maps embed, Cloudinary media, MercadoPago (redirect) |
| CI/CD | None for the UI; the API repo carries an unrelated Serverless/Python deploy workflow |
| Tests | 49 `node --test` unit tests (session, checkout rules, variants), 19 Playwright specs |

---

## 3. Vulnerability statistics

| Severity | Found | Fixed | Partially fixed | Open |
|---|---|---|---|---|
| Critical | 1 | 1 | 0 | 0 |
| High | 5 | 4 | 1 (H3) | 0 |
| Medium | 9 | 7 | 2 (M3, M8) | 0 |
| Low | 9 | 7 | 0 | 2 (L3 routes, L7) |
| Informational | 5 | 1 | 1 | 3 |
| **Total** | **29** | **20** | **4** | **5** |

---

## 4. Vulnerability table

| ID | Severity | File(s) | Issue | OWASP 2021 | CWE | CVSS (est.) | Status |
|---|---|---|---|---|---|---|---|
| C1 | Critical | `package.json`, `package-lock.json`, `vercel.json` | Next.js 15.0.7 locked / 15.4.5 installed / `^15.5.0` declared: middleware auth bypass (CVE-2025-29927), SSRF in middleware redirects, RSC cache poisoning, multiple DoS; non-reproducible install | A06 | CWE-1104, CWE-1395 | 9.1 | Fixed → next 15.5.25, `npm ci` |
| H1 | High | `src/app/(mainBody)/product/[productSlug]/page.js:9` | `https.Agent({ rejectUnauthorized: false })` disables TLS verification for server-side API calls | A02 | CWE-295 | 7.4 | Fixed (fetch, verified TLS, 5 s timeout) |
| H2 | High | `next.config.mjs`, `vercel.json` | No CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy | A05 | CWE-693, CWE-1021 | 6.5 | Fixed (headers() in next.config) |
| H3 | High | `src/utils/axiosUtils/session.js`, `useLogin.jsx:27-28`, `useOtpVerification.jsx:19-20` | Access + refresh tokens readable by JS (7 d / 30 d cookies); login body incl. tokens also written to `localStorage` and a second cookie | A07 | CWE-1004, CWE-922 | 7.5 | Partially fixed (token copies removed; HttpOnly needs BFF, §7) |
| H4 | High | `pages/legal/index.jsx:40`, `allModal/DeliveryReturnModal.jsx:9`, `customFunctions/TextLimit.jsx:36`, `themes/widgets/HomeTitle.jsx:11` | Unsanitised CMS HTML in `dangerouslySetInnerHTML` (stored XSS if admin/API content is compromised) | A03 | CWE-79 | 7.3 | Fixed (DOMPurify choke point, JSX for title) |
| H5 | High | `package.json` | `swiper` 11.2.10 (prototype pollution, critical), `axios` 1.11.0 (SSRF/proto-pollution/DoS, used server-side), `js-cookie` 3.0.5 (cookie attribute injection) | A06 | CWE-1104, CWE-1321 | 7.5 | Fixed (swiper 14.2.0, axios removed, js-cookie 3.0.8) |
| M1 | Medium | `middleware.js:63-64`, `useLogin.jsx:41,51`, `LoginForm.jsx:61`, `RegisterForm.jsx:71`, `GoogleLoginButton.jsx:62`, `useOtpVerification.jsx:32,48` | Open redirect: `CallBackUrl`/`currentPath` cookie values passed to `router.push` and `new URL(cookie, request.url)` | A01 | CWE-601 | 6.1 | Fixed (`safeRedirectPath`) |
| M2 | Medium | `src/app/layout.js:100`, `product/[productSlug]/page.js:63` | JSON-LD via `JSON.stringify` inside `<script>` — `</script>` in SEO fields breaks out; product JSON-LD emitted as `<meta>` (non-functional) | A03 | CWE-116 | 5.4 | Fixed (`serializeJsonLd`, real ld+json script) |
| M3 | Medium | `src/app/api/**` (33 route handlers), `vercel.json` | Unreferenced template mock endpoints publicly serve fake profile/orders/coupons/settings; `Access-Control-Allow-Origin: *` together with `Allow-Credentials: true` | A05 | CWE-942, CWE-1188 | 5.3 | Partially fixed (CORS removed; deletion of `src/app/api` recommended, see §10) |
| M4 | Medium | `LoginForm.jsx:49-50`, `RegisterForm.jsx:61-62`, `GoogleLoginButton.jsx:51-52`, `register/index.jsx:53-54`, `headerOne/index.jsx:61` | Full user profile (e-mail, phone, role permissions) duplicated into a readable cookie (can exceed 4 KB) and `localStorage`; admin UI toggle read from client-writable cookie | A02 | CWE-315, CWE-359 | 5.3 | Fixed (`saveAccountSummary` keeps id/name/role only) |
| M5 | Medium | `CartButton.jsx:39,112`, `AddToCartButton.jsx:9,50`, `AddToCartDigital.jsx:17,37`, `HomeSocialMedia.jsx:30`, `DigitalImage.jsx:44`, `DigitalImageOptions.jsx:21`, `OfferBanner.jsx:15`, `LinkBox.jsx:18`, `imageLink/*`, `HomeSlider.jsx` | CMS URLs passed unchecked to `window.open` / `href` (`javascript:` scheme), `target=_blank` without `rel`; two buttons invoked `window.open` during render | A03 | CWE-79, CWE-1022 | 5.4 | Fixed (`safeHttpUrl`, `safeHref`, `openExternal`) |
| M6 | Medium | `package-lock.json`, `vercel.json`, `.npmrc` | Lockfile stale vs `package.json`; Vercel `npm install` resolves fresh versions on every deploy (supply-chain drift) | A08 | CWE-829, CWE-494 | 5.0 | Fixed (lockfile regenerated, `npm ci --legacy-peer-deps`) |
| M7 | Medium | `next.config.mjs:13-27` | `images.remotePatterns` allow `http://localhost`, `http://127.0.0.1` (any port) and `picsum.photos` in production → `/_next/image?url=http://127.0.0.1:PORT/...` SSRF pivot / open image proxy | A10 | CWE-918 | 5.8 | Fixed (loopback only outside production, picsum removed) |
| M8 | Medium | `e2e/helpers/auth.js:6-7`, `../QA-ENVIRONMENT.md` | Hard-coded `consumer@xdope.com / Consumer@123` used against any `API_URL`; QA is documented as sharing production credentials | A07 | CWE-798 | 6.5 | Partially fixed (defaults only for localhost APIs; verify the account is absent in production) |
| M9 | Medium | `ValidationSchema.jsx:6`, `checkoutSchema.js:71` | UI password rule 8–20 chars, no complexity (API requires 8–128 + letter + digit); >20-char passwords could not log in | A07 | CWE-521 | 3.7 | Fixed (login: length only; new passwords: API policy) |
| L1 | Low | `usePhnLogin.jsx:13-14`, `useForgotPassword.jsx:16`, `SubLayout.jsx:70-73` | E-mail/phone helper cookies set without SameSite/Secure/expiry | A05 | CWE-614, CWE-1275 | 3.1 | Fixed (`sideCookieOptions`, 15–60 min) |
| L2 | Low | `PlaceOrder.jsx:119,126` | API response bodies (addresses) logged to console in production | A09 | CWE-532 | 2.6 | Fixed (dev only) |
| L3 | Low | `middleware.js:52-57,78` | `cartData` cookie compared as object (digital-cart login gate never fired); `maintenance` cookie deleted on a discarded response; redirects to non-existent `/maintenance`, `/auth/otp-verification`, `/auth/update-password` | A01 | CWE-697 | 3.1 | Logic fixed; routes still absent |
| L4 | Low | `.env.example` | Real Google client ID and reCAPTCHA site key committed as "example" | A05 | CWE-540 | 2.0 | Fixed (placeholders) |
| L5 | Low | `headerOne/index.jsx:153` | Hard-coded `http://localhost:3001` "admin panel" link (mixed content, wrong target) | A05 | CWE-1188 | 2.0 | Fixed (`NEXT_PUBLIC_ADMIN_URL`, hidden when unset) |
| L6 | Low | `GetCookie.jsx:4`, `CartProvider.jsx:152-166` | `decodeURIComponent(document.cookie)` throws on any malformed cookie (client DoS); raw fetch bypasses the session/refresh layer | A05 | CWE-248 | 3.1 | Fixed |
| L7 | Low | `OTPVerificationForm.jsx`, missing `/auth/update-password` | Password reset cannot be completed from the storefront (no submit handler, no page) | A07 | CWE-640 | 3.0 | Open (functional gap) |
| L8 | Low | (no `.github` in UI), `../xdopestore-api/.github/workflows/deploy.yml` | No CI security gates; stale unrelated workflow references AWS secrets | A08 | CWE-1127 | 2.0 | Fixed for UI (workflow added); API workflow: remove |
| L9 | Low | `useOtpVerification.jsx:24` | Call to undefined `transformLocalStorageData` (runtime crash) | — | CWE-758 | 2.0 | Fixed |
| I1 | Info | `../_to_delete/api-backups/2026-08-27-*/users.json`, `refreshtokens.json`, `orders.json` | Production collection dumps (bcrypt hashes, refresh-token hashes, customer PII) sit beside the repos | A02 | CWE-312 | — | Open (outside repo; delete or encrypt) |
| I2 | Info | `layout/themeCustomizer/*`, `contactUs/MapSection.jsx`, product JSON-LD | Template leftovers (multikart demo links, Dubai map), JSON-LD priced in USD for a COP store | — | — | — | JSON-LD currency fixed; rest cosmetic |
| I3 | Info | API (`guestCart.js`, `order.routes.js`, `refreshTokens.js`, `jwt.js`, `User.js`, `settingsRedaction.js`) | Positive controls verified: server-side pricing, ownership checks, refresh rotation + replay revocation, HS256 with iss/aud, rate limits, secret redaction, password/OTP stripped from JSON | — | — | — | n/a |
| I4 | Info | `next.config.mjs` | Production source maps off (now explicit), `X-Powered-By` removed | — | CWE-540 | — | Fixed |
| I5 | Info | `../QA-ENVIRONMENT.md` | QA database is a clone of production including users and password hashes | A02 | CWE-359 | — | Open (process) |

---

## 5. Findings in detail with remediation

### C1 — Vulnerable and non-reproducible Next.js version
**Why vulnerable.** `package.json` declared `next ^15.5.0`, `package-lock.json` pinned 15.0.7 (and `eslint-config-next` 14.1.0), `node_modules` contained 15.4.5, and Vercel ran `npm install --legacy-peer-deps`, so each deploy resolved whatever 15.5.x was current. 15.0.7/15.4.5 are inside the ranges of CVE-2025-29927 (an `x-middleware-subrequest` header skips middleware entirely), GHSA-4342-x723-ch2f (middleware redirect SSRF), several RSC cache-poisoning and DoS advisories.
**Impact / exploit.** Middleware bypass lets anyone reach `/account/*` shells without the cookie gate (the API still enforces auth, so data exposure is limited to page scaffolding), cache poisoning can serve wrong responses to other users, DoS advisories affect availability.
**Fix (applied).** `next@15.5.25`, `eslint-config-next@15.5.25`, lockfile regenerated, `vercel.json` now uses `npm ci --legacy-peer-deps`, CI workflow fails on drift and on high/critical advisories.

### H1 — TLS verification disabled
```js
// before: product/[productSlug]/page.js
axios.get(url, { httpsAgent: new https.Agent({ rejectUnauthorized: false }) })
```
Any network position between Vercel and Render could impersonate the API and inject product data (which then flowed into JSON-LD and metadata). **Fix (applied):** native `fetch` with verified TLS, `AbortController` timeout, `cache: "no-store"`, and the product fetch is memoised between `generateMetadata` and the page. `axios` was removed from the project entirely.

### H2 — Missing security headers
**Fix (applied)** in `next.config.mjs` (`headers()`): CSP (`default-src 'self'`, allow-listed Google GSI/reCAPTCHA/Fonts/Maps, Cloudinary, the API origin; `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`), `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera, mic, geolocation, payment, usb off), `poweredByHeader: false`, `productionBrowserSourceMaps: false`.
`script-src` still carries `'unsafe-inline'` because Next.js App Router needs it without a nonce pipeline — see §7 "CSP hardening" for the nonce upgrade. If the admin dashboard ever embeds the storefront in an iframe, `frame-ancestors` must list that origin.

### H3 — Tokens readable by JavaScript
**Why vulnerable.** `session.js` stores `uat` (7 d) and `urt` (30 d) with js-cookie; both are readable by any script on the origin. `useLogin.jsx` and `useOtpVerification.jsx` additionally wrote the *entire* login body (`{access_token, refresh_token, token, data}`) into the `account` cookie and `localStorage.account`. One XSS = token theft + silent 30-day renewal from another device.
**Fix (applied):** all token copies removed; only `{ id, name, role.name }` is persisted (`saveAccountSummary`); logout clears every helper cookie. **Remaining (architectural):** move token custody to `HttpOnly` cookies through a backend-for-frontend — code in §7.

### H4 — Stored XSS through CMS HTML
Four sinks rendered API HTML verbatim; `TextLimit.jsx` even named the function `sanitizeAndTrustHtml` while doing no sanitising, and truncated HTML mid-tag. **Fix (applied):** `src/utils/security/sanitizeHtml.js` (DOMPurify, active tags/handlers forbidden, `rel=noopener` forced on links, returns `""` during SSR so untrusted markup never reaches server output); `HomeTitle` now renders JSX instead of building `<h4>` strings.

### H5 — Vulnerable direct dependencies
`swiper` → 14.2.0 (`swiper/modules` API adopted in `ProductSliderBottom.jsx`), `axios` removed (only server-side use replaced by `fetch`), `js-cookie` → 3.0.8, `dompurify` 3.4.14 added.

### M1 — Open redirect via cookies
`safeRedirectPath()` (`src/utils/security/safeRedirect.js`, 4 unit tests) accepts only a same-origin absolute path (rejects `//`, `/\`, schemes, control characters). Used in the middleware (`currentPath`) and every post-login `CallBackUrl` consumer; the middleware also refuses to bounce back to a protected route (loop).

### M2 — JSON-LD injection
`serializeJsonLd()` escapes `<`, `>`, `&`, U+2028/2029 (unit-tested) and is used in the root layout; the product page now emits a real `<script type="application/ld+json">` (previously `other["script:ld+json"]` produced a `<meta>` tag).

### M3 — Mock API surface and CORS
`vercel.json` no longer emits `Access-Control-Allow-Origin: *` with credentials. The 33 template handlers under `src/app/api/**` are not referenced anywhere in `src/` or `e2e/`; removing the directory is the correct fix (the automated deletion was blocked by the tool permission policy, so it is left for you):
```bash
git rm -r src/app/api
```

### M4 — PII in cookie/localStorage
`saveAccountSummary()` / `getAccountSummary()` in `session.js` (unit-tested: e-mail, phone and tokens are proven absent). The header's admin shortcut reads the summary and is purely cosmetic; authorization stays server-side.

### M5 — Unsafe CMS URLs
`safeHttpUrl` (http/https only), `safeHref` (same-origin path or http/https), `openExternal` (`noopener,noreferrer`) — 11 call sites patched, `rel="noopener noreferrer"` added to every `target="_blank"`, and two buttons that opened the URL *during render* now open on click.

### M6 / C1 — Reproducible installs
Lockfile regenerated from the declared ranges; `npm ci` on Vercel and in CI.

### M7 — Image optimizer SSRF
`remotePatterns` now: Cloudinary, the API host (https only); loopback hosts only when `NODE_ENV !== "production"`; `picsum.photos` removed.

### M8 — Hard-coded test credentials
`e2e/helpers/auth.js` only falls back to the built-in user when `API_URL` is `localhost`/`127.0.0.1`; otherwise `TEST_EMAIL`/`TEST_PASSWORD` are mandatory. **Action for you:** confirm `consumer@xdope.com` does not exist in the production database (or rotate its password), and make `npm run sync:qa` scrub or re-hash user passwords.

### M9 — Password policy
`passwordSchema` (login): 8–128 characters. `newPasswordSchema` (register, change password, guest "create account"): 8–128 + at least one letter and one digit — identical to the API's `isPasswordStrong`. Locale strings updated (en/es), unit tests extended.

### L1–L9
See the table; all code is in the working tree. Notable: `sideCookieOptions(minutes)` (SameSite=Lax, Secure on https, bounded lifetime) now backs every helper cookie; `getCookie` decodes per-cookie inside try/catch; `fetchReplaceCartData` uses the shared `request()` (bearer + silent refresh); middleware logic bugs corrected and the file restructured.

---

## 6. Secure code recommendations (patterns now in the codebase)

| Pattern | Use it for | Location |
|---|---|---|
| `safeRedirectPath(value, fallback)` | any redirect target from cookies, query strings, API | `src/utils/security/safeRedirect.js` |
| `safeHttpUrl` / `safeHref` / `openExternal` / `EXTERNAL_LINK_PROPS` | every `href`/`window.open` fed by CMS or API data | `src/utils/security/safeUrl.js` |
| `trustedHtml(html)` | the only accepted value for `dangerouslySetInnerHTML` | `src/utils/security/sanitizeHtml.js` |
| `serializeJsonLd(obj)` | any `<script type="application/ld+json">` | `src/utils/security/jsonLd.js` |
| `saveAccountSummary` / `getAccountSummary` / `sideCookieOptions` | client-side session side data | `src/utils/axiosUtils/session.js` |
| `request()` | all API calls (never raw `fetch` with a bearer) | `src/utils/axiosUtils/index.jsx` |

Add an ESLint rule to keep it that way once lint is enabled: `"react/no-danger": "error"` with an override that allows it only in the four files above, and `no-restricted-globals` for `window.open`.

---

## 7. Architecture improvements

### 7.1 Backend-for-frontend so tokens become `HttpOnly` (closes H3)
Keep the API contract unchanged; add three route handlers in the storefront and route authenticated calls through a proxy. Delete `src/app/api/**` mocks first (M3).

```js
// src/app/api/auth/login/route.js
import { NextResponse } from "next/server";
const API = process.env.API_PROD_URL;
const cookie = (name, value, maxAge) => ({
  name, value, httpOnly: true, secure: process.env.NODE_ENV === "production",
  sameSite: "lax", path: "/", maxAge,
});
export async function POST(req) {
  const body = await req.json();
  const upstream = await fetch(`${API}/login`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json({ message: data?.message || "Invalid credentials" }, { status: upstream.status });
  const res = NextResponse.json({ data: data.data });            // profile only - tokens never reach JS
  res.cookies.set(cookie("uat", data.access_token, 15 * 60));
  res.cookies.set(cookie("urt", data.refresh_token, 30 * 24 * 3600));
  return res;
}
```

```js
// src/app/api/proxy/[...path]/route.js  - forwards to the API with the HttpOnly bearer
import { NextResponse } from "next/server";
const API = process.env.API_PROD_URL;
const ALLOWED = /^(self|cart|wishlist|address|order|checkout|payment|coupon|notifications|points|refund|review|question-and-answer|sync|replace|clear|updateProfile|updatePassword|trackOrder)(\/|$)/;

async function forward(req, { params }, token) {
  const path = (await params).path.join("/");
  if (!ALLOWED.test(path)) return NextResponse.json({ message: "Not found" }, { status: 404 });
  const url = new URL(`${API}/${path}`); url.search = req.nextUrl.search;
  const headers = { Accept: "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  const ct = req.headers.get("content-type"); if (ct) headers["Content-Type"] = ct;
  const upstream = await fetch(url, { method: req.method, headers, body: req.method === "GET" ? undefined : await req.arrayBuffer() });
  return new NextResponse(upstream.body, { status: upstream.status, headers: { "content-type": upstream.headers.get("content-type") || "application/json" } });
}

async function withRefresh(req, ctx) {
  let token = req.cookies.get("uat")?.value;
  let res = await forward(req, ctx, token);
  if (res.status !== 401 || !req.cookies.get("urt")) return res;
  const r = await fetch(`${API}/refresh`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: req.cookies.get("urt").value }) });
  if (!r.ok) return res;
  const fresh = await r.json();
  res = await forward(req, ctx, fresh.access_token);
  res.cookies.set({ name: "uat", value: fresh.access_token, httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 15 * 60 });
  res.cookies.set({ name: "urt", value: fresh.refresh_token, httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 30 * 24 * 3600 });
  return res;
}
export const GET = withRefresh, POST = withRefresh, PUT = withRefresh, DELETE = withRefresh;
```
Then `request()` calls `/api/proxy/<path>` instead of `${API}${path}`, `getAccessToken()` disappears from client code, and the middleware keeps using `request.cookies.has("uat")` (server-readable). CSRF: the proxy only accepts same-site cookies (`SameSite=Lax`) and JSON bodies; add an `Origin` check for non-GET requests.

### 7.2 CSP hardening with nonces (removes `'unsafe-inline'` for scripts)
```js
// middleware.js (add at the top of middleware())
const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
const csp = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://accounts.google.com https://www.google.com https://www.gstatic.com; ...`;
const requestHeaders = new Headers(request.headers);
requestHeaders.set("x-nonce", nonce);
const response = NextResponse.next({ request: { headers: requestHeaders } });
response.headers.set("Content-Security-Policy", csp);
```
In `app/layout.js`: `const nonce = (await headers()).get("x-nonce")` and pass `nonce` to the JSON-LD `<script>` and to `<Script nonce={nonce} src="https://accounts.google.com/gsi/client" />`. Move the CSP out of `next.config.mjs` at that point.

### 7.3 Other structural items
- One `request()` layer already exists — finish migrating the remaining raw `fetch` calls (login/register/google in the forms) to it or to the BFF.
- Replace cookie-presence gating in the middleware with a signed session cookie check once the BFF exists.
- Delete the theme-customizer/demo leftovers and the mock `/api` tree; they widen the attack surface for no product value.
- Add the missing `/maintenance`, `/auth/otp-verification` and `/auth/update-password` pages or remove the redirects and the OTP form.

---

## 8. Dependency recommendations

| Package | Was | Now | Note |
|---|---|---|---|
| next | 15.0.7 (lock) / 15.4.5 (installed) | 15.5.25 | latest 15.x; `npm audit` still flags the 15.x line as "fix in 16.3.4" — plan the Next 16 upgrade |
| eslint-config-next | 14.1.0 (lock) | 15.5.25 | matches Next |
| axios | 1.11.0 | removed | only server-side use; replaced by `fetch` |
| swiper | 11.2.10 | 14.2.0 | prototype-pollution fix; `swiper/modules` API |
| js-cookie | 3.0.5 | 3.0.8 | cookie-attribute injection fix |
| dompurify | — | 3.4.14 | new, HTML sanitising |

Remaining `npm audit` output after the upgrade and `npm audit fix`: 0 critical, 2 high, 1 moderate — `postcss` 8.4.31 and `brace-expansion` pinned by Next's own dependency tree (build-time only; nothing ships to the browser). Add an `overrides` entry for `postcss` only if your build tooling permits (Next pins it deliberately); otherwise it clears with the Next 16 upgrade.

Policy: pin exact versions for the framework, keep `npm ci` everywhere, enable Dependabot/Renovate with weekly grouping, and block merges on `npm audit --audit-level=high` (already in the new workflow).

---

## 9. Production hardening checklist

- [x] Security headers (CSP, HSTS, XFO, nosniff, Referrer-Policy, Permissions-Policy)
- [x] `X-Powered-By` removed, browser source maps off
- [x] TLS verification on for every server-side call
- [x] Redirect targets validated (`safeRedirectPath`)
- [x] External URLs validated (`safeHref`/`openExternal`), `rel="noopener noreferrer"`
- [x] HTML from CMS sanitised at a single choke point
- [x] JSON-LD serialised safely
- [x] Tokens no longer duplicated into `localStorage`/profile cookie
- [x] Helper cookies: SameSite=Lax, Secure, short expiry
- [x] Image optimizer restricted to production hosts
- [x] Reproducible builds (`npm ci`, lockfile in sync)
- [x] Password policy aligned with the API
- [ ] Delete `src/app/api/**` mocks (`git rm -r src/app/api`)
- [ ] BFF with `HttpOnly` session cookies (§7.1)
- [ ] CSP nonces, drop `'unsafe-inline'` for scripts (§7.2)
- [ ] Set `NEXT_PUBLIC_ADMIN_URL`, `NEXT_PUBLIC_SITE_URL`, `API_PROD_URL` (https) in Vercel; confirm `frame-ancestors` compatibility with the admin app
- [ ] Verify `consumer@xdope.com` is absent from production; scrub passwords when cloning prod → QA
- [ ] Remove or encrypt `_to_delete/api-backups/*` (contains password hashes, refresh-token hashes, customer PII)
- [ ] Remove the stale AWS/Serverless workflow from `xdopestore-api/.github/workflows/deploy.yml`
- [ ] Add ESLint (`next/core-web-vitals`, `react/no-danger`) and fix the existing rules-of-hooks violations (e.g. `FooterNewsLetter.jsx` returns before hooks)
- [ ] Finish or remove the password-reset UI (L7)

---

## 10. Security checklist for CI/CD (implemented in `.github/workflows/security.yml`)

1. `npm ci --legacy-peer-deps` — fails on lockfile drift.
2. `npm run test:unit` — session, checkout rules and the new security utilities (63 tests).
3. `npm audit --audit-level=high` — blocks vulnerable dependencies.
4. Gitleaks secret scan on every push/PR.
5. `npm run build` with production env — validates config, headers and every page.
6. To add: `npm run lint` once ESLint is configured; Playwright smoke (`e2e/01-login`, `03-checkout`, `18-checkout-session-validation`) against a seeded API; Dependabot; branch protection requiring this workflow.

**Local verification performed:** `npm run test:unit` 63/63 pass; `npm audit` 0 critical (3 transitive build-tool advisories left after `npm audit fix`); `next build` in production mode succeeded twice — after the source patches and again after `npm audit fix` and the sanitiser cleanup.

---

## 11. Remaining risks

| Risk | Why it remains | Mitigation path |
|---|---|---|
| Tokens readable by JS (H3) | Requires the BFF/HttpOnly refactor across UI + e2e | §7.1; until then the CSP, sanitiser and URL validation reduce XSS likelihood |
| CSP allows inline scripts | Next.js needs nonces to drop `'unsafe-inline'` | §7.2 |
| Mock `/api/**` routes still deployed | Deletion blocked by tooling policy during this session | `git rm -r src/app/api` |
| Test account may exist in production | Cannot be verified from the UI repo | Query the users collection; rotate or delete |
| Production data dumps on disk | Outside the repository | Delete / move to encrypted storage |
| Middleware is a UX gate only | By design; the API is the authority | Keep API-side checks as the source of truth (verified) |
| Transitive dev-tool advisories | Pinned by eslint/sass/Next | `npm audit fix`, Next 16 upgrade |
| Password reset unusable from the storefront | Functional gap, not exploitable | Implement or remove the flow |
| Playwright suite not executed in this audit | Needs API + seeded DB running | Run `npm run test:e2e` with `npm run start:e2e` in the API before merging |
