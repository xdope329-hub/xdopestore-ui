import CartContext from "@/context/cartContext";
import SettingContext from "@/context/settingContext";
import { buildCapacityWhatsAppMessage, isCapacityReached } from "@/utils/customFunctions/capacityRules";
import { buildWhatsAppLink, whatsappHref } from "@/utils/customFunctions/whatsappLink";
import { useContext } from "react";

/**
 * Cupo diario (GET /capacity, expuesto por SettingProvider) + enlace de
 * WhatsApp para coordinar el pedido cuando ya no hay cupo: el número del
 * admin (Ajustes → WhatsApp), el mensaje de Ajustes → Capacidad y los
 * productos que el cliente tenía en el carrito.
 */
export default function useCapacityWhatsApp() {
  const { settingData, capacity } = useContext(SettingContext) || {};
  const { cartProducts } = useContext(CartContext) || {};
  const reached = isCapacityReached(capacity);
  const link = buildWhatsAppLink(settingData?.whatsapp);
  const message = buildCapacityWhatsAppMessage({ capacity, cartItems: cartProducts });
  const href = link.number ? whatsappHref(link.number, message) : "";
  return { reached, capacity, href, enabled: Boolean(link.number), message };
}
