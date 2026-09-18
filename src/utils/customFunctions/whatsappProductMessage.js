/**
 * Mensaje de WhatsApp con la referencia de un producto (ficha de producto):
 * el saludo del admin (Ajustes → WhatsApp) o el saludo por defecto, el nombre
 * del producto con la variante elegida y el enlace de la tienda, para que el
 * vendedor sepa de qué producto le preguntan. Módulo puro (sin React),
 * testeado en whatsappProductMessage.test.mjs. Lo usan el botón "Consultar
 * por WhatsApp" de la ficha y el botón flotante mientras se está en ella.
 */

/** "Talla: M, Color: Beige" a partir de los atributos de la variación; si no hay, su nombre ("M / Beige"). */
export function describeVariation(variation) {
  if (!variation) return "";
  const pairs = (variation.attribute_values || [])
    .filter((attribute) => attribute && attribute.value)
    .map((attribute) => (attribute.name ? `${attribute.name}: ${attribute.value}` : String(attribute.value)));
  if (pairs.length) return pairs.join(", ");
  return String(variation.name || "").trim();
}

/** Enlace público de la ficha: <origen>/product/<slug>. */
export function productUrl(origin, slug) {
  if (!slug) return "";
  const base = String(origin || "").replace(/\/+$/, "");
  return `${base}/product/${slug}`;
}

/**
 * Texto final, una línea por parte:
 *   ¡Hola! Quisiera más información sobre:
 *   Caballero de la noche (Talla: M, Color: Beige)
 *   https://tienda/product/caballero-de-la-noche
 */
export function buildProductInquiryMessage({ greeting, product, variation, url } = {}) {
  const name = String(product?.name || "").trim();
  const variant = describeVariation(variation);
  const lines = [String(greeting || "").trim(), name ? `${name}${variant ? ` (${variant})` : ""}` : "", String(url || "").trim()];
  return lines.filter(Boolean).join("\n");
}
