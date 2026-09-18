"use client";
import CartContext from "@/context/cartContext";
import ThemeOptionContext from "@/context/themeOptionsContext";
import { saveAccountSummary, saveSession } from "@/utils/axiosUtils";
import { safeRedirectPath } from "@/utils/security/safeRedirect";
import syncLocalCart from "@/utils/customFunctions/SyncLocalCart";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useContext, useEffect, useRef } from "react";

const API_URL = process.env.API_PROD_URL || "http://localhost:5000";
// NEXT_PUBLIC_ vars are inlined into the client bundle at build time.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

/**
 * "Sign in with Google" button (Google Identity Services).
 * Renders nothing until NEXT_PUBLIC_GOOGLE_CLIENT_ID is configured, so the
 * app works unchanged before the OAuth client is created.
 *
 * When reCAPTCHA is configured, the captcha must be completed BEFORE Google
 * sign-in: pass the form's captcha token via `recaptchaToken`. Until it is
 * present, an invisible blocker sits over the button and clicking it surfaces
 * "complete the captcha first". The token is sent to the API, which verifies
 * it server-side (same middleware as the password login).
 *
 * On success it performs the same session bootstrap as the password login:
 * saveSession -> account cookie -> guest-cart sync -> close modal / redirect.
 */
const GoogleLoginButton = ({ onError }) => {
  const { setOpenAuthModal } = useContext(ThemeOptionContext) || {};
  const { refetch: cartRefetch } = useContext(CartContext) || {};
  const router = useRouter();
  const btnRef = useRef(null);
  const initialized = useRef(false);

  const handleCredential = async (response) => {
    try {
      const res = await fetch(`${API_URL}/login/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ credential: response?.credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError && onError(data?.message || "GoogleLoginFailed");
        return;
      }

      saveSession(data || {});
      saveAccountSummary(data?.data);

      // Merge any guest cart into the authenticated cart before navigating.
      await syncLocalCart();
      cartRefetch && cartRefetch();

      setOpenAuthModal && setOpenAuthModal(false);
      const callbackUrl = Cookies.get("CallBackUrl");
      if (callbackUrl) {
        Cookies.remove("CallBackUrl", { path: "/" });
        router.push(safeRedirectPath(callbackUrl, "/"));
      } else {
        router.refresh();
      }
    } catch (err) {
      console.error("Google login error:", err);
      onError && onError("GoogleLoginFailed");
    }
  };

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const tryInit = () => {
      if (initialized.current) return true;
      const gsi = typeof window !== "undefined" && window.google?.accounts?.id;
      if (!gsi || !btnRef.current) return false;
      gsi.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredential });
      gsi.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: Math.min(btnRef.current.offsetWidth || 320, 400),
      });
      initialized.current = true;
      return true;
    };

    // The GSI script loads async — poll briefly until it is available.
    if (tryInit()) return;
    const timer = setInterval(() => {
      if (tryInit()) clearInterval(timer);
    }, 300);
    return () => clearInterval(timer);
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      <div className="google-login-btn mt-3 d-flex justify-content-center" ref={btnRef} data-testid="google-login" />
    </>
  );
};

export default GoogleLoginButton;
