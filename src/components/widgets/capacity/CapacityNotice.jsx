import { useTranslation } from "react-i18next";
import { RiCalendarCheckLine, RiWhatsappLine } from "react-icons/ri";
import useCapacityWhatsApp from "./useCapacityWhatsApp";

/**
 * "Hoy ya no tenemos cupo": sustituye al checkout, a los botones de compra y
 * al contenido del carrito cuando la capacidad diaria (Ajustes → Capacidad)
 * está llena. Solo ofrece WhatsApp para coordinar el pedido.
 *  - compact: título + botón (ficha de producto, cajón del carrito);
 *  - buttonOnly: solo el botón (barra fija de compra).
 */
const CapacityNotice = ({ compact = false, buttonOnly = false, className = "" }) => {
  const { t } = useTranslation("common");
  const { href, enabled } = useCapacityWhatsApp();
  const button = enabled ? (
    <a className="btn capacity-notice-btn" href={href} target="_blank" rel="noopener noreferrer">
      <RiWhatsappLine /> {t("CapacityOrderByWhatsApp")}
    </a>
  ) : (
    <p className="capacity-notice-text mb-0">{t("CapacityNoWhatsApp")}</p>
  );
  if (buttonOnly) return <div className={`capacity-notice capacity-notice-button ${className}`}>{button}</div>;
  return (
    <div className={`capacity-notice ${compact ? "capacity-notice-compact" : ""} ${className}`} role="status">
      <div className="capacity-notice-icon" aria-hidden="true">
        <RiCalendarCheckLine />
      </div>
      <div className="capacity-notice-body">
        <h5 className="capacity-notice-title">{t("CapacityReachedTitle")}</h5>
        {!compact && <p className="capacity-notice-text">{t("CapacityReachedText")}</p>}
        {button}
      </div>
    </div>
  );
};

export default CapacityNotice;
