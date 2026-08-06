import axios from "axios";
import https from "https";
import ProductDetailContent from "@/components/productDetails";

export async function generateMetadata({ params }) {
  const { productSlug } = await params;
  const productData = await axios
    .get(`${process.env.API_PROD_URL}/product/slug/${productSlug}`, {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    })
    .then((res) => res?.data)
    .catch(() => null);

  if (!productData) return {};

  const title = productData?.meta_title || productData?.name || "";
  const description = productData?.meta_description || productData?.short_description || "";
  const ogTitle = productData?.og_title || title;
  const ogDescription = productData?.og_description || description;
  const ogImage = productData?.product_meta_image?.original_url || productData?.product_thumbnail?.original_url;
  const canonical = productData?.canonical_url;
  const robots = productData?.robots || "index, follow";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productData?.name || "",
    description: productData?.short_description || productData?.description || "",
    sku: productData?.sku || "",
    image: ogImage ? [ogImage] : [],
    offers: {
      "@type": "Offer",
      price: productData?.sale_price || productData?.price || 0,
      priceCurrency: "USD",
      availability: productData?.stock_status === "in_stock"
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: canonical || "",
    },
  };

  return {
    title,
    description,
    keywords: productData?.meta_keywords || "",
    robots,
    ...(canonical && { alternates: { canonical } }),
    openGraph: {
      // "product" is not a valid Next.js OpenGraph type — it crashes the
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
    other: {
      "script:ld+json": JSON.stringify(jsonLd),
    },
  };
}

const ProductDetails = async ({ params }) => {
  const { productSlug } = await params;
  return <ProductDetailContent params={productSlug} />;
};

export default ProductDetails;
