import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/site.config";
import { formatINR, whatsappHref } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Emphasis } from "@/components/ui/Emphasis";
import { Reveal } from "@/components/ui/Reveal";

/** Compact early-access band for the bottom of inner pages. */
export function CtaBand() {
  return (
    <section aria-labelledby="cta-band-title" className="container-x pb-[var(--section-y)]">
      <Reveal className="grain relative overflow-hidden rounded-card border border-hairline bg-linen px-6 py-12 sm:px-10 md:px-14 md:py-16">
        <div
          aria-hidden
          className="absolute -top-1/2 -right-1/4 size-[120%] rounded-full opacity-80 [background:var(--glow)]"
        />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Early access · {formatINR(siteConfig.priceDisplay)} founding price</p>
            <h2 id="cta-band-title" className="mt-4 max-w-[18ch] text-display-m text-ink">
              <Emphasis text={siteConfig.offer.headline} />
            </h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button href="/early-access" size="lg">
              Join early access
            </Button>
            <Button href={whatsappHref("Hi! I have a question about the lamp.")} variant="secondary" size="lg">
              Ask on WhatsApp <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
