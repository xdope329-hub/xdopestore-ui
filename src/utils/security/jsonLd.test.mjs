import assert from "node:assert/strict";
import test from "node:test";
import { serializeJsonLd } from "./jsonLd.js";

test("escapes script-breaking characters but stays valid JSON", () => {
  const payload = { name: "</script><script>alert(1)</script>", a: "x & y", ls: "a" + String.fromCharCode(0x2028) + "b" };
  const out = serializeJsonLd(payload);
  assert.equal(out.includes("</script"), false);
  assert.equal(out.includes("<"), false);
  assert.equal(out.includes(">"), false);
  assert.equal(out.includes("&"), false);
  assert.equal(out.includes(String.fromCharCode(0x2028)), false);
  assert.deepEqual(JSON.parse(out), payload);
});

test("handles null and undefined", () => {
  assert.equal(serializeJsonLd(null), "{}");
  assert.equal(serializeJsonLd(undefined), "{}");
});
