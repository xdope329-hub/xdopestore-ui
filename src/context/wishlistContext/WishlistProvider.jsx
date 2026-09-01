import request from "@/utils/axiosUtils";
import { WishlistAPI } from "@/utils/axiosUtils/API";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import syncLocalWishlist, {
  getLocalWishlistItems,
  getWishlistProductId,
  LOCAL_WISHLIST_KEY,
  storeLocalWishlistItems,
} from "@/utils/customFunctions/SyncLocalWishlist";
import useCreate from "@/utils/hooks/useCreate";
import useDelete from "@/utils/hooks/useDelete";
import useFetchQuery from "@/utils/hooks/useFetchQuery";
import Cookies from "js-cookie";
import React, { useContext, useEffect, useState } from "react";
import WishlistContext from ".";
import ThemeOptionContext from "../themeOptionsContext";

const buildWishlistIdMap = (items, useProductIdAsValue = false) =>
  Object.fromEntries(
    (items || []).map((item) => {
      const productId = getWishlistProductId(item);
      return [productId, useProductIdAsValue ? productId : item.id];
    }).filter(([productId]) => productId)
  );

const WishlistProvider = (props) => {
  // Re-check the session as soon as modal login or registration completes.
  useContext(ThemeOptionContext);
  const isCookie = Cookies.get("uat");
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [wishlistReady, setWishlistReady] = useState(false);
  const [wishlistIds, setWishlistIds] = useState({});

  const { data: WishlistApiData, isLoading: WishlistAPILoading, refetch } = useFetchQuery([WishlistAPI], () => request({ url: WishlistAPI }), { enabled: false, refetchOnWindowFocus: false, select: (res) => res?.data });
  const { mutate, isLoading } = useCreate(WishlistAPI, false, false, "AddedToWishlist");
  const { mutate: deleteWishlist } = useDelete(WishlistAPI, false, true);

  useEffect(() => {
    let cancelled = false;

    const initializeWishlist = async () => {
      setWishlistReady(false);
      if (isCookie) {
        await syncLocalWishlist();
        if (!cancelled) await refetch();
      } else if (!cancelled) {
        const items = getLocalWishlistItems();
        setWishlistProducts(items);
        setWishlistIds(buildWishlistIdMap(items, true));
      }
      if (!cancelled) setWishlistReady(true);
    };

    initializeWishlist();
    return () => { cancelled = true; };
  }, [isCookie]);

  useEffect(() => {
    if (isCookie || typeof window === "undefined") return;

    const updateFromStorage = (event) => {
      if (event.key !== LOCAL_WISHLIST_KEY) return;
      const items = getLocalWishlistItems();
      setWishlistProducts(items);
      setWishlistIds(buildWishlistIdMap(items, true));
    };

    window.addEventListener("storage", updateFromStorage);
    return () => window.removeEventListener("storage", updateFromStorage);
  }, [isCookie]);

  useEffect(() => {
    if (isCookie && WishlistApiData) {
      const items = WishlistApiData.data || [];
      setWishlistProducts(items);
      setWishlistIds(buildWishlistIdMap(items));
      setWishlistReady(true);
    }
  }, [WishlistAPILoading, isCookie, WishlistApiData]);

  const addToWishlist = (productObj) => {
    const productId = getWishlistProductId(productObj);
    if (!productId || wishlistIds[productId]) return;

    if (Cookies.get("uat")) {
      setWishlistIds((prev) => ({ ...prev, [productId]: productId }));
      mutate({ product_id: productId }, {
        onSuccess: () => refetch(),
        onError: () => setWishlistIds((prev) => {
          const next = { ...prev };
          delete next[productId];
          return next;
        }),
      });
    } else {
      setWishlistProducts((prev) => {
        const next = [...prev, productObj];
        storeLocalWishlistItems(next);
        return next;
      });
      setWishlistIds((prev) => ({ ...prev, [productId]: productId }));
      ToastNotification("success", "GuestWishlistSaved");
    }
  };

  const removeWishlist = (id, wishId) => {
    const productId = String(id);

    if (Cookies.get("uat") && wishId) {
      const wishlistId = typeof wishId === "object" ? wishId.id : wishId;
      setWishlistProducts((prev) => prev.filter((item) => getWishlistProductId(item) !== productId));
      setWishlistIds((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      deleteWishlist(wishlistId, { onSuccess: () => refetch() });
      ToastNotification("success", "ProductDeletedFromWishlist");
    } else if (!Cookies.get("uat")) {
      setWishlistProducts((prev) => {
        const next = prev.filter((item) => getWishlistProductId(item) !== productId);
        storeLocalWishlistItems(next);
        return next;
      });
      setWishlistIds((prev) => {
        const next = { ...prev };
        delete next[productId];
        return next;
      });
      ToastNotification("success", "ProductDeletedFromWishlist");
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        ...props,
        wishlistProducts,
        WishlistAPILoading: WishlistAPILoading || !wishlistReady,
        setWishlistProducts,
        removeWishlist,
        refetch,
        isLoading,
        addToWishlist,
        wishlistIds,
      }}
    >
      {props.children}
    </WishlistContext.Provider>
  );
};

export default WishlistProvider;
