import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeHtml, trustedHtml, SANITIZE_OPTIONS } from "./sanitizeHtml.js";

test("never emits untrusted HTML without a DOM (server side)", () => {
  assert.equal(sanitizeHtml("<img src=x onerror=alert(1)>"), "");
  assert.deepEqual(trustedHtml("<b>hi</b>"), { __html: "" });
});

test("rejects non-string input", () => {
  assert.equal(sanitizeHtml(null), "");
  assert.equal(sanitizeHtml(42), "");
});

test("active content is on the forbid list", () => {
  for (const tag of ["script", "iframe", "form", "object", "embed"]) assert.ok(SANITIZE_OPTIONS.FORBID_TAGS.includes(tag));
  assert.ok(SANITIZE_OPTIONS.FORBID_ATTR.includes("onerror"));
});
