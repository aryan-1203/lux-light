import type Lenis from "lenis";

let instance: Lenis | null = null;

export function setLenis(lenis: Lenis | null) {
  instance = lenis;
}

export function getLenis(): Lenis | null {
  return instance;
}

/** Smooth-scroll to a target via Lenis when active, otherwise native. */
export function scrollToTarget(target: string | HTMLElement, offset = -80) {
  const lenis = instance;
  if (lenis) {
    lenis.scrollTo(target, { offset });
    return;
  }
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}

/** Pause/resume page scrolling (menu sheet). Falls back to overflow lock. */
export function lockScroll(locked: boolean) {
  if (instance) {
    if (locked) instance.stop();
    else instance.start();
  }
  document.documentElement.style.overflow = locked ? "hidden" : "";
}
