import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  createSessionStore,
  isAuthEndpoint,
  shouldAttemptRefresh,
} from "./session.js";

// Jar de cookies en memoria con la interfaz de js-cookie.
const makeJar = (initial = {}) => {
  const store = new Map(Object.entries(initial));
  return {
    store,
    get: (name) => store.get(name),
    set: (name, value) => store.set(name, value),
    remove: (name) => store.delete(name),
  };
};

const makeStorage = (initial = {}) => {
  const store = new Map(Object.entries(initial));
  return { store, removeItem: (key) => store.delete(key) };
};

test("isAuthEndpoint: solo login/register/refresh/logout", () => {
  assert.equal(isAuthEndpoint("/login"), true);
  assert.equal(isAuthEndpoint("/login?x=1"), true);
  assert.equal(isAuthEndpoint("/login/google"), false);
  assert.equal(isAuthEndpoint("/refresh"), true);
  assert.equal(isAuthEndpoint("/logout"), true);
  assert.equal(isAuthEndpoint("/coupon?status=1"), false);
  assert.equal(isAuthEndpoint(undefined), false);
});

test("un invitado (sin token enviado) NUNCA renueva sesión aunque quede un refresh viejo", () => {
  // Escenario del bug: se cerró sesión pero la cookie de renovación quedó
  // viva; el checkout de invitado pide /coupon (protegido) → 401.
  assert.equal(
    shouldAttemptRefresh({ status: 401, url: "/coupon", sentToken: "", refreshToken: "old-refresh" }),
    false
  );
});

test("una sesión activa con el access vencido SÍ renueva", () => {
  assert.equal(
    shouldAttemptRefresh({ status: 401, url: "/address", sentToken: "expired-jwt", refreshToken: "rt" }),
    true
  );
});

test("no se renueva sin refresh token, fuera de 401 ni en endpoints de auth", () => {
  assert.equal(shouldAttemptRefresh({ status: 401, url: "/address", sentToken: "jwt", refreshToken: "" }), false);
  assert.equal(shouldAttemptRefresh({ status: 403, url: "/address", sentToken: "jwt", refreshToken: "rt" }), false);
  assert.equal(shouldAttemptRefresh({ status: 200, url: "/address", sentToken: "jwt", refreshToken: "rt" }), false);
  assert.equal(shouldAttemptRefresh({ status: 401, url: "/login", sentToken: "jwt", refreshToken: "rt" }), false);
  assert.equal(shouldAttemptRefresh({ status: 401, url: "/refresh", sentToken: "jwt", refreshToken: "rt" }), false);
});

test("saveSession acepta access_token o token y guarda ambas cookies", () => {
  const jar = makeJar();
  const session = createSessionStore(jar);
  session.saveSession({ token: "legacy", refresh_token: "rt" });
  assert.equal(jar.get(ACCESS_COOKIE), "legacy");
  assert.equal(jar.get(REFRESH_COOKIE), "rt");
  session.saveSession({ access_token: "fresh" });
  assert.equal(session.getAccessToken(), "fresh");
  assert.equal(session.getRefreshToken(), "rt");
  // Sin datos no borra nada.
  session.saveSession();
  assert.equal(session.getAccessToken(), "fresh");
});

test("clearSession borra AMBOS tokens, cookies auxiliares y localStorage de la cuenta", () => {
  const jar = makeJar({ uat: "jwt", urt: "rt", account: "{}", ue: "a@b.com", CookieAccept: "1", newsletter: "true" });
  const storage = makeStorage({ account: "{}", cart: "{}", wishlist: "[]" });
  const session = createSessionStore(jar, () => storage);
  session.clearSession();
  assert.equal(jar.get(ACCESS_COOKIE), undefined);
  assert.equal(jar.get(REFRESH_COOKIE), undefined);
  assert.equal(jar.get("account"), undefined);
  assert.equal(jar.get("ue"), undefined);
  assert.equal(jar.get("CookieAccept"), undefined);
  // Cookies ajenas a la sesión no se tocan.
  assert.equal(jar.get("newsletter"), "true");
  assert.equal(storage.store.has("account"), false);
  assert.equal(storage.store.has("cart"), false);
  assert.equal(storage.store.has("wishlist"), true);
});

test("clearSession funciona sin localStorage (SSR) y con cookies que fallan", () => {
  const jar = makeJar({ uat: "jwt", urt: "rt" });
  const session = createSessionStore(jar, () => { throw new Error("no window"); });
  assert.doesNotThrow(() => session.clearSession());
  assert.equal(jar.get(ACCESS_COOKIE), undefined);
  assert.equal(jar.get(REFRESH_COOKIE), undefined);

  const broken = { get: () => { throw new Error("blocked"); }, set: () => {}, remove: () => { throw new Error("blocked"); } };
  const s2 = createSessionStore(broken);
  assert.doesNotThrow(() => s2.clearSession());
  assert.equal(s2.getAccessToken(), "");
  assert.equal(s2.dropStaleRefreshToken(), false);
});

test("dropStaleRefreshToken descarta un refresh huérfano y respeta una sesión activa", () => {
  const stale = createSessionStore(makeJar({ urt: "rt" }));
  assert.equal(stale.dropStaleRefreshToken(), true);
  assert.equal(stale.getRefreshToken(), "");
  assert.equal(stale.dropStaleRefreshToken(), false);

  const active = createSessionStore(makeJar({ uat: "jwt", urt: "rt" }));
  assert.equal(active.dropStaleRefreshToken(), false);
  assert.equal(active.getRefreshToken(), "rt");
});
