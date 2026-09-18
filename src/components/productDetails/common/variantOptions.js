export const variationId = (variation) => String(variation?.id || variation?._id || "");

export function variationAvailable(variation) {
  const quantity = variation?.quantity;
  return !!variation && [true, 1, "1"].includes(variation.status) && variation.stock_status !== "out_of_stock"
    && (quantity == null || (Number.isFinite(Number(quantity)) && Number(quantity) > 0));
}

export function variationLabel(variation) {
  return (variation?.attribute_values || []).map((attribute) => attribute?.value).filter(Boolean).join(" / ")
    || variation?.name || variationId(variation);
}

export function selectedBundleVariation(item, selectedId) {
  if (!selectedId) return null;
  return (item.product.variations || []).find((variation) => variationId(variation) === selectedId
    && (!item.allowedIds.length || item.allowedIds.includes(selectedId)) && variationAvailable(variation)) || null;
}
