import assert from "node:assert/strict";
import test from "node:test";
import { orderFromTrackingResponse } from "./orderTrackingRules.js";

const order = { order_number: 2004, products: [], total: 599600 };

test("solo un 200 con pedido se muestra", () => {
  assert.equal(orderFromTrackingResponse({ status: 200, data: order }), order);
});

test("errores del API (401, 404) no se pintan como pedido vacío", () => {
  assert.equal(orderFromTrackingResponse({ status: 401, data: { message: "Unauthorized" } }), null);
  assert.equal(orderFromTrackingResponse({ status: 404, data: { message: "Order not found" } }), null);
  assert.equal(orderFromTrackingResponse({ status: 0, data: null, error: new Error("red") }), null);
});

test("un 200 sin pedido tampoco", () => {
  assert.equal(orderFromTrackingResponse({ status: 200, data: { message: "ok" } }), null);
  assert.equal(orderFromTrackingResponse({ status: 200, data: [] }), null);
  assert.equal(orderFromTrackingResponse(undefined), null);
});
