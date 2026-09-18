/**
 * Variación que la ficha del producto deja seleccionada al abrirse. Módulo
 * puro (sin React), testeado en defaultVariation.test.mjs.
 *
 * Regla: la variación VENDIBLE más barata (activa y con stock), empatando a
 * favor del orden del admin. Es la misma regla con la que el API deriva el
 * precio y el descuento del producto padre que muestran las tarjetas
 * (routes/product.routes.js → deriveParentPricingFromVariations). Antes la
 * ficha tomaba la primera variación con stock: la tarjeta anunciaba
 * "50 % de descuento" (la variante más barata, Cafe/S) y al entrar la ficha
 * abría con otra variante al 5 % (Beige/S).
 */

/** Lo que paga el cliente: el precio de oferta cuando lo hay, si no el precio. */
export const effectivePrice = (variation) => {
  const sale = Number(variation?.sale_price);
  if (Number.isFinite(sale) && sale > 0) return sale;
  return Number(variation?.price);
};

/** Activa en el admin (status ≠ 0) y no agotada. */
export const isSellable = (variation) => Boolean(variation) && Number(variation.status ?? 1) !== 0 && variation.stock_status !== "out_of_stock";

/** null cuando no hay ninguna variación vendible (la ficha no preselecciona nada). */
export function pickDefaultVariation(variations = []) {
  const sellable = (Array.isArray(variations) ? variations : []).filter(isSellable);
  if (!sellable.length) return null;
  return sellable.reduce((best, variation) => {
    const price = effectivePrice(variation);
    const bestPrice = effectivePrice(best);
    if (!Number.isFinite(price)) return best;
    if (!Number.isFinite(bestPrice)) return variation;
    return price < bestPrice ? variation : best;
  }, sellable[0]);
}
