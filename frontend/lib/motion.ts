/**
 * Shared motion vocabulary. See DESIGN.md §6. No ad-hoc curves or durations in components.
 */
import type { Transition, Variants } from "motion/react";

type Bezier = [number, number, number, number];

export const ease = {
  /** Enters, presses, reveals, UI state. The default. */
  out: [0.23, 1, 0.32, 1] as Bezier,
  /** Elements moving on screen. */
  inOut: [0.77, 0, 0.175, 1] as Bezier,
  /** Sheets and accordion height (iOS-like). */
  drawer: [0.32, 0.72, 0, 1] as Bezier,
} as const;

/** Seconds, for Motion. CSS mirrors live in tokens.css (--dur-*). */
export const duration = {
  press: 0.14,
  micro: 0.18,
  ui: 0.24,
  sheet: 0.36,
  reveal: 0.56,
} as const;

/** Exits run at ~0.7× their entrance. */
export const exitOf = (seconds: number) => +(seconds * 0.7).toFixed(3);

export const spring = {
  ui: { type: "spring", duration: 0.4, bounce: 0.12 } satisfies Transition,
  slider: { stiffness: 220, damping: 30, mass: 0.8 },
  follow: { stiffness: 140, damping: 22, mass: 0.6 },
  land: { type: "spring", duration: 0.9, bounce: 0.22 } satisfies Transition,
  scroll: { stiffness: 400, damping: 60, restDelta: 0.0005 },
} as const;

export const stagger = 0.04;

/** Viewport options for one-shot section reveals. */
export const revealViewport = { once: true, margin: "0px 0px -12% 0px" } as const;

/** Section reveal: 12px rise + fade. Reduced motion swaps to opacity only (see <Reveal>). */
export const revealVariants: Variants = {
  hidden: { opacity: 0, transform: "translateY(12px)" },
  visible: {
    opacity: 1,
    transform: "translateY(0px)",
    transition: { duration: duration.reveal, ease: ease.out },
  },
};

export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.ui, ease: ease.out } },
};

export const staggerContainer = (delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});
