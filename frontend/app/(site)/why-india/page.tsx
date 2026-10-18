import { Building2, CloudFog, CloudRain, Laptop, MoonStar } from "lucide-react";
import { indiaStats } from "@/data/stats";
import { pageMetadata } from "@/lib/metadata";
import { CountUp } from "@/components/ui/CountUp";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata = pageMetadata({
  title: "Why India",
  description:
    "Office days, night shifts, monsoon skies and winter fog: why steady morning light is harder to come by than it looks.",
  path: "/why-india",
});

const MOMENTS = [
  {
    icon: Building2,
    title: "The indoor office day",
    body: "Out the door in the morning, under ceiling lights till evening, home after dark. Many weekdays pass with very little bright daylight.",
    tone: "bg-sky-mist/60",
  },
  {
    icon: MoonStar,
    title: "IT, BPO and night shifts",
    body: "Global clients mean global hours. When your ‘morning’ starts at 7 PM, timing light to your shift matters more than the clock on the wall.",
    tone: "bg-dawn-rose/50",
  },
  {
    icon: CloudRain,
    title: "Monsoon months",
    body: "Weeks of heavy grey skies from June to September in much of the country. Beautiful, and often dim.",
    tone: "bg-sky-mist/60",
  },
  {
    icon: CloudFog,
    title: "North-Indian winter fog and smog",
    body: "Short days, thick morning fog, and bad-air days when stepping out isn’t a great idea. December and January can feel endlessly grey.",
    tone: "bg-linen",
  },
  {
    icon: Laptop,
    title: "Work-from-home routines",
    body: "The commute was at least a walk outside. At home, the bedroom-to-desk journey can be ten steps, all indoors.",
    tone: "bg-sun-50",
  },
];

export default function WhyIndiaPage() {
  return (
    <>
      <PageHeader
        eyebrow="Why India"
        title={
          <>
            A land of sunshine, <em>lived</em> indoors.
          </>
        }
        lede="India has some of the brightest skies in the world. Yet modern routines, seasons and cities keep many of us away from the morning light our days are built around."
      />

      <section aria-labelledby="india-moments" className="container-x pb-[var(--section-y)]">
        <h2 id="india-moments" className="sr-only">
          Where the light goes missing
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MOMENTS.map((m, i) => (
            <Reveal
              as="li"
              key={m.title}
              index={i}
              className={`rounded-card border border-hairline p-6 md:p-8 ${m.tone} ${i === 0 ? "lg:col-span-2" : ""}`}
            >
              <m.icon aria-hidden className="size-7 text-ink/70" strokeWidth={1.5} />
              <h3 className="mt-8 text-heading text-ink">{m.title}</h3>
              <p className="mt-3 max-w-[48ch] text-small text-ink-muted">{m.body}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section aria-labelledby="india-numbers" className="section-y bg-linen/60">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              id="india-numbers"
              eyebrow="By the numbers"
              title={
                <>
                  The shape of an <em>indoor</em> day.
                </>
              }
              lede="Rough, hedged figures we’re still verifying against published sources. We’d rather show fewer numbers than wrong ones."
            />
          </Reveal>
          <ul className="mt-12 grid gap-px overflow-hidden rounded-card border border-hairline bg-hairline md:grid-cols-2 lg:grid-cols-3">
            {indiaStats.map((s, i) => (
              <Reveal as="li" key={s.id} index={i} className="bg-paper p-6 md:p-8">
                <p className="tabular font-mono text-[clamp(2.5rem,1.6rem+3vw,3.75rem)] leading-none text-ink">
                  <CountUp value={s.value} />
                  {s.unit && <span className="ml-1.5 text-[0.4em] text-ink-muted">{s.unit}</span>}
                </p>
                <h3 className="mt-5 text-body font-semibold text-ink">{s.label}</h3>
                <p className="mt-2 text-small text-ink-muted">{s.context}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <section className="container-x section-y">
        <Reveal className="prose mx-auto text-center">
          <p className="font-display text-display-m !text-ink">
            We’re not here to sell a cure. We’re here to bring a <em>sunrise</em> to the desks where mornings get lost.
          </p>
        </Reveal>
      </section>

      <CtaBand />
    </>
  );
}
