import { useCallback, useEffect, useMemo, useState } from "react";
import { findVariationFor, getPreviewImage, getSellableVariations, getVariantAttributes, isSelectionComplete, key, valueId } from "./variantMatching";

/**
 * Selección de variantes dentro de la miniatura de producto.
 *
 * A diferencia de `ProductBoxVariantAttributes`, este hook NO preselecciona
 * ninguna opción: la tarjeta arranca sin talla ni color elegidos para que el
 * botón de "agregar al carrito" pueda permanecer deshabilitado hasta que el
 * usuario complete la selección.
 *
 * Todo se deriva de lo que el admin tenga configurado en el producto:
 * `product.attributes` da las opciones y su estilo (color / imagen / texto),
 * y `product.variations` dice qué combinaciones existen realmente y cuáles
 * tienen stock.
 */

const useProductBoxVariants = (productState, setProductState) => {
  const product = productState?.product;

  const variations = useMemo(() => getSellableVariations(product), [product?.variations]);
  const attributes = useMemo(() => getVariantAttributes(product, variations), [product?.attributes, variations]);

  const hasVariants = attributes.length > 0;

  // { [attribute_id]: attribute_value_id }
  const [selected, setSelected] = useState({});

  // Al cambiar de producto (los listados paginados reutilizan el componente)
  // se limpia la selección.
  useEffect(() => {
    setSelected({});
  }, [product?.id]);

  const selectedIds = useMemo(() => Object.values(selected).filter(Boolean), [selected]);

  const isComplete = isSelectionComplete(attributes, selected);

  const matchedVariation = useMemo(() => (isComplete ? findVariationFor(variations, selectedIds, { exact: true }) : null), [isComplete, selectedIds, variations]);

  /**
   * Un valor se puede elegir si, combinado con lo ya seleccionado en los otros
   * atributos, sigue existiendo alguna variación con stock.
   */
  const isDisabled = useCallback(
    (attributeId, value) => {
      const candidate = { ...selected, [key(attributeId)]: key(valueId(value)) };
      return !findVariationFor(variations, Object.values(candidate).filter(Boolean), { inStockOnly: true });
    },
    [selected, variations]
  );

  const isSelected = useCallback((attributeId, value) => selected[key(attributeId)] === key(valueId(value)), [selected]);

  const select = useCallback((attributeId, value) => {
    const attrKey = key(attributeId);
    const valKey = key(valueId(value));
    setSelected((prev) => {
      // Volver a pulsar la opción activa la deselecciona.
      if (prev[attrKey] === valKey) {
        const next = { ...prev };
        delete next[attrKey];
        return next;
      }
      return { ...prev, [attrKey]: valKey };
    });
  }, []);

  const clear = useCallback(() => setSelected({}), []);

  // Foto de la miniatura para la selección actual, aunque esté incompleta:
  // elegir solo el color ya muestra la variación de ese color. null → la
  // tarjeta sigue mostrando la miniatura del producto.
  const previewImage = useMemo(() => getPreviewImage(variations, selectedIds, matchedVariation), [variations, selectedIds, matchedVariation]);

  // Propaga la variación resuelta (o su ausencia) al estado de la tarjeta, que
  // es lo que leen la imagen, el precio y el botón de carrito.
  useEffect(() => {
    if (!setProductState || !hasVariants) return;
    const variantIds = selectedIds.map((id) => Number(id)).sort((a, b) => a - b);
    setProductState((prev) => {
      const prevVariationId = prev?.selectedVariation?.id ?? null;
      const nextVariationId = matchedVariation?.id ?? null;
      const sameVariantIds = (prev?.variantIds ?? []).length === variantIds.length && (prev?.variantIds ?? []).every((id, i) => Number(id) === variantIds[i]);
      if (prevVariationId === nextVariationId && sameVariantIds) return prev;
      return {
        ...prev,
        selectedVariation: matchedVariation || "",
        variation: matchedVariation || null,
        variation_id: nextVariationId,
        variantIds,
      };
    });
  }, [matchedVariation, selectedIds, hasVariants, setProductState]);

  return {
    attributes,
    hasVariants,
    isComplete,
    matchedVariation,
    previewImage,
    isSelected,
    isDisabled,
    select,
    clear,
  };
};

export default useProductBoxVariants;
