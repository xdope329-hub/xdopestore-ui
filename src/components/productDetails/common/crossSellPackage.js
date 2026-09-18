import { variationId } from "./variantOptions.js";

// Reglas puras de "Frecuentemente comprados juntos" (cross-sell). El paquete
// es el producto de la ficha (con la variante elegida en la página) más los
// productos relacionados marcados, cada uno con su variante y su precio.
// Sin React: se prueba en crossSellPackage.test.mjs.

/** Lo que paga el cliente por una unidad: la variante elegida, si no el producto. */
export const lineUnitPrice = (product, variation) =>
  Number(variation?.sale_price ?? variation?.price ?? product?.sale_price ?? product?.price ?? 0);

const productId = (product) => String(product?.id ?? product?._id ?? "");
const hasVariants = (product) => Array.isArray(product?.variations) && product.variations.length > 0;

/** Línea de carrito con la misma forma que usa CartProvider. */
export const cartLine = (product, variation = null, quantity = 1) => ({
  product,
  product_id: product?.id ?? product?._id,
  variation: variation || null,
  variation_id: variationId(variation) || null,
  quantity,
  sub_total: quantity * lineUnitPrice(product, variation),
});

/** El producto de la ficha exige su variante antes de formar paquete. */
export const parentVariantMissing = (parent, parentVariation) => hasVariants(parent) && !parentVariation;

/** Líneas del paquete: primero el producto de la ficha, luego cada relacionado marcado. */
export function packageLines({ parent, parentVariation = null, items = [], checkedIds = [], selectedVariations = {} }) {
  if (!parent) return [];
  const lines = [cartLine(parent, parentVariation || null)];
  items.forEach((item) => {
    const pid = productId(item.product);
    if (!checkedIds.includes(pid)) return;
    lines.push(cartLine(item.product, selectedVariations[pid] || null));
  });
  return lines;
}

export const packageTotal = (lines) => (lines || []).reduce((sum, line) => sum + Number(line?.sub_total || 0), 0);

/** Algún producto del paquete (la ficha o un marcado) con variantes y sin elegir. */
export function packageMissingVariant({ parent, parentVariation = null, items = [], checkedIds = [], selectedVariations = {} }) {
  if (parentVariantMissing(parent, parentVariation)) return true;
  return items.some((item) => {
    const pid = productId(item.product);
    return checkedIds.includes(pid) && hasVariants(item.product) && !selectedVariations[pid];
  });
}

const idOf = (value) => String(value?._id ?? value?.id ?? value ?? "");
const sameLine = (line, product_id, variation_id) =>
  idOf(line?.product_id) === idOf(product_id) && idOf(line?.variation_id) === idOf(variation_id);

// Tope de stock como en CartProvider.handleIncDec: la cantidad de la variante
// elegida (aunque sea 0) y la del producto solo si no hay variante; sin dato
// (null/undefined) no limita.
const stockOf = (line) => {
  const raw = line?.variation ? line.variation?.quantity : line?.product?.quantity;
  return raw == null ? NaN : Number(raw);
};

/**
 * Suma las líneas al carrito (una línea existente con el mismo producto y
 * variante suma cantidad). Si alguna supera el stock no cambia nada y
 * devuelve `stockError` con el producto y el stock disponible.
 */
export function mergeCartLines(cart, lines) {
  const next = (cart || []).map((line) => ({ ...line }));
  for (const line of lines || []) {
    const index = next.findIndex((it) => sameLine(it, line.product_id, line.variation_id));
    const current = index === -1 ? 0 : Number(next[index].quantity) || 0;
    const stock = stockOf(line);
    if (Number.isFinite(stock) && stock < current + line.quantity) {
      return { cart, stockError: { name: line.product?.name, qty: stock } };
    }
    if (index === -1) {
      next.push({ ...line });
    } else {
      const quantity = current + line.quantity;
      next[index] = { ...next[index], quantity, sub_total: quantity * lineUnitPrice(next[index].product, next[index].variation) };
    }
  }
  return { cart: next, stockError: null };
}
