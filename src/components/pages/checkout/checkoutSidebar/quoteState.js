// A selected guest card is authoritative before Formik copies it inline.
export function checkoutCity(values, isGuest) {
  const selected = isGuest && values.guest_addresses?.find((a) => a.id === values.shipping_address_id);
  return selected?.city || values.shipping_address?.city || "";
}

export function hasShippingQuote(summary) {
  return summary?.shipping_quote != null && Number.isFinite(summary.shipping_quote.amount);
}

// A rejected coupon must not discard the underlying cart/shipping summary.
// Retry validation failures without the coupon, within the same request gate.
export async function requestCheckoutQuote(send, payload) {
  try {
    let response = await send(payload);
    let couponError = "";
    let couponCode = payload.coupon_code || "";
    if (couponCode && response?.status === 422) {
      couponError = response?.data?.message || "InvalidCoupon";
      couponCode = "";
      response = await send({ ...payload, coupon_code: "" });
    }
    return { response, couponError, couponCode };
  } catch {
    return { response: null, couponError: "", couponCode: "" };
  }
}

const idOf = (value) => String(value?.id || value?._id || value || "");
export function quotedCartLine(item, cart) {
  return cart?.find((line) => idOf(line.product_id) === idOf(item.product_id || item.product)
    && idOf(line.variation_id) === idOf(item.variation_id)
    && Number(line.quantity) === Number(item.quantity));
}

// Checkout requests may finish out of order during address/cart changes.
export function createLatestQuoteRequest() {
  let sequence = 0;
  return {
    invalidate() { sequence += 1; },
    async run(request, commit) {
      const current = ++sequence;
      const result = await request();
      if (current === sequence) commit(result);
    },
  };
}
