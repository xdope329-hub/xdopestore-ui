/**
 * Lógica pura de resolución de variantes para la miniatura de producto.
 * Sin React: se puede testear en aislamiento (ver variantMatching.test.mjs).
 */

export const valueId = (value) => value?.id ?? value?._id;

export const key = (value) => (value === null || value === undefined ? "" : String(value));

/** Variaciones publicadas: una variación desactivada en el admin no genera opciones. */
export const getSellableVariations = (product) => (product?.variations ?? []).filter((variation) => variation?.status);

/** Imagen de variación por valor de atributo (la API no la trae dentro del atributo). */
export const getImagesByValueId = (variations) => {
  const map = new Map();
  variations.forEach((variation) => {
    if (!variation?.variation_image) return;
    variation?.attribute_values?.forEach((attributeValue) => {
      const id = key(valueId(attributeValue));
      if (!map.has(id)) map.set(id, variation.variation_image);
    });
  });
  return map;
};

/**
 * Atributos del producto recortados a los valores que existen en alguna
 * variación real, y enriquecidos con la imagen cuando el estilo es "image".
 */
export const getVariantAttributes = (product, variations = getSellableVariations(product)) => {
  const usedValueIds = new Set();
  variations.forEach((variation) => {
    variation?.attribute_values?.forEach((attributeValue) => usedValueIds.add(key(valueId(attributeValue))));
  });
  const imagesByValueId = getImagesByValueId(variations);

  return (product?.attributes ?? [])
    .map((attribute) => ({
      ...attribute,
      attribute_values: (attribute?.attribute_values ?? [])
        .filter((value) => usedValueIds.has(key(valueId(value))))
        .map((value) => (attribute?.style === "image" ? { ...value, variation_image: value?.variation_image ?? imagesByValueId.get(key(valueId(value))) } : value)),
    }))
    .filter((attribute) => attribute.attribute_values.length > 0);
};

/**
 * Primera variación que contiene todos los `wantedIds`.
 * `exact` exige que no sobren atributos; `inStockOnly` descarta las agotadas.
 */
export const findVariationFor = (variations, wantedIds, { inStockOnly = false, exact = false } = {}) =>
  (variations ?? []).find((variation) => {
    const ids = (variation?.attribute_values ?? []).map((attributeValue) => key(valueId(attributeValue)));
    if (exact && ids.length !== wantedIds.length) return false;
    if (inStockOnly && variation?.stock_status === "out_of_stock") return false;
    return wantedIds.every((id) => ids.includes(id));
  }) ?? null;

/** ¿Está completa la selección para todos los atributos con opciones? */
export const isSelectionComplete = (attributes, selected) => attributes.length > 0 && attributes.every((attribute) => Boolean(selected[key(attribute?.id)]));
