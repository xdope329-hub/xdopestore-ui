/**
 * Enlace de WhatsApp a partir de Ajustes → WhatsApp del admin
 * (settings.values.whatsapp: { status, number, message }). Módulo puro (sin
 * React), testeado en whatsappLink.test.mjs.
 *
 * Lo comparten el botón flotante (layout/whatsappButton) y los iconos
 * sociales del pie de página (layout/footer/widgets/FooterSocial), así el
 * mismo interruptor del admin enciende WhatsApp en todas las páginas.
 */

/** wa.me solo acepta dígitos: "+57 300 123 4567" → "573001234567". */
export function whatsappNumber(value) {
  return String(value ?? "").replace(/\D/g, "");
}

const isOn = (value) => value === true || value === 1 || value === "1" || value === "true";

/** Enlace wa.me al número con un mensaje prellenado (vacío → solo el chat). */
export function whatsappHref(number, message) {
  const digits = whatsappNumber(number);
  if (!digits) return "";
  const text = String(message ?? "").trim();
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/**
 * { enabled, number, message, href }. `status` manda; si nunca se guardó
 * (undefined/null), basta con tener número. Sin número nunca está activo.
 */
export function buildWhatsAppLink(config = {}) {
  const number = whatsappNumber(config?.number);
  const status = config?.status;
  const enabled = Boolean(number) && (status === undefined || status === null ? true : isOn(status));
  const message = String(config?.message ?? "").trim();
  const href = whatsappHref(number, message);
  return { enabled, number, message, href };
}
