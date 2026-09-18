import { placeHolderImage } from "@/components/widgets/Placeholder";
import { Fragment } from "react";

/**
 * Pinta la selección de variantes (talla, color, ...) dentro de la miniatura.
 * Es puramente presentacional: el estado vive en `useProductBoxVariants`.
 *
 * `attributes` ya viene filtrado por el padre para poder repartir los
 * atributos en distintas zonas de la tarjeta (los colores junto a la marca,
 * las tallas debajo del precio).
 */
const ProductBoxVariantSelector = ({ attributes = [], isSelected, isDisabled, onSelect, showLabel = false, className = "" }) => {
  if (!attributes.length) return null;

  return (
    <div className={`product-box-variants ${className}`.trim()}>
      {attributes.map((attribute, i) => {
        const style = attribute?.style;
        const isColor = style === "color";
        const isImage = style === "image";

        return (
          <div className={`variant-row variant-${style || "text"}`} key={attribute?.id ?? i}>
            {showLabel && attribute?.name ? <span className="variant-label">{attribute.name}</span> : null}
            <ul className={`variant-options ${style || "text"}`}>
              {attribute?.attribute_values?.map((value, index) => {
                const disabled = isDisabled?.(attribute?.id, value);
                const active = isSelected?.(attribute?.id, value);
                const classes = `${active ? "active" : ""} ${disabled ? "disabled" : ""}`.trim();

                return (
                  <Fragment key={value?.id ?? index}>
                    <li className={classes} title={value?.value}>
                      <button type="button" className="variant-option" aria-pressed={active} aria-label={`${attribute?.name ?? ""} ${value?.value ?? ""}`.trim()} disabled={disabled} onClick={() => !disabled && onSelect?.(attribute?.id, value)}>
                        {isColor ? <span className="variant-swatch" style={{ backgroundColor: value?.hex_color || "transparent" }} /> : isImage ? <img className="variant-thumb" src={value?.variation_image?.original_url || placeHolderImage} alt={value?.value} loading="lazy" /> : <span className="variant-text">{value?.value}</span>}
                      </button>
                    </li>
                  </Fragment>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

export default ProductBoxVariantSelector;
