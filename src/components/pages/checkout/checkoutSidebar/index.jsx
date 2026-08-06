import NoDataFound from "@/components/widgets/NoDataFound";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import { CheckoutAPI } from "@/utils/axiosUtils/API";
import useCreate from "@/utils/hooks/useCreate";
import Cookies from "js-cookie";
import React, { useContext, useEffect, useState } from "react";
import { Col } from "reactstrap";
import BillingSummary from "./BillingSummary";
import SidebarProduct from "./SidebarProduct";

const CheckoutSidebar = ({ values, setFieldValue, errors, addToCartData }) => {
  const [storeCoupon, setStoreCoupon] = useState("");
  const { cartProducts, isLoading: CartLoading, deleteCartLoader, cartTotal } = useContext(CartContext);
  const [errorCoupon, setErrorCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const { settingData } = useContext(SettingContext);
  const access_token = Cookies.get("uat");
  const [resData, setResData] = useState({});

  const { isLoading, mutate } = useCreate(
    CheckoutAPI,
    false,
    false,
    true,
    (resDta) => {
      if (resDta?.status == 200 || resDta?.status == 201) {
        setResData(resDta);
        setErrorCoupon("");
        storeCoupon !== "" && setAppliedCoupon("applied");
      } else {
        setErrorCoupon(resDta?.response?.data?.message);
      }
    },
    false,
    setErrorCoupon,
    false,
    false,
    false,
    (resDta) => {
      setStoreCoupon("");
      setAppliedCoupon(null);
      setFieldValue("coupon", "");
      values["coupon"] = "";
    }
  );

  // Submitting data on Checkout
  useEffect(() => {
    // Don't auto-fire /checkout while the cart is still loading or is empty —
    // the API responds with 422 "Cart is empty" which would surface as an
    // error banner the moment the page loads. Wait until we know we have items.
    if (CartLoading || deleteCartLoader) return;
    if (!cartProducts?.length) return;

    // The /checkout endpoint reads `coupon_code` from the body, but Formik
    // stores the input under `coupon`. Forward the currently-applied coupon
    // (preferring the local `storeCoupon` state, which is the source of truth
    // for "what the user just applied") on every recompute, so changing the
    // payment method / address never silently drops the discount.
    const recompute = (extra = {}) => {
      const couponCode = storeCoupon || values["coupon"] || "";
      mutate({ ...values, ...extra, coupon_code: couponCode });
    };

    if (settingData?.activation?.guest_checkout && !access_token) {
      if (values["delivery_description"] && values["payment_method"]) {
        recompute({ products: cartProducts });
      }
    } else {
      if (access_token && values["billing_address_id"] && values["shipping_address_id"] && values["delivery_description"] && values["payment_method"]) {
        recompute();
      }
    }
  }, [CartLoading, deleteCartLoader, cartTotal, cartProducts?.length, errors, values["points_amount"], values["wallet_balance"], values["billing_address_id"], values["delivery_description"], values["payment_method"], values["shipping_address_id"], values["delivery_interval"], storeCoupon]);

  return (
    <>
      <Col lg="5">
        {cartProducts?.length > 0 ? (
          <div className="checkout-right-box">
            <SidebarProduct values={values} setFieldValue={setFieldValue} />
            <BillingSummary values={values} errors={errors} setFieldValue={setFieldValue} data={resData} errorCoupon={errorCoupon} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} storeCoupon={storeCoupon} setStoreCoupon={setStoreCoupon} isLoading={isLoading} addToCartData={addToCartData} mutate={mutate} />
          </div>
        ) : (
          <NoDataFound customClass="no-data-added" height={156} width={180} imageUrl={`/assets/svg/empty-items.svg`} title="EmptyCart" />
        )}
      </Col>
    </>
  );
};

export default CheckoutSidebar;
