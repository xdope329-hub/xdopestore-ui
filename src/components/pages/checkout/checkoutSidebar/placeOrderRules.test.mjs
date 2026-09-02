import assert from "node:assert/strict";
import test from "node:test";
import { buildInitializePayload, getGuestRegistrationPayload, getMissingRequirements } from "./placeOrderRules.js";

const ready = {
  billing_address_id: "guest-1",
  shipping_address_id: "guest-1",
  payment_method: "cod",
};

test("sin direcciones ni pago: se listan en el orden en que se muestran", () => {
  const { missing, hasFieldErrors } = getMissingRequirements({ values: {}, isGuest: true });
  assert.deepEqual(missing, ["SelectBillingAddressFirst", "SelectShippingAddressFirst", "SelectPaymentMethodFirst"]);
  assert.equal(hasFieldErrors, false);
});

test("invitado con direcciones y pago pero datos de contacto inválidos", () => {
  const { missing, hasFieldErrors } = getMissingRequirements({ values: ready, errors: { email: "Enter Valid Email" }, isGuest: true });
  assert.deepEqual(missing, ["CompleteRequiredFields"]);
  assert.equal(hasFieldErrors, true);
});

test("con sesión los errores de Formik de los campos de invitado no bloquean el pedido", () => {
  const { missing, hasFieldErrors } = getMissingRequirements({ values: ready, errors: { name: "Name is a required" }, isGuest: false });
  assert.deepEqual(missing, []);
  assert.equal(hasFieldErrors, false);
});

test("carrito solo digital no exige dirección de envío", () => {
  const { missing } = getMissingRequirements({ values: { billing_address_id: "1", payment_method: "cod" }, isGuest: false, requiresShipping: false });
  assert.deepEqual(missing, []);
});

test("los mensajes pasan por la función de traducción", () => {
  const { missing } = getMissingRequirements({ values: {}, isGuest: false, requiresShipping: false, t: (k) => `t:${k}` });
  assert.deepEqual(missing, ["t:SelectBillingAddressFirst", "t:SelectPaymentMethodFirst"]);
});

test("payload de invitado: sin contraseña ni tarjetas locales, con productos del carrito", () => {
  const values = {
    ...ready,
    name: "Ana",
    email: "ana@example.com",
    phone: "3001234567",
    country_code: "57",
    create_account: true,
    password: "Secreta123",
    guest_addresses: [{ id: "guest-1" }],
    shipping_address: { title: "Casa" },
    billing_address: { title: "Casa" },
    coupon: "",
  };
  const cart = [{ product_id: "p1", quantity: 2 }];
  const payload = buildInitializePayload({ values, isGuest: true, cartProducts: cart });
  assert.equal("password" in payload, false);
  assert.equal("guest_addresses" in payload, false);
  assert.equal("shipping_address_id" in payload, false);
  assert.equal("billing_address_id" in payload, false);
  assert.deepEqual(payload.products, cart);
  assert.deepEqual(payload.shipping_address, { title: "Casa" });
  assert.equal(payload.create_account, true);
  assert.equal(payload.email, "ana@example.com");
  // El estado original no se muta.
  assert.equal(values.password, "Secreta123");
});

test("payload con sesión: conserva los ids de dirección y tampoco envía contraseña", () => {
  const values = { ...ready, password: "", guest_addresses: [], products: [] };
  const payload = buildInitializePayload({ values, isGuest: false, cartProducts: [{ product_id: "ignored" }] });
  assert.equal(payload.billing_address_id, "guest-1");
  assert.equal(payload.shipping_address_id, "guest-1");
  assert.equal("password" in payload, false);
  assert.equal("guest_addresses" in payload, false);
  assert.deepEqual(payload.products, []);
});

test("un cupón escrito pero no aplicado nunca viaja al pago; el aplicado va como coupon_code", () => {
  const values = { ...ready, coupon: "INVALIDO999" };
  const withoutApplied = buildInitializePayload({ values, isGuest: false });
  assert.equal("coupon" in withoutApplied, false);
  assert.equal(withoutApplied.coupon_code, "");

  const withApplied = buildInitializePayload({ values, isGuest: true, cartProducts: [], couponCode: "BIENVENIDO15" });
  assert.equal("coupon" in withApplied, false);
  assert.equal(withApplied.coupon_code, "BIENVENIDO15");
});

test("registro en segundo plano solo cuando se pidió crear cuenta con contraseña", () => {
  assert.equal(getGuestRegistrationPayload({ create_account: false, password: "Secreta123" }), null);
  assert.equal(getGuestRegistrationPayload({ create_account: true, password: "" }), null);
  assert.deepEqual(
    getGuestRegistrationPayload({ create_account: true, password: "Secreta123", name: "Ana", email: "a@b.co", phone: "3001234567", country_code: "57", coupon: "X" }),
    { name: "Ana", email: "a@b.co", password: "Secreta123", phone: "3001234567", country_code: "57" }
  );
});
