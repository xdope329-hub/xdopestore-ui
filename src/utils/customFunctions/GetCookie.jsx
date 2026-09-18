// Reads a single cookie by name. Each value is decoded on its own inside a
// try/catch: a stray "%" in ANY cookie used to make decodeURIComponent throw
// for the whole jar and crash the caller (denial of service from a cookie).
export default function getCookie(cname) {
  if (typeof document === "undefined" || !document.cookie) return "";
  const prefix = `${cname}=`;
  for (const part of document.cookie.split(";")) {
    const c = part.trim();
    if (c.startsWith(prefix)) {
      const raw = c.slice(prefix.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
  }
  return "";
}

export function checkCookie() {
  return Boolean(getCookie("username"));
}
