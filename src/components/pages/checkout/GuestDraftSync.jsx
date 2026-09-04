import { useFormikContext } from "formik";
import { useEffect, useRef } from "react";
import { GUEST_DRAFT_FIELDS, loadDraft, saveDraft } from "./guestCheckoutDraft";

const storage = () => (typeof window !== "undefined" ? window.sessionStorage : null);

/**
 * Mantiene el borrador del invitado en sessionStorage: al montar restaura
 * lo guardado (contacto, tarjetas de dirección y selecciones) y después
 * guarda cada cambio. Se limpia al confirmar el pedido (PlaceOrder).
 */
const GuestDraftSync = () => {
  const { values, setValues } = useFormikContext();
  const restored = useRef(false);

  useEffect(() => {
    const draft = loadDraft(storage());
    if (draft) setValues((current) => ({ ...current, ...draft }), false);
    restored.current = true;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const snapshot = JSON.stringify(GUEST_DRAFT_FIELDS.map((k) => values[k]));
  useEffect(() => {
    if (!restored.current) return;
    const timer = setTimeout(() => saveDraft(storage(), values), 300);
    return () => clearTimeout(timer);
  }, [snapshot]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
};

export default GuestDraftSync;
