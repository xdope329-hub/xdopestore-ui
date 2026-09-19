"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { createMetaPixelClient, readFbc } from "@/utils/analytics/metaPixel";

const MetaPixelContext = createContext(null);
export const useMetaPixel = () => useContext(MetaPixelContext);

// Hook para vistas de contenido (ViewContent en producto, InitiateCheckout).
// Se dispara UNA vez por `key` (evita doble fire en StrictMode, rerenders y
// vueltas al mismo item en SPA).
export function useMetaPixelView(eventName, lines, key, enabled = true, extra) {
  const pixel = useMetaPixel();
  const lastKey = useRef(null);
  useEffect(() => {
    if (!enabled || !pixel || !key || lastKey.current === key) return;
    if (pixel.trackLines(eventName, lines, undefined, extra)) lastKey.current = key;
  }, [pixel, eventName, key, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
}

export default function MetaPixel({ pixelId, children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const clientRef = useRef(null);
  const [client, setClient] = useState(null);

  useEffect(() => {
    if (!pixelId || typeof window === "undefined") return;
    if (!clientRef.current) clientRef.current = createMetaPixelClient(pixelId, window);
    // Al cargar por primera vez: sembrar la cookie _fbc si venimos de un
    // anuncio (fbclid en la URL). No pisa un _fbc valido previo.
    readFbc(window);
    clientRef.current?.pageView();
    setClient(clientRef.current);
  }, [pixelId]);

  // PageView en cambios de ruta (SPA). El cliente deduplica por path+search.
  useEffect(() => {
    client?.pageView();
  }, [client, pathname, searchParams]);

  return (
    <MetaPixelContext.Provider value={client}>
      {children}
      {pixelId && (
        <Script id="xdope-meta-pixel" strategy="afterInteractive" src="https://connect.facebook.net/en_US/fbevents.js" />
      )}
      {pixelId && (
        // <noscript> para clientes sin JS: la mayoria del funnel requiere JS,
        // pero al menos PageView queda registrado. No incluye event_id porque
        // el fallback no puede coordinarse con CAPI.
        // eslint-disable-next-line @next/next/no-img-element
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          />
        </noscript>
      )}
    </MetaPixelContext.Provider>
  );
}
