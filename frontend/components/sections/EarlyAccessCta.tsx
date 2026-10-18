import { Check } from "lucide-react";
import { siteConfig } from "@/site.config";
import { fillOfferTokens, formatINR, formatNumber, whatsappHref } from "@/lib/format";
import { LazyLeadForm } from "@/components/form/LazyLeadForm";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Emphasis } from "@/components/ui/Emphasis";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

/** Offer block + the short interest form + WhatsApp. The hero's CTA lands here on Home. */
export function EarlyAccessCta() {
  return (
    <section id="early-access" aria-labelledby="ea-title" className="grain section-y relative overflow-hidden bg-linen">
      <div
        aria-hidden
        className="absolute top-[-20%] right-[-10%] size-[70vmax] rounded-full opacity-70 [background:var(--glow)]"
      />
      <div className="container-x relative grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-5">
          <p className="eyebrow">Early access</p>
          <h2 id="ea-title" className="mt-4 text-display-m text-ink">
            <Emphasis text={siteConfig.offer.headline} />
          </h2>
          <p className="mt-6 max-w-[44ch] text-body-l text-ink-muted">
            {fillOfferTokens(siteConfig.offer.announcement)}
          </p>

          <div className="mt-8 flex items-baseline gap-3">
            <span className="tabular font-mono text-[2.5rem] leading-none text-ink">
              {formatINR(siteConfig.priceDisplay)}
            </span>
            {siteConfig.priceCompare && (
              <span className="tabular font-mono text-body text-ink-muted line-through">
                {formatINR(siteConfig.priceCompare)}
              </span>
            )}
          </div>
          <p className="mt-2 text-small text-ink-muted">
            Founding-batch price · {formatNumber(siteConfig.launchBatchSize)} lamps · no payment now
          </p>

          <ul className="mt-8 space-y-3">
            {siteConfig.offer.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-3 text-body text-ink">
                <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-sun-400">
                  <Check aria-hidden className="size-3 text-ink" strokeWidth={3} />
                </span>
                {perk}
              </li>
            ))}
          </ul>

          <a
            href={whatsappHref("Hi! I'd like to know more about early access.")}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex h-12 items-center gap-2.5 rounded-pill border border-line-strong/50 bg-paper px-5 text-[0.9375rem] font-semibold text-ink transition-[scale,border-color] duration-[var(--dur-press)] ease-out active:scale-[0.97] hover-fine:border-ink"
          >
            <WhatsAppIcon className="size-5 text-[#1a9e4b]" /> Prefer to chat? WhatsApp us
          </a>
        </Reveal>

        <Reveal delay={0.06} className="lg:col-span-7">
          <div className="rounded-card border border-hairline bg-paper p-6 shadow-lift sm:p-8 md:p-10">
            <LazyLeadForm variant="short" />
          </div>
          <Disclaimer compact className="mt-4" />
        </Reveal>
      </div>
    </section>
  );
}
