import Cookies from "js-cookie";
import { ACCESS_COOKIE, REFRESH_COOKIE, createSessionStore, isAuthEndpoint, shouldAttemptRefresh } from "./session";

const getBaseURL = () => process.env.API_PROD_URL || "http://localhost:5000";

// Toda la lógica de sesión vive en session.js (pura y testeable); aquí solo
// se conecta con js-cookie y el localStorage del navegador.
const session = createSessionStore(Cookies, () => (typeof window !== "undefined" ? window.localStorage : null));

export const getAccessToken = session.getAccessToken;
export const getRefreshToken = session.getRefreshToken;
export const saveSession = session.saveSession;
export const clearSession = session.clearSession;
export const dropStaleRefreshToken = session.dropStaleRefreshToken;
export { ACCESS_COOKIE, REFRESH_COOKIE, isAuthEndpoint, shouldAttemptRefresh };

// Shared in-flight refresh promise. If ten requests all get 401 at the same
// time we still only make ONE /refresh call, not ten.
let refreshInFlight = null;

async function doRefresh() {
  if (refreshInFlight) return refreshInFlight;
  const rt = getRefreshToken();
  if (!rt) return Promise.resolve(null);
  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${getBaseURL()}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) {
        clearSession();
        return null;
      }
      const body = await res.json();
      saveSession(body);
      return body.access_token || body.token || null;
    } catch {
      clearSession();
      return null;
    } finally {
      // Release the lock right after the promise settles.
      setTimeout(() => { refreshInFlight = null; }, 0);
    }
  })();
  return refreshInFlight;
}

async function performFetch(url, opts) {
  const res = await fetch(url, opts);
  const contentType = res.headers.get("content-type") || "";
  const responseData = contentType.includes("application/json")
    ? await res.json()
    : await res.text();
  return { data: responseData, status: res.status, ok: res.ok };
}

const request = async ({ url, method = "get", data, params, responseType, headers: extraHeaders } = {}) => {
  try {
    const base = getBaseURL();
    let fullUrl = url?.startsWith("http") ? url : `${base}${url}`;

    if (params && Object.keys(params).length > 0) {
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
      ).toString();
      if (qs) fullUrl += (fullUrl.includes("?") ? "&" : "?") + qs;
    }

    const buildOpts = (token) => {
      const opts = {
        method: method.toUpperCase(),
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...extraHeaders,
        },
      };
      if (data) {
        if (data instanceof FormData) opts.body = data;
        else {
          opts.headers["Content-Type"] = "application/json";
          opts.body = JSON.stringify(data);
        }
      }
      return opts;
    };

    const sentToken = getAccessToken();
    let first = await performFetch(fullUrl, buildOpts(sentToken));

    // Renovación transparente en 401, una sola vez, y SOLO si la petición
    // salió autenticada: un invitado que toca un endpoint protegido recibe
    // su 401 tal cual (ver shouldAttemptRefresh en session.js).
    if (shouldAttemptRefresh({ status: first.status, url, sentToken, refreshToken: getRefreshToken() })) {
      const newAccess = await doRefresh();
      if (newAccess) {
        first = await performFetch(fullUrl, buildOpts(newAccess));
      }
    }
    return first;
  } catch (error) {
    return { data: null, status: 0, ok: false, error };
  }
};

/**
 * Cierre de sesión ÚNICO para toda la tienda (header, página de cuenta…):
 * revoca el token de renovación en el servidor (sin bloquear la UI) y borra
 * todo rastro local — ambos tokens incluidos. Un logout que solo quite la
 * cookie de acceso deja viva la renovación silenciosa y el siguiente 401
 * vuelve a iniciar sesión con la cuenta anterior.
 */
export const logout = () => {
  const refresh = getRefreshToken();
  if (refresh) {
    request({ url: "/logout", method: "post", data: { refresh_token: refresh } }).catch(() => {});
  }
  clearSession();
};

export default request;
