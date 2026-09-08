"use client";
import SettingContext from "@/context/settingContext";
import { buildWhatsAppLink, whatsappHref } from "@/utils/customFunctions/whatsappLink";
import { buildProductInquiryMessage, productUrl } from "@/utils/customFunctions/whatsappProductMessage";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RiWhatsappLine } from "react-icons/ri";

/**
 * "Consultar por WhatsApp" junto a los botones de compra de la ficha: abre el
 * chat de la tienda (Ajustes → WhatsApp) con el nombre del producto, la
 * variante elegida y el enlace de la ficha, para que el vendedor sepa de qué
 * producto le preguntan. Solo se muestra si WhatsApp está activo en el admin.
 */
const WhatsAppInquiryButton = ({ productState }) => {
  const { t } = useTranslation("common");
  const { settingData } = useContext(SettingContext);
  // El origen se lee en el cliente: en el servidor no hay window.
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = buildWhatsAppLink(settingData?.whatsapp);
  const product = productState?.product;
  if (!link.enabled || !product?.slug) return null;

  const message = buildProductInquiryMessage({
    greeting: link.message || t("WhatsAppProductGreeting"),
    product,
    variation: productState?.selectedVariation || null,
    url: productUrl(origin, product.slug),
  });

  return (
    <a className="btn btn-md whatsapp-inquiry-btn" href={whatsappHref(link.number, message)} target="_blank" rel="noopener noreferrer">
      <RiWhatsappLine /> {t("AskOnWhatsApp")}
    </a>
  );
};

export default WhatsAppInquiryButton;
