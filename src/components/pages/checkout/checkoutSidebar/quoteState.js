// A selected guest card is authoritative before Formik copies it inline.
export function checkoutCity(values, isGuest) {
  const selected = isGuest && values.guest_addresses?.find((a) => a.id === values.shipping_address_id);
  return selected?.city || values.shipping_address?.city || "";
}

export function hasShippingQuote(summary) {
  return summary?.shipping_quote != null && Number.isFinite(summary.shipping_quote.amount);
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
