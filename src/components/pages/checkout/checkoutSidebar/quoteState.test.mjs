import assert from "node:assert/strict";
import test from "node:test";
import { checkoutCity, createLatestQuoteRequest, hasShippingQuote, requestCheckoutQuote, quotedCartLine } from "./quoteState.js";

test("rejected coupons recalculate the same destination without carrying the invalid code", async () => {
  const sent = [];
  const summary = { status: 200, data: { total: 169900, shipping_quote: { amount: 9900 } } };
  const result = await requestCheckoutQuote(async (payload) => {
    sent.push(payload);
    return payload.coupon_code ? { status: 422, data: { message: "Invalid coupon" } } : summary;
  }, { city: "Bogotá", products: [{ product_id: "p1", quantity: 1 }], coupon_code: "BAD" });
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[1], { ...sent[0], coupon_code: "" });
  assert.deepEqual(result, { response: summary, couponError: "Invalid coupon", couponCode: "" });
});

test("service failures are not treated as invalid coupons or retried automatically", async () => {
  let calls = 0;
  const result = await requestCheckoutQuote(async () => { calls++; return { status: 503 }; }, { coupon_code: "SAVE" });
  assert.equal(calls, 1);
  assert.equal(result.response.status, 503);
  assert.equal(result.couponError, "");
});

test("network exceptions produce a failed result so checkout can stop loading and retry", async () => {
  const result = await requestCheckoutQuote(async () => { throw new Error("offline"); }, {});
  assert.equal(result.response, null);
});

test("quoted prices match product, variant and quantity, not list position", () => {
  const lines = [
    { product_id: { _id: "p1" }, variation_id: "v2", quantity: 1, sub_total: 200 },
    { product_id: { _id: "p1" }, variation_id: "v1", quantity: 1, sub_total: 150 },
  ];
  assert.equal(quotedCartLine({ product_id: "p1", variation_id: "v1", quantity: 1 }, lines).sub_total, 150);
  assert.equal(quotedCartLine({ product_id: "p1", variation_id: "v1", quantity: 2 }, lines), undefined);
});

test("a restored guest card supplies the city before inline fields synchronize", () => {
  assert.equal(checkoutCity({ shipping_address_id: "guest-1", guest_addresses: [{ id: "guest-1", city: "Bogotá" }], shipping_address: { city: "" } }, true), "Bogotá");
});

test("changing the guest card overrides an old inline city", () => {
  assert.equal(checkoutCity({ shipping_address_id: "guest-2", guest_addresses: [{ id: "guest-2", city: "Leticia" }], shipping_address: { city: "Bogotá" } }, true), "Leticia");
});

test("an uncalculated zero is not free shipping; confirmed zero and paid quotes are valid", () => {
  assert.equal(hasShippingQuote({ shipping_total: 0, shipping_quote: null }), false);
  assert.equal(hasShippingQuote({ shipping_quote: { amount: 9900, free_shipping: false } }), true);
  assert.equal(hasShippingQuote({ shipping_quote: { amount: 0, free_shipping: true } }), true);
});

test("an older zero response cannot replace the selected address quote", async () => {
  const gate = createLatestQuoteRequest();
  let finishOld;
  const committed = [];
  const old = gate.run(() => new Promise(resolve => { finishOld = resolve; }), value => committed.push(value));
  await gate.run(async () => ({ shipping_total: 9900 }), value => committed.push(value));
  finishOld({ shipping_total: 0 });
  await old;
  assert.deepEqual(committed, [{ shipping_total: 9900 }]);
});

test("unmount invalidates outstanding quote responses", async () => {
  const gate = createLatestQuoteRequest();
  let finish;
  let committed = false;
  const pending = gate.run(() => new Promise(resolve => { finish = resolve; }), () => { committed = true; });
  gate.invalidate();
  finish({ shipping_total: 0 });
  await pending;
  assert.equal(committed, false);
});
