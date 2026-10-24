import { siteConfig } from "@/site.config";
import { pageMetadata } from "@/lib/metadata";
import { faqLd, productLd } from "@/lib/jsonld";
import { JsonLd } from "@/components/ui/JsonLd";
import { Hero } from "@/components/hero/Hero";
import { Moments } from "@/components/sections/Moments";
import { Why } from "@/components/sections/Why";
import { Research } from "@/components/sections/Research";
import { Join, faqItems } from "@/components/sections/Join";

export const metadata = {
  ...pageMetadata({ title: siteConfig.tagline, description: siteConfig.description, path: "/" }),
  title: { absolute: `${siteConfig.brandName} · ${siteConfig.tagline}` },
};

/** A waitlist page: the lamp, mornings with it, why light matters, what trials found, and the form. */
export default function Home() {
  return (
    <>
      <Hero />
      <Moments />
      <Why />
      <Research />
      <Join />
      <JsonLd data={productLd()} />
      <JsonLd data={faqLd(faqItems)} />
    </>
  );
}
