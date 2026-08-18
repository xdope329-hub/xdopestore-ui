import request from "@/utils/axiosUtils";
import { WishlistAPI } from "@/utils/axiosUtils/API";

export const LOCAL_WISHLIST_KEY = "wishlist";

export const getWishlistProductId = (item) =>
  String(item?._id ?? item?.product_id ?? item?.product?.id ?? item?.id ?? "");

export const getLocalWishlistItems = () => {
  if (typeof window === "undefined") return [];

  try {
    const items = JSON.parse(localStorage.getItem(LOCAL_WISHLIST_KEY));
    return Array.isArray(items) ? items.filter((item) => getWishlistProductId(item)) : [];
  } catch {
    return [];
  }
};

export const storeLocalWishlistItems = (items) => {
  if (typeof window === "undefined") return;

  const uniqueItems = [];
  const seenIds = new Set();
  (items || []).forEach((item) => {
    const productId = getWishlistProductId(item);
    if (productId && !seenIds.has(productId)) {
      seenIds.add(productId);
      uniqueItems.push(item);
    }
  });

  if (uniqueItems.length) {
    localStorage.setItem(LOCAL_WISHLIST_KEY, JSON.stringify(uniqueItems));
  } else {
    localStorage.removeItem(LOCAL_WISHLIST_KEY);
  }
};

let syncInFlight = null;

// Merges the browser-only guest wishlist into the authenticated wishlist.
// Local items are removed only after the server confirms them.
const syncLocalWishlist = async () => {
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    const localItems = getLocalWishlistItems();
    if (!localItems.length) return { ok: true, synced: 0 };

    const serverResponse = await request({ url: WishlistAPI });
    if (!serverResponse?.ok) {
      return { ok: false, synced: 0, error: serverResponse?.error || serverResponse?.data };
    }

    const serverItems = Array.isArray(serverResponse?.data?.data)
      ? serverResponse.data.data
      : Array.isArray(serverResponse?.data)
        ? serverResponse.data
        : [];
    const serverProductIds = new Set(serverItems.map(getWishlistProductId).filter(Boolean));
    const unsyncedItems = [];
    let synced = 0;

    for (const item of localItems) {
      const productId = getWishlistProductId(item);
      if (!productId || serverProductIds.has(productId)) {
        synced += productId ? 1 : 0;
        continue;
      }

      const response = await request({
        url: WishlistAPI,
        method: "post",
        data: { product_id: productId },
      });

      if (response?.ok || response?.status === 409) {
        serverProductIds.add(productId);
        synced += 1;
      } else {
        unsyncedItems.push(item);
      }
    }

    storeLocalWishlistItems(unsyncedItems);
    return {
      ok: unsyncedItems.length === 0,
      synced,
      error: unsyncedItems.length ? "Some wishlist items could not be synced" : undefined,
    };
  })();

  try {
    return await syncInFlight;
  } finally {
    syncInFlight = null;
  }
};

export default syncLocalWishlist;
