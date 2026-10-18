"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { navLinks, siteConfig } from "@/site.config";
import { cn } from "@/lib/cn";
import { setUI, useUI } from "@/lib/ui-store";
import { Button } from "@/components/ui/Button";
import { Logo } from "./Logo";
import { MobileSheet } from "./MobileSheet";

export function Nav() {
  const pathname = usePathname();
  const menuOpen = useUI((s) => s.menuOpen);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [sheetTop, setSheetTop] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const { scrollY } = useScroll();

  // Hide on scroll down, reveal on scroll up. Never while the menu is open or focus is inside.
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    const delta = y - prev;
    setScrolled(y > 8);
    if (menuOpen || headerRef.current?.contains(document.activeElement)) return setHidden(false);
    if (y < 120) return setHidden(false);
    if (delta > 6) setHidden(true);
    else if (delta < -6) setHidden(false);
  });

  // Close the menu on navigation.
  useEffect(() => {
    setUI({ menuOpen: false });
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      ref={headerRef}
      data-hidden={hidden && !menuOpen ? "" : undefined}
      onFocusCapture={() => setHidden(false)}
      className={cn(
        "sticky top-0 z-50 pt-[env(safe-area-inset-top)]",
        "transition-transform duration-[280ms] ease-out data-[hidden]:-translate-y-full data-[hidden]:duration-200",
      )}
    >
      <div
        className={cn(
          "relative z-50 border-b transition-[border-color,background-color] duration-[var(--dur-ui)]",
          "bg-paper/72 backdrop-blur-[16px] backdrop-saturate-[1.4] supports-[not(backdrop-filter:blur(1px))]:bg-paper",
          scrolled || menuOpen ? "border-hairline" : "border-transparent",
          menuOpen && "bg-paper",
        )}
      >
        <div className="container-x flex h-[var(--nav-h)] items-center justify-between gap-4">
          <Link
            href="/"
            className="-m-2 flex items-center rounded-md p-2"
            aria-label={`${siteConfig.brandName}, home`}
            aria-current={pathname === "/" ? "page" : undefined}
          >
            <Logo />
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-11 items-center rounded-pill px-3.5 text-[0.9375rem] font-medium transition-colors duration-[var(--dur-micro)] ease-[ease]",
                        active ? "text-ink" : "text-ink-muted hover-fine:text-ink",
                      )}
                    >
                      {link.label}
                      <span
                        aria-hidden
                        className={cn(
                          "absolute bottom-1.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-sun-600 transition-[opacity,scale] duration-[var(--dur-ui)] ease-out",
                          active ? "scale-100 opacity-100" : "scale-50 opacity-0",
                        )}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button href="/early-access" size="md" className="px-4 sm:px-5">
              Early access
            </Button>
            <MenuButton
              ref={toggleRef}
              open={menuOpen}
              onToggle={() => {
                // The sheet starts exactly under the bar, wherever it currently sits (announcement bar above or not).
                setSheetTop(headerRef.current?.getBoundingClientRect().bottom ?? 0);
                setUI({ menuOpen: !menuOpen });
              }}
            />
          </div>
        </div>
      </div>

      <MobileSheet
        open={menuOpen}
        onClose={() => setUI({ menuOpen: false })}
        returnFocusRef={toggleRef}
        isActive={isActive}
        top={sheetTop}
      />
    </header>
  );
}

function MenuButton({
  open,
  onToggle,
  ref,
}: {
  open: boolean;
  onToggle: () => void;
  ref: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="mobile-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      className="relative -mr-2 grid size-11 cursor-pointer place-items-center rounded-pill transition-[transform,translate,scale,rotate,background-color] duration-[var(--dur-press)] ease-out active:scale-[0.97] lg:hidden hover-fine:bg-ink/[0.05]"
    >
      <span aria-hidden className="relative block h-3 w-5">
        <span
          className={cn(
            "absolute left-0 h-[1.5px] w-5 rounded-full bg-ink transition-transform duration-[var(--dur-ui)] ease-out",
            "top-[1px]",
            open && "translate-y-[4.5px] rotate-45",
          )}
        />
        <span
          className={cn(
            "absolute left-0 h-[1.5px] w-5 rounded-full bg-ink transition-transform duration-[var(--dur-ui)] ease-out",
            "top-[10px]",
            open && "-translate-y-[4.5px] -rotate-45",
          )}
        />
      </span>
    </button>
  );
}
