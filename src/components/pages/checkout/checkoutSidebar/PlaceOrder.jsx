import Btn from "@/elements/buttons/Btn";
import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import request from "@/utils/axiosUtils";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import { setNestedObjectValues, useFormikContext } from "formik";
import { useRouter } from "next/navigation";
import React, { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { buildInitializePayload, getGuestRegistrationPayload, getMissingRequirements } from "./placeOrderRules";
import { clearDraft } from "../guestCheckoutDraft";

// `appliedCouponCode`: el cupón realmente aplicado en el resumen (vacío si
// no hay). El texto del campo de cupón NO cuenta.
const PlaceOrder = ({ values, addToCartData, sessionToken, appliedCouponCode = "" }) => {
  const { t } = useTranslation("common");
  // La MISMA fuente de verdad que decidió qué checkout se mostró (formulario
  // de invitado vs direcciones guardadas): el estado del checkout, no una
  // lectura directa de la cookie. Leer la cookie aquí hacía que el botón
  // exigiera "billing_address_id" (flujo logueado) a un usuario que estaba
  // viendo y llenando el formulario de invitado.
  const access_token = sessionToken;
  const router = useRouter();
  const { setOpenAuthModal } = useContext(ThemeOptionContext) || {};
  const [loading, setLoading] = useState(false);
  // Cart context is used to flush the local cart state after a successful
  // order so the header badge and cart drawer reflect the cleared server cart.
  const { setCartProducts, setCartTotal, refetch: cartRefetch, cartProducts } = useContext(CartContext) || {};
  const { settingData } = useContext(SettingContext) || {};
  const guestCheckout = Boolean(settingData?.activation?.guest_checkout);
  const isGuest = !access_token;
  const requiresShipping = !addToCartData?.is_digital_only;
  // Contexto de Formik del checkout: valida bajo demanda y marca los campos
  // como "touched" para que los errores se pinten en rojo bajo cada campo
  // cuando el invitado intenta pedir con datos incompletos.
  const formik = useFormikContext();

  // En vez de un botón deshabilitado sin explicación, el clic valida y le
  // dice al cliente exactamente qué falta para poder realizar el pedido.
  const findMissingRequirements = async () => {
    // Validación FRESCA: no se confía en el snapshot `errors` de Formik, que
    // puede estar vacío si todavía no corrió ninguna validación (el invitado
    // nunca tocó los campos) y dejaba pasar un pedido sin nombre ni correo.
    let fieldErrors = {};
    if (isGuest && formik) {
      fieldErrors = (await formik.validateForm()) || {};
    }
    const { missing, hasFieldErrors } = getMissingRequirements({ values, errors: fieldErrors, isGuest, requiresShipping, t });
    if (hasFieldErrors && formik) {
      formik.setTouched(setNestedObjectValues(fieldErrors, true), false);
    }
    return missing;
  };

  const handleClick = async () => {
    setLoading(true);
    try {
      const missing = await findMissingRequirements();
      if (missing.length) {
        ToastNotification("error", missing[0]);
        return;
      }

      // Nunca viaja la contraseña; el invitado manda productos + direcciones
      // inline (ver placeOrderRules.js).
      const payload = buildInitializePayload({ values, isGuest, cartProducts, couponCode: appliedCouponCode });
      const res = await request({ url: "/payment/initialize", method: "post", data: payload });
      const ok = res?.status === 200 || res?.status === 201;

      // Invitado que marcó "crear cuenta": se registra en segundo plano ANTES
      // de redirigir a la pasarela (con Mercado Pago la redirección destruye
      // la página y el registro nunca ocurría). El servidor adopta sus
      // pedidos por el correo; si el correo ya existe se ignora en silencio
      // (el pedido no depende de esto).
      const registration = ok && isGuest ? getGuestRegistrationPayload(values) : null;
      if (registration) {
        try {
          await request({ url: "/register", method: "post", data: registration });
        } catch (_) { /* no bloquea el pedido */ }
      }

      // Pedido creado: el borrador del invitado ya no hace falta.
      if (ok && isGuest && typeof window !== "undefined") clearDraft(window.sessionStorage);

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
      // Response bodies can carry addresses / contact data: dev-only breadcrumb.
      if (process.env.NODE_ENV !== "production") {
        console.warn("[PlaceOrder] unexpected response:", { status: res?.status, body: res?.data });
      }
    } catch (err) {
      // Real exception (network drop, etc.). Same idea — toast + warn, no
      // overlay-triggering console.error.
      ToastNotification("error", err?.message || "Could not place the order");
      if (process.env.NODE_ENV !== "production") {
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
