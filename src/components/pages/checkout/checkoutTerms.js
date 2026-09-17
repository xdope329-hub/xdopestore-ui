import { BUNDLED_TERMS_VERSION } from "../../../data/legal/terms.js";

export async function loadCheckoutTerms(send) {
  const response = await send({ url: "/checkout/terms" });
  const terms = response?.data;
  if (!response?.ok || !terms?.version || !["cms", "bundled"].includes(terms.source)) throw new Error("CheckoutTermsUnavailable");
  // A newer bundled revision requires a matching storefront deployment.
  if (terms.source === "bundled" && terms.version !== BUNDLED_TERMS_VERSION) throw new Error("CheckoutTermsUnavailable");
  return terms;
}
