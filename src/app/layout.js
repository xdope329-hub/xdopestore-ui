import "../index.scss";
import { I18nProvider } from "./i18n/i18n-context";
import { detectLanguage } from "./i18n/server";
import { serializeJsonLd } from "@/utils/security/jsonLd";

export async function generateMetadata() {
  const themeOption = await fetch(`${process.env.API_PROD_URL}/themeOptions`)
    .then((res) => res.json())
    .catch((err) => console.log("err", err));

  const seo = themeOption?.options?.seo || {};
  const siteName = seo?.site_name || "";
  const metaTitle = seo?.meta_title || siteName;
  const metaDescription = seo?.meta_description || "";
  const ogImage = seo?.og_image?.original_url;
  const twitterImage = seo?.twitter_image?.original_url || ogImage;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: seo?.canonical_url || process.env.NEXT_PUBLIC_SITE_URL || "",
    logo: themeOption?.options?.logo?.header_logo?.original_url || "",
  };

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || process.env.API_PROD_URL || "http://localhost:3001"),
    title: {
      default: metaTitle,
      template: `%s | ${siteName}`,
    },
    description: metaDescription,
    keywords: seo?.meta_tags || "",
    robots: seo?.robots || "index, follow",
    ...(seo?.canonical_url && { alternates: { canonical: seo.canonical_url } }),
    ...(seo?.google_site_verification && {
      verification: { google: seo.google_site_verification },
    }),
    icons: {
      icon: themeOption?.options?.logo?.favicon_icon?.original_url,
    },
    openGraph: {
      type: "website",
      siteName: siteName,
      title: seo?.og_title || metaTitle,
      description: seo?.og_description || metaDescription,
      ...(ogImage && { images: [{ url: ogImage, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: seo?.twitter_card || "summary_large_image",
      site: seo?.twitter_site || "",
      title: seo?.twitter_title || seo?.og_title || metaTitle,
      description: seo?.twitter_description || seo?.og_description || metaDescription,
      ...(twitterImage && { images: [twitterImage] }),
    },
    other: {
      ...(seo?.bing_site_verification && { "msvalidate.01": seo.bing_site_verification }),
    },
  };
}

export default async function RootLayout({ children }) {
  const [settings, themeOptions] = await Promise.all([
    fetch(`${process.env.API_PROD_URL}/settings`).then((res) => res.json()).catch(() => ({})),
    fetch(`${process.env.API_PROD_URL}/themeOptions`).then((res) => res.json()).catch(() => ({})),
  ]);

  const seo = themeOptions?.options?.seo || {};
  const primaryColor = themeOptions?.options?.general?.primary_color || "#51ec8c";
  const secondaryColor = themeOptions?.options?.general?.secondary_color;
  const bodyStyle = {
    "--theme-color": primaryColor,
    ...(secondaryColor ? { "--theme-color2": secondaryColor } : {}),
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seo?.site_name || "",
    url: seo?.canonical_url || "",
    logo: themeOptions?.options?.logo?.header_logo?.original_url || "",
  };

  const lng = await detectLanguage();
  return (
    <I18nProvider language={lng}>
      <html lang="en">
        <head>
          {/* Google Fonts */}
          <link href="https://fonts.googleapis.com/css?family=Lato:300,400,700,900" rel="stylesheet" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link href="https://fonts.googleapis.com/css2?family=Yellowtail&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Cormorant:wght@400;500;600;700&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Recursive:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Courgette&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
          <link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
          <script
            type="application/ld+json"
            // serializeJsonLd escapes "<" so CMS SEO text can never close this script element.
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
          />
        </head>
        <body suppressHydrationWarning={true} style={bodyStyle}>{children}</body>
      </html>
    </I18nProvider>
  );
}
