import assert from "node:assert/strict";
import test from "node:test";
import { buildRefundPayload, refundButtonState } from "./refundRules.js";

const delivered = { payment_status: "completed", order_status: { slug: "delivered" } };
const returnable = { product_id: "p1", variation_id: "v1", is_return: 1, pivot: { refund_status: null } };

test("producto devolvible de un pedido entregado y pagado: se puede pedir reembolso", () => {
  assert.deepEqual(refundButtonState({ product: returnable, order: delivered }), { state: "refund" });
  assert.deepEqual(refundButtonState({ product: returnable, order: { ...delivered, payment_status: "paid" } }), { state: "refund" });
});

test("antes solo se aceptaba el número 1: el booleano true también habilita", () => {
  assert.deepEqual(refundButtonState({ product: { ...returnable, is_return: true }, order: delivered }), { state: "refund" });
});

test("producto no devolvible", () => {
  assert.deepEqual(refundButtonState({ product: { ...returnable, is_return: 0 }, order: delivered }), { state: "non_refundable" });
  assert.deepEqual(refundButtonState({ product: { ...returnable, is_return: false }, order: delivered }), { state: "non_refundable" });
});

test("sin entregar o sin pagar: habilitar después de la entrega", () => {
  assert.deepEqual(refundButtonState({ product: returnable, order: { ...delivered, order_status: { slug: "shipped" } } }), { state: "after_delivery" });
  assert.deepEqual(refundButtonState({ product: returnable, order: { ...delivered, payment_status: "pending" } }), { state: "after_delivery" });
});

test("con solicitud existente se muestra su estado", () => {
  assert.deepEqual(refundButtonState({ product: { ...returnable, pivot: { refund_status: "Pending" } }, order: delivered }), { state: "requested", status: "pending" });
});

test("el payload usa los ids de la línea del pedido, no del pivot", () => {
  assert.deepEqual(buildRefundPayload({ orderId: "o1", product: returnable, reason: "  defecto ", paymentType: "" }), { order_id: "o1", product_id: "p1", variation_id: "v1", reason: "defecto", payment_type: "original" });
});
