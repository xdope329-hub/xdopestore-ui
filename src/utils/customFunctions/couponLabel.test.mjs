import assert from "node:assert/strict";
import { test } from "node:test";
import { couponBenefitLabel, isFreeShippingCoupon } from "./couponLabel.js";

const t = (key, vars = {}) => `${key}${Object.keys(vars).length ? " " + JSON.stringify(vars) : ""}`;
const format = (n) => `$${n}`;

test("porcentaje, monto fijo y envío gratis", () => {
  assert.equal(couponBenefitLabel({ type: "percentage", amount: 15 }, { t, format }), 'CouponPercentOff {"percent":15}');
  assert.equal(couponBenefitLabel({ type: "fixed", amount: 25000 }, { t, format }), 'CouponAmountOff {"amount":"$25000"}');
  assert.equal(couponBenefitLabel({ type: "free_shipping", amount: 0 }, { t, format }), "CouponFreeShipping");
});

test("sin tipo o sin monto no inventa nada", () => {
  assert.equal(couponBenefitLabel({ type: "percentage", amount: 0 }, { t, format }), "");
  assert.equal(couponBenefitLabel(null, { t, format }), "");
  assert.equal(couponBenefitLabel({ type: "raro", amount: 5 }, { t, format }), "");
});

test("isFreeShippingCoupon", () => {
  assert.equal(isFreeShippingCoupon({ type: "free_shipping" }), true);
  assert.equal(isFreeShippingCoupon({ type: "FREE_SHIPPING" }), true);
  assert.equal(isFreeShippingCoupon({ type: "fixed" }), false);
  assert.equal(isFreeShippingCoupon(undefined), false);
});
