import test from "node:test";
import assert from "node:assert/strict";
import { lineUnitPrice, mergeCartLines, packageLines, packageMissingVariant, packageTotal } from "./crossSellPackage.js";

const small = { id: "small", status: 1, stock_status: "in_stock", quantity: 3, name: "Small", sale_price: 40000 };
const large = { ...small, id: "large", name: "Large", sale_price: 80000, quantity: 1 };
const shirt = { id: "shirt", name: "Camisa", sale_price: 135000, quantity: 5, variations: [] };
const shorts = { id: "shorts", name: "Short", sale_price: 60000, quantity: 10, variations: [small, large] };
const vinoS = { id: "vino-s", name: "S / Vino", sale_price: 90000, quantity: 2 };
const dress = { id: "dress", name: "Vestido", sale_price: 100000, quantity: 0, variations: [vinoS] };
const items = [{ product: shirt, allowedIds: [] }, { product: shorts, allowedIds: [] }];
const summary = (lines) => lines.map((line) => [line.product_id, line.variation_id, line.sub_total]);

test("the package always starts with the product on the page", () => {
  const lines = packageLines({ parent: dress, parentVariation: vinoS, items, checkedIds: [] });
  assert.deepEqual(summary(lines), [["dress", "vino-s", 90000]]);
  assert.equal(packageTotal(lines), 90000);
  assert.deepEqual(packageLines({ parent: null, items, checkedIds: ["shirt"] }), []);
});

test("the total adds every ticked related product to this product", () => {
  const lines = packageLines({ parent: dress, parentVariation: vinoS, items, checkedIds: ["shirt", "shorts"], selectedVariations: { shorts: large } });
  assert.deepEqual(summary(lines), [["dress", "vino-s", 90000], ["shirt", null, 135000], ["shorts", "large", 80000]]);
  assert.equal(packageTotal(lines), 305000);
  // Without a chosen variant the related product counts at its own price until one is picked.
  assert.equal(packageTotal(packageLines({ parent: shirt, items, checkedIds: ["shorts"] })), 135000 + 60000);
  assert.equal(packageTotal([]), 0);
});

test("a variant is required for this product and for each ticked related product", () => {
  assert.equal(packageMissingVariant({ parent: dress, parentVariation: null, items, checkedIds: ["shirt"] }), true);
  assert.equal(packageMissingVariant({ parent: dress, parentVariation: vinoS, items, checkedIds: ["shirt"] }), false);
  assert.equal(packageMissingVariant({ parent: shirt, items, checkedIds: ["shorts"] }), true);
  assert.equal(packageMissingVariant({ parent: shirt, items, checkedIds: ["shorts"], selectedVariations: { shorts: small } }), false);
  assert.equal(packageMissingVariant({ parent: shirt, items, checkedIds: [] }), false);
});

test("unit prices prefer the chosen variant and fall back to the product", () => {
  assert.equal(lineUnitPrice(shorts, large), 80000);
  assert.equal(lineUnitPrice(shorts, null), 60000);
  assert.equal(lineUnitPrice({ price: 10 }, { price: 7 }), 7);
  assert.equal(lineUnitPrice(undefined, undefined), 0);
});

test("merging adds new lines and increases quantity on identical lines", () => {
  const lines = packageLines({ parent: dress, parentVariation: vinoS, items, checkedIds: ["shirt"] });
  const cart = [{ product: dress, product_id: "dress", variation: vinoS, variation_id: "vino-s", quantity: 1, sub_total: 90000 }];
  const { cart: next, stockError } = mergeCartLines(cart, lines);
  assert.equal(stockError, null);
  assert.deepEqual(next.map((line) => [line.product_id, line.variation_id, line.quantity, line.sub_total]), [["dress", "vino-s", 2, 180000], ["shirt", null, 1, 135000]]);
  assert.equal(cart[0].quantity, 1, "the previous cart is not mutated");
  // Same product with another variant is a separate line; server carts may carry populated ids.
  const server = [{ product: shorts, product_id: { _id: "shorts" }, variation: small, variation_id: { _id: "small" }, quantity: 1, sub_total: 40000 }];
  const merged = mergeCartLines(server, packageLines({ parent: shorts, parentVariation: large })).cart;
  assert.deepEqual(merged.map((line) => [line.variation_id?._id ?? line.variation_id, line.quantity]), [["small", 1], ["large", 1]]);
  const same = mergeCartLines(server, packageLines({ parent: shorts, parentVariation: small })).cart;
  assert.deepEqual(same.map((line) => [line.variation_id?._id ?? line.variation_id, line.quantity, line.sub_total]), [["small", 2, 80000]]);
});

test("stock limits stop the whole package before anything changes", () => {
  const lines = packageLines({ parent: shirt, items, checkedIds: ["shorts"], selectedVariations: { shorts: large } });
  const cart = [{ product: shorts, product_id: "shorts", variation: large, variation_id: "large", quantity: 1, sub_total: 80000 }];
  const result = mergeCartLines(cart, lines);
  assert.deepEqual(result.stockError, { name: "Short", qty: 1 });
  assert.equal(result.cart, cart);
  // The chosen variant's quantity rules even when the product says 0; unknown stock never limits.
  assert.equal(mergeCartLines([], packageLines({ parent: dress, parentVariation: vinoS })).stockError, null);
  const noStockInfo = { product: { id: "x", name: "X", sale_price: 1 }, product_id: "x", variation: null, variation_id: null, quantity: 1, sub_total: 1 };
  assert.equal(mergeCartLines([], [noStockInfo]).stockError, null);
  const soldOut = { ...noStockInfo, product: { id: "y", name: "Y", quantity: 0, sale_price: 1 }, product_id: "y" };
  assert.deepEqual(mergeCartLines([], [soldOut]).stockError, { name: "Y", qty: 0 });
});
