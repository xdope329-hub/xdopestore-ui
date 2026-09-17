"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { createAnalyticsClient } from "@/utils/analytics/googleAnalytics";

const AnalyticsContext = createContext(null);
export const useAnalytics = () => useContext(AnalyticsContext);

export function useEcommerceView(name, lines, key, enabled = true) {
  const analytics = useAnalytics();
  const lastView = useRef(null);
  useEffect(() => {
    if (enabled && analytics && key && lastView.current !== key && analytics.ecommerce(name, lines)) {
      lastView.current = key;
    }
  }, [analytics, name, lines, key, enabled]);
}

export default function GoogleAnalytics({ measurementId, children }) {
  const pathname = usePathname();
  const clientRef = useRef(null);
  const [client, setClient] = useState(null);

  useEffect(() => {
    if (!measurementId) return;
    // The ref also prevents duplicate configuration during React Strict Mode replay.
    if (!clientRef.current) clientRef.current = createAnalyticsClient(measurementId, window);
    clientRef.current?.pageView();
    setClient(clientRef.current);
  }, [measurementId]);

  useEffect(() => { client?.pageView(); }, [client, pathname]);

  return (
    <AnalyticsContext.Provider value={client}>
      {children}
      {client && <Script id="xdope-google-analytics" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />}
    </AnalyticsContext.Provider>
  );
}
