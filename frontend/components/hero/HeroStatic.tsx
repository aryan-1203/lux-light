import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Reveal } from "@/components/ui/Reveal";
import { lux } from "@/data/specs";
import { formatNumber } from "@/lib/format";
import { Lamp2D } from "./Lamp2D";
import { HERO_CHIPS, SCENE_COPY } from "./SceneCopy";

/**
 * Reduced-motion hero: no pinning, no scrubbing. The final, lit frame of the story with every
 * scene's words laid out as a readable sequence that fades in (opacity only).
 */
export function HeroStatic() {
  const c = SCENE_COPY;
  const later = (["sunrise", "reveal", "ignition", "settle"] as const).map((id) => ({ id, ...c[id] }));

  return (
    <section aria-label="Introduction" className="hero-stage relative -mt-[var(--nav-h)] overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(180deg,#fbeee6_0%,#fde6c9_40%,var(--paper)_85%)]"
      />
      <div
        aria-hidden
        className="absolute top-[38%] left-[var(--lamp-x)] size-[120vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-80 [background:var(--glow)]"
      />

      <div className="container-x relative grid gap-12 pt-[calc(var(--nav-h)+56px)] pb-24 lg:grid-cols-2 lg:items-center lg:pt-[calc(var(--nav-h)+96px)]">
        <div>
          <p className="eyebrow mb-5 !text-ink">{c.predawn.eyebrow}</p>
          {/* The scroll hero owns the page's only <h1>; this twin (shown instead under reduced motion) is a heading by role. */}
          <p
            role="heading"
            aria-level={1}
            className="max-w-[15ch] font-display text-[clamp(2.375rem,1.4rem+4.2vw,5.25rem)] leading-[1.02] tracking-[-0.035em] text-balance text-ink"
          >
            {c.predawn.title}
          </p>
          <p className="mt-6 font-mono text-small text-ink">
            {formatNumber(lux.indoorTypical.value)} lux indoors → {formatNumber(lux.peak.value)} lux at your desk
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="/early-access" size="lg">
              Join early access
            </Button>
            <Button href="/how-it-works" size="lg" variant="secondary">
              How it works
            </Button>
          </div>
        </div>
        <div aria-hidden className="flex justify-center py-6 [perspective:1600px]">
          <Lamp2D transform="rotateY(-24deg)" glow={1} powerOn={1} />
        </div>
      </div>

      <ol className="container-x relative grid gap-4 pb-[var(--section-y)] sm:grid-cols-2 lg:grid-cols-4">
        {later.map((s, i) => (
          <Reveal as="li" key={s.id} index={i} className="rounded-card border border-hairline bg-paper/70 p-6">
            <p className="eyebrow">{s.eyebrow}</p>
            <h2 className="mt-3 text-heading text-ink">{s.title}</h2>
            {s.body && <p className="mt-3 text-small text-ink-muted">{s.body}</p>}
            {s.id === "ignition" && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {HERO_CHIPS.map((chip) => (
                  <li key={chip}>
                    <Chip>{chip}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
