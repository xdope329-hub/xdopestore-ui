/**
 * Qué categorías muestra la pestaña "Compra por Categoría" de la portada.
 * Módulo puro (sin React), testeado en homeProductTabRules.test.mjs.
 *
 * `categoryIds` viene de la configuración de la portada (GET /home), donde el
 * administrador elige las categorías en Front → Category Products. Cuando es
 * un array se respeta tal cual (incluso vacío: el admin las quitó todas).
 * Solo si NO hay lista configurada se cae a las categorías con productos.
 */

/** Categorías anidadas: una categoría elegida arrastra a sus subcategorías. */
export function filterCategoriesNested(categoryData = [], categoryIds = []) {
  const idSet = new Set(categoryIds);
  const seen = new Set();
  const result = [];
  const visit = (category) => {
    if (seen.has(category.id)) return;
    if (idSet.has(category.id)) {
      seen.add(category.id);
      result.push(category);
      category.subcategories?.forEach(visit);
    } else {
      category.subcategories?.forEach(visit);
    }
  };
  categoryData.forEach(visit);
  return result;
}

/** Lista plana (el API ya incluye las subcategorías): en el orden del admin. */
export function filterCategoriesFlat(categoryData = [], categoryIds = []) {
  const byId = new Map(categoryData.map((c) => [c.id, c]));
  const seen = new Set();
  const result = [];
  for (const id of categoryIds) {
    if (seen.has(id) || !byId.has(id)) continue;
    seen.add(id);
    result.push(byId.get(id));
  }
  return result;
}

/** Sin lista configurada: las categorías con productos (o todas si no hay conteo). */
export function fallbackCategories(categoryData = []) {
  const withProducts = categoryData.filter((c) => Number(c?.products_count) > 0);
  return withProducts.length ? withProducts : categoryData;
}

export function selectHomeTabCategories(categoryData, categoryIds, { nested = false } = {}) {
  const data = Array.isArray(categoryData) ? categoryData : [];
  if (!Array.isArray(categoryIds)) return fallbackCategories(data);
  return nested ? filterCategoriesNested(data, categoryIds) : filterCategoriesFlat(data, categoryIds);
}
