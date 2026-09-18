import test from "node:test";
import assert from "node:assert/strict";
import { loadCheckoutTerms } from "./checkoutTerms.js";

test("loads the server terms version for CMS and the matching bundled fallback", async () => {
  for (const data of [{ source: "cms", version: "cms-current" }, { source: "bundled", version: "bundled-2026-08-27" }]) {
    assert.deepEqual(await loadCheckoutTerms(async () => ({ ok: true, data })), data);
  }
});

test("unavailable terms and mismatched fallback deployments fail closed", async () => {
  for (const response of [{ ok: false }, { ok: true, data: {} }, { ok: true, data: { source: "bundled", version: "new-revision" } }]) {
    await assert.rejects(() => loadCheckoutTerms(async () => response), /CheckoutTermsUnavailable/);
  }
});
