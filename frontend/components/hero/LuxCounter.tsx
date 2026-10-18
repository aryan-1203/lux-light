"use client";

import { useMotionValueEvent, useSpring, useTransform, type MotionValue } from "motion/react";
import { useRef, useState } from "react";
import { lux } from "@/data/specs";
import { formatNumber } from "@/lib/format";
import { luxTarget, sceneAt, type SceneId } from "./timeline";

const LABELS: Record<SceneId, string> = {
  predawn: "typical indoor light",
  sunrise: "early morning, outdoors",
  reveal: "early morning, outdoors",
  ignition: `at ${lux.measuredAtCm.value} cm from the panel`,
  settle: `at ${lux.measuredAtCm.value} cm from the panel`,
};

/**
 * Mono lux readout. A spring follows the scroll-derived target, so the climb is smooth and the
 * final step lands on 10,000 with a gentle overshoot. Digits are written straight to the DOM
 * (no React render per frame); tabular numerals keep the width steady.
 */
export function LuxCounter({ progress }: { progress: MotionValue<number> }) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const target = useTransform(progress, luxTarget);
  const shown = useSpring(target, { stiffness: 90, damping: 14, mass: 1 });
  const [scene, setScene] = useState<SceneId>("predawn");

  useMotionValueEvent(shown, "change", (v) => {
    if (valueRef.current) valueRef.current.textContent = formatNumber(Math.max(0, Math.round(v / 10) * 10));
  });
  useMotionValueEvent(progress, "change", (p) => {
    const next = sceneAt(p);
    if (next !== scene) setScene(next);
  });

  const label = LABELS[scene];
  const approx = scene === "predawn" || scene === "sunrise" || scene === "reveal";

  return (
    <div className="font-mono text-ink">
      <p aria-hidden className="flex items-baseline justify-center gap-1.5 whitespace-nowrap lg:justify-end">
        <span className="text-[0.8125rem] text-ink-muted">{approx ? "~" : ""}</span>
        <span ref={valueRef} className="tabular text-[clamp(1.375rem,1.1rem+1vw,2rem)] leading-none tracking-[-0.02em]">
          {formatNumber(lux.indoorTypical.value)}
        </span>
        <span className="text-[0.8125rem] tracking-[0.06em]">lux</span>
      </p>
      <p aria-hidden className="mt-1.5 text-[0.6875rem] tracking-[0.06em] text-ink-muted uppercase">
        {label}
      </p>
      <p className="sr-only">Up to {formatNumber(lux.peak.value)} lux.</p>
    </div>
  );
}
