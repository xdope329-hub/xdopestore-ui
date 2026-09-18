import Link from "next/link";
import { useTranslation } from "react-i18next";
import { RiWhatsappLine } from "react-icons/ri";
import useCapacityWhatsApp from "./useCapacityWhatsApp";

/**
 * Icono de WhatsApp que ocupa el lugar del carrito (cabecera, menú móvil y
 * botón de las tarjetas de producto) mientras no hay cupo. Sin número de
 * WhatsApp configurado lleva a /cart, donde se explica la situación.
 *  - label: texto "WhatsApp" bajo el icono (menú móvil);
 *  - text: texto propio junto al icono (botón de tarjeta).
 */
const WhatsAppCapacityLink = ({ label = false, text, className = "", style }) => {
  const { t } = useTranslation("common");
  const { href, enabled } = useCapacityWhatsApp();
  const title = t("CapacityOrderByWhatsApp");
  const content = (
    <>
      <RiWhatsappLine />
      {text ? <span> {text}</span> : label ? <span>{t("WhatsApp")}</span> : null}
    </>
  );
  if (!enabled) {
    return (
      <Link href="/cart" className={`capacity-whatsapp-link ${className}`} style={style} title={title} aria-label={title}>
        {content}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`capacity-whatsapp-link ${className}`} style={style} title={title} aria-label={title}>
      {content}
    </a>
  );
};

export default WhatsAppCapacityLink;
