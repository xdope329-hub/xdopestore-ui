/**
 * Entradas del menú principal que la tienda puede mostrar. Módulo puro (sin
 * React), testeado en menuRules.test.mjs.
 *
 * El menú se administra desde el admin y puede traer secciones que esta
 * tienda no tiene: "Blog" apunta a /blogs, que no existe (404). Esas entradas
 * se ocultan (también dentro de los desplegables) hasta que exista la página.
 */
const HIDDEN_PATHS = ["/blogs", "/blog"];

const normalizePath = (path) => {
  const raw = String(path ?? "").trim();
  if (!raw) return "";
  const withSlash = raw.startsWith("/") ? raw : `/${raw}`;
  return withSlash.replace(/\/+$/, "").toLowerCase();
};

/** true para /blogs, /blog, sus subrutas y variantes con query. */
export function isHiddenPath(path) {
  const p = normalizePath(path);
  if (!p) return false;
  return HIDDEN_PATHS.some((hidden) => p === hidden || p.startsWith(`${hidden}/`) || p.startsWith(`${hidden}?`));
}

/** Copia del árbol del menú sin las entradas ocultas (hijos incluidos). */
export function visibleMenuItems(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && !isHiddenPath(item.path))
    .map((item) => {
      const out = { ...item };
      if (Array.isArray(item.child)) out.child = visibleMenuItems(item.child);
      if (Array.isArray(item.item)) out.item = visibleMenuItems(item.item);
      return out;
    });
}
