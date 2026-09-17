# Checkout terms acceptance

Every guest and signed-in checkout requires an unchecked-by-default terms checkbox immediately above Place Order. Terms and privacy links open in a new tab so the customer retains their checkout. Privacy is an informational link, not marketing or analytics consent. Acceptance is never restored from a saved checkout draft.

The storefront reads `GET /checkout/terms` to obtain the current version. It sends `terms_accepted: true` and `terms_version` to `POST /payment/initialize`. The API also enforces the same requirement on legacy `POST /order`; quotes remain available without acceptance. Missing acceptance returns `422 TERMS_ACCEPTANCE_REQUIRED`; a changed version returns `422 TERMS_VERSION_CHANGED`. The checkout clears acceptance and asks the customer to review the terms again. If the version cannot be loaded, checkout offers a retry and cannot place an order.

The API stores `terms_acceptance` on the order: acceptance, a server-generated timestamp, version, path, source and a snapshot of the accepted text. Historical orders keep this field null. The text snapshot is excluded from normal queries (`select: false`); an authorized internal query can explicitly select `+terms_acceptance.content` when evidence is needed. This does not require an admin dashboard setting or a database migration.

## Editing the terms

Published admin Pages with slug `terms-and-conditions` take precedence. The API hashes the title and content to identify the revision and preserves that content with the order. CMS edits automatically change the revision; no storefront rebuild is needed.

If no published page has content, the storefront uses `src/data/legal/terms.js`. The API archives this same bilingual text in `src/data/legal/terms-2026-08-27.json` with version `bundled-2026-08-27`. When changing the bundled text, add a new dated archive in the API and update the API import/version and storefront `BUNDLED_TERMS_VERSION` together. Do not overwrite an old archive. Mismatched bundled versions block checkout until the corresponding storefront is deployed. API failures on the legal page display a retry instead of substituting different legal text.

## Deployment and verification

Release **both `xdopestore-api` and `xdopestore-ui` together**. Until both are deployed, old clients without acceptance will receive a validation error or the new storefront will be unable to obtain the version. No GA4 or admin configuration is needed for this feature.

API coverage: `__tests__/terms-acceptance.test.js` covers guests, accounts, the legacy route, strict boolean validation, changed CMS text, server-owned evidence and historical orders. Storefront unit tests cover the submission rules, version loading and exclusion from saved drafts. `e2e/21-checkout-terms.spec.js` uses mocked requests to cover the checkbox, new-tab links, stale terms, retry, reload and mobile behavior without placing real orders.
