import type { CSSProperties } from "react";

/**
 * Every scene plays the same five beats (see "Scenes" in globals.css):
 *   0 before (tired) · 1 reach for the lamp · 2 light on, a slow breath · 3 the scene's own action · 4 after
 * A part of a figure lists its value for each beat; the CSS keyframes read them back as custom
 * properties. Angles are in degrees (clockwise), y offsets in SVG units. The static style is beat 4,
 * so without JS or with reduced motion the scene simply shows its final frame.
 */
type Beats = [number, number, number, number, number];

export function pose({ r, y, o, at }: { r?: Beats; y?: Beats; o?: Beats; at?: string }): {
  className: string;
  style: CSSProperties;
} {
  const R = r ?? [0, 0, 0, 0, 0];
  const Y = y ?? [0, 0, 0, 0, 0];
  const O = o ?? [1, 1, 1, 1, 1];
  const style: Record<string, string | number> = {
    rotate: `${R[4]}deg`,
    translate: `0 ${Y[4]}px`,
    opacity: O[4],
  };
  if (at) style.transformOrigin = at;
  for (let i = 0; i < 5; i++) {
    style[`--r${i}`] = `${R[i]}deg`;
    style[`--y${i}`] = `${Y[i]}px`;
    style[`--o${i}`] = O[i];
  }
  return { className: "k", style: style as CSSProperties };
}

/** Shorthand for a part that only fades between beats (eyes, mouths, a cup). */
export const show = (...o: Beats) => pose({ o });
