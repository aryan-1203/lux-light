/**
 * Decides whether the WebGL hero may load. The 2D story is the baseline for everyone;
 * WebGL is an upgrade only for devices that can hold 60fps without draining a phone.
 * QA override: ?hero=2d or ?hero=3d.
 */

type NavigatorHints = Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
  deviceMemory?: number;
};

export function canUseWebGLHero(): boolean {
  if (typeof window === "undefined") return false;

  const override = new URLSearchParams(window.location.search).get("hero");
  if (override === "2d") return false;
  const forced = override === "3d";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  if (!hasWebGL2(!forced)) return false;
  if (forced) return true;

  const nav = navigator as NavigatorHints;
  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /(^|-)2g|3g/.test(nav.connection.effectiveType)) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory < 4) return false;

  // Phones and tablets get the designed 2D story: it's lighter on battery and the main thread.
  if (window.matchMedia("(pointer: coarse)").matches) return false;
  if ((nav.hardwareConcurrency ?? 4) < 4) return false;

  return true;
}

/** QA override that forces WebGL on and disables the frame-budget fallback. */
export function isWebGLForced(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("hero") === "3d";
}

function hasWebGL2(strict = true): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: strict });
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Runs `fn` when the main thread is idle (after hydration and first paint). */
export function whenIdle(fn: () => void, timeout = 2500): () => void {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(fn, { timeout });
    return () => window.cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(fn, 1200);
  return () => globalThis.clearTimeout(id);
}
