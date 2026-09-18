import assert from "node:assert/strict";
import test from "node:test";
import { safeContactUrl, safeHref, safeHttpUrl } from "./safeUrl.js";

test("safeHttpUrl accepts http and https only", () => {
  assert.equal(safeHttpUrl("https://example.com/x?y=1"), "https://example.com/x?y=1");
  assert.equal(safeHttpUrl("http://example.com"), "http://example.com/");
  assert.equal(safeHttpUrl("javascript:alert(1)"), null);
  assert.equal(safeHttpUrl("JAVASCRIPT:alert(1)"), null);
  assert.equal(safeHttpUrl("data:text/html,<script>alert(1)</script>"), null);
  assert.equal(safeHttpUrl("vbscript:msgbox"), null);
  assert.equal(safeHttpUrl("/relative/path"), null);
  assert.equal(safeHttpUrl(""), null);
  assert.equal(safeHttpUrl(undefined), null);
  assert.equal(safeHttpUrl("not a url", "/"), "/");
});

test("safeContactUrl also allows mailto and tel", () => {
  assert.equal(safeContactUrl("mailto:hi@example.com"), "mailto:hi@example.com");
  assert.equal(safeContactUrl("tel:+573001234567"), "tel:+573001234567");
  assert.equal(safeContactUrl("https://wa.me/573001234567"), "https://wa.me/573001234567");
  assert.equal(safeContactUrl("javascript:alert(1)"), null);
});

test("safeHref allows same-origin paths and http(s) URLs, nothing else", () => {
  assert.equal(safeHref("/collections?category=shoes"), "/collections?category=shoes");
  assert.equal(safeHref("https://instagram.com/xdope"), "https://instagram.com/xdope");
  assert.equal(safeHref("javascript:alert(1)"), "/");
  assert.equal(safeHref("//evil.example"), "/");
  assert.equal(safeHref(undefined, "/collections"), "/collections");
});
