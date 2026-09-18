/**
 * Precio tachado y porcentaje de descuento que muestran las tarjetas de
 * producto y la ficha. Módulo puro (sin React), testeado en priceRules.test.mjs.
 *
 * Se mira SIEMPRE lo que se está mostrando: la variante elegida si la hay,
 * si no el producto padre. Antes cada tarjeta mezclaba precios del padre y
 * de la variante (`a != b || (c != d && <del>padre</del>)`): una variante
 * con descuento no mostraba el tachado y una sin descuento mostraba el
 * precio del padre tachado; la ficha llegaba a pintar "0 % Off".
 */
function shownItem(productState) {
  return productState?.selectedVariation || productState?.product || null;
}

/** Precio original a tachar, o null si lo mostrado no tiene rebaja real. */
export function originalPriceToStrike(productState) {
  const shown = shownItem(productState);
  const price = Number(shown?.price);
  const sale = Number(shown?.sale_price);
  if (!Number.isFinite(price) || !Number.isFinite(sale) || sale <= 0) return null;
  return price > sale ? price : null;
}

/** Porcentaje de descuento (entero > 0) o null. Deriva del precio si el campo falta. */
export function discountPercent(productState) {
  const shown = shownItem(productState);
  const stored = Number(shown?.discount);
  if (Number.isFinite(stored) && stored > 0) return Math.round(stored);
  const original = originalPriceToStrike(productState);
  if (original == null) return null;
  const pct = Math.round((1 - Number(shown.sale_price) / original) * 100);
  return pct > 0 ? pct : null;
}
