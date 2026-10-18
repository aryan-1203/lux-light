import { faqGroups } from "@/data/faq";
import { pageMetadata } from "@/lib/metadata";
import { faqLd } from "@/lib/jsonld";
import { whatsappHref } from "@/lib/format";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { WhatsAppIcon } from "@/components/ui/WhatsAppIcon";

export const metadata = pageMetadata({
  title: "FAQ",
  description: "Answers about the lamp, how to use it, safety, early access and delivery.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqLd(faqGroups.flatMap((g) => g.items))} />
      <PageHeader
        eyebrow="FAQ"
        title={
          <>
            Questions, <em>answered</em>.
          </>
        }
        lede="Everything about the lamp, using it well, safety and early access. Can’t find yours? Ask us on WhatsApp."
      />
      <div className="container-x grid gap-12 pb-[var(--section-y)] lg:grid-cols-12">
        <nav aria-label="FAQ sections" className="hidden lg:col-span-3 lg:block">
          <ul className="sticky top-[calc(var(--nav-h)+32px)] space-y-1">
            {faqGroups.map((g) => (
              <li key={g.id}>
                <a
                  href={`#${g.id}`}
                  className="flex min-h-11 items-center text-small text-ink-muted transition-colors duration-[var(--dur-micro)] hover-fine:text-ink"
                >
                  {g.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="space-y-16 lg:col-span-9">
          {faqGroups.map((g) => (
            <Reveal key={g.id}>
              <section id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-[calc(var(--nav-h)+24px)]">
                <h2 id={`${g.id}-title`} className="mb-4 text-display-m text-ink">
                  {g.title}
                </h2>
                <Accordion items={g.items.map((it, i) => ({ id: `${g.id}-${i}`, title: it.q, content: it.a }))} />
              </section>
            </Reveal>
          ))}
          <Disclaimer />
          <div className="flex flex-col items-start gap-4 rounded-card border border-hairline bg-linen p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
            <p className="text-body text-ink">Still wondering about something?</p>
            <Button href={whatsappHref("Hi! I have a question about the lamp.")} variant="primary">
              <WhatsAppIcon className="size-4 text-[#4ade80]" /> Ask on WhatsApp
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
