import { Check, Plus } from "lucide-react";
import { siteConfig } from "@/site.config";
import { faqGroups } from "@/data/faq";
import { formatNumber } from "@/lib/format";
import { LazyLeadForm } from "@/components/form/LazyLeadForm";

/** The four questions people ask before joining. The full list lives in data/faq.ts. */
const PICKS = [
  "Is joining early access a commitment to buy?",
  "Do I pay anything now?",
  "Who should check with a doctor first?",
  "When will it ship, and where?",
];
export const faqItems = faqGroups.flatMap((g) => g.items).filter((i) => PICKS.includes(i.q));

export function Join() {
  const perks = [...siteConfig.offer.perks];
  return (
    <section id="join" aria-labelledby="join-title" className="relative isolate overflow-hidden py-[var(--section-y)]">
      <div
        aria-hidden
        className="pointer-events-none absolute top-[-10%] right-[-25%] -z-10 size-[min(1100px,130vw)] rounded-full bg-[radial-gradient(closest-side,#ffeccb,rgb(255_220_180/0.5)_45%,transparent_72%)]"
      />
      <div className="container-x grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div className="lg:pt-6">
          <p data-reveal="" className="kicker">
            Waitlist
          </p>
          <h2 id="join-title" data-reveal="" className="mt-4 text-display">
            Be first in line for the <span className="text-sunrise">founding batch.</span>
          </h2>
          <p data-reveal="" className="mt-5 max-w-[44ch] text-body-l text-fg-muted">
            We’re making the first {formatNumber(siteConfig.launchBatchSize)} lamps now. Leave your details and we’ll
            reach out before anyone else when they’re ready.
          </p>
          <ul data-reveal="" className="mt-8 grid gap-3">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-glow">
                  <Check className="size-3.5 text-accent-fg" strokeWidth={2.5} />
                </span>
                {p}
              </li>
            ))}
          </ul>

          {/* FAQ: desktop sits under the pitch; phones get it after the form (see below). */}
          <Faq className="mt-14 hidden lg:block" />
        </div>

        <div>
          <div data-reveal="" className="rounded-lg bg-bg-raise p-6 shadow-lift sm:p-9 lg:sticky lg:top-[calc(var(--nav-h)+24px)]">
            <p className="text-title font-medium">Join the waitlist</p>
            <p className="mt-1 text-small text-fg-muted">Takes about 20 seconds. Free, no payment.</p>
            <div className="mt-7">
              <LazyLeadForm />
            </div>
          </div>
          <Faq className="mt-14 lg:hidden" />
        </div>
      </div>
    </section>
  );
}

function Faq({ className }: { className?: string }) {
  return (
    <div id="faq" className={`scroll-mt-28 ${className ?? ""}`}>
      <h3 className="text-title font-medium">Questions</h3>
      <div className="mt-4 border-t border-line">
        {faqItems.map((item) => (
          <details key={item.q} className="faq group border-b border-line">
            <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-6 py-4 font-medium [&::-webkit-details-marker]:hidden">
              {item.q}
              <Plus
                aria-hidden
                className="size-5 shrink-0 text-fg-muted transition-transform duration-[var(--dur-ui)] ease-out group-open:rotate-45"
                strokeWidth={1.75}
              />
            </summary>
            <p className="max-w-[60ch] pb-5 text-fg-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
