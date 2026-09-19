"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/**
 * Consentimiento de cookies (Ley 1581/2012 Colombia + GDPR-friendly).
 * Dos categorias: `necessary` (siempre activo — carrito, sesion) y
 * `analytics` (Google Analytics + Meta Pixel + CAPI). El estado se persiste en
 * localStorage bajo `xdope_consent_v1`; una version futura puede invalidar
 * consentimientos antiguos subiendo el sufijo.
 */

const STORAGE_KEY = "xdope_consent_v1";
const ConsentContext = createContext({
  analytics: false,
  decided: false,
  accept: () => {},
  reject: () => {},
  reopen: () => {},
});

export const useConsent = () => useContext(ConsentContext);

function readStored() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.analytics !== "boolean") return null;
    return { analytics: parsed.analytics, at: parsed.at || null };
  } catch {
    return null;
  }
}

function writeStored(next) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, at: new Date().toISOString() }));
  } catch { /* storage lleno / bloqueado */ }
}

export default function ConsentProvider({ children }) {
  // `decided` = ya vio el banner y eligio. Mientras sea false, se muestra el
  // banner y `analytics` es false (no cargamos pixel/GA hasta que decida).
  const [state, setState] = useState({ analytics: false, decided: false });

  useEffect(() => {
    const stored = readStored();
    if (stored) setState({ analytics: stored.analytics, decided: true });
  }, []);

  const accept = useCallback(() => {
    writeStored({ analytics: true });
    setState({ analytics: true, decided: true });
  }, []);
  const reject = useCallback(() => {
    writeStored({ analytics: false });
    setState({ analytics: false, decided: true });
    // Al rechazar, quitamos cookies de Meta que el pixel pudo dejar en la
    // sesion actual (el proveedor no las volvera a crear porque `analytics`
    // pasa a false). Cookies con path=/ se borran seteando expiracion pasada.
    if (typeof document !== "undefined") {
      document.cookie = "_fbp=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "_fbc=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  }, []);
  const reopen = useCallback(() => setState((s) => ({ ...s, decided: false })), []);

  return (
    <ConsentContext.Provider value={{ analytics: state.analytics, decided: state.decided, accept, reject, reopen }}>
      {children}
      {!state.decided && <ConsentBanner onAccept={accept} onReject={reject} />}
    </ConsentContext.Provider>
  );
}

function ConsentBanner({ onAccept, onReject }) {
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentimiento de cookies"
      style={{
        position: "fixed",
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: 9999,
        background: "#111",
        color: "#fff",
        borderRadius: 12,
        padding: "16px 20px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        display: "flex",
        gap: 16,
        alignItems: "center",
        flexWrap: "wrap",
        maxWidth: 960,
        margin: "0 auto",
        fontSize: 14,
        lineHeight: 1.5,
      }}
    >
      <div style={{ flex: "1 1 320px" }}>
        <strong style={{ display: "block", marginBottom: 4 }}>Usamos cookies</strong>
        Usamos cookies propias para el carrito y la sesion, y cookies de
        analitica (Google Analytics, Meta) para medir el rendimiento de la
        tienda. Puedes aceptarlas o rechazarlas. Lee mas en nuestra{" "}
        <a href="/privacy-policy" style={{ color: "#8ff5b8", textDecoration: "underline" }}>
          Politica de privacidad
        </a>
        .
      </div>
      <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
        <button
          type="button"
          onClick={onReject}
          style={{
            background: "transparent",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.5)",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          Rechazar
        </button>
        <button
          type="button"
          onClick={onAccept}
          style={{
            background: "var(--theme-color, #51ec8c)",
            color: "#111",
            border: 0,
            padding: "8px 20px",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
