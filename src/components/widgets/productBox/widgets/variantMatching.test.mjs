import assert from "node:assert/strict";
import test from "node:test";
import { findVariationFor, getSellableVariations, getVariantAttributes, isSelectionComplete } from "./variantMatching.js";

// Producto de ejemplo: Talla (S/M/L) x Color (Rojo/Azul).
// - S/Rojo  -> en stock
// - S/Azul  -> agotada
// - M/Rojo  -> en stock
// - L/Rojo  -> variación despublicada (status 0)
// - "XL" existe como valor de atributo pero no tiene ninguna variación.
const SIZE = { id: 1, name: "Talla", style: "rectangle", attribute_values: [{ id: 11, value: "S", attribute_id: 1 }, { id: 12, value: "M", attribute_id: 1 }, { id: 13, value: "L", attribute_id: 1 }, { id: 14, value: "XL", attribute_id: 1 }] };
const COLOR = { id: 2, name: "Color", style: "color", attribute_values: [{ id: 21, value: "Rojo", hex_color: "#f00", attribute_id: 2 }, { id: 22, value: "Azul", hex_color: "#00f", attribute_id: 2 }] };

const product = {
  id: 100,
  attributes: [SIZE, COLOR],
  variations: [
    { id: 1001, status: 1, stock_status: "in_stock", attribute_values: [{ id: 11 }, { id: 21 }] },
    { id: 1002, status: 1, stock_status: "out_of_stock", attribute_values: [{ id: 11 }, { id: 22 }] },
    { id: 1003, status: 1, stock_status: "in_stock", attribute_values: [{ id: 12 }, { id: 21 }] },
    { id: 1004, status: 0, stock_status: "in_stock", attribute_values: [{ id: 13 }, { id: 21 }] },
  ],
};

test("solo se ofrecen valores presentes en variaciones publicadas", () => {
  const attributes = getVariantAttributes(product);
  const sizes = attributes.find((a) => a.id === 1).attribute_values.map((v) => v.value);
  // XL no tiene variación y L solo la tiene despublicada -> fuera.
  assert.deepEqual(sizes, ["S", "M"]);
  assert.deepEqual(attributes.find((a) => a.id === 2).attribute_values.map((v) => v.value), ["Rojo", "Azul"]);
});

test("un producto simple no genera atributos", () => {
  assert.deepEqual(getVariantAttributes({ id: 1, attributes: [], variations: [] }), []);
  assert.deepEqual(getVariantAttributes(undefined), []);
});

test("la seleccion no esta completa hasta elegir talla Y color", () => {
  const attributes = getVariantAttributes(product);
  assert.equal(isSelectionComplete(attributes, {}), false);
  assert.equal(isSelectionComplete(attributes, { 1: "11" }), false);
  assert.equal(isSelectionComplete(attributes, { 2: "21" }), false);
  assert.equal(isSelectionComplete(attributes, { 1: "11", 2: "21" }), true);
});

test("una seleccion completa resuelve la variacion exacta", () => {
  const variations = getSellableVariations(product);
  assert.equal(findVariationFor(variations, ["11", "21"], { exact: true })?.id, 1001);
  assert.equal(findVariationFor(variations, ["12", "21"], { exact: true })?.id, 1003);
});

test("una combinacion inexistente no resuelve ninguna variacion", () => {
  const variations = getSellableVariations(product);
  assert.equal(findVariationFor(variations, ["12", "22"], { exact: true }), null);
});

test("una variacion despublicada nunca se selecciona", () => {
  const variations = getSellableVariations(product);
  assert.equal(findVariationFor(variations, ["13", "21"], { exact: true }), null);
});

test("exact evita que una seleccion parcial resuelva una variacion", () => {
  const variations = getSellableVariations(product);
  assert.equal(findVariationFor(variations, ["11"], { exact: true }), null);
  assert.equal(findVariationFor(variations, ["11"])?.id, 1001);
});

// Réplica de la regla de `isDisabled` del hook: un valor es elegible si, junto
// con lo ya elegido, existe alguna variación con stock.
const disabled = (selected, attributeId, valueIdToTry) => !findVariationFor(getSellableVariations(product), Object.values({ ...selected, [attributeId]: valueIdToTry }), { inStockOnly: true });

test("sin nada elegido, se ofrecen las opciones con algo de stock", () => {
  assert.equal(disabled({}, "1", "11"), false); // S tiene S/Rojo en stock
  assert.equal(disabled({}, "1", "12"), false); // M tiene M/Rojo en stock
  assert.equal(disabled({}, "2", "21"), false);
  assert.equal(disabled({}, "2", "22"), true); // Azul solo existe agotado
});

test("elegir talla S deshabilita el color sin stock para esa talla", () => {
  const selected = { 1: "11" };
  assert.equal(disabled(selected, "2", "21"), false); // S/Rojo en stock
  assert.equal(disabled(selected, "2", "22"), true); // S/Azul agotado
});

test("elegir color Rojo deshabilita las tallas sin combinacion valida", () => {
  const selected = { 2: "21" };
  assert.equal(disabled(selected, "1", "11"), false);
  assert.equal(disabled(selected, "1", "12"), false);
});

test("los ids se comparan como texto aunque la API los mezcle", () => {
  const mixed = { id: 9, attributes: [{ id: "1", style: "rectangle", attribute_values: [{ id: "11", value: "S" }] }], variations: [{ id: 1, status: 1, stock_status: "in_stock", attribute_values: [{ id: 11 }] }] };
  assert.equal(getVariantAttributes(mixed)[0].attribute_values.length, 1);
  assert.equal(findVariationFor(getSellableVariations(mixed), ["11"], { exact: true })?.id, 1);
});

test("los atributos de estilo imagen reciben la imagen de su variacion", () => {
  const withImages = {
    id: 5,
    attributes: [{ id: 3, style: "image", attribute_values: [{ id: 31, value: "Burdeos" }] }],
    variations: [{ id: 501, status: 1, stock_status: "in_stock", variation_image: { original_url: "/img/burdeos.jpg" }, attribute_values: [{ id: 31 }] }],
  };
  assert.equal(getVariantAttributes(withImages)[0].attribute_values[0].variation_image.original_url, "/img/burdeos.jpg");
});
