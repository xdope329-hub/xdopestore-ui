// Product and cart prices are stored in COP; the currency picker only changes display.
export const ANALYTICS_CURRENCY = "COP";

export function resolveMeasurementId(settings, fallback = "") {
  const config = settings?.analytics?.google_analytics;
  // Admin checkboxes persist ["on"] or []; older records use scalars.
  const status = Array.isArray(config?.status)
    ? (config.status.length === 1 ? config.status[0] : false)
    : config?.status;
  if (config?.status !== undefined && ![true, 1, "1", "true", "on"].includes(status)) return "";
  const id = String(config?.measurement_id || fallback).trim();
  return /^G-[A-Z0-9]+$/.test(id) ? id : "";
}

// Never send order IDs, search text, contact fields or tokens from URLs.
// Keep only campaign attribution parameters on the initial landing URL.
export function analyticsUrl(value, campaigns = false) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    const params = new URLSearchParams();
    if (campaigns) {
      for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_id", "utm_term", "utm_content", "gclid", "dclid"]) {
        if (url.searchParams.has(key)) params.set(key, url.searchParams.get(key));
      }
    }
    const path = url.pathname.replace(/(\/account\/order\/details)\/[^/]+/, "$1");
    return `${url.origin}${path}${params.size ? `?${params}` : ""}`;
  } catch {
    return "";
  }
}

export function analyticsItem(line) {
  const product = line?.product || line;
  const variation = line?.variation;
  const id = product?.id || product?._id || line?.product_id;
  const quantity = Number(line?.product ? line.quantity : 1);
  const price = Number(variation?.sale_price ?? variation?.price ?? product?.sale_price ?? product?.price);
  if (!id || !Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0) return null;
  const item = { item_id: String(id), item_name: product.name || String(id), price, quantity };
  if (variation?.name) item.item_variant = variation.name;
  if (product.brand?.name) item.item_brand = product.brand.name;
  if (product.categories?.[0]?.name) item.item_category = product.categories[0].name;
  return item;
}

export function ecommerceParams(lines) {
  const items = (lines || []).map(analyticsItem).filter(Boolean).slice(0, 200);
  if (!items.length) return null;
  return {
    currency: ANALYTICS_CURRENCY,
    value: Math.round(items.reduce((total, item) => total + item.price * item.quantity, 0) * 100) / 100,
    items,
  };
}

// One client per document. Queue commands before the external tag loads so slow
// networks do not lose the landing page or the first ecommerce event.
export function createAnalyticsClient(measurementId, browser) {
  if (!resolveMeasurementId(null, measurementId) || !browser) return null;
  browser.dataLayer = browser.dataLayer || [];
  browser.gtag = browser.gtag || function () { browser.dataLayer.push(arguments); };
  const command = (...args) => {
    try { browser.gtag(...args); return true; } catch { return false; }
  };
  const pageFields = () => ({
    page_location: analyticsUrl(browser.location.href, true),
    page_title: browser.document.title,
  });
  let lastPath = "";
  let previousLocation = analyticsUrl(browser.document.referrer);
  command("js", new Date());
  command("set", { ...pageFields(), page_referrer: previousLocation });
  command("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const pageView = () => {
    const path = browser.location.pathname;
    if (path === lastPath) return;
    const fields = { ...pageFields(), page_referrer: previousLocation };
    command("set", fields);
    if (command("event", "page_view", { ...fields, send_to: measurementId })) {
      lastPath = path;
      previousLocation = fields.page_location;
    }
  };
  return {
    pageView,
    ecommerce(name, lines, extra = {}) {
      const params = ecommerceParams(lines);
      if (!params) return false;
      pageView();
      return command("event", name, { ...params, ...extra, ...pageFields(), send_to: measurementId });
    },
  };
}
