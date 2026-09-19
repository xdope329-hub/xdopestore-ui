"use client";

import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import MetaPixel from "@/components/analytics/MetaPixel";
import { useConsent } from "./ConsentBanner";

/**
 * Envuelve GA + Meta Pixel y les pasa el id SOLO si el usuario acepto la
 * categoria `analytics`. Sin consentimiento, ambos providers ven `""` y quedan
 * en modo no-op (no cargan scripts ni crean cookies).
 */
export default function GatedAnalytics({ measurementId, metaPixelId, children }) {
  const { analytics } = useConsent();
  const gaId = analytics ? measurementId : "";
  const pxId = analytics ? metaPixelId : "";
  return (
    <GoogleAnalytics key={gaId || "off"} measurementId={gaId}>
      <MetaPixel key={pxId || "off"} pixelId={pxId}>
        {children}
      </MetaPixel>
    </GoogleAnalytics>
  );
}
