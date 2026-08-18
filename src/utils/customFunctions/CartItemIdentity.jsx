const normalizeCartId = (value) =>
  value === undefined || value === null || value === ""
    ? ""
    : String(value?._id ?? value?.id ?? value);

export const getCartProductId = (source) =>
  normalizeCartId(source?.product_id ?? source?.product?.id ?? source?.id ?? source?._id);

export const getCartVariationId = (source) =>
  normalizeCartId(source?.selectedVariation?.id ?? source?.variation_id ?? source?.variation?.id);

export const isSameCartLine = (item, productId, variationId) =>
  getCartProductId(item) === normalizeCartId(productId) &&
  getCartVariationId(item) === normalizeCartId(variationId);
