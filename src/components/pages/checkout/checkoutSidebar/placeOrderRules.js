/**
 * Reglas puras del botón "Realizar pedido" (sin React): qué falta para poder
 * pedir y qué viaja a /payment/initialize. Testeable con `node --test`
 * (ver placeOrderRules.test.mjs).
 */

// Claves que solo existen en el estado local del checkout de invitados
// (tarjetas de dirección locales) y que el API no conoce.
const GUEST_LOCAL_KEYS = ["shipping_address_id", "billing_address_id", "guest_addresses"];

/**
 * Lista de requisitos pendientes, en el orden en que se le muestran al
 * cliente (el primero es el que sale en el toast). Invitado y logueado
 * usan la MISMA experiencia de direcciones (tarjetas + modal), así que las
 * mismas verificaciones aplican a ambos.
 *
 * `errors` son los errores de Formik ya calculados (validateForm) — solo
 * cuentan para el invitado: los campos de contacto no existen con sesión.
 */
export const getMissingRequirements = ({ values = {}, errors = {}, isGuest = false, requiresShipping = true, t = (key) => key } = {}) => {
  const missing = [];
  if (!values.billing_address_id) missing.push(t("SelectBillingAddressFirst"));
  if (requiresShipping && !values.shipping_address_id) missing.push(t("SelectShippingAddressFirst"));
  const hasFieldErrors = Boolean(isGuest) && Object.keys(errors || {}).length > 0;
  if (hasFieldErrors) missing.push(t("CompleteRequiredFields"));
  if (!values.payment_method) missing.push(t("SelectPaymentMethodFirst"));
  return { missing, hasFieldErrors };
};

/**
 * Cuerpo de POST /payment/initialize.
 *  - Nunca viaja la contraseña de "crear cuenta": el pago no la necesita y
 *    /register la recibe aparte.
 *  - Invitado: el carrito vive en el navegador — se envían los ids y el
 *    servidor reconstruye precios desde la base de datos; las direcciones
 *    van inline (shipping_address / billing_address) y los ids/lista local
 *    de tarjetas no significan nada para el API.
 */
export const buildInitializePayload = ({ values = {}, isGuest = false, cartProducts = [] } = {}) => {
  const { password, guest_addresses, ...payload } = values;
  if (!isGuest) return payload;
  GUEST_LOCAL_KEYS.forEach((key) => { delete payload[key]; });
  return { ...payload, products: cartProducts || [] };
};

/**
 * Datos del registro en segundo plano cuando el invitado marcó "crear
 * cuenta". null si no lo pidió o no puso contraseña.
 */
export const getGuestRegistrationPayload = (values = {}) => {
  if (!values.create_account || !values.password) return null;
  return {
    name: values.name,
    email: values.email,
    password: values.password,
    phone: values.phone,
    country_code: values.country_code,
  };
};
