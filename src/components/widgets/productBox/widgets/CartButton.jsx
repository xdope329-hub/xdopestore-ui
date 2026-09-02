import CartContext from "@/context/cartContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import Btn from "@/elements/buttons/Btn";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiAddLine, RiDeleteBinLine, RiSubtractLine } from "react-icons/ri";
import { Input } from "reactstrap";
import { openExternal } from "@/utils/security/safeUrl";

const CartButton = ({ productState, text, classes, iconClass = true, quantity = false, selectedVariation, disabled = false, disabledLabel }) => {
  const { cartProducts, handleIncDec } = useContext(CartContext);
  const { cartCanvas, setCartCanvas } = useContext(ThemeOptionContext);
  const [variationModal, setVariationModal] = useState("");
  const { t } = useTranslation("common");
  const [productQty, setProductQty] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const getSelectedVariant = useMemo(() => {
    return (cartProducts ?? []).find((elem) => (elem?.variation_id ? elem?.variation_id == productState?.selectedVariation?.id : elem.product_id === productState?.product?.id));
  }, [cartProducts, productState]);

  useEffect(() => {
    setProductQty(0);
    const foundProduct = (cartProducts ?? []).find((elem) => (elem?.variation_id ? elem?.variation_id == getSelectedVariant?.variation_id : elem?.product_id === productState?.product?.id));
    if (foundProduct) {
      if (foundProduct?.quantity || !isOpen) {
        setProductQty(foundProduct?.quantity);
        setIsOpen(true);
      }
    } else {
      if (productQty !== 0 || isOpen) {
        setProductQty(0);
        setIsOpen(false);
      }
    }
  }, [getSelectedVariant]);

  // CMS-provided URL: only http(s) is opened, and never with a window handle.
  const externalProductLink = (link) => openExternal(link);

  return (
    <>
      {!productState?.product?.is_external ? (
        <>
          {quantity ? (
            <>
              {disabled ? (
                <button id={`add-to-cart${productState?.product?.id}`} type="button" className="add-button add_cart" title={disabledLabel} disabled>
                  {disabledLabel || text}
                </button>
              ) : productState?.product?.stock_status === "in_stock" ? (
                <button
                  id={`add-to-cart${productState?.product?.id}`}
                  className="add-button add_cart"
                  onClick={() => {
                    setCartCanvas(true);
                    handleIncDec(1, productState?.product, productQty, setProductQty, setIsOpen, getSelectedVariant ? getSelectedVariant : null);
                  }}
                >
                  {text}
                </button>
              ) : (
                <button id={`add-to-cart${productState?.product?.id}`} className="add-button add_cart" disabled>
                  {t("OutOfStock")}
                </button>
              )}

              {productQty > 0 && (
                <div className={`qty-box ${isOpen && productQty >= 1 ? "open" : ""}`}>
                  <div className="input-group">
                    <Btn
                      type="button"
                      className="btn quantity-left-minus"
                      onClick={() => {
                        setCartCanvas(true);
                        handleIncDec(-1, productState?.product, productQty, setProductQty, setIsOpen, getSelectedVariant ? getSelectedVariant : null);
                      }}
                    >
                      {productQty > 1 ? <RiSubtractLine /> : <RiDeleteBinLine />}
                    </Btn>
                    <Input className="form-control input-number qty-input" type="text" name="quantity" value={productQty} readOnly />
                    <Btn
                      type="button"
                      className="btn quantity-right-plus"
                      onClick={() => {
                        setCartCanvas(true);
                        handleIncDec(1, productState?.product, productQty, setProductQty, setIsOpen, getSelectedVariant ? getSelectedVariant : null);
                      }}
                    >
                      <RiAddLine />
                    </Btn>
                  </div>
                </div>
              )}
            </>
          ) : disabled ? (
            // Producto con variantes cuya talla/color aun no se ha elegido en
            // la miniatura: se muestra el icono pero sin poder pulsarlo.
            <button type="button" id={`select-variant-${productState?.product?.id}`} className={`btn btn-transparent variant-required ${classes ? classes : ""}`} title={disabledLabel} aria-label={disabledLabel} disabled>
              <i className="ri-shopping-cart-line"></i>
              {text ? <span> {text}</span> : null}
            </button>
          ) : productState?.product?.stock_status == "in_stock" ? (
            <Btn
              color="transparent"
              id={`add-to-cart'+${productState?.product?.id}`}
              className={`${classes ? classes : ""}  ${productQty > 0 ? "active" : ""}`}
              iconClass={iconClass ? iconClass : <RiAddLine />}
              onClick={() => {
                productState?.product?.external_url ? openExternal(productState?.product?.external_url) : setCartCanvas(true);
                handleIncDec(1, productState?.product, productQty, setProductQty, setIsOpen, productState);
                productState?.product?.type === "classified" ? setVariationModal(productState?.product?.id) : setCartCanvas(!cartCanvas);
              }}
            >
              <i className="ri-shopping-cart-line"></i>
              <span> {!(productQty > 0) ? text : t("Added")}</span>
            </Btn>
          ) : (
            <Btn id={`out-of-stock'+${productState?.product?.id}`} className={classes ? classes : ""} disabled={true} iconClass={iconClass ? iconClass : <RiAddLine />}>
              {text ? t("OutOfStock") : ""}
            </Btn>
          )}
        </>
      ) : (
        <Btn id={`add-to-cart${productState?.product?.id}`} className={`btn btn-add-cart addcart-button ${classes ? classes : ""}`} onClick={() => externalProductLink(productState?.product?.external_url)}>
          {productState?.product?.external_button_text ? productState?.product?.external_button_text : t("BuyNow")}
        </Btn>
      )}
    </>
  );
};

export default CartButton;
