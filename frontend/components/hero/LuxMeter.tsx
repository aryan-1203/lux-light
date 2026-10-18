"use client";

import { m, useTransform, type MotionValue } from "motion/react";
import { SCENES } from "./timeline";

/** Thin vertical "lux meter" on the right edge: the hero's scroll progress. */
export function LuxMeter({ progress }: { progress: MotionValue<number> }) {
  const fill = useTransform(progress, (p) => `scaleY(${Math.max(0.002, p)})`);
  return (
    <div aria-hidden className="flex flex-col items-center gap-3">
      <span className="font-mono text-[10px] tracking-[0.12em] text-ink-muted [writing-mode:vertical-rl]">LUX</span>
      <div className="relative h-[32svh] max-h-[320px] w-[2px] overflow-visible rounded-full bg-ink/10">
        <m.div
          className="absolute inset-0 origin-bottom rounded-full bg-[linear-gradient(0deg,var(--sun-200),var(--sun-600))]"
          style={{ transform: fill }}
        />
        {SCENES.map((s) => (
          <Tick key={s.id} progress={progress} at={s.start} />
        ))}
      </div>
    </div>
  );
}

function Tick({ progress, at }: { progress: MotionValue<number>; at: number }) {
  const lit = useTransform(progress, (p) => (p >= at - 0.001 ? 1 : 0.25));
  return (
    <m.span
      className="absolute left-1/2 size-[6px] -translate-x-1/2 translate-y-1/2 rounded-full bg-sun-600 transition-opacity duration-[var(--dur-ui)]"
      style={{ bottom: `${at * 100}%`, opacity: lit }}
    />
  );
}
