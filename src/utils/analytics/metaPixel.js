// Meta Pixel (browser). Comparte moneda con GoogleAnalytics: COP.
export const META_CURRENCY = "COP";

export function resolvePixelId(settings, fallback = "") {
  const config = settings?.analytics?.meta_pixel;
  const status = Array.isArray(config?.status)
    ? (config.status.length === 1 ? config.status[0] : false)
    : config?.status;
  if (config?.status !== undefined && ![true, 1, "1", "true", "on"].includes(status)) return "";
  const id = String(config?.pixel_id || fallback).trim();
  return /^[0-9]{6,20}$/.test(id) ? id : "";
}

function pickPrice(line) {
  const product = line?.product || line;
  const variation = line?.variation;
  return Number(variation?.sale_price ?? variation?.price ?? product?.sale_price ?? product?.price) || 0;
}

function pickId(line) {
  const product = line?.product || line;
  const variation = line?.variation;
  return String(variation?._id || variation?.id || product?.id || product?._id || line?.variation_id || line?.product_id || "");
}

function pickName(line) {
  const product = line?.product || line;
  return String(product?.name || pickId(line));
}

export function metaContents(lines) {
  return (lines || [])
    .map((line) => {
      const id = pickId(line);
      const quantity = Number(line?.product ? line.quantity : (line?.quantity || 1));
      const item_price = pickPrice(line);
      if (!id || !Number.isFinite(quantity) || quantity <= 0) return null;
      return { id, quantity, item_price };
    })
    .filter(Boolean);
}

export function metaCustomData(lines) {
  const contents = metaContents(lines);
  if (!contents.length) return null;
  return {
    currency: META_CURRENCY,
    value: Math.round(contents.reduce((s, c) => s + c.item_price * c.quantity, 0) * 100) / 100,
    content_ids: contents.map((c) => c.id),
    content_type: "product",
    contents,
    num_items: contents.reduce((s, c) => s + c.quantity, 0),
    ...(lines?.[0] ? { content_name: pickName(lines[0]) } : {}),
  };
}

// Genera un event_id unico para eventos browser que no tienen un ancla natural
// (AddToCart, ViewContent, etc.). Purchase usa `purchase_<orderId>` compartido
// con CAPI.
export function generateEventId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}_${rand}`;
}

// Lee la cookie `_fbc`; si no existe pero llega un fbclid en la URL, lo
// sintetiza con el formato que Meta acepta ("fb.1.<timestamp>.<fbclid>") y lo
// persiste en cookie propia para reutilizar (aunque el usuario navegue).
export function readFbc(browser) {
  if (!browser?.document) return null;
  const fromCookie = readCookie(browser.document.cookie, "_fbc");
  if (fromCookie) return fromCookie;
  try {
    const url = new URL(browser.location.href);
    const fbclid = url.searchParams.get("fbclid");
    if (fbclid) {
      const value = `fb.1.${Date.now()}.${fbclid}`;
      browser.document.cookie = `_fbc=${value}; path=/; max-age=${60 * 60 * 24 * 90}; SameSite=Lax`;
      return value;
    }
  } catch { /* ignore */ }
  return null;
}

export function readFbp(browser) {
  if (!browser?.document) return null;
  return readCookie(browser.document.cookie, "_fbp");
}

function readCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split("; ");
  for (const p of parts) {
    const idx = p.indexOf("=");
    if (idx > 0 && p.slice(0, idx) === name) return decodeURIComponent(p.slice(idx + 1));
  }
  return null;
}

/**
 * Un cliente por documento. El script de Meta se carga por <Script> desde el
 * provider; aca solo se hace cola con `fbq` (la funcion la crea el snippet).
 * Todos los `track` aceptan `eventID` para deduplicacion con CAPI.
 */
export function createMetaPixelClient(pixelId, browser) {
  if (!pixelId || !browser) return null;
  // Bootstrap de la cola de fbq (equivalente al snippet oficial), para que los
  // eventos previos a la carga del script no se pierdan.
  if (!browser.fbq) {
    const fbq = function () {
      // eslint-disable-next-line prefer-rest-params
      fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments);
    };
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    browser.fbq = fbq;
    browser._fbq = fbq;
  }
  const command = (...args) => {
    try { browser.fbq(...args); return true; } catch { return false; }
  };
  command("init", pixelId);

  let lastPagePath = "";
  return {
    pixelId,
    pageView() {
      const path = browser.location.pathname + browser.location.search;
      if (path === lastPagePath) return false;
      lastPagePath = path;
      return command("track", "PageView");
    },
    track(eventName, customData, eventId) {
      const opts = eventId ? { eventID: eventId } : undefined;
      if (customData && opts) return command("track", eventName, customData, opts);
      if (customData) return command("track", eventName, customData);
      if (opts) return command("track", eventName, {}, opts);
      return command("track", eventName);
    },
    trackLines(eventName, lines, eventId, extra) {
      const data = metaCustomData(lines);
      if (!data) return false;
      const merged = extra ? { ...data, ...extra } : data;
      return this.track(eventName, merged, eventId);
    },
    trackPurchase({ eventId, value, currency, contents, content_ids, num_items, order_id }) {
      const data = {
        currency: currency || META_CURRENCY,
        value: Number(value) || 0,
        contents: Array.isArray(contents) ? contents : [],
        content_ids: Array.isArray(content_ids) ? content_ids : [],
        content_type: "product",
        num_items: Number(num_items) || 0,
        ...(order_id ? { order_id: String(order_id) } : {}),
      };
      return this.track("Purchase", data, eventId);
    },
    readFbp: () => readFbp(browser),
    readFbc: () => readFbc(browser),
  };
}
