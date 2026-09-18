import assert from "node:assert/strict";
import { test } from "node:test";
import { discountPercent, originalPriceToStrike } from "./priceRules.js";

const product = { price: 189900, sale_price: 149900, discount: 21 };

test("producto simple con rebaja: tacha el precio y muestra el porcentaje guardado", () => {
  assert.equal(originalPriceToStrike({ product }), 189900);
  assert.equal(discountPercent({ product }), 21);
});

test("producto sin rebaja: nada que tachar ni porcentaje (aunque el padre lo tuviera)", () => {
  assert.equal(originalPriceToStrike({ product: { price: 100, sale_price: 100, discount: 0 } }), null);
  assert.equal(discountPercent({ product: { price: 100, sale_price: 100, discount: null } }), null);
  // variante elegida sin rebaja bajo un padre con rebaja: manda la variante
  const state = { product, selectedVariation: { price: 200000, sale_price: 200000, discount: null } };
  assert.equal(originalPriceToStrike(state), null);
  assert.equal(discountPercent(state), null);
});

test("variante con rebaja: se usa su precio, no el del padre", () => {
  const state = { product: { price: 100, sale_price: 100 }, selectedVariation: { price: 120, sale_price: 90, discount: null } };
  assert.equal(originalPriceToStrike(state), 120);
  assert.equal(discountPercent(state), 25, "porcentaje derivado del precio cuando el campo falta");
});

test("valores raros no rompen: sale_price 0/null o precios no numéricos", () => {
  assert.equal(originalPriceToStrike({ product: { price: 100, sale_price: 0 } }), null);
  assert.equal(originalPriceToStrike({ product: { price: "abc", sale_price: 10 } }), null);
  assert.equal(discountPercent({}), null);
});
