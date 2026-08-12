"use client";
import SettingContext from "@/context/settingContext";
import { usePathname } from "next/navigation";
import { useContext } from "react";
import { useTranslation } from "react-i18next";

/**
 * Floating WhatsApp button.
 *
 * Configured from the admin (Settings -> WhatsApp), so the number can change
 * without a deploy. Renders nothing until an admin enables it and saves a
 * number. Sits bottom-right; the back-to-top button (when enabled) stacks above it.
 */
const WhatsAppButton = () => {
  const { t } = useTranslation("common");
  const { settingData } = useContext(SettingContext);
  const pathname = usePathname();

  const config = settingData?.whatsapp || {};

  // Only on the home page ("inicio"); the locale-prefixed variants count too.
  const isHome = pathname === "/" || /^\/[a-z]{2}$/.test(pathname || "");
  if (!isHome) return null;

  // wa.me needs digits only — accept "+57 300 123 4567", "(300) 123-4567", etc.
  const number = String(config.number ?? "").replace(/\D/g, "");
  const enabled = config.status === undefined ? Boolean(number) : Boolean(config.status);
  if (!enabled || !number) return null;

  const message = String(config.message ?? "").trim();
  const href = `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  const label = t("ChatOnWhatsApp");

  return (
    <>
      <style>{`
        .xd-whatsapp-fab {
          position: fixed;
          right: calc(18px + (30 - 18) * ((100vw - 320px) / (1920 - 320)));
          bottom: calc(18px + (30 - 18) * ((100vw - 767px) / (1920 - 767)));
          z-index: 8;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #25d366;
          color: #fff;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .xd-whatsapp-fab:hover,
        .xd-whatsapp-fab:focus-visible {
          color: #fff;
          transform: scale(1.08);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
        }
        .xd-whatsapp-fab svg { width: 28px; height: 28px; fill: currentColor; }
        /* Phones/tablets show a fixed bottom navigation bar — float the
           button above it so it never covers the user/menu items. */
        @media (max-width: 767px) {
          .xd-whatsapp-fab { bottom: 84px; }
        }
        @media (max-width: 575px) {
          .xd-whatsapp-fab { width: 46px; height: 46px; bottom: 78px; }
          .xd-whatsapp-fab svg { width: 24px; height: 24px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .xd-whatsapp-fab { transition: none; }
          .xd-whatsapp-fab:hover { transform: none; }
        }
      `}</style>
      <a className="xd-whatsapp-fab" href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
        {/* WhatsApp glyph */}
        <svg viewBox="0 0 24 24" role="img" aria-hidden="true" focusable="false">
          <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 18.02h-.01c-1.52 0-3.01-.41-4.31-1.18l-.31-.18-3.2.84.85-3.12-.2-.32a8.2 8.2 0 0 1-1.26-4.15c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.41a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.1-8.24 8.1z" />
        </svg>
      </a>
    </>
  );
};

export default WhatsAppButton;
