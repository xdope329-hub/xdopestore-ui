/**
 * Borrador del checkout de INVITADOS en sessionStorage: contacto, tarjetas
 * de dirección locales y selecciones. Un refresh (o volver atrás desde la
 * pasarela) ya no borra todo lo escrito. Nunca se guarda la contraseña.
 * Módulo puro (sin React), testeado en guestCheckoutDraft.test.mjs.
 */

export const GUEST_DRAFT_KEY = "xdope_checkout_guest_draft";

// Campos que se conservan entre recargas. `password` y `products` quedan
// fuera a propósito (el carrito vive en su propio almacenamiento).
export const GUEST_DRAFT_FIELDS = [
  "name",
  "email",
  "phone",
  "country_code",
  "create_account",
  "guest_addresses",
  "shipping_address_id",
  "billing_address_id",
  "payment_method",
];

const safe = (fn, fallback) => {
  try {
    return fn();
  } catch (_) {
    return fallback;
  }
};

/** Solo los campos permitidos, con valor. */
export function pickDraft(values = {}) {
  const draft = {};
  for (const key of GUEST_DRAFT_FIELDS) {
    const v = values[key];
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    draft[key] = v;
  }
  return draft;
}

export function loadDraft(storage) {
  if (!storage) return null;
  const raw = safe(() => storage.getItem(GUEST_DRAFT_KEY), null);
  if (!raw) return null;
  const parsed = safe(() => JSON.parse(raw), null);
  if (!parsed || typeof parsed !== "object") return null;
  const draft = pickDraft(parsed);
  // Ids seleccionados que ya no existen en las tarjetas guardadas se descartan.
  const ids = new Set((draft.guest_addresses || []).map((a) => a?.id));
  for (const key of ["shipping_address_id", "billing_address_id"]) {
    if (draft[key] && !ids.has(draft[key])) delete draft[key];
  }
  return Object.keys(draft).length ? draft : null;
}

export function saveDraft(storage, values) {
  if (!storage) return false;
  const draft = pickDraft(values);
  return safe(() => {
    if (!Object.keys(draft).length) storage.removeItem(GUEST_DRAFT_KEY);
    else storage.setItem(GUEST_DRAFT_KEY, JSON.stringify(draft));
    return true;
  }, false);
}

export function clearDraft(storage) {
  if (!storage) return;
  safe(() => storage.removeItem(GUEST_DRAFT_KEY));
}
