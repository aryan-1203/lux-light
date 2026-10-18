import { Coffee, Moon, Sunrise } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";

const MOMENTS = [
  {
    time: "7 AM",
    title: "Morning session",
    body: "Lamp on, cool or neutral, 20–30 minutes while you read, work or have breakfast.",
    icon: Sunrise,
    tone: "from-sky-mist to-sun-50",
    lamp: "on",
  },
  {
    time: "3 PM",
    title: "The afternoon slump",
    body: "Step outside for a few minutes if you can. A short walk in daylight beats another coffee.",
    icon: Coffee,
    tone: "from-sun-50 to-sun-200/60",
    lamp: "optional",
  },
  {
    time: "9 PM",
    title: "Wind-down",
    body: "Lamp off. Dim, warm lights and fewer screens help the evening feel like evening.",
    icon: Moon,
    tone: "from-dawn-rose/60 to-linen",
    lamp: "off",
  },
] as const;

/** Horizontal timeline. A row on desktop; native horizontal scroll-snap on phones. */
export function DayWithLight() {
  return (
    <section aria-labelledby="day-title" className="section-y bg-linen/60">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            id="day-title"
            eyebrow="A day with light"
            title={
              <>
                Bright mornings. <em>Dim</em> evenings.
              </>
            }
            lede="Light is about timing as much as brightness. Here’s how the lamp fits into an ordinary day."
          />
        </Reveal>
      </div>

      <div className="relative mt-12 md:mt-16">
        {/* Time axis: cool morning → warm afternoon → night */}
        <div aria-hidden className="container-x pointer-events-none absolute inset-x-0 top-[22px] hidden md:block">
          <div className="h-px bg-[linear-gradient(90deg,var(--sky-mist),var(--sun-400)_45%,var(--dawn-rose)_75%,var(--ink))]" />
        </div>

        <ol
          className="container-x flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
          aria-label="A day with the lamp"
        >
          {MOMENTS.map((m, i) => (
            <Reveal as="li" key={m.time} index={i} className="w-[82%] shrink-0 snap-start sm:w-[60%] md:w-auto">
              <div className="relative mb-6 hidden md:block" aria-hidden>
                <span
                  className={cn(
                    "block size-[11px] translate-y-[17px] rounded-full ring-4 ring-linen",
                    m.lamp === "off" ? "bg-ink" : "bg-sun-600",
                  )}
                />
              </div>
              <article className={cn("h-full rounded-card border border-hairline bg-gradient-to-b p-6 md:p-7", m.tone)}>
                <div className="flex items-center justify-between">
                  <p className="tabular font-mono text-[1.75rem] leading-none text-ink">{m.time}</p>
                  <m.icon aria-hidden className="size-6 text-ink/70" strokeWidth={1.5} />
                </div>
                <h3 className="mt-6 font-sans text-title font-semibold text-ink">{m.title}</h3>
                <p className="mt-2 text-small text-ink-muted">{m.body}</p>
                <p className="mt-5 inline-flex items-center gap-2 rounded-pill bg-paper/70 px-3 py-1 font-mono text-[0.6875rem] tracking-[0.08em] text-ink uppercase">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      m.lamp === "on" ? "bg-sun-600" : m.lamp === "off" ? "bg-ink" : "bg-sun-200 ring-1 ring-sun-600",
                    )}
                  />
                  Lamp {m.lamp}
                </p>
              </article>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
