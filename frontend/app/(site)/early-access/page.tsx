import { Check, MessageCircle, Package, Sparkles } from "lucide-react";
import { siteConfig } from "@/site.config";
import { fillOfferTokens, formatINR, formatNumber } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { Emphasis } from "@/components/ui/Emphasis";
import { LeadForm } from "@/components/form/LeadForm";

export const metadata = pageMetadata({
  title: "Early access",
  description: "Join early access for the founding batch. No payment now. We'll continue the conversation on WhatsApp.",
  path: "/early-access",
});

const NEXT_STEPS = [
  { icon: Check, title: "You join the list", body: "Takes about a minute. No payment, no obligation." },
  {
    icon: MessageCircle,
    title: "We say hello on WhatsApp",
    body: "Founding-batch details, timelines and any questions you have.",
  },
  {
    icon: Package,
    title: "Your lamp ships first",
    body: "Founding members get the first units and the early-access price.",
  },
];

export default function EarlyAccessPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="absolute top-[-25%] left-[-20%] size-[70vmax] rounded-full opacity-70 [background:var(--glow)]"
      />
      <div className="container-x relative grid gap-12 pt-[clamp(40px,7vw,96px)] pb-[var(--section-y)] lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="eyebrow">Early access</p>
          <h1 className="mt-4 max-w-[16ch] text-display-l text-ink">
            <Emphasis text={siteConfig.offer.headline} />
          </h1>
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

          <ol className="mt-10 space-y-6">
            {NEXT_STEPS.map((s) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-hairline bg-paper">
                  <s.icon aria-hidden className="size-4 text-sun-800" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-semibold text-ink">{s.title}</p>
                  <p className="mt-1 text-small text-ink-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <ul className="mt-10 space-y-2 border-t border-hairline pt-6">
            {siteConfig.offer.perks.map((perk) => (
              <li key={perk} className="flex items-center gap-2.5 text-small text-ink-muted">
                <Sparkles aria-hidden className="size-4 shrink-0 text-sun-600" strokeWidth={1.75} />
                {perk}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-card border border-hairline bg-paper p-6 shadow-lift sm:p-8 md:p-10">
            <LeadForm variant="full" />
          </div>
          <Disclaimer compact className="mt-4" />
        </div>
      </div>
    </div>
  );
}
