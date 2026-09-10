import NoDataFound from "@/components/widgets/NoDataFound";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import { CheckoutAPI } from "@/utils/axiosUtils/API";
import request from "@/utils/axiosUtils";
import React, { useContext, useEffect, useRef, useState } from "react";
import { checkoutCity, createLatestQuoteRequest, hasShippingQuote, requestCheckoutQuote } from "./quoteState";
import { Col } from "reactstrap";
import CapacityHint from "@/components/widgets/capacity/CapacityHint";
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
  const [quoteError, setQuoteError] = useState(false);
  const [validatedKey, setValidatedKey] = useState(null);
  const quoteReady = useRef(false);
  const isGuestCheckout = Boolean(settingData?.activation?.guest_checkout) && !access_token;
  const city = checkoutCity(values, isGuestCheckout);
  // Invalidate immediately on a changed destination/cart, even before effects run.
  const contextKey = JSON.stringify([access_token, city, cartProducts, values.billing_address_id,
    values.shipping_address_id, values.delivery_description, values.payment_method,
    values.delivery_interval, values.points_amount, values.wallet_balance]);
  const currentContext = useRef(contextKey);
  const selectionKey = JSON.stringify([contextKey, storeCoupon]);
  currentContext.current = selectionKey;

  const [isLoading, setIsLoading] = useState(false);
  quoteReady.current = !isLoading && !quoteError && validatedKey === contextKey
    && Number.isFinite(resData?.data?.total)
    && (addToCartData?.is_digital_only || hasShippingQuote(resData?.data));
  const latestQuote = useRef(createLatestQuoteRequest()).current;
  useEffect(() => () => latestQuote.invalidate(), [latestQuote]);

  const mutate = (payload) => {
    quoteReady.current = false;
    setIsLoading(true);
    setQuoteError(false);
    setValidatedKey(null);
    latestQuote.run(
      () => requestCheckoutQuote((data) => request({ url: CheckoutAPI, method: "post", data }), payload),
      ({ response: resDta, couponError, couponCode }) => {
        setIsLoading(false);
        if ((resDta?.status == 200 || resDta?.status == 201) && Number.isFinite(resDta?.data?.total)) {
          setResData(resDta);
          setValidatedKey(contextKey);
          setErrorCoupon(couponError);
          setStoreCoupon(couponCode);
          setAppliedCoupon(couponCode ? "applied" : null);
        } else {
          setQuoteError(true);
        }
      }
    );
  };

  // POST /checkout con TODO el contexto del pedido. Es la ÚNICA forma de
  // hablar con /checkout desde el sidebar (también para aplicar/quitar un
  // cupón): así el invitado siempre manda sus productos y la ciudad, y el
  // cupón aplicado se conserva al cambiar método de pago o dirección.
  const recompute = (extra = {}) => {
    // storeCoupon only contains a code accepted by the latest quote response.
    // Solo el cupón APLICADO (storeCoupon). El texto del campo (values.coupon)
    // puede ser un código a medio escribir o inválido: enviarlo al cambiar
    // método de pago o dirección pintaba "cupón inválido" sin que el cliente
    // hubiera pulsado Aplicar.
    const couponCode = extra.coupon_code !== undefined ? extra.coupon_code : storeCoupon || "";
    // Ciudad de entrega para el cálculo de envío por zonas: invitados la
    // llevan inline; con sesión el servidor la resuelve por el address_id.
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

    // Quotes are previews: missing addresses mean initial zero shipping.
    // Do not require physical-delivery fields for a digital-only cart.
    if (values.payment_method && (isGuestCheckout || access_token)) recompute();
    // storeCoupon NO es disparador: aplicar/quitar el cupón ya llama a
    // recompute() explícitamente (un solo POST por clic, no dos).
    // `errors` de Formik tampoco: cambia en cada tecla del formulario de
    // invitado y disparaba un POST /checkout por pulsación (y el límite de
    // peticiones del API a mitad de compra). Lo que afecta al total ya está
    // en la lista: direcciones, ciudad, entrega, pago, puntos y cupón.
  }, [CartLoading, deleteCartLoader, cartTotal, cartProducts, isGuestCheckout, access_token, values["points_amount"], values["wallet_balance"], values["billing_address_id"], values["delivery_description"], values["payment_method"], values["shipping_address_id"], values["delivery_interval"], city]);

  return (
    <>
      <Col lg="5">
        {cartProducts?.length > 0 ? (
          <div className="checkout-right-box">
            <CapacityHint className="mb-3" />
            <SidebarProduct values={values} setFieldValue={setFieldValue} quotedCart={resData?.data?.cart} />
            <BillingSummary values={values} errors={errors} setFieldValue={setFieldValue} data={resData} errorCoupon={errorCoupon} appliedCoupon={appliedCoupon} setAppliedCoupon={setAppliedCoupon} storeCoupon={storeCoupon} setStoreCoupon={setStoreCoupon} isLoading={isLoading} addToCartData={addToCartData} mutate={recompute} sessionToken={sessionToken} quoteError={quoteError} isQuoteCurrent={() => quoteReady.current && currentContext.current === selectionKey} />
          </div>
        ) : (
          <NoDataFound customClass="no-data-added" height={156} width={180} imageUrl={`/assets/svg/empty-items.svg`} title="EmptyCart" />
        )}
      </Col>
    </>
  );
};

export default CheckoutSidebar;
