import request from "@/utils/axiosUtils";
import { SyncCart } from "@/utils/axiosUtils/API";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import i18next from "i18next";

// Reads the guest cart kept in localStorage by CartProvider
// (stored as { items: [...], total: n }) and returns the items array.
export const getLocalCartItems = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem("cart"));
    return Array.isArray(raw?.items) ? raw.items : [];
  } catch {
    return [];
  }
};

// Maps a localStorage cart item to the minimal payload the
// /sync/cart backend endpoint expects.
export const transformLocalCart = (items) =>
  (items || []).map((item) => ({
    product_id: item?.product_id ?? item?.product?.id,
    variation_id: item?.variation_id || "",
    quantity: item?.quantity ?? 1,
  }));

// Pushes any pending guest cart items up to the authenticated user's
// server-side cart. Safe to call when there is nothing to sync — it
// will simply no-op. Returns `{ ok, synced, error }`.
const syncLocalCart = async () => {
  const items = getLocalCartItems();
  if (!items.length) return { ok: true, synced: 0 };

  const payload = transformLocalCart(items).filter((p) => p.product_id);
  if (!payload.length) return { ok: true, synced: 0 };

  try {
    const res = await request({
      url: SyncCart,
      method: "post",
      // The backend reads `req.body.cart` (see xdopestore-api/src/routes/cart.sync.routes.js).
      // We also include `items` for forward-compat / older API builds.
      data: { cart: payload, items: payload },
    });
    if (res?.ok) {
      localStorage.removeItem("cart");
      // Líneas que el servidor no aceptó (producto con talla/color sin
      // elegir, cantidad inválida): se avisa para volver a agregarlas desde
      // la ficha. Antes entraban al carrito y el checkout las rechazaba.
      const skipped = Array.isArray(res?.data?.skipped) ? res.data.skipped : [];
      if (skipped.length) {
        ToastNotification("error", `${i18next.t("CartLinesSkipped")}: ${skipped.map((s) => `${s.name} (${s.message})`).join(", ")}`);
      }
      return { ok: true, synced: payload.length - skipped.length, skipped };
    }
    return { ok: false, synced: 0, error: res?.error || res?.data };
  } catch (error) {
    return { ok: false, synced: 0, error };
  }
};

export default syncLocalCart;
