/**
 * JSON-LD is injected into a `<script type="application/ld+json">` block.
 * `JSON.stringify` does NOT escape `<`, so a value such as
 * `</script><script>alert(1)</script>` (from a CMS SEO field) would break out
 * of the script element. Escaping `<`, `>`, `&` and the U+2028/2029 line
 * separators keeps the payload valid JSON while making it inert as HTML.
 *
 * Pure module - unit-tested with `node --test`.
 */
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);
const esc = (hex) => "\\" + "u" + hex;

export const serializeJsonLd = (value) =>
  JSON.stringify(value ?? {})
    .split("<").join(esc("003c"))
    .split(">").join(esc("003e"))
    .split("&").join(esc("0026"))
    .split(LINE_SEPARATOR).join(esc("2028"))
    .split(PARAGRAPH_SEPARATOR).join(esc("2029"));
