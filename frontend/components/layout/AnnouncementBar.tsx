"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { siteConfig } from "@/site.config";
import { fillOfferTokens } from "@/lib/format";
import { InlineScript } from "@/components/ui/InlineScript";

const KEY = "announcement-dismissed";

/**
 * Dismissible offer bar. Dismissal is remembered per offer id; an inline script hides it
 * before first paint on hard loads, so returning visitors never see it flash.
 */
export function AnnouncementBar() {
  const id = siteConfig.offer.id;

  const dismiss = () => {
    document.documentElement.dataset.announcement = "off";
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* storage blocked: dismissal lasts for this page view only */
    }
  };

  return (
    <>
      <InlineScript
        html={`try{if(localStorage.getItem(${JSON.stringify(KEY)})===${JSON.stringify(id)})document.documentElement.dataset.announcement="off"}catch(e){}`}
      />
      <div id="announcement" className="relative z-[51] bg-ink text-paper [html[data-announcement=off]_&]:hidden">
        <div className="container-x flex min-h-10 items-center justify-center gap-3 py-2 pr-12 text-center text-[0.875rem] leading-snug sm:pr-14">
          <p>
            <span className="text-paper/85">{fillOfferTokens(siteConfig.offer.announcement)}</span>{" "}
            <Link
              href="/early-access"
              className="font-medium whitespace-nowrap text-sun-400 underline decoration-sun-400/40 underline-offset-4 transition-[text-decoration-color] duration-[var(--dur-micro)] hover-fine:decoration-sun-400"
            >
              Join early access
            </Link>
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss announcement"
            className="absolute top-1/2 right-[max(4px,calc(var(--gutter)-12px))] grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-pill text-paper/70 transition-[color,transform,translate,scale] duration-[var(--dur-press)] ease-out active:scale-[0.97] hover-fine:text-paper"
          >
            <X aria-hidden className="size-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </>
  );
}
