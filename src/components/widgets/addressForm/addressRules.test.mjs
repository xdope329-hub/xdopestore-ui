import assert from "node:assert/strict";
import test from "node:test";
import { addressModalLabels, applyAddressUpdate, buildAddressPayload, toAddressFormValues } from "./addressRules.js";

const saved = { id: "a1", title: "Casa", street: "Calle 1", country_id: 47, state_id: 3, city: "Bogotá", pincode: "110111", phone: "3105550147", country_code: "57", is_default: true };

test("nueva dirección: campos vacíos, Colombia por defecto y sin marcar predeterminada", () => {
  assert.deepEqual(toAddressFormValues(undefined, { type: "shipping" }), {
    title: "", street: "", country_id: "", state_id: "", city: "", pincode: "", phone: "", type: "shipping", country_code: "57", is_default: false,
  });
  assert.equal(toAddressFormValues({}, { defaultIsDefault: true }).is_default, true);
});

test("editar: se cargan los datos guardados tal cual", () => {
  const v = toAddressFormValues(saved);
  assert.equal(v.title, "Casa");
  assert.equal(v.country_id, 47);
  assert.equal(v.state_id, 3);
  assert.equal(v.is_default, true);
  assert.equal(toAddressFormValues({ _id: "x", phone: "1" }).phone, "1");
});

test("el payload recorta textos, fuerza pincode a texto y solo lleva _method al editar", () => {
  const p = buildAddressPayload({ title: " Casa ", street: " Calle 1 ", city: "Bogotá", pincode: 110111, phone: " 3105550147 ", is_default: 1 }, { editing: true });
  assert.equal(p.title, "Casa");
  assert.equal(p.street, "Calle 1");
  assert.equal(p.pincode, "110111");
  assert.equal(p.phone, "3105550147");
  assert.equal(p.is_default, true);
  assert.equal(p._method, "PUT");
  assert.equal(buildAddressPayload({ _method: "PUT", pincode: null }).pincode, "");
  assert.equal("_method" in buildAddressPayload({ _method: "PUT" }), false);
});

test("al guardar se reemplaza por id y la predeterminada desplaza a las demás", () => {
  const list = [{ id: "a1", title: "Casa", is_default: true }, { id: "a2", title: "Oficina", is_default: false }];
  const out = applyAddressUpdate(list, { id: "a2", title: "Oficina 2", is_default: true });
  assert.deepEqual(out, [{ id: "a1", title: "Casa", is_default: false }, { id: "a2", title: "Oficina 2", is_default: true }]);
});

test("si la guardada no es predeterminada, las demás no cambian; una nueva se añade", () => {
  const list = [{ id: "a1", is_default: true }];
  assert.deepEqual(applyAddressUpdate(list, { id: "a1", title: "Casa" }), [{ id: "a1", is_default: true, title: "Casa" }]);
  assert.equal(applyAddressUpdate(list, { _id: "a3", is_default: false }).length, 2);
  assert.equal(applyAddressUpdate(list, {}), list);
});

test("etiquetas del modal", () => {
  assert.deepEqual(addressModalLabels(true), { title: "EditAddress", submit: "Save" });
  assert.deepEqual(addressModalLabels(false), { title: "AddAddress", submit: "Submit" });
});
