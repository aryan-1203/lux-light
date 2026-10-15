/**
 * Motion presets (DECISIONS: micro 150–200ms, UI 250–300ms, page 500–700ms; exit faster than
 * enter; transform/opacity only). Under `prefers-reduced-motion`, App's
 * `<MotionConfig reducedMotion="user">` strips transform animations automatically; use
 * `useReducedMotionSafe()` to also skip scroll-linked / looping / pointer effects.
 */
import { useReducedMotion, type Transition, type Variants } from 'framer-motion';
import { durations as ms, easings, springs } from './tokens';

const s = (n: number) => n / 1000;

export const durations = {
  micro: s(ms.micro),
  fast: s(ms.fast),
  ui: s(ms.ui),
  slow: s(ms.slow),
  page: s(ms.page),
  cinematic: s(ms.cinematic),
} as const;

export const ease = {
  out: [...easings.out] as [number, number, number, number],
  in: [...easings.in] as [number, number, number, number],
  inOut: [...easings.inOut] as [number, number, number, number],
  sunrise: [...easings.sunrise] as [number, number, number, number],
};

export const transitions = {
  micro: { duration: durations.micro, ease: ease.out },
  ui: { duration: durations.ui, ease: ease.out },
  uiExit: { duration: durations.fast, ease: ease.in },
  page: { duration: durations.page, ease: ease.sunrise },
  pageExit: { duration: durations.ui, ease: ease.in },
  magnetic: springs.magnetic,
  sheet: springs.sheet,
  pop: springs.pop,
} satisfies Record<string, Transition>;

/** Fade + rise. Use with `initial="hidden" whileInView="visible" viewport={{ once: true }}`. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: durations.slow, ease: ease.out } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: durations.ui, ease: ease.out } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: durations.ui, ease: ease.out } },
  exit: { opacity: 0, scale: 0.98, transition: transitions.uiExit },
};

/** Container that staggers children (30–50ms per item per MD guidance). */
export function stagger(staggerChildren = 0.045, delayChildren = 0): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren, delayChildren } },
  };
}

/** Text/word reveal: rises from below a mask line (parent needs overflow-hidden). */
export const reveal: Variants = {
  hidden: { y: '110%', opacity: 0 },
  visible: { y: '0%', opacity: 1, transition: { duration: durations.page, ease: ease.sunrise } },
};

/** Route transition (PageTransition). Exit ≈ 50% of enter. */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: transitions.page },
  exit: { opacity: 0, y: -8, transition: transitions.pageExit },
};

/** Off-canvas panels. */
export const slideFrom = {
  right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
  left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
  bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
} as const;

export const overlayFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durations.ui } },
  exit: { opacity: 0, transition: { duration: durations.fast } },
} as const;

/**
 * True when the user asked for reduced motion. Use it to skip pointer-follow, parallax,
 * scroll-scrub, particles, marquees and counters (Framer handles plain transitions itself).
 */
export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false;
}
