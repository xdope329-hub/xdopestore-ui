import AccountContext from "@/context/accountContext";
import CartContext from "@/context/cartContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import WishlistContext from "@/context/wishlistContext";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import request, { saveSession } from "../axiosUtils";
import { SyncCart, VerifyTokenAPI } from "../axiosUtils/API";
import useCreate from "./useCreate";

const LoginWithMobileHandle = (responseData, router, refetch, CallBackUrl, mutate, cartRefetch, setShowBoxMessage, addToWishlist, setOpenAuthModal, setState) => {
  setState("login");
  if (responseData.status === 200 || responseData.status === 201) {
    // Mismo guardado de sesión que el login por contraseña (access + refresh).
    saveSession(responseData.data || {});
    if (typeof window !== "undefined") {
      Cookies.set("account", JSON.stringify(responseData.data));
      localStorage.setItem("account", JSON.stringify(responseData.data));
    }

    const oldCartValue = JSON.parse(localStorage.getItem("cart"))?.items;
    oldCartValue?.length > 0 && mutate(transformLocalStorageData(oldCartValue));
    refetch();
    setOpenAuthModal(false);
    cartRefetch();
    router.push("/account/dashboard");
    const wishListID = Cookies.get("wishListID");
    const productObj = { id: wishListID };
    wishListID ? addToWishlist(productObj) : null;
    router.push(`/${CallBackUrl}`);
    Cookies.remove("wishListID");
    localStorage.removeItem("cart");
  } else {
    setShowBoxMessage(responseData.response.data.message);
  }
};

const useOtpVerification = (setState) => {
  setTimeout(() => {
    setState("login");
  }, 2000);

  const { setOpenAuthModal } = useContext(ThemeOptionContext);
  const { mutate } = useCreate(SyncCart, false, false, "No");
  const { addToWishlist } = useContext(WishlistContext);
  const CallBackUrl = Cookies.get("CallBackUrl") ? Cookies.get("CallBackUrl") : Cookies.set("CallBackUrl", "/");
  const { refetch } = useContext(AccountContext);
  const { refetch: cartRefetch } = useContext(CartContext);
  const router = useRouter();
  return useMutation({ mutationFn: (data) => request({ url: VerifyTokenAPI, method: "post", data }, router), onSuccess: (responseData, requestData) => LoginWithMobileHandle(responseData, router, refetch, CallBackUrl, mutate, cartRefetch, setShowBoxMessage, addToWishlist, setOpenAuthModal, setState) });
};
export default useOtpVerification;
