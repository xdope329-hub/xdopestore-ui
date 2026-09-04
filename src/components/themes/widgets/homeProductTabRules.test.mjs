import assert from "node:assert/strict";
import test from "node:test";
import { selectHomeTabCategories } from "./homeProductTabRules.js";

const mujer = { id: "1", name: "Mujer", products_count: 5, subcategories: [{ id: "11", name: "Vestidos", products_count: 2 }] };
const hombre = { id: "2", name: "Hombre", products_count: 3 };
const vacia = { id: "3", name: "Accesorios", products_count: 0 };
const flat = [mujer, hombre, vacia, { id: "11", name: "Vestidos", products_count: 2 }];

test("sin lista configurada se muestran las categorías con productos", () => {
  assert.deepEqual(selectHomeTabCategories(flat, undefined).map((c) => c.id), ["1", "2", "11"]);
  assert.deepEqual(selectHomeTabCategories(flat, null).map((c) => c.id), ["1", "2", "11"]);
});

test("sin lista ni conteos se muestran todas", () => {
  const sinConteo = [{ id: "a", name: "A" }, { id: "b", name: "B" }];
  assert.deepEqual(selectHomeTabCategories(sinConteo, undefined), sinConteo);
});

test("con lista configurada se respeta exactamente y en el orden del admin", () => {
  assert.deepEqual(selectHomeTabCategories(flat, ["2", "1"]).map((c) => c.id), ["2", "1"]);
  assert.deepEqual(selectHomeTabCategories(flat, ["2"]).map((c) => c.id), ["2"]);
});

test("el admin quitó todas las categorías: no se muestra ninguna (antes volvían todas)", () => {
  assert.deepEqual(selectHomeTabCategories(flat, []), []);
});

test("ids desconocidos o repetidos se ignoran", () => {
  assert.deepEqual(selectHomeTabCategories(flat, ["zz", "1", "1"]).map((c) => c.id), ["1"]);
  assert.deepEqual(selectHomeTabCategories(flat, ["zz"]), []);
});

test("modo anidado: se buscan las elegidas también dentro de las subcategorías", () => {
  assert.deepEqual(selectHomeTabCategories([mujer, hombre], ["1"], { nested: true }).map((c) => c.id), ["1"]);
  assert.deepEqual(selectHomeTabCategories([mujer, hombre], ["11"], { nested: true }).map((c) => c.id), ["11"]);
  assert.deepEqual(selectHomeTabCategories([mujer, hombre], ["1", "11"], { nested: true }).map((c) => c.id), ["1", "11"]);
});

test("datos de categorías aún sin cargar", () => {
  assert.deepEqual(selectHomeTabCategories(undefined, ["1"]), []);
  assert.deepEqual(selectHomeTabCategories(undefined, undefined), []);
});
