import { ShieldCheck } from "lucide-react";
import { sideEffects } from "@/data/science";
import { TrialChart } from "@/components/research/TrialChart";
import { MetaAnalysis } from "@/components/research/MetaAnalysis";
import { Cite } from "@/components/ui/Cite";

/**
 * What the research found. Wording stays with the studies ("in a trial, people who…"): under ASCI
 * guidance the page must not claim the lamp treats or cures anything, and none of these studies
 * tested this lamp.
 */
export function Research() {
  const any = sideEffects.items[0].percent;
  return (
    <section id="research" aria-labelledby="research-title" className="bg-bg-tint py-[var(--section-y)]">
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
          <div data-reveal="">
            <p className="kicker">Clinically studied</p>
            <h2 id="research-title" className="mt-4 text-display">
              Not a wellness hunch. <span className="text-sunrise">Tested in trials.</span>
            </h2>
          </div>
          <p data-reveal="" className="max-w-[46ch] text-body-l text-fg-muted lg:pb-2">
            Bright light at 10,000 lux has been tested against placebo in randomised trials for decades. Here’s what two
            of them found. They studied light therapy in general, not this lamp.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:mt-16 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
          <TrialChart />
          <div className="grid gap-5 lg:gap-6">
            <MetaAnalysis />
            <div data-reveal="" className="flex gap-4 rounded-lg bg-bg-raise p-6 shadow-soft sm:p-8">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-glow">
                <ShieldCheck className="size-5 text-accent-fg" strokeWidth={1.75} />
              </span>
              <div>
                <p className="font-medium">Side effects were mostly mild</p>
                <p className="mt-1 text-small text-fg-muted">
                  In a study of {sideEffects.participants} people using 10,000-lux light, {Math.round(any)}% noticed
                  something, most often a headache or eye strain. Almost all of it was mild and passed quickly.
                  <Cite id="kogan1998" /> If you have an eye condition or bipolar disorder, check with your doctor
                  first.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
