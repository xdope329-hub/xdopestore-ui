import test from "node:test";
import assert from "node:assert/strict";
import { analyticsItem, analyticsUrl, createAnalyticsClient, ecommerceParams, resolveMeasurementId } from "./googleAnalytics.js";

const product = { id: "p1", name: "Camiseta", price: 60000, sale_price: 50000, quantity: 99, brand: { name: "XDope" }, categories: [{ name: "Ropa" }] };
const config = (status, measurement_id = "G-STORE123") => ({ analytics: { google_analytics: { status, measurement_id } } });
const fakeBrowser = () => ({ location: new URL("https://xdopestore.com/product/camiseta?utm_source=instagram&email=private@example.com#token"), document: { title: "Camiseta", referrer: "https://example.com/path?token=secret" } });
const events = (browser, name) => browser.dataLayer.map((args) => [...args]).filter((args) => args[0] === "event" && (!name || args[1] === name));

test("configuration accepts GA4 IDs, admin takes precedence, and disabled means disabled", () => {
  assert.equal(resolveMeasurementId(null), "");
  assert.equal(resolveMeasurementId({}, "G-FALLBACK"), "G-FALLBACK");
  assert.equal(resolveMeasurementId(config(1), "G-FALLBACK"), "G-STORE123");
  for (const status of [false, 0, "0", "false", null]) assert.equal(resolveMeasurementId(config(status), "G-FALLBACK"), "");
  for (const status of [true, 1, "1", "true"]) assert.equal(resolveMeasurementId(config(status)), "G-STORE123");
  for (const id of ["UA-123-4", "GTM-123", 'G-X\"><script>', "invalid"]) assert.equal(resolveMeasurementId(config(true, id)), "");
});

test("saved admin checkbox values enable analytics only when explicitly checked", () => {
  assert.equal(resolveMeasurementId(config(["on"])), "G-STORE123");
  assert.equal(resolveMeasurementId(config("on")), "G-STORE123");
  for (const status of [[], [undefined], [null], [false], ["false"], ["off"], ["unknown"], ["on", "off"]]) {
    assert.equal(resolveMeasurementId(config(status), "G-FALLBACK"), "");
  }
});

test("items use base COP, selected variant price, actual cart quantity and allowlisted fields", () => {
  const line = { product, quantity: 2, variation: { name: "Negro / M", sale_price: "45000" }, email: "private@example.com", sub_total: 1 };
  assert.deepEqual(ecommerceParams([line]), {
    currency: "COP", value: 90000,
    items: [{ item_id: "p1", item_name: "Camiseta", quantity: 2, price: 45000, item_variant: "Negro / M", item_brand: "XDope", item_category: "Ropa" }],
  });
  assert.equal(analyticsItem(product).quantity, 1, "stock quantity is not the quantity viewed");
  assert.equal(analyticsItem({ product, quantity: 1, variation: { sale_price: 0 } }).price, 0);
});

test("missing products and invalid prices/quantities never become zero-value fake events", () => {
  for (const line of [null, {}, { name: "Missing ID", price: 10 }, { id: 1 }, { ...product, sale_price: "bad" }, { product, quantity: 0 }, { product, quantity: -1 }]) {
    assert.equal(analyticsItem(line), null);
  }
  assert.equal(ecommerceParams([]), null);
});

test("page URLs strip private query parameters, fragments and order IDs while preserving campaigns", () => {
  assert.equal(analyticsUrl("https://shop.test/checkout?email=private&token=secret&id=abc#private"), "https://shop.test/checkout");
  assert.equal(analyticsUrl("https://shop.test/?utm_source=instagram&email=private", true), "https://shop.test/?utm_source=instagram");
  assert.equal(analyticsUrl("https://shop.test/account/order/details/private-id"), "https://shop.test/account/order/details");
  assert.equal(analyticsUrl("javascript:alert(1)"), "");
});

test("queues first page before ecommerce and counts actual route revisits, not rerenders", () => {
  const browser = fakeBrowser();
  const client = createAnalyticsClient("G-STORE123", browser);
  client.ecommerce("view_item", [product]);
  client.pageView();
  client.pageView();
  assert.equal(events(browser, "page_view").length, 1);
  assert.deepEqual(events(browser).map((e) => e[1]), ["page_view", "view_item"]);
  assert.equal(browser.dataLayer.find((args) => args[0] === "config")[2].send_page_view, false);
  browser.location = new URL("https://xdopestore.com/checkout?id=private");
  client.ecommerce("begin_checkout", [{ product, quantity: 2 }]);
  assert.equal(events(browser, "page_view").length, 2);
  browser.location = new URL("https://xdopestore.com/product/camiseta");
  client.pageView();
  assert.equal(events(browser, "page_view").length, 3);
  assert.equal(events(browser, "page_view")[1][2].page_referrer, "https://xdopestore.com/product/camiseta?utm_source=instagram");
  const payload = JSON.stringify(browser.dataLayer);
  assert.ok(!payload.includes("private"));
  assert.ok(!payload.includes("secret"));
});

test("disabled analytics does not create a data layer; broken tags cannot break shopping", () => {
  const browser = fakeBrowser();
  assert.equal(createAnalyticsClient("", browser), null);
  assert.equal(browser.dataLayer, undefined);
  browser.gtag = () => { throw new Error("Tag unavailable"); };
  const client = createAnalyticsClient("G-STORE123", browser);
  assert.doesNotThrow(() => client.pageView());
  assert.equal(client.ecommerce("add_to_cart", [{ product, quantity: 1 }]), false);
});
