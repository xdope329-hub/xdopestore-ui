# Google Analytics 4

The storefront uses the Google tag directly. No additional package or Tag Manager container is needed.

## Enable

1. In Google Analytics, create/select the GA4 property and its **Web data stream** for the storefront domain. Copy its **Measurement ID** (`G-…`).
2. In the XDope admin dashboard, open **Settings → Analytics → Google Analytics**, paste the ID, enable **Status**, and save. Deploy the storefront changes, then open a fresh page load to pick up the setting. The ID is public, not a secret.
3. In that GA4 web stream, open **Enhanced measurement → Page views → Advanced settings** and turn off **Page changes based on browser history events**. The app sends its own page views for Next.js navigation; leaving automatic history tracking on duplicates them. Disable automatic **Form interactions** and **Site search** as well; checkout progress is explicitly tracked, and raw form/search inputs are not part of this integration.
4. Visit a product, add it to the cart and open checkout. Check **Realtime** for `page_view`, `view_item`, `add_to_cart`, and `begin_checkout`. Browser blockers can prevent delivery.

Optional: set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in `.env.local` / the deployment environment and rebuild. It is a fallback only: the admin ID takes precedence, and an explicitly disabled admin Status always keeps analytics off. No ID means no Google script and no events. Use a separate test property for local/preview environments.

## Events and reports

| Event | Trigger |
| --- | --- |
| `page_view` | Initial page and each pathname change, including product, cart, checkout and order result pages. Query-only changes do not create extra views. |
| `view_item` | Product details load successfully, once per product visit. |
| `add_to_cart` | Add/increase cart quantity, including bundles. Authenticated writes are tracked after API success. |
| `remove_from_cart` | Decrease/remove items or explicitly clear the cart, after API success when signed in. |
| `view_cart` | Visit the cart with loaded items, once per visit. |
| `begin_checkout` | Reach checkout with items and available capacity, once per visit. Guest checkout and the login prompt both count. |
| `add_payment_info` | Submit a valid, quoted checkout with a payment method, before the payment request. Retries count as new submissions. |

In **Reports → Engagement → Pages and screens**, use page path to compare `/product/…`, `/cart`, and `/checkout`. In **Explore → Funnel exploration**, add steps `view_item → add_to_cart → begin_checkout → add_payment_info` to see where visitors stop. Use an open funnel if visitors may enter directly at cart or checkout. Google may organize the report navigation differently depending on the property's selected reporting collection.

Values are the item price × quantity in **COP**, the database currency, independent of the display currency. Shipping and tax are excluded. Payloads contain product IDs/names, variant, brand/category when available, quantity and price. Payment submission additionally includes the payment method and applied coupon. No checkout contact/address fields, passwords or account IDs are passed. URLs drop query parameters except campaign attribution; order-detail IDs and fragments are removed. Google Signals and ad personalization are disabled.

`purchase` is deliberately not emitted: the current verification endpoint returns payment status without authoritative order items/totals, and the success page can also represent a pending payment. A success-page visit is not confirmed revenue. Reliable revenue tracking requires a separate integration with confirmed payment/order data. Variant replacement in the cart does not emit quantity-change events.

## Verification

- `npm run test:unit` checks configuration precedence, item amounts, URL filtering, route deduplication and tag failures.
- The integration can be inspected without sending test data to Google by intercepting `https://www.googletagmanager.com/gtag/js*` in browser tests and reading the queued `window.dataLayer` commands.
- Production security headers allow the Google tag and Analytics collection endpoints.

References: [Google ecommerce events](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce), [manual page views and history settings](https://developers.google.com/analytics/devguides/collection/ga4/views), [Google tag security policy](https://developers.google.com/tag-platform/security/guides/csp).
