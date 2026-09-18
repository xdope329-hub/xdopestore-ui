import CapacityNotice from "@/components/widgets/capacity/CapacityNotice";
import SettingContext from "@/context/settingContext";
import Btn from "@/elements/buttons/Btn";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { RiShoppingCartLine } from "react-icons/ri";
import { openExternal } from "@/utils/security/safeUrl";

// `whatsappButton`: "Consultar por WhatsApp" de la ficha (ProductContent); la
// barra fija de compra no lo pasa y sigue igual.
const AddToCartButton = ({ productState, addToCart, isLoading, buyNow, extraOption, whatsappButton = null }) => {
  const { t } = useTranslation("common");
  // CMS-provided URL: only http(s) is opened, and never with a window handle.
  const externalProductLink = (link) => openExternal(link);
  // Sin cupo hoy (Ajustes → Capacidad): en lugar de comprar, WhatsApp. La
  // barra fija (extraOption === false) solo muestra el botón.
  const { capacityReached } = useContext(SettingContext) || {};
  if (capacityReached && !productState?.product?.is_external) {
    return (
      <div className="product-buy-btn-group">
        <CapacityNotice compact buttonOnly={extraOption === false} />
      </div>
    );
  }
  return (
    <div className="product-buy-btn-group">
      {!productState?.product?.is_external ? (
        <>
          {!productState?.product?.variations?.length ? (
            <Btn color="transparent" className={`btn-animation btn-solid hover-solid buy-button ${productState?.product?.status === 0 || productState?.product?.stock_status == "out_of_stock" || productState?.product?.quantity < productState?.productQty ? "btn-md scroll-button" : "bg-theme btn-md scroll-button"}`} onClick={addToCart} disabled={productState?.product?.status === 0 || productState?.product?.stock_status == "out_of_stock" || productState?.product?.quantity < productState?.productQty}>
              {productState?.product?.stock_status == "out_of_stock" || productState?.product?.quantity < productState?.productQty ? null : (
                <div className="d-inline-block ring-animation">
                  <RiShoppingCartLine className="me-2" />
                </div>
              )}
              {productState?.product?.stock_status == "out_of_stock" || productState?.product?.quantity < productState?.productQty ? t("OutOfStock") : t("AddToCart")}
            </Btn>
          ) : (
            <Btn color="transparent" className={`btn-animation btn-solid hover-solid buy-button ${productState?.selectedVariation ? (productState?.product?.status === 0 || productState?.product?.variations.every((data) => data.status === 0) || productState?.selectedVariation?.stock_status == "out_of_stock" || productState?.selectedVariation?.quantity < productState?.productQty ? "btn-md scroll-button" : "bg-theme btn-md scroll-button") : "bg-theme btn-md scroll-button"}`} disabled={productState?.selectedVariation ? productState?.product?.status === 0 || productState?.product?.variations.every((data) => data.status === 0) || productState?.selectedVariation?.stock_status == "out_of_stock" || productState?.selectedVariation?.quantity < productState?.productQty : true} onClick={addToCart}>
              {productState?.product?.status === 0 || productState?.product?.variations?.every((data) => data.status === 0) || productState?.selectedVariation?.stock_status == "out_of_stock" || productState?.selectedVariation?.quantity < productState?.productQty ? null : (
                <div className="d-inline-block ring-animation">
                  <RiShoppingCartLine className="me-2" />
                </div>
              )}
              {productState?.selectedVariation ? (productState?.selectedVariation?.stock_status == "out_of_stock" || productState?.selectedVariation?.quantity < productState?.productQty ? t("OutOfStock") : t("AddToCart")) : productState?.product?.stock_status == "out_of_stock" ? t("OutOfStock") : t("AddToCart")}
            </Btn>
          )}
          {extraOption !== false ? (
            !productState?.product?.variations?.length ? (
              <Btn className="btn-solid buy-button" onClick={buyNow} disabled={productState?.product?.status === 0 || productState?.product?.stock_status == "out_of_stock" || productState?.product?.quantity < productState?.productQty ? true : false}>
                {t("BuyNow")}
              </Btn>
            ) : (
              <>
                <Btn className="btn-solid buy-button" onClick={buyNow} disabled={productState?.product?.status === 0 || productState?.product?.variations?.every((data) => data.status === 0) || productState?.selectedVariation?.stock_status == "out_of_stock" || productState?.product?.stock_status == "out_of_stock" ? true : false}>
                  {t("BuyNow")}
                </Btn>
              </>
            )
          ) : null}
          {extraOption !== false ? whatsappButton : null}
        </>
      ) : (
        <Btn className="btn-md bg-theme scroll-button" onClick={() => externalProductLink(productState?.product?.external_url)}>
          {productState?.product?.external_button_text ? productState?.product?.external_button_text : t("BuyNow")}
        </Btn>
      )}
    </div>
  );
};

export default AddToCartButton;
