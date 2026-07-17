import React from "react";
import { useTranslation } from "react-i18next";
import { RiFacebookFill, RiInstagramFill, RiWhatsappFill } from "react-icons/ri";

// TODO: replace these with the real Xdope profiles / WhatsApp number
const SOCIAL_LINKS = {
  facebook: "https://facebook.com/",
  instagram: "https://www.instagram.com/xdope276",
  whatsapp: "https://wa.me/573000000000", // format: https://wa.me/<country code><number>, no + or spaces
};

const ContactDetails = () => {
  const { t } = useTranslation("common");
  return (
    <div className="contact-title">
      <h2>{t("GetInTouch")}</h2>
      <p>{t("ContactUsDescription")}</p>
      <div className="footer-social">
        <ul>
          <li>
            <a target="_blank" rel="noreferrer" href={SOCIAL_LINKS.facebook} aria-label="Facebook">
              <RiFacebookFill />
            </a>
          </li>
          <li>
            <a target="_blank" rel="noreferrer" href={SOCIAL_LINKS.instagram} aria-label="Instagram">
              <RiInstagramFill />
            </a>
          </li>
          <li>
            <a target="_blank" rel="noreferrer" href={SOCIAL_LINKS.whatsapp} aria-label="WhatsApp">
              <RiWhatsappFill />
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ContactDetails;
