/**
 * Reglas compartidas de los formularios de dirección (cuenta → direcciones
 * guardadas y checkout). Módulo puro (sin React), testeado en
 * addressRules.test.mjs.
 */

const addressId = (a) => a?.id || a?._id || null;

/** Valores iniciales del formulario: nueva dirección o edición. */
export function toAddressFormValues(address, { type = null, defaultCountryCode = "57", defaultIsDefault = false } = {}) {
  const editing = !!addressId(address);
  return {
    title: editing ? address.title || "" : "",
    street: editing ? address.street || "" : "",
    country_id: editing ? address.country_id ?? "" : "",
    state_id: editing ? address.state_id ?? "" : "",
    city: editing ? address.city || "" : "",
    pincode: editing ? address.pincode || "" : "",
    phone: editing ? address.phone || "" : "",
    type,
    country_code: editing ? address.country_code || defaultCountryCode : defaultCountryCode,
    is_default: editing ? Boolean(address.is_default) : defaultIsDefault,
  };
}

/** Lo que se envía al API. `editing` añade el override de método (PUT). */
export function buildAddressPayload(values = {}, { editing = false } = {}) {
  const payload = {
    ...values,
    title: String(values.title || "").trim(),
    street: String(values.street || "").trim(),
    city: String(values.city || "").trim(),
    pincode: values.pincode !== undefined && values.pincode !== null ? String(values.pincode).trim() : "",
    phone: String(values.phone || "").trim(),
    is_default: Boolean(values.is_default),
  };
  if (editing) payload._method = "PUT";
  else delete payload._method;
  return payload;
}

/**
 * Lista de direcciones tras guardar una: reemplaza (o añade) por id y, si
 * la guardada quedó como predeterminada, quita la marca a las demás (el API
 * hace lo mismo en la base).
 */
export function applyAddressUpdate(list = [], saved) {
  const savedId = addressId(saved);
  if (!savedId) return list;
  const exists = list.some((a) => addressId(a) === savedId);
  const merged = exists ? list.map((a) => (addressId(a) === savedId ? { ...a, ...saved } : a)) : [...list, saved];
  if (!saved.is_default) return merged;
  return merged.map((a) => (addressId(a) === savedId ? a : { ...a, is_default: false }));
}

/** Etiqueta del modal y del botón según el modo. */
export function addressModalLabels(editing) {
  return editing ? { title: "EditAddress", submit: "Save" } : { title: "AddAddress", submit: "Submit" };
}
