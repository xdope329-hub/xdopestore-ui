import assert from "node:assert/strict";
import test from "node:test";
import { buildProductInquiryMessage, describeVariation, productUrl } from "./whatsappProductMessage.js";

const product = { name: "Caballero de la noche", slug: "caballero-de-la-noche" };
const variation = { name: "Beige/S", attribute_values: [{ name: "Talla", value: "S" }, { name: "Color", value: "Beige" }] };

test("el mensaje lleva saludo, producto con variante y enlace, una parte por línea", () => {
  const message = buildProductInquiryMessage({ greeting: " ¡Hola! Quisiera más información sobre: ", product, variation, url: "https://tienda.example.com/product/caballero-de-la-noche" });
  assert.equal(message, "¡Hola! Quisiera más información sobre:\nCaballero de la noche (Talla: S, Color: Beige)\nhttps://tienda.example.com/product/caballero-de-la-noche");
});

test("sin variante elegida solo va el nombre; sin saludo no queda línea vacía", () => {
  assert.equal(buildProductInquiryMessage({ product, url: "https://t/product/x" }), "Caballero de la noche\nhttps://t/product/x");
  assert.equal(buildProductInquiryMessage({ greeting: "Hola", product }), "Hola\nCaballero de la noche");
  assert.equal(buildProductInquiryMessage({}), "");
});

test("la variante se describe por atributos y, si no los hay, por su nombre", () => {
  assert.equal(describeVariation(variation), "Talla: S, Color: Beige");
  assert.equal(describeVariation({ name: "M / Rosado", attribute_values: [] }), "M / Rosado");
  assert.equal(describeVariation({ attribute_values: [{ value: "XL" }] }), "XL");
  assert.equal(describeVariation(null), "");
});

test("el enlace usa el origen de la tienda sin barra final", () => {
  assert.equal(productUrl("https://tienda.example.com/", "camisa"), "https://tienda.example.com/product/camisa");
  assert.equal(productUrl("http://localhost:3101", "camisa"), "http://localhost:3101/product/camisa");
  assert.equal(productUrl("https://tienda.example.com", ""), "");
});
