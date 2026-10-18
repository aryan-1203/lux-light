"use client";

import { useMotionValueEvent, useScroll, useSpring, type MotionValue } from "motion/react";
import { useRef, type RefObject } from "react";
import { spring } from "@/lib/motion";
import { track } from "@/lib/analytics";

/** One smoothed 0 → 1 progress for the pinned hero. Everything in the story derives from it. */
export function useHeroProgress(target: RefObject<HTMLElement | null>): MotionValue<number> {
  const { scrollYProgress } = useScroll({ target, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, spring.scroll);
  const completed = useRef(false);

  useMotionValueEvent(progress, "change", (p) => {
    if (!completed.current && p > 0.97) {
      completed.current = true;
      track("hero_complete");
    }
  });

  return progress;
}
