import { Clock, MoveHorizontal, Sunrise } from "lucide-react";
import { LuxGap } from "@/components/why/LuxGap";
import { DoseCurve } from "@/components/why/DoseCurve";
import { Cite } from "@/components/ui/Cite";

const USE = [
  { icon: Sunrise, text: "Soon after waking" },
  { icon: Clock, text: "About 30 minutes" },
  { icon: MoveHorizontal, text: "Arm’s length, off to one side" },
];

export function Why() {
  return (
    <section id="why" aria-labelledby="why-title" className="relative bg-bg py-[var(--section-y)]">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
          <div data-reveal="">
            <p className="kicker">Why light</p>
            <h2 id="why-title" className="mt-4 text-display">
              Indoors, your eyes get a <span className="text-sunrise">sliver</span> of the morning.
            </h2>
          </div>
          <p data-reveal="" className="max-w-[46ch] text-body-l text-fg-muted lg:pb-2">
            Your body clock sets itself by bright light reaching your eyes, mostly in the morning.
            <Cite id="brown2022" /> Lit rooms feel bright, but measured at your eyes they give a small fraction of a
            morning outdoors.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:mt-16 lg:grid-cols-2 lg:gap-6">
          <LuxGap />
          <DoseCurve />
        </div>

        <div data-reveal="" className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-small font-medium">
            How people use it
            <Cite id="yale" />
          </p>
          <ul className="flex flex-wrap gap-2">
            {USE.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex h-10 items-center gap-2 rounded-pill border border-line bg-bg-raise px-4 text-small">
                <Icon aria-hidden className="size-4 text-accent-fg" strokeWidth={1.75} />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
