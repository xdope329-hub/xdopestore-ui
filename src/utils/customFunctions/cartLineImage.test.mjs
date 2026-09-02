import assert from "node:assert/strict";
import test from "node:test";
import { getCartLineImage, getCartLineImageUrl } from "./cartLineImage.js";

const thumb = { id: 1, original_url: "https://cdn/thumb.jpg" };
const cafe = { id: 2, original_url: "https://cdn/cafe-m.jpg" };

test("usa la foto de la variación elegida cuando existe", () => {
  const line = { product: { product_thumbnail: thumb }, variation: { name: "Cafe/M", variation_image: cafe } };
  assert.equal(getCartLineImage(line), cafe);
  assert.equal(getCartLineImageUrl(line), "https://cdn/cafe-m.jpg");
});

test("sin foto de variación cae a la miniatura del producto", () => {
  assert.equal(getCartLineImage({ product: { product_thumbnail: thumb }, variation: { name: "Beige/M", variation_image: null } }), thumb);
  assert.equal(getCartLineImage({ product: { product_thumbnail: thumb } }), thumb);
});

test("un id sin poblar o un objeto sin URL no cuentan como imagen", () => {
  assert.equal(getCartLineImage({ product: { product_thumbnail: thumb }, variation: { variation_image: "64f0c0ffee0000000000abcd" } }), thumb);
  assert.equal(getCartLineImage({ product: { product_thumbnail: thumb }, variation: { variation_image: { id: 9 } } }), thumb);
});

test("sin ninguna imagen devuelve null y la URL de respaldo", () => {
  assert.equal(getCartLineImage({ product: {} }), null);
  assert.equal(getCartLineImage(undefined), null);
  assert.equal(getCartLineImageUrl({ product: { product_thumbnail: "id" } }, "/placeholder.png"), "/placeholder.png");
});
