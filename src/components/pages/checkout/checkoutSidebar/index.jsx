import NoDataFound from "@/components/widgets/NoDataFound";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import { CheckoutAPI } from "@/utils/axiosUtils/API";
import useCreate from "@/utils/hooks/useCreate";
import React, { useContext, useEffect, useState } from "react";
import { Col } from "reactstrap";
import BillingSummary from "./BillingSummary";
import SidebarProduct from "./SidebarProduct";

const CheckoutSidebar = ({ values, setFieldValue, errors, addToCartData, sessionToken }) => {
  const [storeCoupon, setStoreCoupon] = useState("");
  const { cartProducts, isLoading: CartLoading, deleteCartLoader, cartTotal } = useContext(CartContext);
  const [errorCoupon, setErrorCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const { settingData } = useContext(SettingContext);
  // Misma fuente de verdad que la página de checkout (ver PlaceOrder.jsx).
  const access_token = sessionToken;
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
        // request() devuelve { data, status, ok }: el mensaje del API vive en
        // resDta.data (antes se leía de un `.response` inexistente y el error
        // de cupón se perdía).
        setErrorCoupon(resDta?.data?.message || resDta?.response?.data?.message || "");
        setAppliedCoupon(null);
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

  const isGuestCheckout = Boolean(settingData?.activation?.guest_checkout) && !access_token;

  // POST /checkout con TODO el contexto del pedido. Es la ÚNICA forma de
  // hablar con /checkout desde el sidebar (también para aplicar/quitar un
  // cupón): así el invitado siempre manda sus productos y la ciudad, y el
  // cupón aplicado se conserva al cambiar método de pago o dirección.
  const recompute = (extra = {}) => {
    // The /checkout endpoint reads `coupon_code` from the body, but Formik
    // stores the input under `coupon`. Forward the currently-applied coupon
    // (preferring the local `storeCoupon` state, which is the source of truth
    // for "what the user just applied") on every recompute.
    // Solo el cupón APLICADO (storeCoupon). El texto del campo (values.coupon)
    // puede ser un código a medio escribir o inválido: enviarlo al cambiar
    // método de pago o dirección pintaba "cupón inválido" sin que el cliente
    // hubiera pulsado Aplicar.
    const couponCode = extra.coupon_code !== undefined ? extra.coupon_code : storeCoupon || "";
    // Ciudad de entrega para el cálculo de envío por zonas: invitados la
    // llevan inline; con sesión el servidor la resuelve por el address_id.
    const city = values["shipping_address"]?.city || values["billing_address"]?.city || "";
    // Invitados: el carrito vive en el navegador — se envían los ids y el
    // servidor reconstruye precios desde la base de datos.
    const products = isGuestCheckout ? { products: cartProducts } : {};
    mutate({ ...values, ...products, ...extra, coupon_code: couponCode, city });
  };

  // Submitting data on Checkout
  useEffect(() => {
    // Don't auto-fire /checkout while the cart is still loading or is empty —
    // the API responds with 422 "Cart is empty" which would surface as an
    // error banner the moment the page loads. Wait until we know we have items.
    if (CartLoading || deleteCartLoader) return;
    if (!cartProducts?.length) return;

    if (isGuestCheckout) {
      if (values["delivery_description"] && values["payment_method"]) {
        recompute();
      }
    } else {
      if (access_token && values["billing_address_id"] && values["shipping_address_id"] && values["delivery_description"] && values["payment_method"]) {
        recompute();
      }
    }
    // storeCoupon NO es disparador: aplicar/quitar el cupón ya llama a
    // recompute() explícitamente (un solo POST por clic, no dos).
  }, [CartLoading, deleteCartLoader, cartTotal, cartProducts?.length, errors, values["points_amount"], values["wallet_balance"], values["billing_address_id"], values["delivery_description"], values["payment_method"], values["shipping_address_id"], values["delivery_interval"], values["shipping_address"]?.city, values["billing_address"]?.city]);

  return (
    <>
      <Col lg="5">
        {cartProducts?.length > 0 ? (
          <div className="checkout-right-box">
            <SidebarProduct values={values} setFieldValue={setFieldValue} />
            <BillingSummary values={values} errors={errors} setFieldValue={setFieldValue} data={resData} errorCoupon={errorCoupon} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} storeCoupon={storeCoupon} setStoreCoupon={setStoreCoupon} isLoading={isLoading} addToCartData={addToCartData} mutate={recompute} sessionToken={sessionToken} />
          </div>
        ) : (
          <NoDataFound customClass="no-data-added" height={156} width={180} imageUrl={`/assets/svg/empty-items.svg`} title="EmptyCart" />
        )}
      </Col>
    </>
  );
};

export default CheckoutSidebar;
