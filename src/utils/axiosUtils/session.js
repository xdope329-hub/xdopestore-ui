/**
 * Lógica de sesión PURA (sin React, sin DOM): se puede testear en
 * aislamiento con `node --test` (ver session.test.mjs). axiosUtils/index.jsx
 * la conecta con js-cookie y el localStorage del navegador.
 */

// Cookies usadas en toda la tienda. Constantes para que una migración
// futura (p. ej. cookies httpOnly emitidas por el API) toque un solo lugar.
export const ACCESS_COOKIE = "uat";
export const REFRESH_COOKIE = "urt";

// Cookies auxiliares que dejan los flujos de login y que deben desaparecer
// al cerrar sesión (perfil cacheado, correo del OTP, etc.).
export const SESSION_SIDE_COOKIES = ["account", "ue", "up", "uc", "uo", "CallBackUrl", "currentPath", "wishListID", "CookieAccept"];
// Claves de localStorage que solo tienen sentido con una sesión activa.
export const SESSION_STORAGE_KEYS = ["account", "cart"];

/** Endpoints que devuelven 401 a propósito: nunca se reintentan con refresh. */
export const isAuthEndpoint = (url) => /\/(login|register|refresh|logout)(\?|$)/.test(url || "");

/**
 * Decide si un 401 debe intentar la renovación silenciosa de la sesión.
 *
 * Regla "invitado es invitado": solo se renueva cuando la petición SALIÓ
 * autenticada (había token de acceso al enviarla). Si no se envió token, el
 * 401 significa "endpoint protegido visitado por un invitado" — no una
 * sesión vencida — y renovar aquí resucitaría en silencio la cuenta de
 * quien usó el navegador antes (p. ej. en mitad de un checkout de invitado).
 */
export const shouldAttemptRefresh = ({ status, url, sentToken, refreshToken }) =>
  status === 401 && !isAuthEndpoint(url) && Boolean(sentToken) && Boolean(refreshToken);

/**
 * Crea las operaciones de sesión sobre un "jar" de cookies con la interfaz
 * de js-cookie (`get`, `set`, `remove`) y un `getStorage()` que devuelve un
 * objeto tipo localStorage (o null fuera del navegador).
 */
export const createSessionStore = (cookies, getStorage = () => null, { secure = false } = {}) => {
  const safe = (fn, fallback) => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  };

  // SameSite=Lax evita que otros sitios envíen los tokens; Secure (solo en
  // https) evita que viajen en claro. Las cookies siguen siendo legibles por
  // JS: la protección real contra XSS sería que el API las emitiera httpOnly.
  const cookieOptions = (expires) => ({ path: "/", expires, sameSite: "lax", ...(secure ? { secure: true } : {}) });

  // Cookies auxiliares de corta vida (correo del OTP, teléfono, ruta de
  // retorno tras el login...). Mismos flags que las de sesión; `minutes`
  // acota cuánto viven (js-cookie acepta fracciones de día en `expires`).
  const sideCookieOptions = (minutes = 15) => cookieOptions(minutes / (24 * 60));

  // La tienda solo necesita un resumen mínimo y no sensible de quién está
  // logueado (saludo del header / atajo al panel). Antes se copiaba TODA la
  // respuesta del login (perfil, teléfono, permisos del rol y, en algunos
  // flujos, los propios tokens) a una cookie legible y a localStorage.
  const toAccountSummary = (user) => {
    if (!user || typeof user !== "object") return null;
    const id = user.id ?? user._id;
    return {
      id: id != null ? String(id) : null,
      name: typeof user.name === "string" ? user.name : "",
      role: { name: user.role?.name || "consumer" },
    };
  };
  const saveAccountSummary = (user) => {
    const summary = toAccountSummary(user);
    if (!summary) return null;
    const json = JSON.stringify(summary);
    safe(() => cookies.set("account", json, cookieOptions(7)));
    const storage = safe(getStorage, null);
    if (storage) safe(() => storage.setItem("account", json));
    return summary;
  };
  const getAccountSummary = () =>
    safe(() => {
      const raw = cookies.get("account");
      return raw ? JSON.parse(raw) : null;
    }, null);

  const getAccessToken = () => safe(() => cookies.get(ACCESS_COOKIE) || "", "");
  const getRefreshToken = () => safe(() => cookies.get(REFRESH_COOKIE) || "", "");

  // Guarda el par de tokens que devuelve /login, /register o /refresh.
  // Acepta `access_token` o `token` (compatibilidad con el cliente antiguo).
  const saveSession = ({ access_token, token, refresh_token } = {}) => {
    const at = access_token || token;
    if (at) cookies.set(ACCESS_COOKIE, at, cookieOptions(7));
    if (refresh_token) cookies.set(REFRESH_COOKIE, refresh_token, cookieOptions(30));
  };

  // Borra TODO rastro local de la sesión: ambos tokens, cookies auxiliares
  // y el estado de localStorage ligado a la cuenta. Es la única forma
  // correcta de "cerrar sesión" en el cliente: dejar el token de renovación
  // vivo permite que un 401 posterior vuelva a iniciar sesión solo.
  const clearSession = () => {
    safe(() => cookies.remove(ACCESS_COOKIE, { path: "/" }));
    safe(() => cookies.remove(REFRESH_COOKIE, { path: "/" }));
    SESSION_SIDE_COOKIES.forEach((name) => {
      safe(() => cookies.remove(name, { path: "/" }));
      safe(() => cookies.remove(name));
    });
    const storage = safe(getStorage, null);
    if (storage) SESSION_STORAGE_KEYS.forEach((key) => safe(() => storage.removeItem(key)));
  };

  // Al abrir la tienda sin token de acceso el visitante es un invitado: se
  // descarta un token de renovación huérfano para que nunca resucite una
  // sesión a mitad de visita. Devuelve true si había algo que limpiar.
  const dropStaleRefreshToken = () => {
    if (!getAccessToken() && getRefreshToken()) {
      safe(() => cookies.remove(REFRESH_COOKIE, { path: "/" }));
      return true;
    }
    return false;
  };

  return { getAccessToken, getRefreshToken, saveSession, clearSession, dropStaleRefreshToken, sideCookieOptions, saveAccountSummary, getAccountSummary, toAccountSummary };
};
