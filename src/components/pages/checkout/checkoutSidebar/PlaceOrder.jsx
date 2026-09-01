import Btn from "@/elements/buttons/Btn";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
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
  const { setCartProducts, setCartTotal, refetch: cartRefetch, cartProducts } = useContext(CartContext) || {};
  const { settingData } = useContext(SettingContext) || {};
  const guestCheckout = Boolean(settingData?.activation?.guest_checkout);
  const isGuest = !access_token;

  // En vez de un botón deshabilitado sin explicación, el clic valida y le
  // dice al cliente exactamente qué falta para poder realizar el pedido.
  const missingRequirements = () => {
    const missing = [];
    if (isGuest) {
      // Invitado: los datos van inline — la validación de Formik marca lo
      // que falte (nombre, correo, teléfono, direcciones).
      if (Object.keys(errors || {}).length) missing.push(t("CompleteRequiredFields"));
    } else {
      if (!values["billing_address_id"]) missing.push(t("SelectBillingAddressFirst"));
      if (!addToCartData?.is_digital_only && !values["shipping_address_id"]) missing.push(t("SelectShippingAddressFirst"));
    }
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
      // Invitados: el carrito vive en el navegador — se envían los ids y el
      // servidor reconstruye precios desde la base de datos.
      const payload = isGuest ? { ...values, products: cartProducts } : values;
      const res = await request({ url: "/payment/initialize", method: "post", data: payload });
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

      // Invitado que marcó "crear cuenta": se registra en segundo plano; el
      // servidor adopta sus pedidos por el correo. Si el correo ya existe,
      // se ignora silenciosamente (el pedido no depende de esto).
      if (ok && isGuest && values["create_account"] && values["password"]) {
        try {
          await request({ url: "/register", method: "post", data: { name: values.name, email: values.email, password: values.password, phone: values.phone, country_code: values.country_code } });
        } catch (_) { /* no bloquea el pedido */ }
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
  // Sin sesión: si el checkout de invitados está desactivado, el botón
  // invita a iniciar sesión; si está activo, el invitado compra normal.
  if (isGuest && !guestCheckout) {
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
