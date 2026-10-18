/**
 * "The horizon was a lamp": one normalised scroll progress (0 → 1) mapped to every value
 * the hero needs. Pure functions, shared by the 2D fallback (via useTransform) and the
 * WebGL scene (read inside useFrame), so both versions tell exactly the same story.
 * Scene map: DESIGN.md §7.2.
 */

export const SCENES = [
  { id: "predawn", start: 0, end: 0.2 },
  { id: "sunrise", start: 0.2, end: 0.45 },
  { id: "reveal", start: 0.45, end: 0.65 },
  { id: "ignition", start: 0.65, end: 0.85 },
  { id: "settle", start: 0.85, end: 1 },
] as const;

export type SceneId = (typeof SCENES)[number]["id"];

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** 0 before a, 1 after b, linear in between. */
export const range = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));

export const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** Smooth in-out for things moving on screen (scroll is already the clock). */
export const smooth = (t: number) => t * t * (3 - 2 * t);

/** Strong ease-out, matching cubic-bezier(0.23, 1, 0.32, 1) closely enough for scrubbed values. */
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Fade window: in over [a, a+f], hold, out over [b-f, b]. Edges at 0 and 1 stay open. */
export function windowed(p: number, a: number, b: number, f = 0.04) {
  const fadeIn = a <= 0 ? 1 : range(p, a, a + f);
  const fadeOut = b >= 1 ? 1 : 1 - range(p, b - f, b);
  return Math.min(fadeIn, fadeOut);
}

export function sceneAt(p: number): SceneId {
  for (const s of SCENES) if (p < s.end) return s.id;
  return "settle";
}

/* ---------------- Sky ---------------- */
export const skyDawn = (p: number) => smooth(range(p, 0.16, 0.33));
export const skySunrise = (p: number) => smooth(range(p, 0.28, 0.45));
export const skyPaper = (p: number) => smooth(range(p, 0.8, 0.94));

/* ---------------- Horizon line → lamp edge ---------------- */
/** 1 = full-width horizon, 0 = contracted to the lamp's width. */
export const horizonSpan = (p: number) => 1 - smooth(range(p, 0.45, 0.53));
/** Line thickens into the lamp's edge as it contracts. */
export const horizonThickness = (p: number) => lerp(1, 4, smooth(range(p, 0.47, 0.53)));
/** The edge hands over to the opening panel. */
export const horizonOpacity = (p: number) => 1 - range(p, 0.52, 0.565);
/** Glow intensity of the line itself (brightens as the sun rises). */
export const horizonGlow = (p: number) => lerp(0.8, 1, range(p, 0.15, 0.35));

/* ---------------- Sun ---------------- */
/** Vertical offset in units of the sun's own diameter (+ = down). Rests on the horizon, rises, then sinks into the panel. */
export function sunOffset(p: number) {
  const rise = easeOut(range(p, 0.2, 0.43));
  const sink = smooth(range(p, 0.53, 0.63));
  const risen = lerp(0.62, -1.55, rise);
  return lerp(risen, 0.5, sink);
}
export const sunOpacity = (p: number) => {
  const appear = range(p, 0.19, 0.24);
  const merge = 1 - range(p, 0.58, 0.64);
  return Math.min(appear, merge);
};
export const sunScale = (p: number) => lerp(1, 0.72, smooth(range(p, 0.55, 0.64)));
/** The horizon only clips the sun until it has fully risen; after that it may descend into the panel. */
export const sunClipped = (p: number) => p < 0.47;

/* ---------------- Lamp ---------------- */
/** Panel rotation about X in degrees: 90 = edge-on (reads as the horizon), 0 = facing you. */
export const lampOpen = (p: number) => lerp(90, 0, smooth(range(p, 0.51, 0.63)));
export const lampVisible = (p: number) => range(p, 0.5, 0.53);
/** Emissive level of the diffuser, 0 → 1. */
export function panelGlow(p: number) {
  const warm = lerp(0, 0.38, range(p, 0.57, 0.64));
  const ignite = smooth(range(p, 0.66, 0.8));
  return lerp(warm, 1, ignite);
}
/** Kickstand only reads correctly once the panel faces you; keep it out of the opening. */
export const standVisible = (p: number) => range(p, 0.62, 0.66);
/** Halo around the lit panel (the 2D stand-in for bloom). */
export const panelHalo = (p: number) => smooth(range(p, 0.68, 0.82));

/** Settle progress 0 → 1: the lamp turns to a 3/4 view and steps aside (distance is layout-specific). */
export const settle = (p: number) => smooth(range(p, 0.85, 0.95));
export const lampTurn = (p: number) => lerp(0, -32, settle(p));
export const lampSettleScale = (p: number) => lerp(1, 0.86, settle(p));

/* ---------------- Light spill ---------------- */
export const spillOpacity = (p: number) => smooth(range(p, 0.68, 0.84)) * (1 - 0.35 * range(p, 0.88, 0.98));
export const spillScale = (p: number) => lerp(0.9, 1, easeOut(range(p, 0.68, 0.84)));

/* ---------------- Desk (settle) ---------------- */
export const deskReveal = (p: number) => easeOut(range(p, 0.87, 0.95));
export const arcDraw = (p: number) => easeOut(range(p, 0.9, 0.97));

/* ---------------- Lux counter ---------------- */
/** Target lux for a progress. A spring follows this target; the 9,000 → 10,000 step at 0.78 lands with overshoot. */
export function luxTarget(p: number) {
  if (p < 0.2) return 300;
  if (p < 0.45) return Math.round(lerp(300, 5000, range(p, 0.2, 0.45)));
  if (p < 0.68) return 5000;
  if (p < 0.78) return Math.round(lerp(5000, 9000, range(p, 0.68, 0.78)));
  return 10000;
}

/* ---------------- Copy ---------------- */
export const copyWindows: Record<SceneId, [number, number]> = {
  predawn: [0, 0.2],
  sunrise: [0.21, 0.45],
  reveal: [0.47, 0.66],
  ignition: [0.67, 0.86],
  settle: [0.87, 1],
};

export const chipsReveal = (p: number, i: number) => easeOut(range(p, 0.73 + i * 0.025, 0.79 + i * 0.025));
