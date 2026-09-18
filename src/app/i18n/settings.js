
// Language to use when detection fails
export const fallbackLng = "es";
// Only EN, ES
export const languages = ["es", "en"];
// The only namespace that actually exists is common.json — it must be the
// default, otherwise bare i18next.t() calls (toasts, cart messages) look up
// a nonexistent "translation" namespace and silently fall back to English.
export const defaultNS = "common";

export function getOptions(lng = fallbackLng, ns = defaultNS) {
  return {
    // debug: true,
    supportedLngs: languages,
    fallbackLng,
    // preload: languages,
    load: "languageOnly",
    // Consider "en-US","es-CO" valid if "en","es" exist in supportedLngs
    nonExplicitSupportedLngs: true,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}
