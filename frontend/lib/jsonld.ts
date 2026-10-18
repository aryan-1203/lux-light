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
    url: abs("/the-lamp"),
    image: abs("/opengraph-image"),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: siteConfig.priceDisplay,
      availability: "https://schema.org/PreOrder",
      url: abs("/early-access"),
      areaServed: "IN",
    },
  };
}

export function articleLd(post: { title: string; excerpt: string; date: string; url: string; cover: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    image: abs(post.cover),
    mainEntityOfPage: abs(post.url),
    author: { "@type": "Organization", name: siteConfig.brandName },
    publisher: {
      "@type": "Organization",
      name: siteConfig.brandName,
      logo: { "@type": "ImageObject", url: abs("/icon.svg") },
    },
    inLanguage: "en-IN",
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
