/**
 * Reglas del auto-desplazamiento del banner de portada. Módulo puro (sin
 * React), testeado en homeSliderRules.test.mjs.
 *
 * El intervalo lo fija el administrador en Front → Home Banner
 * (`home_banner.autoplay_interval`, en segundos): vacío → 5 s, 0 → sin
 * auto-desplazamiento. HomeSlider.jsx dibuja una barra que se llena durante
 * ese tiempo y pasa al siguiente banner al completarse.
 */
export const DEFAULT_AUTOPLAY_SECONDS = 5;
export const MIN_AUTOPLAY_SECONDS = 1;
export const MAX_AUTOPLAY_SECONDS = 120;

/** Segundos entre banners: vacío → 5; 0 (o negativo) → desactivado; se acota a 1..120. */
export function resolveAutoplaySeconds(value, fallback = DEFAULT_AUTOPLAY_SECONDS) {
  if (value === undefined || value === null || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (n <= 0) return 0;
  return Math.min(MAX_AUTOPLAY_SECONDS, Math.max(MIN_AUTOPLAY_SECONDS, n));
}

/** Solo se auto-desplaza con más de un banner y un intervalo válido. */
export function shouldAutoplay(bannerCount, seconds) {
  return Number(bannerCount) > 1 && seconds > 0;
}

/** Porcentaje (0..100) de la barra según lo transcurrido del intervalo. */
export function progressPercent(elapsedMs, seconds) {
  const total = seconds * 1000;
  if (!(total > 0)) return 0;
  return Math.min(100, Math.max(0, (elapsedMs / total) * 100));
}
