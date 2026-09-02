/**
 * Links that come from CMS data (banners, menus, external products, digital
 * previews) are rendered into `href` or passed to `window.open`. A stored
 * `javascript:` or `data:` URL there would execute in the shopper's browser,
 * so only http(s) (and mailto/tel for contact links) are allowed through.
 *
 * Pure module - unit-tested with `node --test`.
 */
import { safeRedirectPath } from "./safeRedirect.js";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const CONTACT_PROTOCOLS = new Set(["mailto:", "tel:"]);

/** Returns the URL when it is an absolute http(s) URL, otherwise `fallback`. */
export const safeHttpUrl = (value, fallback = null) => {
  if (typeof value !== "string") return fallback;
  const candidate = value.trim();
  if (!candidate) return fallback;
  try {
    const url = new URL(candidate);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.href : fallback;
  } catch {
    return fallback;
  }
};

/** http(s), mailto: and tel: links (contact / social blocks). */
export const safeContactUrl = (value, fallback = null) => {
  if (typeof value !== "string") return fallback;
  const candidate = value.trim();
  if (!candidate) return fallback;
  try {
    const url = new URL(candidate);
    return ALLOWED_PROTOCOLS.has(url.protocol) || CONTACT_PROTOCOLS.has(url.protocol) ? candidate : fallback;
  } catch {
    return fallback;
  }
};

/**
 * For `href` values that may be either a same-origin path ("/collections")
 * or an absolute http(s) URL (CMS menus and banners). Everything else maps to
 * `fallback`.
 */
export const safeHref = (value, fallback = "/") => {
  const path = safeRedirectPath(value, null);
  if (path) return path;
  return safeHttpUrl(value, fallback);
};

/**
 * Opens an external URL in a new tab without giving it a handle on our
 * window (`noopener`) and without leaking the referrer. No-op for anything
 * that is not http(s).
 */
export const openExternal = (value) => {
  const url = safeHttpUrl(value);
  if (!url || typeof window === "undefined") return false;
  window.open(url, "_blank", "noopener,noreferrer");
  return true;
};

/** Attributes to spread on any `<a>` / `<Link>` that opens a new tab. */
export const EXTERNAL_LINK_PROPS = Object.freeze({ target: "_blank", rel: "noopener noreferrer" });
