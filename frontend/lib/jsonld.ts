import { siteConfig } from "@/site.config";

const abs = (path: string) => new URL(path, siteConfig.url).toString();

export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.brandName,
    url: siteConfig.url,
    logo: abs("/icon.svg"),
    email: siteConfig.contact.email,
    areaServed: "IN",
    sameAs: siteConfig.socials.map((s) => s.href),
  };
}

export function productLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${siteConfig.brandName} 10,000 lux light lamp`,
    description: siteConfig.description,
    brand: { "@type": "Brand", name: siteConfig.brandName },
    url: abs("/#lamp"),
    image: abs("/opengraph-image"),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: siteConfig.priceDisplay,
      availability: "https://schema.org/PreOrder",
      url: abs("/#join"),
      areaServed: "IN",
    },
  };
}

export function faqLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}
