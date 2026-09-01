import SettingContext from "@/context/settingContext";
import Link from "next/link";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { RiDiscountPercentFill, RiStarSFill } from "react-icons/ri";
import { placeHolderImage } from "../Placeholder";
import CartButton from "./widgets/CartButton";
import WishlistButton from "./widgets/hoverButton/WishlistButton";
import ProductBoxVariantAttribute from "./widgets/ProductBoxVariantAttributes";
import ProductHoverButton from "./widgets/ProductHoverButton";

const ProductBox2 = ({ productState, setProductState }) => {
  const { t } = useTranslation("common");

  const { convertCurrency } = useContext(SettingContext);
  // Descuento efectivo: el de la variante seleccionada si la hay (igual que
  // la línea de precio). null/undefined → 0, así que no cuenta como oferta.
  const discount = Number(
    (productState?.selectedVariation ? productState?.selectedVariation?.discount : productState?.product?.discount) || 0
  );
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
            <img src={productState?.selectedVariation?.variation_image ? productState?.selectedVariation.variation_image.original_url : productState?.product?.product_thumbnail?.original_url ? productState?.product?.product_thumbnail?.original_url : placeHolderImage} className="img-fluid bg-img" alt={productState?.product?.name} />
          </Link>
          <div className="rating-label">
            <RiStarSFill />
            <span>{productState?.product?.reviews_count}</span>
          </div>
          <div className="cart-info">
            <WishlistButton customAnchor={true} productstate={productState?.product} />
            <CartButton productState={productState} selectedVariation={productState.selectedVariation} />
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
                <ProductBoxVariantAttribute showVariableType={["color", "image"]} productState={productState} setProductState={setProductState} />
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
