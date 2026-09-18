import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { LogoutAPI } from "../axiosUtils/API";

const BASE_URL = () => process.env.API_PROD_URL || "http://localhost:5000";

/**
 * Calls POST /logout on the API (which clears the httpOnly refresh token cookie
 * server-side), then removes client-side cookies and redirects to home.
 */
export async function performLogout() {
  try {
    // Fire-and-forget: tell the server to invalidate the refresh token.
    // We use fetch with credentials so the httpOnly cookie is sent.
    await fetch(`${BASE_URL()}${LogoutAPI}`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Network error — still clear client state
  }

  Cookies.remove("uat",          { path: "/" });
  Cookies.remove("account",      { path: "/" });
  Cookies.remove("ue",           { path: "/" });
  Cookies.remove("CookieAccept", { path: "/" });
}

/**
 * React hook that returns a logout handler.
 * Usage: const logout = useLogout();  then  <button onClick={logout}>
 */
const useLogout = (onDone) => {
  const router = useRouter();

  return async (e) => {
    e?.preventDefault?.();
    await performLogout();
    if (onDone) onDone();
    router.push("/");
    router.refresh();
  };
};

export default useLogout;
