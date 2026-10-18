"use client";

import type Lenis from "lenis";
import { cancelFrame, frame } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { setLenis, getLenis } from "@/lib/lenis";

/**
 * Lenis smooth scrolling on fine-pointer devices only. Touch keeps native scrolling.
 * Lenis is driven from Motion's frame loop, so useScroll and Lenis share one RAF per frame.
 * Off under prefers-reduced-motion.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    let lenis: Lenis | null = null;
    let update: ((data: { timestamp: number }) => void) | null = null;

    let cancelled = false;
    // Lenis is fetched on demand (desktop pointers only), so it never weighs on first paint.
    const start = async () => {
      if (lenis || reduce.matches || !fine.matches) return;
      const { default: LenisCtor } = await import("lenis");
      if (cancelled || lenis) return;
      lenis = new LenisCtor({
        autoRaf: false,
        lerp: 0.12,
        smoothWheel: true,
        syncTouch: false,
        anchors: { offset: -80 },
        stopInertiaOnNavigate: true,
      });
      update = ({ timestamp }) => lenis?.raf(timestamp);
      frame.update(update, true);
      setLenis(lenis);
    };

    const stop = () => {
      if (update) cancelFrame(update);
      lenis?.destroy();
      lenis = null;
      update = null;
      setLenis(null);
    };

    const sync = () => (reduce.matches || !fine.matches ? stop() : void start());
    sync();
    reduce.addEventListener("change", sync);
    fine.addEventListener("change", sync);
    return () => {
      cancelled = true;
      reduce.removeEventListener("change", sync);
      fine.removeEventListener("change", sync);
      stop();
    };
  }, []);

  // New page → top, instantly (Next no longer overrides scroll-behavior on navigation).
  useEffect(() => {
    if (window.location.hash) return;
    getLenis()?.scrollTo(0, { immediate: true, force: true });
  }, [pathname]);

  return null;
}
