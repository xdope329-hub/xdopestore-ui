import AccountContext from "@/context/accountContext";
import CartContext from "@/context/cartContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import WishlistContext from "@/context/wishlistContext";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useContext } from "react";
import request, { saveAccountSummary, saveSession } from "../axiosUtils";
import { safeRedirectPath } from "../security/safeRedirect";
import { LoginAPI } from "../axiosUtils/API";
import syncLocalCart from "../customFunctions/SyncLocalCart";
import { YupObject, emailSchema, passwordSchema, recaptchaSchema } from "../validation/ValidationSchema";

// Captcha is only enforced when the site key is configured at build time.
export const LogInSchema = YupObject({
  email: emailSchema,
  password: passwordSchema,
  ...(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? { recaptcha: recaptchaSchema } : {}),
});

const LoginHandle = async (responseData, router, refetch, CallBackUrl, cartRefetch, setShowBoxMessage, addToWishlist, setOpenAuthModal) => {
  if (responseData.status === 200 || responseData.status === 201) {
    // Save the whole session (access + refresh) in one place. saveSession
    // normalises the key names the API returns and drops both cookies.
    saveSession(responseData.data || {});
    // Only a small, non-sensitive summary is kept client-side. The previous
    // code copied the whole login body - tokens included - into a readable
    // cookie and localStorage.
    saveAccountSummary(responseData.data?.data);

    // Push any guest cart items to the user's server-side cart BEFORE we
    // refetch / navigate, so the merged cart shows up correctly.
    await syncLocalCart();

    refetch();
    setOpenAuthModal && setOpenAuthModal(false);
    cartRefetch && cartRefetch();
    const wishListID = Cookies.get("wishListID");
    wishListID ? addToWishlist({ id: wishListID }) : null;
    Cookies.remove("wishListID");
    Cookies.remove("CallBackUrl", { path: "/" });
    router.push(CallBackUrl);
  } else {
    const msg = responseData?.response?.data?.message || "InvalidCredentials";
    setShowBoxMessage && setShowBoxMessage(msg);
  }
};

const useHandleLogin = (setShowBoxMessage) => {
  const { setOpenAuthModal } = useContext(ThemeOptionContext);
  const { addToWishlist } = useContext(WishlistContext);
  // Cookie values are untrusted: only same-origin paths are followed.
  const CallBackUrl = safeRedirectPath(Cookies.get("CallBackUrl"), "/account/dashboard");
  const { refetch } = useContext(AccountContext);
  const { refetch: cartRefetch } = useContext(CartContext);
  const router = useRouter();
  return useMutation({
    mutationFn: (data) => request({ url: LoginAPI, method: "post", data }),
    onSuccess: (responseData) => LoginHandle(responseData, router, refetch, CallBackUrl, cartRefetch, setShowBoxMessage, addToWishlist, setOpenAuthModal),
  });
};

export default useHandleLogin;
