import { Package } from "lucide-react";
import { siteConfig } from "@/site.config";
import { inTheBox, specRows } from "@/data/specs";
import { formatINR } from "@/lib/format";
import { pageMetadata } from "@/lib/metadata";
import { productLd } from "@/lib/jsonld";
import { Button } from "@/components/ui/Button";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { JsonLd } from "@/components/ui/JsonLd";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Lamp2D } from "@/components/hero/Lamp2D";
import { MeetTheLamp } from "@/components/sections/MeetTheLamp";
import { Comparison } from "@/components/sections/Comparison";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata = pageMetadata({
  title: "The lamp",
  description:
    "Features, specifications, colour modes, timer and what's in the box. A slim 10,000 lux, UV-free lamp for your desk.",
  path: "/the-lamp",
});

export default function TheLampPage() {
  return (
    <>
      <JsonLd data={productLd()} />
      <PageHeader
        eyebrow="The lamp"
        title={
          <>
            Slim, quiet and <em>very</em> bright.
          </>
        }
        lede="A portrait panel of soft, even light with a fold-out stand, three colour modes, five brightness levels and a timer that remembers for you."
        aside={
          <div
            aria-hidden
            className="hero-stage flex justify-center py-6 [--panel-h:clamp(260px,42vw,420px)] [perspective:1600px]"
          >
            <div className="relative">
              <div className="absolute top-1/2 left-1/2 size-[180%] -translate-x-1/2 -translate-y-1/2 rounded-full [background:var(--glow)]" />
              <Lamp2D transform="rotateY(-22deg)" glow={1} powerOn={1} />
            </div>
          </div>
        }
      >
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
          <Button href="/early-access" size="lg">
            Join early access
          </Button>
          <p className="tabular font-mono text-small text-ink">
            {formatINR(siteConfig.priceDisplay)} <span className="text-ink-muted">founding price · no payment now</span>
          </p>
        </div>
      </PageHeader>

      <MeetTheLamp />

      {/* Specs */}
      <section aria-labelledby="specs-title" className="container-x section-y">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <SectionHeading
              id="specs-title"
              eyebrow="Specifications"
              title={
                <>
                  The <em>details</em>.
                </>
              }
              lede="Placeholder figures until final hardware testing. Every figure will be confirmed before launch."
            />
          </Reveal>
          <div className="space-y-10 lg:col-span-8">
            {specRows.map((group) => (
              <Reveal key={group.group}>
                <h3 className="font-mono text-label tracking-[0.08em] text-ink-muted uppercase">{group.group}</h3>
                <dl className="mt-3 border-t border-hairline">
                  {group.rows.map((row) => (
                    <div key={row.label} className="grid gap-1 border-b border-hairline py-4 sm:grid-cols-3 sm:gap-6">
                      <dt className="text-small text-ink-muted">{row.label}</dt>
                      <dd className="text-small text-ink sm:col-span-2">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* In the box */}
      <section aria-labelledby="box-title" className="section-y bg-linen/60">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <SectionHeading
              id="box-title"
              eyebrow="In the box"
              title={
                <>
                  Open, plug in, <em>begin</em>.
                </>
              }
            />
          </Reveal>
          <Reveal className="lg:col-span-8">
            <ul className="grid gap-3 sm:grid-cols-2">
              {inTheBox.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-md border border-hairline bg-paper px-5 py-4 text-body text-ink"
                >
                  <Package aria-hidden className="size-4 text-sun-800" strokeWidth={1.75} />
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </section>

      <section aria-labelledby="lamp-compare-title" className="section-y">
        <div className="container-x mb-12">
          <Reveal>
            <SectionHeading
              id="lamp-compare-title"
              eyebrow="How it compares"
              title={
                <>
                  Lamp, desk lamp, <em>daylight</em>.
                </>
              }
            />
          </Reveal>
        </div>
        <Comparison withHeading={false} />
        <div className="container-x mt-10">
          <Disclaimer />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
