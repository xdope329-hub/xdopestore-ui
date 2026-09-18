import NoDataFound from "@/components/widgets/NoDataFound";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import Loader from "@/layout/loader";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import ApplyCoupon from "./ApplyCoupon";
import PlaceOrder from "./PlaceOrder";
import PointWallet from "./PointWallet";
import { hasShippingQuote } from "./quoteState";

const BillingSummary = ({ data, values, setFieldValue, isLoading, mutate, storeCoupon, setStoreCoupon, errorCoupon, appliedCoupon, setAppliedCoupon, errors, sessionToken, addToCartData, quoteError, isQuoteCurrent }) => {
  const { convertCurrency } = useContext(SettingContext);
  const { cartProducts, cartTotal } = useContext(CartContext);
  const { t } = useTranslation("common");

  const subtotal = data?.data?.sub_total ?? (cartTotal || cartProducts?.reduce((s, i) => s + (i.sub_total || 0), 0) || 0);
  const shipping = data?.data?.shipping_quote?.amount ?? 0;
  // Estado del envío por zonas: el servidor manda shipping_quote cuando ya
  // conoce la ciudad de entrega. Antes de eso el envío empieza en $0.
  const shippingQuote = data?.data?.shipping_quote;
  const hasQuote = hasShippingQuote(data?.data);
  const couponDiscount = data?.data?.coupon_total_discount || 0;
  // The server's current prices and discounts determine the payable total.
  const localTotal = subtotal + shipping - couponDiscount;
  const total = data?.data?.total ?? localTotal;

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
              {quoteError && (
                <div className="alert alert-danger checkout-quote-error" role="alert">
                  <p>{t("CheckoutQuoteFailed")}</p>
                  <button type="button" className="btn btn-outline" disabled={isLoading} onClick={() => mutate()}>{t("RetryCheckoutQuote")}</button>
                </div>
              )}
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
                  {hasQuote && shippingQuote?.free_shipping ? (
                    <span className="count text-success fw-semibold">{t("FreeShipping")}</span>
                  ) : hasQuote ? (
                    <span className="count">{convertCurrency(shipping)}</span>
                  ) : (
                    <span className="count" title={t("ShippingCalculatedAtAddress")}>{convertCurrency(0)}</span>
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
              <PlaceOrder values={values} errors={errors} sessionToken={sessionToken} addToCartData={addToCartData} appliedCouponCode={appliedCoupon === "applied" ? storeCoupon : ""} isQuoteCurrent={isQuoteCurrent} />
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
