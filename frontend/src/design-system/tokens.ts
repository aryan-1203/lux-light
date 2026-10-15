/**
 * Dawnlit design tokens — the single source of truth.
 *
 * `tailwind.config.ts` imports this file: colours become CSS variables on `:root`
 * (space-separated RGB channels so Tailwind opacity modifiers work: `bg-sunrise/20`),
 * and the scales below become Tailwind theme keys. Components never use hex literals;
 * they use Tailwind classes (`bg-surface`, `text-muted`) or `cssVar('sunrise')` for
 * canvas/SVG/three.js code that needs a raw value.
 *
 * Contrast ratios (WCAG 2.x, measured by `contrast.test.ts`) are documented in docs/DESIGN_SYSTEM.md.
 */

export const colors = {
  /** OLED near-black page background. */
  bg: '#0A0908',
  /** Raised surfaces: cards, header on scroll, drawers. */
  surface: '#141210',
  /** Second elevation: inputs, hovered cards, popovers. */
  'surface-2': '#1E1A16',
  /** Third elevation / pressed states. */
  'surface-3': '#28231D',
  /** Hairlines and dividers (decorative, not for meaning). */
  border: '#2E2822',
  /** Control borders (inputs, checkboxes) — ≥3:1 against bg/surface (WCAG 1.4.11). */
  'border-strong': '#7A6F63',
  /** Primary text — 17.6:1 on bg. */
  fg: '#F5F1EA',
  /** Secondary text — only on bg/surface/surface-2. */
  muted: '#A8A096',
  /** Primary brand / CTA background. */
  sunrise: '#F5A524',
  /** Hover state of sunrise, highlights. */
  'sunrise-strong': '#FFB84D',
  /** Deep amber for gradients (decorative only). */
  'sunrise-deep': '#C2410C',
  /** The lamp's light: brightest highlight. */
  daylight: '#FFF4D6',
  /** Text/icon colour on sunrise/daylight backgrounds. */
  'on-sunrise': '#0A0908',
  /** Errors, destructive actions. */
  danger: '#F87171',
  /** Success states. */
  success: '#4ADE80',
  /** Informational accents (cool daylight). */
  info: '#93C5FD',
  /** Focus ring — PLAN §6.4. */
  focus: '#FFD27A',
} as const;

export type ColorToken = keyof typeof colors;

/** "#F5A524" → "245 165 36" */
export function hexToRgbChannels(hex: string): string {
  const h = hex.replace('#', '');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** CSS custom property reference for a colour token, for inline SVG/canvas styles. */
export function cssVar(token: ColorToken, alpha?: number): string {
  return alpha === undefined
    ? `rgb(var(--color-${token}))`
    : `rgb(var(--color-${token}) / ${alpha})`;
}

/** Colour-temperature tints used by illustrations and the lux experience (decorative). */
export const kelvinTints: Record<number, string> = {
  4000: '#FFD9A0',
  5500: '#FFF1D6',
  6500: '#EEF4FF',
};

export function kelvinTint(kelvin: number): string {
  return kelvinTints[kelvin] ?? colors.daylight;
}

export const fontFamily = {
  display: [
    '"Space Grotesk Variable"',
    '"Space Grotesk"',
    'ui-sans-serif',
    'system-ui',
    'sans-serif',
  ],
  sans: ['"DM Sans Variable"', '"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
  mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
};

/**
 * Fluid type scale (mobile 375px → desktop 1440px). [size, lineHeight, letterSpacing].
 * Body never below 16px (iOS zoom + readability).
 */
export const fontSize: Record<string, [string, { lineHeight: string; letterSpacing?: string }]> = {
  xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
  sm: ['0.875rem', { lineHeight: '1.35rem' }],
  base: ['1rem', { lineHeight: '1.6' }],
  lg: ['clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)', { lineHeight: '1.6' }],
  xl: ['clamp(1.1875rem, 1.1rem + 0.4vw, 1.375rem)', { lineHeight: '1.5' }],
  '2xl': [
    'clamp(1.375rem, 1.2rem + 0.75vw, 1.75rem)',
    { lineHeight: '1.3', letterSpacing: '-0.01em' },
  ],
  '3xl': [
    'clamp(1.75rem, 1.45rem + 1.3vw, 2.5rem)',
    { lineHeight: '1.15', letterSpacing: '-0.015em' },
  ],
  '4xl': [
    'clamp(2.125rem, 1.6rem + 2.25vw, 3.5rem)',
    { lineHeight: '1.08', letterSpacing: '-0.02em' },
  ],
  '5xl': [
    'clamp(2.5rem, 1.75rem + 3.2vw, 4.5rem)',
    { lineHeight: '1.04', letterSpacing: '-0.025em' },
  ],
  display: ['clamp(2.75rem, 1.6rem + 4.9vw, 6rem)', { lineHeight: '1', letterSpacing: '-0.03em' }],
  hero: ['clamp(3rem, 1.5rem + 6.4vw, 7.5rem)', { lineHeight: '0.95', letterSpacing: '-0.035em' }],
};

/** Layout spacing on top of Tailwind's 4px scale. */
export const spacing = {
  gutter: 'clamp(1rem, 0.6rem + 1.8vw, 2.5rem)',
  section: 'clamp(4rem, 2.8rem + 5vw, 8rem)',
  'section-sm': 'clamp(2.5rem, 2rem + 2.5vw, 4.5rem)',
  header: '4rem',
  touch: '2.75rem', // 44px minimum touch target
};

export const radii = {
  none: '0',
  sm: '0.375rem',
  DEFAULT: '0.625rem',
  md: '0.625rem',
  lg: '1rem',
  xl: '1.5rem',
  '2xl': '2rem',
  full: '9999px',
};

/** Elevation + glow scale (glow used sparingly: CTAs, the lamp, focus of attention). */
export const shadows = {
  none: 'none',
  card: '0 1px 0 0 rgb(255 255 255 / 0.04) inset, 0 12px 32px -16px rgb(0 0 0 / 0.8)',
  raised: '0 1px 0 0 rgb(255 255 255 / 0.05) inset, 0 24px 48px -20px rgb(0 0 0 / 0.9)',
  overlay: '0 32px 80px -24px rgb(0 0 0 / 0.95)',
  'glow-sm': '0 0 16px -2px rgb(245 165 36 / 0.45)',
  glow: '0 0 32px -4px rgb(245 165 36 / 0.55), 0 0 64px -16px rgb(255 184 77 / 0.35)',
  'glow-lg': '0 0 80px -8px rgb(255 184 77 / 0.55), 0 0 160px -32px rgb(255 244 214 / 0.35)',
};

/** Layering scale — never use arbitrary z-index values. */
export const zIndex = {
  below: '-1',
  base: '0',
  raised: '10',
  spotlight: '15',
  sticky: '30',
  header: '40',
  overlay: '50',
  drawer: '60',
  modal: '70',
  toast: '80',
  skiplink: '90',
  grain: '95',
};

/** Breakpoints: mobile-first, verified at 375 / 768 / 1024 / 1440. */
export const screens = {
  xs: '375px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1440px',
};

/** Motion durations in ms (context-aware; exit ≈ 65% of enter). */
export const durations = {
  micro: 150,
  fast: 200,
  ui: 280,
  slow: 420,
  page: 600,
  cinematic: 900,
} as const;

/** Cubic-bezier easings. Enter = decelerate, exit = accelerate. */
export const easings = {
  out: [0.16, 1, 0.3, 1],
  in: [0.7, 0, 0.84, 0],
  inOut: [0.65, 0, 0.35, 1],
  sunrise: [0.22, 1, 0.36, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export const springs = {
  /** Magnetic buttons, cursor followers. */
  magnetic: { type: 'spring', stiffness: 180, damping: 15, mass: 0.2 },
  /** Drawers, sheets. */
  sheet: { type: 'spring', stiffness: 380, damping: 38, mass: 0.9 },
  /** Small UI pops (badges, toggles). */
  pop: { type: 'spring', stiffness: 520, damping: 30 },
} as const;

export const toCssEasing = (e: readonly number[]): string => `cubic-bezier(${e.join(', ')})`;
