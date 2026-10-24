"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { joinHref, navLinks, siteConfig } from "@/site.config";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";
import { Logo } from "./Logo";

/** Logo, two anchors and the one action. Clear over the hero, frosted white once you scroll. */
export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-[env(safe-area-inset-top)]">
      <div
        className={cn(
          "border-b transition-[background-color,border-color] duration-[var(--dur-sheet)]",
          scrolled
            ? "border-line bg-[rgb(255_252_247/0.78)] backdrop-blur-[16px] backdrop-saturate-150 supports-[not(backdrop-filter:blur(1px))]:bg-bg"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="container-x flex h-[var(--nav-h)] items-center justify-between gap-4">
          <Link
            href="/"
            onClick={(e) => {
              if (pathname !== "/") return;
              e.preventDefault();
              const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
              window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
            }}
            className="-m-2 flex items-center rounded-md p-2"
            aria-label={`${siteConfig.brandName}, back to top`}
          >
            <Logo />
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            <nav aria-label="Sections" className="hidden sm:block">
              <ul className="flex items-center">
                {navLinks.map((l) => (
                  <li key={l.id}>
                    <Link
                      href={l.href}
                      className="flex h-11 items-center rounded-pill px-4 text-[0.9375rem] text-fg-muted transition-colors duration-[var(--dur-micro)] hover-fine:text-fg"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <Button href={joinHref} size="md" className="h-10 px-4 text-[0.9375rem] sm:h-11 sm:px-5">
              Join the waitlist
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
