import NoDataFound from "@/components/widgets/NoDataFound";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import Loader from "@/layout/loader";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import ApplyCoupon from "./ApplyCoupon";
import PlaceOrder from "./PlaceOrder";
import PointWallet from "./PointWallet";

const BillingSummary = ({ data, values, setFieldValue, isLoading, mutate, storeCoupon, setStoreCoupon, errorCoupon, appliedCoupon, setAppliedCoupon, errors, sessionToken, addToCartData }) => {
  const { convertCurrency } = useContext(SettingContext);
  const { cartProducts, cartTotal } = useContext(CartContext);
  const { t } = useTranslation("common");

  const subtotal = cartTotal || cartProducts?.reduce((s, i) => s + (i.sub_total || 0), 0) || 0;
  const shipping = data?.data?.shipping_total ?? values?.shipping_total ?? 0;
  // Estado del envío por zonas: el servidor manda shipping_quote cuando ya
  // conoce la ciudad de entrega. Antes de eso mostramos una pista en vez de $0.
  const shippingQuote = data?.data?.shipping_quote;
  const hasQuote = Boolean(shippingQuote) || (data?.data?.shipping_total ?? null) !== null;
  const couponDiscount = data?.data?.coupon_total_discount || 0;
  // Compute the total from the LIVE local cart so quantity changes reflect
  // immediately; only defer to the server's figure while a coupon is applied
  // (the discount rules live server-side). The next /checkout recompute
  // reconciles both anyway.
  const localTotal = subtotal + shipping - couponDiscount;
  const total = couponDiscount > 0 && data?.data?.total != null ? data.data.total : localTotal;

  return (
    <div className="checkout-details ">
      {cartProducts?.length > 0 ? (
        <div className="order-box">
          <div className="title-box">
            <h4>{t("BillingSummary")}</h4>
            <ApplyCoupon values={values} setFieldValue={setFieldValue} data={data} storeCoupon={storeCoupon} setStoreCoupon={setStoreCoupon} errorCoupon={errorCoupon} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} mutate={mutate} isLoading={isLoading} sessionToken={sessionToken} />
          </div>
          <div>
            <div className="custom-box-loader">
              {isLoading && (
                <div className="box-loader">
                  <Loader />
                </div>
              )}
              <ul className="sub-total">
                <li>
                  {t("Subtotal")}
                  <span className="count">{convertCurrency(subtotal)}</span>
                </li>
                <li>
                  {t("Shipping")}
                  {shippingQuote?.free_shipping ? (
                    <span className="count text-success fw-semibold">{t("FreeShipping")}</span>
                  ) : hasQuote ? (
                    <span className="count">{convertCurrency(shipping)}</span>
                  ) : (
                    <span className="count text-content" style={{ fontSize: "13px" }}>{t("ShippingCalculatedAtAddress")}</span>
                  )}
                </li>
                {couponDiscount > 0 && (
                  <li>
                    {t("YouSave")}
                    <span className="count">- {convertCurrency(couponDiscount)}</span>
                  </li>
                )}

                <PointWallet values={values} setFieldValue={setFieldValue} data={data} />
              </ul>
              <ul className="total">
                <li className="list-total">
                  {t("Total")}
                  <span className="count">{convertCurrency(total)}</span>
                </li>
              </ul>
              <PlaceOrder values={values} errors={errors} sessionToken={sessionToken} addToCartData={addToCartData} appliedCouponCode={appliedCoupon === "applied" ? storeCoupon : ""} />
            </div>
          </div>
        </div>
      ) : (
        <NoDataFound customClass="no-data-added" height={156} width={180} imageUrl={`/assets/svg/empty-items.svg`} title="EmptyCart" />
      )}
    </div>
  );
};

export default BillingSummary;
