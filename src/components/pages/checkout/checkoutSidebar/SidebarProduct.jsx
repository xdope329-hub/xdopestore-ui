import HandleQuantity from "@/components/cart/HandleQuantity";
import { placeHolderImage } from "@/components/widgets/Placeholder";
import { getCartLineImageUrl } from "@/utils/customFunctions/cartLineImage";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import Image from "next/image";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { RiCloseLine } from "react-icons/ri";
import { quotedCartLine } from "./quoteState";


// "S / Negro" (or whatever the variant is called) for the chosen variation.
const variantLabel = (item) => {
  const v = item?.variation;
  if (!v) return "";
  const values = (v.attribute_values || []).map((a) => a?.value).filter(Boolean);
  return values.length ? values.join(" / ") : v.name || "";
};

// What the shopper pays per unit: the variant's price when one is chosen.
const unitPrice = (item) => {
  const v = item?.variation;
  if (v) return Number(v.sale_price ?? v.price) || Number(v.price) || 0;
  return Number(item?.product?.sale_price ?? item?.product?.price) || 0;
};

const SidebarProduct = ({ values, quotedCart }) => {
  const { t } = useTranslation("common");
  const { cartProducts, removeCart } = useContext(CartContext);
  const { convertCurrency } = useContext(SettingContext);
  const currentPrice = (item) => {
    const line = quotedCartLine(item, quotedCart);
    return line ? line.sub_total / line.quantity : unitPrice(item);
  };
  const pricesChanged = cartProducts?.some((item) => {
    const line = quotedCartLine(item, quotedCart);
    return line && line.sub_total !== item.sub_total;
  });
  return (
    <div className="checkout-details">
      <div className="order-box">
        <div className="title-box">
          <h4>{t("SummaryOrder")}</h4>
          <p>{t("SummaryOrderDescription")}</p>
          {pricesChanged && <p className="checkout-price-update text-theme" role="status">{t("CheckoutPricesUpdated")}</p>}
        </div>
        <ul className="qty">
          {cartProducts?.map((item, i) => (
            <li key={i}>
              {item && (
                <div className="cart-image">
                  <Image src={getCartLineImageUrl(item, placeHolderImage)} className="img-fluid" alt={item?.product?.name || "product"} width={70} height={70} />
                </div>
              )}
              <div className="cart-content">
                <div>
                  <h4>{item?.product?.name || item?.variation?.name}</h4>
                  {variantLabel(item) && <h6 className="text-content mb-1">{variantLabel(item)}</h6>}
                  <h5 className="text-theme">
                    {convertCurrency(currentPrice(item))} x {item.quantity}
                  </h5>
                  <HandleQuantity productObj={item?.product} elem={item} />
                </div>
                <div className="d-flex flex-column align-items-end justify-content-between">
                  <button
                    type="button"
                    className="btn p-0 border-0 bg-transparent text-content checkout-remove-item"
                    aria-label={t("Remove")}
                    title={t("Remove")}
                    onClick={() => removeCart(item?.variation_id ? item?.variation_id : item?.product_id, item?.id)}
                  >
                    <RiCloseLine />
                  </button>
                  <span className="text-theme">{convertCurrency(currentPrice(item) * item.quantity)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SidebarProduct;
