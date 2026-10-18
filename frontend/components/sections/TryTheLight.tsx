"use client";

import { m, useMotionValue, useSpring, useTransform } from "motion/react";
import { useId, useState } from "react";
import { spring } from "@/lib/motion";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

const K_MIN = 2700;
const K_MAX = 6500;
const LEVELS = [1, 2, 3, 4, 5] as const;

function modeName(k: number) {
  if (k < 3400) return "warm";
  if (k < 5000) return "neutral";
  return "cool";
}

/**
 * Interactive preview: a colour-temperature slider and a brightness control retint a section-wide
 * glow and the lamp panel. Springs smooth every change. The glow is two static layers (warm, cool)
 * crossfaded by opacity, never a recoloured gradient, so nothing repaints per frame.
 */
export function TryTheLight() {
  const id = useId();
  const [kelvin, setKelvin] = useState(4000);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>(4);

  const kTarget = useMotionValue((4000 - K_MIN) / (K_MAX - K_MIN));
  const bTarget = useMotionValue(4 / 5);
  const k = useSpring(kTarget, spring.slider);
  const b = useSpring(bTarget, spring.slider);

  const warmOpacity = useTransform([k, b], ([kv, bv]: number[]) => (1 - kv) * (0.35 + 0.65 * bv));
  const coolOpacity = useTransform([k, b], ([kv, bv]: number[]) => kv * (0.35 + 0.65 * bv));
  const panelGlow = useTransform(b, (bv) => 0.25 + 0.75 * bv);
  const glowScale = useTransform(b, (bv) => `scale(${0.82 + 0.18 * bv})`);
  const warmPanel = useTransform(k, (kv) => 1 - kv);

  const onKelvin = (v: number) => {
    setKelvin(v);
    kTarget.set((v - K_MIN) / (K_MAX - K_MIN));
  };
  const onLevel = (v: (typeof LEVELS)[number]) => {
    setLevel(v);
    bTarget.set(v / 5);
  };

  const mode = modeName(kelvin);

  return (
    <section aria-labelledby="try-title" className="section-y relative isolate overflow-hidden">
      {/* Section-wide glow */}
      <m.div aria-hidden className="absolute inset-0 -z-10" style={{ transform: glowScale }}>
        <m.div
          className="absolute inset-0 bg-[radial-gradient(60%_55%_at_70%_50%,rgb(255_205_140/0.85),rgb(255_226_180/0.35)_45%,transparent_75%)] max-lg:bg-[radial-gradient(80%_45%_at_50%_68%,rgb(255_205_140/0.85),rgb(255_226_180/0.35)_45%,transparent_75%)]"
          style={{ opacity: warmOpacity }}
        />
        <m.div
          className="absolute inset-0 bg-[radial-gradient(60%_55%_at_70%_50%,rgb(224_236_255/0.95),rgb(236_242_255/0.4)_45%,transparent_75%)] max-lg:bg-[radial-gradient(80%_45%_at_50%_68%,rgb(224_236_255/0.95),rgb(236_242_255/0.4)_45%,transparent_75%)]"
          style={{ opacity: coolOpacity }}
        />
      </m.div>

      <div className="container-x grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <SectionHeading
              id="try-title"
              eyebrow="Try the light"
              title={
                <>
                  Find <em>your</em> morning.
                </>
              }
              lede="Slide between warm and cool, then set the brightness. A screen can only hint at it; the real lamp is far brighter."
            />
          </Reveal>

          <Reveal
            delay={0.08}
            className="mt-10 rounded-card border border-hairline bg-paper/80 p-6 backdrop-blur-sm md:p-8"
          >
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor={`${id}-k`} className="text-small font-medium text-ink">
                Colour temperature
              </label>
              <output htmlFor={`${id}-k`} className="tabular font-mono text-small text-ink" aria-live="off">
                {formatNumber(kelvin)} K · <span className="capitalize">{mode}</span>
              </output>
            </div>
            <input
              id={`${id}-k`}
              type="range"
              min={K_MIN}
              max={K_MAX}
              step={100}
              value={kelvin}
              onChange={(e) => onKelvin(Number(e.target.value))}
              aria-valuetext={`${formatNumber(kelvin)} kelvin, ${mode}`}
              className="kelvin-range mt-4 w-full"
            />
            <div className="mt-2 flex justify-between font-mono text-[0.6875rem] tracking-[0.06em] text-ink-muted uppercase">
              <span>Warm 2700K</span>
              <span>Neutral 4000K</span>
              <span>Cool 6500K</span>
            </div>

            <fieldset className="mt-8">
              <legend className="text-small font-medium text-ink">Brightness</legend>
              <div
                role="radiogroup"
                aria-label="Brightness level"
                className="mt-3 grid grid-cols-5 gap-1.5 rounded-pill bg-ink/[0.05] p-1"
              >
                {LEVELS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={level === n}
                    aria-label={`Level ${n} of 5`}
                    onClick={() => onLevel(n)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                        e.preventDefault();
                        onLevel(Math.min(5, level + 1) as (typeof LEVELS)[number]);
                      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                        e.preventDefault();
                        onLevel(Math.max(1, level - 1) as (typeof LEVELS)[number]);
                      }
                    }}
                    tabIndex={level === n ? 0 : -1}
                    className={cn(
                      "tabular h-10 cursor-pointer rounded-pill font-mono text-small transition-[background-color,color,scale] duration-[var(--dur-micro)] ease-out active:scale-[0.97]",
                      level === n ? "bg-ink text-paper" : "text-ink-muted hover-fine:text-ink",
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </fieldset>
          </Reveal>
        </div>

        {/* Lamp preview */}
        <div aria-hidden className="flex justify-center py-4 [perspective:1600px]">
          <div className="relative aspect-[3/4] w-[min(64vw,340px)] [transform:rotateY(-14deg)]">
            <div className="absolute inset-0 rounded-[9%] bg-[linear-gradient(160deg,#f7f2ea,#e6ddce)] shadow-[inset_0_0_0_1px_rgb(28_27_25/0.1),0_40px_80px_-40px_rgb(80_60_30/0.5)]" />
            <div className="absolute inset-[5.5%] overflow-hidden rounded-[6%] bg-[#efe9df]">
              <m.div className="absolute inset-0" style={{ opacity: panelGlow }}>
                <m.div
                  className="absolute inset-0 bg-[radial-gradient(130%_95%_at_50%_45%,#fff,#fff6e4_40%,#ffe0b0_75%,#ffc98a)]"
                  style={{ opacity: warmPanel }}
                />
                <m.div
                  className="absolute inset-0 bg-[radial-gradient(130%_95%_at_50%_45%,#fff,#f6f9ff_40%,#e4edff_75%,#cfdcf7)]"
                  style={{ opacity: k }}
                />
              </m.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
