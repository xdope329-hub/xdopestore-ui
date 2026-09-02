import SettingContext from "@/context/settingContext";
import Link from "next/link";
import React, { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { RiDiscountPercentFill, RiStarSFill } from "react-icons/ri";
import { placeHolderImage } from "../Placeholder";
import CartButton from "./widgets/CartButton";
import WishlistButton from "./widgets/hoverButton/WishlistButton";
import ProductBoxVariantSelector from "./widgets/ProductBoxVariantSelector";
import ProductHoverButton from "./widgets/ProductHoverButton";
import ProductImage from "./widgets/ProductImage";
import useProductBoxVariants from "./widgets/useProductBoxVariants";

// `priority`: tarjetas visibles al abrir la página (la foto se pide de
// inmediato); el resto carga en diferido al acercarse.
const ProductBox2 = ({ productState, setProductState, priority = false }) => {
  const { t } = useTranslation("common");

  const { convertCurrency } = useContext(SettingContext);

  // Selección de variantes dentro de la miniatura. Arranca vacía a propósito:
  // hasta que el usuario elija todas las opciones (talla y color) el botón de
  // carrito permanece deshabilitado.
  const { attributes, hasVariants, isComplete, isSelected, isDisabled, select, previewImage } = useProductBoxVariants(productState, setProductState);

  // Foto de la tarjeta: la de la variación elegida (aunque la selección esté
  // incompleta: solo color, por ejemplo) y, si no hay, la miniatura del producto.
  const cardImage = previewImage?.original_url || productState?.product?.product_thumbnail?.original_url || placeHolderImage;

  // Los swatches de color/imagen van junto a la marca; el resto de atributos
  // (talla y cualquier otro configurado en el admin) debajo del precio.
  const swatchAttributes = useMemo(() => attributes.filter((attribute) => attribute?.style === "color" || attribute?.style === "image"), [attributes]);
  const optionAttributes = useMemo(() => attributes.filter((attribute) => attribute?.style !== "color" && attribute?.style !== "image"), [attributes]);

  const needsSelection = hasVariants && !isComplete;

  // Descuento efectivo: el de la variante seleccionada si la hay (igual que
  // la línea de precio). null/undefined → 0, así que no cuenta como oferta.
  const discount = Number((productState?.selectedVariation ? productState?.selectedVariation?.discount : productState?.product?.discount) || 0);
  return (
    <div className={`basic-product theme-product-1 ${productState?.product?.stock_status === "out_of_stock" ? "sold-out" : ""}`}>
      <div className="overflow-hidden">
        <div className="img-wrapper">
          {productState?.product?.is_trending || productState?.product?.is_sale_enable || productState?.product?.is_featured ? (
            <div className={`ribbon ${productState?.product?.is_sale_enable ? "sale-tag" : productState?.product?.is_featured ? "featured-tag" : productState?.product?.is_trending ? "trending-tag" : ""}`}>
              <span>{productState?.product?.is_sale_enable ? t("Sale") : productState?.product?.is_featured ? t("Featured") : productState?.product?.is_trending ? t("Trending") : ""}</span>
            </div>
          ) : null}

          <Link href={`/product/${productState?.product?.slug}`}>
            <ProductImage src={cardImage} alt={productState?.product?.name} priority={priority} />
          </Link>
          <div className="rating-label">
            <RiStarSFill />
            <span>{productState?.product?.reviews_count}</span>
          </div>
          <div className="cart-info">
            <WishlistButton customAnchor={true} productstate={productState?.product} />
            <CartButton productState={productState} selectedVariation={productState.selectedVariation} disabled={needsSelection} disabledLabel={t("SelectVariantFirst")} />
            <ProductHoverButton productstate={productState?.product} actionsToHide={"wishlist"} />
          </div>
        </div>
        <div className="product-detail">
          <div>
            <div className="brand-w-color">
              <a className="product-title" href={`/brand/${productState?.product?.brand?.slug}`}>
                {productState?.product?.brand?.name}
              </a>
              <div className="color-panel">
                <ProductBoxVariantSelector attributes={swatchAttributes} isSelected={isSelected} isDisabled={isDisabled} onSelect={select} />
              </div>
            </div>
            <a href={`/product/${productState?.product?.slug}`}>
              <h6>{productState?.selectedVariation ? productState?.selectedVariation?.name : productState?.product?.name}</h6>
            </a>
            <h4 className="price">
              {productState?.selectedVariation ? convertCurrency(productState?.selectedVariation.sale_price) : convertCurrency(productState?.product?.sale_price)} {/* Adjust currencySymbol based on your implementation */}
              {(productState?.selectedVariation ? productState?.selectedVariation.discount : productState?.product?.discount) ? (
                <>
                  {productState?.selectedVariation?.price != productState?.selectedVariation?.sale_price || (productState?.product?.price != productState?.product?.sale_price && <del>{convertCurrency(productState?.product?.price)}</del>)}
                  <span className="discounted-price">{productState?.selectedVariation ? productState?.selectedVariation.discount : productState?.product?.discount}% {t("Off")}</span>
                </>
              ) : null}
            </h4>
            <ProductBoxVariantSelector attributes={optionAttributes} isSelected={isSelected} isDisabled={isDisabled} onSelect={select} showLabel={true} className="size-panel" />
          </div>
          {/* Panel de oferta: SOLO con un descuento real (> 0). Antes se
              renderizaba siempre —y tres veces, con [1,2,3]— así que un
              producto sin descuento mostraba "Oferta por tiempo limitado:
              % Off" con el porcentaje vacío. */}
          {discount > 0 && (
            <ul className="offer-panel">
              <li>
                <span className="offer-icon">
                  <RiDiscountPercentFill />
                </span>{" "}
                {t("LimitedTimeOffer")}: {discount}% {t("Off")}
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductBox2;
