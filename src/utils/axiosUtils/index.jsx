import Cookies from "js-cookie";

const getBaseURL = () => process.env.API_PROD_URL || "http://localhost:5000";

// Cookie keys used throughout the storefront. Kept as constants so any future
// migration (e.g. to httpOnly cookies set by the API) only needs to change
// one place.
const ACCESS_COOKIE = "uat";
const REFRESH_COOKIE = "urt";

const getAccessToken = () => {
  if (typeof document === "undefined") return "";
  try { return Cookies.get(ACCESS_COOKIE) || ""; } catch { return ""; }
};
const getRefreshToken = () => {
  if (typeof document === "undefined") return "";
  try { return Cookies.get(REFRESH_COOKIE) || ""; } catch { return ""; }
};

// Persist a fresh token pair from either /login, /register, or /refresh.
// Callers only need to hand us whatever the API returned - we normalise the
// key names. `access_token` OR `token` both work.
export function saveSession({ access_token, token, refresh_token }) {
  const at = access_token || token;
  if (at) Cookies.set(ACCESS_COOKIE, at, { path: "/", expires: 7 });
  if (refresh_token) Cookies.set(REFRESH_COOKIE, refresh_token, { path: "/", expires: 30 });
}

export function clearSession() {
  Cookies.remove(ACCESS_COOKIE, { path: "/" });
  Cookies.remove(REFRESH_COOKIE, { path: "/" });
  if (typeof window !== "undefined") {
    try { localStorage.removeItem("account"); } catch {}
    try { localStorage.removeItem("cart"); } catch {}
  }
}

// Shared in-flight refresh promise. If ten requests all get 401 at the same
// time we still only make ONE /refresh call, not ten.
// "Invitado es invitado": si al ABRIR la tienda no hay token de acceso, la
// sesión está vencida y el visitante es un invitado — se descarta el token
// de renovación para que ningún 401 posterior resucite la sesión a mitad de
// visita (p. ej. durante el checkout de invitado). La renovación silenciosa
// solo mantiene viva una sesión ACTIVA (con token de acceso presente al
// cargar); nunca crea una desde cero.
export function dropStaleRefreshToken() {
  try {
    if (!Cookies.get(ACCESS_COOKIE) && Cookies.get(REFRESH_COOKIE)) {
      Cookies.remove(REFRESH_COOKIE, { path: "/" });
      return true;
    }
  } catch { /* cookies inaccesibles (SSR) — no hay nada que limpiar */ }
  return false;
}

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

    let first = await performFetch(fullUrl, buildOpts(getAccessToken()));

    // Transparently refresh on 401 exactly once. Skip the retry for endpoints
    // that intentionally return 401 (login, refresh) so we don't loop.
    const isAuthEndpoint = /\/(login|register|refresh|logout)(\?|$)/.test(url || "");
    if (first.status === 401 && !isAuthEndpoint && getRefreshToken()) {
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

export default request;
