import assert from "node:assert/strict";
import test from "node:test";
import { buildWhatsAppLink, whatsappNumber } from "./whatsappLink.js";

test("el número se limpia a solo dígitos", () => {
  assert.equal(whatsappNumber("+57 300 123 4567"), "573001234567");
  assert.equal(whatsappNumber("(300) 123-4567"), "3001234567");
  assert.equal(whatsappNumber(undefined), "");
  assert.equal(whatsappNumber(573001234567), "573001234567");
});

test("con el interruptor encendido y un número, WhatsApp está disponible", () => {
  for (const status of [1, true, "1", "true"]) {
    const link = buildWhatsAppLink({ status, number: "+57 300 123 4567" });
    assert.equal(link.enabled, true, `status=${status}`);
    assert.equal(link.href, "https://wa.me/573001234567");
  }
});

test("con el interruptor apagado no está disponible aunque haya número", () => {
  for (const status of [0, false, "0", "false"]) {
    assert.equal(buildWhatsAppLink({ status, number: "+57 300 123 4567" }).enabled, false, `status=${status}`);
  }
});

test("sin interruptor guardado basta con el número; sin número nunca", () => {
  assert.equal(buildWhatsAppLink({ number: "+57 300 123 4567" }).enabled, true);
  assert.equal(buildWhatsAppLink({ status: null, number: "573001234567" }).enabled, true);
  assert.equal(buildWhatsAppLink({ status: 1, number: "" }).enabled, false);
  assert.equal(buildWhatsAppLink({ status: 1, number: "abc" }).enabled, false);
  assert.equal(buildWhatsAppLink(undefined).enabled, false);
  assert.equal(buildWhatsAppLink({}).href, "");
});

test("el mensaje predefinido viaja codificado en la URL", () => {
  const link = buildWhatsAppLink({ status: 1, number: "573001234567", message: "  ¡Hola! Quiero más info  " });
  assert.equal(link.message, "¡Hola! Quiero más info");
  assert.equal(link.href, "https://wa.me/573001234567?text=%C2%A1Hola!%20Quiero%20m%C3%A1s%20info");
});
