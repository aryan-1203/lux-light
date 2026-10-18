"use client";

import { LazyMotion } from "motion/react";
import type { ReactNode } from "react";

// Animation features (incl. layout animations) load after first render. Style-bound motion values
// (the scroll-driven hero) work without them, so nothing waits on this chunk.
const loadFeatures = () => import("./motion-features").then((mod) => mod.default);

export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      {children}
    </LazyMotion>
  );
}
