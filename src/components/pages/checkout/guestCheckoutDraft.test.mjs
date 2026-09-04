import assert from "node:assert/strict";
import test from "node:test";
import { GUEST_DRAFT_KEY, clearDraft, loadDraft, pickDraft, saveDraft } from "./guestCheckoutDraft.js";

const memoryStorage = () => {
  const map = new Map();
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), removeItem: (k) => map.delete(k), map };
};

const values = {
  name: "Ana",
  email: "ana@example.com",
  phone: "3001234567",
  country_code: "57",
  password: "Secreta123",
  create_account: true,
  guest_addresses: [{ id: "guest-1", title: "Casa", street: "Calle 1" }],
  shipping_address_id: "guest-1",
  billing_address_id: "guest-1",
  payment_method: "cod",
  products: [{ product_id: "p1" }],
  coupon: "",
};

test("el borrador nunca incluye la contraseña ni el carrito", () => {
  const draft = pickDraft(values);
  assert.equal("password" in draft, false);
  assert.equal("products" in draft, false);
  assert.equal(draft.name, "Ana");
  assert.deepEqual(draft.guest_addresses, values.guest_addresses);
});

test("guardar y volver a cargar conserva contacto, tarjetas y selección", () => {
  const storage = memoryStorage();
  assert.equal(saveDraft(storage, values), true);
  const back = loadDraft(storage);
  assert.equal(back.email, "ana@example.com");
  assert.equal(back.shipping_address_id, "guest-1");
  assert.equal(back.payment_method, "cod");
});

test("una selección que apunta a una tarjeta inexistente se descarta", () => {
  const storage = memoryStorage();
  storage.setItem(GUEST_DRAFT_KEY, JSON.stringify({ name: "Ana", shipping_address_id: "guest-9", guest_addresses: [{ id: "guest-1" }] }));
  const back = loadDraft(storage);
  assert.equal(back.shipping_address_id, undefined);
  assert.equal(back.name, "Ana");
});

test("sin nada útil no hay borrador, y un JSON roto no rompe la página", () => {
  const storage = memoryStorage();
  assert.equal(saveDraft(storage, { name: "", guest_addresses: [] }), true);
  assert.equal(loadDraft(storage), null);
  storage.setItem(GUEST_DRAFT_KEY, "{not json");
  assert.equal(loadDraft(storage), null);
  assert.equal(loadDraft(null), null);
});

test("clearDraft borra el borrador", () => {
  const storage = memoryStorage();
  saveDraft(storage, values);
  clearDraft(storage);
  assert.equal(loadDraft(storage), null);
});
