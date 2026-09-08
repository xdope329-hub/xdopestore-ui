/**
 * Capacidad diaria de la tienda (GET /capacity del API). XDOPE produce bajo
 * pedido: cuando el cupo de hoy está lleno la tienda oculta el carrito, los
 * botones de compra y el checkout, y solo ofrece WhatsApp para coordinar el
 * pedido. Módulo puro (sin React), testeado en capacityRules.test.mjs.
 *
 * Forma del estado: { enabled, reached, used, remaining, daily_limit, mode,
 * whatsapp_message }.
 */
import { describeVariation } from "./whatsappProductMessage.js";

export const DEFAULT_CAPACITY_MESSAGE = "Hola XDOPE, quiero hacer un pedido pero hoy ya no tienen cupo. ¿Cuándo podrían atenderlo?";

/** true solo cuando la capacidad está activa Y el cupo de hoy está lleno. */
export function isCapacityReached(capacity) {
  return Boolean(capacity && capacity.enabled && capacity.reached);
}

/** Unidades que suma el carrito (para avisar cuando superan el cupo restante). */
export function cartUnits(cartItems) {
  return (Array.isArray(cartItems) ? cartItems : []).reduce((sum, item) => sum + (Number(item?.quantity) || 0), 0);
}

/**
 * Cupo restante que el carrito excede, o null si cabe (o no hay límite).
 * Ej.: quedan 1 y el carrito lleva 3 → { remaining: 1, units: 3 }.
 */
export function capacityExcess(capacity, cartItems) {
  if (!capacity || !capacity.enabled || capacity.reached) return null;
  if (capacity.mode === "orders") return null;
  const units = cartUnits(cartItems);
  const remaining = Number(capacity.remaining);
  if (!Number.isFinite(remaining) || units <= remaining) return null;
  return { remaining, units };
}

/** "Hoodie Negro (Talla: M) x2" por línea del carrito. */
export function describeCartLine(item) {
  const name = String(item?.product?.name || item?.name || "").trim();
  if (!name) return "";
  const variant = describeVariation(item?.variation);
  const qty = Number(item?.quantity) || 1;
  return `${name}${variant ? ` (${variant})` : ""} x${qty}`;
}

/**
 * Mensaje con el que se abre WhatsApp cuando no hay cupo: el texto del
 * admin (Ajustes → Capacidad) y, si hay carrito, los productos que el
 * cliente quería, para que el vendedor coordine directamente.
 */
export function buildCapacityWhatsAppMessage({ capacity, cartItems } = {}) {
  const greeting = String(capacity?.whatsapp_message || "").trim() || DEFAULT_CAPACITY_MESSAGE;
  const lines = (Array.isArray(cartItems) ? cartItems : []).map(describeCartLine).filter(Boolean);
  if (!lines.length) return greeting;
  return [greeting, "Me interesa:", ...lines.map((line) => `• ${line}`)].join("\n");
}
