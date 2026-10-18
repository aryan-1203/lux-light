import { Clock, Eye, MoonStar, Ruler, ShieldCheck, Sun } from "lucide-react";
import { colourModes } from "@/data/specs";
import { pageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/ui/PageHeader";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { LuxLadder } from "@/components/sections/Problem";
import { CtaBand } from "@/components/sections/CtaBand";

export const metadata = pageMetadata({
  title: "How it works",
  description:
    "What 10,000 lux means, how far to sit, how long to use it, colour modes, UV-free LEDs and when to skip evening light.",
  path: "/how-it-works",
});

const CHAIN = [
  {
    icon: Sun,
    title: "Bright light reaches your eyes",
    body: "Brightness is measured in lux. Morning daylight outdoors is many times brighter than a typical room.",
  },
  {
    icon: Eye,
    title: "Your eyes pass the signal on",
    body: "Light-sensitive cells in the eye tell the brain’s internal clock (the circadian clock) that the day has begun.",
  },
  {
    icon: Clock,
    title: "Your day finds its rhythm",
    body: "A regular morning signal supports a steadier daily rhythm: feeling alert in the day and winding down at night.",
  },
];

const HABITS = [
  {
    icon: Ruler,
    title: "Distance",
    value: "8–24 in · 20–60 cm",
    body: "About an arm’s length. Brightness falls quickly with distance, so stay within range.",
  },
  {
    icon: Clock,
    title: "Duration",
    value: "20–30 minutes",
    body: "Use the timer. Most people fit it around breakfast, email or reading the news.",
  },
  {
    icon: Eye,
    title: "Placement",
    value: "Off to one side",
    body: "Light should reach your eyes indirectly. Never stare into the panel.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        eyebrow="How it works"
        title={
          <>
            Light, in <em>plain</em> language.
          </>
        }
        lede="No jargon, no miracle claims. Here’s what 10,000 lux means, how a morning session works and how to use the lamp well."
      />

      {/* The chain: light → eyes → body clock */}
      <section aria-labelledby="chain-title" className="container-x pb-[var(--section-y)]">
        <Reveal>
          <SectionHeading
            id="chain-title"
            eyebrow="The idea"
            title={
              <>
                Three steps, <em>one</em> signal.
              </>
            }
          />
        </Reveal>
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {CHAIN.map((s, i) => (
            <Reveal
              as="li"
              key={s.title}
              index={i}
              className="relative rounded-card border border-hairline bg-paper p-6 md:p-8"
            >
              <span className="font-mono text-label tracking-[0.08em] text-sun-800">0{i + 1}</span>
              <s.icon aria-hidden className="mt-6 size-7 text-ink/70" strokeWidth={1.5} />
              <h3 className="mt-4 text-heading text-ink">{s.title}</h3>
              <p className="mt-3 text-small text-ink-muted">{s.body}</p>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* What 10,000 lux means */}
      <section aria-labelledby="lux-title" className="section-y bg-linen/60">
        <div className="container-x grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <SectionHeading
              id="lux-title"
              eyebrow="10,000 lux"
              title={
                <>
                  Brightness you can <em>measure</em>.
                </>
              }
            />
          </Reveal>
          <Reveal className="prose lg:col-span-7">
            <p>
              Lux measures how much light lands on a surface, or on your eyes. A typical office desk sits somewhere
              around 300–500 lux. A clear day outdoors can be a hundred times brighter.
            </p>
            <p>
              Light-therapy lamps are usually described at 10,000 lux, measured at a set distance. Move further away and
              the number drops fast: double the distance and you get roughly a quarter of the light. That’s why we
              always say where the figure is measured, and why the ritual starts with how far you sit.
            </p>
          </Reveal>
        </div>
        <div className="container-x">
          <LuxLadder />
        </div>
      </section>

      {/* Distance, duration, placement */}
      <section aria-labelledby="habits-title" className="container-x section-y">
        <Reveal>
          <SectionHeading
            id="habits-title"
            eyebrow="Using it"
            title={
              <>
                Distance, duration, <em>placement</em>.
              </>
            }
          />
        </Reveal>
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {HABITS.map((h, i) => (
            <Reveal as="li" key={h.title} index={i} className="rounded-card border border-hairline bg-paper p-6 md:p-8">
              <h.icon aria-hidden className="size-6 text-ink/70" strokeWidth={1.5} />
              <p className="mt-6 font-mono text-label tracking-[0.08em] text-ink-muted uppercase">{h.title}</p>
              <p className="mt-2 font-display text-heading text-ink">{h.value}</p>
              <p className="mt-3 text-small text-ink-muted">{h.body}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Colour temperatures */}
      <section aria-labelledby="modes-title" className="section-y bg-linen/60">
        <div className="container-x">
          <Reveal>
            <SectionHeading
              id="modes-title"
              eyebrow="Colour temperature"
              title={
                <>
                  Warm, neutral, <em>cool</em>.
                </>
              }
              lede="Colour temperature is measured in kelvin (K). Lower is warmer and golden; higher is cooler and bluer, like a bright morning sky."
            />
          </Reveal>
          <ul className="mt-12 grid gap-4 md:grid-cols-3">
            {colourModes.map((m, i) => (
              <Reveal
                as="li"
                key={m.id}
                index={i}
                className="overflow-hidden rounded-card border border-hairline bg-paper"
              >
                <div
                  aria-hidden
                  className="h-28"
                  style={{
                    background:
                      m.id === "warm"
                        ? "radial-gradient(120% 140% at 50% 120%, #ffc98a, #fff3dc 70%)"
                        : m.id === "neutral"
                          ? "radial-gradient(120% 140% at 50% 120%, #fff1d6, #fffaf2 70%)"
                          : "radial-gradient(120% 140% at 50% 120%, #cfdcf7, #f4f7ff 70%)",
                  }}
                />
                <div className="p-6">
                  <p className="tabular font-mono text-small text-ink">{m.kelvin}K</p>
                  <h3 className="mt-1 text-heading text-ink">{m.label}</h3>
                  <p className="mt-2 text-small text-ink-muted">{m.note}</p>
                </div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* UV-free + evenings */}
      <section className="container-x section-y">
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal className="rounded-card border border-hairline bg-paper p-7 md:p-10">
            <ShieldCheck aria-hidden className="size-7 text-ink/70" strokeWidth={1.5} />
            <h2 className="mt-6 text-display-m text-ink">UV-free LEDs</h2>
            <p className="mt-4 text-body text-ink-muted">
              The lamp uses LEDs and a frosted diffuser that leave out ultraviolet light. You get bright, visible light
              without UV, which also means it won’t tan your skin or help your body make vitamin D.
            </p>
          </Reveal>
          <Reveal index={1} className="rounded-card border border-hairline bg-paper p-7 md:p-10">
            <MoonStar aria-hidden className="size-7 text-ink/70" strokeWidth={1.5} />
            <h2 className="mt-6 text-display-m text-ink">Skip it in the evening</h2>
            <p className="mt-4 text-body text-ink-muted">
              Bright light late in the day can make it harder to wind down. Keep sessions to the morning or the start of
              your day. If you work night shifts, time it to the start of your shift and keep light low before sleep.
            </p>
          </Reveal>
        </div>
        <Disclaimer className="mt-8" />
      </section>

      <CtaBand />
    </>
  );
}
