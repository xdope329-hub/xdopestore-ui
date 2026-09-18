/**
 * Single choke point for every `dangerouslySetInnerHTML` in the storefront.
 *
 * CMS-authored HTML (legal pages, shipping policy, product descriptions) is
 * sanitised with DOMPurify before it touches the DOM. On the server there is
 * no DOM to sanitise with, so untrusted HTML is never emitted in SSR output;
 * the components involved render their content after the API responds on the
 * client, so this does not change what the shopper sees.
 */
import DOMPurify from "dompurify";

let hooked = false;

const getPurifier = () => {
  // DOMPurify's default export is bound to `window`; without a DOM it reports
  // `isSupported === false` and must not be used.
  if (typeof window === "undefined" || !DOMPurify?.isSupported) return null;
  if (!hooked) {
    // Any link that survives sanitisation must not be able to reach our window.
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
        node.setAttribute("rel", "noopener noreferrer");
      }
    });
    hooked = true;
  }
  return DOMPurify;
};

export const SANITIZE_OPTIONS = Object.freeze({
  USE_PROFILES: { html: true },
  FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form", "input", "button", "textarea", "select", "meta", "link", "base"],
  FORBID_ATTR: ["onerror", "onload", "onclick", "srcdoc", "formaction"],
  ALLOW_DATA_ATTR: false,
});

/** Returns sanitised HTML, or "" when no DOM is available (SSR). */
export const sanitizeHtml = (html) => {
  if (typeof html !== "string" || !html) return "";
  const purifier = getPurifier();
  if (!purifier) return "";
  return purifier.sanitize(html, SANITIZE_OPTIONS);
};

/** Ready-to-use value for `dangerouslySetInnerHTML`. */
export const trustedHtml = (html) => ({ __html: sanitizeHtml(html) });
