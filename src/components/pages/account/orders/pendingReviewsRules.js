/**
 * Reglas puras del aviso "Califica tu compra" (sin React ni red), testeadas
 * en pendingReviewsRules.test.mjs.
 *
 * El API (/review/pending) devuelve un elemento por producto entregado y aún
 * sin reseña: { order_id, order_number, product: { id, name, slug, product_thumbnail } }.
 */

/** Elementos de un pedido concreto (por número o id). Sin filtro → todos. */
export function itemsForOrder(items = [], order) {
  if (order === undefined || order === null || order === "") return items;
  const wanted = String(order);
  return items.filter((item) => String(item?.order_number) === wanted || String(item?.order_id) === wanted);
}

/** Resumen para el encabezado del aviso: cuántos productos y de qué pedidos. */
export function summarizePending(items = []) {
  const orderNumbers = [];
  for (const item of items) {
    const n = item?.order_number;
    if (n !== undefined && n !== null && !orderNumbers.includes(n)) orderNumbers.push(n);
  }
  return { count: items.length, orderNumbers };
}

/** Datos que se envían al API al calificar. */
export function buildReviewPayload({ productId, rating, description }) {
  return {
    product_id: productId,
    rating: Number(rating),
    description: String(description || "").trim(),
  };
}

/** Clave de traducción del error de validación local (null si está bien). */
export function validateRating(rating) {
  const n = Number(rating);
  if (!Number.isInteger(n) || n < 1 || n > 5) return "SelectARating";
  return null;
}
