/**
 * Relleno de cada una de las 5 estrellas según el promedio real de
 * calificación del producto. Módulo puro (sin React), testeado en
 * starFills.test.mjs.
 *
 * 4.3 → [1, 1, 1, 1, 0.3]; 2.5 → [1, 1, 0.5, 0, 0]; sin promedio → todas vacías.
 */
export const STAR_COUNT = 5;

/** Promedio acotado a 0..5; cualquier valor no numérico cuenta como 0. */
export function clampRating(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(STAR_COUNT, Math.max(0, n));
}

/** Fracción (0..1, a centésimas) con la que se llena cada estrella. */
export function starFills(value) {
  const rating = clampRating(value);
  return Array.from({ length: STAR_COUNT }, (_, index) => Math.round(Math.min(1, Math.max(0, rating - index)) * 100) / 100);
}
