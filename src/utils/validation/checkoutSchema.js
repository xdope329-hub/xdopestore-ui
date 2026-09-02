import * as Yup from "yup";

/**
 * Reglas de validación del checkout (y de las direcciones que comparte con
 * el resto de la tienda). Archivo .js puro — sin React — para poder
 * testearlo en aislamiento con `node --test` (ver checkoutSchema.test.mjs).
 * ValidationSchema.jsx re-exporta estas reglas para el resto de formularios.
 *
 * Los mensajes son claves de traducción en locales/*\/common.json (evitar la
 * palabra "field": el handleModifier de ModifiedErrorMessage recorta el
 * mensaje en ella).
 */

// Teléfono: obligatorio, solo dígitos (7 a 15). Se valida como texto para
// conservar ceros a la izquierda y rechazar "e", "+", "-" o espacios.
export const phoneSchema = Yup.string()
  .required("Phone is a required")
  .matches(/^[0-9]{7,15}$/, "Phone is invalid");

// ── Dirección: validación compartida ─────────────────────────────────────
// Un único conjunto de reglas para TODOS los formularios de dirección
// (modal del checkout, checkout de invitados envío/facturación y cuenta →
// direcciones). Cambiar una regla aquí aplica en todos lados.
export const addressTitleSchema = Yup.string().trim()
  .required("Title is a required")
  .min(2, "Title is too short")
  .max(100, "Title is too long");
export const streetSchema = Yup.string().trim()
  .required("Street is a required")
  .min(5, "Street is too short")
  .max(200, "Street is too long");
export const citySchema = Yup.string().trim().required("City is a required");
// Código postal: opcional, pero si se escribe debe ser numérico (4 a 10 dígitos).
export const pincodeSchema = Yup.string().nullable()
  .matches(/^[0-9]{4,10}$/, { message: "Pincode is invalid", excludeEmptyString: true });
export const countryCodeSchema = Yup.string().required("Country code is a required");
export const countryIdSchema = Yup.string().required("Country id is a required");
export const stateIdSchema = Yup.string().required("State id is a required");

export const addressFieldsSchema = {
  title: addressTitleSchema,
  street: streetSchema,
  city: citySchema,
  pincode: pincodeSchema,
  phone: phoneSchema,
  country_code: countryCodeSchema,
  country_id: countryIdSchema,
  state_id: stateIdSchema,
};

// Versión objeto, para direcciones anidadas (checkout de invitados).
export const addressObjectSchema = Yup.object().shape(addressFieldsSchema);

// ── Datos de contacto del invitado ───────────────────────────────────────
// Nombre completo: espacios en blanco no cuentan como nombre.
export const fullNameSchema = Yup.string().trim()
  .required("Name is a required")
  .min(2, "Name is too short")
  .max(100, "Name is too long");

export const guestEmailSchema = Yup.string().trim()
  .required("Email is required")
  .email("Enter Valid Email");

// Contraseña de "crear cuenta" durante el checkout: las MISMAS reglas que
// el registro (8 a 20 caracteres). Antes solo se exigía "no vacía", y el
// registro en segundo plano fallaba en silencio con contraseñas cortas: el
// cliente creía tener cuenta y no la tenía.
export const createAccountPasswordSchema = Yup.string().when("create_account", {
  is: true,
  then: (schema) => schema.required("Password is a required").min(8, "Password is too short").max(20, "Password is too long"),
  otherwise: (schema) => schema.notRequired(),
});

/**
 * Esquema del checkout según quién compra.
 *  - Invitado: contacto + direcciones inline (las que viajan al API).
 *  - Con sesión: nada que validar en Formik — las direcciones son tarjetas
 *    guardadas (ids) y PlaceOrder verifica la selección. Validar aquí los
 *    campos de invitado dejaba el formulario "inválido" para siempre.
 * `requiresShipping` = false para carritos solo digitales (sin envío).
 */
export const buildCheckoutValidationSchema = ({ isGuest, requiresShipping = true } = {}) => {
  if (!isGuest) return Yup.object();
  return Yup.object().shape({
    name: fullNameSchema,
    email: guestEmailSchema,
    phone: phoneSchema,
    country_code: countryCodeSchema,
    password: createAccountPasswordSchema,
    billing_address: addressObjectSchema,
    ...(requiresShipping ? { shipping_address: addressObjectSchema } : {}),
  });
};
