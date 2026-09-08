/**
 * Beneficio de un cupón en una frase, a partir de su tipo (los cupones se
 * configuran en el admin: porcentaje, monto fijo o envío gratis). Módulo
 * puro (sin React), testeado en couponLabel.test.mjs. Lo usan la lista de
 * cupones del checkout, la página de ofertas y el aviso "cupón aplicado".
 *
 * `format(amount)` da el monto con la moneda de la tienda; `t` traduce.
 */
export function couponBenefitLabel(coupon, { t = (k) => k, format = (n) => String(n) } = {}) {
  const type = String(coupon?.type || "").toLowerCase();
  const amount = Number(coupon?.amount) || 0;
  if (type === "free_shipping") return t("CouponFreeShipping");
  if (type === "percentage") return amount > 0 ? t("CouponPercentOff", { percent: amount }) : "";
  if (type === "fixed") return amount > 0 ? t("CouponAmountOff", { amount: format(amount) }) : "";
  return "";
}

/** ¿El cupón aplicado da envío gratis (sin descuento en dinero)? */
export function isFreeShippingCoupon(coupon) {
  return String(coupon?.type || "").toLowerCase() === "free_shipping";
}
