import Btn from "@/elements/buttons/Btn";
import CartContext from "@/context/cartContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import request from "@/utils/axiosUtils";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import React, { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const PlaceOrder = ({ values, addToCartData, errors }) => {
  const { t } = useTranslation("common");
  const access_token = Cookies.get("uat");
  const router = useRouter();
  const { setOpenAuthModal } = useContext(ThemeOptionContext) || {};
  const [loading, setLoading] = useState(false);
  // Cart context is used to flush the local cart state after a successful
  // order so the header badge and cart drawer reflect the cleared server cart.
  const { setCartProducts, setCartTotal, refetch: cartRefetch } = useContext(CartContext) || {};

  // En vez de un botón deshabilitado sin explicación, el clic valida y le
  // dice al cliente exactamente qué falta para poder realizar el pedido.
  const missingRequirements = () => {
    const missing = [];
    if (!values["billing_address_id"]) missing.push(t("SelectBillingAddressFirst"));
    if (!addToCartData?.is_digital_only && !values["shipping_address_id"]) missing.push(t("SelectShippingAddressFirst"));
    if (!values["payment_method"]) missing.push(t("SelectPaymentMethodFirst"));
    return missing;
  };

  const handleClick = async () => {
    const missing = missingRequirements();
    if (missing.length) {
      ToastNotification("error", missing[0]);
      return;
    }
    setLoading(true);
    try {
      const res = await request({ url: "/payment/initialize", method: "post", data: values });
      const ok = res?.status === 200 || res?.status === 201;

      if (ok && res?.data?.redirect_url) {
        // Gateway-redirect flow (MercadoPago, etc.): the server keeps the
        // server cart intact until /payment/verify confirms approval. The
        // full-page redirect blows away React state anyway, so we don't
        // touch the local cart here — if the gateway succeeds, /payment/verify
        // clears the server cart and the next CartProvider mount picks that
        // up. If it fails, the user comes back and their items are still here.
        window.location.href = res.data.redirect_url;
        return;
      }

      if (ok && res?.data?.order_id) {
        // COD / inline-success flow: the server already ran Cart.deleteMany
        // for this consumer inside /payment/initialize, so pull the empty
        // cart down to keep React state in sync.
        setCartProducts && setCartProducts([]);
        setCartTotal && setCartTotal(0);
        if (typeof window !== "undefined") {
          // Clear any guest-cart residue so a later logout doesn't resurrect
          // the just-purchased items.
          try { localStorage.removeItem("cart"); } catch {}
        }
        cartRefetch && cartRefetch();
        router.push(`/order/success?id=${res.data.order_id}`);
        return;
      }

      // Anything else — bad request, gateway error, or auth issue. Surface a
      // user-facing toast with whatever message the API gave us and keep a
      // debug breadcrumb in the console. Using console.warn here (not error)
      // so Next.js dev mode doesn't promote it to the runtime error overlay.
      const apiMessage =
        res?.data?.detail ||
        res?.data?.message ||
        (res?.status ? `Request failed with status ${res.status}` : "Could not place the order");
      ToastNotification("error", apiMessage);
      if (typeof console !== "undefined") {
        console.warn("[PlaceOrder] unexpected response:", { status: res?.status, body: res?.data });
      }
    } catch (err) {
      // Real exception (network drop, etc.). Same idea — toast + warn, no
      // overlay-triggering console.error.
      ToastNotification("error", err?.message || "Could not place the order");
      if (typeof console !== "undefined") {
        console.warn("[PlaceOrder] exception:", err);
      }
    } finally {
      setLoading(false);
    }
  };
  // Guests must authenticate before they can pay: the place-order button
  // becomes a "log in to continue" action that opens the auth modal.
  if (!access_token) {
    return (
      <div className="text-end">
        <Btn className="order-btn" onClick={() => setOpenAuthModal && setOpenAuthModal(true)}>
          {t("LoginToContinue")}
        </Btn>
      </div>
    );
  }

  return (
    <div className="text-end">
      <Btn className="order-btn" onClick={handleClick} disabled={loading}>
        {loading ? t("Loading") : t("PlaceOrder")}
      </Btn>
    </div>
  );
};

export default PlaceOrder;
