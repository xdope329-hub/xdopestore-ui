import SettingContext from "@/context/settingContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import React, { useContext } from "react";
import { useTranslation } from "react-i18next";
import { RiFacebookFill, RiInstagramFill, RiWhatsappFill } from "react-icons/ri";

// Fallbacks when nothing is configured in the admin yet.
// Facebook / Instagram are edited in: Settings -> Social Networks.
// WhatsApp number is edited in:       Settings -> WhatsApp.
const FALLBACK_LINKS = {
  facebook: "https://facebook.com/",
  instagram: "https://www.instagram.com/xdope276",
  whatsapp: "https://wa.me/573000000000",
};

const ContactDetails = () => {
  const { t } = useTranslation("common");
  const { themeOption } = useContext(ThemeOptionContext) || {};
  const { settingData } = useContext(SettingContext) || {};

  // Settings -> Social Networks is the source of truth (theme-independent);
  // theme options' footer URLs are only a legacy fallback.
  const social = settingData?.social || {};
  const facebook = social.facebook || themeOption?.footer?.facebook || FALLBACK_LINKS.facebook;
  const instagram = social.instagram || themeOption?.footer?.instagram || FALLBACK_LINKS.instagram;
  // wa.me needs digits only — accept "+57 300 123 4567" etc.
  const waNumber = String(settingData?.whatsapp?.number ?? "").replace(/\D/g, "");
  const whatsapp = waNumber ? `https://wa.me/${waNumber}` : FALLBACK_LINKS.whatsapp;

  return (
    <div className="contact-title">
      <h2>{t("GetInTouch")}</h2>
      <p>{t("ContactUsDescription")}</p>
      <div className="footer-social">
        <ul>
          <li>
            <a target="_blank" rel="noreferrer" href={facebook} aria-label="Facebook">
              <RiFacebookFill />
            </a>
          </li>
          <li>
            <a target="_blank" rel="noreferrer" href={instagram} aria-label="Instagram">
              <RiInstagramFill />
            </a>
          </li>
          <li>
            <a target="_blank" rel="noreferrer" href={whatsapp} aria-label="WhatsApp">
              <RiWhatsappFill />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ContactDetails;
