import ProductDetailContent from "@/components/productDetails";
import { serializeJsonLd } from "@/utils/security/jsonLd";

const API_URL = process.env.API_PROD_URL || "http://localhost:5000";

// Server-side product lookup with a hard timeout. TLS certificates ARE
// verified: the previous implementation used axios with an https.Agent
// configured with `rejectUnauthorized: false`, which accepted any certificate
// and left the server open to a man-in-the-middle on API traffic.
// Next.js memoises identical GET fetches within one render, so calling this
// from both generateMetadata and the page costs a single request.
async function fetchProduct(slug) {
  if (!slug) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`${API_URL}/product/slug/${encodeURIComponent(slug)}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const pickImage = (productData) => productData?.product_meta_image?.original_url || productData?.product_thumbnail?.original_url;

const buildJsonLd = (productData) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: productData?.name || "",
  description: productData?.short_description || productData?.description || "",
  sku: productData?.sku || "",
  image: pickImage(productData) ? [pickImage(productData)] : [],
  offers: {
    "@type": "Offer",
    price: productData?.sale_price || productData?.price || 0,
    // Catalogue prices are stored in COP (see SettingProvider).
    priceCurrency: "COP",
    availability: productData?.stock_status === "in_stock" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    url: productData?.canonical_url || "",
  },
});

export async function generateMetadata({ params }) {
  const { productSlug } = await params;
  const productData = await fetchProduct(productSlug);
  if (!productData) return {};

  const title = productData?.meta_title || productData?.name || "";
  const description = productData?.meta_description || productData?.short_description || "";
  const ogTitle = productData?.og_title || title;
  const ogDescription = productData?.og_description || description;
  const ogImage = pickImage(productData);
  const canonical = productData?.canonical_url;
  const robots = productData?.robots || "index, follow";

  return {
    title,
    description,
    keywords: productData?.meta_keywords || "",
    robots,
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      // "product" is not a valid Next.js OpenGraph type - it crashes the
      // page in production builds ("Invalid OpenGraph type: product").
      type: "website",
      title: ogTitle,
      description: ogDescription,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630, alt: title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

const ProductDetails = async ({ params }) => {
  const { productSlug } = await params;
  const productData = await fetchProduct(productSlug);
  return (
    <>
      {/* Structured data as a real ld+json script (the old `other["script:ld+json"]`
          rendered a <meta> tag). Serialised with serializeJsonLd so CMS text can
          never close the script element. */}
      {productData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildJsonLd(productData)) }} />}
      <ProductDetailContent params={productSlug} />
    </>
  );
};

export default ProductDetails;
