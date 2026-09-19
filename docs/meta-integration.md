# Meta Pixel + Conversions API

Integracion doble (browser + server) para xDope, optimizada para campanas de
Meta Ads con Purchase como evento objetivo.

## Que se implemento

| Evento           | Fuente         | Trigger                                                                 |
| ---------------- | -------------- | ----------------------------------------------------------------------- |
| PageView         | Browser        | Layout raiz, dispara en cada cambio de ruta (SPA), deduplicado por path |
| ViewContent      | Browser        | `/product/[slug]` al cargar la ficha                                    |
| AddToCart        | Browser        | Al agregar un producto (usuario logueado y guest)                       |
| InitiateCheckout | Browser        | `/checkout` al montar (una vez por sesion)                              |
| AddPaymentInfo   | Browser        | Click en "Realizar pedido" (antes de POST /payment/initialize)          |
| Purchase         | Browser + CAPI | payment_status = `completed` (MP webhook/verify) o COD al crearse       |

## Arquitectura

```
Navegador                      Backend                         Meta
─────────                      ───────                         ────
Pixel (fbevents.js)  ─── browser events ──────────────────────►  ✓
                                                                 │  dedup por event_id
POST /payment/initialize                                         │
  con { meta: fbp,fbc,fbclid,ua }                                │
                        ├─ Order.create con meta_* persistido    │
                        ├─ COD? → maybeSendPurchase ─── CAPI ───►  ✓
                        └─ MP  → redirect a checkout MP
                                                              │
Mercado Pago webhook  ────► /payment/webhook                  │
                                ├─ applyPaymentResult          │
                                └─ onPaymentConfirmed          │
                                       └─ maybeSendPurchase ── CAPI ►  ✓
                                                                          │
Redirect a /order/success?id=X ─► GET /payment/verify/X ──────► tracking snapshot
   └─ trackPurchase(event_id=purchase_<id>) ─── browser Purchase ─────►  ✓
                                                                          │
                                                          Meta dedup ✓ (mismo event_id)
```

## Deduplicacion browser + CAPI

- `event_id = purchase_<orderId>` (ver `src/services/meta/eventId.js`).
- El backend envia CAPI con ese id.
- El navegador dispara `fbq('track','Purchase', data, { eventID })` con **el
  mismo id**.
- Meta deduplica ambas fuentes automaticamente ("Deduplication for Conversions
  API").
- Un F5 en `/order/success` NO genera Purchase adicional: el `event_id` sigue
  siendo el mismo → Meta lo descarta como duplicado.

## Idempotencia (Purchase CAPI)

`services/meta/purchase.js` usa una escritura condicional sobre
`Order.meta_purchase_sent_at`:

```js
Order.findOneAndUpdate(
  { _id: orderId, meta_purchase_sent_at: null },
  { $set: { meta_purchase_sent_at: new Date() } },
);
```

- El primer webhook que llega **gana el claim** y envia el evento a Meta.
- Webhooks repetidos (Mercado Pago reintenta) ven `meta_purchase_sent_at`
  seteado y salen con `skipped: already_sent`.
- Si Meta responde error, se libera el guard (`updateOne` a `null`) para que un
  proximo webhook pueda reintentar.

## Como Purchase se conecta con Mercado Pago

`Purchase` **NO** depende de la URL `/order/success` ni del redirect. Se
dispara desde el backend cuando:

- COD: `isPaymentConfirmed(order) === true` en `/payment/initialize` (el
  pedido queda confirmado al crearse).
- Mercado Pago: `onPaymentConfirmed(orderId)` se llama cuando el webhook (o
  la verificacion) marca `payment_status = completed` Y el pedido paso de
  `pending → processing` (`applied.advanced === true` en
  `services/orderTransitions.js`).

Estados que **no** disparan Purchase: `pending`, `rejected`, `cancelled`,
`refunded`. Las transiciones logisticas posteriores (`shipped`,
`out_for_delivery`, `delivered`) tampoco: solo el estado del pago cuenta.

## User data / matching quality

`services/meta/userData.js` hashea con SHA-256 (segun spec de Meta) y envia
solo lo que existe en el pedido:

- `em` (email — usuario o `guest_email`)
- `ph` (telefono con codigo de pais)
- `fn` / `ln` (nombre partido en first/last)
- `ct`, `st`, `zp`, `country` (direccion snapshot del pedido)
- `external_id` (consumer\_id o guest\_email hasheado)
- `fbp`, `fbc` (cookies capturadas en checkout, sin hashear)
- `client_ip_address`, `client_user_agent` (capturadas en checkout)

## fbp / fbc / fbclid

- El pixel de Meta setea `_fbp` automaticamente al cargar.
- `_fbc` se sintetiza a partir de `fbclid` en la URL al aterrizar
  (`src/utils/analytics/metaPixel.js#readFbc`) y se persiste 90 dias.
- En `POST /payment/initialize` el navegador envia
  `meta: { fbp, fbc, fbclid, user_agent, event_source_url }`.
- El backend los persiste en `Order.meta_*` y los usa al enviar CAPI
  (incluido el webhook, que corre fuera del navegador y perderia
  contexto sin este puente).

## UTM parameters

No se destruyen. `analyticsUrl()` (Google Analytics) ya conserva `utm_*`,
`gclid`, `dclid`. Meta no consume UTMs directamente, pero permanecen en la URL
para atribucion propia.

## Currency

Hardcode `COP` (`services/meta/config.js`). Meta CAPI y browser Pixel siempre
envian `currency: "COP"`.

## Content IDs

- Productos simples: `Product._id`
- Variantes: `Variation._id` (preferido sobre `Product._id` cuando existe)
- No usamos slug (mutable) ni sku (opcional).

Para conectar con Catalogo de Meta: configurar el feed del catalogo usando
`_id` (o `variation._id`) como `id` de item.

## Variables de entorno

**Backend** (`xdopestore-api/.env`):

```
META_PIXEL_ID=1234567890
META_CAPI_ACCESS_TOKEN=EAAG...             # SECRETO — solo backend
META_TEST_EVENT_CODE=TEST12345             # opcional, para Events Manager > Test Events
META_GRAPH_VERSION=v20.0                    # opcional
```

**Frontend** (`xdopestore-ui/.env`):

```
NEXT_PUBLIC_META_PIXEL_ID=1234567890
```

El pixel id tambien puede venir desde el admin (Ajustes → Analytics →
Meta Pixel) via `settings.analytics.meta_pixel.pixel_id`.

## Test Events

En Events Manager → Test Events se obtiene un `TEST12345` code. Setealo en
`META_TEST_EVENT_CODE` y todos los CAPI events apareceran ahi en tiempo real
**sin contarse en la campana**. Dejar vacio en produccion.

## Validar en Events Manager

1. **Events Manager → Data Sources → tu Pixel**: PageView / ViewContent /
   AddToCart / InitiateCheckout / AddPaymentInfo / Purchase deberian
   aparecer con volumen esperado.
2. **Deduplication**: seccion "Server Events → Deduplication for
   Conversions API". Verificar que Purchase muestre >80% de deduplicacion
   (browser + CAPI con el mismo event_id).
3. **Event Match Quality**: seccion "Data Sources → Customer Info Parameters".
   Con email + telefono + direccion + fbp/fbc el score deberia estar
   arriba de 6/10.

## Como agregar nuevos eventos

**Browser:**

```jsx
import { useMetaPixel } from "@/components/analytics/MetaPixel";
const pixel = useMetaPixel();
pixel?.track("Lead", { value: 1000, currency: "COP" });
```

**Server (CAPI):**

```js
const { sendEvents } = require("./services/meta/capiClient");
await sendEvents([{
  event_name: "Lead",
  event_time: Math.floor(Date.now() / 1000),
  event_id: `lead_${leadId}`,
  action_source: "website",
  user_data: buildUserData(...),
  custom_data: { value: 1000, currency: "COP" },
}]);
```

## Seguridad

- `META_CAPI_ACCESS_TOKEN` NUNCA aparece en el bundle del navegador.
- El backend solo lo lee via `process.env`.
- `.env.example` documenta la variable sin exponer valor real.
- Un fallo de Meta (400, timeout, red) **jamas** rompe el checkout, el
  webhook, la creacion de la orden ni el email de confirmacion.

## Consentimiento

Hay un banner de cookies en `src/components/consent/ConsentBanner.jsx`
(Ley 1581/2012 Colombia + GDPR-friendly). Dos categorias:

- `necessary` — siempre activo (carrito, sesion, i18n).
- `analytics` — Google Analytics + Meta Pixel + Meta CAPI.

El estado se persiste en `localStorage` bajo la clave `xdope_consent_v1`.
Mientras el usuario no elija:

- `GatedAnalytics` pasa `id=""` a ambos providers → no cargan scripts, no
  setean cookies (`_fbp`, `_fbc`, `_ga`).
- El payload de `/payment/initialize` NO incluye `meta: {...}`, asi el
  backend guarda `meta_fbp = null`, `meta_fbc = null`, etc. y CAPI hara
  matching solo con datos declarados (email, telefono, direccion).

Al rechazar, el banner ademas borra las cookies `_fbp` y `_fbc` que hayan
podido existir de una sesion previa. Para reabrir la eleccion, exponer
`useConsent().reopen()` en el footer si se desea (no incluido por defecto).

Subir el sufijo de la clave (`xdope_consent_v2`) invalida consentimientos
antiguos y fuerza al usuario a volver a decidir — util cuando cambia el
alcance del tracking.
