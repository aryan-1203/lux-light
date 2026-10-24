"use client";

import { useEffect } from "react";
import { setUI } from "@/lib/ui-store";

/** Tracks whether the hero has scrolled away and whether the form is on screen (mobile CTA bar). */
export function ScrollSpy() {
  useEffect(() => {
    const hero = document.getElementById("top");
    const join = document.getElementById("join");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setUI({ pastHero: !e.isIntersecting });
        if (e.target === join) setUI({ joinVisible: e.isIntersecting });
      }
    }, { rootMargin: "0px 0px -15% 0px" });
    if (hero) io.observe(hero);
    if (join) io.observe(join);
    return () => io.disconnect();
  }, []);
  return null;
}
