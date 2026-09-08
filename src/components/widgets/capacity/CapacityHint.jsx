import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import { capacityExcess } from "@/utils/customFunctions/capacityRules";
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { RiWhatsappLine } from "react-icons/ri";
import useCapacityWhatsApp from "./useCapacityWhatsApp";

/**
 * Aviso temprano: el carrito lleva más unidades de las que quedan en el cupo
 * de hoy (Ajustes → Capacidad). Antes el cliente llenaba todo el checkout y
 * solo al final el API respondía 422. Se muestra en el carrito (cajón y
 * página) y en el resumen del checkout; no bloquea nada, el API decide.
 */
const CapacityHint = ({ className = "" }) => {
  const { t } = useTranslation("common");
  const { capacity } = useContext(SettingContext) || {};
  const { cartProducts } = useContext(CartContext) || {};
  const { href, enabled } = useCapacityWhatsApp();
  const excess = capacityExcess(capacity, cartProducts);
  if (!excess) return null;
  return (
    <div className={`capacity-hint ${className}`} role="status">
      <p className="mb-1">{t("CapacityExcessText", { remaining: excess.remaining, units: excess.units })}</p>
      {enabled && (
        <a className="capacity-hint-link" href={href} target="_blank" rel="noopener noreferrer">
          <RiWhatsappLine /> {t("CapacityOrderRestByWhatsApp")}
        </a>
      )}
    </div>
  );
};

export default CapacityHint;
