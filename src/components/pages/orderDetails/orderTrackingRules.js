/**
 * Reglas puras de la página de seguimiento de pedidos (sin React), testeadas
 * en orderTrackingRules.test.mjs.
 *
 * `request()` devuelve { status, data } también en los errores, así que la
 * página solo debe pintar un pedido cuando el API respondió 200 con un pedido
 * de verdad; antes cualquier respuesta (401, 404 con { message }) se trataba
 * como pedido y salía la ficha vacía con totales en $0.
 */
export function orderFromTrackingResponse(res) {
  if (!res || res.status !== 200) return null;
  const order = res.data;
  if (!order || typeof order !== "object" || Array.isArray(order)) return null;
  return order.order_number !== undefined && order.order_number !== null ? order : null;
}
