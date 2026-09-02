/**
 * Post-login / middleware redirect targets come from cookies (`CallBackUrl`,
 * `currentPath`). A cookie can be planted by any script on the origin or by a
 * sibling sub-domain, so the value is treated as untrusted input: only a
 * same-origin, absolute PATH is accepted. Anything else (absolute URLs,
 * protocol-relative `//evil`, `javascript:`, backslash tricks, control chars)
 * falls back to `fallback`.
 *
 * Pure module (no React / DOM) so it can be unit-tested with `node --test`.
 */
export const DEFAULT_REDIRECT = "/";

const hasControlOrWhitespace = (value) => {
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f || /\s/.test(ch)) return true;
  }
  return false;
};

export const safeRedirectPath = (value, fallback = DEFAULT_REDIRECT) => {
  if (typeof value !== "string") return fallback;
  const candidate = value.trim();
  if (!candidate) return fallback;
  // Must be an absolute path on this origin: starts with exactly one "/".
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  // "/\evil.com" is normalised to "//evil.com" by browsers.
  if (candidate.startsWith("/\\")) return fallback;
  // No whitespace / control characters, no "/scheme:" tricks.
  if (hasControlOrWhitespace(candidate)) return fallback;
  if (/^\/[^/?#]*:/.test(candidate)) return fallback;
  try {
    // Resolve against a fixed origin and make sure it stays there.
    const url = new URL(candidate, "https://placeholder.invalid");
    if (url.origin !== "https://placeholder.invalid") return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
};
