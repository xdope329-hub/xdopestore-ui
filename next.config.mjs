/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";
const API_URL = process.env.API_PROD_URL || "http://localhost:5000";
const apiOrigin = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return "http://localhost:5000";
  }
})();

// Hosts allowed to serve product / CMS images through next/image.
// Loopback hosts are only allowed outside production so the image optimizer
// can never be pointed at internal services on the server (SSRF pivot).
const imageHosts = [
  { protocol: "https", hostname: "xdope-api.onrender.com" },
  { protocol: "https", hostname: "res.cloudinary.com" },
  ...(isProd
    ? []
    : [
        { protocol: "http", hostname: "127.0.0.1" },
        { protocol: "http", hostname: "localhost" },
      ]),
];
try {
  const api = new URL(API_URL);
  if (api.protocol === "https:" && !imageHosts.some((h) => h.hostname === api.hostname)) {
    imageHosts.push({ protocol: "https", hostname: api.hostname });
  }
} catch {
  /* API_PROD_URL not a URL - ignore */
}

// ── Content Security Policy ─────────────────────────────────────────────────
// Third parties in use: Google Identity Services (accounts.google.com),
// reCAPTCHA (www.google.com / www.gstatic.com / recaptcha.google.com),
// Google Fonts, Google Maps embed, Cloudinary + the API for media.
// 'unsafe-inline' for scripts is required by Next.js without a nonce setup;
// tighten to nonces later (see SECURITY-AUDIT.md, "CSP hardening").
const imgSources = new Set(["'self'", "data:", "blob:", apiOrigin, ...imageHosts.map((h) => `${h.protocol}://${h.hostname}`)]);
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://accounts.google.com https://www.google.com https://www.gstatic.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src ${[...imgSources].join(" ")} https://*.googleusercontent.com`,
  `connect-src 'self' ${apiOrigin} https://www.google.com https://accounts.google.com${isProd ? "" : " ws: wss:"}`,
  `media-src 'self' blob: ${apiOrigin} https://res.cloudinary.com https://xdope-api.onrender.com`,
  "frame-src https://www.google.com https://recaptcha.google.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  // Two years, sub-domains included. Add "; preload" once every sub-domain is HTTPS-only.
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }] : []),
];

const nextConfig = {
  env: {
    // Public API base URL (inlined in the client bundle - never put secrets here).
    API_PROD_URL: API_URL,
    storageURL: process.env.STORAGE_URL || "",
  },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: imageHosts,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
