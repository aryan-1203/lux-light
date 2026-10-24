"use client";

import { useEffect } from "react";

/**
 * Reveals every [data-reveal] element once it enters the viewport, including ones added later.
 * The first scan waits two frames so React has finished hydrating every section before we add
 * `data-revealed`; adding it earlier makes the server and client markup disagree.
 */
export function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.setAttribute("data-revealed", "");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    const scan = (root: ParentNode) =>
      root.querySelectorAll("[data-reveal]:not([data-revealed])").forEach((el) => io.observe(el));
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n instanceof Element && scan(n.parentNode ?? n));
    });
    let raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        scan(document);
        mo.observe(document.body, { childList: true, subtree: true });
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  return null;
}
