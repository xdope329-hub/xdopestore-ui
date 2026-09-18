/**
 * Lógica pura de resolución de variantes para la miniatura de producto.
 * Sin React: se puede testear en aislamiento (ver variantMatching.test.mjs).
 */

export const valueId = (value) => value?.id ?? value?._id;

export const key = (value) => (value === null || value === undefined ? "" : String(value));

/** Variaciones publicadas: una variación desactivada en el admin no genera opciones. */
export const getSellableVariations = (product) => (product?.variations ?? []).filter((variation) => variation?.status);

/**
 * Imagen de variación usable: un objeto poblado con `original_url`. Un id
 * suelto (referencia sin poblar) o null no sirven para pintar nada.
 */
export const getVariationImage = (variation) => {
  const image = variation?.variation_image;
  return image && typeof image === "object" && image.original_url ? image : null;
};

/** Imagen de variación por valor de atributo (la API no la trae dentro del atributo). */
export const getImagesByValueId = (variations) => {
  const map = new Map();
  variations.forEach((variation) => {
    const image = getVariationImage(variation);
    if (!image) return;
    variation?.attribute_values?.forEach((attributeValue) => {
      const id = key(valueId(attributeValue));
      if (!map.has(id)) map.set(id, image);
    });
  });
  return map;
};

/**
 * Imagen que debe mostrar la miniatura para la selección actual, parcial o
 * completa: la de la variación exacta si existe; si no, la de la primera
 * variación que contenga todo lo seleccionado y tenga imagen (elegir "Rojo"
 * ya muestra la foto en rojo aunque falte la talla). null → la tarjeta
 * conserva la miniatura del producto.
 */
export const getPreviewImage = (variations, selectedIds = [], matchedVariation = null) => {
  if (!selectedIds.length) return null;
  const exact = getVariationImage(matchedVariation);
  if (exact) return exact;
  const candidate = (variations ?? []).find((variation) => {
    if (!getVariationImage(variation)) return false;
    const ids = (variation?.attribute_values ?? []).map((attributeValue) => key(valueId(attributeValue)));
    return selectedIds.every((id) => ids.includes(id));
  });
  return getVariationImage(candidate);
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
