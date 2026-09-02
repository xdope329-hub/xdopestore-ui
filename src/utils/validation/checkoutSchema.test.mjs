import assert from "node:assert/strict";
import test from "node:test";
import { buildCheckoutValidationSchema, fullNameSchema, phoneSchema } from "./checkoutSchema.js";

// Devuelve { path: message } con el PRIMER error de cada campo (igual que
// Formik, que muestra un solo mensaje por campo).
const errorsOf = async (schema, values) => {
  try {
    await schema.validate(values, { abortEarly: false });
    return {};
  } catch (err) {
    const out = {};
    (err.inner?.length ? err.inner : [err]).forEach((e) => {
      if (!(e.path in out)) out[e.path] = e.message;
    });
    return out;
  }
};

const address = (overrides = {}) => ({
  title: "Casa",
  street: "Calle 1 #2-3",
  city: "Bogotá",
  country_code: "57",
  phone: "3001234567",
  pincode: "",
  country_id: "48",
  state_id: "1",
  ...overrides,
});

const validGuest = (overrides = {}) => ({
  name: "Ana Pérez",
  email: "ana@example.com",
  country_code: "57",
  phone: "3001234567",
  create_account: false,
  password: "",
  shipping_address: address(),
  billing_address: address(),
  ...overrides,
});

const guestSchema = buildCheckoutValidationSchema({ isGuest: true });

test("un invitado con todos los datos correctos pasa la validación", async () => {
  assert.deepEqual(await errorsOf(guestSchema, validGuest()), {});
});

test("nombre: espacios en blanco o una sola letra no son un nombre", async () => {
  assert.equal((await errorsOf(guestSchema, validGuest({ name: "   " }))).name, "Name is a required");
  assert.equal((await errorsOf(guestSchema, validGuest({ name: "A" }))).name, "Name is too short");
  assert.equal((await errorsOf(guestSchema, validGuest({ name: "A".repeat(101) }))).name, "Name is too long");
  assert.equal((await errorsOf(fullNameSchema, "  Ana  ")).name, undefined);
});

test("correo: obligatorio, con formato y tolerante a espacios alrededor", async () => {
  assert.equal((await errorsOf(guestSchema, validGuest({ email: "" }))).email, "Email is required");
  assert.equal((await errorsOf(guestSchema, validGuest({ email: "ana@" }))).email, "Enter Valid Email");
  assert.equal((await errorsOf(guestSchema, validGuest({ email: "  ana@example.com " }))).email, undefined);
});

test("teléfono: solo dígitos (7 a 15), conserva ceros a la izquierda", async () => {
  assert.equal((await errorsOf(guestSchema, validGuest({ phone: "" }))).phone, "Phone is a required");
  assert.equal((await errorsOf(guestSchema, validGuest({ phone: "300abc4567" }))).phone, "Phone is invalid");
  assert.equal((await errorsOf(guestSchema, validGuest({ phone: "+573001234567" }))).phone, "Phone is invalid");
  assert.equal((await errorsOf(guestSchema, validGuest({ phone: "300 123 4567" }))).phone, "Phone is invalid");
  assert.equal((await errorsOf(guestSchema, validGuest({ phone: "123456" }))).phone, "Phone is invalid");
  assert.equal((await errorsOf(guestSchema, validGuest({ phone: "1".repeat(16) }))).phone, "Phone is invalid");
  assert.equal((await errorsOf(guestSchema, validGuest({ phone: "0300123" }))).phone, undefined);
  // Valor numérico (estado antiguo del formulario) sigue aceptándose.
  assert.equal((await errorsOf(phoneSchema, 3001234567)).undefined, undefined);
});

test("contraseña: solo cuenta al marcar 'crear cuenta' y con las reglas del registro", async () => {
  assert.equal((await errorsOf(guestSchema, validGuest({ create_account: false, password: "" }))).password, undefined);
  assert.equal((await errorsOf(guestSchema, validGuest({ create_account: true, password: "" }))).password, "Password is a required");
  assert.equal((await errorsOf(guestSchema, validGuest({ create_account: true, password: "abc" }))).password, "Password is too short");
  assert.equal((await errorsOf(guestSchema, validGuest({ create_account: true, password: "a".repeat(21) }))).password, "Password is too long");
  assert.equal((await errorsOf(guestSchema, validGuest({ create_account: true, password: "Secreta123" }))).password, undefined);
});

test("direcciones: envío y facturación son obligatorias y se validan campo a campo", async () => {
  const errors = await errorsOf(guestSchema, validGuest({ shipping_address: address({ title: "", phone: "12" }) }));
  assert.equal(errors["shipping_address.title"], "Title is a required");
  assert.equal(errors["shipping_address.phone"], "Phone is invalid");
  assert.equal(errors["billing_address.title"], undefined);

  const missing = await errorsOf(guestSchema, { ...validGuest(), billing_address: address({ street: "", country_id: "", state_id: "", city: "" }) });
  assert.equal(missing["billing_address.street"], "Street is a required");
  assert.equal(missing["billing_address.country_id"], "Country id is a required");
  assert.equal(missing["billing_address.state_id"], "State id is a required");
  assert.equal(missing["billing_address.city"], "City is a required");

  const pin = await errorsOf(guestSchema, validGuest({ billing_address: address({ pincode: "12ab" }) }));
  assert.equal(pin["billing_address.pincode"], "Pincode is invalid");
});

test("carrito solo digital: no se exige dirección de envío", async () => {
  const digital = buildCheckoutValidationSchema({ isGuest: true, requiresShipping: false });
  const errors = await errorsOf(digital, validGuest({ shipping_address: address({ title: "", street: "" }) }));
  assert.deepEqual(errors, {});
});

test("con sesión no se validan los campos de invitado (el formulario nunca queda 'inválido')", async () => {
  const loggedIn = buildCheckoutValidationSchema({ isGuest: false });
  const errors = await errorsOf(loggedIn, { name: "", email: "", phone: "", shipping_address: {}, billing_address: {} });
  assert.deepEqual(errors, {});
});
