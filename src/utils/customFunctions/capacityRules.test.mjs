import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_CAPACITY_MESSAGE,
  buildCapacityWhatsAppMessage,
  capacityExcess,
  cartUnits,
  describeCartLine,
  isCapacityReached,
} from "./capacityRules.js";

const cart = [
  { quantity: 2, product: { name: "Hoodie Negro" }, variation: { name: "M / Negro", attribute_values: [{ name: "Talla", value: "M" }, { name: "Color", value: "Negro" }] } },
  { quantity: 1, product: { name: "Gorra" }, variation: null },
];

test("isCapacityReached: solo con la capacidad activa y el cupo lleno", () => {
  assert.equal(isCapacityReached(undefined), false);
  assert.equal(isCapacityReached({ enabled: false, reached: true }), false);
  assert.equal(isCapacityReached({ enabled: true, reached: false }), false);
  assert.equal(isCapacityReached({ enabled: true, reached: true }), true);
});

test("cartUnits suma las cantidades del carrito", () => {
  assert.equal(cartUnits(cart), 3);
  assert.equal(cartUnits(null), 0);
});

test("capacityExcess: avisa cuando el carrito supera el cupo restante", () => {
  assert.equal(capacityExcess({ enabled: true, reached: false, remaining: 3, mode: "units" }, cart), null);
  assert.deepEqual(capacityExcess({ enabled: true, reached: false, remaining: 1, mode: "units" }, cart), { remaining: 1, units: 3 });
  assert.equal(capacityExcess({ enabled: true, reached: false, remaining: 1, mode: "orders" }, cart), null, "en modo pedidos las unidades no importan");
  assert.equal(capacityExcess({ enabled: true, reached: true, remaining: 0 }, cart), null, "con el cupo lleno el aviso es otro");
  assert.equal(capacityExcess({ enabled: false, remaining: 0 }, cart), null);
});

test("describeCartLine: nombre, variante y cantidad", () => {
  assert.equal(describeCartLine(cart[0]), "Hoodie Negro (Talla: M, Color: Negro) x2");
  assert.equal(describeCartLine(cart[1]), "Gorra x1");
  assert.equal(describeCartLine({ quantity: 1 }), "");
});

test("buildCapacityWhatsAppMessage: mensaje del admin más los productos del carrito", () => {
  const message = buildCapacityWhatsAppMessage({ capacity: { whatsapp_message: "Hola, ¿cuándo pueden atender un pedido?" }, cartItems: cart });
  assert.equal(message, "Hola, ¿cuándo pueden atender un pedido?\nMe interesa:\n• Hoodie Negro (Talla: M, Color: Negro) x2\n• Gorra x1");
  assert.equal(buildCapacityWhatsAppMessage({ capacity: { whatsapp_message: "  " }, cartItems: [] }), DEFAULT_CAPACITY_MESSAGE);
  assert.equal(buildCapacityWhatsAppMessage(), DEFAULT_CAPACITY_MESSAGE);
});
