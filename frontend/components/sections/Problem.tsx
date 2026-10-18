import { problemStats } from "@/data/stats";
import { luxLadder } from "@/data/specs";
import { CountUp } from "@/components/ui/CountUp";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

export function Problem() {
  return (
    <section aria-labelledby="problem-title" className="section-y">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            id="problem-title"
            eyebrow="The problem"
            title={
              <>
                Light tells the body it’s morning. <em>Indoors</em>, the message is faint.
              </>
            }
            lede="Our eyes read brightness, not wattage. Most rooms are a fraction as bright as even a cloudy sky outside."
          />
        </Reveal>

        <ol className="mt-14 border-t border-hairline md:mt-20">
          {problemStats.map((stat, i) => (
            <Reveal
              as="li"
              key={stat.id}
              index={i}
              className="grid gap-4 border-b border-hairline py-10 md:grid-cols-12 md:items-baseline md:gap-8 md:py-14"
            >
              <p className="tabular font-mono text-numeral-xl text-ink md:col-span-5">
                <CountUp value={stat.value} />
                {stat.unit && <span className="ml-2 text-[0.32em] tracking-[0.02em] text-ink-muted">{stat.unit}</span>}
              </p>
              <div className="md:col-span-7">
                <h3 className="text-heading text-ink">{stat.label}</h3>
                <p className="mt-3 max-w-[52ch] text-body text-ink-muted">{stat.context}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <LuxLadder />
      </div>
    </section>
  );
}

/** Where everyday light sits on a log scale, with the lamp placed on it. */
export function LuxLadder() {
  const min = Math.log10(30);
  const max = Math.log10(150000);
  const pos = (lux: number) => ((Math.log10(lux) - min) / (max - min)) * 100;

  return (
    <Reveal className="mt-16 rounded-card border border-hairline bg-linen p-6 sm:p-8 md:mt-24 md:p-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-heading text-ink">The lux ladder</h3>
        <p className="font-mono text-label tracking-[0.08em] text-ink-muted uppercase">Log scale · approximate</p>
      </div>

      {/* Desktop/tablet: horizontal scale */}
      <div className="relative mt-14 mb-16 hidden h-2 rounded-full bg-[linear-gradient(90deg,#d9d3c8,var(--sun-200)_55%,var(--sun-400)_80%,var(--sun-600))] md:block">
        {luxLadder.map((step, i) => (
          <div
            key={step.id}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pos(step.lux)}%` }}
          >
            <span
              className={cn(
                "block rounded-full border-2 border-linen",
                step.lamp ? "size-5 bg-ink shadow-[0_0_0_6px_rgb(255_200_87/0.35)]" : "size-3 bg-ink/70",
              )}
            />
            <div
              className={cn(
                "absolute left-1/2 w-40 -translate-x-1/2 text-center",
                i % 2 === 0 ? "bottom-7" : "top-7",
                step.lamp && "w-48",
              )}
            >
              <p className={cn("tabular font-mono text-small", step.lamp ? "font-medium text-ink" : "text-ink")}>
                {step.display} lux
              </p>
              <p className={cn("mt-1 text-[0.8125rem] leading-snug", step.lamp ? "text-ink" : "text-ink-muted")}>
                {step.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Phones: vertical list */}
      <ol className="mt-8 flex flex-col gap-3 md:hidden">
        {[...luxLadder].reverse().map((step) => (
          <li
            key={step.id}
            className={cn(
              "flex items-center justify-between gap-4 rounded-md px-4 py-3",
              step.lamp ? "bg-sun-50 ring-1 ring-sun-400" : "bg-paper",
            )}
          >
            <span className="text-small text-ink">{step.label}</span>
            <span className="tabular shrink-0 font-mono text-small text-ink">{step.display}</span>
          </li>
        ))}
      </ol>
    </Reveal>
  );
}
