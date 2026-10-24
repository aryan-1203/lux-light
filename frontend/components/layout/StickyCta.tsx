"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { joinHref, siteConfig } from "@/site.config";
import { useUI } from "@/lib/ui-store";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Phones and tablets: once the hero has gone, the one action stays a thumb away. It steps aside
 * while the form itself is on screen.
 */
export function StickyCta() {
  const pastHero = useUI((s) => s.pastHero);
  const joinVisible = useUI((s) => s.joinVisible);
  const show = pastHero && !joinVisible;

  return (
    <div
      id="sticky-cta"
      aria-hidden={!show}
      inert={!show}
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden",
        "transition-[translate,opacity] duration-[var(--dur-sheet)] ease-out",
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-[120%] opacity-0",
      )}
    >
      <Link
        href={joinHref}
        className="mx-auto flex h-16 max-w-[560px] items-center gap-3 rounded-[20px] border border-line bg-[rgb(255_255_255/0.88)] py-2 pr-2 pl-4 shadow-lift backdrop-blur-[16px] active:scale-[0.99]"
      >
        <span aria-hidden className="size-3 shrink-0 rounded-full bg-sun shadow-[0_0_0_4px_rgb(255_185_56/0.25)]" />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[0.9375rem] font-medium">Founding batch</span>
          <span className="block truncate text-[0.8125rem] text-fg-muted">
            First {formatNumber(siteConfig.launchBatchSize)} lamps · free to join
          </span>
        </span>
        <span className="inline-flex h-12 items-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#ffc24d,#ff9a5a)] px-4 text-[0.9375rem] font-medium text-fg">
          Join <ArrowRight aria-hidden className="size-4" />
        </span>
      </Link>
    </div>
  );
}
