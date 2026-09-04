import assert from "node:assert/strict";
import test from "node:test";
import { buildReviewPayload, itemsForOrder, summarizePending, validateRating } from "./pendingReviewsRules.js";

const items = [
  { order_id: "a1", order_number: 2001, product: { id: "p1", name: "Camisa" } },
  { order_id: "a1", order_number: 2001, product: { id: "p2", name: "Jean" } },
  { order_id: "b2", order_number: 2003, product: { id: "p3", name: "Botas" } },
];

test("sin pedido se devuelven todos los productos pendientes", () => {
  assert.equal(itemsForOrder(items).length, 3);
  assert.equal(itemsForOrder(items, null).length, 3);
});

test("se filtra por número de pedido (string o número) o por id", () => {
  assert.deepEqual(itemsForOrder(items, "2001").map((i) => i.product.id), ["p1", "p2"]);
  assert.deepEqual(itemsForOrder(items, 2003).map((i) => i.product.id), ["p3"]);
  assert.deepEqual(itemsForOrder(items, "b2").map((i) => i.product.id), ["p3"]);
  assert.deepEqual(itemsForOrder(items, 9999), []);
});

test("el resumen cuenta productos y pedidos distintos", () => {
  assert.deepEqual(summarizePending(items), { count: 3, orderNumbers: [2001, 2003] });
  assert.deepEqual(summarizePending([]), { count: 0, orderNumbers: [] });
});

test("la calificación debe ser un entero de 1 a 5", () => {
  assert.equal(validateRating(undefined), "SelectARating");
  assert.equal(validateRating(0), "SelectARating");
  assert.equal(validateRating(6), "SelectARating");
  assert.equal(validateRating("4"), null);
});

test("el payload normaliza tipos y recorta la opinión", () => {
  assert.deepEqual(buildReviewPayload({ productId: "p1", rating: "5", description: "  genial  " }), { product_id: "p1", rating: 5, description: "genial" });
  assert.deepEqual(buildReviewPayload({ productId: "p1", rating: 3 }), { product_id: "p1", rating: 3, description: "" });
});
