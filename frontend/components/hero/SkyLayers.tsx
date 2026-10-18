"use client";

import { m, useTransform, type MotionValue } from "motion/react";
import { skyDawn, skyPaper, skySunrise } from "./timeline";

/**
 * Stacked sky gradients crossfaded by opacity. Gradients are never interpolated (that would repaint
 * every frame); each layer is a static gradient whose opacity follows the story.
 */
export function SkyLayers({ progress }: { progress: MotionValue<number> }) {
  const dawn = useTransform(progress, skyDawn);
  const sunrise = useTransform(progress, skySunrise);
  const paper = useTransform(progress, skyPaper);

  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#dfe8ee_0%,var(--sky-mist)_55%,#eef1f1_100%)]" />
      <m.div
        className="absolute inset-0 bg-[linear-gradient(180deg,#e9ecef_0%,#f3e1db_48%,var(--dawn-rose)_66%,#fbe3c4_100%)]"
        style={{ opacity: dawn }}
      />
      <m.div
        className="absolute inset-0 bg-[linear-gradient(180deg,#fbeee6_0%,#fde6c9_45%,var(--sun-200)_70%,#fff4d6_100%)]"
        style={{ opacity: sunrise }}
      />
      <m.div className="absolute inset-0 bg-paper" style={{ opacity: paper }} />
    </div>
  );
}
