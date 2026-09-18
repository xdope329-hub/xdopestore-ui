import * as Yup from "yup";

export const YupObject = (schemaObject) => Yup.object().shape(schemaObject);

export const emailSchema = Yup.string().email("Enter Valid Email").required("Email is required");
// Login: only length is checked (existing accounts may pre-date the policy).
// The old 20-character cap locked out anyone with a longer password.
export const passwordSchema = Yup.string().min(8, "Password is too short").max(128, "Password is too long").required("Password is a required");
// New passwords (register, change password): the same policy the API
// enforces - 8 to 128 characters with at least one letter and one number.
export const newPasswordSchema = passwordSchema
  .matches(/[A-Za-z]/, "Password needs a letter and a number")
  .matches(/[0-9]/, "Password needs a letter and a number");
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

// Teléfono y direcciones viven en checkoutSchema.js (archivo .js puro,
// testeable con `node --test`); se re-exportan aquí para el resto de formularios.
export {
  phoneSchema,
  addressTitleSchema,
  streetSchema,
  citySchema,
  pincodeSchema,
  countryCodeSchema,
  countryIdSchema,
  stateIdSchema,
  addressFieldsSchema,
  addressObjectSchema,
  fullNameSchema,
  guestEmailSchema,
  createAccountPasswordSchema,
  buildCheckoutValidationSchema,
} from "./checkoutSchema";

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

