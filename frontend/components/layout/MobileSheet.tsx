"use client";

import Link from "next/link";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { ArrowUpRight } from "lucide-react";
import { navLinks, siteConfig } from "@/site.config";
import { duration, ease, exitOf, stagger } from "@/lib/motion";
import { lockScroll } from "@/lib/lenis";
import { whatsappHref } from "@/lib/format";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

const INERT_TARGETS = ["#main", "#site-footer", "#announcement", "#wa-fab"];

type Props = {
  open: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  isActive: (href: string) => boolean;
  /** Viewport y of the nav bar's bottom edge when the sheet opened. */
  top: number;
};

export function MobileSheet({ open, onClose, returnFocusRef, isActive, top }: Props) {
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const returnTo = returnFocusRef.current;
    lockScroll(true);
    const targets = INERT_TARGETS.flatMap((sel) => Array.from(document.querySelectorAll<HTMLElement>(sel)));
    targets.forEach((el) => el.setAttribute("inert", ""));
    panelRef.current?.querySelector<HTMLElement>("a")?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onResize = () => desktop.matches && onClose();
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onResize);

    return () => {
      lockScroll(false);
      targets.forEach((el) => el.removeAttribute("inert"));
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onResize);
      returnTo?.focus({ preventScroll: true });
    };
  }, [open, onClose, returnFocusRef]);

  const rise = reduce ? {} : { transform: "translateY(16px)" };
  const rest = reduce ? {} : { transform: "translateY(0px)" };

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="sheet"
          id="mobile-menu"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          style={{ top }}
          className="fixed inset-x-0 bottom-0 z-40 overflow-y-auto overscroll-contain bg-paper lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: duration.ui, ease: ease.out } }}
          exit={{ opacity: 0, transition: { duration: exitOf(duration.ui), ease: ease.out } }}
        >
          <div className="container-x flex min-h-full flex-col pt-4 pb-[max(24px,env(safe-area-inset-bottom))]">
            <nav aria-label="Mobile">
              <m.ul
                className="flex flex-col"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: stagger, delayChildren: 0.04 } } }}
              >
                {navLinks.map((link) => (
                  <m.li
                    key={link.href}
                    variants={{
                      hidden: { opacity: 0, ...rise },
                      visible: { opacity: 1, ...rest, transition: { duration: duration.sheet, ease: ease.out } },
                    }}
                    className="border-b border-hairline"
                  >
                    <Link
                      href={link.href}
                      onClick={onClose}
                      aria-current={isActive(link.href) ? "page" : undefined}
                      className={cn(
                        "flex min-h-16 items-center justify-between py-3 font-display text-[clamp(1.75rem,6vw,2.5rem)] leading-tight tracking-[-0.025em] transition-colors duration-[var(--dur-micro)]",
                        isActive(link.href) ? "text-ink" : "text-ink/80",
                      )}
                    >
                      {link.label}
                      {isActive(link.href) && <span aria-hidden className="size-2 rounded-full bg-sun-600" />}
                    </Link>
                  </m.li>
                ))}
              </m.ul>
            </nav>

            <m.div
              className="mt-8 grid gap-3 sm:grid-cols-2"
              initial={{ opacity: 0, ...rise }}
              animate={{
                opacity: 1,
                ...rest,
                transition: { duration: duration.sheet, ease: ease.out, delay: 0.04 + stagger * navLinks.length },
              }}
            >
              <Button href="/early-access" variant="accent" size="lg" onClick={onClose} className="w-full">
                Join early access
              </Button>
              <Button href={whatsappHref()} variant="secondary" size="lg" className="w-full">
                Chat on WhatsApp <ArrowUpRight aria-hidden className="size-4" strokeWidth={1.75} />
              </Button>
            </m.div>

            <p className="mt-auto pt-12 font-display text-heading text-ink-muted italic">{siteConfig.tagline}</p>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
