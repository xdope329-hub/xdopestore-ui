import request from "@/utils/axiosUtils";
import { useAnalytics } from "@/components/analytics/GoogleAnalytics";
import { useMetaPixel } from "@/components/analytics/MetaPixel";
import { AddToCartAPI, ClearCart, ReplaceCartAPI } from "@/utils/axiosUtils/API";
import syncLocalCart from "@/utils/customFunctions/SyncLocalCart";
import { getCartProductId, getCartVariationId, isSameCartLine } from "@/utils/customFunctions/CartItemIdentity";
import { ToastNotification } from "@/utils/customFunctions/ToastNotification";
import useCreate from "@/utils/hooks/useCreate";
import i18next from "i18next";
import useDelete from "@/utils/hooks/useDelete";
import useFetchQuery from "@/utils/hooks/useFetchQuery";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import React, { useContext, useEffect, useMemo, useState } from "react";
import SettingContext from "@/context/settingContext";
import CartContext from ".";

const CartProvider = (props) => {
  const analytics = useAnalytics();
  const metaPixel = useMetaPixel();
  const isCookie = Cookies.get("uat");
  // Cupo diario (Ajustes → Capacidad): con el cupo lleno no se agrega nada.
  const { capacityReached } = useContext(SettingContext) || {};
  const [cartProducts, setCartProducts] = useState([]);
  const [variationModal, setVariationModal] = useState("");
  const [cartTotal, setCartTotal] = useState(0);
  const [cartToggle, setCartToggle] = useState(false);
  const [getCardData, setGetCardData] = useState([]);

  // Getting data from Cart API
  const { data: CartAPIData, isLoading: getCartLoading, refetch } = useFetchQuery([AddToCartAPI], () => request({ url: AddToCartAPI }), { enabled: false, refetchOnWindowFocus: false, select: (res) => res?.data });

  // Adding data to Cart API
  const {
    data: addData,
    mutate,
    isLoading,
  } = useCreate(AddToCartAPI, false, false, "No", (resDta, variables) => {
    if (resDta?.status == 200 || resDta?.status == 201) {
      // The server returns the full, authoritative cart on every write — adopt it
      // wholesale so optimistic local items pick up their real cart-item IDs and
      // drift between client / server is impossible.
      if (Array.isArray(resDta?.data?.items)) {
        setCartProducts(resDta.data.items);
        setCartTotal(resDta.data.total ?? 0);
        setGetCardData(resDta.data.items[0]);
        const line = resDta.data.items.find((item) => isSameCartLine(item, variables.product_id, variables.variation_id));
        if (line && variables.quantity) {
          const eventLine = { ...line, quantity: Math.abs(variables.quantity) };
          analytics?.ecommerce(variables.quantity > 0 ? "add_to_cart" : "remove_from_cart", [eventLine]);
          if (variables.quantity > 0) metaPixel?.trackLines("AddToCart", [eventLine]);
        }
      }
    }
  });
  // Delete Cart API Data
  const { mutateAsync: deleteCart, isLoading: deleteCartLoader } = useDelete(AddToCartAPI, false, true);

  // Replace Cart API
  const { mutate: replaceCartMutate, isLoading: replaceCartLoader } = useCreate(ReplaceCartAPI, false, false, "No");

  //Clear Cart API
  const { mutateAsync: clearCartData, isPending: clearCartLoader } = useMutation({
    mutationFn: () => request({ url: ClearCart, method: "delete" }),
    onSuccess: (responseData) => {
      if (responseData?.ok) {
        ToastNotification("success", responseData.data.message);
      }
    },
  });

  // Refetching Cart API. For authenticated users we first push any pending
  // guest / orphaned localStorage cart items into the server, then refetch —
  // that way carts that pre-date the persistent /cart wiring also recover.
  useEffect(() => {
    if (!isCookie) return;
    let cancelled = false;
    (async () => {
      try { await syncLocalCart(); } catch {}
      if (!cancelled) refetch();
    })();
    return () => { cancelled = true; };
  }, [isCookie]);

  // Setting CartAPI data to state and LocalStorage
  useEffect(() => {
    if (isCookie) {
      if (CartAPIData) {
        setCartProducts(CartAPIData?.items ?? []);
        setCartTotal(CartAPIData?.total ?? 0);
      }
    } else {
      const isCartAvailable = JSON.parse(localStorage.getItem("cart"));
      if (isCartAvailable?.items?.length > 0) {
        setCartProducts(isCartAvailable?.items ?? []);
        setCartTotal(isCartAvailable?.total ?? 0);
      }
    }
  }, [getCartLoading]);

  // Adding data in localstorage when not Login. For authenticated users the
  // server cart (/cart) is the source of truth, so don't mirror state into
  // localStorage — otherwise the initial mount (cartProducts=[]) would wipe a
  // pending guest cart before the recovery sync has a chance to push it up.

  // Getting total
  const total = useMemo(() => {
    return cartProducts?.reduce((prev, curr) => {
      return prev + Number(curr.sub_total);
    }, 0);
  }, [getCartLoading, cartProducts, deleteCartLoader]);

  useEffect(() => {
    if (!isCookie) {
      storeInLocalStorage();
    } else {
      // Logged-in: cartTotal must track local cart mutations too (qty +/-,
      // removals). Server responses still overwrite it with authoritative
      // values when they arrive; this keeps the UI consistent in between.
      setCartTotal(total);
    }
  }, [cartProducts, total]);

  // Total Function for child components
  const getTotal = (value) => {
    return value?.reduce((prev, curr) => {
      return prev + Number(curr.sub_total);
    }, 0);
  };

  const clearCart = async () => {
    if (!isCookie) {
      analytics?.ecommerce("remove_from_cart", cartProducts);
      setCartProducts([]);
      setCartTotal(0);
      localStorage.removeItem("cart");
      return true;
    }

    if (clearCartLoader) return false;

    const responseData = await clearCartData();
    if (!responseData?.ok) {
      ToastNotification("error", responseData?.data?.message);
      return false;
    }

    analytics?.ecommerce("remove_from_cart", cartProducts);
    setCartProducts(responseData?.data?.items ?? []);
    setCartTotal(responseData?.data?.total ?? 0);
    setGetCardData([]);
    return true;
  };

  // Remove and Delete cart data from API and State
  const removeCart = (id, cartId) => {
    const removed = cartProducts?.filter((item) => (item?.variation_id ? item.variation_id === id : item.product_id === id));
    const updatedCart = cartProducts?.filter((item) => (item?.variation_id ? item?.variation_id !== id : item.product_id !== id));
    setCartProducts(updatedCart);
    ToastNotification("success", i18next.t("RemovedFromCart"));
    // Mirror the deletion on the server so the user's cart in the DB matches.
    if (isCookie && cartId) {
      // Each promise belongs to its own removal, even during rapid clicks.
      deleteCart(cartId).then((response) => {
        if (response?.ok) analytics?.ecommerce("remove_from_cart", removed);
      }).catch(() => {});
    } else if (!isCookie) {
      analytics?.ecommerce("remove_from_cart", removed);
    }
  };

  const fetchReplaceCartData = async (obj) => {
    // Goes through the shared request layer: bearer token, silent refresh on
    // 401 and JSON handling live in one place instead of a raw fetch here.
    const res = await request({ url: ReplaceCartAPI, method: "put", data: obj });
    return res?.ok ? res?.data?.items : undefined;
  };
  const handleIncDec = async (qty, productObj, isProductQty, setIsProductQty, isOpenFun, cloneVariation) => {
    const updatedQty = (isProductQty ? isProductQty : 0) + qty;
    const cart = [...cartProducts];
    const productId = getCartProductId(productObj);
    const variationId = getCartVariationId(cloneVariation);
    // Sin producto (ficha sin cargar o no encontrada) no hay nada que agregar.
    if (!productId) return;
    // Sin cupo hoy la tienda ya cambia los botones por WhatsApp; esto cubre
    // cualquier otro camino (lista de deseos, paquetes, modal de variantes).
    if (qty > 0 && capacityReached) {
      ToastNotification("error", i18next.t("CapacityReachedToast"));
      return false;
    }
    const index = cart.findIndex((item) => isSameCartLine(item, productId, variationId));
    const obj = {
      product_id: productId,
      variation_id: variationId || null,
      quantity: qty,
    };

    if (index === -1) {
      const selectedVariation = cloneVariation?.selectedVariation || cloneVariation?.variation || null;
      const params = {
        id: null,
        product: productObj,
        product_id: productId,
        variation: selectedVariation,
        variation_id: variationId || null,
        quantity: updatedQty,
        sub_total: updatedQty * (selectedVariation?.sale_price ?? productObj?.sale_price),
      };
      isCookie ? !isLoading && setCartProducts((prev) => [...prev, params]) : setCartProducts((prev) => [...prev, params]);
      // A brand-new item just went into the cart — tell the user explicitly.
      ToastNotification("success", i18next.t("AddedToCart"));
    } else {
      // Checking the Stock QTY of particular product
      // Tope de stock: la cantidad de la VARIANTE elegida (aunque sea 0) y
      // la del producto solo si no hay variante; sin control (null) no limita.
      const productStockQty = cart[index]?.variation ? Number(cart[index]?.variation?.quantity) : Number(cart[index]?.product?.quantity);
      if (qty > 0 && Number.isFinite(productStockQty) && productStockQty < cart[index]?.quantity + qty) {
        ToastNotification("error", i18next.t("StockLimitMessage", { qty: productStockQty }));
        return false;
      }

      if (cart[index]?.variation) {
        cart[index].variation.selected_variation = cart[index]?.variation?.attribute_values?.map((values) => values.value).join("/");
      }
      const newQuantity = cart[index].quantity + qty;
      if (newQuantity < 1) {
        // Remove the item from the cart if the new quantity is less than 1
        return removeCart(variationId || productId, cart[index].id);
      } else {
        cart[index] = {
          ...cart[index],
          id: cart[index].id || null,
          quantity: newQuantity,
          sub_total: newQuantity * (cart[index]?.variation ? cart[index]?.variation?.sale_price : cart[index]?.product?.sale_price),
        };
        isCookie ? !isLoading && setCartProducts([...cart]) : setCartProducts([...cart]);
      }
    }

    // Persist the change to the server cart. Without this the user only ever
    // mutates local React state + localStorage — POST /checkout and
    // POST /payment/initialize would then 422 with "Cart is empty" because
    // the database has no items for this consumer.
    if (isCookie) {
      mutate({
        product_id: obj.product_id,
        variation_id: obj.variation_id,
        quantity: obj.quantity,
      });
    } else if (qty) {
      const eventLine = {
        product: productObj,
        variation: cloneVariation?.selectedVariation || cloneVariation?.variation || cart[index]?.variation || null,
        quantity: Math.abs(qty),
      };
      analytics?.ecommerce(qty > 0 ? "add_to_cart" : "remove_from_cart", [eventLine]);
      if (qty > 0) metaPixel?.trackLines("AddToCart", [eventLine]);
    }

    // Update the productQty state immediately after updating the cartProducts state
    if (isCookie) {
      setIsProductQty && !isLoading && setIsProductQty(updatedQty);
      isOpenFun && !isLoading && isOpenFun(true);
    } else {
      setIsProductQty && setIsProductQty(updatedQty);
      isOpenFun && isOpenFun(true);
    }
  };

  // Bundle: agrega un producto tipo bundle al carrito, incluyendo la
  // composición elegida por el cliente (variantes por item). El backend
  // valida que cada variante pertenezca al subset permitido en el admin.
  const addBundleToCart = (product, bundleSelections, qty = 1) => {
    const price = Number(product?.sale_price ?? product?.price) || 0;
    const params = {
      id: null,
      product,
      product_id: product?.id,
      variation: null,
      variation_id: null,
      bundle_selections: bundleSelections,
      quantity: qty,
      sub_total: qty * price,
    };
    setCartProducts((prev) => {
      // Misma composición (por producto + variante) = suma cantidad.
      const key = (list) => (list || []).map((s) => `${s.product_id}:${s.variation_id || ""}`).sort().join("|");
      const target = key(bundleSelections);
      const idx = prev.findIndex((it) => String(it.product_id) === String(product?.id) && key(it.bundle_selections) === target);
      if (idx >= 0) {
        const next = [...prev];
        const newQty = next[idx].quantity + qty;
        next[idx] = { ...next[idx], quantity: newQty, sub_total: newQty * price };
        return next;
      }
      return [...prev, params];
    });
    if (isCookie) {
      mutate({
        product_id: product?.id,
        variation_id: null,
        bundle_selections: bundleSelections,
        quantity: qty,
      });
    }
  };

  //Toggle open
  const cartToggleValue = (value) => {
    setCartToggle(value);
  };

  // Replace Cart
  const replaceCart = async (updatedQty, productObj, cloneVariation, selectedVariation) => {
    const cart = [...cartProducts];
    const productId = getCartProductId(productObj);
    const originalVariationId = getCartVariationId(selectedVariation);
    const nextVariationId = getCartVariationId(cloneVariation);
    const index = cart.findIndex((item) => isSameCartLine(item, productId, originalVariationId));

    if (index === -1) return false;

    const isAvailableInCart = cart.some((item, itemIndex) =>
      itemIndex !== index && isSameCartLine(item, productId, nextVariationId)
    );

    if (isAvailableInCart) {
      ToastNotification("error", i18next.t("AlreadyInCart"));
      return false;
    }

    const quantity = cloneVariation?.productQty ?? updatedQty;
    const nextVariation = cloneVariation?.selectedVariation || cloneVariation?.variation || null;
    const productQty = nextVariation?.quantity ?? productObj?.quantity;

    if (productQty < quantity) {
      ToastNotification("error", i18next.t("StockLimitMessage", { qty: productQty }));
      return false;
    }

    let newProduct;
    if (isCookie && !replaceCartLoader) {
      newProduct = await fetchReplaceCartData({
        _method: "PUT",
        id: cart[index]?.id,
        product: productObj,
        product_id: productId,
        variation: nextVariation,
        quantity,
        variation_id: nextVariationId || null,
      });
    }
    const serverCartItem = newProduct?.find((item) => isSameCartLine(item, productId, nextVariationId));

    const params = {
      id: serverCartItem?.id || cart[index].id || null,
      product: productObj,
      product_id: productId,
      variation: nextVariation,
      variation_id: nextVariationId || null,
      quantity,
      sub_total: quantity * (nextVariation?.sale_price ?? productObj?.sale_price),
    };

    if (!isCookie || !isLoading) {
      setCartProducts((prevCartProducts) =>
        prevCartProducts.map((item, itemIndex) => itemIndex === index ? params : item)
      );
    }
  };

  // Setting data to localstorage when UAT is not there
  const storeInLocalStorage = () => {
    setCartTotal(total);
    localStorage.setItem("cart", JSON.stringify({ items: cartProducts, total: total }));
  };

  return (
    <CartContext.Provider
      value={{
        ...props,
        cartProducts,
        setCartProducts,
        cartTotal,
        getCardData,
        setCartTotal,
        removeCart,
        clearCart,
        getTotal,
        handleIncDec,
        addBundleToCart,
        cartToggle,
        cartToggleValue,
        variationModal,
        refetch,
        setVariationModal,
        isLoading,
        getCartLoading,
        replaceCartLoader,
        clearCartLoader,
        deleteCartLoader,
        replaceCart,
      }}
    >
      {props.children}
    </CartContext.Provider>
  );
};

export default CartProvider;
