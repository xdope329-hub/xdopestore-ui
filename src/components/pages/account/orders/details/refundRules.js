/**
 * Botón "Reembolso" del detalle del pedido. Módulo puro (sin React),
 * testeado en refundRules.test.mjs.
 *
 * El API entrega `is_return` como 1/0 en cada línea del pedido y, si ya hay
 * una solicitud, su estado en `pivot.refund_status`.
 */

export const PAID_STATUSES = ["completed", "paid", "approved", "success"];

/**
 * Devuelve el estado del botón para una línea:
 *  - { state: "requested", status }   ya hay solicitud (pending/approved/rejected)
 *  - { state: "non_refundable" }      el producto no admite devolución
 *  - { state: "refund" }              se puede solicitar
 *  - { state: "after_delivery" }      todavía no (sin entregar o sin pagar)
 */
export function refundButtonState({ product, order } = {}) {
  const requested = product?.pivot?.refund_status;
  if (requested) return { state: "requested", status: String(requested).toLowerCase() };
  if (Number(product?.is_return ?? 1) === 0) return { state: "non_refundable" };
  const paid = PAID_STATUSES.includes(String(order?.payment_status || "").toLowerCase());
  const delivered = order?.order_status?.slug === "delivered";
  return paid && delivered ? { state: "refund" } : { state: "after_delivery" };
}

/** Datos que se envían a POST /refund. */
export function buildRefundPayload({ orderId, product, reason, paymentType } = {}) {
  return {
    order_id: orderId,
    product_id: product?.product_id,
    variation_id: product?.variation_id || null,
    reason: String(reason || "").trim(),
    payment_type: paymentType || "original",
  };
}
