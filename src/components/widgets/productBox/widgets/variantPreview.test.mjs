import assert from "node:assert/strict";
import test from "node:test";
import { findVariationFor, getImagesByValueId, getPreviewImage, getVariationImage } from "./variantMatching.js";

// Talla (S=11, M=12) x Color (Rojo=21, Azul=22). Solo las variaciones rojas
// tienen foto; la M/Azul trae un id sin poblar (como devolvía el API).
const RED_S = { id: 1, status: 1, stock_status: "in_stock", attribute_values: [{ id: 11 }, { id: 21 }], variation_image: { id: 901, original_url: "https://cdn/red-s.jpg" } };
const RED_M = { id: 2, status: 1, stock_status: "in_stock", attribute_values: [{ id: 12 }, { id: 21 }], variation_image: { id: 902, original_url: "https://cdn/red-m.jpg" } };
const BLUE_S = { id: 3, status: 1, stock_status: "in_stock", attribute_values: [{ id: 11 }, { id: 22 }], variation_image: null };
const BLUE_M = { id: 4, status: 1, stock_status: "in_stock", attribute_values: [{ id: 12 }, { id: 22 }], variation_image: "64f0c0ffee0000000000abcd" };
const variations = [RED_S, RED_M, BLUE_S, BLUE_M];

test("getVariationImage solo acepta objetos poblados con original_url", () => {
  assert.equal(getVariationImage(RED_S)?.original_url, "https://cdn/red-s.jpg");
  assert.equal(getVariationImage(BLUE_S), null);
  assert.equal(getVariationImage(BLUE_M), null, "un id sin poblar no es una imagen");
  assert.equal(getVariationImage(undefined), null);
});

test("sin selección la tarjeta conserva la miniatura del producto", () => {
  assert.equal(getPreviewImage(variations, []), null);
  assert.equal(getPreviewImage(variations), null);
});

test("elegir solo el color ya cambia la foto a una variación de ese color", () => {
  assert.equal(getPreviewImage(variations, ["21"])?.original_url, "https://cdn/red-s.jpg");
});

test("elegir solo la talla muestra la primera variación con foto de esa talla", () => {
  assert.equal(getPreviewImage(variations, ["12"])?.original_url, "https://cdn/red-m.jpg");
});

test("selección completa usa la foto exacta de la variación", () => {
  const matched = findVariationFor(variations, ["12", "21"], { exact: true });
  assert.equal(matched, RED_M);
  assert.equal(getPreviewImage(variations, ["12", "21"], matched)?.original_url, "https://cdn/red-m.jpg");
});

test("variación exacta sin foto → no se inventa otra; ni con id sin poblar", () => {
  const blueS = findVariationFor(variations, ["11", "22"], { exact: true });
  assert.equal(getPreviewImage(variations, ["11", "22"], blueS), null);
  const blueM = findVariationFor(variations, ["12", "22"], { exact: true });
  assert.equal(getPreviewImage(variations, ["12", "22"], blueM), null);
  // Solo "Azul": ninguna variación azul tiene foto usable.
  assert.equal(getPreviewImage(variations, ["22"]), null);
});

test("getImagesByValueId ignora ids sin poblar", () => {
  const map = getImagesByValueId(variations);
  assert.equal(map.get("21")?.original_url, "https://cdn/red-s.jpg");
  assert.equal(map.has("22"), false);
});
