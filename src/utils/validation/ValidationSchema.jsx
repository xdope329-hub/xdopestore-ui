import * as Yup from "yup";

export const YupObject = (schemaObject) => Yup.object().shape(schemaObject);

export const emailSchema = Yup.string().email("Enter Valid Email").required("Email is required");
export const passwordSchema = Yup.string().min(8, "Too Short!").max(20, "Too Long!").required();
export const nameSchema = Yup.string().required();
export const recaptchaSchema = Yup.string().required("Please complete the captcha");
export const descriptionSchema = Yup.string().required().min(10, "The description must be at least 10 characters.");
export const roleIdSchema = Yup.string().required();
export const permissionsSchema = Yup.array().min(1).required();
export const dropDownScheme = Yup.array().min(1).required();
export const passwordConfirmationSchema = Yup.string()
  .when("password", {
    is: (val) => (val && val.length > 0 ? true : false),
    then: () => Yup.string().oneOf([Yup.ref("password")], "Confirm Password Does Not Matched"), 
  }).required('Confirm Password Is Required');

export const visibleTimeSchema = Yup.date().when("stock_status", {
  is: (val) => val === "coming_soon",
  then: () => Yup.date().required(),
});

export const ifTypeSimpleSchema = Yup.string().when("type", {
  is: (val) => val == "simple",
  then: () => Yup.string().required(),
  otherwise: () => Yup.string().notRequired()
});

export const ifTypeSimpleArraySchema = Yup.array().when("type", {
  is: (val) => val === "simple",
  then: () => Yup.array().min(1).required(),
  otherwise: () => Yup.string().notRequired()
});
export const ifIsUnlimited = Yup.number().when("is_unlimited", {
  is: (val) => !val,
  then: () => Yup.number().positive().required(),
});
export const ifIsExpirable = Yup.date().when("is_expired", {
  is: (val) => val,
  then: () => Yup.date().required(),
});
export const idCreateAccount = Yup.string().when("create_account", {
  is: true,
  then: () => Yup.string().required(),
  otherwise: () => Yup.string().notRequired()
});

export const ifTypeIsfree_shipping = Yup.number().when("type", {
  is: (val) => val !== "free_shipping",
  then: () => Yup.number().positive().required(),
});

export const ifShippingTypeIsFree = Yup.number().when("shipping_type", {
  is: (val) => val !== "free",
  then: () => Yup.number().positive().required(),
});

export const discountSchema = Yup.number().min(0).max(100);
export const requiredSchema = Yup.mixed().required();
export const StatusSchema = Yup.boolean().required();

// Teléfono: obligatorio, solo dígitos (7 a 15). Los mensajes son claves de
// traducción en locales/*/common.json (evitar la palabra "field": el
// handleModifier de ModifiedErrorMessage recorta el mensaje en ella).
export const phoneSchema = Yup.string()
  .required("Phone is a required")
  .matches(/^[0-9]{7,15}$/, "Phone is invalid")

export const ifIsApplyAll = Yup.array().when("is_apply_all", {
  is: (val) => !val,
  then: () => Yup.array().min(1).required(),
});

export const videoLinkSchema = Yup.string().when('video_provider', {
  is: (val) => val,
  then: () => Yup.string().required(),
  // otherwise: Yup.string().nullable(),
})

export const attributeValues = Yup.array().of(
  Yup.object().shape({
    value: () => Yup.string().required()
  })
)

export const variationSchema = Yup.array().of(Yup.object().shape({
  name: nameSchema,
  price: nameSchema,
  sku: nameSchema,
  quantity: nameSchema,
  status: nameSchema
}))

// ── Dirección: validación compartida ─────────────────────────────────────
// Un único conjunto de reglas para TODOS los formularios de dirección
// (modal del checkout, checkout de invitados envío/facturación y cuenta →
// direcciones). Cambiar una regla aquí aplica en todos lados, igual que
// los campos viven una sola vez en AddressFields.
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
