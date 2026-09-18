import test from "node:test";
import assert from "node:assert/strict";
import { selectedBundleVariation, variationAvailable, variationLabel } from "./variantOptions.js";

const small = { id: "small", status: 1, stock_status: "in_stock", quantity: 3, name: "Small", sale_price: 40000 };
const large = { ...small, id: "large", name: "Large", sale_price: 80000 };
const item = { product: { variations: [small, large] }, allowedIds: [] };

test("bundle choices remain empty until an allowed, available variant is selected", () => {
  assert.equal(selectedBundleVariation(item, ""), null);
  assert.equal(selectedBundleVariation(item, "missing"), null);
  assert.equal(selectedBundleVariation(item, "large"), large);
  assert.equal(selectedBundleVariation({ ...item, allowedIds: ["small"] }, "large"), null);
  assert.equal(selectedBundleVariation({ ...item, product: { variations: [small] } }, "large"), null);
  assert.equal(selectedBundleVariation({ ...item, product: { variations: [{ ...large, status: 0 }] } }, "large"), null);
});

test("variant names remain readable without attribute definitions", () => {
  assert.equal(variationLabel(large), "Large");
  assert.equal(variationLabel({ ...large, attribute_values: [] }), "Large");
  assert.equal(variationLabel({ ...large, attribute_values: [{ value: "Red" }, { value: "L" }] }), "Red / L");
});

test("out-of-stock and inactive variants are not purchasable", () => {
  for (const fields of [{ quantity: 0 }, { stock_status: "out_of_stock" }, { status: 0 }, { status: false }]) {
    assert.equal(variationAvailable({ ...small, ...fields }), false);
  }
  assert.equal(variationAvailable(small), true);
});
