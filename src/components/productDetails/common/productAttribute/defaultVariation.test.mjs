import assert from "node:assert/strict";
import test from "node:test";
import { effectivePrice, isSellable, pickDefaultVariation } from "./defaultVariation.js";

const v = (name, extra = {}) => ({ name, price: 159999, sale_price: 143999.1, discount: 10, quantity: 1, stock_status: "in_stock", status: 1, ...extra });

test("abre con la variación vendible más barata, no con la primera", () => {
  const variations = [v("Beige/S", { sale_price: 151999.05, discount: 5 }), v("Beige/M"), v("Cafe/S", { sale_price: 79999.5, discount: 50 }), v("Cafe/M")];
  assert.equal(pickDefaultVariation(variations)?.name, "Cafe/S");
});

test("a igual precio gana el orden del admin (la primera)", () => {
  const variations = [v("S"), v("M"), v("L")];
  assert.equal(pickDefaultVariation(variations)?.name, "S");
});

test("una variación agotada o desactivada no puede ser la predeterminada aunque sea la más barata", () => {
  const variations = [v("S"), v("Oferta agotada", { sale_price: 1000, stock_status: "out_of_stock" }), v("Oferta oculta", { sale_price: 2000, status: 0 })];
  assert.equal(pickDefaultVariation(variations)?.name, "S");
});

test("sin variaciones vendibles no se preselecciona nada", () => {
  assert.equal(pickDefaultVariation([v("S", { stock_status: "out_of_stock" })]), null);
  assert.equal(pickDefaultVariation([]), null);
  assert.equal(pickDefaultVariation(undefined), null);
});

test("sin precio de oferta cuenta el precio; precios inválidos no ganan", () => {
  assert.equal(effectivePrice({ price: 100, sale_price: null }), 100);
  assert.equal(effectivePrice({ price: 100, sale_price: 0 }), 100);
  assert.equal(effectivePrice({ price: 100, sale_price: 80 }), 80);
  const variations = [v("Sin precio", { price: undefined, sale_price: undefined }), v("M", { sale_price: 90000 })];
  assert.equal(pickDefaultVariation(variations)?.name, "M");
});

test("isSellable", () => {
  assert.equal(isSellable(v("S")), true);
  assert.equal(isSellable(v("S", { status: 0 })), false);
  assert.equal(isSellable(v("S", { stock_status: "out_of_stock" })), false);
  assert.equal(isSellable(v("S", { status: undefined })), true);
  assert.equal(isSellable(null), false);
});
