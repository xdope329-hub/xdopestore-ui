import assert from "node:assert/strict";
import test from "node:test";
import { checkoutCity, createLatestQuoteRequest, hasShippingQuote } from "./quoteState.js";

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
